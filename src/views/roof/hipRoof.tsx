/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */
import { Line, Plane, Sphere } from '@react-three/drei';
import { ThreeEvent, useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HALF_PI, UNIT_VECTOR_POS_Z } from 'src/constants';
import { ElementModel } from 'src/models/ElementModel';
import { ElementModelFactory } from 'src/models/ElementModelFactory';
import { FoundationModel } from 'src/models/FoundationModel';
import { Point2 } from 'src/models/Point2';
import { HipRoofModel } from 'src/models/RoofModel';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import * as Selector from 'src/stores/selector';
import { RoofTexture, Orientation } from 'src/types';
import { UndoableAdd } from 'src/undo/UndoableAdd';
import { UndoableMoveSolarPanelOnRoof } from 'src/undo/UndoableMove';
import { UndoableResizeHipRoofRidge } from 'src/undo/UndoableResize';
import { Util } from 'src/Util';
import { DoubleSide, Euler, Mesh, Raycaster, Vector2, Vector3 } from 'three';
import { ObjectType } from '../../types';
import {
  handleUndoableResizeRoofHeight,
  ConvexGeoProps,
  useRoofTexture,
  handleRoofContextMenu,
  getNormal,
  getIntersectionPoint,
  getDistance,
  handleRoofPointerDown,
  RoofWireframeProps,
  spBoundaryCheckWithErrMsg,
  spCollisionCheckWithErrMsg,
} from './roofRenderer';

enum RoofHandleType {
  Mid = 'Mid',
  Left = 'Left',
  Right = 'Right',
  Null = 'Null',
}

const HipRoofWireframe = React.memo(({ roofSegments, thickness, lineWidth, lineColor }: RoofWireframeProps) => {
  if (roofSegments.length === 0) {
    return null;
  }
  const peripheryPoints: Vector3[] = [];
  const thicknessVector = new Vector3(0, 0, thickness);

  for (let i = 0; i < roofSegments.length; i++) {
    const [leftPoint, rightPoint] = roofSegments[i].points;
    peripheryPoints.push(leftPoint);
    if (i === roofSegments.length - 1) {
      peripheryPoints.push(rightPoint);
    }
  }

  const isFlat = Math.abs(roofSegments[0].points[0].z) < 0.015;
  const leftRidge = roofSegments[0].points[3].clone().add(thicknessVector);
  const rightRidge = roofSegments[0].points[2].clone().add(thicknessVector);

  const periphery = <Line points={peripheryPoints} lineWidth={lineWidth} color={lineColor} />;

  return (
    <>
      {periphery}
      {!isFlat && <Line points={[leftRidge, rightRidge]} lineWidth={lineWidth} color={lineColor} />}
      <group position={[0, 0, thickness]}>
        {periphery}
        {roofSegments.map((segment, idx) => {
          const [leftRoof, rightRoof, rightRidge, leftRidge] = segment.points;
          const isFlat = Math.abs(leftRoof.z) < 0.015;
          const points = [leftRoof.clone().sub(thicknessVector), leftRoof];
          if (!isFlat) {
            points.push(leftRidge);
          }
          return <Line key={idx} points={points} lineWidth={lineWidth} color={lineColor} />;
        })}
      </group>
    </>
  );
});

const intersectionPlanePosition = new Vector3();
const intersectionPlaneRotation = new Euler();
const zVector3 = new Vector3(0, 0, 1);

