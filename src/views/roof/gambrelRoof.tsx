/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
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
import { useRefStore } from 'src/stores/commonRef';
import * as Selector from 'src/stores/selector';
import { UnoableResizeGambrelRoofRidge } from 'src/undo/UndoableResize';
import { Util } from 'src/Util';
import { CanvasTexture, DoubleSide, Euler, Mesh, Raycaster, RepeatWrapping, Vector2, Vector3 } from 'three';
import {
  addUndoableResizeRoofRise,
  handleContextMenu,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  RoofHandle,
  RoofSegmentGroupUserData,
  RoofSegmentProps,
  RoofWireframeProps,
  updateRooftopElements,
} from './roofRenderer';
import { ActionType, ObjectType, ResizeHandleType, RoofHandleType, RoofTexture } from 'src/types';
import { RoofUtil } from './RoofUtil';
import {
  useComposedWallArray,
  useCurrWallArray,
  useComposedRoofHeight,
  useRoofHeight,
  useRoofTexture,
  useUpdateOldRoofFiles,
  useUpdateSegmentVerticesMap,
  useUpdateSegmentVerticesWithoutOverhangMap,
  ComposedWall,
} from './hooks';
import RoofSegment from './roofSegment';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { useDataStore } from '../../stores/commonData';
import Ceiling from './ceiling';
import { FoundationModel } from '../../models/FoundationModel';
import FlatRoof from './flatRoof';
import { WindowModel, WindowType } from 'src/models/WindowModel';
import { DEFAULT_POLYGONTOP } from '../window/window';

type RoofEdge = {
  start: number;
  end: number;
  k: number;
  b: number;
};

export type WallHeights = {
  left: number;
  centerLeft?: number[] | null;
  center?: number[] | null;
  centerRight?: number[] | null;
  right: number;
};

export const getWallShapePoints = (lx: number, lz: number, wallHeights: WallHeights) => {
  const { left, right, center, centerLeft, centerRight } = wallHeights;
  const [hx, hz] = [lx / 2, lz / 2];
  const points: Point2[] = [
    { x: -hx, y: left - hz },
    { x: -hx, y: -hz },
    { x: hx, y: -hz },
    { x: hx, y: right - hz },
  ];
  if (centerRight) {
    const [crX, crY] = centerRight;
    points.push({ x: crX * lx, y: crY - hz });
  }
  if (center) {
    const [cX, cY] = center;
    points.push({ x: cX * lx, y: cY - hz });
  }
  if (centerLeft) {
    const [clX, clY] = centerLeft;
    points.push({ x: clX * lx, y: clY - hz });
  }
  return points;
};

export const isRoofValid = (wallHeightsMap: Map<string, WallHeights>, foundationId: string) => {
  for (const e of useStore.getState().elements) {
    if (e.type === ObjectType.Wall && e.foundationId === foundationId && wallHeightsMap.has(e.id)) {
      const wallHeights = wallHeightsMap.get(e.id);
      if (wallHeights) {
        const wall = e as WallModel;
        const wallShapePoints = getWallShapePoints(wall.lx, wall.lz, wallHeights);

        for (const child of useStore.getState().elements) {
          if (child.parentId === wall.id) {
            let { cx, cz, lx, ly, lz } = child;
            cx *= wall.lx;
            cz *= wall.lz;
            if (child.type !== ObjectType.SolarPanel) {
              lx *= wall.lx;
              lz *= wall.lz;
            } else {
              lz = ly;
            }
            if (child.type === ObjectType.Window && (child as WindowModel).windowType === WindowType.Polygonal) {
              const [tx, th] = (child as WindowModel).polygonTop ?? DEFAULT_POLYGONTOP;
              const px = cx + tx * lx;
              const pz = cz + lz / 2 + th;
              if (!Util.isPointInside(px, pz, wallShapePoints)) {
                return false;
              }
            }
            if (
              !Util.isElementInsideWall(new Vector3(cx, 0, cz), lx, lz, wallShapePoints, child.type === ObjectType.Door)
            ) {
              return false;
            }
          }
        }
      }
    }
  }
  return true;
};

