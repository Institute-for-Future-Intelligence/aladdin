/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Extrude, Line, Plane, Sphere } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HALF_PI, HALF_PI_Z_EULER, ORIGIN_VECTOR3, TWO_PI } from 'src/constants';
import { Point2 } from 'src/models/Point2';
import { MansardRoofModel } from 'src/models/RoofModel';
import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import * as Selector from 'src/stores/selector';
import { RoofTexture } from 'src/types';
import { UnoableResizeGambrelAndMansardRoofRidge } from 'src/undo/UndoableResize';
import { Util } from 'src/Util';
import { DoubleSide, Euler, Mesh, Shape, Vector3 } from 'three';
import { ObjectType } from '../../types';
import { useMultiCurrWallArray, useRoofHeight, useRoofTexture, useSolarPanelUndoable, useTransparent } from './hooks';
import {
  ConvexGeoProps as ConvexGeometryProps,
  handleContextMenu,
  addUndoableResizeRoofHeight,
  updateRooftopSolarPanel,
  handlePointerDown,
  handlePointerUp,
  handlePointerMove,
  ConvexGeoProps,
  RoofWireframeProps,
  RoofHandle,
} from './roofRenderer';
import { RoofUtil } from './RoofUtil';

const intersectionPlanePosition = new Vector3();
const intersectionPlaneRotation = new Euler();
const zVector3 = new Vector3(0, 0, 1);

enum RoofHandleType {
  Top = 'Top',
  Ridge = 'Ridge',
  Null = 'Null',
}

