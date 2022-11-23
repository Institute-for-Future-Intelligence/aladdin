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
import { UnoableResizeGambrelAndMansardRoofRidge } from 'src/undo/UndoableResize';
import { Util } from 'src/Util';
import { CanvasTexture, DoubleSide, Euler, Mesh, Raycaster, Vector2, Vector3 } from 'three';
import {
  addUndoableResizeRoofHeight,
  RoofSegmentProps,
  handleContextMenu,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  RoofHandle,
  RoofWireframeProps,
  updateRooftopElements,
} from './roofRenderer';
import { ObjectType } from 'src/types';
import { RoofUtil } from './RoofUtil';
import { useCurrWallArray, useRoofHeight, useElementUndoable, useUpdateSegmentVerticesMap } from './hooks';
import RoofSegment from './roofSegment';

enum RoofHandleType {
  TopMid = 'TopMid',
  TopLeft = 'TopLeft',
  TopRight = 'TopRight',
  FrontLeft = 'FrontLeft',
  FrontRight = 'FrontRight',
  BackLeft = 'BackLeft',
  BackRight = 'BackRight',
  Null = 'Null',
}

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

const GambrelRoof = ({
  id,
  cx,
  cy,
  cz,
  lz,
  wallsId,
  parentId,
  topRidgeLeftPoint,
  topRidgeRightPoint,
  frontRidgeLeftPoint,
  frontRidgeRightPoint,
  backRidgeLeftPoint,
  backRidgeRightPoint,
  selected,
  textureType,
  color = 'white',
  overhang,
  thickness,
  locked,
  lineColor = 'black',
  lineWidth = 0.2,
  roofType,
}: GambrelRoofModel) => {
  const setCommonStore = useStore(Selector.set);
  const removeElementById = useStore(Selector.removeElementById);
  const fileChanged = useStore(Selector.fileChanged);

  const currentWallArray = useCurrWallArray(wallsId[0]);

  const initMinHeight = () =>
    currentWallArray.length === 4 ? Math.max(currentWallArray[0].lz, currentWallArray[2].lz) : lz / 2;

  const { h, setH, minHeight, setMinHeight, relHeight, setRelHeight } = useRoofHeight(lz, initMinHeight());

  const [roofHandleType, setRoofHandleType] = useState(RoofHandleType.Null);
  const [enableIntersectionPlane, setEnableIntersectionPlane] = useState(false);
  const intersectionPlaneRef = useRef<Mesh>(null);
  const { gl, camera } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);
  const oldHeight = useRef<number>(h);
  const oldRelativeHeightRef = useRef<number>(relHeight.current);
  const oldRidgeVal = useRef<number>(0);
  const isPointerMovingRef = useRef(false);
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

  useEffect(() => {
    const minHeight = currentWallArray.length === 4 ? Math.max(currentWallArray[0].lz, currentWallArray[2].lz) : lz / 2;
    setMinHeight(minHeight);
    setRelHeight(lz - minHeight);
  }, [fileChanged]);

  useEffect(() => {
    if (lz !== h) {
      setH(lz);
    }
  }, [lz]);

  const updateRidge = (elemId: string, type: string, val: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === elemId && e.type === ObjectType.Roof && (e as RoofModel).roofType === RoofType.Gambrel) {
          const gr = e as GambrelRoofModel;
          switch (type) {
            case RoofHandleType.FrontLeft:
              gr.frontRidgeLeftPoint[0] = val;
              break;
            case RoofHandleType.FrontRight:
              gr.frontRidgeRightPoint[0] = val;
              break;
            case RoofHandleType.TopLeft:
              gr.topRidgeLeftPoint[0] = val;
              break;
            case RoofHandleType.TopRight:
              gr.topRidgeRightPoint[0] = val;
              break;
            case RoofHandleType.BackLeft:
              gr.backRidgeLeftPoint[0] = val;
              break;
            case RoofHandleType.BackRight:
              gr.backRidgeRightPoint[0] = val;
              break;
          }
          break;
        }
      }
    });
  };

  const handleUnoableResizeRidge = (elemId: string, type: RoofHandleType, oldVal: number, newVal: number) => {
    const undoable = {
      name: 'Resize Gambrel Roof Ridge',
      timestamp: Date.now(),
      resizedElementId: elemId,
      resizedElementType: ObjectType.Roof,
      oldVal: oldVal,
      newVal: newVal,
      type: type,
      undo: () => {
        updateRidge(undoable.resizedElementId, undoable.type, undoable.oldVal);
      },
      redo: () => {
        updateRidge(undoable.resizedElementId, undoable.type, undoable.newVal);
      },
    } as UnoableResizeGambrelAndMansardRoofRidge;
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
      const dir = new Vector3().subVectors(handlePointV3, camera.position).normalize();
      const rX = Math.atan2(dir.z, Math.hypot(dir.x, dir.y));
      const rZ = wall.relativeAngle;
      intersectionPlaneRotation.set(-HALF_PI + rX, 0, rZ, 'ZXY');
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
    let height = h;
    if (sideWall) {
      height = ph * (h - sideWall.lz) + sideWall.lz;
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
    return new Vector3(p.x, p.y, h);
  }, [currentWallArray, h]);

  // top ridge
  const topRidgeLeftPointV3 = useMemo(() => {
    const wall = currentWallArray[3];
    const [x, h] = topRidgeLeftPoint; // percent
    return getRidgePoint(wall, x, h).sub(centroid);
  }, [currentWallArray, centroid, topRidgeLeftPoint]);

  const topRidgeRightPointV3 = useMemo(() => {
    const wall = currentWallArray[1];
    const [x, h] = topRidgeRightPoint;
    return getRidgePoint(wall, x, h).sub(centroid);
  }, [currentWallArray, centroid, topRidgeRightPoint]);

  const topRidgeMidPointV3 = useMemo(() => {
    return new Vector3().addVectors(topRidgeLeftPointV3, topRidgeRightPointV3).divideScalar(2);
  }, [topRidgeLeftPointV3, topRidgeRightPointV3]);

  // front ridge
  const frontRidgeLeftPointV3 = useMemo(() => {
    const wall = currentWallArray[3];
    const [x, h] = frontRidgeLeftPoint;
    return getRidgePoint(wall, x, h, currentWallArray[0]).sub(centroid);
  }, [currentWallArray, centroid, frontRidgeLeftPoint]);

  const frontRidgeRightPointV3 = useMemo(() => {
    const wall = currentWallArray[1];
    const [x, h] = frontRidgeRightPoint;
    return getRidgePoint(wall, x, h, currentWallArray[0]).sub(centroid);
  }, [currentWallArray, centroid, frontRidgeRightPoint]);

  // back ridge
  const backRidgeLeftPointV3 = useMemo(() => {
    const wall = currentWallArray[1];
    const [x, h] = backRidgeLeftPoint;
    return getRidgePoint(wall, x, h, currentWallArray[2]).sub(centroid);
  }, [currentWallArray, centroid, backRidgeLeftPoint]);

  const backRidgeRightPointV3 = useMemo(() => {
    const wall = currentWallArray[3];
    const [x, h] = backRidgeRightPoint;
    return getRidgePoint(wall, x, h, currentWallArray[2]).sub(centroid);
  }, [currentWallArray, centroid, backRidgeRightPoint]);

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
  }, [currentWallArray, h, minHeight, overhang, thickness]);

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
                    w.centerRoofHeight[0] = topRidgeRightPoint[0];
                    w.centerRoofHeight[1] = h;
                    w.centerLeftRoofHeight[0] = frontRidgeRightPoint[0];
                    w.centerLeftRoofHeight[1] =
                      frontRidgeRightPoint[1] * (h - currentWallArray[0].lz) + currentWallArray[0].lz;
                    w.centerRightRoofHeight[0] = backRidgeLeftPoint[0];
                    w.centerRightRoofHeight[1] =
                      backRidgeLeftPoint[1] * (h - currentWallArray[2].lz) + currentWallArray[2].lz;
                  } else {
                    w.centerRoofHeight = [...topRidgeRightPoint];
                    w.centerLeftRoofHeight = [...frontRidgeRightPoint];
                    w.centerRightRoofHeight = [...backRidgeLeftPoint];
                  }
                }
                if (i === 3) {
                  if (w.centerRoofHeight && w.centerLeftRoofHeight && w.centerRightRoofHeight) {
                    w.centerRoofHeight[0] = topRidgeLeftPoint[0];
                    w.centerRoofHeight[1] = h;
                    w.centerLeftRoofHeight[0] = backRidgeRightPoint[0];
                    w.centerLeftRoofHeight[1] =
                      backRidgeRightPoint[1] * (h - currentWallArray[2].lz) + currentWallArray[2].lz;
                    w.centerRightRoofHeight[0] = frontRidgeLeftPoint[0];
                    w.centerRightRoofHeight[1] =
                      frontRidgeLeftPoint[1] * (h - currentWallArray[0].lz) + currentWallArray[0].lz;
                  } else {
                    w.centerRoofHeight = [...topRidgeLeftPoint];
                    w.centerLeftRoofHeight = [...backRidgeRightPoint];
                    w.centerRightRoofHeight = [...frontRidgeLeftPoint];
                  }
                }
                break;
              }
            }
          });
        }
        setMinHeight(Math.max(currentWallArray[0].lz, currentWallArray[2].lz));
        const height = minHeight.current + relHeight.current;
        setH(height);
        useStore.getState().updateRoofHeightById(id, height);
      } else {
        removeElementById(id, false);
      }
      if (useStore.getState().addedRoofId === id) {
        useStore.getState().setAddedRoofId(null);
      }
    }
  }, [
    currentWallArray,
    h,
    thickness,
    topRidgeLeftPoint,
    topRidgeRightPoint,
    frontRidgeLeftPoint,
    frontRidgeRightPoint,
    backRidgeLeftPoint,
    backRidgeRightPoint,
  ]);

  const updateElementOnRoofFlag = useStore(Selector.updateElementOnRoofFlag);

  useEffect(() => {
    if (!isFirstMountRef.current) {
      updateRooftopElements(foundation, id, roofSegments, centroid, h, thickness);
    }
  }, [
    updateElementOnRoofFlag,
    h,
    thickness,
    topRidgeLeftPoint,
    topRidgeRightPoint,
    frontRidgeLeftPoint,
    frontRidgeRightPoint,
    backRidgeLeftPoint,
    backRidgeRightPoint,
  ]);

  useEffect(() => {
    isFirstMountRef.current = false;
  }, []);

  const { grabRef, addUndoableMove, undoMove, setOldRefData } = useElementUndoable();
  useUpdateSegmentVerticesMap(id, centroid, roofSegments);

  const showSolarRadiationHeatmap = useStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const getHeatmap = useStore(Selector.getHeatmap);
  const [heatmapTextures, setHeatmapTextures] = useState<CanvasTexture[]>([]);
  const getRoofSegmentVertices = useStore(Selector.getRoofSegmentVertices);

  useEffect(() => {
    if (showSolarRadiationHeatmap) {
      const n = roofSegments.length;
      if (n > 0) {
        const textures = [];
        const segmentVertices = getRoofSegmentVertices(id);
        if (segmentVertices) {
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
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue]);

  return (
    <group position={[cx, cy, cz + 0.01]} rotation={[0, 0, rotation]} name={`Gambrel Roof Group ${id}`}>
      {/* roof segments */}
      <group
        name={'Gambrel Roof Segments Group'}
        position={[centroid.x, centroid.y, centroid.z]}
        onPointerDown={(e) => {
          handlePointerDown(e, id, foundation, roofSegments, centroid, setOldRefData);
        }}
        onPointerMove={(e) => {
          handlePointerMove(e, grabRef.current, foundation, roofType, roofSegments, centroid);
        }}
        onPointerUp={() => {
          handlePointerUp(grabRef, foundation, currentWallArray[0], id, overhang, undoMove, addUndoableMove);
        }}
        onContextMenu={(e) => {
          handleContextMenu(e, id);
        }}
      >
        {roofSegments.map((segment, i, arr) => {
          return (
            <RoofSegment
              id={id}
              key={i}
              index={i}
              segment={segment}
              defaultAngle={arr[0].angle}
              thickness={thickness}
              textureType={textureType}
              heatmaps={heatmapTextures}
              color={color}
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
              isPointerMovingRef.current = true;
              oldRidgeVal.current = topRidgeLeftPoint[0];
              setInterSectionPlane(topRidgeLeftPointV3, currentWallArray[3]);
              setRoofHandleType(RoofHandleType.TopLeft);
            }}
          />
          <RoofHandle
            position={[topRidgeRightPointV3.x, topRidgeRightPointV3.y, topRidgeRightPointV3.z]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeVal.current = topRidgeRightPoint[0];
              setInterSectionPlane(topRidgeRightPointV3, currentWallArray[1]);
              setRoofHandleType(RoofHandleType.TopRight);
            }}
          />
          <RoofHandle
            position={[topRidgeMidPointV3.x, topRidgeMidPointV3.y, topRidgeMidPointV3.z]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(topRidgeMidPointV3.x, topRidgeMidPointV3.y, h).add(centroid);
              if (foundation) {
                const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - foundation.rotation[2];
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.TopMid);
              useStoreRef.getState().setEnableOrbitController(false);
              oldHeight.current = h;
              oldRelativeHeightRef.current = relHeight.current;
            }}
          />

          <RoofHandle
            position={[frontRidgeLeftPointV3.x, frontRidgeLeftPointV3.y, frontRidgeLeftPointV3.z]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeVal.current = frontRidgeLeftPoint[0];
              setInterSectionPlane(frontRidgeLeftPointV3, currentWallArray[3]);
              setRoofHandleType(RoofHandleType.FrontLeft);
            }}
          />
          <RoofHandle
            position={[frontRidgeRightPointV3.x, frontRidgeRightPointV3.y, frontRidgeRightPointV3.z]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeVal.current = frontRidgeRightPoint[0];
              setInterSectionPlane(frontRidgeRightPointV3, currentWallArray[1]);
              setRoofHandleType(RoofHandleType.FrontRight);
            }}
          />

          <RoofHandle
            position={[backRidgeLeftPointV3.x, backRidgeLeftPointV3.y, backRidgeLeftPointV3.z]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeVal.current = backRidgeLeftPoint[0];
              setInterSectionPlane(backRidgeLeftPointV3, currentWallArray[1]);
              setRoofHandleType(RoofHandleType.BackLeft);
            }}
          />
          <RoofHandle
            position={[backRidgeRightPointV3.x, backRidgeRightPointV3.y, backRidgeRightPointV3.z]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeVal.current = backRidgeRightPoint[0];
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
            if (intersectionPlaneRef.current && isPointerMovingRef.current) {
              setRayCast(e);
              const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
              if (intersects[0] && foundation) {
                const point = intersects[0].point;
                if (point.z < 0.001) {
                  return;
                }
                switch (roofHandleType) {
                  case RoofHandleType.TopMid: {
                    const height = Math.max(minHeight.current, point.z - (foundation?.lz ?? 0) - 0.3);
                    if (
                      RoofUtil.isRoofValid(id, currentWallArray[3].id, currentWallArray[1].id, [
                        topRidgeLeftPoint[0],
                        height,
                      ])
                    ) {
                      setH(height);
                      setRelHeight(height - minHeight.current);
                    }
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
                              topRidgeLeftPoint[0],
                              0.45,
                            );
                            if (
                              RoofUtil.isRoofValid(id, currentWallArray[3].id, undefined, undefined, undefined, [
                                px,
                                frontRidgeLeftPoint[1] * (h - minHeight.current) + minHeight.current,
                              ])
                            ) {
                              (e as GambrelRoofModel).frontRidgeLeftPoint[0] = px;
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
                              backRidgeRightPoint[0],
                              frontRidgeLeftPoint[0],
                            );
                            if (
                              RoofUtil.isRoofValid(
                                id,
                                currentWallArray[3].id,
                                undefined,
                                [px, topRidgeLeftPoint[1] * (h - minHeight.current) + minHeight.current],
                                undefined,
                                undefined,
                              )
                            ) {
                              (e as GambrelRoofModel).topRidgeLeftPoint[0] = px;
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
                              topRidgeLeftPoint[0],
                            );
                            if (
                              RoofUtil.isRoofValid(
                                id,
                                currentWallArray[3].id,
                                undefined,
                                undefined,
                                [px, backRidgeRightPoint[1] * (h - minHeight.current) + minHeight.current],
                                undefined,
                              )
                            ) {
                              (e as GambrelRoofModel).backRidgeRightPoint[0] = px;
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
                              topRidgeRightPoint[0],
                            );
                            if (
                              RoofUtil.isRoofValid(
                                id,
                                currentWallArray[1].id,
                                undefined,
                                undefined,
                                [px, frontRidgeRightPoint[1] * (h - minHeight.current) + minHeight.current],
                                undefined,
                              )
                            ) {
                              (e as GambrelRoofModel).frontRidgeRightPoint[0] = px;
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
                              frontRidgeRightPoint[0],
                              backRidgeLeftPoint[0],
                            );
                            if (
                              RoofUtil.isRoofValid(
                                id,
                                currentWallArray[1].id,
                                undefined,
                                [px, topRidgeRightPoint[1] * (h - minHeight.current) + minHeight.current],
                                undefined,
                                undefined,
                              )
                            ) {
                              (e as GambrelRoofModel).topRidgeRightPoint[0] = px;
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
                              topRidgeRightPoint[0],
                              0.45,
                            );
                            if (
                              RoofUtil.isRoofValid(id, currentWallArray[1].id, undefined, undefined, undefined, [
                                px,
                                backRidgeLeftPoint[1] * (h - minHeight.current) + minHeight.current,
                              ])
                            ) {
                              (e as GambrelRoofModel).backRidgeLeftPoint[0] = px;
                            }
                          }
                          break;
                        }
                      }
                    });
                    break;
                  }
                }
                updateRooftopElements(foundation, id, roofSegments, centroid, h, thickness);
              }
            }
          }}
          onPointerUp={() => {
            switch (roofHandleType) {
              case RoofHandleType.TopMid: {
                addUndoableResizeRoofHeight(
                  id,
                  oldHeight.current,
                  h,
                  oldRelativeHeightRef.current,
                  relHeight.current,
                  setRelHeight,
                );
                break;
              }
              case RoofHandleType.TopLeft: {
                handleUnoableResizeRidge(id, roofHandleType, oldRidgeVal.current, topRidgeLeftPoint[0]);
                break;
              }
              case RoofHandleType.TopRight: {
                handleUnoableResizeRidge(id, roofHandleType, oldRidgeVal.current, topRidgeRightPoint[0]);
                break;
              }
              case RoofHandleType.FrontLeft: {
                handleUnoableResizeRidge(id, roofHandleType, oldRidgeVal.current, frontRidgeLeftPoint[0]);
                break;
              }
              case RoofHandleType.FrontRight: {
                handleUnoableResizeRidge(id, roofHandleType, oldRidgeVal.current, frontRidgeRightPoint[0]);
                break;
              }
              case RoofHandleType.BackLeft: {
                handleUnoableResizeRidge(id, roofHandleType, oldRidgeVal.current, backRidgeLeftPoint[0]);
                break;
              }
              case RoofHandleType.BackRight: {
                handleUnoableResizeRidge(id, roofHandleType, oldRidgeVal.current, backRidgeRightPoint[0]);
                break;
              }
            }
            isPointerMovingRef.current = false;
            setEnableIntersectionPlane(false);
            setRoofHandleType(RoofHandleType.Null);
            useStoreRef.getState().setEnableOrbitController(true);
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === id && e.type === ObjectType.Roof && (e as RoofModel).roofType === RoofType.Gambrel) {
                  const r = e as GambrelRoofModel;
                  r.lz = h;
                  break;
                }
              }
            });
            updateRooftopElements(foundation, id, roofSegments, centroid, h, thickness);
          }}
        >
          <meshBasicMaterial side={DoubleSide} transparent={true} opacity={0.5} />
        </Plane>
      )}
    </group>
  );
};

export default React.memo(GambrelRoof);
