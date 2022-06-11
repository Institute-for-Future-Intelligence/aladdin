/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Line, Plane, Sphere } from '@react-three/drei';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GableRoofModel } from 'src/models/RoofModel';
import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { DoubleSide, Euler, Mesh, Raycaster, Vector2, Vector3 } from 'three';
import { useStoreRef } from 'src/stores/commonRef';
import { useThree } from '@react-three/fiber';
import { HALF_PI } from 'src/constants';
import { ElementModel } from 'src/models/ElementModel';
import {
  handleUndoableResizeRoofHeight,
  ConvexGeoProps,
  useRoofTexture,
  handleRoofContextMenu,
  getNormal,
  getIntersectionPoint,
  getDistance,
  handleRoofPointerDown,
  isRoofValid,
  RoofWireframeProps,
} from './roof';
import { UnoableResizeGableRoofRidge } from 'src/undo/UndoableResize';
import { RoofTexture, ObjectType } from 'src/types';
import { Util } from 'src/Util';
import { Point2 } from 'src/models/Point2';

const intersectionPlanePosition = new Vector3();
const intersectionPlaneRotation = new Euler();
const zeroVector2 = new Vector2();
const zVector3 = new Vector3(0, 0, 1);

enum RoofHandleType {
  Mid = 'Mid',
  Left = 'Left',
  Right = 'Right',
  Null = 'Null',
}

const GableRoofWireframe = React.memo(({ roofSegments, thickness, lineWidth, lineColor }: RoofWireframeProps) => {
  const peripheryPoints: Vector3[] = [];
  const thicknessVector = new Vector3(0, 0, thickness);

  const isShed = roofSegments.length === 1;

  for (const segment of roofSegments) {
    const [leftRoof, rightRoof, rightRidge, leftRidge] = segment.points;
    peripheryPoints.push(leftRidge, leftRoof, rightRoof, rightRidge);
    if (isShed) {
      peripheryPoints.push(leftRidge);
    }
  }

  const isFlat = Math.abs(roofSegments[0].points[0].z) < 0.015;
  const leftRidge = roofSegments[0].points[3];
  const rightRidge = roofSegments[0].points[2];

  const periphery = <Line points={peripheryPoints} lineWidth={lineWidth} color={lineColor} />;
  const ridge = <Line points={[leftRidge, rightRidge]} lineWidth={lineWidth} color={lineColor} />;
  return (
    <>
      {periphery}
      {!isFlat && !isShed && ridge}
      <group position={[0, 0, thickness]}>
        {periphery}
        {!isFlat && !isShed && ridge}
      </group>
      {roofSegments.map((segment, idx) => {
        const [leftRoof, rightRoof, rightRidge, leftRidge] = segment.points;
        return (
          <group key={idx}>
            <Line points={[leftRoof, leftRoof.clone().add(thicknessVector)]} lineWidth={lineWidth} color={lineColor} />
            <Line
              points={[rightRoof, rightRoof.clone().add(thicknessVector)]}
              lineWidth={lineWidth}
              color={lineColor}
            />
            {isShed && (
              <>
                <Line
                  points={[rightRidge, rightRidge.clone().add(thicknessVector)]}
                  lineWidth={lineWidth}
                  color={lineColor}
                />
                <Line
                  points={[leftRidge, leftRidge.clone().add(thicknessVector)]}
                  lineWidth={lineWidth}
                  color={lineColor}
                />
              </>
            )}
          </group>
        );
      })}
    </>
  );
});

