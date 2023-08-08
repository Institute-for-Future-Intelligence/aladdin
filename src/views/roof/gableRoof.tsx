/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import { Cone, Extrude, Line, Plane } from '@react-three/drei';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GableRoofModel, RoofModel, RoofStructure, RoofType } from 'src/models/RoofModel';
import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import {
  CanvasTexture,
  DoubleSide,
  Euler,
  Float32BufferAttribute,
  Mesh,
  Raycaster,
  Shape,
  Vector2,
  Vector3,
} from 'three';
import { useRefStore } from 'src/stores/commonRef';
import { useThree } from '@react-three/fiber';
import {
  DEFAULT_HEAT_FLUX_COLOR,
  DEFAULT_HEAT_FLUX_DENSITY_FACTOR,
  DEFAULT_HEAT_FLUX_SCALE_FACTOR,
  DEFAULT_HEAT_FLUX_WIDTH,
  HALF_PI,
  UNIT_VECTOR_POS_Z,
} from 'src/constants';
import { ElementModel } from 'src/models/ElementModel';
import {
  addUndoableResizeRoofRise,
  handleContextMenu,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  handleRoofBodyPointerDown,
  RoofHandle,
  RoofSegmentProps,
  RoofWireframeProps,
  updateRooftopElements,
  RoofSegmentGroupUserData,
  areRoofsEqual,
} from './roofRenderer';
import { UnoableResizeGableRoofRidge } from 'src/undo/UndoableResize';
import { ActionType, ObjectType, ResizeHandleType, RoofHandleType, RoofTexture } from 'src/types';
import { Util } from 'src/Util';
import { Point2 } from 'src/models/Point2';
import { RoofUtil } from './RoofUtil';
import {
  ComposedWall,
  useComposedWallArray,
  useIsFirstMount,
  useComposedRoofHeight,
  useRoofTexture,
  useTransparent,
  useUpdateOldRoofFiles,
  useUpdateSegmentVerticesMap,
  useUpdateSegmentVerticesWithoutOverhangMap,
} from './hooks';
import { ConvexGeometry } from 'src/js/ConvexGeometry';
import { CSG } from 'three-csg-ts';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { BuildingParts, FoundationModel } from '../../models/FoundationModel';
import { useDataStore } from '../../stores/commonData';
import { BufferRoofSegment, WindowData } from './roofSegment';
import Ceiling from './ceiling';
import { WindowModel, WindowType } from 'src/models/WindowModel';
import { WallHeights, isRoofValid } from './gambrelRoof';
import shallow from 'zustand/shallow';

const intersectionPlanePosition = new Vector3();
const intersectionPlaneRotation = new Euler();
const zeroVector2 = new Vector2();
const zVector3 = new Vector3(0, 0, 1);

interface RafterUnitProps {
  start: Vector3;
  end: Vector3;
  width: number;
  height: number;
  color: string;
  offset?: Vector3;
}
interface RafterProps {
  ridgeLeftPoint: Vector3;
  ridgeRightPoint: Vector3;
  wallArray: ComposedWall[];
  overhang: number;
  isShed: boolean;
  height: number;
  width: number;
  spacing: number;
  color: string;
}

const RafterUnit = React.memo(({ start, end, width, height, offset, color }: RafterUnitProps) => {
  const startV2 = useMemo(() => new Vector2(start.x, start.y), [start]);
  const endV2 = useMemo(() => new Vector2(end.x, end.y), [end]);

  const rotationZ = useMemo(() => new Vector2().subVectors(endV2, startV2).angle(), [startV2, endV2]);

  const shape = useMemo(() => {
    const s = new Shape();

    const x = startV2.distanceTo(endV2);
    const y = start.z - end.z;

    s.moveTo(0, 0);
    s.lineTo(x, -y);
    s.lineTo(x, -y + height);
    s.lineTo(0, height);
    s.closePath();

    return s;
  }, [start, end, startV2, endV2, height]);

  return (
    <group position={offset}>
      <Extrude
        args={[shape, { steps: 1, depth: width, bevelEnabled: false }]}
        position={start}
        rotation={[HALF_PI, 0, rotationZ, 'ZXY']}
        castShadow={true}
        receiveShadow={true}
      >
        <meshStandardMaterial color={color} />
      </Extrude>
    </group>
  );
});

const Rafter = ({
  ridgeLeftPoint,
  ridgeRightPoint,
  wallArray,
  // overhang,
  height,
  isShed,
  width,
  spacing,
  color,
}: RafterProps) => {
  const [frontWall, rightWall, backWall, leftWall] = wallArray;

  const ridgeUnitVector = useMemo(() => new Vector3().subVectors(ridgeRightPoint, ridgeLeftPoint).normalize(), []);

  const ridgeLeftPointAfterOverhang = useMemo(
    () => ridgeLeftPoint.clone().add(ridgeUnitVector.clone().multiplyScalar(-(leftWall.eavesLength ?? 0) / 2)),
    [ridgeLeftPoint, leftWall.eavesLength],
  );

  const ridgeRightPointAfterOverhang = useMemo(
    () => ridgeRightPoint.clone().add(ridgeUnitVector.clone().multiplyScalar((rightWall.eavesLength ?? 0) / 2)),
    [ridgeLeftPoint, rightWall.eavesLength],
  );

  const frontWallLeftPoint = frontWall.leftPoint.clone().setZ(frontWall.lz);
  const backWallRightPoint = backWall.rightPoint.clone().setZ(backWall.lz);

  const array = useMemo(() => {
    if (wallArray.length < 4) {
      return [];
    }

    const frontWallUnitVector = new Vector3()
      .subVectors(new Vector3(frontWall.rightPoint.x, frontWall.rightPoint.y, frontWall.lz), frontWallLeftPoint)
      .normalize();

    const backWallUnitVector = new Vector3()
      .subVectors(new Vector3(backWall.leftPoint.x, backWall.leftPoint.y, backWall.lz), backWallRightPoint)
      .normalize();

    const ridgeLength = ridgeLeftPoint.distanceTo(ridgeRightPoint);
    const frontWallLength = new Vector3().subVectors(frontWall.leftPoint, frontWall.rightPoint).length();
    const backWallLength = new Vector3().subVectors(backWall.leftPoint, backWall.rightPoint).length();

    const offset = width;
    const number = Math.floor((Math.min(ridgeLength, frontWallLength, backWallLength) - width) / spacing) + 2;
    return new Array(number).fill(0).map((v, i) => {
      let len;
      if (i === number - 1) {
        len = ridgeLength;
      } else {
        len = i * spacing + offset;
      }
      const ridge = ridgeLeftPoint.clone().add(ridgeUnitVector.clone().multiplyScalar(len));
      const front = frontWallLeftPoint.clone().add(frontWallUnitVector.clone().multiplyScalar(len));
      const back = backWallRightPoint.clone().add(backWallUnitVector.clone().multiplyScalar(len));
      const frontOverhang = new Vector3()
        .subVectors(front, ridge)
        .normalize()
        .multiplyScalar(frontWall.eavesLength ?? 0);
      const backOverhang = new Vector3()
        .subVectors(back, ridge)
        .normalize()
        .multiplyScalar(backWall.eavesLength ?? 0);
      front.add(frontOverhang);
      back.add(backOverhang);
      return { ridge, front, back };
    });
  }, [spacing, ridgeLeftPoint]);

  const showFront = ridgeLeftPoint.distanceTo(frontWallLeftPoint) > ridgeLeftPoint.distanceTo(backWallRightPoint);

  const offset = new Vector3(-width, 0, 0);
  const offsetTop = new Vector3(0, width / 2, 0);

  return (
    <>
      {array.map((v, i) => (
        <React.Fragment key={i}>
          {isShed ? (
            showFront ? (
              <RafterUnit start={v.ridge} end={v.front} width={width} height={height} color={color} />
            ) : (
              <RafterUnit start={v.ridge} end={v.back} width={width} height={height} color={color} />
            )
          ) : (
            <>
              <RafterUnit start={v.ridge} end={v.front} width={width} height={height} color={color} />
              <RafterUnit start={v.ridge} end={v.back} width={width} height={height} color={color} offset={offset} />
            </>
          )}
        </React.Fragment>
      ))}
      <RafterUnit
        start={ridgeLeftPointAfterOverhang}
        end={ridgeRightPointAfterOverhang}
        width={width}
        height={height}
        color={color}
        offset={offsetTop}
      />
    </>
  );
};

