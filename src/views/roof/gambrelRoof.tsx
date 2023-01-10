/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Line, Plane } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HALF_PI } from 'src/constants';
import { ElementModel } from 'src/models/ElementModel';
import { Point2 } from 'src/models/Point2';
import { GambrelRoofModel, RoofModel, RoofType } from 'src/models/RoofModel';
import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import * as Selector from 'src/stores/selector';
import { UnoableResizeGambrelRoofRidge } from 'src/undo/UndoableResize';
import { Util } from 'src/Util';
import { CanvasTexture, DoubleSide, Euler, Mesh, Raycaster, Vector2, Vector3 } from 'three';
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
import { ActionType, ObjectType, RoofHandleType } from 'src/types';
import { RoofUtil } from './RoofUtil';
import {
  useCurrWallArray,
  useElementUndoable,
  useUpdateSegmentVerticesMap,
  useRoofHeight,
  useUpdateOldRoofFiles,
  useUpdateSegmentVerticesWithoutOverhangMap,
} from './hooks';
import RoofSegment from './roofSegment';

const GambrelRoofWirefram = React.memo(({ roofSegments, thickness, lineWidth, lineColor }: RoofWireframeProps) => {
  if (roofSegments.length === 0) {
    return null;
  }
  const peripheryPoints: Vector3[] = [];
  const thicknessVector = new Vector3(0, 0, thickness);

  const frontSideSegmentPoints = roofSegments[0].points;
  const frontTopSegmentPoints = roofSegments[1].points;
  const backTopSegmentPoints = roofSegments[2].points;
  const backSideSegmentPoints = roofSegments[3].points;

  peripheryPoints.push(
    frontTopSegmentPoints[3],
    frontTopSegmentPoints[0],
    frontSideSegmentPoints[0],
    frontSideSegmentPoints[1],
    frontSideSegmentPoints[2],
    frontTopSegmentPoints[2],
    backTopSegmentPoints[0],
    backSideSegmentPoints[0],
    backSideSegmentPoints[1],
    backTopSegmentPoints[1],
    frontTopSegmentPoints[3],
  );

  const isFlat = Math.abs(frontSideSegmentPoints[0].z) < 0.15;

  const periphery = <Line points={peripheryPoints} lineWidth={lineWidth} color={lineColor} />;
  const ridges = (
    <>
      <Line points={[frontTopSegmentPoints[0], frontTopSegmentPoints[1]]} lineWidth={lineWidth} color={lineColor} />
      <Line points={[frontTopSegmentPoints[2], frontTopSegmentPoints[3]]} lineWidth={lineWidth} color={lineColor} />
      <Line points={[backTopSegmentPoints[2], backTopSegmentPoints[3]]} lineWidth={lineWidth} color={lineColor} />
    </>
  );
  return (
    <>
      {periphery}
      {!isFlat && ridges}
      <group position={[0, 0, thickness]}>
        {periphery}
        {!isFlat && ridges}
      </group>
      <Line
        points={[frontSideSegmentPoints[0], frontSideSegmentPoints[0].clone().add(thicknessVector)]}
        lineWidth={lineWidth}
        color={lineColor}
      />
      <Line
        points={[frontSideSegmentPoints[1], frontSideSegmentPoints[1].clone().add(thicknessVector)]}
        lineWidth={lineWidth}
        color={lineColor}
      />
      <Line
        points={[backSideSegmentPoints[0], backSideSegmentPoints[0].clone().add(thicknessVector)]}
        lineWidth={lineWidth}
        color={lineColor}
      />
      <Line
        points={[backSideSegmentPoints[1], backSideSegmentPoints[1].clone().add(thicknessVector)]}
        lineWidth={lineWidth}
        color={lineColor}
      />
    </>
  );
});

const intersectionPlanePosition = new Vector3();
const intersectionPlaneRotation = new Euler();
const zeroVector2 = new Vector2();
const zVector3 = new Vector3(0, 0, 1);

