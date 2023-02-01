/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */
import { Line, Plane } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HALF_PI } from 'src/constants';
import { Point2 } from 'src/models/Point2';
import { HipRoofModel, RoofModel, RoofType } from 'src/models/RoofModel';
import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { useRefStore } from 'src/stores/commonRef';
import * as Selector from 'src/stores/selector';
import { ActionType, ObjectType, RoofHandleType, RoofTexture } from 'src/types';
import { UndoableResizeHipRoofRidge } from 'src/undo/UndoableResize';
import { Util } from 'src/Util';
import { CanvasTexture, DoubleSide, Euler, Mesh, Raycaster, Vector2, Vector3 } from 'three';
import {
  useCurrWallArray,
  useElementUndoable,
  useUpdateSegmentVerticesMap,
  useRoofHeight,
  useUpdateOldRoofFiles,
  useUpdateSegmentVerticesWithoutOverhangMap,
  useRoofTexture,
} from './hooks';
import {
  addUndoableResizeRoofRise,
  RoofSegmentProps,
  handleContextMenu,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  RoofHandle,
  RoofWireframeProps,
  updateRooftopElements,
  RoofSegmentGroupUserData,
} from './roofRenderer';
import RoofSegment from './roofSegment';
import { RoofUtil } from './RoofUtil';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { useDataStore } from '../../stores/commonData';
import { FlatRoof } from './pyramidRoof';

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
          const points = [leftRoof.clone().sub(thicknessVector), leftRoof];
          return <Line key={idx} points={points} lineWidth={lineWidth} color={lineColor} />;
        })}
      </group>
    </>
  );
});

const intersectionPlanePosition = new Vector3();
const intersectionPlaneRotation = new Euler();
const zVector3 = new Vector3(0, 0, 1);