const GableRoofWireframe = React.memo(({ roofSegments, thickness, lineWidth, lineColor }: RoofWireframeProps) => {
  if (roofSegments.length === 0) {
    return null;
  }
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

interface GableRoofProps extends BuildingParts {
  roofModel: GableRoofModel;
}

const GableRoof = ({ roofModel, foundationModel }: GableRoofProps) => {
  let {
    id,
    parentId,
    cx,
    cy,
    lz,
    wallsId,
    selected,
    ridgeLeftPoint,
    ridgeRightPoint,
    textureType,
    color = 'white',
    sideColor = 'white',
    thickness = 0.2,
    locked,
    lineColor = 'black',
    lineWidth = 0.2,
    roofStructure,
    rafterSpacing = 2,
    rafterWidth = 0.1,
    rafterColor = 'white',
    glassTint = '#73D8FF',
    opacity = 0.5,
    rise = lz,
    ceiling = false,
  } = roofModel;
  const setCommonStore = useStore(Selector.set);
  const removeElementById = useStore(Selector.removeElementById);
  const updateElementOnRoofFlag = useStore(Selector.updateElementOnRoofFlag);

  const { gl, camera } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);

  const composedWalls = useComposedWallArray(wallsId[0], parentId);

  const { highestWallHeight, topZ, riseInnerState, setRiseInnerState } = useComposedRoofHeight(
    composedWalls,
    rise,
    true,
  );
  useUpdateOldRoofFiles(roofModel, highestWallHeight);

  const [showIntersectionPlane, setShowIntersectionPlane] = useState(false);
  const [roofHandleType, setRoofHandleType] = useState<RoofHandleType>(RoofHandleType.Null);

  const isShed = Math.abs(ridgeLeftPoint[0]) > 0.45;

  const intersectionPlaneRef = useRef<Mesh>(null);
  const oldRidgeLeft = useRef<number>(ridgeLeftPoint[0]);
  const oldRidgeRight = useRef<number>(ridgeRightPoint[0]);
  const oldRiseRef = useRef(rise);
  const isPointerDownRef = useRef(false);

  const isFirstMount = useIsFirstMount();

  useEffect(() => {
    if (!isFirstMount) {
      updateRooftopElements(foundationModel, id, roofSegments, centroid, topZ, thickness);
    }
  }, [updateElementOnRoofFlag, topZ, thickness, ridgeLeftPoint, ridgeRightPoint, isFirstMount]);

  const updateRoofTopRidge = (elemId: string, left: number, right: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === elemId && e.type === ObjectType.Roof && (e as RoofModel).roofType === RoofType.Gable) {
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

  const getRelPos = (foundation: ElementModel, wall: ComposedWall, point: Vector3) => {
    const foundationCenter = new Vector2(foundation.cx, foundation.cy);
    const wallCenter = new Vector3().addVectors(wall.leftPoint, wall.rightPoint).divideScalar(2);
    const wallLength = new Vector3().subVectors(wall.leftPoint, wall.rightPoint).length();
    const wallAbsCenter = new Vector2(wallCenter.x, wallCenter.y)
      .rotateAround(zeroVector2, foundation.rotation[2])
      .add(foundationCenter);
    const wallAbsAngle = foundation.rotation[2] + wall.relativeAngle;
    const p = new Vector2(point.x, point.y).sub(wallAbsCenter).rotateAround(zeroVector2, -wallAbsAngle);
    const x = p.x / wallLength;
    return Math.min(Math.abs(x), 0.5) * (x >= 0 ? 1 : -1);
  };

  const getRidgePoint = (wall: ComposedWall, px: number, ph: number) => {
    if (!wall) {
      return new Vector3();
    }
    const lx = new Vector3().subVectors(wall.leftPoint, wall.rightPoint).length();
    const center = new Vector3().addVectors(wall.leftPoint, wall.rightPoint).divideScalar(2);
    const e = new Euler(0, 0, wall.relativeAngle);
    const v = new Vector3(px * lx, 0, 0);
    const height = ph * riseInnerState + highestWallHeight;
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

  const centroid = useMemo(() => {
    if (composedWalls === null || composedWalls.length !== 4) return new Vector3();
    const points = composedWalls.map((w) => ({ x: w.leftPoint.x, y: w.leftPoint.y } as Point2));
    const p = Util.calculatePolygonCentroid(points);
    return new Vector3(p.x, p.y, topZ);
  }, [composedWalls, topZ]);

  const ridgeLeftPointV3 = useMemo(() => {
    if (composedWalls === null) return new Vector3();
    const leftComposedWall = composedWalls[3];
    const [x, h] = ridgeLeftPoint; // percent
    return getRidgePoint(leftComposedWall, x, h);
  }, [composedWalls, topZ, ridgeLeftPoint]);

  const ridgeRightPointV3 = useMemo(() => {
    if (composedWalls === null) return new Vector3();
    const rightComposedWall = composedWalls[1];
    const [x, h] = ridgeRightPoint; // percent
    return getRidgePoint(rightComposedWall, x, h);
  }, [composedWalls, topZ, ridgeRightPoint]);

  const ridgeMidPoint = useMemo(() => {
    return new Vector3(
      (ridgeLeftPointV3.x + ridgeRightPointV3.x) / 2,
      (ridgeLeftPointV3.y + ridgeRightPointV3.y) / 2,
      topZ,
    );
  }, [ridgeLeftPointV3, ridgeRightPointV3]);

  const overhangs = useMemo(() => {
    if (!composedWalls || composedWalls.length !== 4) return null;
    return composedWalls.map((wall) => RoofUtil.getComposedWallNormal(wall).multiplyScalar(wall.eavesLength));
  }, [composedWalls]);

  const thicknessVector = useMemo(() => {
    return zVector3.clone().multiplyScalar(thickness);
  }, [thickness]);

  const roofSegments = useMemo(() => {
    const segments: RoofSegmentProps[] = [];

    if (!composedWalls || composedWalls.length !== 4 || !overhangs) return segments;

    // shed roof
    if (isShed) {
      const points: Vector3[] = [];
      const idx = ridgeLeftPoint[0] < 0 ? 0 : 2;
      const shiftedWallArray = getShiftedArr(composedWalls, idx);
      const shiftedOverhangs = getShiftedArr(overhangs, idx);
      const [frontWall, rightWall, backWall, leftWall] = shiftedWallArray;
      const [frontOverhang, rightOverhang, backOverhang, leftOverhang] = shiftedOverhangs;
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
      const { lh: frontWallLh, rh: frontWallRh } = getWallHeight(shiftedWallArray, 0);
      const { lh: backWallLh, rh: backWallRh } = getWallHeight(shiftedWallArray, 2);
      const d0 = RoofUtil.getDistance(wallPoint0, wallPoint1, wallPoint3);
      const overhangHeight0 = Math.min(((frontWall.eavesLength ?? 0) / d0) * (topZ - frontWallLh), frontWallLh);
      const d1 = RoofUtil.getDistance(wallPoint0, wallPoint1, wallPoint2);
      const overhangHeight1 = Math.min(((frontWall.eavesLength ?? 0) / d1) * (topZ - frontWallRh), frontWallRh);
      const d2 = RoofUtil.getDistance(wallPoint2, wallPoint3, wallPoint1);
      const overhangHeight2 = Math.min(((backWall.eavesLength ?? 0) / d2) * (topZ - frontWallRh), backWallLh);
      const d3 = RoofUtil.getDistance(wallPoint2, wallPoint3, wallPoint0);
      const overhangHeight3 = Math.min(((backWall.eavesLength ?? 0) / d3) * (topZ - frontWallLh), backWallRh);
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
      const backWallLeftPointAfterOverhang = RoofUtil.getIntersectionPoint(
        rightWallLeftPointAfterOffset,
        rightWallRightPointAfterOffset,
        backWallLeftPointAfterOffset,
        backWallRightPointAfterOffset,
      )
        .setZ(topZ + overhangHeight2)
        .sub(centroid);
      const backWallRightPointAfterOverhang = RoofUtil.getIntersectionPoint(
        backWallLeftPointAfterOffset,
        backWallRightPointAfterOffset,
        leftWallLeftPointAfterOffset,
        leftWallRightPointAfterOffset,
      )
        .setZ(topZ + overhangHeight3)
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
      const frontWallCenter = new Vector3().addVectors(frontWall.leftPoint, frontWall.rightPoint).divideScalar(2);
      const length = frontWallCenter.clone().sub(ridgeMidPoint.clone().setZ(0)).length();
      segments.push({ points, angle: -frontWall.relativeAngle, length });
    }
    // gable roof
    else {
      const [frontWall, rightWall, backWall, leftWall] = composedWalls;
      const [frontOverhang, rightOverhang, backOverhang, leftOverhang] = overhangs;

      const frontWallLeftPointAfterOffset = frontWall.leftPoint.clone().add(frontOverhang);
      const frontWallRightPointAfterOffset = frontWall.rightPoint.clone().add(frontOverhang);
      const leftWallLeftPointAfterOffset = backWall.rightPoint.clone().add(leftOverhang);
      const leftWallRightPointAfterOffset = frontWall.leftPoint.clone().add(leftOverhang);
      const rightWallLeftPointAfterOffset = frontWall.rightPoint.clone().add(rightOverhang);
      const rightWallRightPointAfterOffset = backWall.leftPoint.clone().add(rightOverhang);
      const backWallLeftPointAfterOffset = backWall.leftPoint.clone().add(backOverhang);
      const backWallRightPointAfterOffset = backWall.rightPoint.clone().add(backOverhang);

      const ridgeLeftPointAfterOverhang = RoofUtil.getIntersectionPoint(
        ridgeLeftPointV3,
        ridgeRightPointV3,
        leftWallLeftPointAfterOffset.clone(),
        leftWallRightPointAfterOffset.clone(),
      )
        .setZ(ridgeLeftPointV3.z)
        .sub(centroid);

      const ridgeRightPointAfterOverhang = RoofUtil.getIntersectionPoint(
        ridgeLeftPointV3,
        ridgeRightPointV3,
        rightWallLeftPointAfterOffset.clone(),
        rightWallRightPointAfterOffset.clone(),
      )
        .setZ(ridgeRightPointV3.z)
        .sub(centroid);

      // front
      const frontPoints: Vector3[] = [];
      const { lh: frontWallLh, rh: frontWallRh } = getWallHeight(composedWalls, 0);

      const d0 = RoofUtil.getDistance(frontWall.leftPoint, frontWall.rightPoint, ridgeLeftPointV3);
      const overhangHeight0 = Math.min(
        ((frontWall.eavesLength ?? 0) / d0) * (ridgeLeftPointV3.z - frontWallLh),
        frontWallLh,
      );

      const d1 = RoofUtil.getDistance(frontWall.leftPoint, frontWall.rightPoint, ridgeRightPointV3);
      const overhangHeight1 = Math.min(
        ((frontWall.eavesLength ?? 0) / d1) * (ridgeRightPointV3.z - frontWallRh),
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

      const frontWallCenter = new Vector3().addVectors(frontWall.leftPoint, frontWall.rightPoint).divideScalar(2);
      const frontLength = frontWallCenter.clone().sub(centroid.clone().setZ(0)).length();
      segments.push({ points: frontPoints, angle: -frontWall.relativeAngle, length: frontLength });

      // back
      const backPoints: Vector3[] = [];
      const { lh: backWallLh, rh: backWallRh } = getWallHeight(composedWalls, 2);
      const d2 = RoofUtil.getDistance(backWall.leftPoint, backWall.rightPoint, ridgeRightPointV3);
      const overhangHeight2 = Math.min(
        ((backWall.eavesLength ?? 0) / d2) * (ridgeRightPointV3.z - backWallLh),
        backWallLh,
      );

      const d3 = RoofUtil.getDistance(backWall.leftPoint, backWall.rightPoint, ridgeLeftPointV3);
      const overhangHeight3 = Math.min(
        ((backWall.eavesLength ?? 0) / d3) * (ridgeLeftPointV3.z - backWallRh),
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

      const backWallCenter = new Vector3().addVectors(backWall.leftPoint, backWall.rightPoint).divideScalar(2);
      const backLength = backWallCenter.clone().sub(centroid.clone().setZ(0)).length();
      segments.push({ points: backPoints, angle: -backWall.relativeAngle, length: backLength });
    }
    return segments;
  }, [composedWalls, ridgeLeftPointV3, ridgeRightPointV3, topZ, thickness]);

  const ceilingPoints = useMemo(() => {
    if (!composedWalls || composedWalls.length !== 4) return null;
    return composedWalls.map((wall) => wall.leftPoint);
  }, [composedWalls]);

  const getY = (k: number, b: number, x: number) => {
    return k * x + b;
  };

  const setGabledWallHeightsMap = (
    map: Map<string, WallHeights>,
    composedWalls: ComposedWall[],
    index: number,
    topZ: number,
    ridgePoint: number[],
  ) => {
    const composedWall = composedWalls[index];
    const length = new Vector3().subVectors(composedWall.leftPoint, composedWall.rightPoint).length();
    const ridgeX = (ridgePoint[0] + 0.5) * length;
    const { lh, rh } = getWallHeight(composedWalls, index);
    const leftHalfK = (ridgePoint[1] * (topZ - lh)) / ridgeX;
    const leftHalfB = lh;
    const rightHalfK = -(ridgePoint[1] * (topZ - rh)) / (length - ridgeX);
    const rightHalfB = rh - rightHalfK * length;

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
      const [leftX, rightX] = [wallPointsX[i], wallPointsX[i + 1]];
      const wallLength = rightX - leftX;

      const wallHeights: WallHeights = { left: 0, right: 0 };
      if (leftX < ridgeX) {
        wallHeights.left = getY(leftHalfK, leftHalfB, leftX);
      } else if (leftX === ridgeX) {
        wallHeights.left = getY(rightHalfK, rightHalfB, leftX);
        wallHeights.center = [-0.5, topZ];
      } else {
        wallHeights.left = getY(rightHalfK, rightHalfB, leftX);
        wallHeights.center = undefined;
      }

      if (rightX < ridgeX) {
        wallHeights.right = getY(leftHalfK, leftHalfB, rightX);
        wallHeights.center = undefined;
      } else if (rightX === ridgeX) {
        wallHeights.right = getY(leftHalfK, leftHalfB, rightX);
        wallHeights.center = [0.5, topZ];
      } else {
        wallHeights.right = getY(rightHalfK, rightHalfB, rightX);
      }
      if (leftX < ridgeX && rightX > ridgeX) {
        wallHeights.center = [(ridgeX - leftX) / wallLength - 0.5, topZ];
      }

      map.set(id, wallHeights);
    }

    return map;
  };

  const getGabledWallsHeightsMap = (
    composedWalls: ComposedWall[],
    topZ: number,
    ridgeLeftPoint: number[],
    ridgeRightPoint: number[],
  ) => {
    const map = new Map<string, WallHeights>();
    setGabledWallHeightsMap(map, composedWalls, 1, topZ, ridgeRightPoint);
    setGabledWallHeightsMap(map, composedWalls, 3, topZ, ridgeLeftPoint);
    return map;
  };

  const updateWalls = (
    composedWalls: ComposedWall[],
    topZ: number,
    ridgeLeftPoint: number[],
    ridgeRightPoint: number[],
  ) => {
    const [frontWall, rightWall, backWall, leftWall] = composedWalls;

    const frontWallsIdSet = new Set(frontWall.wallsId);
    const backWallsIdSet = new Set(backWall.wallsId);
    const gabledWallsHeightsMap = getGabledWallsHeightsMap(composedWalls, topZ, ridgeLeftPoint, ridgeRightPoint);
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && e.foundationId === parentId) {
          if (frontWallsIdSet.has(e.id)) {
            const w = e as WallModel;
            w.roofId = id;
            if (ridgeLeftPoint[0] === 0.5) {
              w.leftRoofHeight = topZ;
              w.rightRoofHeight = topZ;
              w.centerRoofHeight = undefined;
            } else {
              const { lh, rh } = getWallHeight(composedWalls, 0);
              w.leftRoofHeight = lh;
              w.rightRoofHeight = rh;
            }
          } else if (backWallsIdSet.has(e.id)) {
            const w = e as WallModel;
            w.roofId = id;
            if (ridgeLeftPoint[0] === -0.5) {
              w.leftRoofHeight = topZ;
              w.rightRoofHeight = topZ;
              w.centerRoofHeight = undefined;
            } else {
              const { lh, rh } = getWallHeight(composedWalls, 2);
              w.leftRoofHeight = lh;
              w.rightRoofHeight = rh;
            }
          } else if (gabledWallsHeightsMap.has(e.id)) {
            const gabledWallHeights = gabledWallsHeightsMap.get(e.id);
            if (gabledWallHeights) {
              const wall = e as WallModel;
              const { left, right, center } = gabledWallHeights;
              wall.roofId = id;
              wall.leftRoofHeight = left;
              wall.rightRoofHeight = right;
              if (center) {
                const [x, h] = center;
                if (wall.centerRoofHeight) {
                  wall.centerRoofHeight[0] = x;
                  wall.centerRoofHeight[1] = h;
                } else {
                  wall.centerRoofHeight = [x, h];
                }
              } else {
                wall.centerRoofHeight = undefined;
              }
            }
          }
        }
      }
    });
  };

  useEffect(() => {
    if (!composedWalls || composedWalls.length !== 4) {
      removeElementById(id, false, false, true);
    } else {
      updateWalls(composedWalls, topZ, ridgeLeftPoint, ridgeRightPoint);
      updateRooftopElements(foundationModel, id, roofSegments, centroid, topZ, thickness);
    }
    if (useStore.getState().addedRoofId === id) {
      useStore.getState().setAddedRoofId(null);
    }
  }, [composedWalls, topZ, ridgeLeftPoint, ridgeRightPoint]);

  const updateSegmentVerticesWithoutOverhangMap = () => {
    if (!composedWalls || composedWalls.length !== 4) return;

    const segmentVertices: Vector3[][] = [];
    // shed roof
    if (isShed) {
      const idx = ridgeLeftPoint[0] < 0 ? 0 : 2;

      const shiftedWallArray = getShiftedArr(composedWalls, idx);

      const wallPoints = shiftedWallArray.map(
        (w, i, arr) => new Vector3(w.leftPoint.x, w.leftPoint.y, getWallHeight(arr, i).lh),
      );
      segmentVertices.push(wallPoints);
    }
    // gable roof
    else {
      const wallPoints = composedWalls.map(
        (w, i, arr) => new Vector3(w.leftPoint.x, w.leftPoint.y, getWallHeight(arr, i).lh),
      );
      segmentVertices.push([wallPoints[0], wallPoints[1], ridgeRightPointV3.clone(), ridgeLeftPointV3.clone()]);
      segmentVertices.push([wallPoints[2], wallPoints[3], ridgeLeftPointV3.clone(), ridgeRightPointV3.clone()]);
    }
    useStore.getState().setRoofSegmentVerticesWithoutOverhang(id, segmentVertices);
  };

  useUpdateSegmentVerticesMap(id, centroid, roofSegments, false, RoofType.Gable);
  useUpdateSegmentVerticesWithoutOverhangMap(updateSegmentVerticesWithoutOverhangMap);

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
    foundation: foundationModel,
    centroid: centroid,
    roofSegments: roofSegments,
  };

  if (composedWalls === null || composedWalls.length !== 4) return null;

  return (
    <group name={`Gable Roof Group ${id}`}>
      {/* roof segments group */}
      <group
        name={`Gable Roof Segments Group ${id}`}
        position={[centroid.x, centroid.y, centroid.z]}
        userData={userData}
        onPointerDown={(e) => {
          handlePointerDown(e, id, foundationModel, roofSegments, centroid);
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
        {roofSegments.map((segment, i, arr) => {
          const { points, angle, length } = segment;
          const isFlat = Math.abs(points[0].z) < 0.1;
          if (!composedWalls) return null;
          return (
            <RoofSegment
              key={i}
              index={i}
              id={id}
              points={points}
              centroid={centroid}
              angle={isFlat ? arr[0].angle : angle}
              length={isFlat ? 1 : length}
              textureType={textureType}
              heatmaps={heatmapTextures}
              color={color}
              sideColor={sideColor}
              roofStructure={roofStructure}
              glassTint={glassTint}
              opacity={opacity}
              relativeAngle={i === 0 ? composedWalls[0].relativeAngle : composedWalls[2].relativeAngle}
              foundation={foundationModel}
            />
          );
        })}

        {/* wireframe */}
        {opacity > 0 && (
          <GableRoofWireframe
            roofSegments={roofSegments}
            thickness={thickness}
            lineColor={lineColor}
            lineWidth={roofStructure === RoofStructure.Rafter ? 0.1 : lineWidth}
          />
        )}
      </group>

      {/* ceiling */}
      {ceiling && riseInnerState > 0 && composedWalls[0].lz === composedWalls[2].lz && ceilingPoints && (
        <Ceiling cz={composedWalls[0].lz} points={ceilingPoints} />
      )}

      {/* rafter */}
      {roofStructure === RoofStructure.Rafter && composedWalls && composedWalls.length === 4 && (
        <group
          onContextMenu={(e) => {
            handleContextMenu(e, id);
          }}
          onPointerDown={(e) => {
            handleRoofBodyPointerDown(e, id, parentId);
          }}
        >
          <Rafter
            ridgeLeftPoint={ridgeLeftPointV3}
            ridgeRightPoint={ridgeRightPointV3}
            wallArray={composedWalls}
            overhang={0}
            isShed={isShed}
            height={thickness}
            spacing={rafterSpacing}
            color={rafterColor}
            width={rafterWidth}
          />
        </group>
      )}

      {/* handles */}
      {selected && !locked && (
        <group position={[0, 0, thickness]}>
          {/* mid handle */}
          <RoofHandle
            position={[ridgeMidPoint.x, ridgeMidPoint.y, ridgeMidPoint.z + 0.15]}
            onPointerDown={(e) => {
              selectMe(roofModel.id, e, ActionType.Select);
              isPointerDownRef.current = true;
              oldRiseRef.current = rise;
              setShowIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeMidPoint.x, ridgeMidPoint.y, topZ);
              if (foundationModel) {
                const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - foundationModel.rotation[2];
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Mid);
              useRefStore.getState().setEnableOrbitController(false);
              setCommonStore((state) => {
                state.resizeHandleType = ResizeHandleType.Top;
                state.selectedElementHeight = topZ + roofModel.thickness;
              });
            }}
            onPointerOver={() => {
              setCommonStore((state) => {
                state.hoveredHandle = RoofHandleType.Mid;
                state.selectedElementHeight = topZ + roofModel.thickness;
                state.selectedElementX = ridgeMidPoint.x;
                state.selectedElementY = ridgeMidPoint.y;
              });
            }}
          />
          {/* side handles */}
          <RoofHandle
            position={[ridgeLeftPointV3.x, ridgeLeftPointV3.y, ridgeLeftPointV3.z + 0.15]}
            onPointerDown={() => {
              isPointerDownRef.current = true;
              oldRidgeLeft.current = ridgeLeftPoint[0];
              oldRidgeRight.current = ridgeRightPoint[0];
              setShowIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeLeftPointV3.x, ridgeLeftPointV3.y, topZ);
              if (foundationModel && composedWalls && composedWalls[3]) {
                const dir = new Vector3().subVectors(ridgeLeftPointV3, camera.position).normalize();
                const rX = Math.atan2(dir.z, Math.hypot(dir.x, dir.y));
                const rZ = composedWalls[3].relativeAngle;
                intersectionPlaneRotation.set(-HALF_PI + rX, 0, rZ, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Left);
              useRefStore.getState().setEnableOrbitController(false);
            }}
          />
          <RoofHandle
            position={[ridgeRightPointV3.x, ridgeRightPointV3.y, ridgeRightPointV3.z + 0.15]}
            onPointerDown={() => {
              isPointerDownRef.current = true;
              oldRidgeLeft.current = ridgeLeftPoint[0];
              oldRidgeRight.current = ridgeRightPoint[0];
              setShowIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeRightPointV3.x, ridgeRightPointV3.y, topZ);
              if (foundationModel && composedWalls && composedWalls[1]) {
                const dir = new Vector3().subVectors(ridgeRightPointV3, camera.position).normalize();
                const rX = Math.atan2(dir.z, Math.hypot(dir.x, dir.y));
                const rZ = composedWalls[1].relativeAngle;
                intersectionPlaneRotation.set(-HALF_PI + rX, 0, rZ, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Right);
              useRefStore.getState().setEnableOrbitController(false);
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
            if (
              intersectionPlaneRef.current &&
              isPointerDownRef.current &&
              foundationModel &&
              composedWalls &&
              composedWalls.length === 4
            ) {
              setRayCast(e);
              const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
              if (intersects[0]) {
                const point = intersects[0].point;
                if (point.z < 0.001) {
                  return;
                }
                switch (roofHandleType) {
                  case RoofHandleType.Left: {
                    const wall = composedWalls[3];
                    if (wall) {
                      let x = getRelPos(foundationModel, wall, point);
                      if (Math.abs(x) >= 0.45 && Math.abs(x) < 0.5) {
                        x = 0.45 * Math.sign(x);
                      }
                      const newRidgeLeftPoint = [x, ridgeLeftPoint[1]];
                      const newRidgeRightPoint = [-x, ridgeRightPoint[1]];
                      const gabledWallsHeightsMap = getGabledWallsHeightsMap(
                        composedWalls,
                        topZ,
                        newRidgeLeftPoint,
                        newRidgeRightPoint,
                      );
                      if (isRoofValid(gabledWallsHeightsMap, parentId)) {
                        updateRoofTopRidge(id, x, -x);
                      }
                    }
                    break;
                  }
                  case RoofHandleType.Right: {
                    const wall = composedWalls[1];
                    if (wall) {
                      let x = getRelPos(foundationModel, wall, point);
                      if (Math.abs(x) >= 0.45 && Math.abs(x) < 0.5) {
                        x = 0.45 * Math.sign(x);
                      }
                      const newRidgeLeftPoint = [-x, ridgeLeftPoint[1]];
                      const newRidgeRightPoint = [x, ridgeRightPoint[1]];
                      const gabledWallsHeightsMap = getGabledWallsHeightsMap(
                        composedWalls,
                        topZ,
                        newRidgeLeftPoint,
                        newRidgeRightPoint,
                      );
                      if (isRoofValid(gabledWallsHeightsMap, parentId)) {
                        updateRoofTopRidge(id, -x, x);
                      }
                    }
                    break;
                  }
                  case RoofHandleType.Mid: {
                    let newRise: number;
                    if (isShed) {
                      newRise = Math.max(0, point.z - foundationModel.lz - 0.3 - highestWallHeight);
                    } else {
                      newRise = point.z - foundationModel.lz - 0.3 - highestWallHeight;
                    }
                    const newTopZ = highestWallHeight + newRise;
                    const gabledWallsHeightsMap = getGabledWallsHeightsMap(
                      composedWalls,
                      newTopZ,
                      ridgeLeftPoint,
                      ridgeRightPoint,
                    );
                    if (isRoofValid(gabledWallsHeightsMap, parentId)) {
                      setRiseInnerState(newRise);
                      // the vertical ruler needs to display the latest rise when the handle is being dragged
                      useStore.getState().updateRoofRiseById(id, riseInnerState, topZ + roofModel.thickness);
                    }
                    break;
                  }
                }
                updateRooftopElements(foundationModel, id, roofSegments, centroid, topZ, thickness);
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
                handleUndoableResizeTopRidge(
                  id,
                  oldRidgeLeft.current,
                  oldRidgeRight.current,
                  ridgeLeftPoint[0],
                  ridgeRightPoint[0],
                );
              }
            }
            isPointerDownRef.current = false;
            setShowIntersectionPlane(false);
            setRoofHandleType(RoofHandleType.Null);
            useRefStore.getState().setEnableOrbitController(true);
            useStore.getState().updateRoofRiseById(id, riseInnerState, topZ + roofModel.thickness);
            updateRooftopElements(foundationModel, id, roofSegments, centroid, topZ, thickness);
          }}
        >
          <meshBasicMaterial side={DoubleSide} transparent={true} opacity={0.5} />
        </Plane>
      )}
    </group>
  );
};