const GambrelRoof = (roofModel: GambrelRoofModel) => {
  let {
    id,
    cx,
    cy,
    cz,
    lz,
    wallsId,
    parentId,
    topRidgeLeftPoint,
    frontRidgeLeftPoint,
    backRidgeLeftPoint,
    topRidgePoint,
    frontRidgePoint,
    backRidgePoint,
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

  if (topRidgePoint === undefined) {
    topRidgePoint = topRidgeLeftPoint ? [...topRidgeLeftPoint] : [0, 1];
  }
  if (frontRidgePoint === undefined) {
    frontRidgePoint = frontRidgeLeftPoint ? [...frontRidgeLeftPoint] : [0.35, 0.5];
  }
  if (backRidgePoint === undefined) {
    backRidgePoint = backRidgeLeftPoint ? [...backRidgeLeftPoint] : [-0.35, 0.5];
  }

  const setCommonStore = useStore(Selector.set);
  const removeElementById = useStore(Selector.removeElementById);

  const currentWallArray = useCurrWallArray(wallsId[0]);

  const { highestWallHeight, topZ, riseInnerState, setRiseInnerState } = useRoofHeight(currentWallArray, rise, true);
  useUpdateOldRoofFiles(roofModel, highestWallHeight);

  const [roofHandleType, setRoofHandleType] = useState(RoofHandleType.Null);
  const [enableIntersectionPlane, setEnableIntersectionPlane] = useState(false);
  const intersectionPlaneRef = useRef<Mesh>(null);
  const { gl, camera } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);
  const oldRidgeVal = useRef<number[]>([0, 0]);
  const oldRiseRef = useRef<number>(rise);
  const isPointerDownRef = useRef(false);
  const isFirstMountRef = useRef(true);

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

  const updateRidge = (elemId: string, type: string, val: number[]) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === elemId && e.type === ObjectType.Roof && (e as RoofModel).roofType === RoofType.Gambrel) {
          const gr = e as GambrelRoofModel;
          switch (type) {
            case RoofHandleType.FrontLeft:
            case RoofHandleType.FrontRight:
              gr.frontRidgePoint = [...val];
              break;
            case RoofHandleType.TopLeft:
            case RoofHandleType.TopRight:
              gr.topRidgePoint = [...val];
              break;
            case RoofHandleType.BackLeft:
            case RoofHandleType.BackRight:
              gr.backRidgePoint = [...val];
              break;
          }
          break;
        }
      }
    });
  };

  const handleUnoableResizeRidge = (elemId: string, type: RoofHandleType, oldVal: number[], newVal: number[]) => {
    const undoable = {
      name: 'Resize Gambrel Roof Ridge',
      timestamp: Date.now(),
      resizedElementId: elemId,
      resizedElementType: ObjectType.Roof,
      oldVal: [...oldVal],
      newVal: [...newVal],
      type: type,
      undo: () => {
        updateRidge(undoable.resizedElementId, undoable.type, undoable.oldVal);
      },
      redo: () => {
        updateRidge(undoable.resizedElementId, undoable.type, undoable.newVal);
      },
    } as UnoableResizeGambrelRoofRidge;
    useStore.getState().addUndoable(undoable);
  };

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const setInterSectionPlane = (handlePointV3: Vector3, wall: WallModel) => {
    setEnableIntersectionPlane(true);
    useStoreRef.getState().setEnableOrbitController(false);
    intersectionPlanePosition.set(handlePointV3.x, handlePointV3.y, handlePointV3.z).add(centroid);
    if (foundation && wall) {
      intersectionPlaneRotation.set(HALF_PI, 0, wall.relativeAngle, 'ZXY');
    }
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

  const getRidgePoint = (currWall: WallModel, px: number, ph: number, sideWall?: WallModel) => {
    if (!currWall) {
      return new Vector3();
    }
    const e = new Euler(0, 0, currWall.relativeAngle);
    const v = new Vector3(px * currWall.lx, 0, 0);
    let height = topZ;
    if (sideWall) {
      height = ph * (topZ - sideWall.lz) + sideWall.lz;
    }
    return new Vector3(currWall.cx, currWall.cy, height).add(v.applyEuler(e));
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

  const getWallHeight = (arr: WallModel[], i: number) => {
    const w = arr[i];
    let lh = 0;
    let rh = 0;
    if (i === 0 || i === 2) {
      lh = w.lz;
      rh = w.lz;
    } else if (i === 1) {
      lh = arr[0].lz;
      rh = arr[2].lz;
    } else {
      lh = arr[2].lz;
      rh = arr[0].lz;
    }
    return { lh, rh };
  };

  const centroid = useMemo(() => {
    if (currentWallArray.length !== 4) {
      return new Vector3();
    }
    const points = getWallPoint(currentWallArray);
    const p = Util.calculatePolygonCentroid(points);
    return new Vector3(p.x, p.y, topZ);
  }, [currentWallArray, topZ]);

  // top ridge
  const topRidgeLeftPointV3 = useMemo(() => {
    const wall = currentWallArray[3];
    const [x, h] = topRidgePoint; // percent
    return getRidgePoint(wall, x, h).sub(centroid);
  }, [currentWallArray, centroid, topRidgePoint]);

  const topRidgeRightPointV3 = useMemo(() => {
    const wall = currentWallArray[1];
    const [x, h] = topRidgePoint;
    return getRidgePoint(wall, -x, h).sub(centroid);
  }, [currentWallArray, centroid, topRidgePoint]);

  const topRidgeMidPointV3 = useMemo(() => {
    return new Vector3().addVectors(topRidgeLeftPointV3, topRidgeRightPointV3).divideScalar(2);
  }, [topRidgeLeftPointV3, topRidgeRightPointV3]);

  // front ridge
  const frontRidgeLeftPointV3 = useMemo(() => {
    const wall = currentWallArray[3];
    const [x, h] = frontRidgePoint;
    return getRidgePoint(wall, x, h, currentWallArray[0]).sub(centroid);
  }, [currentWallArray, centroid, frontRidgePoint]);

  const frontRidgeRightPointV3 = useMemo(() => {
    const wall = currentWallArray[1];
    const [x, h] = frontRidgePoint;
    return getRidgePoint(wall, -x, h, currentWallArray[0]).sub(centroid);
  }, [currentWallArray, centroid, frontRidgePoint]);

  // back ridge
  const backRidgeLeftPointV3 = useMemo(() => {
    const wall = currentWallArray[1];
    const [x, h] = backRidgePoint;
    return getRidgePoint(wall, x, h, currentWallArray[2]).sub(centroid);
  }, [currentWallArray, centroid, backRidgePoint]);

  const backRidgeRightPointV3 = useMemo(() => {
    const wall = currentWallArray[3];
    const [x, h] = backRidgePoint;
    return getRidgePoint(wall, -x, h, currentWallArray[2]).sub(centroid);
  }, [currentWallArray, centroid, backRidgePoint]);

  const overhangs = useMemo(() => {
    return currentWallArray.map((wall) => RoofUtil.getWallNormal(wall).multiplyScalar(overhang));
  }, [currentWallArray, overhang]);

  const thicknessVector = useMemo(() => {
    return zVector3.clone().multiplyScalar(thickness);
  }, [thickness]);

  const roofSegments = useMemo(() => {
    const segments: RoofSegmentProps[] = [];

    if (currentWallArray.length != 4) {
      return segments;
    }

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

    // front side
    const frontSidePoints: Vector3[] = [];
    const { lh: frontWallLh, rh: frontWallRh } = getWallHeight(currentWallArray, 0);

    const d0 = RoofUtil.getDistance(wallPoint0, wallPoint1, frontRidgeLeftPointV3.clone().add(centroid));
    const overhangHeight0 = Math.min(
      (overhang / d0) * (frontRidgeLeftPointV3.clone().add(centroid).z - frontWallLh),
      frontWallLh,
    );

    const d1 = RoofUtil.getDistance(wallPoint0, wallPoint1, frontRidgeRightPointV3.clone().add(centroid));
    const overhangHeight1 = Math.min(
      (overhang / d1) * (frontRidgeRightPointV3.clone().add(centroid).z - frontWallRh),
      frontWallRh,
    );

    const frontWallLeftPointAfterOverhang = RoofUtil.getIntersectionPoint(
      leftWallLeftPointAfterOffset,
      leftWallRightPointAfterOffset,
      frontWallLeftPointAfterOffset,
      frontWallRightPointAfterOffset,
    )
      .setZ(frontWallLh - overhangHeight0)
      .sub(centroid);

    const frontWallRightPointAfterOverhang = RoofUtil.getIntersectionPoint(
      frontWallLeftPointAfterOffset,
      frontWallRightPointAfterOffset,
      rightWallLeftPointAfterOffset,
      rightWallRightPointAfterOffset,
    )
      .setZ(frontWallRh - overhangHeight1)
      .sub(centroid);

    const frontRidgeLeftPointAfterOverhang = RoofUtil.getIntersectionPoint(
      frontRidgeLeftPointV3,
      frontRidgeRightPointV3,
      leftWallLeftPointAfterOffset.clone().sub(centroid),
      leftWallRightPointAfterOffset.clone().sub(centroid),
    ).setZ(frontRidgeLeftPointV3.z);

    const frontRidgeRightPointAfterOverhang = RoofUtil.getIntersectionPoint(
      frontRidgeRightPointV3,
      frontRidgeLeftPointV3,
      rightWallLeftPointAfterOffset.clone().sub(centroid),
      rightWallRightPointAfterOffset.clone().sub(centroid),
    ).setZ(frontRidgeRightPointV3.z);

    frontSidePoints.push(
      frontWallLeftPointAfterOverhang,
      frontWallRightPointAfterOverhang,
      frontRidgeRightPointAfterOverhang,
      frontRidgeLeftPointAfterOverhang,
    );
    frontSidePoints.push(
      frontWallLeftPointAfterOverhang.clone().add(thicknessVector),
      frontWallRightPointAfterOverhang.clone().add(thicknessVector),
      frontRidgeRightPointAfterOverhang.clone().add(thicknessVector),
      frontRidgeLeftPointAfterOverhang.clone().add(thicknessVector),
    );

    const frontAngle = -frontWall.relativeAngle;
    const frontSideLength = new Vector3(frontWall.cx, frontWall.cy).sub(topRidgeMidPointV3.clone().setZ(0)).length();
    segments.push({ points: frontSidePoints, angle: frontAngle, length: frontSideLength });

    // front top
    const frontTopPoints: Vector3[] = [];
    const topRidgeLeftPointAfterOverhang = RoofUtil.getIntersectionPoint(
      topRidgeLeftPointV3,
      topRidgeRightPointV3,
      leftWallLeftPointAfterOffset.clone().sub(centroid),
      leftWallRightPointAfterOffset.clone().sub(centroid),
    ).setZ(topRidgeLeftPointV3.z);

    const topRidgeRightPointAfterOverhang = RoofUtil.getIntersectionPoint(
      topRidgeLeftPointV3,
      topRidgeRightPointV3,
      rightWallLeftPointAfterOffset.clone().sub(centroid),
      rightWallRightPointAfterOffset.clone().sub(centroid),
    ).setZ(topRidgeRightPointV3.z);

    frontTopPoints.push(
      frontRidgeLeftPointAfterOverhang,
      frontRidgeRightPointAfterOverhang,
      topRidgeRightPointAfterOverhang,
      topRidgeLeftPointAfterOverhang,
    );
    frontTopPoints.push(
      frontRidgeLeftPointAfterOverhang.clone().add(thicknessVector),
      frontRidgeRightPointAfterOverhang.clone().add(thicknessVector),
      topRidgeRightPointAfterOverhang.clone().add(thicknessVector),
      topRidgeLeftPointAfterOverhang.clone().add(thicknessVector),
    );

    segments.push({ points: frontTopPoints, angle: frontAngle, length: frontSideLength });

    // back top
    const backAngle = -backWall.relativeAngle;
    const { lh: backWallLh, rh: backWallRh } = getWallHeight(currentWallArray, 2);

    const d2 = RoofUtil.getDistance(wallPoint2, wallPoint3, backRidgeLeftPointV3.clone().add(centroid));
    const overhangHeight2 = Math.min(
      (overhang / d2) * (backRidgeLeftPointV3.clone().add(centroid).z - backWallLh),
      backWallLh,
    );

    const d3 = RoofUtil.getDistance(wallPoint2, wallPoint3, backRidgeRightPointV3.clone().add(centroid));
    const overhangHeight3 = Math.min(
      (overhang / d3) * (backRidgeRightPointV3.clone().add(centroid).z - backWallRh),
      backWallRh,
    );

    const backWallLeftPointAfterOverhang = RoofUtil.getIntersectionPoint(
      rightWallLeftPointAfterOffset,
      rightWallRightPointAfterOffset,
      backWallLeftPointAfterOffset,
      backWallRightPointAfterOffset,
    )
      .setZ(backWallLh - overhangHeight2)
      .sub(centroid);

    const backWallRightPointAfterOverhang = RoofUtil.getIntersectionPoint(
      backWallLeftPointAfterOffset,
      backWallRightPointAfterOffset,
      leftWallLeftPointAfterOffset,
      leftWallRightPointAfterOffset,
    )
      .setZ(backWallRh - overhangHeight3)
      .sub(centroid);

    const backRidgeLeftPointAfterOverhang = RoofUtil.getIntersectionPoint(
      backRidgeLeftPointV3,
      backRidgeRightPointV3,
      rightWallLeftPointAfterOffset.clone().sub(centroid),
      rightWallRightPointAfterOffset.clone().sub(centroid),
    ).setZ(backRidgeRightPointV3.z);

    const backRidgeRightPointAfterOverhang = RoofUtil.getIntersectionPoint(
      backRidgeRightPointV3,
      backRidgeLeftPointV3,
      leftWallLeftPointAfterOffset.clone().sub(centroid),
      leftWallRightPointAfterOffset.clone().sub(centroid),
    ).setZ(backRidgeRightPointV3.z);

    const backSideLenght = new Vector3(backWall.cx, backWall.cy).sub(topRidgeMidPointV3.clone().setZ(0)).length();

    const backTopPoints: Vector3[] = [];
    backTopPoints.push(
      backRidgeLeftPointAfterOverhang,
      backRidgeRightPointAfterOverhang,
      topRidgeLeftPointAfterOverhang,
      topRidgeRightPointAfterOverhang,
    );
    backTopPoints.push(
      backRidgeLeftPointAfterOverhang.clone().add(thicknessVector),
      backRidgeRightPointAfterOverhang.clone().add(thicknessVector),
      topRidgeLeftPointAfterOverhang.clone().add(thicknessVector),
      topRidgeRightPointAfterOverhang.clone().add(thicknessVector),
    );
    segments.push({ points: backTopPoints, angle: backAngle, length: backSideLenght });

    // back side
    const backSidePoints: Vector3[] = [];
    backSidePoints.push(
      backWallLeftPointAfterOverhang,
      backWallRightPointAfterOverhang,
      backRidgeRightPointAfterOverhang,
      backRidgeLeftPointAfterOverhang,
    );
    backSidePoints.push(
      backWallLeftPointAfterOverhang.clone().add(thicknessVector),
      backWallRightPointAfterOverhang.clone().add(thicknessVector),
      backRidgeRightPointAfterOverhang.clone().add(thicknessVector),
      backRidgeLeftPointAfterOverhang.clone().add(thicknessVector),
    );
    segments.push({ points: backSidePoints, angle: backAngle, length: backSideLenght });

    return segments;
  }, [currentWallArray, topZ, overhang, thickness]);

  useEffect(() => {
    if (!isFirstMountRef.current || useStore.getState().addedRoofId === id) {
      if (currentWallArray.length === 4) {
        for (let i = 0; i < currentWallArray.length; i++) {
          const { lh, rh } = getWallHeight(currentWallArray, i);
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === currentWallArray[i].id && e.type === ObjectType.Wall) {
                const w = e as WallModel;
                w.roofId = id;
                w.leftRoofHeight = lh;
                w.rightRoofHeight = rh;
                if (i === 1) {
                  if (w.centerRoofHeight && w.centerLeftRoofHeight && w.centerRightRoofHeight) {
                    w.centerRoofHeight[0] = -topRidgePoint[0];
                    w.centerRoofHeight[1] = topZ;
                    w.centerLeftRoofHeight[0] = -frontRidgePoint[0];
                    w.centerLeftRoofHeight[1] =
                      frontRidgePoint[1] * (topZ - currentWallArray[0].lz) + currentWallArray[0].lz;
                    w.centerRightRoofHeight[0] = backRidgePoint[0];
                    w.centerRightRoofHeight[1] =
                      backRidgePoint[1] * (topZ - currentWallArray[2].lz) + currentWallArray[2].lz;
                  } else {
                    w.centerRoofHeight = [-topRidgePoint[0], topRidgePoint[1]];
                    w.centerLeftRoofHeight = [-frontRidgePoint[0], frontRidgePoint[1]];
                    w.centerRightRoofHeight = [...backRidgePoint];
                  }
                }
                if (i === 3) {
                  if (w.centerRoofHeight && w.centerLeftRoofHeight && w.centerRightRoofHeight) {
                    w.centerRoofHeight[0] = topRidgePoint[0];
                    w.centerRoofHeight[1] = topZ;
                    w.centerLeftRoofHeight[0] = -backRidgePoint[0];
                    w.centerLeftRoofHeight[1] =
                      backRidgePoint[1] * (topZ - currentWallArray[2].lz) + currentWallArray[2].lz;
                    w.centerRightRoofHeight[0] = frontRidgePoint[0];
                    w.centerRightRoofHeight[1] =
                      frontRidgePoint[1] * (topZ - currentWallArray[0].lz) + currentWallArray[0].lz;
                  } else {
                    w.centerRoofHeight = [...topRidgePoint];
                    w.centerLeftRoofHeight = [-backRidgePoint[0], backRidgePoint[1]];
                    w.centerRightRoofHeight = [...frontRidgePoint];
                  }
                }
                break;
              }
            }
          });
        }
      } else {
        removeElementById(id, false);
      }
      if (useStore.getState().addedRoofId === id) {
        useStore.getState().setAddedRoofId(null);
      }
    }
  }, [currentWallArray, topZ, thickness, topRidgePoint, frontRidgePoint, backRidgePoint]);

  const updateElementOnRoofFlag = useStore(Selector.updateElementOnRoofFlag);

  useEffect(() => {
    if (!isFirstMountRef.current) {
      updateRooftopElements(foundation, id, roofSegments, centroid, topZ, thickness);
    }
  }, [currentWallArray, updateElementOnRoofFlag, topZ, thickness, topRidgePoint, frontRidgePoint, backRidgePoint]);

  useEffect(() => {
    isFirstMountRef.current = false;
  }, []);

  const updateSegmentVerticesWithoutOverhangeMap = () => {
    const segmentVertices: Vector3[][] = [];

    const wallPoints = currentWallArray.map(
      (w, i, arr) => new Vector3(w.leftPoint[0], w.leftPoint[1], getWallHeight(arr, i).lh),
    );

    const ridgeFLPoint = frontRidgeLeftPointV3.clone().add(centroid);
    const ridgeFRPoint = frontRidgeRightPointV3.clone().add(centroid);
    const ridgeBLPoint = backRidgeLeftPointV3.clone().add(centroid);
    const ridgeBRPoint = backRidgeRightPointV3.clone().add(centroid);
    const ridgeTLPoint = topRidgeLeftPointV3.clone().add(centroid);
    const ridgeTRPoint = topRidgeRightPointV3.clone().add(centroid);

    segmentVertices.push([wallPoints[0], wallPoints[1], ridgeFRPoint, ridgeFLPoint]);
    segmentVertices.push([ridgeFLPoint, ridgeFRPoint, ridgeTRPoint, ridgeTLPoint]);
    segmentVertices.push([ridgeTLPoint, ridgeTRPoint, ridgeBLPoint, ridgeBRPoint]);
    segmentVertices.push([wallPoints[2], wallPoints[3], ridgeBRPoint, ridgeBLPoint]);

    useStore.getState().setRoofSegmentVerticesWithoutOverhang(id, segmentVertices);
  };

  const { addUndoableMove, undoMove, setOldRefData } = useElementUndoable();
  useUpdateSegmentVerticesMap(id, centroid, roofSegments);
  useUpdateSegmentVerticesWithoutOverhangMap(updateSegmentVerticesWithoutOverhangeMap);

  const selectMe = useStore(Selector.selectMe);
  const showSolarRadiationHeatmap = useStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const getHeatmap = useStore(Selector.getHeatmap);
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
    centroid: centroid,
    roofSegments: roofSegments,
  };

  return (
    <group position={[cx, cy, cz + 0.01]} rotation={[0, 0, rotation]} name={`Gambrel Roof Group ${id}`}>
      {/* roof segments */}
      <group
        name={`Gambrel Roof Segments Group ${id}`}
        position={[centroid.x, centroid.y, centroid.z]}
        userData={userData}
        onPointerDown={(e) => {
          handlePointerDown(e, id, foundation, roofSegments, centroid, setOldRefData);
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
        {roofSegments.map((segment, index, arr) => {
          return (
            <RoofSegment
              id={id}
              key={index}
              index={index}
              segment={segment}
              defaultAngle={arr[0].angle}
              thickness={thickness}
              color={color}
              sideColor={sideColor}
              textureType={textureType}
              heatmap={heatmapTextures && index < heatmapTextures.length ? heatmapTextures[index] : undefined}
            />
          );
        })}
        <GambrelRoofWirefram
          roofSegments={roofSegments}
          thickness={thickness}
          lineColor={lineColor}
          lineWidth={lineWidth}
        />
      </group>

      {/* handles */}
      {selected && !locked && (
        <group position={[centroid.x, centroid.y, centroid.z + thickness]}>
          <RoofHandle
            position={[topRidgeLeftPointV3.x, topRidgeLeftPointV3.y, topRidgeLeftPointV3.z]}
            onPointerDown={() => {
              isPointerDownRef.current = true;
              oldRidgeVal.current = [...topRidgePoint];
              setInterSectionPlane(topRidgeLeftPointV3, currentWallArray[3]);
              setRoofHandleType(RoofHandleType.TopLeft);
            }}
          />
          <RoofHandle
            position={[topRidgeRightPointV3.x, topRidgeRightPointV3.y, topRidgeRightPointV3.z]}
            onPointerDown={() => {
              isPointerDownRef.current = true;
              oldRidgeVal.current = [...topRidgePoint];
              setInterSectionPlane(topRidgeRightPointV3, currentWallArray[1]);
              setRoofHandleType(RoofHandleType.TopRight);
            }}
          />
          <RoofHandle
            position={[topRidgeMidPointV3.x, topRidgeMidPointV3.y, topRidgeMidPointV3.z]}
            onPointerDown={(e) => {
              selectMe(roofModel.id, e, ActionType.Select);
              isPointerDownRef.current = true;
              oldRiseRef.current = rise;
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(topRidgeMidPointV3.x, topRidgeMidPointV3.y, topZ).add(centroid);
              if (foundation) {
                const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - foundation.rotation[2];
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.TopMid);
              useStoreRef.getState().setEnableOrbitController(false);
            }}
            onPointerOver={() => {
              setCommonStore((state) => {
                state.hoveredHandle = RoofHandleType.TopMid;
                state.selectedElementHeight = topZ + roofModel.thickness;
                state.selectedElementX = cx + topRidgeMidPointV3.x;
                state.selectedElementY = cy + topRidgeMidPointV3.y;
              });
            }}
          />

          <RoofHandle
            position={[frontRidgeLeftPointV3.x, frontRidgeLeftPointV3.y, frontRidgeLeftPointV3.z]}
            onPointerDown={() => {
              isPointerDownRef.current = true;
              oldRidgeVal.current = [...frontRidgePoint];
              setInterSectionPlane(frontRidgeLeftPointV3, currentWallArray[3]);
              setRoofHandleType(RoofHandleType.FrontLeft);
            }}
          />
          <RoofHandle
            position={[frontRidgeRightPointV3.x, frontRidgeRightPointV3.y, frontRidgeRightPointV3.z]}
            onPointerDown={() => {
              isPointerDownRef.current = true;
              oldRidgeVal.current = [...frontRidgePoint];
              setInterSectionPlane(frontRidgeRightPointV3, currentWallArray[1]);
              setRoofHandleType(RoofHandleType.FrontRight);
            }}
          />

          <RoofHandle
            position={[backRidgeLeftPointV3.x, backRidgeLeftPointV3.y, backRidgeLeftPointV3.z]}
            onPointerDown={() => {
              isPointerDownRef.current = true;
              oldRidgeVal.current = [...backRidgePoint];
              setInterSectionPlane(backRidgeLeftPointV3, currentWallArray[1]);
              setRoofHandleType(RoofHandleType.BackLeft);
            }}
          />
          <RoofHandle
            position={[backRidgeRightPointV3.x, backRidgeRightPointV3.y, backRidgeRightPointV3.z]}
            onPointerDown={() => {
              isPointerDownRef.current = true;
              oldRidgeVal.current = [...backRidgePoint];
              setInterSectionPlane(backRidgeRightPointV3, currentWallArray[3]);
              setRoofHandleType(RoofHandleType.BackRight);
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
                  case RoofHandleType.TopMid: {
                    const newRise = Math.max(0, point.z - foundation.lz - 0.3 - highestWallHeight);
                    if (
                      RoofUtil.isRoofValid(id, currentWallArray[3].id, currentWallArray[1].id, [
                        topRidgePoint[0],
                        newRise + highestWallHeight,
                      ])
                    ) {
                      setRiseInnerState(newRise);
                    }
                    // the vertical ruler needs to display the latest rise when the handle is being dragged
                    useStore.getState().updateRoofRiseById(id, riseInnerState);
                    break;
                  }
                  case RoofHandleType.FrontLeft: {
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (
                          e.id === id &&
                          e.type === ObjectType.Roof &&
                          (e as RoofModel).roofType === RoofType.Gambrel
                        ) {
                          if (foundation && currentWallArray[3]) {
                            const px = Util.clamp(
                              getRelPos(foundation, currentWallArray[3], point),
                              topRidgePoint[0] + 0.05,
                              0.45,
                            );
                            const hDiff = topZ - currentWallArray[0].lz;
                            const pz = Util.clamp((point.z - foundation.lz - currentWallArray[0].lz) / hDiff, 0, 1);
                            if (
                              RoofUtil.isRoofValid(
                                id,
                                currentWallArray[3].id,
                                currentWallArray[1].id,
                                undefined,
                                undefined,
                                [px, frontRidgePoint[1] * hDiff + currentWallArray[0].lz],
                              )
                            ) {
                              (e as GambrelRoofModel).frontRidgePoint = [px, pz];
                            }
                          }
                          break;
                        }
                      }
                    });
                    break;
                  }
                  case RoofHandleType.FrontRight: {
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (
                          e.id === id &&
                          e.type === ObjectType.Roof &&
                          (e as RoofModel).roofType === RoofType.Gambrel
                        ) {
                          if (foundation && currentWallArray[1]) {
                            const px = Util.clamp(
                              getRelPos(foundation, currentWallArray[1], point),
                              -0.45,
                              -topRidgePoint[0] - 0.05,
                            );
                            const hDiff = topZ - currentWallArray[0].lz;
                            const pz = Util.clamp((point.z - foundation.lz - currentWallArray[0].lz) / hDiff, 0, 1);
                            if (
                              RoofUtil.isRoofValid(
                                id,
                                currentWallArray[1].id,
                                currentWallArray[3].id,
                                undefined,
                                [px, -frontRidgePoint[1] * hDiff + currentWallArray[0].lz],
                                undefined,
                              )
                            ) {
                              (e as GambrelRoofModel).frontRidgePoint = [-px, pz];
                            }
                          }
                          break;
                        }
                      }
                    });
                    break;
                  }
                  case RoofHandleType.TopLeft: {
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (
                          e.id === id &&
                          e.type === ObjectType.Roof &&
                          (e as RoofModel).roofType === RoofType.Gambrel
                        ) {
                          if (foundation && currentWallArray[3]) {
                            const px = Util.clamp(
                              getRelPos(foundation, currentWallArray[3], point),
                              -backRidgePoint[0] + 0.05,
                              frontRidgePoint[0] - 0.05,
                            );
                            if (
                              RoofUtil.isRoofValid(
                                id,
                                currentWallArray[3].id,
                                currentWallArray[1].id,
                                [px, topRidgePoint[1] * rise + highestWallHeight],
                                undefined,
                                undefined,
                              )
                            ) {
                              (e as GambrelRoofModel).topRidgePoint[0] = px;
                            }
                          }
                          break;
                        }
                      }
                    });
                    break;
                  }
                  case RoofHandleType.TopRight: {
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (
                          e.id === id &&
                          e.type === ObjectType.Roof &&
                          (e as RoofModel).roofType === RoofType.Gambrel
                        ) {
                          if (foundation && currentWallArray[1]) {
                            const px = Util.clamp(
                              getRelPos(foundation, currentWallArray[1], point),
                              -frontRidgePoint[0] + 0.05,
                              backRidgePoint[0] - 0.05,
                            );
                            if (
                              RoofUtil.isRoofValid(
                                id,
                                currentWallArray[1].id,
                                currentWallArray[3].id,
                                [px, topRidgePoint[1] * rise + highestWallHeight],
                                undefined,
                                undefined,
                              )
                            ) {
                              (e as GambrelRoofModel).topRidgePoint[0] = -px;
                            }
                          }
                          break;
                        }
                      }
                    });
                    break;
                  }
                  case RoofHandleType.BackLeft: {
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (
                          e.id === id &&
                          e.type === ObjectType.Roof &&
                          (e as RoofModel).roofType === RoofType.Gambrel
                        ) {
                          if (foundation && currentWallArray[1]) {
                            const px = Util.clamp(
                              getRelPos(foundation, currentWallArray[1], point),
                              -topRidgePoint[0] + 0.05,
                              0.45,
                            );
                            const hDiff = topZ - currentWallArray[2].lz;
                            const pz = Util.clamp((point.z - foundation.lz - currentWallArray[2].lz) / hDiff, 0, 1);
                            if (
                              RoofUtil.isRoofValid(
                                id,
                                currentWallArray[1].id,
                                currentWallArray[3].id,
                                undefined,
                                undefined,
                                [px, backRidgePoint[1] * hDiff + currentWallArray[2].lz],
                              )
                            ) {
                              (e as GambrelRoofModel).backRidgePoint = [px, pz];
                            }
                          }
                          break;
                        }
                      }
                    });
                    break;
                  }
                  case RoofHandleType.BackRight: {
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (
                          e.id === id &&
                          e.type === ObjectType.Roof &&
                          (e as RoofModel).roofType === RoofType.Gambrel
                        ) {
                          if (foundation && currentWallArray[3]) {
                            const px = Util.clamp(
                              getRelPos(foundation, currentWallArray[3], point),
                              -0.45,
                              topRidgePoint[0] - 0.05,
                            );
                            const hDiff = topZ - currentWallArray[2].lz;
                            const pz = Util.clamp((point.z - foundation.lz - currentWallArray[2].lz) / hDiff, 0, 1);
                            if (
                              RoofUtil.isRoofValid(
                                id,
                                currentWallArray[3].id,
                                currentWallArray[1].id,
                                undefined,
                                [px, -backRidgePoint[1] * hDiff + currentWallArray[2].lz],
                                undefined,
                              )
                            ) {
                              (e as GambrelRoofModel).backRidgePoint = [-px, pz];
                            }
                          }
                          break;
                        }
                      }
                    });
                    break;
                  }
                }
                updateRooftopElements(foundation, id, roofSegments, centroid, topZ, thickness);
              }
            }
          }}
          onPointerUp={() => {
            switch (roofHandleType) {
              case RoofHandleType.TopMid: {
                addUndoableResizeRoofRise(id, oldRiseRef.current, riseInnerState);
                break;
              }
              case RoofHandleType.TopLeft:
              case RoofHandleType.TopRight: {
                handleUnoableResizeRidge(id, roofHandleType, oldRidgeVal.current, topRidgePoint);
                break;
              }
              case RoofHandleType.FrontLeft:
              case RoofHandleType.FrontRight: {
                handleUnoableResizeRidge(id, roofHandleType, oldRidgeVal.current, frontRidgePoint);
                break;
              }
              case RoofHandleType.BackLeft:
              case RoofHandleType.BackRight: {
                handleUnoableResizeRidge(id, roofHandleType, oldRidgeVal.current, backRidgePoint);
                break;
              }
            }
            isPointerDownRef.current = false;
            setEnableIntersectionPlane(false);
            setRoofHandleType(RoofHandleType.Null);
            useStoreRef.getState().setEnableOrbitController(true);
            useStore.getState().updateRoofRiseById(id, riseInnerState);
            updateRooftopElements(foundation, id, roofSegments, centroid, topZ, thickness);
          }}
        >
          <meshBasicMaterial side={DoubleSide} transparent={true} opacity={0.5} />
        </Plane>
      )}
    </group>
  );
};

export default React.memo(GambrelRoof);
