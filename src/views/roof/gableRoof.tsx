/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Extrude, Line, Plane } from '@react-three/drei';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GableRoofModel, RoofModel, RoofStructure, RoofType } from 'src/models/RoofModel';
import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import {
  BufferGeometry,
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
import { useStoreRef } from 'src/stores/commonRef';
import { useThree } from '@react-three/fiber';
import { HALF_PI } from 'src/constants';
import { ElementModel } from 'src/models/ElementModel';
import {
  addUndoableResizeRoofHeight,
  RoofSegmentProps,
  handleContextMenu,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  handleRoofBodyPointerDown,
  RoofHandle,
  RoofWireframeProps,
  updateRooftopElements,
} from './roofRenderer';
import { UnoableResizeGableRoofRidge } from 'src/undo/UndoableResize';
import { ObjectType, RoofTexture } from 'src/types';
import { Util } from 'src/Util';
import { Point2 } from 'src/models/Point2';
import { RoofUtil } from './RoofUtil';
import {
  useCurrWallArray,
  useRoofHeight,
  useRoofTexture,
  useElementUndoable,
  useTransparent,
  useUpdateSegmentVerticesMap,
} from './hooks';
import { ConvexGeometry } from 'src/js/ConvexGeometry';
import { CSG } from 'three-csg-ts';
import WindowWireFrame from '../window/windowWireFrame';

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
  wallArray: WallModel[];
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
  overhang,
  height,
  isShed,
  width,
  spacing,
  color,
}: RafterProps) => {
  const [frontWall, rightWall, backWall, leftWall] = wallArray;

  const ridgeUnitVector = useMemo(() => new Vector3().subVectors(ridgeRightPoint, ridgeLeftPoint).normalize(), []);

  const ridgeLeftPointAfterOverhang = useMemo(
    () => ridgeLeftPoint.clone().add(ridgeUnitVector.clone().multiplyScalar(-overhang / 2)),
    [ridgeLeftPoint, overhang],
  );

  const ridgeRightPointAfterOverhang = useMemo(
    () => ridgeRightPoint.clone().add(ridgeUnitVector.clone().multiplyScalar(overhang / 2)),
    [ridgeLeftPoint, overhang],
  );

  const frontWallLeftPoint = frontWall
    ? new Vector3(frontWall.leftPoint[0], frontWall.leftPoint[1], frontWall.lz)
    : new Vector3();
  const backWallRightPoint = backWall
    ? new Vector3(backWall.rightPoint[0], backWall.rightPoint[1], backWall.lz)
    : new Vector3();

  const array = useMemo(() => {
    if (wallArray.length < 4) {
      return [];
    }

    const frontWallUnitVector = new Vector3()
      .subVectors(new Vector3(frontWall.rightPoint[0], frontWall.rightPoint[1], frontWall.lz), frontWallLeftPoint)
      .normalize();

    const backWallUnitVector = new Vector3()
      .subVectors(new Vector3(backWall.leftPoint[0], backWall.leftPoint[1], backWall.lz), backWallRightPoint)
      .normalize();

    const ridgeLength = ridgeLeftPoint.distanceTo(ridgeRightPoint);
    const frontWallLength = frontWall.lx;
    const backWallLength = backWall.lx;

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
      const frontOverhang = new Vector3().subVectors(front, ridge).normalize().multiplyScalar(overhang);
      const backOverhang = new Vector3().subVectors(back, ridge).normalize().multiplyScalar(overhang);
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
  roofType,
  roofStructure,
  rafterSpacing = 2,
  rafterWidth = 0.1,
  rafterColor = 'white',
  glassTint = '#73D8FF',
  opacity = 0.5,
}: GableRoofModel) => {
  const setCommonStore = useStore(Selector.set);
  const getElementById = useStore(Selector.getElementById);
  const removeElementById = useStore(Selector.removeElementById);
  const updateElementOnRoofFlag = useStore(Selector.updateElementOnRoofFlag);
  const fileChanged = useStore(Selector.fileChanged);

  const { gl, camera } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);

  const currentWallArray = useCurrWallArray(wallsId[0]);

  const initMinHeight = () =>
    currentWallArray.length === 4 ? Math.max(currentWallArray[0].lz, currentWallArray[2].lz) : lz / 2;

  const { h, setH, minHeight, setMinHeight, relHeight, setRelHeight } = useRoofHeight(lz, initMinHeight());

  const [showIntersectionPlane, setShowIntersectionPlane] = useState(false);
  const [roofHandleType, setRoofHandleType] = useState<RoofHandleType>(RoofHandleType.Null);
  const [isShed, setIsShed] = useState(false);

  const intersectionPlaneRef = useRef<Mesh>(null);
  const oldHeight = useRef<number>(h);
  const oldRelativeHeightRef = useRef<number>(relHeight.current);
  const oldRidgeLeft = useRef<number>(ridgeLeftPoint[0]);
  const oldRidgeRight = useRef<number>(ridgeRightPoint[0]);
  const isPointerMovingRef = useRef(false);
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    if (!isFirstMountRef.current) {
      updateRooftopElements(foundation, id, roofSegments, centroid, h, thickness);
    }
  }, [updateElementOnRoofFlag, h, thickness, ridgeLeftPoint, ridgeRightPoint]);

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
    const height = ph * (h - minHeight.current) + minHeight.current;
    return new Vector3(wall.cx, wall.cy, height).add(v.applyEuler(e));
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
    return currentWallArray.map((wall) => RoofUtil.getWallNormal(wall).multiplyScalar(overhang));
  }, [currentWallArray, overhang]);

  const thicknessVector = useMemo(() => {
    return zVector3.clone().multiplyScalar(thickness);
  }, [thickness]);

  const roofSegments = useMemo(() => {
    const segments: RoofSegmentProps[] = [];

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

      const { lh: frontWallLh, rh: frontWallRh } = getWallHeight(shiftedWallArray, 0);
      const { lh: backWallLh, rh: backWallRh } = getWallHeight(shiftedWallArray, 2);

      const d0 = RoofUtil.getDistance(wallPoint0, wallPoint1, wallPoint3);
      const overhangHeight0 = Math.min((overhang / d0) * (h - frontWallLh), frontWallLh);

      const d1 = RoofUtil.getDistance(wallPoint0, wallPoint1, wallPoint2);
      const overhangHeight1 = Math.min((overhang / d1) * (h - frontWallRh), frontWallRh);

      const d2 = RoofUtil.getDistance(wallPoint2, wallPoint3, wallPoint1);
      const overhangHeight2 = Math.min((overhang / d2) * (h - frontWallRh), backWallLh);

      const d3 = RoofUtil.getDistance(wallPoint2, wallPoint3, wallPoint0);
      const overhangHeight3 = Math.min((overhang / d3) * (h - frontWallLh), backWallRh);

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
        .setZ(h + overhangHeight2)
        .sub(centroid);

      const backWallRightPointAfterOverhang = RoofUtil.getIntersectionPoint(
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

      const length = new Vector3(frontWall.cx, frontWall.cy).sub(ridgeMidPoint.clone().setZ(0)).length();
      segments.push({ points, angle: -frontWall.relativeAngle, length });

      setIsShed(true);
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
      const { lh: frontWallLh, rh: frontWallRh } = getWallHeight(currentWallArray, 0);

      const d0 = RoofUtil.getDistance(wallPoint0, wallPoint1, ridgeLeftPointV3);
      const overhangHeight0 = Math.min((overhang / d0) * (ridgeLeftPointV3.z - frontWallLh), frontWallLh);

      const d1 = RoofUtil.getDistance(wallPoint0, wallPoint1, ridgeRightPointV3);
      const overhangHeight1 = Math.min((overhang / d1) * (ridgeRightPointV3.z - frontWallRh), frontWallRh);

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

      const frontLength = new Vector3(frontWall.cx, frontWall.cy).sub(centroid.clone().setZ(0)).length();
      segments.push({ points: frontPoints, angle: -frontWall.relativeAngle, length: frontLength });

      // back
      const backPoints: Vector3[] = [];
      const { lh: backWallLh, rh: backWallRh } = getWallHeight(currentWallArray, 2);
      const d2 = RoofUtil.getDistance(wallPoint2, wallPoint3, ridgeRightPointV3);
      const overhangHeight2 = Math.min((overhang / d2) * (ridgeRightPointV3.z - backWallLh), backWallLh);

      const d3 = RoofUtil.getDistance(wallPoint2, wallPoint3, ridgeLeftPointV3);
      const overhangHeight3 = Math.min((overhang / d3) * (ridgeLeftPointV3.z - backWallRh), backWallRh);

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

      const backLength = new Vector3(backWall.cx, backWall.cy).sub(centroid.clone().setZ(0)).length();
      segments.push({ points: backPoints, angle: -backWall.relativeAngle, length: backLength });

      setIsShed(false);
    }

    return segments;
  }, [currentWallArray, ridgeLeftPointV3, ridgeRightPointV3, h, overhang, thickness]);

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
    if (!isFirstMountRef.current || useStore.getState().addedRoofId === id) {
      if (currentWallArray.length === 4) {
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.type !== ObjectType.Wall) continue;
            const w = e as WallModel;
            switch (e.id) {
              case currentWallArray[0].id: {
                const { lh, rh } = getWallHeight(currentWallArray, 0);
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
                const { lh, rh } = getWallHeight(currentWallArray, 1);
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
                const { lh, rh } = getWallHeight(currentWallArray, 2);
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
                const { lh, rh } = getWallHeight(currentWallArray, 3);
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
        const minHeight = Math.max(currentWallArray[0].lz, currentWallArray[2].lz);
        setMinHeight(minHeight);
        if (isShed) {
          setH(minHeight);
          useStore.getState().updateRoofHeightById(id, minHeight);
        } else {
          setH(minHeight + relHeight.current);
          useStore.getState().updateRoofHeightById(id, minHeight + relHeight.current);
        }
      } else {
        removeElementById(id, false);
      }
      if (useStore.getState().addedRoofId === id) {
        useStore.getState().setAddedRoofId(null);
      }
    }
  }, [currentWallArray, h, ridgeLeftPoint, ridgeRightPoint]);

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
    <group position={[cx, cy, cz]} rotation={[0, 0, rotation]} name={`Gable Roof Group ${id}`}>
      {/* roof segments group */}
      <group
        name={'Gable Roof Segments Group'}
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
          const { points, angle, length } = segment;
          const [leftRoof, rightRoof, rightRidge, leftRidge] = points;
          const isFlat = Math.abs(leftRoof.z) < 0.1;
          return (
            <RoofSegment
              key={i}
              index={i}
              id={id}
              points={points}
              angle={isFlat ? arr[0].angle : angle}
              length={isFlat ? 1 : length}
              textureType={textureType}
              heatmaps={heatmapTextures}
              color={color}
              roofStructure={roofStructure}
              glassTint={glassTint}
              opacity={opacity}
              currWall={i === 0 ? currentWallArray[0] : currentWallArray[2]}
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

      {/* rafter */}
      {roofStructure === RoofStructure.Rafter && (
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
            wallArray={currentWallArray}
            overhang={overhang}
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
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              setShowIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeMidPoint.x, ridgeMidPoint.y, h);
              if (foundation) {
                const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - foundation.rotation[2];
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Mid);
              useStoreRef.getState().setEnableOrbitController(false);
              oldHeight.current = h;
              oldRelativeHeightRef.current = relHeight.current;
            }}
          />
          {/* side handles */}
          <RoofHandle
            position={[ridgeLeftPointV3.x, ridgeLeftPointV3.y, ridgeLeftPointV3.z + 0.15]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeLeft.current = ridgeLeftPoint[0];
              oldRidgeRight.current = ridgeRightPoint[0];
              setShowIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeLeftPointV3.x, ridgeLeftPointV3.y, h);
              if (foundation && currentWallArray[3]) {
                const dir = new Vector3().subVectors(ridgeLeftPointV3, camera.position).normalize();
                const rX = Math.atan2(dir.z, Math.hypot(dir.x, dir.y));
                const rZ = currentWallArray[3].relativeAngle;
                intersectionPlaneRotation.set(-HALF_PI + rX, 0, rZ, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Left);
              useStoreRef.getState().setEnableOrbitController(false);
            }}
          />
          <RoofHandle
            position={[ridgeRightPointV3.x, ridgeRightPointV3.y, ridgeRightPointV3.z + 0.15]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeLeft.current = ridgeLeftPoint[0];
              oldRidgeRight.current = ridgeRightPoint[0];
              setShowIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeRightPointV3.x, ridgeRightPointV3.y, h);
              if (foundation && currentWallArray[1]) {
                const dir = new Vector3().subVectors(ridgeRightPointV3, camera.position).normalize();
                const rX = Math.atan2(dir.z, Math.hypot(dir.x, dir.y));
                const rZ = currentWallArray[1].relativeAngle;
                intersectionPlaneRotation.set(-HALF_PI + rX, 0, rZ, 'ZXY');
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
                        if (RoofUtil.isRoofValid(id, currentWallArray[3].id, currentWallArray[1].id, [x, h])) {
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
                        if (RoofUtil.isRoofValid(id, currentWallArray[1].id, currentWallArray[3].id, [x, h])) {
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
                    let height = point.z - (foundation?.lz ?? 0) - 0.3;
                    if (isShed) {
                      if (currentWallArray.length === 4 && currentWallArray[3].centerRoofHeight !== undefined) {
                        const idx = currentWallArray[3].centerRoofHeight[0] < 0 ? 0 : 2;
                        height = Math.max(currentWallArray[idx].lz, height);
                        if (
                          RoofUtil.isRoofValid(id, currentWallArray[3].id, currentWallArray[1].id, [
                            ridgeLeftPoint[0],
                            height,
                          ])
                        ) {
                          useStore.getState().updateWallHeightById(currentWallArray[(idx + 2) % 4].id, height);
                        }
                      }
                    } else {
                      height = Math.max(0, height);
                      if (
                        RoofUtil.isRoofValid(id, currentWallArray[3].id, currentWallArray[1].id, [
                          ridgeLeftPoint[0],
                          height,
                        ])
                      ) {
                        setRelHeight(height - minHeight.current);
                        setH(height);
                      }
                    }
                    break;
                  }
                }
                updateRooftopElements(foundation, id, roofSegments, centroid, h, thickness);
              }
            }
          }}
          onPointerUp={() => {
            switch (roofHandleType) {
              case RoofHandleType.Mid: {
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
                if (e.id === id && e.type === ObjectType.Roof && (e as RoofModel).roofType === RoofType.Gable) {
                  (e as GableRoofModel).lz = h;
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

const RoofSegment = ({
  index,
  id,
  points,
  angle,
  length,
  textureType,
  heatmaps,
  color,
  currWall,
  roofStructure,
  glassTint,
  opacity = 0.5,
}: {
  index: number;
  id: string;
  points: Vector3[];
  angle: number;
  length: number;
  textureType: RoofTexture;
  heatmaps: CanvasTexture[];
  color: string | undefined;
  currWall: WallModel;
  roofStructure?: RoofStructure;
  glassTint?: string;
  opacity?: number;
}) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const showSolarRadiationHeatmap = useStore(Selector.showSolarRadiationHeatmap);
  const texture = useRoofTexture(roofStructure === RoofStructure.Rafter ? RoofTexture.NoTexture : textureType);
  const { transparent, opacity: _opacity } = useTransparent(roofStructure === RoofStructure.Rafter, opacity);
  const { invalidate } = useThree();

  const surfaceMeshRef = useRef<Mesh>(null);
  const bulkMeshRef = useRef<Mesh>(null);
  const planeRef = useRef<Mesh>(null);
  const mullionRef = useRef<Mesh>(null);

  const [mullionLx, setMullionLx] = useState(0);
  const [mullionLz, setMullionLz] = useState(0);
  const [show, setShow] = useState(true);

  const checkValid = (v1: Vector3, v2: Vector3) => {
    return v1.clone().setZ(0).distanceTo(v2.clone().setZ(0)) > 2;
  };

  const isNorthWest = (wall: WallModel) => {
    return (
      Math.abs(wall.relativeAngle) < Math.PI / 4 ||
      Math.abs(wall.relativeAngle - Math.PI * 2) < Math.PI / 4 ||
      Math.abs(wall.relativeAngle - Math.PI) < Math.PI / 4
    );
  };

  useEffect(() => {
    const [wallLeft, wallRight, ridgeRight, ridgeLeft, wallLeftAfterOverhang] = points;
    const thickness = wallLeftAfterOverhang.z - wallLeft.z;

    if (surfaceMeshRef.current) {
      const geo = new BufferGeometry();
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
      const scale = showSolarRadiationHeatmap ? 1 : 5;
      uvs.push(0, 0);
      uvs.push(scale, 0);
      uvs.push(scale, scale);
      uvs.push(scale, scale);
      uvs.push(0, scale);
      uvs.push(0, 0);
      geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
      surfaceMeshRef.current.geometry = geo;
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

        if (isNorthWest(currWall)) {
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
  }, [points, angle, length, currWall, show, showSolarRadiationHeatmap]);

  return (
    <>
      {((_opacity > 0 && roofStructure === RoofStructure.Rafter) || roofStructure !== RoofStructure.Rafter) && (
        <>
          <mesh
            ref={surfaceMeshRef}
            uuid={id + '-' + index}
            name={'Gable Roof Surface'}
            castShadow={shadowEnabled && !transparent}
            receiveShadow={shadowEnabled}
            userData={{ simulation: true }}
          >
            {showSolarRadiationHeatmap && index < heatmaps.length ? (
              <meshBasicMaterial map={heatmaps[index]} color={'white'} />
            ) : (
              <meshStandardMaterial
                map={texture}
                color={textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white'}
                transparent={transparent}
                opacity={_opacity}
                side={DoubleSide}
              />
            )}
          </mesh>
          <mesh ref={bulkMeshRef} name={'Gable Roof Bulk'} castShadow={false} receiveShadow={false}>
            <meshStandardMaterial color={'white'} transparent={transparent} opacity={_opacity} />
          </mesh>
        </>
      )}
      {roofStructure === RoofStructure.Glass && show && (
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
      )}
    </>
  );
};

export default React.memo(GableRoof);