const HipRoof = (roofModel: HipRoofModel) => {
  let {
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
    color = 'white',
    sideColor = 'white',
    overhang,
    thickness,
    locked,
    lineColor = 'black',
    lineWidth = 0.2,
    roofType,
    rise = lz,
  } = roofModel;
  // color = '#fb9e00';

  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);
  const removeElementById = useStore(Selector.removeElementById);
  const updateElementOnRoofFlag = useStore(Selector.updateElementOnRoofFlag);

  // set position and rotation
  const foundation = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === parentId) {
        return e;
      }
    }
    return null;
  });
  let rotation = 0;
  if (foundation) {
    cx = foundation.cx;
    cy = foundation.cy;
    cz = foundation.lz;
    rotation = foundation.rotation[2];
  }

  const currentWallArray = useCurrWallArray(wallsId[0]);
  const texture = useRoofTexture(textureType);

  const [enableIntersectionPlane, setEnableIntersectionPlane] = useState(false);
  const [roofHandleType, setRoofHandleType] = useState<RoofHandleType>(RoofHandleType.Null);
  const [leftRidgeLengthCurr, setLeftRidgeLengthCurr] = useState(leftRidgeLength);
  const [rightRidgeLengthCurr, setRightRidgeLengthCurr] = useState(rightRidgeLength);

  const { highestWallHeight, topZ, riseInnerState, setRiseInnerState } = useRoofHeight(currentWallArray, rise);
  useUpdateOldRoofFiles(roofModel, highestWallHeight);

  const intersectionPlaneRef = useRef<Mesh>(null);
  const { gl, camera } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);
  const isPointerDownRef = useRef(false);
  const isFirstMountRef = useRef(true);
  const oldRiseRef = useRef(rise);

  useEffect(() => {
    if (!isFirstMountRef.current) {
      setLeftRidgeLengthCurr(leftRidgeLength);
    }
  }, [leftRidgeLength]);

  useEffect(() => {
    if (!isFirstMountRef.current) {
      setRightRidgeLengthCurr(rightRidgeLength);
    }
  }, [rightRidgeLength]);

  useEffect(() => {
    if (!isFirstMountRef.current) {
      updateRooftopElements(foundation, id, roofSegments, ridgeMidPoint, topZ, thickness);
    }
  }, [updateElementOnRoofFlag, topZ, thickness]);

  const setHipRoofRidgeLength = (elemId: string, leftRidge: number, rightRidge: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === elemId && e.type === ObjectType.Roof && (e as RoofModel).roofType === RoofType.Hip) {
          (e as HipRoofModel).leftRidgeLength = leftRidge;
          (e as HipRoofModel).rightRidgeLength = rightRidge;
          state.updateElementOnRoofFlag = !state.updateElementOnRoofFlag;
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
    const center = new Vector3(centroid2D.x, centroid2D.y, topZ);
    const wall = getElementById(wallsId[0]) as WallModel;
    if (wall) {
      vector.setX(-leftRidgeLengthCurr).applyEuler(new Euler(0, 0, wall.relativeAngle)).add(center);
    }
    return vector;
  }, [centroid2D, topZ, leftRidgeLengthCurr]);

  const ridgeRightPoint = useMemo(() => {
    const vector = new Vector3();
    const center = new Vector3(centroid2D.x, centroid2D.y, topZ);
    const wall = getElementById(wallsId[0]) as WallModel;
    if (wall) {
      vector.setX(rightRidgeLengthCurr).applyEuler(new Euler(0, 0, wall.relativeAngle)).add(center);
    }
    return vector;
  }, [centroid2D, topZ, rightRidgeLengthCurr]);

  const ridgeMidPoint = useMemo(() => {
    return new Vector3(centroid2D.x, centroid2D.y, topZ);
  }, [centroid2D, topZ]);

  const makeSegment = (vector: Vector3[], p1: Vector3, p2: Vector3, p3: Vector3, p4?: Vector3) => {
    vector.push(p1, p2, p3);
    if (p4) {
      vector.push(p4);
    }
    vector.push(p1.clone().add(thicknessVector), p2.clone().add(thicknessVector), p3.clone().add(thicknessVector));
    if (p4) {
      vector.push(p4.clone().add(thicknessVector));
    }
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
      const { lh, rh } = RoofUtil.getWallHeight(currentWallArray, i);
      const dLeft = RoofUtil.getDistance(wallPoints[i], wallPoints[(i + 1) % 4], ridges[i]);
      const overhangHeightLeft = Math.min((overhang / dLeft) * (ridges[i].z - lh), lh);
      const dRight = RoofUtil.getDistance(wallPoints[i], wallPoints[(i + 1) % 4], ridges[(i + 1) % 4]);
      const overhangHeightRight = Math.min((overhang / dRight) * (ridges[(i + 1) % 4].z - rh), rh);
      height = Math.min(Math.min(overhangHeightLeft, overhangHeightRight), height);
    }

    return Number.isNaN(height) ? 0 : height;
  };

  const overhangs = useMemo(() => {
    return currentWallArray.map((wall) => RoofUtil.getWallNormal(wall).multiplyScalar(overhang));
  }, [currentWallArray, overhang]);

  const thicknessVector = useMemo(() => {
    return zVector3.clone().multiplyScalar(thickness);
  }, [thickness]);

  const wallPointsAfterOffset = useMemo(() => {
    return currentWallArray.map((wall, idx) => ({
      leftPoint: new Vector3(wall.leftPoint[0], wall.leftPoint[1]).add(overhangs[idx]),
      rightPoint: new Vector3(wall.rightPoint[0], wall.rightPoint[1]).add(overhangs[idx]),
    }));
  }, [overhangs]);

  const roofSegments = useMemo(() => {
    const segments: RoofSegmentProps[] = [];
    if (currentWallArray.length !== 4) {
      return segments;
    }

    const overhangHeight = getOverhangHeight();

    for (let i = 0; i < 4; i++) {
      const points: Vector3[] = [];
      const wall = currentWallArray[i];
      const { lh, rh } = RoofUtil.getWallHeight(currentWallArray, i);

      const wallLeftPointAfterOverhang = RoofUtil.getIntersectionPoint(
        wallPointsAfterOffset[(i + 3) % 4].leftPoint,
        wallPointsAfterOffset[(i + 3) % 4].rightPoint,
        wallPointsAfterOffset[i].leftPoint,
        wallPointsAfterOffset[i].rightPoint,
      )
        .setZ(lh - overhangHeight)
        .sub(ridgeMidPoint);

      const wallRightPointAfterOverhang = RoofUtil.getIntersectionPoint(
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
          makeSegment(points, wallLeftPointAfterOverhang, wallRightPointAfterOverhang, ridgeRight, ridgeLeft);
          break;
        case 1:
          length = new Vector3(wall.cx, wall.cy).sub(ridgeRightPoint.clone().setZ(0)).length();
          makeSegment(points, wallLeftPointAfterOverhang, wallRightPointAfterOverhang, ridgeRight);
          break;
        case 2:
          length = new Vector3(wall.cx, wall.cy).sub(ridgeMidPoint.clone().setZ(0)).length();
          makeSegment(points, wallLeftPointAfterOverhang, wallRightPointAfterOverhang, ridgeLeft, ridgeRight);
          break;
        case 3:
          length = new Vector3(wall.cx, wall.cy).sub(ridgeLeftPoint.clone().setZ(0)).length();
          makeSegment(points, wallLeftPointAfterOverhang, wallRightPointAfterOverhang, ridgeLeft);
          break;
      }
      segments.push({ points, angle: -wall.relativeAngle, length });
    }
    return segments;
  }, [currentWallArray, ridgeLeftPoint, ridgeRightPoint, topZ, overhang, thickness]);

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  useEffect(() => {
    if (!isFirstMountRef.current) {
      if (currentWallArray.length === 4) {
        for (let i = 0; i < currentWallArray.length; i++) {
          const { lh, rh } = RoofUtil.getWallHeight(currentWallArray, i);
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === currentWallArray[i].id && e.type === ObjectType.Wall) {
                const w = e as WallModel;
                w.roofId = id;
                w.leftRoofHeight = lh;
                w.rightRoofHeight = rh;
                break;
              }
            }
          });
        }
        updateRooftopElements(foundation, id, roofSegments, ridgeMidPoint, topZ, thickness);
      } else {
        removeElementById(id, false);
      }
    }
  }, [currentWallArray]);

  useEffect(() => {
    isFirstMountRef.current = false;
  }, []);

  const updateSegmentVerticesWithoutOverhangeMap = () => {
    const segmentVertices: Vector3[][] = [];
    for (let i = 0; i < 4; i++) {
      const wall = currentWallArray[i];
      const { lh, rh } = RoofUtil.getWallHeight(currentWallArray, i);

      const wallLeftPoint = new Vector3(wall.leftPoint[0], wall.leftPoint[1]).setZ(lh);
      const wallRightPoint = new Vector3(wall.rightPoint[0], wall.rightPoint[1]).setZ(rh);
      const ridgeLPoint = ridgeLeftPoint.clone();
      const ridgeRPoint = ridgeRightPoint.clone();

      switch (i) {
        case 0:
          segmentVertices.push([wallLeftPoint, wallRightPoint, ridgeRPoint, ridgeLPoint]);
          break;
        case 1:
          segmentVertices.push([wallLeftPoint, wallRightPoint, ridgeRPoint]);
          break;
        case 2:
          segmentVertices.push([wallLeftPoint, wallRightPoint, ridgeLPoint, ridgeRPoint]);
          break;
        case 3:
          segmentVertices.push([wallLeftPoint, wallRightPoint, ridgeLPoint]);
          break;
      }
    }
    useStore.getState().setRoofSegmentVerticesWithoutOverhang(id, segmentVertices);
  };

  const { addUndoableMove, undoMove, setOldRefData } = useElementUndoable();
  useUpdateSegmentVerticesMap(id, new Vector3(centroid2D.x, centroid2D.y, topZ), roofSegments);
  useUpdateSegmentVerticesWithoutOverhangMap(updateSegmentVerticesWithoutOverhangeMap);

  const selectMe = useStore(Selector.selectMe);
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const getHeatmap = useDataStore(Selector.getHeatmap);
  const [heatmapTextures, setHeatmapTextures] = useState<CanvasTexture[]>([]);

  useEffect(() => {
    if (showSolarRadiationHeatmap) {
      const n = roofSegments.length;
      if (n > 0) {
        const textures = [];
        for (let i = 0; i < n; i++) {
          const heatmap = getHeatmap(id + '-' + i);
          if (heatmap) {
            const t = Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5);
            if (t) {
              textures.push(t);
            }
          }
        }
        setHeatmapTextures(textures);
      }
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue]);

  // used for move rooftop elements between different roofs, passed to handlePointerMove in roofRenderer
  const userData: RoofSegmentGroupUserData = {
    roofId: id,
    foundation: foundation,
    centroid: ridgeMidPoint,
    roofSegments: roofSegments,
  };
  const topLayerColor = textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white';

  return (
    <group position={[cx, cy, cz + 0.01]} rotation={[0, 0, rotation]} name={`Hip Roof Group ${id}`}>
      {/* roof segment group */}
      <group
        name={`Hip Roof Segments Group ${id}`}
        position={[centroid2D.x, centroid2D.y, topZ]}
        userData={userData}
        onPointerDown={(e) => {
          handlePointerDown(e, id, foundation, roofSegments, ridgeMidPoint, setOldRefData);
        }}
        onPointerMove={(e) => {
          handlePointerMove(e, id);
        }}
        onPointerUp={(e) => {
          handlePointerUp(e, id, currentWallArray[0], overhang, undoMove, addUndoableMove);
        }}
        onContextMenu={(e) => {
          handleContextMenu(e, id);
        }}
      >
        {riseInnerState > 0 ? (
          <>
            {roofSegments.map((segment, index, arr) => {
              return (
                // Roof segment idx is important for calculate normal
                <RoofSegment
                  id={id}
                  key={index}
                  index={index}
                  roofType={roofType}
                  segment={segment}
                  centroid={new Vector3(centroid2D.x, centroid2D.y, topZ)}
                  thickness={thickness}
                  color={topLayerColor}
                  sideColor={sideColor}
                  texture={texture}
                  heatmap={heatmapTextures && index < heatmapTextures.length ? heatmapTextures[index] : undefined}
                />
              );
            })}
            <HipRoofWireframe
              roofSegments={roofSegments}
              thickness={thickness}
              lineColor={lineColor}
              lineWidth={lineWidth}
            />
          </>
        ) : (
          <FlatRoof
            id={id}
            roofSegments={roofSegments}
            thickness={thickness}
            lineWidth={lineWidth}
            lineColor={lineColor}
            sideColor={sideColor}
            color={topLayerColor}
            textureType={textureType}
            heatmap={null}
          />
        )}
      </group>

      {/* handles */}
      {selected && !locked && (
        <group position={[0, 0, thickness + 0.15]}>
          {/* left handle */}
          <RoofHandle
            position={[ridgeLeftPoint.x, ridgeLeftPoint.y, ridgeLeftPoint.z]}
            onPointerDown={() => {
              isPointerDownRef.current = true;
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeLeftPoint.x, ridgeLeftPoint.y, topZ);
              if (foundation && currentWallArray[0]) {
                const dir = useStore.getState().cameraDirection;
                const rX = Math.atan2(dir.z, dir.y);
                const rZ = currentWallArray[0].relativeAngle;
                intersectionPlaneRotation.set(-HALF_PI - rX, 0, rZ, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Left);
              useRefStore.getState().setEnableOrbitController(false);
            }}
          />
          {/* mid handle */}
          <RoofHandle
            position={[ridgeMidPoint.x, ridgeMidPoint.y, ridgeMidPoint.z]}
            onPointerDown={(e) => {
              selectMe(roofModel.id, e, ActionType.Select);
              isPointerDownRef.current = true;
              oldRiseRef.current = rise;
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeMidPoint.x, ridgeMidPoint.y, topZ);
              if (foundation) {
                const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - foundation.rotation[2];
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Mid);
              useRefStore.getState().setEnableOrbitController(false);
            }}
            onPointerOver={() => {
              setCommonStore((state) => {
                state.hoveredHandle = RoofHandleType.Mid;
                state.selectedElementHeight = topZ + roofModel.thickness;
                state.selectedElementX = cx;
                state.selectedElementY = cy;
              });
            }}
          />
          {/* right handle */}
          <RoofHandle
            position={[ridgeRightPoint.x, ridgeRightPoint.y, ridgeRightPoint.z]}
            onPointerDown={() => {
              isPointerDownRef.current = true;
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeRightPoint.x, ridgeRightPoint.y, topZ);
              if (foundation && currentWallArray[0]) {
                const dir = useStore.getState().cameraDirection;
                const rX = Math.atan2(dir.z, dir.y);
                const rZ = currentWallArray[0].relativeAngle;
                intersectionPlaneRotation.set(-HALF_PI - rX, 0, rZ, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Right);
              useRefStore.getState().setEnableOrbitController(false);
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
            if (intersectionPlaneRef.current && isPointerDownRef.current) {
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
                    const newRise = Math.max(0, point.z - foundation.lz - 0.3 - highestWallHeight);
                    setRiseInnerState(newRise);
                    // the vertical ruler needs to display the latest rise when the handle is being dragged
                    useStore.getState().updateRoofRiseById(id, riseInnerState);
                    break;
                  }
                }
                updateRooftopElements(foundation, id, roofSegments, ridgeMidPoint, topZ, thickness);
              }
            }
          }}
          onPointerUp={() => {
            switch (roofHandleType) {
              case RoofHandleType.Mid: {
                addUndoableResizeRoofRise(id, oldRiseRef.current, riseInnerState);
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
            isPointerDownRef.current = false;
            setEnableIntersectionPlane(false);
            setRoofHandleType(RoofHandleType.Null);
            useRefStore.getState().setEnableOrbitController(true);
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === id && e.type === ObjectType.Roof && (e as RoofModel).roofType === RoofType.Hip) {
                  const r = e as HipRoofModel;
                  r.leftRidgeLength = leftRidgeLengthCurr;
                  r.rightRidgeLength = rightRidgeLengthCurr;
                  r.rise = riseInnerState;
                  state.actionState.roofRise = riseInnerState;
                  break;
                }
              }
            });
            updateRooftopElements(foundation, id, roofSegments, ridgeMidPoint, topZ, thickness);
          }}
        >
          <meshBasicMaterial side={DoubleSide} transparent={true} opacity={0.5} />
        </Plane>
      )}
    </group>
  );
};

export default React.memo(HipRoof);
