/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Line, Plane, Sphere } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HALF_PI } from 'src/constants';
import { ElementModel } from 'src/models/ElementModel';
import { Point2 } from 'src/models/Point2';
import { MansardRoofModel } from 'src/models/RoofModel';
import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import * as Selector from 'src/stores/selector';
import { RoofTexture } from 'src/types';
import { UnoableResizeGambrelAndMansardRoofRidge } from 'src/undo/UndoableResize';
import { Util } from 'src/Util';
import { DoubleSide, Euler, Mesh, Vector2, Vector3 } from 'three';
import { ObjectType } from '../../types';
import {
  ConvexGeoProps as ConvexGeometryProps,
  getDistance,
  getIntersectionPoint,
  getNormal,
  handleRoofContextMenu,
  handleRoofPointerDown,
  handleUndoableResizeRoofHeight,
  isRoofValid,
  RoofWireframeProps,
  useRoofTexture,
} from './roofRenderer';

const intersectionPlanePosition = new Vector3();
const intersectionPlaneRotation = new Euler();
const zeroVector2 = new Vector2();
const zVector3 = new Vector3(0, 0, 1);

enum RoofHandleType {
  Top = 'Top',
  FrontLeft = 'FrontLeft',
  FrontRight = 'FrontRight',
  BackLeft = 'BackLeft',
  BackRight = 'BackRight',
  Null = 'Null',
}

const MansardRoofWirefram = React.memo(({ roofSegments, thickness, lineWidth, lineColor }: RoofWireframeProps) => {
  if (roofSegments.length === 0) {
    return null;
  }
  const peripheryPoints: Vector3[] = [];
  const thicknessVector = new Vector3(0, 0, thickness);

  for (let i = 0; i < roofSegments.length - 1; i++) {
    const [leftRoof, rightRoof, rightRidge, leftRidge] = roofSegments[i].points;
    peripheryPoints.push(leftRidge, leftRoof, rightRoof, rightRidge);
  }

  peripheryPoints.push(peripheryPoints[0]);

  const periphery = <Line points={peripheryPoints} lineWidth={lineWidth} color={lineColor} />;
  const ridges = (
    <>
      <Line points={[roofSegments[0].points[2], roofSegments[0].points[3]]} lineWidth={lineWidth} color={lineColor} />
      <Line points={[roofSegments[1].points[2], roofSegments[1].points[3]]} lineWidth={lineWidth} color={lineColor} />
    </>
  );

  const isFlat = Math.abs(roofSegments[0].points[0].z) < 0.015;

  return (
    <>
      {periphery}
      {!isFlat && ridges}
      <group position={[0, 0, thickness]}>
        {periphery}
        {!isFlat && ridges}
      </group>
      {roofSegments.slice(0, 2).map((segment, idx) => {
        const [leftRoof, rightRoof] = segment.points;
        return (
          <group key={idx}>
            <Line points={[leftRoof, leftRoof.clone().add(thicknessVector)]} lineWidth={lineWidth} color={lineColor} />
            <Line
              points={[rightRoof, rightRoof.clone().add(thicknessVector)]}
              lineWidth={lineWidth}
              color={lineColor}
            />
          </group>
        );
      })}
    </>
  );
});