const RoofSegment = ({
  index,
  id,
  points,
  centroid,
  angle,
  length,
  textureType,
  heatmaps,
  color = 'white',
  sideColor,
  relativeAngle,
  foundation,
  roofStructure,
  glassTint,
  opacity = 0.5,
}: {
  index: number;
  id: string;
  points: Vector3[];
  centroid: Vector3;
  angle: number;
  length: number;
  textureType: RoofTexture;
  heatmaps: CanvasTexture[];
  color: string | undefined;
  sideColor: string | undefined;
  relativeAngle: number;
  foundation: FoundationModel | null;
  roofStructure?: RoofStructure;
  glassTint?: string;
  opacity?: number;
}) => {
  const world = useStore.getState().world;
  const getElementById = useStore(Selector.getElementById);
  const getChildrenOfType = useStore(Selector.getChildrenOfType);
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const showHeatFluxes = usePrimitiveStore(Selector.showHeatFluxes);
  const heatFluxScaleFactor = useStore(Selector.viewState.heatFluxScaleFactor);
  const heatFluxColor = useStore(Selector.viewState.heatFluxColor);
  const heatFluxWidth = useStore(Selector.viewState.heatFluxWidth);
  const getRoofSegmentVerticesWithoutOverhang = useStore(Selector.getRoofSegmentVerticesWithoutOverhang);
  const hourlyHeatExchangeArrayMap = useDataStore.getState().hourlyHeatExchangeArrayMap;

  const texture = useRoofTexture(roofStructure === RoofStructure.Rafter ? RoofTexture.NoTexture : textureType);
  const { transparent, opacity: _opacity } = useTransparent(roofStructure === RoofStructure.Rafter, opacity);
  const { invalidate } = useThree();

  const heatmapMeshRef = useRef<Mesh>(null);
  const bulkMeshRef = useRef<Mesh>(null);
  const planeRef = useRef<Mesh>(null);
  const mullionRef = useRef<Mesh>(null);
  const heatFluxArrowHead = useRef<number>(0);
  const heatFluxArrowLength = useRef<Vector3>();
  const heatFluxArrowEuler = useRef<Euler>();

  const [mullionLx, setMullionLx] = useState(0);
  const [mullionLz, setMullionLz] = useState(0);
  const [show, setShow] = useState(true);

  const checkValid = (v1: Vector3, v2: Vector3) => {
    return v1.clone().setZ(0).distanceTo(v2.clone().setZ(0)) > 2;
  };

  const isNorthWest = (relativeAngle: number) => {
    return (
      Math.abs(relativeAngle) < Math.PI / 4 ||
      Math.abs(relativeAngle - Math.PI * 2) < Math.PI / 4 ||
      Math.abs(relativeAngle - Math.PI) < Math.PI / 4
    );
  };

  const overhangLines: Vector3[][] | undefined = useMemo(() => {
    if (!showHeatFluxes) return undefined;
    const segments = getRoofSegmentVerticesWithoutOverhang(id);
    if (!segments) return undefined;
    const lines: Vector3[][] = [];
    const [wallLeft, wallRight, ridgeRight, ridgeLeft, wallLeftAfterOverhang] = points;
    const thickness = wallLeftAfterOverhang.z - wallLeft.z;
    const thicknessVector = new Vector3(0, 0, thickness + 0.1);
    for (const seg of segments.values()) {
      let p: Vector3[] = [];
      p.push(seg[0].clone().sub(centroid).add(thicknessVector));
      p.push(seg[1].clone().sub(centroid).add(thicknessVector));
      lines.push(p);
      p = [];
      p.push(seg[0].clone().sub(centroid).add(thicknessVector));
      p.push(seg[3].clone().sub(centroid).add(thicknessVector));
      lines.push(p);
      p = [];
      p.push(seg[1].clone().sub(centroid).add(thicknessVector));
      p.push(seg[2].clone().sub(centroid).add(thicknessVector));
      lines.push(p);
    }
    return lines;
  }, [showHeatFluxes]);

  const heatFluxes: Vector3[][] | undefined = useMemo(() => {
    if (!showHeatFluxes) return undefined;
    if (foundation && foundation.notBuilding) return undefined;
    const heat = hourlyHeatExchangeArrayMap.get(id + '-' + index);
    if (!heat) return undefined;
    const sum = heat.reduce((a, b) => a + b, 0);
    const segments = getRoofSegmentVerticesWithoutOverhang(id);
    if (!segments || !segments[index]) return undefined;
    const [wallLeft, wallRight, ridgeRight, ridgeLeft, wallLeftAfterOverhang] = points;
    const thickness = wallLeftAfterOverhang.z - wallLeft.z;
    const s = segments[index].map((v) => v.clone().sub(centroid).add(new Vector3(0, 0, thickness)));
    if (!s) return undefined;
    let area = Util.getTriangleArea(s[0], s[1], s[2]) + Util.getTriangleArea(s[2], s[3], s[0]);
    if (area === 0) return undefined;
    let windows = getChildrenOfType(ObjectType.Window, id);
    const segmentsWithoutOverhang = getRoofSegmentVerticesWithoutOverhang(id);
    if (segmentsWithoutOverhang && segmentsWithoutOverhang[index]) {
      windows = windows.filter((e) => {
        const w = e as WindowModel;
        const wcy = w.cy + (w.windowType === WindowType.Polygonal && w.polygonTop ? w.polygonTop[1] / 2 : 0);
        return RoofUtil.onSegment(segmentsWithoutOverhang[index], e.cx, wcy);
      });
    }
    if (windows && windows.length > 0) {
      for (const w of windows) {
        area -= Util.getWindowArea(w as WindowModel);
      }
    }
    const cellSize = DEFAULT_HEAT_FLUX_DENSITY_FACTOR * (world.solarRadiationHeatmapGridCellSize ?? 0.5);
    const s0 = s[0].clone();
    const s1 = s[1].clone();
    const s2 = s[2].clone();
    const v10 = new Vector3().subVectors(s1, s0);
    const v20 = new Vector3().subVectors(s2, s0);
    const v21 = new Vector3().subVectors(s2, s1);
    const length10 = v10.length();
    // find the distance from top to the edge: https://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
    const distance = new Vector3().crossVectors(v20, v21).length() / length10;
    const m = Math.max(2, Math.round(length10 / cellSize));
    const n = Math.max(2, Math.round(distance / cellSize));
    v10.normalize();
    v20.normalize();
    v21.normalize();
    // find the normal vector of the quad
    const normal = new Vector3().crossVectors(v20, v21).normalize();
    // find the incremental vector going along the bottom edge (half of length)
    const dm = v10.multiplyScalar((0.5 * length10) / m);
    // find the incremental vector going from bottom to top (half of length)
    const dn = new Vector3()
      .crossVectors(normal, v10)
      .normalize()
      .multiplyScalar((0.5 * distance) / n);
    // find the starting point of the grid (shift half of length in both directions)
    const v0 = s0.clone().add(dm).add(dn);
    // double half-length to full-length for the increment vectors in both directions
    dm.multiplyScalar(2);
    dn.multiplyScalar(2);
    const intensity = (sum / area) * (heatFluxScaleFactor ?? DEFAULT_HEAT_FLUX_SCALE_FACTOR);
    heatFluxArrowHead.current = intensity < 0 ? 1 : 0;
    heatFluxArrowLength.current = normal.clone().multiplyScalar(0.1);
    heatFluxArrowEuler.current = Util.getEuler(UNIT_VECTOR_POS_Z, normal, 'YXZ', -Math.sign(intensity) * HALF_PI);
    const vectors: Vector3[][] = [];
    const origin = new Vector3();
    let isRoof;
    for (let p = 0; p < m; p++) {
      const dmp = dm.clone().multiplyScalar(p);
      for (let q = 0; q < n; q++) {
        origin.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
        isRoof = true;
        if (windows && windows.length > 0) {
          // add the centroid back as the vertices of the window are not relative to it
          const ox = origin.x + centroid.x;
          const oy = origin.y + centroid.y;
          for (const w of windows) {
            const vertices = RoofUtil.getRelativeWindowVerticesOnRoof(w as WindowModel);
            const points = Util.getPoints(vertices);
            if (Util.isPointInside(ox, oy, points)) {
              isRoof = false;
              break;
            }
          }
        }
        if (isRoof) {
          const v: Vector3[] = [];
          if (intensity < 0) {
            v.push(origin.clone());
            v.push(origin.clone().add(normal.clone().multiplyScalar(-intensity)));
          } else {
            v.push(origin.clone());
            v.push(origin.clone().add(normal.clone().multiplyScalar(intensity)));
          }
          vectors.push(v);
        }
      }
    }
    return vectors;
  }, [showHeatFluxes, heatFluxScaleFactor, centroid, points]);

  const windows: WindowData[] = useStore(
    (state) =>
      state.elements
        .filter((e) => e.parentId === id && e.type === ObjectType.Window)
        .map((e) => {
          const w = e as WindowModel;
          return {
            dimension: new Vector3(w.lx, w.lz, w.ly * 2),
            position: new Vector3(w.cx, w.cy, w.cz).sub(centroid),
            rotation: new Euler().fromArray([...w.rotation, 'ZXY']),
            windowType: w.windowType,
            archHeight: w.archHeight,
            topPosition: w.polygonTop,
          };
        }),
    shallow,
  );

  useEffect(() => {
    const [wallLeft, wallRight, ridgeRight, ridgeLeft, wallLeftAfterOverhang] = points;
    const thickness = wallLeftAfterOverhang.z - wallLeft.z;

    if (heatmapMeshRef.current) {
      const geo = heatmapMeshRef.current.geometry;
      if (geo) {
        const positions = new Float32Array(18);
        const zOffset = thickness + 0.01; // a small number to ensure the surface mesh stay atop;
        positions[0] = points[0].x;
        positions[1] = points[0].y;
        positions[2] = points[0].z + zOffset;
        positions[3] = points[1].x;
        positions[4] = points[1].y;
        positions[5] = points[1].z + zOffset;
        positions[6] = points[2].x;
        positions[7] = points[2].y;
        positions[8] = points[2].z + zOffset;
        positions[9] = points[2].x;
        positions[10] = points[2].y;
        positions[11] = points[2].z + zOffset;
        positions[12] = points[3].x;
        positions[13] = points[3].y;
        positions[14] = points[3].z + zOffset;
        positions[15] = points[0].x;
        positions[16] = points[0].y;
        positions[17] = points[0].z + zOffset;
        // don't call geo.setFromPoints. It doesn't seem to work correctly.
        geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
        geo.computeVertexNormals();
        const uvs = [];
        uvs.push(0, 0);
        uvs.push(1, 0);
        uvs.push(1, 1);
        uvs.push(1, 1);
        uvs.push(0, 1);
        uvs.push(0, 0);
        geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
      }
    }

    if (bulkMeshRef.current) {
      bulkMeshRef.current.geometry = new ConvexGeometry(points, angle, length);
      const isValid = checkValid(wallLeft, ridgeLeft) && checkValid(wallRight, ridgeRight);
      setShow(isValid);

      if (roofStructure === RoofStructure.Glass && isValid) {
        const center = Util.calculatePolygonCentroid(points.map(Util.mapVector3ToPoint2));
        const centerV3 = new Vector3(center.x, center.y, 0);

        const width = 0.25;
        const wl = new Vector3().addVectors(
          wallLeft,
          centerV3.clone().sub(wallLeft).setZ(0).normalize().multiplyScalar(width),
        );
        const wr = new Vector3().addVectors(
          wallRight,
          centerV3.clone().sub(wallRight).setZ(0).normalize().multiplyScalar(width),
        );
        const rr = new Vector3().addVectors(
          ridgeRight,
          centerV3.clone().sub(ridgeRight).normalize().multiplyScalar(width),
        );
        const rl = new Vector3().addVectors(
          ridgeLeft,
          centerV3.clone().sub(ridgeLeft).normalize().multiplyScalar(width),
        );

        const h: Vector3[] = [];
        h.push(wl);
        h.push(wr);
        h.push(rr.setZ(wr.z));
        h.push(rl.setZ(wl.z));
        h.push(wl.clone().setZ(1));
        h.push(wr.clone().setZ(1));
        h.push(rr.clone().setZ(1));
        h.push(rl.clone().setZ(1));

        const holeMesh = new Mesh(new ConvexGeometry(h));
        const resMesh = CSG.subtract(bulkMeshRef.current, holeMesh);
        bulkMeshRef.current.geometry = resMesh.geometry;

        if (isNorthWest(relativeAngle)) {
          const lx = wl.distanceTo(wr);
          const ly = wallLeft.distanceTo(ridgeLeft);

          setMullionLx(lx);
          setMullionLz(ly);

          const rotationX = new Vector3().subVectors(wallLeft, ridgeLeft).angleTo(new Vector3(0, -1, 0));
          if (planeRef.current) {
            planeRef.current.scale.set(lx, ly, 1);
            planeRef.current.rotation.set(rotationX, 0, 0);
          }
          if (mullionRef.current) {
            mullionRef.current.rotation.set(rotationX - HALF_PI, 0, 0);
          }
        } else {
          const lx = wallLeft.distanceTo(ridgeLeft);
          const ly = wl.distanceTo(wr);

          setMullionLx(lx);
          setMullionLz(ly);

          const rotationY = new Vector3().subVectors(wallLeft, ridgeLeft).angleTo(new Vector3(1, 0, 0));
          if (planeRef.current) {
            planeRef.current.scale.set(lx, ly, 1);
            planeRef.current.rotation.set(0, rotationY, 0);
          }
          if (mullionRef.current) {
            mullionRef.current.rotation.set(HALF_PI, rotationY, 0, 'YXZ');
          }
        }

        const cz = (wallLeft.z + ridgeLeft.z) / 2 + thickness * 0.75;
        if (planeRef.current) {
          planeRef.current.position.set(center.x, center.y, cz);
        }
        if (mullionRef.current) {
          mullionRef.current.position.set(center.x, center.y, cz);
        }
      }
    }
    invalidate();
  }, [points, angle, length, relativeAngle, show, showSolarRadiationHeatmap, roofStructure]);

  // FIXME: Bulk mesh can be null if it is not initialized. Refreshing the page fixes the problem.

  const segment = { points: points, angle: angle, length: length };
  const topLayerColor = textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white';

  return (
    <>
      {((_opacity > 0 && roofStructure === RoofStructure.Rafter) || roofStructure !== RoofStructure.Rafter) && (
        <>
          <BufferRoofSegment
            id={id}
            index={index}
            segment={segment}
            color={topLayerColor}
            sideColor={sideColor ?? 'white'}
            texture={texture}
            heatmap={heatmaps[index]}
            transparent={transparent}
            opacity={_opacity}
            windows={windows}
          />
        </>
      )}
      {/* {roofStructure === RoofStructure.Glass && show && (
        <>
          {_opacity > 0 && (
            <Plane ref={planeRef}>
              <meshBasicMaterial side={DoubleSide} color={glassTint} opacity={opacity} transparent={true} />
            </Plane>
          )}
          <group ref={mullionRef}>
            <WindowWireFrame
              lx={mullionLx}
              lz={mullionLz}
              mullionWidth={0.05}
              mullionSpacing={2.5}
              mullionSpacingY={3}
            />
          </group>
        </>
      )} */}

      {overhangLines &&
        overhangLines.map((v, index) => {
          return (
            <Line
              key={index}
              points={v}
              color={'gray'}
              lineWidth={0.5}
              dashed={true}
              dashSize={0.2}
              gapSize={0.1}
              receiveShadow={false}
              castShadow={false}
              name={'Overhang Boundary ' + index}
            />
          );
        })}

      {heatFluxes &&
        heatFluxes.map((v, index) => {
          return (
            <React.Fragment key={index}>
              <Line
                points={v}
                name={'Heat Flux ' + index}
                lineWidth={heatFluxWidth ?? DEFAULT_HEAT_FLUX_WIDTH}
                color={heatFluxColor ?? DEFAULT_HEAT_FLUX_COLOR}
              />
              ;
              <Cone
                userData={{ unintersectable: true }}
                position={
                  heatFluxArrowLength.current
                    ? v[heatFluxArrowHead.current].clone().add(heatFluxArrowLength.current)
                    : v[0]
                }
                args={[0.06, 0.2, 4, 1]}
                name={'Normal Vector Arrow Head'}
                rotation={heatFluxArrowEuler.current ?? [0, 0, 0]}
              >
                <meshBasicMaterial attach="material" color={heatFluxColor ?? DEFAULT_HEAT_FLUX_COLOR} />
              </Cone>
            </React.Fragment>
          );
        })}
    </>
  );
};

export default React.memo(GableRoof, areRoofsEqual);