const MansardRoofWirefram = React.memo(({ roofSegments, thickness, lineWidth, lineColor }: RoofWireframeProps) => {
  const wallPoints = useMemo(
    () => roofSegments.reduce((arr, segment) => arr.concat(segment.points[1]), [roofSegments[0].points[0]]),
    [roofSegments],
  );

  const ridgePoints = useMemo(
    () =>
      roofSegments.reduce((arr, segment) => arr.concat(segment.points[6].clone()), [roofSegments[0].points[7].clone()]),
    [roofSegments],
  );

  const wallLine = useMemo(
    () => <Line points={wallPoints} lineWidth={lineWidth} color={lineColor} />,
    [wallPoints, lineWidth, lineColor],
  );

  if (roofSegments.length < 2) {
    return null;
  }

  // segments array
  // [wallLeftPointAfterOverhang, wallRightPointAfterOverhang, ridgeRightPoint, ridgeLeftPoint,
  //  wallLeftPointAfterOverhang.add(thicknessVector),
  //  wallRightPointAfterOverhang.add(thicknessVector),
  //  ridgeRightPoint.add(thicknessVector),
  //  ridgeLeftPoint.add(thicknessVector)]

  const isFlat = Math.abs(roofSegments[0].points[0].z - roofSegments[0].points[3].z) < 0.1;

  return (
    <>
      {!isFlat && <Line points={ridgePoints} lineWidth={lineWidth} color={lineColor} />}
      {wallLine}
      <group position={[0, 0, thickness]}>{wallLine}</group>
      {roofSegments.map((segment, idx) => {
        return (
          <React.Fragment key={idx}>
            {!isFlat && (
              <Line points={[segment.points[7], segment.points[4]]} lineWidth={lineWidth} color={lineColor} />
            )}
            <Line points={[segment.points[4], segment.points[0]]} lineWidth={lineWidth} color={lineColor} />
          </React.Fragment>
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
  selected,
  textureType,
  color,
  overhang,
  thickness,
  locked,
  lineColor = 'black',
  lineWidth = 0.2,
  roofType,
  foundationId,
  ridgeWidth = 1,
  // old files data
  frontRidge,
  backRidge,
}: MansardRoofModel) => {
  const texture = useRoofTexture(textureType);
  const { currentWallArray, isLoopRef } = useMultiCurrWallArray(foundationId, id, wallsId);

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

  const initMinHeight = () => {
    let minHeight = 0;
    for (let i = 0; i < currentWallArray.length; i++) {
      const { lh, rh } = getWallHeight(currentWallArray, i);
      minHeight = Math.max(minHeight, Math.max(lh, rh));
    }
    return minHeight;
  };

  const setCommonStore = useStore(Selector.set);
  const removeElementById = useStore(Selector.removeElementById);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const ray = useStore((state) => state.ray);
  const mouse = useStore((state) => state.mouse);
  const fileChanged = useStore(Selector.fileChanged);

  const { h, setH, minHeight, setMinHeight, relHeight, setRelHeight } = useRoofHeight(lz, initMinHeight());

  const [width, setWidth] = useState(ridgeWidth);
  const [maxWidth, setMaxWidth] = useState<number | null>(null);
  const [enableIntersectionPlane, setEnableIntersectionPlane] = useState(false);
  const [roofHandleType, setRoofHandleType] = useState(RoofHandleType.Null);
  const [ridgeHandleIndex, setRidgeHandleIndex] = useState<number | null>(null);

  const oldHeight = useRef(h);
  const oldRelativeHeightRef = useRef<number>(relHeight.current);
  const oldWidth = useRef(width);
  const isFirstMountRef = useRef(true);

  const intersectionPlaneRef = useRef<Mesh>(null);
  const isPointerMovingRef = useRef(false);
  const { gl, camera } = useThree();

  const foundation = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === parentId) {
        return e;
      }
    }
    return null;
  });
  let rotationZ = 0;
  if (foundation) {
    cx = foundation.cx;
    cy = foundation.cy;
    cz = foundation.lz;
    rotationZ = foundation.rotation[2];
  }

  const getWallPoint2 = (wallArray: WallModel[]) => {
    const arr: Point2[] = [];
    const length = wallArray.length;
    for (const w of wallArray) {
      if (w.leftPoint[0] && w.leftPoint[1]) {
        arr.push({ x: w.leftPoint[0], y: w.leftPoint[1] });
      }
    }
    if (!isLoopRef.current) {
      if (
        (wallArray[length - 1].rightPoint[0] || wallArray[length - 1].rightPoint[0] === 0) &&
        (wallArray[length - 1].rightPoint[1] || wallArray[length - 1].rightPoint[1] === 0)
      ) {
        arr.push({ x: wallArray[length - 1].rightPoint[0], y: wallArray[length - 1].rightPoint[1] });
      }
    }
    return arr;
  };

  const getWallPointFromHandleIdx = (idx: number) => {
    if (idx < currentWallArray.length) {
      const wall = currentWallArray[idx];
      return new Vector3(wall.leftPoint[0], wall.leftPoint[1]);
    } else {
      const wall = currentWallArray[idx - 1];
      return new Vector3(wall.rightPoint[0], wall.rightPoint[1]);
    }
  };

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const updateRidge = (elemId: string, val: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === elemId) {
          (e as MansardRoofModel).ridgeWidth = val;
          break;
        }
      }
    });
  };

  const getOverhangHeight = () => {
    let height = Infinity;

    for (let i = 0; i < currentWallArray.length; i++) {
      const w = currentWallArray[i];
      const leftPoint = new Vector3(w.leftPoint[0], w.leftPoint[1]);
      const rightPoint = new Vector3(w.rightPoint[0], w.rightPoint[1]);
      const { lh, rh } = getWallHeight(currentWallArray, i);
      const dLeft = RoofUtil.getDistance(leftPoint, rightPoint, ridgePoints[i].leftPoint);
      const overhangHeightLeft = Math.min((overhang / dLeft) * (ridgePoints[i].leftPoint.z - lh), lh);
      const dRight = RoofUtil.getDistance(leftPoint, rightPoint, ridgePoints[i].rightPoint);
      const overhangHeightRight = Math.min((overhang / dRight) * (ridgePoints[i].rightPoint.z - rh), rh);
      height = Math.min(Math.min(overhangHeightLeft, overhangHeightRight), height);
    }

    return Number.isNaN(height) ? 0 : height;
  };

  const addUnoableResizeRidge = (elemId: string, type: RoofHandleType, oldVal: number, newVal: number) => {
    const undoable = {
      name: 'Resize Mansard Roof Ridge',
      timestamp: Date.now(),
      resizedElementId: elemId,
      resizedElementType: ObjectType.Roof,
      oldVal: oldVal,
      newVal: newVal,
      type: type,
      undo: () => {
        updateRidge(undoable.resizedElementId, undoable.oldVal);
      },
      redo: () => {
        updateRidge(undoable.resizedElementId, undoable.newVal);
      },
    } as UnoableResizeGambrelAndMansardRoofRidge;
    useStore.getState().addUndoable(undoable);
  };

  const centroid = useMemo(() => {
    if (currentWallArray.length < 2) {
      return new Vector3();
    }
    const points = getWallPoint2(currentWallArray);
    const p = Util.calculatePolygonCentroid(points);
    if (Number.isNaN(p.x) || Number.isNaN(p.y)) {
      return new Vector3();
    }
    return new Vector3(p.x, p.y, h);
  }, [currentWallArray, h]);

  const overhangs = useMemo(() => {
    const res = currentWallArray.map((wall) => RoofUtil.getWallNormal(wall).multiplyScalar(overhang));
    if (!isLoopRef.current && res.length !== 0) {
      const n = new Vector3()
        .subVectors(
          new Vector3(
            currentWallArray[currentWallArray.length - 1].rightPoint[0],
            currentWallArray[currentWallArray.length - 1].rightPoint[1],
          ),
          new Vector3(currentWallArray[0].leftPoint[0], currentWallArray[0].leftPoint[1]),
        )
        .applyEuler(HALF_PI_Z_EULER)
        .normalize()
        .multiplyScalar(overhang);
      res.push(n);
    }
    return res;
  }, [currentWallArray, overhang]);

  const wallPointsAfterOverhang = useMemo(() => {
    const res = currentWallArray.map((wall, idx) => ({
      leftPoint: new Vector3(wall.leftPoint[0], wall.leftPoint[1]).add(overhangs[idx]),
      rightPoint: new Vector3(wall.rightPoint[0], wall.rightPoint[1]).add(overhangs[idx]),
    }));
    if (!isLoopRef.current && res.length !== 0) {
      res.push({
        leftPoint: new Vector3(
          currentWallArray[currentWallArray.length - 1].rightPoint[0],
          currentWallArray[currentWallArray.length - 1].rightPoint[1],
        ).add(overhangs[overhangs.length - 1]),
        rightPoint: new Vector3(currentWallArray[0].leftPoint[0], currentWallArray[0].leftPoint[1]).add(
          overhangs[overhangs.length - 1],
        ),
      });
    }
    return res;
  }, [currentWallArray, overhangs]);

  const ridgePoints = useMemo(() => {
    const res = currentWallArray.map((wall, idx) => {
      const leftPoint = new Vector3(wall.leftPoint[0], wall.leftPoint[1]);
      const rightPoint = new Vector3(wall.rightPoint[0], wall.rightPoint[1]);
      const leftDiff = new Vector3().subVectors(centroid, leftPoint).setZ(0).normalize().multiplyScalar(width);
      const rightDiff = new Vector3().subVectors(centroid, rightPoint).setZ(0).normalize().multiplyScalar(width);
      leftPoint.add(leftDiff).setZ(h);
      rightPoint.add(rightDiff).setZ(h);
      return { leftPoint, rightPoint };
    });
    if (!isLoopRef.current && res.length !== 0) {
      res.push({ leftPoint: res[res.length - 1].rightPoint, rightPoint: res[0].leftPoint });
    }
    return res;
  }, [currentWallArray, centroid, width]);

  const thicknessVector = useMemo(() => {
    return zVector3.clone().multiplyScalar(thickness);
  }, [thickness]);

  const roofSegments = useMemo(() => {
    const segments: ConvexGeoProps[] = [];
    if (currentWallArray.length < 2) {
      return segments;
    }
    const overhangHeight = getOverhangHeight();

    for (let i = 0; i < currentWallArray.length; i++) {
      const w = currentWallArray[i];
      if (
        w.leftPoint.length > 0 &&
        w.rightPoint.length > 0 &&
        (w.leftPoint[0] !== w.rightPoint[0] || w.leftPoint[1] !== w.rightPoint[1])
      ) {
        const points = [];
        let { lh, rh } = getWallHeight(currentWallArray, i);
        if (!isLoopRef.current) {
          if (i === 0) {
            lh = currentWallArray[0].lz;
          }
          if (i === currentWallArray.length - 1) {
            rh = currentWallArray[currentWallArray.length - 1].lz;
          }
        }

        const wallLeftPointAfterOverhang = RoofUtil.getIntersectionPoint(
          wallPointsAfterOverhang[(i + wallPointsAfterOverhang.length - 1) % wallPointsAfterOverhang.length].leftPoint,
          wallPointsAfterOverhang[(i + wallPointsAfterOverhang.length - 1) % wallPointsAfterOverhang.length].rightPoint,
          wallPointsAfterOverhang[i].leftPoint,
          wallPointsAfterOverhang[i].rightPoint,
        )
          .setZ(lh - overhangHeight)
          .sub(centroid);

        const wallRightPointAfterOverhang = RoofUtil.getIntersectionPoint(
          wallPointsAfterOverhang[i].leftPoint,
          wallPointsAfterOverhang[i].rightPoint,
          wallPointsAfterOverhang[(i + 1) % wallPointsAfterOverhang.length].leftPoint,
          wallPointsAfterOverhang[(i + 1) % wallPointsAfterOverhang.length].rightPoint,
        )
          .setZ(rh - overhangHeight)
          .sub(centroid);

        const ridgeLeftPoint = ridgePoints[i].leftPoint.clone().sub(centroid);
        const ridgeRightPoint = ridgePoints[i].rightPoint.clone().sub(centroid);

        const direction = -w.relativeAngle;
        const length = new Vector3(w.cx, w.cy).sub(centroid.clone().setZ(0)).length();
        points.push(wallLeftPointAfterOverhang, wallRightPointAfterOverhang, ridgeRightPoint, ridgeLeftPoint);
        points.push(
          wallLeftPointAfterOverhang.clone().add(thicknessVector),
          wallRightPointAfterOverhang.clone().add(thicknessVector),
          ridgeRightPoint.clone().add(thicknessVector),
          ridgeLeftPoint.clone().add(thicknessVector),
        );
        segments.push({ points, direction, length });
      }
    }
    if (!isLoopRef.current) {
      const idx = wallPointsAfterOverhang.length - 1;
      const leftPointAfterOverhang = RoofUtil.getIntersectionPoint(
        wallPointsAfterOverhang[idx - 1].leftPoint,
        wallPointsAfterOverhang[idx - 1].rightPoint,
        wallPointsAfterOverhang[idx].leftPoint,
        wallPointsAfterOverhang[idx].rightPoint,
      )
        .setZ(currentWallArray[currentWallArray.length - 1].lz - overhangHeight)
        .sub(centroid);
      const rightPointAfterOverhang = RoofUtil.getIntersectionPoint(
        wallPointsAfterOverhang[idx].leftPoint,
        wallPointsAfterOverhang[idx].rightPoint,
        wallPointsAfterOverhang[0].leftPoint,
        wallPointsAfterOverhang[0].rightPoint,
      )
        .setZ(currentWallArray[0].lz - overhangHeight)
        .sub(centroid);

      const ridgeLeftPoint = ridgePoints[idx].leftPoint.clone().sub(centroid);
      const ridgeRightPoint = ridgePoints[idx].rightPoint.clone().sub(centroid);

      let angle = Math.atan2(
        rightPointAfterOverhang.y - leftPointAfterOverhang.y,
        rightPointAfterOverhang.x - leftPointAfterOverhang.x,
      );
      angle = angle >= 0 ? angle : (TWO_PI + angle) % TWO_PI;

      const length = new Vector3()
        .addVectors(leftPointAfterOverhang, rightPointAfterOverhang)
        .setZ(0)
        .divideScalar(2)
        .length();

      const points = [];
      points.push(leftPointAfterOverhang, rightPointAfterOverhang, ridgeRightPoint, ridgeLeftPoint);
      points.push(
        leftPointAfterOverhang.clone().add(thicknessVector),
        rightPointAfterOverhang.clone().add(thicknessVector),
        ridgeRightPoint.clone().add(thicknessVector),
        ridgeLeftPoint.clone().add(thicknessVector),
      );
      segments.push({ points, direction: -angle, length });
    }
    return segments;
  }, [currentWallArray, h, width, overhang, thickness]);

  const topRidgeShape = useMemo(() => {
    const s = new Shape();

    const startPoint = ridgePoints[0].leftPoint.clone().sub(centroid);
    s.moveTo(startPoint.x, startPoint.y);

    for (const point of ridgePoints) {
      const rightPoint = point.rightPoint.clone().sub(centroid);
      s.lineTo(rightPoint.x, rightPoint.y);
    }

    return s;
  }, [currentWallArray, ridgePoints]);

  useEffect(() => {
    const minHeight = currentWallArray.length === 4 ? Math.max(currentWallArray[0].lz, currentWallArray[2].lz) : lz / 2;
    setMinHeight(minHeight);
    setRelHeight(lz - minHeight);
  }, [fileChanged]);

  useEffect(() => {
    if (lz !== h) {
      setH(lz);
    }
    if (ridgeWidth !== width) {
      setWidth(ridgeWidth);
    }
  }, [lz, ridgeWidth]);

  useEffect(() => {
    if (!isFirstMountRef.current || useStore.getState().addedRoofId === id) {
      if (currentWallArray.length > 1) {
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
                break;
              }
            }
          });
        }
        setMinHeight(minHeight);
        if (relHeight !== null) {
          setH(minHeight + relHeight.current);
          useStore.getState().updateRoofHeightById(id, minHeight + relHeight.current);
        }
        updateRooftopSolarPanel(foundation, id, roofSegments, centroid, h, thickness);
      } else {
        removeElementById(id, false);
      }
      if (useStore.getState().addedRoofId === id) {
        useStore.getState().setAddedRoofId(null);
      }
    }
  }, [currentWallArray, h]);

  const updateSolarPanelOnRoofFlag = useStore(Selector.updateSolarPanelOnRoofFlag);

  useEffect(() => {
    if (!isFirstMountRef.current) {
      updateRooftopSolarPanel(foundation, id, roofSegments, centroid, h, thickness);
    }
  }, [updateSolarPanelOnRoofFlag, h, thickness]);

  useEffect(() => {
    isFirstMountRef.current = false;

    // handle old files
    if (frontRidge !== undefined || backRidge !== undefined) {
      setCommonStore((state) => {
        for (const el of state.elements) {
          if (el.type === ObjectType.Wall && (el as WallModel).roofId === id) {
            (el as WallModel).centerLeftRoofHeight = undefined;
            (el as WallModel).centerRightRoofHeight = undefined;
          }
          if (el.id === id) {
            (el as MansardRoofModel).frontRidge = undefined;
            (el as MansardRoofModel).backRidge = undefined;
          }
        }
      });
    }
  }, []);

  const { grabRef, addUndoableMove, undoMove, setOldRefData } = useSolarPanelUndoable();
  const { transparent, opacity } = useTransparent();

  return (
    <group position={[cx, cy, cz + 0.01]} rotation={[0, 0, rotationZ]} name={`Mansard Roof Group ${id}`}>
      <group
        name={'Mansard Roof Segments Group'}
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
          const { points, direction, length } = segment;
          const [leftRoof, rightRoof, rightRidge, leftRidge] = points;
          const isFlat = Math.abs(leftRoof.z) < 0.1;
          return (
            <group key={i} name={`Roof segment ${i}`}>
              <mesh
                castShadow={shadowEnabled && !transparent}
                receiveShadow={shadowEnabled}
                userData={{ simulation: true }}
              >
                <convexGeometry args={[points, isFlat ? arr[0].direction : direction, isFlat ? 1 : length]} />
                <meshStandardMaterial
                  color={textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white'}
                  map={texture}
                  transparent={transparent}
                  opacity={opacity}
                />
              </mesh>
            </group>
          );
        })}
        <Extrude
          args={[topRidgeShape, { steps: 1, depth: thickness, bevelEnabled: false }]}
          castShadow={shadowEnabled && !transparent}
          receiveShadow={shadowEnabled}
          userData={{ simulation: true }}
        >
          <meshStandardMaterial
            color={textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white'}
            map={texture}
            transparent={transparent}
            opacity={opacity}
          />
        </Extrude>
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
          <RoofHandle
            position={[0, 0, 0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(centroid.x, centroid.y, h);
              if (foundation) {
                const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - foundation.rotation[2];
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Top);
              useStoreRef.getState().setEnableOrbitController(false);
              oldHeight.current = h;
              oldRelativeHeightRef.current = relHeight.current;
            }}
          />
          {ridgePoints.map((ridge, idx) => {
            const point = ridge.leftPoint.clone().sub(centroid);
            return (
              <RoofHandle
                key={idx}
                position={[point.x, point.y, 0]}
                onPointerDown={() => {
                  isPointerMovingRef.current = true;
                  setEnableIntersectionPlane(true);
                  intersectionPlanePosition.set(point.x, point.y, h + 0.15);
                  intersectionPlaneRotation.set(0, 0, 0);
                  setRoofHandleType(RoofHandleType.Ridge);
                  setRidgeHandleIndex(idx);
                  setMaxWidth(
                    currentWallArray.reduce(
                      (max, wall) =>
                        Math.min(max, new Vector3(wall.leftPoint[0], wall.leftPoint[1], h).distanceTo(centroid) - 1),
                      Infinity,
                    ),
                  );
                  useStoreRef.getState().setEnableOrbitController(false);
                  oldWidth.current = width;
                }}
              />
            );
          })}
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
                const pointer = intersects[0].point;
                if (pointer.z < 0.001) {
                  return;
                }
                switch (roofHandleType) {
                  case RoofHandleType.Top: {
                    const height = Math.max(minHeight.current, pointer.z - (foundation?.lz ?? 0) - 0.6);
                    if (RoofUtil.isRoofValid(id, undefined, undefined, [0, height])) {
                      setH(height);
                      setRelHeight(height - minHeight.current);
                    }
                    break;
                  }
                  case RoofHandleType.Ridge: {
                    if (foundation && ridgeHandleIndex !== null) {
                      const p = pointer
                        .clone()
                        .applyEuler(new Euler(0, 0, foundation.rotation[2]))
                        .sub(new Vector3(foundation.cx, foundation.cy))
                        .setZ(0);

                      const wallPoint = getWallPointFromHandleIdx(ridgeHandleIndex);
                      const d = p.distanceTo(wallPoint);
                      const dir = new Vector3().subVectors(centroid.clone().setZ(0), wallPoint);
                      const angle = p.clone().sub(wallPoint).angleTo(dir);
                      if (angle < HALF_PI) {
                        setWidth(Util.clamp(d, 0.5, maxWidth ?? dir.length() - 1));
                      } else {
                        setWidth(0.5);
                      }
                    }
                    break;
                  }
                }
                updateRooftopSolarPanel(foundation, id, roofSegments, centroid, h, thickness);
              }
            }
          }}
          onPointerUp={() => {
            switch (roofHandleType) {
              case RoofHandleType.Top: {
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
              case RoofHandleType.Ridge: {
                addUnoableResizeRidge(id, roofHandleType, oldWidth.current, width);
                break;
              }
            }
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  e.lz = h;
                  (e as MansardRoofModel).ridgeWidth = width;
                  break;
                }
              }
            });
            updateRooftopSolarPanel(foundation, id, roofSegments, centroid, h, thickness);
            isPointerMovingRef.current = false;
            setEnableIntersectionPlane(false);
            setRoofHandleType(RoofHandleType.Null);
            setRidgeHandleIndex(null);
            useStoreRef.getState().setEnableOrbitController(true);
          }}
        >
          <meshBasicMaterial side={DoubleSide} transparent={true} opacity={0.5} />
        </Plane>
      )}
    </group>
  );
};

export default React.memo(MansardRoof);