const MansardRoof = ({
  parentId,
  id,
  wallsId,
  cx,
  cy,
  cz,
  lz,
  frontRidge,
  backRidge,
  selected,
  textureType,
  color,
  overhang,
  thickness,
  locked,
  lineColor = 'black',
  lineWidth = 0.2,
}: MansardRoofModel) => {
  const texture = useRoofTexture(textureType);

  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);
  const removeElementById = useStore(Selector.removeElementById);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const elements = useStore(Selector.elements); // todo: could optimize
  const ray = useStore((state) => state.ray);
  const mouse = useStore((state) => state.mouse);

  const [h, setH] = useState(lz);
  const [minHeight, setMinHeight] = useState(lz / 1.5);
  const [enableIntersectionPlane, setEnableIntersectionPlane] = useState(false);
  const [roofHandleType, setRoofHandleType] = useState(RoofHandleType.Null);
  const oldHeight = useRef<number>(h);
  const oldRidgeVal = useRef<number>(0);

  const intersectionPlaneRef = useRef<Mesh>(null);
  const isPointerMovingRef = useRef(false);
  const { gl, camera } = useThree();

  const parent = getElementById(parentId);
  let rotation = 0;
  if (parent) {
    cx = parent.cx;
    cy = parent.cy;
    cz = parent.lz;
    rotation = parent.rotation[2];
  }

  useEffect(() => {
    if (h < minHeight) {
      setH(minHeight);
    }
  }, [minHeight]);

  useEffect(() => {
    setH(lz);
  }, [lz]);

  const getWallPoint = (wallArray: WallModel[]) => {
    const arr: Point2[] = [];
    for (const w of wallArray) {
      if (w.leftPoint[0] && w.leftPoint[1]) {
        arr.push({ x: w.leftPoint[0], y: w.leftPoint[1] });
      }
    }
    return arr;
  };

  const getRidgePoint = (wall: WallModel, px: number) => {
    if (!wall) {
      return new Vector3();
    }
    const e = new Euler(0, 0, wall.relativeAngle);
    const v = new Vector3(px * wall.lx, 0, 0);
    return new Vector3(wall.cx, wall.cy, h).add(v.applyEuler(e));
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

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const setInterSectionPlane = (handlePointV3: Vector3, wall: WallModel) => {
    setEnableIntersectionPlane(true);
    useStoreRef.getState().setEnableOrbitController(false);
    intersectionPlanePosition.set(handlePointV3.x, handlePointV3.y, h);
    if (parent && wall) {
      const r = wall.relativeAngle;
      intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
    }
  };

  const updateRidge = (elemId: string, type: string, val: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === elemId) {
          switch (type) {
            case RoofHandleType.FrontLeft:
            case RoofHandleType.FrontRight:
              (e as MansardRoofModel).frontRidge = val;
              break;
            case RoofHandleType.BackLeft:
            case RoofHandleType.BackRight:
              (e as MansardRoofModel).backRidge = val;
              break;
          }
          break;
        }
      }
    });
  };

  const handleUnoableResizeRidge = (elemId: string, type: RoofHandleType, oldVal: number, newVal: number) => {
    const undoable = {
      name: 'Resize Mansard Roof Ridge',
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

  // front ridge
  const frontRidgeLeftPointV3 = useMemo(() => {
    const wall = currentWallArray[3];
    return getRidgePoint(wall, frontRidge).sub(centroid);
  }, [currentWallArray, centroid, frontRidge]);

  const frontRidgeRightPointV3 = useMemo(() => {
    const wall = currentWallArray[1];
    return getRidgePoint(wall, -frontRidge).sub(centroid);
  }, [currentWallArray, centroid, frontRidge]);

  // back ridge
  const backRidgeLeftPointV3 = useMemo(() => {
    const wall = currentWallArray[1];
    return getRidgePoint(wall, -backRidge).sub(centroid);
  }, [currentWallArray, centroid, backRidge]);

  const backRidgeRightPointV3 = useMemo(() => {
    const wall = currentWallArray[3];
    return getRidgePoint(wall, backRidge).sub(centroid);
  }, [currentWallArray, centroid, backRidge]);

  const overhangs = useMemo(() => {
    return currentWallArray.map((wall) => getNormal(wall).multiplyScalar(overhang));
  }, [currentWallArray, overhang]);

  const thicknessVector = useMemo(() => {
    return zVector3.clone().multiplyScalar(thickness);
  }, [thickness]);

  const roofSegments = useMemo(() => {
    // const segments: Vector3[][] = [];
    const segments: ConvexGeometryProps[] = [];

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

    // front
    const frontSide: Vector3[] = [];
    const { lh: frontWallLh, rh: frontWallRh } = getWallHeight(currentWallArray, 0);

    const d0 = getDistance(wallPoint0, wallPoint1, frontRidgeLeftPointV3.clone().add(centroid));
    const overhangHeight0 = Math.min(
      (overhang / d0) * (frontRidgeLeftPointV3.clone().add(centroid).z - frontWallLh),
      frontWallLh,
    );

    const d1 = getDistance(wallPoint0, wallPoint1, frontRidgeRightPointV3.clone().add(centroid));
    const overhangHeight1 = Math.min(
      (overhang / d1) * (frontRidgeRightPointV3.clone().add(centroid).z - frontWallRh),
      frontWallRh,
    );

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

    const frontRidgeLeftPointAfterOverhang = getIntersectionPoint(
      frontRidgeLeftPointV3,
      frontRidgeRightPointV3,
      leftWallLeftPointAfterOffset.clone().sub(centroid),
      leftWallRightPointAfterOffset.clone().sub(centroid),
    ).setZ(frontRidgeRightPointV3.z);

    const frontRidgeRightPointAfterOverhang = getIntersectionPoint(
      frontRidgeRightPointV3,
      frontRidgeLeftPointV3,
      rightWallLeftPointAfterOffset.clone().sub(centroid),
      rightWallRightPointAfterOffset.clone().sub(centroid),
    ).setZ(frontRidgeRightPointV3.z);

    frontSide.push(
      frontWallLeftPointAfterOverhang,
      frontWallRightPointAfterOverhang,
      frontRidgeRightPointAfterOverhang,
      frontRidgeLeftPointAfterOverhang,
    );
    frontSide.push(
      frontWallLeftPointAfterOverhang.clone().add(thicknessVector),
      frontWallRightPointAfterOverhang.clone().add(thicknessVector),
      frontRidgeRightPointAfterOverhang.clone().add(thicknessVector),
      frontRidgeLeftPointAfterOverhang.clone().add(thicknessVector),
    );
    const frontDirection = -frontWall.relativeAngle;
    const frontLength = new Vector3(frontWall.cx, frontWall.cy).sub(centroid.clone().setZ(0)).length();

    segments.push({ points: frontSide, direction: frontDirection, length: frontLength });

    // back
    const backSide: Vector3[] = [];
    const { lh: backWallLh, rh: backWallRh } = getWallHeight(currentWallArray, 2);

    const d2 = getDistance(wallPoint2, wallPoint3, backRidgeLeftPointV3.clone().add(centroid));
    const overhangHeight2 = Math.min(
      (overhang / d2) * (backRidgeLeftPointV3.clone().add(centroid).z - backWallLh),
      backWallLh,
    );

    const d3 = getDistance(wallPoint2, wallPoint3, backRidgeRightPointV3.clone().add(centroid));
    const overhangHeight3 = Math.min(
      (overhang / d3) * (backRidgeRightPointV3.clone().add(centroid).z - backWallRh),
      backWallRh,
    );

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

    const backRidgeLeftPointAfterOverhang = getIntersectionPoint(
      backRidgeLeftPointV3,
      backRidgeRightPointV3,
      rightWallLeftPointAfterOffset.clone().sub(centroid),
      rightWallRightPointAfterOffset.clone().sub(centroid),
    ).setZ(backRidgeRightPointV3.z);

    const backRidgeRightPointAfterOverhang = getIntersectionPoint(
      backRidgeRightPointV3,
      backRidgeLeftPointV3,
      leftWallLeftPointAfterOffset.clone().sub(centroid),
      leftWallRightPointAfterOffset.clone().sub(centroid),
    ).setZ(backRidgeRightPointV3.z);

    backSide.push(
      backWallLeftPointAfterOverhang,
      backWallRightPointAfterOverhang,
      backRidgeRightPointAfterOverhang,
      backRidgeLeftPointAfterOverhang,
    );
    backSide.push(
      backWallLeftPointAfterOverhang.clone().add(thicknessVector),
      backWallRightPointAfterOverhang.clone().add(thicknessVector),
      backRidgeRightPointAfterOverhang.clone().add(thicknessVector),
      backRidgeLeftPointAfterOverhang.clone().add(thicknessVector),
    );
    const backDirection = -backWall.relativeAngle;
    const backLength = new Vector3(backWall.cx, backWall.cy).sub(centroid.clone().setZ(0)).length();

    segments.push({ points: backSide, direction: backDirection, length: backLength });

    // top
    const top: Vector3[] = [];
    top.push(
      frontRidgeLeftPointAfterOverhang,
      frontRidgeRightPointAfterOverhang,
      backRidgeLeftPointAfterOverhang,
      backRidgeRightPointAfterOverhang,
    );
    top.push(
      frontRidgeLeftPointAfterOverhang.clone().add(thicknessVector),
      frontRidgeRightPointAfterOverhang.clone().add(thicknessVector),
      backRidgeLeftPointAfterOverhang.clone().add(thicknessVector),
      backRidgeRightPointAfterOverhang.clone().add(thicknessVector),
    );
    segments.push({ points: top, direction: frontDirection, length: 1 });

    return segments;
  }, [currentWallArray, h]);

  useEffect(() => {
    if (currentWallArray.length === 4) {
      let minHeight = 0;
      for (let i = 0; i < currentWallArray.length; i++) {
        const { lh, rh } = getWallHeight(currentWallArray, i);
        minHeight = Math.max(minHeight, Math.max(lh, rh));
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.id === currentWallArray[i].id) {
              const w = e as WallModel;
              w.roofId = id;
              w.leftRoofHeight = lh;
              w.rightRoofHeight = rh;
              if (i === 1) {
                if (w.centerLeftRoofHeight && w.centerRightRoofHeight) {
                  w.centerLeftRoofHeight[0] = -frontRidge;
                  w.centerLeftRoofHeight[1] = h;
                  w.centerRightRoofHeight[0] = -backRidge;
                  w.centerRightRoofHeight[1] = h;
                } else {
                  w.centerLeftRoofHeight = [-frontRidge, h];
                  w.centerRightRoofHeight = [-backRidge, h];
                }
              }
              if (i === 3) {
                if (w.centerLeftRoofHeight && w.centerRightRoofHeight) {
                  w.centerLeftRoofHeight[0] = backRidge;
                  w.centerLeftRoofHeight[1] = h;
                  w.centerRightRoofHeight[0] = frontRidge;
                  w.centerRightRoofHeight[1] = h;
                } else {
                  w.centerLeftRoofHeight = [backRidge, h];
                  w.centerRightRoofHeight = [frontRidge, h];
                }
              }
              break;
            }
          }
        });
      }
      setMinHeight(minHeight);
    } else {
      removeElementById(id, false);
    }
  }, [currentWallArray, h]);

  return (
    <group position={[cx, cy, cz + 0.01]} rotation={[0, 0, rotation]} name={`Mansard Roof Group ${id}`}>
      <group
        name={'Mansard Roof Segments Group'}
        position={[centroid.x, centroid.y, centroid.z]}
        onPointerDown={(e) => {
          handleRoofPointerDown(e, id, parentId);
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
            <group key={i} name={`Roof segment ${i}`}>
              <mesh castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
                <convexGeometry args={[points, isFlat ? arr[0].direction : direction, isFlat ? 1 : length]} />
                <meshStandardMaterial
                  color={textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white'}
                  map={texture}
                />
              </mesh>
            </group>
          );
        })}
        <MansardRoofWirefram
          roofSegments={roofSegments}
          thickness={thickness}
          lineColor={lineColor}
          lineWidth={lineWidth}
        />
      </group>

      {/* handles */}
      {selected && !locked && (
        <group position={[centroid.x, centroid.y, centroid.z + thickness]}>
          <Sphere
            position={[0, 0, 0.3]}
            args={[0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(centroid.x, centroid.y, h);
              if (parent) {
                const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - parent.rotation[2];
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Top);
              useStoreRef.getState().setEnableOrbitController(false);
              oldHeight.current = h;
            }}
          />

          <Sphere
            position={[frontRidgeLeftPointV3.x, frontRidgeLeftPointV3.y, frontRidgeLeftPointV3.z]}
            args={[0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeVal.current = frontRidge;
              setInterSectionPlane(frontRidgeLeftPointV3, currentWallArray[3]);
              setRoofHandleType(RoofHandleType.FrontLeft);
            }}
          />
          <Sphere
            position={[frontRidgeRightPointV3.x, frontRidgeRightPointV3.y, frontRidgeRightPointV3.z]}
            args={[0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeVal.current = frontRidge;
              setInterSectionPlane(frontRidgeRightPointV3, currentWallArray[1]);
              setRoofHandleType(RoofHandleType.FrontRight);
            }}
          />

          <Sphere
            position={[backRidgeLeftPointV3.x, backRidgeLeftPointV3.y, backRidgeLeftPointV3.z]}
            args={[0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeVal.current = backRidge;
              setInterSectionPlane(backRidgeLeftPointV3, currentWallArray[1]);
              setRoofHandleType(RoofHandleType.BackLeft);
            }}
          />
          <Sphere
            position={[backRidgeRightPointV3.x, backRidgeRightPointV3.y, backRidgeRightPointV3.z]}
            args={[0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeVal.current = backRidge;
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
              if (intersects[0] && parent) {
                const point = intersects[0].point;
                if (point.z < 0.001) {
                  return;
                }
                switch (roofHandleType) {
                  case RoofHandleType.Top: {
                    const height = Math.max(minHeight, point.z - (parent?.lz ?? 0) - 0.6);
                    if (isRoofValid(id, undefined, undefined, [0, height])) {
                      setH(height);
                    }
                    break;
                  }
                  case RoofHandleType.FrontLeft: {
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === id) {
                          if (parent && currentWallArray[3]) {
                            const px = Util.clamp(getRelPos(parent, currentWallArray[3], point), 0.01, 0.45);
                            if (
                              isRoofValid(id, currentWallArray[3].id, currentWallArray[1].id, undefined, undefined, [
                                px,
                                h,
                              ])
                            ) {
                              (e as MansardRoofModel).frontRidge = px;
                            }
                            break;
                          }
                        }
                      }
                    });
                    break;
                  }
                  case RoofHandleType.FrontRight: {
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === id) {
                          if (parent && currentWallArray[1]) {
                            const px = Util.clamp(getRelPos(parent, currentWallArray[1], point), -0.45, -0.01);
                            if (
                              isRoofValid(
                                id,
                                currentWallArray[1].id,
                                currentWallArray[3].id,
                                undefined,
                                [px, h],
                                undefined,
                              )
                            ) {
                              (e as MansardRoofModel).frontRidge = -px;
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
                        if (e.id === id) {
                          if (parent && currentWallArray[3]) {
                            const px = Util.clamp(getRelPos(parent, currentWallArray[3], point), -0.45, -0.01);
                            if (
                              isRoofValid(
                                id,
                                currentWallArray[3].id,
                                currentWallArray[1].id,
                                undefined,
                                [px, h],
                                undefined,
                              )
                            ) {
                              (e as MansardRoofModel).backRidge = px;
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
                        if (e.id === id) {
                          if (parent && currentWallArray[1]) {
                            const px = Util.clamp(getRelPos(parent, currentWallArray[1], point), 0.01, 0.45);
                            if (
                              isRoofValid(id, currentWallArray[1].id, currentWallArray[3].id, undefined, undefined, [
                                px,
                                h,
                              ])
                            ) {
                              (e as MansardRoofModel).backRidge = -px;
                            }
                          }
                          break;
                        }
                      }
                    });
                    break;
                  }
                }
              }
            }
          }}
          onPointerUp={() => {
            isPointerMovingRef.current = false;
            setEnableIntersectionPlane(false);
            setRoofHandleType(RoofHandleType.Null);
            useStoreRef.getState().setEnableOrbitController(true);
            switch (roofHandleType) {
              case RoofHandleType.Top: {
                handleUndoableResizeRoofHeight(id, oldHeight.current, h);
                break;
              }
              case RoofHandleType.FrontLeft:
              case RoofHandleType.FrontRight: {
                handleUnoableResizeRidge(id, roofHandleType, oldRidgeVal.current, frontRidge);
                break;
              }
              case RoofHandleType.BackLeft:
              case RoofHandleType.BackRight: {
                handleUnoableResizeRidge(id, roofHandleType, oldRidgeVal.current, backRidge);
                break;
              }
            }
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  e.lz = h;
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

export default MansardRoof;