const HipRoof = ({
  id,
  parentId,
  cx,
  cy,
  cz,
  lz,
  wallsId,
  leftRidgeLength,
  rightRidgeLength,
  selected,
  textureType,
  color,
  overhang,
  thickness,
  locked,
  lineColor = 'black',
  lineWidth = 0.2,
}: HipRoofModel) => {
  color = '#fb9e00';
  const texture = useRoofTexture(textureType);

  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);
  const removeElementById = useStore(Selector.removeElementById);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const elements = useStore(Selector.elements);
  const updateSolarPanelOnRoofFlag = useStore(Selector.updateSolarPanelOnRoofFlag);

  // set position and rotation
  const foundation = getElementById(parentId);
  let rotation = 0;
  if (foundation) {
    cx = foundation.cx;
    cy = foundation.cy;
    cz = foundation.lz;
    rotation = foundation.rotation[2];
  }

  const [leftRidgeLengthCurr, setLeftRidgeLengthCurr] = useState(leftRidgeLength);
  const [rightRidgeLengthCurr, setRightRidgeLengthCurr] = useState(rightRidgeLength);
  const [h, setH] = useState(lz);
  const [minHeight, setMinHeight] = useState(lz);
  const [enableIntersectionPlane, setEnableIntersectionPlane] = useState(false);
  const [roofHandleType, setRoofHandleType] = useState<RoofHandleType>(RoofHandleType.Null);

  const intersectionPlaneRef = useRef<Mesh>(null);
  const { gl, camera } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);
  const oldHeight = useRef<number>(h);
  const isPointerMovingRef = useRef(false);
  const grabRef = useRef<ElementModel | null>(null);

  useEffect(() => {
    updateSolarPanelOnRoof();
  }, [updateSolarPanelOnRoofFlag]);

  useEffect(() => {
    if (h < minHeight) {
      setH(minHeight * 1.5);
    }
  }, [minHeight]);

  useEffect(() => {
    setH(lz);
  }, [lz]);

  useEffect(() => {
    setLeftRidgeLengthCurr(leftRidgeLength);
  }, [leftRidgeLength]);

  useEffect(() => {
    setRightRidgeLengthCurr(rightRidgeLength);
  }, [rightRidgeLength]);

  const setHipRoofRidgeLength = (elemId: string, leftRidge: number, rightRidge: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === elemId) {
          (e as HipRoofModel).leftRidgeLength = leftRidge;
          (e as HipRoofModel).rightRidgeLength = rightRidge;
          state.updateSolarPanelOnRoofFlag *= -1;
          break;
        }
      }
    });
  };

  const handleUndoableResizeRidgeLength = (
    elemId: string,
    oldLeft: number,
    oldRight: number,
    newLeft: number,
    newRight: number,
  ) => {
    const undoable = {
      name: 'Resize Hip Roof Ridge',
      timestamp: Date.now(),
      resizedElementId: elemId,
      resizedElementType: ObjectType.Roof,
      oldLeftRidgeLength: oldLeft,
      oldRightRidgeLength: oldRight,
      newLeftRidgeLength: newLeft,
      newRightRidgeLength: newRight,
      undo: () => {
        setHipRoofRidgeLength(undoable.resizedElementId, undoable.oldLeftRidgeLength, undoable.oldRightRidgeLength);
      },
      redo: () => {
        setHipRoofRidgeLength(undoable.resizedElementId, undoable.newLeftRidgeLength, undoable.newRightRidgeLength);
      },
    } as UndoableResizeHipRoofRidge;
    useStore.getState().addUndoable(undoable);
  };

  const currentWallArray = useMemo(() => {
    const array: WallModel[] = [];
    if (wallsId.length > 0) {
      const wall = getElementById(wallsId[0]) as WallModel;
      array.push(wall);
      if (wall) {
        const leftWall = getElementById(wall.leftJoints[0]) as WallModel;
        const rightWall = getElementById(wall.rightJoints[0]) as WallModel;
        if (leftWall && rightWall) {
          const midWall = getElementById(leftWall.leftJoints[0]) as WallModel;
          const checkWall = getElementById(rightWall.rightJoints[0]) as WallModel;
          if (midWall && checkWall && midWall.id === checkWall.id) {
            array.push(rightWall, midWall, leftWall);
          }
        }
      }
    }
    return array;
  }, [elements]);

  const getWallPoint = (wallArray: WallModel[]) => {
    const arr: Point2[] = [];
    for (const w of wallArray) {
      if (w.leftPoint[0] && w.leftPoint[1]) {
        arr.push({ x: w.leftPoint[0], y: w.leftPoint[1] });
      }
    }
    return arr;
  };

  const centroid2D = useMemo(() => {
    if (currentWallArray.length !== 4) {
      return new Vector2();
    }
    const points = getWallPoint(currentWallArray);
    const p = Util.calculatePolygonCentroid(points);
    return new Vector2(p.x, p.y);
  }, [currentWallArray]);

  const ridgeLeftPoint = useMemo(() => {
    const vector = new Vector3();
    const center = new Vector3(centroid2D.x, centroid2D.y, h);
    const wall = getElementById(wallsId[0]) as WallModel;
    if (wall) {
      vector.setX(-leftRidgeLengthCurr).applyEuler(new Euler(0, 0, wall.relativeAngle)).add(center);
    }
    return vector;
  }, [centroid2D, h, leftRidgeLengthCurr]);

  const ridgeRightPoint = useMemo(() => {
    const vector = new Vector3();
    const center = new Vector3(centroid2D.x, centroid2D.y, h);
    const wall = getElementById(wallsId[0]) as WallModel;
    if (wall) {
      vector.setX(rightRidgeLengthCurr).applyEuler(new Euler(0, 0, wall.relativeAngle)).add(center);
    }
    return vector;
  }, [centroid2D, h, rightRidgeLengthCurr]);

  const ridgeMidPoint = useMemo(() => {
    return new Vector3(centroid2D.x, centroid2D.y, h);
  }, [centroid2D, h]);

  const makeSement = (vector: Vector3[], p1: Vector3, p2: Vector3, p3: Vector3, p4: Vector3) => {
    vector.push(p1, p2, p3, p4);
    vector.push(
      p1.clone().add(thicknessVector),
      p2.clone().add(thicknessVector),
      p3.clone().add(thicknessVector),
      p4.clone().add(thicknessVector),
    );
  };

  const getWallHeight = (arr: WallModel[], i: number) => {
    const w = arr[i];
    let lh = 0;
    let rh = 0;
    if (i === 0) {
      lh = Math.max(w.lz, arr[arr.length - 1].lz);
      rh = Math.max(w.lz, arr[i + 1].lz);
    } else if (i === arr.length - 1) {
      lh = Math.max(w.lz, arr[i - 1].lz);
      rh = Math.max(w.lz, arr[0].lz);
    } else {
      lh = Math.max(w.lz, arr[i - 1].lz);
      rh = Math.max(w.lz, arr[i + 1].lz);
    }
    return { lh, rh };
  };

  const getOverhangHeight = () => {
    const [frontWall, rightWall, backWall, leftWall] = currentWallArray;
    const wallPoint0 = new Vector3(frontWall.leftPoint[0], frontWall.leftPoint[1]);
    const wallPoint1 = new Vector3(frontWall.rightPoint[0], frontWall.rightPoint[1]);
    const wallPoint2 = new Vector3(backWall.leftPoint[0], backWall.leftPoint[1]);
    const wallPoint3 = new Vector3(backWall.rightPoint[0], backWall.rightPoint[1]);

    const wallPoints = [wallPoint0, wallPoint1, wallPoint2, wallPoint3];
    const ridges = [ridgeLeftPoint, ridgeRightPoint, ridgeRightPoint, ridgeLeftPoint];

    let height = Infinity;

    for (let i = 0; i < 4; i++) {
      const { lh, rh } = getWallHeight(currentWallArray, i);
      const dLeft = getDistance(wallPoints[i], wallPoints[(i + 1) % 4], ridges[i]);
      const overhangHeightLeft = Math.min((overhang / dLeft) * (ridges[i].z - lh), lh);
      const dRight = getDistance(wallPoints[i], wallPoints[(i + 1) % 4], ridges[(i + 1) % 4]);
      const overhangHeightRight = Math.min((overhang / dRight) * (ridges[(i + 1) % 4].z - rh), rh);
      height = Math.min(Math.min(overhangHeightLeft, overhangHeightRight), height);
    }

    return Number.isNaN(height) ? 0 : height;
  };

  const overhangs = useMemo(() => {
    return currentWallArray.map((wall) => getNormal(wall).multiplyScalar(overhang));
  }, [currentWallArray, overhang]);

  const thicknessVector = useMemo(() => {
    return zVector3.clone().multiplyScalar(thickness);
  }, [thickness]);

  const wallPointsAfterOffset = useMemo(() => {
    return currentWallArray.map((wall, idx) => {
      return {
        leftPoint: new Vector3(wall.leftPoint[0], wall.leftPoint[1]).add(overhangs[idx]),
        rightPoint: new Vector3(wall.rightPoint[0], wall.rightPoint[1]).add(overhangs[idx]),
      };
    });
  }, [overhangs]);

  const roofSegments = useMemo(() => {
    const segments: ConvexGeoProps[] = [];
    let minHeight = 0;
    if (currentWallArray.length !== 4) {
      return segments;
    }

    const overhangHeight = getOverhangHeight();

    for (let i = 0; i < 4; i++) {
      const points: Vector3[] = [];
      const wall = currentWallArray[i];
      const { lh, rh } = getWallHeight(currentWallArray, i);
      minHeight = Math.max(minHeight, Math.max(lh, rh));

      const wallLeftPointAfterOverhang = getIntersectionPoint(
        wallPointsAfterOffset[i].leftPoint,
        wallPointsAfterOffset[i].rightPoint,
        wallPointsAfterOffset[(i + 3) % 4].leftPoint,
        wallPointsAfterOffset[(i + 3) % 4].rightPoint,
      )
        .setZ(lh - overhangHeight)
        .sub(ridgeMidPoint);

      const wallRightPointAfterOverhang = getIntersectionPoint(
        wallPointsAfterOffset[i].leftPoint,
        wallPointsAfterOffset[i].rightPoint,
        wallPointsAfterOffset[(i + 1) % 4].leftPoint,
        wallPointsAfterOffset[(i + 1) % 4].rightPoint,
      )
        .setZ(rh - overhangHeight)
        .sub(ridgeMidPoint);

      const ridgeLeft = ridgeLeftPoint.clone().sub(ridgeMidPoint);
      const ridgeRight = ridgeRightPoint.clone().sub(ridgeMidPoint);
      let length = 0;
      switch (i) {
        case 0:
          length = new Vector3(wall.cx, wall.cy).sub(ridgeMidPoint.clone().setZ(0)).length();
          makeSement(points, wallLeftPointAfterOverhang, wallRightPointAfterOverhang, ridgeRight, ridgeLeft);
          break;
        case 1:
          length = new Vector3(wall.cx, wall.cy).sub(ridgeRightPoint.clone().setZ(0)).length();
          makeSement(points, wallLeftPointAfterOverhang, wallRightPointAfterOverhang, ridgeRight, ridgeRight);
          break;
        case 2:
          length = new Vector3(wall.cx, wall.cy).sub(ridgeMidPoint.clone().setZ(0)).length();
          makeSement(points, wallLeftPointAfterOverhang, wallRightPointAfterOverhang, ridgeLeft, ridgeRight);
          break;
        case 3:
          length = new Vector3(wall.cx, wall.cy).sub(ridgeLeftPoint.clone().setZ(0)).length();
          makeSement(points, wallLeftPointAfterOverhang, wallRightPointAfterOverhang, ridgeLeft, ridgeLeft);
          break;
      }
      const direction = -wall.relativeAngle;
      segments.push({ points, direction, length });
    }
    setMinHeight(minHeight);
    return segments;
  }, [currentWallArray, ridgeLeftPoint, ridgeRightPoint, h]);

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  useEffect(() => {
    if (currentWallArray.length === 4) {
      for (let i = 0; i < currentWallArray.length; i++) {
        const { lh, rh } = getWallHeight(currentWallArray, i);
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.id === currentWallArray[i].id) {
              (e as WallModel).roofId = id;
              (e as WallModel).leftRoofHeight = lh;
              (e as WallModel).rightRoofHeight = rh;
              break;
            }
          }
        });
      }
    } else {
      removeElementById(id, false);
    }
  }, [currentWallArray]);

  const getPlaneVertices = (segmentIdx: number, pointer: Vector3) => {
    // return orders matter: couter clockwise
    const [wallLeft, wallRight, ridgeRight, ridgeLeft] = roofSegments[segmentIdx].points;
    const leftDis = Util.distanceFromPointToLine2D(ridgeLeft, wallLeft, wallRight);
    const rightDis = Util.distanceFromPointToLine2D(ridgeRight, wallLeft, wallRight);
    const p = pointer.clone().sub(ridgeMidPoint);
    if (Math.abs(leftDis - rightDis) < 0.01) {
      if (wallLeft.z > wallRight.z) {
        const upperHalf = [ridgeLeft, ridgeRight, wallLeft];
        if (Util.isPointInside(p.x, p.y, upperHalf.map(Util.mapVector3ToPoint2))) {
          return [wallLeft, ridgeRight, ridgeLeft];
        } else {
          return [wallLeft, wallRight, ridgeRight];
        }
      } else {
        const upperHalf = [ridgeLeft, ridgeRight, wallRight];
        if (Util.isPointInside(p.x, p.y, upperHalf.map(Util.mapVector3ToPoint2))) {
          return [wallRight, ridgeRight, ridgeLeft];
        } else {
          return [wallRight, ridgeLeft, wallLeft];
        }
      }
    } else if (leftDis <= rightDis) {
      const upperHalf = [ridgeLeft, ridgeRight, wallRight];
      if (Util.isPointInside(p.x, p.y, upperHalf.map(Util.mapVector3ToPoint2))) {
        return [wallRight, ridgeRight, ridgeLeft];
      } else {
        return [wallRight, ridgeLeft, wallLeft];
      }
    } else {
      const upperHalf = [ridgeLeft, ridgeRight, wallLeft];
      if (Util.isPointInside(p.x, p.y, upperHalf.map(Util.mapVector3ToPoint2))) {
        return [wallLeft, ridgeRight, ridgeLeft];
      } else {
        return [wallLeft, wallRight, ridgeRight];
      }
    }
  };

  const getNormalBasedOnVertices = (vertices: Vector3[]) => {
    const [v1, v2, v3] = vertices;
    // order matters for cross product, counter clockwise, v1 is shared vertice
    return new Vector3().crossVectors(new Vector3().subVectors(v1, v2), new Vector3().subVectors(v1, v3)).normalize();
  };

  const getNormalOnRoof = (segmentIdx: number, pointer: Vector3) => {
    const vertices = getPlaneVertices(segmentIdx, pointer);
    return getNormalBasedOnVertices(vertices);
  };

  const getRotationFromNormal = (normal: Vector3) => {
    return [
      Math.PI / 2 - Math.atan2(normal.z, Math.hypot(normal.x, normal.y)),
      0,
      Math.atan2(normal.y, normal.x) + Math.PI / 2,
    ];
  };

  const getPointerOnRoof = (e: ThreeEvent<PointerEvent>) => {
    for (const intersection of e.intersections) {
      if (intersection.eventObject.name === 'Hip Roof Segments Group') {
        return intersection.point;
      }
    }
    return e.intersections[0].point;
  };

  const getRoofSegmentIdxFromEvent = (e: ThreeEvent<PointerEvent>) => {
    for (const intersection of e.intersections) {
      if (intersection.object.name.includes('Roof segment')) {
        return parseInt(intersection.object.name.slice(-1));
      }
    }
    return Number.NaN;
  };

  const getRoofSegmentIdxFromPostion = (posRelToFoundation: Vector3) => {
    const p = posRelToFoundation.clone().sub(ridgeMidPoint);
    for (let i = 0; i < roofSegments.length; i++) {
      const points = roofSegments[i].points.slice(0, 4);
      if (Util.isPointInside(p.x, p.y, points.map(Util.mapVector3ToPoint2))) {
        return i;
      }
    }
    return 0;
  };

  const getSolarPanelRotation = (roofSegmentIdx: number, posRelToFoundation: Vector3) => {
    const normal = getNormalOnRoof(roofSegmentIdx, posRelToFoundation);
    const rotation = Util.isSame(normal.normalize(), UNIT_VECTOR_POS_Z)
      ? [0, 0, currentWallArray[roofSegmentIdx].relativeAngle]
      : getRotationFromNormal(normal);
    return rotation;
  };

  const getSolarPanelZ = (vertices: Vector3[], pos: Vector3) => {
    const [v1, v2, v3] = vertices;
    const p = pos.clone().sub(ridgeMidPoint);
    const A = (v2.y - v1.y) * (v3.z - v1.z) - (v2.z - v1.z) * (v3.y - v1.y);
    const B = (v2.z - v1.z) * (v3.x - v1.x) - (v2.x - v1.x) * (v3.z - v1.z);
    const C = (v2.x - v1.x) * (v3.y - v1.y) - (v2.y - v1.y) * (v3.x - v1.x);
    const D = -(A * v1.x + B * v1.y + C * v1.z);
    const z = -(D + A * p.x + B * p.y) / C + ridgeMidPoint.z + thickness;
    return z;
  };

  const updateSolarPanelOnRoof = () => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.parentId === id && e.foundationId) {
          const foundation = state.getElementById(e.foundationId);
          if (foundation) {
            const posRelToFoundation = new Vector3(e.cx * foundation.lx, e.cy * foundation.ly, e.cz + foundation.lz);
            const segmentIdx = getRoofSegmentIdxFromPostion(posRelToFoundation);
            const normal = getNormalOnRoof(segmentIdx, posRelToFoundation);
            const rotation = normal.z > 0.999999 ? [0, 0, 0] : getSolarPanelRotation(segmentIdx, posRelToFoundation);
            const vertices = getPlaneVertices(segmentIdx, posRelToFoundation);
            const z = getSolarPanelZ(vertices, posRelToFoundation);
            if (rotation && z !== undefined) {
              e.normal = normal.toArray();
              e.rotation = [...rotation];
              e.cz = z;
            }
          }
        }
      }
    });
  };

  const oldPostionRef = useRef<number[] | null>(null);
  const oldRotationRef = useRef<number[] | null>(null);
  const oldNormalRef = useRef<number[] | null>(null);

  const handleUndoableAdd = (elem: ElementModel) => {
    const undoableAdd = {
      name: 'Add Solar Panel On Roof',
      timestamp: Date.now(),
      addedElement: elem,
      undo: () => {
        removeElementById(elem.id, false);
      },
      redo: () => {
        setCommonStore((state) => {
          state.elements.push(undoableAdd.addedElement);
          state.selectedElement = undoableAdd.addedElement;
        });
      },
    } as UndoableAdd;
    useStore.getState().addUndoable(undoableAdd);
  };

  const handleUndoableMove = (sp: SolarPanelModel) => {
    if (oldPostionRef.current && oldRotationRef.current && oldNormalRef.current) {
      const undoabeMove = {
        name: 'Move Solar Panel On Roof',
        timestamp: Date.now(),
        id: sp.id,
        oldPos: [...oldPostionRef.current],
        newPos: [sp.cx, sp.cy, sp.cz],
        oldRot: [...oldRotationRef.current],
        newRot: [...sp.rotation],
        oldNor: [...oldNormalRef.current],
        newNor: [...sp.normal],
        undo: () => {
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === undoabeMove.id) {
                [e.cx, e.cy, e.cz] = [...undoabeMove.oldPos];
                e.rotation = [...undoabeMove.oldRot];
                e.normal = [...undoabeMove.oldNor];
                break;
              }
            }
          });
        },
        redo: () => {
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === undoabeMove.id) {
                [e.cx, e.cy, e.cz] = [...undoabeMove.newPos];
                e.rotation = [...undoabeMove.newRot];
                e.normal = [...undoabeMove.newNor];
                break;
              }
            }
          });
        },
      } as UndoableMoveSolarPanelOnRoof;
      useStore.getState().addUndoable(undoabeMove);
    }
  };

  return (
    <group position={[cx, cy, cz + 0.01]} rotation={[0, 0, rotation]} name={`Hip Roof Group ${id}`}>
      {/* roof segment group */}
      <group
        name="Hip Roof Segments Group"
        position={[centroid2D.x, centroid2D.y, h]}
        onPointerDown={(e) => {
          if (useStore.getState().objectTypeToAdd === ObjectType.SolarPanel) {
            const roof = useStore.getState().getElementById(id);
            if (roof && foundation && e.intersections[0]) {
              const pointer = e.intersections[0].point;
              const posRelToFoundation = new Vector3()
                .subVectors(pointer, new Vector3(foundation.cx, foundation.cy))
                .applyEuler(new Euler(0, 0, -foundation.rotation[2]));

              const roofSegmentIdx = getRoofSegmentIdxFromEvent(e);
              if (Number.isNaN(roofSegmentIdx)) {
                return null;
              }
              const normal = getNormalOnRoof(roofSegmentIdx, posRelToFoundation);
              const rotation =
                normal.z > 0.999999 ? [0, 0, 0] : getSolarPanelRotation(roofSegmentIdx, posRelToFoundation);

              const newElement = ElementModelFactory.makeSolarPanel(
                roof,
                useStore.getState().getPvModule('SPR-X21-335-BLK'),
                posRelToFoundation.x / foundation.lx,
                posRelToFoundation.y / foundation.ly,
                posRelToFoundation.z - foundation.lz,
                Orientation.landscape,
                normal,
                rotation ?? [0, 0, 1],
                undefined,
                undefined,
                ObjectType.Roof,
              );
              setCommonStore((state) => {
                state.elements.push(newElement as ElementModel);
                state.objectTypeToAdd = ObjectType.None;
              });
              handleUndoableAdd(newElement);
            }
          }
          if (e.intersections[0].eventObject.name !== 'Hip Roof Segments Group') {
            const selectedElement = useStore.getState().getSelectedElement();
            if (selectedElement && selectedElement.id !== id) {
              grabRef.current = selectedElement;
              oldPostionRef.current = [selectedElement.cx, selectedElement.cy, selectedElement.cz];
              oldRotationRef.current = [...selectedElement.rotation];
              oldNormalRef.current = [...selectedElement.normal];
            }
          } else {
            handleRoofPointerDown(e, id, parentId);
          }
        }}
        onPointerMove={(e) => {
          if (grabRef.current) {
            switch (grabRef.current.type) {
              case ObjectType.SolarPanel:
                if (useStore.getState().moveHandleType) {
                  if (foundation) {
                    const pointer = getPointerOnRoof(e);
                    const posRelToFoundation = new Vector3()
                      .subVectors(pointer, new Vector3(foundation.cx, foundation.cy))
                      .applyEuler(new Euler(0, 0, -foundation.rotation[2]));

                    const roofSegmentIdx = getRoofSegmentIdxFromEvent(e);
                    if (Number.isNaN(roofSegmentIdx)) {
                      return null;
                    }
                    const normal = getNormalOnRoof(roofSegmentIdx, posRelToFoundation);
                    const rotation =
                      normal.z > 0.999999 ? [0, 0, 0] : getSolarPanelRotation(roofSegmentIdx, posRelToFoundation);
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === grabRef.current?.id) {
                          e.cx = posRelToFoundation.x / foundation.lx;
                          e.cy = posRelToFoundation.y / foundation.ly;
                          e.cz = posRelToFoundation.z - foundation.lz;
                          e.rotation = [...rotation];
                          e.normal = normal.toArray();
                          break;
                        }
                      }
                    });
                  }
                }
                break;
            }
          }
        }}
        onPointerUp={() => {
          if (grabRef.current && useStore.getState().moveHandleType) {
            const sp = getElementById(grabRef.current.id) as SolarPanelModel;
            if (sp && foundation) {
              const boundaryVertices = Util.getWallPointsWithOverhang(id, currentWallArray[0], overhang);
              const solarPanelVertices = Util.getSolarPanelVerticesOnRoof(sp, foundation);
              if (
                !spBoundaryCheckWithErrMsg(solarPanelVertices, boundaryVertices) ||
                !spCollisionCheckWithErrMsg(sp, foundation, solarPanelVertices)
              ) {
                setCommonStore((state) => {
                  if (oldPostionRef.current && oldRotationRef.current && oldNormalRef.current) {
                    for (const e of state.elements) {
                      if (e.id === grabRef.current?.id) {
                        e.cx = oldPostionRef.current[0];
                        e.cy = oldPostionRef.current[1];
                        e.cz = oldPostionRef.current[2];
                        e.rotation = [...oldRotationRef.current];
                        e.normal = [...oldNormalRef.current];
                        break;
                      }
                    }
                  }
                });
              } else {
                handleUndoableMove(sp);
              }
            }
          }
          grabRef.current = null;
          setCommonStore((state) => {
            state.moveHandleType = null;
          });
        }}
        onContextMenu={(e) => {
          handleRoofContextMenu(e, id);
        }}
      >
        {roofSegments.map((segment, i, arr) => {
          const { points, direction, length } = segment;
          const [leftRoof, rightRoof, rightRidge, leftRidge] = points;
          const isFlat = Math.abs(leftRoof.z) < 0.1;
          return (
            // Roof segment idx is important for calculate normal
            <mesh key={i} name={`Roof segment ${i}`} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
              <convexGeometry args={[points, isFlat ? arr[0].direction : direction, isFlat ? 1 : length]} />
              <meshStandardMaterial
                map={texture}
                color={textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white'}
              />
            </mesh>
          );
        })}
        <HipRoofWireframe
          roofSegments={roofSegments}
          thickness={thickness}
          lineColor={lineColor}
          lineWidth={lineWidth}
        />
      </group>

      {/* handles */}
      {selected && !locked && (
        <group position={[0, 0, thickness + 0.15]}>
          {/* left handle */}
          <Sphere
            position={[ridgeLeftPoint.x, ridgeLeftPoint.y, ridgeLeftPoint.z]}
            args={[0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeLeftPoint.x, ridgeLeftPoint.y, h);
              if (foundation && currentWallArray[0]) {
                const r = currentWallArray[0].relativeAngle;
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Left);
              useStoreRef.getState().setEnableOrbitController(false);
            }}
          />
          {/* mid handle */}
          <Sphere
            position={[ridgeMidPoint.x, ridgeMidPoint.y, ridgeMidPoint.z]}
            args={[0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeMidPoint.x, ridgeMidPoint.y, h);
              if (foundation) {
                const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - foundation.rotation[2];
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Mid);
              useStoreRef.getState().setEnableOrbitController(false);
              oldHeight.current = h;
            }}
          />
          {/* right handle */}
          <Sphere
            position={[ridgeRightPoint.x, ridgeRightPoint.y, ridgeRightPoint.z]}
            args={[0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeRightPoint.x, ridgeRightPoint.y, h);
              if (foundation && currentWallArray[0]) {
                const r = currentWallArray[0].relativeAngle;
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Right);
              useStoreRef.getState().setEnableOrbitController(false);
            }}
          />
        </group>
      )}

      {/* intersection plane */}
      {enableIntersectionPlane && (
        <Plane
          name={'Roof Intersection Plane'}
          ref={intersectionPlaneRef}
          args={[1000, 100]}
          visible={false}
          position={intersectionPlanePosition}
          rotation={intersectionPlaneRotation}
          onPointerMove={(e) => {
            if (intersectionPlaneRef.current && isPointerMovingRef.current) {
              setRayCast(e);
              const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
              if (intersects[0] && foundation) {
                const point = intersects[0].point;
                if (point.z < 0.001) {
                  return;
                }
                switch (roofHandleType) {
                  case RoofHandleType.Left: {
                    const midPointVector = ridgeMidPoint
                      .clone()
                      .sub(intersectionPlanePosition)
                      .applyEuler(new Euler(0, 0, -intersectionPlaneRotation.z));

                    const p = point
                      .clone()
                      .sub(new Vector3(foundation.cx, foundation.cy, foundation.cz))
                      .applyEuler(new Euler(0, 0, -foundation.rotation[2]))
                      .sub(intersectionPlanePosition)
                      .applyEuler(new Euler(0, 0, -intersectionPlaneRotation.z));

                    const d = new Vector3().subVectors(p, midPointVector).x;

                    setLeftRidgeLengthCurr(
                      Math.max(Math.min(-d, currentWallArray[0].lx / 2), -rightRidgeLengthCurr + 0.1),
                    );
                    break;
                  }
                  case RoofHandleType.Right: {
                    const midPointVector = ridgeMidPoint
                      .clone()
                      .sub(intersectionPlanePosition)
                      .applyEuler(new Euler(0, 0, -intersectionPlaneRotation.z));

                    const p = point
                      .clone()
                      .sub(new Vector3(foundation.cx, foundation.cy, foundation.cz))
                      .applyEuler(new Euler(0, 0, -foundation.rotation[2]))
                      .sub(intersectionPlanePosition)
                      .applyEuler(new Euler(0, 0, -intersectionPlaneRotation.z));

                    const d = new Vector3().subVectors(p, midPointVector).x;

                    if (currentWallArray[0]) {
                      setRightRidgeLengthCurr(
                        Math.max(Math.min(d, currentWallArray[0].lx / 2), -leftRidgeLengthCurr + 0.1),
                      );
                    }
                    break;
                  }
                  case RoofHandleType.Mid: {
                    setH(Math.max(minHeight, point.z - (foundation?.lz ?? 0) - 0.3));
                    break;
                  }
                }
                updateSolarPanelOnRoof();
              }
            }
          }}
          onPointerUp={() => {
            switch (roofHandleType) {
              case RoofHandleType.Mid: {
                handleUndoableResizeRoofHeight(id, oldHeight.current, h);
                break;
              }
              case RoofHandleType.Left:
              case RoofHandleType.Right: {
                handleUndoableResizeRidgeLength(
                  id,
                  leftRidgeLength,
                  rightRidgeLength,
                  leftRidgeLengthCurr,
                  rightRidgeLengthCurr,
                );
              }
            }
            isPointerMovingRef.current = false;
            setEnableIntersectionPlane(false);
            setRoofHandleType(RoofHandleType.Null);
            useStoreRef.getState().setEnableOrbitController(true);
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  (e as HipRoofModel).leftRidgeLength = leftRidgeLengthCurr;
                  (e as HipRoofModel).rightRidgeLength = rightRidgeLengthCurr;
                  (e as HipRoofModel).lz = h;
                  break;
                }
              }
            });
            updateSolarPanelOnRoof();
          }}
        >
          <meshBasicMaterial side={DoubleSide} transparent={true} opacity={0.5} />
        </Plane>
      )}
    </group>
  );
};

export default HipRoof;