const GambrelRoofWireframe = React.memo(({ roofSegments, thickness, lineWidth, lineColor }: RoofWireframeProps) => {
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
    thickness,
    locked,
    lineColor = 'black',
    lineWidth = 0.2,
    roofType,
    rise = lz,
    ceiling = false,
  } = roofModel;

  if (topRidgePoint === undefined) {
    topRidgePoint = topRidgeLeftPoint ? [...topRidgeLeftPoint] : [0, 1];
  }
  if (frontRidgePoint === undefined) {
    frontRidgePoint = frontRidgeLeftPoint ? [...frontRidgeLeftPoint] : [0.35, 0.5];
  }
  if (backRidgePoint === undefined) {
    backRidgePoint = backRidgeLeftPoint ? [...backRidgeLeftPoint] : [0.35, 0.5];
  }

  const setCommonStore = useStore(Selector.set);
  const removeElementById = useStore(Selector.removeElementById);

  const composedWalls = useComposedWallArray(wallsId[0], parentId);
  const texture = useRoofTexture(textureType);

  const { highestWallHeight, topZ, riseInnerState, setRiseInnerState } = useComposedRoofHeight(
    composedWalls,
    rise,
    true,
  );
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

  const isFlat = riseInnerState < 0.01;

  // set position and rotation
  const foundation = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === parentId && e.type === ObjectType.Foundation) {
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

  const handleUndoableResizeRidge = (elemId: string, type: RoofHandleType, oldVal: number[], newVal: number[]) => {
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

  const setInterSectionPlane = (handlePointV3: Vector3, wall: ComposedWall) => {
    setEnableIntersectionPlane(true);
    useRefStore.getState().setEnableOrbitController(false);
    intersectionPlanePosition.set(handlePointV3.x, handlePointV3.y, handlePointV3.z).add(centroid);
    if (foundation && wall) {
      intersectionPlaneRotation.set(HALF_PI, 0, wall.relativeAngle, 'ZXY');
    }
  };

  const getRelPos = (foundation: ElementModel, wall: ComposedWall, point: Vector3) => {
    const foundationCenter = new Vector2(foundation.cx, foundation.cy);
    const wallCenter = RoofUtil.getComposedWallCenter(wall);
    const wallLength = RoofUtil.getComposedWallLength(wall);
    const wallAbsCenter = new Vector2(wallCenter.x, wallCenter.y)
      .rotateAround(zeroVector2, foundation.rotation[2])
      .add(foundationCenter);
    const wallAbsAngle = foundation.rotation[2] + wall.relativeAngle;
    const p = new Vector2(point.x, point.y).sub(wallAbsCenter).rotateAround(zeroVector2, -wallAbsAngle);
    const x = p.x / wallLength;
    return Math.min(Math.abs(x), 0.5) * (x >= 0 ? 1 : -1);
  };

  const getRidgePoint = (currWall: ComposedWall, px: number, ph: number, sideWall?: ComposedWall) => {
    if (!currWall) {
      return new Vector3();
    }
    const length = RoofUtil.getComposedWallLength(currWall);
    const e = new Euler(0, 0, currWall.relativeAngle);
    const v = new Vector3(px * length, 0, 0);
    let height = topZ;
    if (sideWall) {
      height = ph * (topZ - sideWall.lz) + sideWall.lz;
    }
    const center = RoofUtil.getComposedWallCenter(currWall);
    return new Vector3(center.x, center.y, height).add(v.applyEuler(e));
  };

  const getWallHeight = (arr: ComposedWall[], i: number) => {
    const w = arr[i];
    let lh;
    let rh;
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

  const isThisIdAndType = (e: ElementModel) => {
    return e.id === id && e.type === ObjectType.Roof && (e as RoofModel).roofType === RoofType.Gambrel;
  };

  const centroid = useMemo(() => {
    if (!composedWalls || composedWalls.length !== 4) return new Vector3();
    const points = composedWalls.map((w) => ({ x: w.leftPoint.x, y: w.leftPoint.y } as Point2));
    const p = Util.calculatePolygonCentroid(points);
    return new Vector3(p.x, p.y, topZ);
  }, [composedWalls, topZ]);

  // top ridge
  const topRidgeLeftPointV3 = useMemo(() => {
    if (!composedWalls || composedWalls.length !== 4) return new Vector3();
    const wall = composedWalls[3];
    const [x, h] = topRidgePoint; // percent
    return getRidgePoint(wall, x, h).sub(centroid);
  }, [composedWalls, centroid, topRidgePoint]);

  const topRidgeRightPointV3 = useMemo(() => {
    if (!composedWalls || composedWalls.length !== 4) return new Vector3();
    const wall = composedWalls[1];
    const [x, h] = topRidgePoint;
    return getRidgePoint(wall, -x, h).sub(centroid);
  }, [composedWalls, centroid, topRidgePoint]);

  const topRidgeMidPointV3 = useMemo(() => {
    return new Vector3().addVectors(topRidgeLeftPointV3, topRidgeRightPointV3).divideScalar(2);
  }, [topRidgeLeftPointV3, topRidgeRightPointV3]);

  // front ridge
  const frontRidgeLeftPointV3 = useMemo(() => {
    if (!composedWalls || composedWalls.length !== 4) return new Vector3();
    const wall = composedWalls[3];
    const [x, h] = frontRidgePoint;
    return getRidgePoint(wall, x, h, composedWalls[0]).sub(centroid);
  }, [composedWalls, centroid, frontRidgePoint]);

  const frontRidgeRightPointV3 = useMemo(() => {
    if (!composedWalls || composedWalls.length !== 4) return new Vector3();
    const wall = composedWalls[1];
    const [x, h] = frontRidgePoint;
    return getRidgePoint(wall, -x, h, composedWalls[0]).sub(centroid);
  }, [composedWalls, centroid, frontRidgePoint]);

  // back ridge
  const backRidgeLeftPointV3 = useMemo(() => {
    if (!composedWalls || composedWalls.length !== 4) return new Vector3();
    const wall = composedWalls[1];
    const [x, h] = backRidgePoint;
    return getRidgePoint(wall, x, h, composedWalls[2]).sub(centroid);
  }, [composedWalls, centroid, backRidgePoint]);

  const backRidgeRightPointV3 = useMemo(() => {
    if (!composedWalls || composedWalls.length !== 4) return new Vector3();
    const wall = composedWalls[3];
    const [x, h] = backRidgePoint;
    return getRidgePoint(wall, -x, h, composedWalls[2]).sub(centroid);
  }, [composedWalls, centroid, backRidgePoint]);

  const overhangs = useMemo(() => {
    if (!composedWalls || composedWalls.length !== 4) return [] as Vector3[];
    return composedWalls.map((wall) => RoofUtil.getComposedWallNormal(wall).multiplyScalar(wall.eavesLength));
  }, [composedWalls]);

  const thicknessVector = useMemo(() => {
    return zVector3.clone().multiplyScalar(thickness);
  }, [thickness]);

  const roofSegments = useMemo(() => {
    const segments: RoofSegmentProps[] = [];

    if (!composedWalls || composedWalls.length !== 4) return segments;

    const [frontWall, rightWall, backWall, leftWall] = composedWalls;
    const [frontOverhang, rightOverhang, backOverhang, leftOverhang] = overhangs;

    const wallPoint0 = frontWall.leftPoint;
    const wallPoint1 = frontWall.rightPoint;
    const wallPoint2 = backWall.leftPoint;
    const wallPoint3 = backWall.rightPoint;

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
    const { lh: frontWallLh, rh: frontWallRh } = getWallHeight(composedWalls, 0);

    const d0 = RoofUtil.getDistance(wallPoint0, wallPoint1, frontRidgeLeftPointV3.clone().add(centroid));
    const overhangHeight0 = Math.min(
      ((frontWall.eavesLength ?? 0) / d0) * (frontRidgeLeftPointV3.clone().add(centroid).z - frontWallLh),
      frontWallLh,
    );

    const d1 = RoofUtil.getDistance(wallPoint0, wallPoint1, frontRidgeRightPointV3.clone().add(centroid));
    const overhangHeight1 = Math.min(
      ((frontWall.eavesLength ?? 0) / d1) * (frontRidgeRightPointV3.clone().add(centroid).z - frontWallRh),
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

    const frontCenter = RoofUtil.getComposedWallCenter(frontWall);
    const frontAngle = -frontWall.relativeAngle;
    const frontSideLength = new Vector3(frontCenter.x, frontCenter.y).sub(topRidgeMidPointV3.clone().setZ(0)).length();
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
    const { lh: backWallLh, rh: backWallRh } = getWallHeight(composedWalls, 2);

    const d2 = RoofUtil.getDistance(wallPoint2, wallPoint3, backRidgeLeftPointV3.clone().add(centroid));
    const overhangHeight2 = Math.min(
      ((backWall.eavesLength ?? 0) / d2) * (backRidgeLeftPointV3.clone().add(centroid).z - backWallLh),
      backWallLh,
    );

    const d3 = RoofUtil.getDistance(wallPoint2, wallPoint3, backRidgeRightPointV3.clone().add(centroid));
    const overhangHeight3 = Math.min(
      ((backWall.eavesLength ?? 0) / d3) * (backRidgeRightPointV3.clone().add(centroid).z - backWallRh),
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

    const backCenter = RoofUtil.getComposedWallCenter(backWall);
    const backSideLength = new Vector3(backCenter.x, backCenter.y).sub(topRidgeMidPointV3.clone().setZ(0)).length();

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
    segments.push({ points: backTopPoints, angle: backAngle, length: backSideLength });

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
    segments.push({ points: backSidePoints, angle: backAngle, length: backSideLength });

    return segments;
  }, [composedWalls, topZ, thickness, topRidgePoint, frontRidgePoint, backRidgePoint]);

  const ceilingPoints = useMemo(() => {
    if (!composedWalls || composedWalls.length !== 4) return null;
    return composedWalls.map((wall) => wall.leftPoint);
  }, [composedWalls]);

  const getEdgeLine = (startPoint: Vector2, endPoint: Vector2) => {
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const k = dy / dx;
    const b = startPoint.y - k * startPoint.x;
    return {
      start: startPoint.x,
      end: endPoint.x,
      k,
      b,
    } as RoofEdge;
  };

  const getRoofSideEdges = (
    composedWalls: ComposedWall[],
    index: number,
    topZ: number,
    leftBaseHeight: number,
    rightBaseHeight: number,
    leftPoint: number[],
    midPoint: number[],
    rightPoint: number[],
  ) => {
    const composedWall = composedWalls[index];
    const { lh, rh } = getWallHeight(composedWalls, index);
    const length = new Vector3().subVectors(composedWall.leftPoint, composedWall.rightPoint).length();
    const halfLength = length / 2;

    const getX = (x: number) => x * length + halfLength;
    const getY = (y: number, baseHeight: number) => y * (topZ - baseHeight) + baseHeight;

    const points = [
      new Vector2(getX(-leftPoint[0]), getY(leftPoint[1], leftBaseHeight)),
      new Vector2(getX(midPoint[0]), topZ),
      new Vector2(getX(rightPoint[0]), getY(rightPoint[1], rightBaseHeight)),
      new Vector2(length, rh),
    ];
    const edges = points.map((p, i) => {
      const start = i === 0 ? new Vector2(0, lh) : points[i - 1];
      return getEdgeLine(start, p);
    });
    return edges;
  };

  const getYOnEdge = (edges: RoofEdge[], x: number) => {
    for (const edge of edges) {
      const { start, end, k, b } = edge;
      if (x >= start && x <= end) {
        return k * x + b;
      }
    }
    return null;
  };

  const updateFlatRoofWalls = (composedWalls: ComposedWall[]) => {
    const idSet = new Set<string>();
    for (const composedWall of composedWalls) {
      composedWall.wallsId.forEach((id) => idSet.add(id));
    }
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && e.foundationId === parentId && idSet.has(e.id)) {
          const wall = e as WallModel;
          wall.leftRoofHeight = topZ;
          wall.rightRoofHeight = topZ;
          wall.centerLeftRoofHeight = undefined;
          wall.centerRightRoofHeight = undefined;
          wall.centerRoofHeight = undefined;
        }
      }
    });
  };

  const setSideWallHeightsMap = (
    map: Map<string, WallHeights>,
    composedWalls: ComposedWall[],
    index: number,
    topZ: number,
    frontRidgePoint: number[],
    topRidgePoint: number[],
    backRidgePoint: number[],
  ) => {
    if (index !== 1 && index !== 3) return;
    const isLeftSide = index === 3;
    const { lh, rh } = getWallHeight(composedWalls, index);
    const leftPoint = isLeftSide ? backRidgePoint : frontRidgePoint;
    const rightPoint = isLeftSide ? frontRidgePoint : backRidgePoint;
    const midPoint = isLeftSide ? topRidgePoint : [-topRidgePoint[0], topRidgePoint[1]];

    const roofEdges = getRoofSideEdges(composedWalls, index, topZ, lh, rh, leftPoint, midPoint, rightPoint);
    const roofPointsX = roofEdges.slice(1).map((edge) => edge.start);

    const composedWall = composedWalls[index];
    const wallPointsX = composedWall.wallsId.reduce(
      (acc, currId) => {
        const wall = useStore.getState().elements.find((e) => e.id === currId) as WallModel;
        if (!wall) return acc;
        return [...acc, wall.lx + acc[acc.length - 1]];
      },
      [0],
    );

    for (let i = 0; i < composedWall.wallsId.length; i++) {
      const id = composedWall.wallsId[i];
      const [wallStartX, wallEndX] = [wallPointsX[i], wallPointsX[i + 1]];
      const wallStartY = getYOnEdge(roofEdges, wallStartX);
      const wallEndY = getYOnEdge(roofEdges, wallEndX);

      if (wallStartY !== null && wallEndY !== null) {
        const wallLength = wallEndX - wallStartX;
        const wallCenterX = (wallStartX + wallEndX) / 2;

        const wallHeights: WallHeights = {
          left: wallStartY,
          right: wallEndY,
        };

        for (let i = 0; i < roofPointsX.length; i++) {
          const roofPointX = roofPointsX[i];
          if (roofPointX >= wallStartX && roofPointX <= wallEndX) {
            const x = (roofPointX - wallCenterX) / wallLength;
            const y = getYOnEdge(roofEdges, roofPointX);
            if (y !== null) {
              if (i === 0) {
                wallHeights.centerLeft = [x, y];
              } else if (i === 1) {
                wallHeights.center = [x, y];
              } else if (i === 2) {
                wallHeights.centerRight = [x, y];
              }
            }
          }
        }

        map.set(id, wallHeights);
      }
    }

    return map;
  };

  const getSideWallHeightsMap = (
    composedWalls: ComposedWall[],
    topZ: number,
    frontRidgePoint: number[],
    topRidgePoint: number[],
    backRidgePoint: number[],
  ) => {
    const map = new Map<string, WallHeights>();
    setSideWallHeightsMap(map, composedWalls, 1, topZ, frontRidgePoint, topRidgePoint, backRidgePoint);
    setSideWallHeightsMap(map, composedWalls, 3, topZ, frontRidgePoint, topRidgePoint, backRidgePoint);
    return map;
  };

  const updateWalls = (
    composedWalls: ComposedWall[],
    topZ: number,
    frontRidgePoint: number[],
    topRidgePoint: number[],
    backRidgePoint: number[],
  ) => {
    const frontWallsIdSet = new Set(composedWalls[0].wallsId);
    const backWallsIdSet = new Set(composedWalls[2].wallsId);
    const sideWallHeightsMap = getSideWallHeightsMap(
      composedWalls,
      topZ,
      frontRidgePoint,
      topRidgePoint,
      backRidgePoint,
    );
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && e.foundationId === parentId) {
          if (frontWallsIdSet.has(e.id)) {
            const wall = e as WallModel;
            const { lh, rh } = getWallHeight(composedWalls, 0);
            wall.roofId = id;
            wall.leftRoofHeight = lh;
            wall.rightRoofHeight = rh;
          } else if (backWallsIdSet.has(e.id)) {
            const wall = e as WallModel;
            const { lh, rh } = getWallHeight(composedWalls, 2);
            wall.roofId = id;
            wall.leftRoofHeight = lh;
            wall.rightRoofHeight = rh;
          } else if (sideWallHeightsMap.has(e.id)) {
            const wallHeights = sideWallHeightsMap.get(e.id);
            if (wallHeights) {
              const wall = e as WallModel;
              const { left, right, center, centerLeft, centerRight } = wallHeights;
              wall.roofId = id;
              wall.leftRoofHeight = left;
              wall.rightRoofHeight = right;
              if (centerLeft) {
                const [x, y] = centerLeft;
                if (wall.centerLeftRoofHeight) {
                  wall.centerLeftRoofHeight[0] = x;
                  wall.centerLeftRoofHeight[1] = y;
                } else {
                  wall.centerLeftRoofHeight = [x, y];
                }
              } else {
                wall.centerLeftRoofHeight = undefined;
              }
              if (center) {
                const [x, y] = center;
                if (wall.centerRoofHeight) {
                  wall.centerRoofHeight[0] = x;
                  wall.centerRoofHeight[1] = y;
                } else {
                  wall.centerRoofHeight = [x, y];
                }
              } else {
                wall.centerRoofHeight = undefined;
              }
              if (centerRight) {
                const [x, y] = centerRight;
                if (wall.centerRightRoofHeight) {
                  wall.centerRightRoofHeight[0] = x;
                  wall.centerRightRoofHeight[1] = y;
                } else {
                  wall.centerRightRoofHeight = [x, y];
                }
              } else {
                wall.centerRightRoofHeight = undefined;
              }
            }
          }
        }
      }
    });
  };

  // update walls
  useEffect(() => {
    if (!isFirstMountRef.current || useStore.getState().addedRoofId === id) {
      if (composedWalls && composedWalls.length === 4) {
        if (isFlat) {
          updateFlatRoofWalls(composedWalls);
        } else {
          // update caused by changing wall height
          updateWalls(composedWalls, topZ, frontRidgePoint, topRidgePoint, backRidgePoint);
        }
      } else {
        removeElementById(id, false, false);
      }
      if (useStore.getState().addedRoofId === id) {
        useStore.getState().setAddedRoofId(null);
      }
    }
  }, [composedWalls, topZ, isFlat, frontRidgePoint, topRidgePoint, backRidgePoint]);

  const updateElementOnRoofFlag = useStore(Selector.updateElementOnRoofFlag);

  useEffect(() => {
    if (!isFirstMountRef.current) {
      updateRooftopElements(foundation, id, roofSegments, centroid, topZ, thickness, isFlat);
    }
  }, [composedWalls, updateElementOnRoofFlag, topZ, thickness, topRidgePoint, frontRidgePoint, backRidgePoint, isFlat]);

  useEffect(() => {
    isFirstMountRef.current = false;
  }, []);

  const updateSegmentVerticesWithoutOverhangMap = () => {
    const segmentVertices: Vector3[][] = [];
    if (!composedWalls || composedWalls.length !== 4) return segmentVertices;

    const wallPoints = composedWalls.map(
      (w, i, arr) => new Vector3(w.leftPoint.x, w.leftPoint.y, getWallHeight(arr, i).lh),
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

    if (isFlat) {
      useStore.getState().setRoofSegmentVerticesWithoutOverhang(id, [wallPoints]);
    } else {
      useStore.getState().setRoofSegmentVerticesWithoutOverhang(id, segmentVertices);
    }
  };

  const updateSegmentVertices = useUpdateSegmentVerticesMap(id, centroid, roofSegments, isFlat, RoofType.Gambrel);
  useUpdateSegmentVerticesWithoutOverhangMap(updateSegmentVerticesWithoutOverhangMap);

  const selectMe = useStore(Selector.selectMe);
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const getHeatmap = useDataStore(Selector.getHeatmap);
  const [flatHeatmapTexture, setFlatHeatmapTexture] = useState<CanvasTexture | null>(null);
  const [heatmapTextures, setHeatmapTextures] = useState<CanvasTexture[]>([]);

  useEffect(() => {
    if (showSolarRadiationHeatmap) {
      if (isFlat) {
        const heatmap = getHeatmap(id);
        if (heatmap) {
          const t = Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5);
          if (t) {
            // obtain the bounding rectangle
            const segmentVertices = updateSegmentVertices();
            if (segmentVertices && segmentVertices.length > 0 && foundation) {
              const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
              let minX = Number.MAX_VALUE;
              let minY = Number.MAX_VALUE;
              let maxX = -Number.MAX_VALUE;
              let maxY = -Number.MAX_VALUE;
              for (const s of segmentVertices) {
                for (const v of s) {
                  const v2 = v.clone().applyEuler(euler);
                  if (v2.x > maxX) maxX = v2.x;
                  if (v2.x < minX) minX = v2.x;
                  if (v2.y > maxY) maxY = v2.y;
                  if (v2.y < minY) minY = v2.y;
                }
              }
              const dx = maxX - minX;
              const dy = maxY - minY;
              const vcx = (minX + maxX) / 2;
              const vcy = (minY + maxY) / 2;
              t.wrapT = t.wrapS = RepeatWrapping;
              t.offset.set(-minX / dx, -minY / dy);
              t.center.set(vcx / dx, vcy / dy);
              t.rotation = -foundation.rotation[2];
              t.repeat.set(1 / dx, 1 / dy);
            }
            setFlatHeatmapTexture(t);
          }
        }
      } else {
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
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue]);

  // used for move rooftop elements between different roofs, passed to handlePointerMove in roofRenderer
  const userData: RoofSegmentGroupUserData = {
    roofId: id,
    foundation: foundation,
    centroid: centroid,
    roofSegments: roofSegments,
  };
  const topLayerColor = textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white';

  if (!composedWalls || composedWalls.length !== 4) return null;

  return (
    <group position={[cx, cy, cz]} rotation={[0, 0, rotation]} name={`Gambrel Roof Group ${id}`}>
      {/* roof segments */}
      <group
        name={`Gambrel Roof Segments Group ${id}`}
        position={[centroid.x, centroid.y, centroid.z]}
        userData={userData}
        onPointerDown={(e) => {
          handlePointerDown(e, id, foundation, roofSegments, centroid);
        }}
        onPointerMove={(e) => {
          handlePointerMove(e, id);
        }}
        onPointerUp={(e) => {
          handlePointerUp(e, roofModel);
        }}
        onContextMenu={(e) => {
          handleContextMenu(e, id);
        }}
      >
        {isFlat ? (
          <FlatRoof
            id={id}
            foundationModel={foundation as FoundationModel}
            roofType={roofType}
            roofSegments={roofSegments}
            center={new Vector3(centroid.x, centroid.y, topZ)}
            thickness={thickness}
            lineWidth={lineWidth}
            lineColor={lineColor}
            sideColor={sideColor}
            color={topLayerColor}
            textureType={textureType}
            heatmap={flatHeatmapTexture}
          />
        ) : (
          <>
            {roofSegments.map((segment, index, arr) => {
              return (
                <RoofSegment
                  id={id}
                  key={index}
                  index={index}
                  foundationModel={foundation as FoundationModel}
                  roofType={roofType}
                  segment={segment}
                  centroid={centroid}
                  thickness={thickness}
                  color={topLayerColor}
                  sideColor={sideColor}
                  texture={texture}
                  heatmap={heatmapTextures && index < heatmapTextures.length ? heatmapTextures[index] : undefined}
                />
              );
            })}
            <GambrelRoofWireframe
              roofSegments={roofSegments}
              thickness={thickness}
              lineColor={lineColor}
              lineWidth={lineWidth}
            />
          </>
        )}
      </group>

      {/* ceiling */}
      {ceiling && riseInnerState > 0 && composedWalls[0].lz === composedWalls[2].lz && ceilingPoints && (
        <Ceiling cz={composedWalls[0].lz} points={ceilingPoints} />
      )}

      {/* handles */}
      {selected && !locked && (
        <group position={[centroid.x, centroid.y, centroid.z + thickness]}>
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
              useRefStore.getState().setEnableOrbitController(false);
              setCommonStore((state) => {
                state.resizeHandleType = ResizeHandleType.Top;
                state.selectedElementHeight = topZ + roofModel.thickness;
              });
            }}
            onPointerOver={() => {
              setCommonStore((state) => {
                state.hoveredHandle = RoofHandleType.TopMid;
                state.selectedElementHeight = topZ + roofModel.thickness;
                state.selectedElementX = topRidgeMidPointV3.x;
                state.selectedElementY = topRidgeMidPointV3.y;
              });
            }}
          />
          {!isFlat && (
            <>
              <RoofHandle
                position={[topRidgeLeftPointV3.x, topRidgeLeftPointV3.y, topRidgeLeftPointV3.z]}
                onPointerDown={() => {
                  isPointerDownRef.current = true;
                  oldRidgeVal.current = [...topRidgePoint];
                  setInterSectionPlane(topRidgeLeftPointV3, composedWalls[3]);
                  setRoofHandleType(RoofHandleType.TopLeft);
                }}
              />
              <RoofHandle
                position={[topRidgeRightPointV3.x, topRidgeRightPointV3.y, topRidgeRightPointV3.z]}
                onPointerDown={() => {
                  isPointerDownRef.current = true;
                  oldRidgeVal.current = [...topRidgePoint];
                  setInterSectionPlane(topRidgeRightPointV3, composedWalls[1]);
                  setRoofHandleType(RoofHandleType.TopRight);
                }}
              />
              <RoofHandle
                position={[frontRidgeLeftPointV3.x, frontRidgeLeftPointV3.y, frontRidgeLeftPointV3.z]}
                onPointerDown={() => {
                  isPointerDownRef.current = true;
                  oldRidgeVal.current = [...frontRidgePoint];
                  setInterSectionPlane(frontRidgeLeftPointV3, composedWalls[3]);
                  setRoofHandleType(RoofHandleType.FrontLeft);
                }}
              />
              <RoofHandle
                position={[frontRidgeRightPointV3.x, frontRidgeRightPointV3.y, frontRidgeRightPointV3.z]}
                onPointerDown={() => {
                  isPointerDownRef.current = true;
                  oldRidgeVal.current = [...frontRidgePoint];
                  setInterSectionPlane(frontRidgeRightPointV3, composedWalls[1]);
                  setRoofHandleType(RoofHandleType.FrontRight);
                }}
              />

              <RoofHandle
                position={[backRidgeLeftPointV3.x, backRidgeLeftPointV3.y, backRidgeLeftPointV3.z]}
                onPointerDown={() => {
                  isPointerDownRef.current = true;
                  oldRidgeVal.current = [...backRidgePoint];
                  setInterSectionPlane(backRidgeLeftPointV3, composedWalls[1]);
                  setRoofHandleType(RoofHandleType.BackLeft);
                }}
              />
              <RoofHandle
                position={[backRidgeRightPointV3.x, backRidgeRightPointV3.y, backRidgeRightPointV3.z]}
                onPointerDown={() => {
                  isPointerDownRef.current = true;
                  oldRidgeVal.current = [...backRidgePoint];
                  setInterSectionPlane(backRidgeRightPointV3, composedWalls[3]);
                  setRoofHandleType(RoofHandleType.BackRight);
                }}
              />
            </>
          )}
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
            if (
              intersectionPlaneRef.current &&
              isPointerDownRef.current &&
              composedWalls &&
              composedWalls.length === 4
            ) {
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
                    const newTopZ = highestWallHeight + newRise;
                    const sideWallHeightsMap = getSideWallHeightsMap(
                      composedWalls,
                      newTopZ,
                      frontRidgePoint,
                      topRidgePoint,
                      backRidgePoint,
                    );
                    // check if new height no confilc with childs on walls
                    if (isRoofValid(sideWallHeightsMap, parentId)) {
                      setRiseInnerState(newRise);
                      // the vertical ruler needs to display the latest rise when the handle is being dragged
                      useStore.getState().updateRoofRiseById(id, riseInnerState, newTopZ + roofModel.thickness);
                    }
                    break;
                  }
                  case RoofHandleType.FrontLeft: {
                    if (foundation && composedWalls && composedWalls.length === 4) {
                      const px = Util.clamp(
                        getRelPos(foundation, composedWalls[3], point),
                        topRidgePoint[0] + 0.05,
                        0.45,
                      );
                      const hDiff = topZ - composedWalls[0].lz;
                      const pz = Util.clamp((point.z - foundation.lz - composedWalls[0].lz) / hDiff, 0, 1);
                      const newFrontRidgePoint = [px, pz];

                      const sideWallHeightsMap = getSideWallHeightsMap(
                        composedWalls,
                        topZ,
                        newFrontRidgePoint,
                        topRidgePoint,
                        backRidgePoint,
                      );
                      if (isRoofValid(sideWallHeightsMap, parentId)) {
                        setCommonStore((state) => {
                          const roof = state.elements.find((e) => isThisIdAndType(e)) as GambrelRoofModel;
                          if (!roof) return;
                          roof.frontRidgePoint[0] = newFrontRidgePoint[0];
                          roof.frontRidgePoint[1] = newFrontRidgePoint[1];
                        });
                      }
                    }
                    break;
                  }
                  case RoofHandleType.FrontRight: {
                    if (foundation && composedWalls && composedWalls.length === 4) {
                      const px = Util.clamp(
                        getRelPos(foundation, composedWalls[1], point),
                        -0.45,
                        -topRidgePoint[0] - 0.05,
                      );
                      const hDiff = topZ - composedWalls[0].lz;
                      const pz = Util.clamp((point.z - foundation.lz - composedWalls[0].lz) / hDiff, 0, 1);
                      const newFrontRidgePoint = [-px, pz];

                      const sideWallHeightsMap = getSideWallHeightsMap(
                        composedWalls,
                        topZ,
                        newFrontRidgePoint,
                        topRidgePoint,
                        backRidgePoint,
                      );
                      if (isRoofValid(sideWallHeightsMap, parentId)) {
                        setCommonStore((state) => {
                          const roof = state.elements.find((e) => isThisIdAndType(e)) as GambrelRoofModel;
                          if (!roof) return;
                          roof.frontRidgePoint = [...newFrontRidgePoint];
                        });
                      }
                    }
                    break;
                  }
                  case RoofHandleType.TopLeft: {
                    if (foundation && composedWalls && composedWalls.length === 4) {
                      const px = Util.clamp(
                        getRelPos(foundation, composedWalls[3], point),
                        -backRidgePoint[0] + 0.05,
                        frontRidgePoint[0] - 0.05,
                      );
                      const newTopRidgePoint = [px, topRidgePoint[1]];

                      const sideWallHeightsMap = getSideWallHeightsMap(
                        composedWalls,
                        topZ,
                        frontRidgePoint,
                        newTopRidgePoint,
                        backRidgePoint,
                      );
                      if (isRoofValid(sideWallHeightsMap, parentId)) {
                        setCommonStore((state) => {
                          const roof = state.elements.find((e) => isThisIdAndType(e)) as GambrelRoofModel;
                          if (!roof) return;
                          roof.topRidgePoint = [...newTopRidgePoint];
                        });
                      }
                    }
                    break;
                  }
                  case RoofHandleType.TopRight: {
                    if (foundation && composedWalls && composedWalls.length === 4) {
                      const px = Util.clamp(
                        getRelPos(foundation, composedWalls[1], point),
                        -frontRidgePoint[0] + 0.05,
                        backRidgePoint[0] - 0.05,
                      );
                      const newTopRidgePoint = [-px, topRidgePoint[1]];

                      const sideWallHeightsMap = getSideWallHeightsMap(
                        composedWalls,
                        topZ,
                        frontRidgePoint,
                        newTopRidgePoint,
                        backRidgePoint,
                      );
                      if (isRoofValid(sideWallHeightsMap, parentId)) {
                        setCommonStore((state) => {
                          const roof = state.elements.find((e) => isThisIdAndType(e)) as GambrelRoofModel;
                          if (!roof) return;
                          roof.topRidgePoint = [...newTopRidgePoint];
                        });
                      }
                    }
                    break;
                  }
                  case RoofHandleType.BackLeft: {
                    if (foundation && composedWalls && composedWalls.length === 4) {
                      const px = Util.clamp(
                        getRelPos(foundation, composedWalls[1], point),
                        -topRidgePoint[0] + 0.05,
                        0.45,
                      );
                      const hDiff = topZ - composedWalls[2].lz;
                      const pz = Util.clamp((point.z - foundation.lz - composedWalls[2].lz) / hDiff, 0, 1);
                      const newBackRidgePoint = [px, pz];
                      const sideWallHeightsMap = getSideWallHeightsMap(
                        composedWalls,
                        topZ,
                        frontRidgePoint,
                        topRidgePoint,
                        newBackRidgePoint,
                      );
                      if (isRoofValid(sideWallHeightsMap, parentId)) {
                        setCommonStore((state) => {
                          const roof = state.elements.find((e) => isThisIdAndType(e)) as GambrelRoofModel;
                          if (!roof) return;
                          roof.backRidgePoint = [...newBackRidgePoint];
                        });
                      }
                    }
                    break;
                  }
                  case RoofHandleType.BackRight: {
                    if (foundation && composedWalls && composedWalls.length === 4) {
                      const px = Util.clamp(
                        getRelPos(foundation, composedWalls[3], point),
                        -0.45,
                        topRidgePoint[0] - 0.05,
                      );
                      const hDiff = topZ - composedWalls[2].lz;
                      const pz = Util.clamp((point.z - foundation.lz - composedWalls[2].lz) / hDiff, 0, 1);
                      const newBackRidgePoint = [-px, pz];

                      const sideWallHeightsMap = getSideWallHeightsMap(
                        composedWalls,
                        topZ,
                        frontRidgePoint,
                        topRidgePoint,
                        newBackRidgePoint,
                      );
                      if (isRoofValid(sideWallHeightsMap, parentId)) {
                        setCommonStore((state) => {
                          const roof = state.elements.find((e) => isThisIdAndType(e)) as GambrelRoofModel;
                          if (!roof) return;
                          roof.backRidgePoint = [...newBackRidgePoint];
                        });
                      }
                    }
                    break;
                  }
                }
                updateRooftopElements(foundation, id, roofSegments, centroid, topZ, thickness, isFlat);
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
                handleUndoableResizeRidge(id, roofHandleType, oldRidgeVal.current, topRidgePoint);
                break;
              }
              case RoofHandleType.FrontLeft:
              case RoofHandleType.FrontRight: {
                handleUndoableResizeRidge(id, roofHandleType, oldRidgeVal.current, frontRidgePoint);
                break;
              }
              case RoofHandleType.BackLeft:
              case RoofHandleType.BackRight: {
                handleUndoableResizeRidge(id, roofHandleType, oldRidgeVal.current, backRidgePoint);
                break;
              }
            }
            isPointerDownRef.current = false;
            setEnableIntersectionPlane(false);
            setRoofHandleType(RoofHandleType.Null);
            useRefStore.getState().setEnableOrbitController(true);
            useStore.getState().updateRoofRiseById(id, riseInnerState, topZ + roofModel.thickness);
            updateRooftopElements(foundation, id, roofSegments, centroid, topZ, thickness, isFlat);
          }}
        >
          <meshBasicMaterial side={DoubleSide} transparent={true} opacity={0.5} />
        </Plane>
      )}
    </group>
  );
};

export default React.memo(GambrelRoof);