const GableRoof = ({
  id,
  parentId,
  cx,
  cy,
  cz,
  lz,
  wallsId,
  selected,
  ridgeLeftPoint,
  ridgeRightPoint,
  textureType,
  color,
  overhang,
  thickness,
  locked,
  lineColor = 'black',
  lineWidth = 0.2,
}: GableRoofModel) => {
  const texture = useRoofTexture(textureType);

  const setCommonStore = useStore(Selector.set);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const getElementById = useStore(Selector.getElementById);
  const removeElementById = useStore(Selector.removeElementById);
  const elements = useStore(Selector.elements);
  const { gl, camera } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);

  const [h, setH] = useState(lz);
  const [minHeight, setMinHeight] = useState(lz / 2);
  const [showIntersectionPlane, setShowIntersectionPlane] = useState(false);
  const [roofHandleType, setRoofHandleType] = useState<RoofHandleType>(RoofHandleType.Null);
  const [isShed, setIsShed] = useState(false); // todo: need change, wall height

  const intersectionPlaneRef = useRef<Mesh>(null);
  const oldHeight = useRef<number>(h);
  const oldRidgeLeft = useRef<number>(ridgeLeftPoint[0]);
  const oldRidgeRight = useRef<number>(ridgeRightPoint[0]);
  const isPointerMovingRef = useRef(false);

  useEffect(() => {
    if (h < minHeight) {
      setH(minHeight);
    }
  }, [minHeight]);

  useEffect(() => {
    setH(lz);
  }, [lz]);

  const updateRoofTopRidge = (elemId: string, left: number, right: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === elemId) {
          (e as GableRoofModel).ridgeLeftPoint[0] = left;
          (e as GableRoofModel).ridgeRightPoint[0] = right;
          break;
        }
      }
    });
  };

  const handleUndoableResizeTopRidge = (
    elemId: string,
    oldLeft: number,
    oldRight: number,
    newLeft: number,
    newRight: number,
  ) => {
    const undoable = {
      name: 'Resize Gable Roof Ridge',
      timestamp: Date.now(),
      resizedElementId: elemId,
      resizedElementType: ObjectType.Roof,
      oldLeft: oldLeft,
      oldRight: oldRight,
      newLeft: newLeft,
      newRight: newRight,
      undo: () => {
        updateRoofTopRidge(undoable.resizedElementId, oldLeft, oldRight);
      },
      redo: () => {
        updateRoofTopRidge(undoable.resizedElementId, newLeft, newRight);
      },
    } as UnoableResizeGableRoofRidge;
    useStore.getState().addUndoable(undoable);
  };

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const getRelPos = (foundation: ElementModel, wall: WallModel, point: Vector3) => {
    const foundationCenter = new Vector2(foundation.cx, foundation.cy);
    const wallAbsCenter = new Vector2(wall.cx, wall.cy)
      .rotateAround(zeroVector2, foundation.rotation[2])
      .add(foundationCenter);
    const wallAbsAngle = foundation.rotation[2] + wall.relativeAngle;
    const p = new Vector2(point.x, point.y).sub(wallAbsCenter).rotateAround(zeroVector2, -wallAbsAngle);
    const x = p.x / wall.lx;
    return Math.min(Math.abs(x), 0.5) * (x >= 0 ? 1 : -1);
  };

  const getRidgePoint = (wall: WallModel, px: number, ph: number) => {
    if (!wall) {
      return new Vector3();
    }
    const e = new Euler(0, 0, wall.relativeAngle);
    const v = new Vector3(px * wall.lx, 0, 0);
    const height = ph * (h - minHeight) + minHeight;
    return new Vector3(wall.cx, wall.cy, height).add(v.applyEuler(e));
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

  const getWallHeightShed = (arr: WallModel[], i: number) => {
    const w = arr[i];
    let lh = 0;
    let rh = 0;
    if (i === 0) {
      lh = Math.min(w.lz, arr[arr.length - 1].lz);
      rh = Math.min(w.lz, arr[i + 1].lz);
    } else if (i === arr.length - 1) {
      lh = Math.min(w.lz, arr[i - 1].lz);
      rh = Math.min(w.lz, arr[0].lz);
    } else {
      lh = Math.min(w.lz, arr[i - 1].lz);
      rh = Math.min(w.lz, arr[i + 1].lz);
    }
    return { lh, rh };
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

  const getShiftedArr = <T,>(array: T[], idx: number) => {
    const arr = array.slice().reverse();
    swap(arr, 0, idx - 1);
    swap(arr, idx, arr.length - 1);
    return arr;
  };

  const swap = <T,>(arr: T[], i: number, j: number) => {
    while (i < j) {
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
      i++;
      j--;
    }
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

  const centroid = useMemo(() => {
    if (currentWallArray.length !== 4) {
      return new Vector3();
    }
    const points = getWallPoint(currentWallArray);
    const p = Util.calculatePolygonCentroid(points);
    return new Vector3(p.x, p.y, h);
  }, [currentWallArray, h]);

  const ridgeLeftPointV3 = useMemo(() => {
    const wall = currentWallArray[3];
    const [x, h] = ridgeLeftPoint; // percent
    return getRidgePoint(wall, x, h);
  }, [currentWallArray, h, ridgeLeftPoint]);

  const ridgeRightPointV3 = useMemo(() => {
    const wall = currentWallArray[1];
    const [x, h] = ridgeRightPoint; // percent
    return getRidgePoint(wall, x, h);
  }, [currentWallArray, h, ridgeRightPoint]);

  const ridgeMidPoint = useMemo(() => {
    return new Vector3(
      (ridgeLeftPointV3.x + ridgeRightPointV3.x) / 2,
      (ridgeLeftPointV3.y + ridgeRightPointV3.y) / 2,
      h,
    );
  }, [ridgeLeftPointV3, ridgeRightPointV3]);

  const overhangs = useMemo(() => {
    return currentWallArray.map((wall) => getNormal(wall).multiplyScalar(overhang));
  }, [currentWallArray, overhang]);

  const thicknessVector = useMemo(() => {
    return zVector3.clone().multiplyScalar(thickness);
  }, [thickness]);

  const roofSegments = useMemo(() => {
    const segments: ConvexGeoProps[] = [];

    if (currentWallArray.length !== 4) {
      return segments;
    }

    // shed roof
    if (currentWallArray[3].centerRoofHeight && Math.abs(currentWallArray[3].centerRoofHeight[0]) === 0.5) {
      const points: Vector3[] = [];
      const idx = currentWallArray[3].centerRoofHeight[0] < 0 ? 0 : 2;

      const shiftedWallArray = getShiftedArr(currentWallArray, idx);
      const shiftedOverhangs = getShiftedArr(overhangs, idx);

      const [frontWall, rightWall, backWall, leftWall] = shiftedWallArray;
      const [frontOverhang, rightOverhang, backOverhang, leftOverhang] = shiftedOverhangs;

      const wallPoint0 = new Vector3(frontWall.leftPoint[0], frontWall.leftPoint[1]);
      const wallPoint1 = new Vector3(frontWall.rightPoint[0], frontWall.rightPoint[1]);
      const wallPoint2 = new Vector3(backWall.leftPoint[0], backWall.leftPoint[1]);
      const wallPoint3 = new Vector3(backWall.rightPoint[0], backWall.rightPoint[1]);

      const frontWallLeftPointAfterOffset = wallPoint0.clone().add(frontOverhang);
      const frontWallRightPointAfterOffset = wallPoint1.clone().add(frontOverhang);
      const leftWallLeftPointAfterOffset = wallPoint3.clone().add(leftOverhang);
      const leftWallRightPointAfterOffset = wallPoint0.clone().add(leftOverhang);
      const rightWallLeftPointAfterOffset = wallPoint1.clone().add(rightOverhang);
      const rightWallRightPointAfterOffset = wallPoint2.clone().add(rightOverhang);
      const backWallLeftPointAfterOffset = wallPoint2.clone().add(backOverhang);
      const backWallRightPointAfterOffset = wallPoint3.clone().add(backOverhang);

      const { lh: frontWallLh, rh: frontWallRh } = getWallHeightShed(shiftedWallArray, 0);
      const { lh: backWallLh, rh: backWallRh } = getWallHeightShed(shiftedWallArray, 2);

      const d0 = getDistance(wallPoint0, wallPoint1, wallPoint3);
      const overhangHeight0 = Math.min((overhang / d0) * (h - frontWallLh), frontWallLh);

      const d1 = getDistance(wallPoint0, wallPoint1, wallPoint2);
      const overhangHeight1 = Math.min((overhang / d1) * (h - frontWallRh), frontWallRh);

      const d2 = getDistance(wallPoint2, wallPoint3, wallPoint1);
      const overhangHeight2 = Math.min((overhang / d2) * (h - frontWallRh), backWallLh);

      const d3 = getDistance(wallPoint2, wallPoint3, wallPoint0);
      const overhangHeight3 = Math.min((overhang / d3) * (h - frontWallLh), backWallRh);

      const frontWallLeftPointAfterOverhang = getIntersectionPoint(
        frontWallLeftPointAfterOffset,
        frontWallRightPointAfterOffset,
        leftWallLeftPointAfterOffset,
        leftWallRightPointAfterOffset,
      )
        .setZ(frontWallLh - overhangHeight0)
        .sub(centroid);

      const frontWallRightPointAfterOverhang = getIntersectionPoint(
        frontWallLeftPointAfterOffset,
        frontWallRightPointAfterOffset,
        rightWallLeftPointAfterOffset,
        rightWallRightPointAfterOffset,
      )
        .setZ(frontWallRh - overhangHeight1)
        .sub(centroid);

      const backWallLeftPointAfterOverhang = getIntersectionPoint(
        backWallLeftPointAfterOffset,
        backWallRightPointAfterOffset,
        rightWallLeftPointAfterOffset,
        rightWallRightPointAfterOffset,
      )
        .setZ(h + overhangHeight2)
        .sub(centroid);

      const backWallRightPointAfterOverhang = getIntersectionPoint(
        backWallLeftPointAfterOffset,
        backWallRightPointAfterOffset,
        leftWallLeftPointAfterOffset,
        leftWallRightPointAfterOffset,
      )
        .setZ(h + overhangHeight3)
        .sub(centroid);

      points.push(
        frontWallLeftPointAfterOverhang,
        frontWallRightPointAfterOverhang,
        backWallLeftPointAfterOverhang,
        backWallRightPointAfterOverhang,
      );
      points.push(
        frontWallLeftPointAfterOverhang.clone().add(thicknessVector),
        frontWallRightPointAfterOverhang.clone().add(thicknessVector),
        backWallLeftPointAfterOverhang.clone().add(thicknessVector),
        backWallRightPointAfterOverhang.clone().add(thicknessVector),
      );

      const direction = -frontWall.relativeAngle;
      const length = new Vector3(frontWall.cx, frontWall.cy).sub(ridgeMidPoint.clone().setZ(0)).length();
      segments.push({ points, direction, length });
    }
    // gable roof
    else {
      const [frontWall, rightWall, backWall, leftWall] = currentWallArray;
      const [frontOverhang, rightOverhang, backOverhang, leftOverhang] = overhangs;

      const wallPoint0 = new Vector3(frontWall.leftPoint[0], frontWall.leftPoint[1]);
      const wallPoint1 = new Vector3(frontWall.rightPoint[0], frontWall.rightPoint[1]);
      const wallPoint2 = new Vector3(backWall.leftPoint[0], backWall.leftPoint[1]);
      const wallPoint3 = new Vector3(backWall.rightPoint[0], backWall.rightPoint[1]);

      const frontWallLeftPointAfterOffset = wallPoint0.clone().add(frontOverhang);
      const frontWallRightPointAfterOffset = wallPoint1.clone().add(frontOverhang);
      const leftWallLeftPointAfterOffset = wallPoint3.clone().add(leftOverhang);
      const leftWallRightPointAfterOffset = wallPoint0.clone().add(leftOverhang);
      const rightWallLeftPointAfterOffset = wallPoint1.clone().add(rightOverhang);
      const rightWallRightPointAfterOffset = wallPoint2.clone().add(rightOverhang);
      const backWallLeftPointAfterOffset = wallPoint2.clone().add(backOverhang);
      const backWallRightPointAfterOffset = wallPoint3.clone().add(backOverhang);

      const ridgeLeftPointAfterOverhang = getIntersectionPoint(
        ridgeLeftPointV3,
        ridgeRightPointV3,
        leftWallLeftPointAfterOffset.clone(),
        leftWallRightPointAfterOffset.clone(),
      )
        .setZ(ridgeLeftPointV3.z)
        .sub(centroid);

      const ridgeRightPointAfterOverhang = getIntersectionPoint(
        ridgeLeftPointV3,
        ridgeRightPointV3,
        rightWallLeftPointAfterOffset.clone(),
        rightWallRightPointAfterOffset.clone(),
      )
        .setZ(ridgeRightPointV3.z)
        .sub(centroid);

      // front
      const frontPoints: Vector3[] = [];
      const { lh: frontWallLh, rh: frontWallRh } = getWallHeight(currentWallArray, 0);

      const d0 = getDistance(wallPoint0, wallPoint1, ridgeLeftPointV3);
      const overhangHeight0 = Math.min((overhang / d0) * (ridgeLeftPointV3.z - frontWallLh), frontWallLh);

      const d1 = getDistance(wallPoint0, wallPoint1, ridgeRightPointV3);
      const overhangHeight1 = Math.min((overhang / d1) * (ridgeRightPointV3.z - frontWallRh), frontWallRh);

      const frontWallLeftPointAfterOverhang = getIntersectionPoint(
        frontWallLeftPointAfterOffset,
        frontWallRightPointAfterOffset,
        leftWallLeftPointAfterOffset,
        leftWallRightPointAfterOffset,
      )
        .setZ(frontWallLh - overhangHeight0)
        .sub(centroid);

      const frontWallRightPointAfterOverhang = getIntersectionPoint(
        frontWallLeftPointAfterOffset,
        frontWallRightPointAfterOffset,
        rightWallLeftPointAfterOffset,
        rightWallRightPointAfterOffset,
      )
        .setZ(frontWallRh - overhangHeight1)
        .sub(centroid);

      frontPoints.push(
        frontWallLeftPointAfterOverhang,
        frontWallRightPointAfterOverhang,
        ridgeRightPointAfterOverhang,
        ridgeLeftPointAfterOverhang,
      );
      frontPoints.push(
        frontWallLeftPointAfterOverhang.clone().add(thicknessVector),
        frontWallRightPointAfterOverhang.clone().add(thicknessVector),
        ridgeRightPointAfterOverhang.clone().add(thicknessVector),
        ridgeLeftPointAfterOverhang.clone().add(thicknessVector),
      );

      const frontDirection = -frontWall.relativeAngle;
      const frontLength = new Vector3(frontWall.cx, frontWall.cy).sub(centroid.clone().setZ(0)).length();
      segments.push({ points: frontPoints, direction: frontDirection, length: frontLength });

      // back
      const backPoints: Vector3[] = [];
      const { lh: backWallLh, rh: backWallRh } = getWallHeight(currentWallArray, 2);
      const d2 = getDistance(wallPoint2, wallPoint3, ridgeRightPointV3);
      const overhangHeight2 = Math.min((overhang / d2) * (ridgeRightPointV3.z - backWallLh), backWallLh);

      const d3 = getDistance(wallPoint2, wallPoint3, ridgeLeftPointV3);
      const overhangHeight3 = Math.min((overhang / d3) * (ridgeLeftPointV3.z - backWallRh), backWallRh);

      const backWallLeftPointAfterOverhang = getIntersectionPoint(
        backWallLeftPointAfterOffset,
        backWallRightPointAfterOffset,
        rightWallLeftPointAfterOffset,
        rightWallRightPointAfterOffset,
      )
        .setZ(backWallLh - overhangHeight2)
        .sub(centroid);

      const backWallRightPointAfterOverhang = getIntersectionPoint(
        backWallLeftPointAfterOffset,
        backWallRightPointAfterOffset,
        leftWallLeftPointAfterOffset,
        leftWallRightPointAfterOffset,
      )
        .setZ(backWallRh - overhangHeight3)
        .sub(centroid);

      backPoints.push(
        backWallLeftPointAfterOverhang,
        backWallRightPointAfterOverhang,
        ridgeLeftPointAfterOverhang,
        ridgeRightPointAfterOverhang,
      );
      backPoints.push(
        backWallLeftPointAfterOverhang.clone().add(thicknessVector),
        backWallRightPointAfterOverhang.clone().add(thicknessVector),
        ridgeLeftPointAfterOverhang.clone().add(thicknessVector),
        ridgeRightPointAfterOverhang.clone().add(thicknessVector),
      );

      const backDirection = -backWall.relativeAngle;
      const backLength = new Vector3(backWall.cx, backWall.cy).sub(centroid.clone().setZ(0)).length();
      segments.push({ points: backPoints, direction: backDirection, length: backLength });
    }

    return segments;
  }, [currentWallArray, ridgeLeftPointV3, ridgeRightPointV3, h]);

  // set position and rotation
  const parent = getElementById(parentId);
  let rotation = 0;
  if (parent) {
    cx = parent.cx;
    cy = parent.cy;
    cz = parent.lz;
    rotation = parent.rotation[2];
  }

  useEffect(() => {
    if (currentWallArray.length === 4) {
      let minHeight = 0;
      setCommonStore((state) => {
        for (const e of state.elements) {
          const w = e as WallModel;
          switch (e.id) {
            case currentWallArray[0].id: {
              const { lh, rh } = isShed ? getWallHeightShed(currentWallArray, 0) : getWallHeight(currentWallArray, 0);
              minHeight = Math.max(minHeight, Math.max(lh, rh));
              w.roofId = id;
              if (ridgeLeftPoint[0] === 0.5) {
                w.leftRoofHeight = h;
                w.rightRoofHeight = h;
                w.centerRoofHeight = undefined;
              } else {
                w.leftRoofHeight = lh;
                w.rightRoofHeight = rh;
              }
              break;
            }
            case currentWallArray[1].id: {
              const { lh, rh } = isShed ? getWallHeightShed(currentWallArray, 1) : getWallHeight(currentWallArray, 1);
              minHeight = Math.max(minHeight, Math.max(lh, rh));
              w.roofId = id;
              w.leftRoofHeight = lh;
              w.rightRoofHeight = rh;
              if (w.centerRoofHeight) {
                w.centerRoofHeight[0] = ridgeRightPoint[0];
              } else {
                w.centerRoofHeight = [...ridgeRightPoint];
              }
              w.centerRoofHeight[1] = h;
              break;
            }
            case currentWallArray[2].id: {
              const { lh, rh } = isShed ? getWallHeightShed(currentWallArray, 2) : getWallHeight(currentWallArray, 2);
              minHeight = Math.max(minHeight, Math.max(lh, rh));
              w.roofId = id;
              if (ridgeLeftPoint[0] === -0.5) {
                w.leftRoofHeight = h;
                w.rightRoofHeight = h;
                w.centerRoofHeight = undefined;
              } else {
                w.leftRoofHeight = lh;
                w.rightRoofHeight = rh;
              }
              break;
            }
            case currentWallArray[3].id: {
              const { lh, rh } = isShed ? getWallHeightShed(currentWallArray, 3) : getWallHeight(currentWallArray, 3);
              minHeight = Math.max(minHeight, Math.max(lh, rh));
              w.roofId = id;
              w.leftRoofHeight = lh;
              w.rightRoofHeight = rh;
              if (w.centerRoofHeight) {
                w.centerRoofHeight[0] = ridgeLeftPoint[0];
              } else {
                w.centerRoofHeight = [...ridgeLeftPoint];
              }
              w.centerRoofHeight[1] = h;
              break;
            }
          }
        }
      });
      setMinHeight(minHeight);
    } else {
      removeElementById(id, false);
    }
  }, [currentWallArray, h]);

  return (
    <group position={[cx, cy, cz]} rotation={[0, 0, rotation]} name={`GableRoof Group ${id}`}>
      {/* roof segments group */}
      <group
        name={'Roof Segment Group'}
        position={[centroid.x, centroid.y, centroid.z]}
        onPointerDown={(e) => {
          handleRoofPointerDown(e, id);
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
            <mesh key={i} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
              <convexGeometry args={[points, isFlat ? arr[0].direction : direction, isFlat ? 1 : length]} />
              <meshStandardMaterial
                side={DoubleSide}
                map={texture}
                color={textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white'}
              />
            </mesh>
          );
        })}
        <GableRoofWireframe
          roofSegments={roofSegments}
          thickness={thickness}
          lineColor={lineColor}
          lineWidth={lineWidth}
        />
      </group>

      {/* handles */}
      {selected && !locked && (
        <group position={[0, 0, thickness]}>
          {/* mid handle */}
          <Sphere
            position={[ridgeMidPoint.x, ridgeMidPoint.y, ridgeMidPoint.z + 0.15]}
            args={[0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              setShowIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeMidPoint.x, ridgeMidPoint.y, h);
              if (parent) {
                const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - parent.rotation[2];
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Mid);
              useStoreRef.getState().setEnableOrbitController(false);
              oldHeight.current = h;
            }}
          />
          {/* side handles */}
          <Sphere
            position={[ridgeLeftPointV3.x, ridgeLeftPointV3.y, ridgeLeftPointV3.z + 0.15]}
            args={[0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeLeft.current = ridgeLeftPoint[0];
              oldRidgeRight.current = ridgeRightPoint[0];
              setShowIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeLeftPointV3.x, ridgeLeftPointV3.y, h);
              if (parent && currentWallArray[3]) {
                const r = currentWallArray[3].relativeAngle;
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Left);
              useStoreRef.getState().setEnableOrbitController(false);
            }}
          />
          <Sphere
            position={[ridgeRightPointV3.x, ridgeRightPointV3.y, ridgeRightPointV3.z + 0.15]}
            args={[0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeLeft.current = ridgeLeftPoint[0];
              oldRidgeRight.current = ridgeRightPoint[0];
              setShowIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeRightPointV3.x, ridgeRightPointV3.y, h);
              if (parent && currentWallArray[1]) {
                const r = currentWallArray[1].relativeAngle;
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Right);
              useStoreRef.getState().setEnableOrbitController(false);
            }}
          />
        </group>
      )}

      {/* intersection plane */}
      {showIntersectionPlane && (
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
              if (intersects[0]) {
                const point = intersects[0].point;
                if (point.z < 0.001) {
                  return;
                }
                switch (roofHandleType) {
                  case RoofHandleType.Left: {
                    const wall = currentWallArray[3];
                    if (wall) {
                      const foundation = getElementById(wall.parentId);
                      if (foundation) {
                        let x = getRelPos(foundation, wall, point);
                        if (Math.abs(x) >= 0.45 && Math.abs(x) < 0.5) {
                          x = 0.45 * Math.sign(x);
                        }
                        if (isRoofValid(id, currentWallArray[3].id, currentWallArray[1].id, [x, h])) {
                          updateRoofTopRidge(id, x, -x);
                          if (Math.abs(x) === 0.5 && !isShed) {
                            setIsShed(true);
                          } else if (Math.abs(x) !== 0.5 && isShed) {
                            setIsShed(false);
                          }
                        }
                      }
                    }
                    break;
                  }
                  case RoofHandleType.Right: {
                    const wall = currentWallArray[1];
                    if (wall) {
                      const foundation = getElementById(wall.parentId);
                      if (foundation) {
                        let x = getRelPos(foundation, wall, point);
                        if (Math.abs(x) >= 0.45 && Math.abs(x) < 0.5) {
                          x = 0.45 * Math.sign(x);
                        }
                        if (isRoofValid(id, currentWallArray[1].id, currentWallArray[3].id, [x, h])) {
                          updateRoofTopRidge(id, -x, x);
                          if (Math.abs(x) === 0.5 && !isShed) {
                            setIsShed(true);
                          } else if (Math.abs(x) !== 0.5 && isShed) {
                            setIsShed(false);
                          }
                        }
                      }
                    }
                    break;
                  }
                  case RoofHandleType.Mid: {
                    const height = Math.max(minHeight, point.z - (parent?.lz ?? 0) - 0.3);
                    if (isRoofValid(id, currentWallArray[3].id, currentWallArray[1].id, [ridgeLeftPoint[0], height])) {
                      setH(height);
                    }
                    break;
                  }
                }
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
                handleUndoableResizeTopRidge(
                  id,
                  oldRidgeLeft.current,
                  oldRidgeRight.current,
                  ridgeLeftPoint[0],
                  ridgeRightPoint[0],
                );
              }
            }
            isPointerMovingRef.current = false;
            setShowIntersectionPlane(false);
            setRoofHandleType(RoofHandleType.Null);
            useStoreRef.getState().setEnableOrbitController(true);
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  (e as GableRoofModel).lz = h;
                  break;
                }
              }
            });
          }}
        >
          <meshBasicMaterial side={DoubleSide} transparent={true} opacity={0.5} />
        </Plane>
      )}
    </group>
  );
};

const RoofSegment = () => {};

export default GableRoof;
