/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PyramidRoofModel, RoofModel } from 'src/models/RoofModel';
import { useStore } from 'src/stores/common';
import { DoubleSide, Euler, Mesh, Raycaster, Texture, Vector2, Vector3 } from 'three';
import * as Selector from 'src/stores/selector';
import { WallModel } from 'src/models/WallModel';
import { Box, Line, Plane, Sphere } from '@react-three/drei';
import { ConvexGeometry } from 'src/js/ConvexGeometry.js';
import { HALF_PI, TWO_PI } from 'src/constants';
import { useStoreRef } from 'src/stores/commonRef';
import { useThree } from '@react-three/fiber';
import { Point2 } from 'src/models/Point2';
import { Util } from 'src/Util';
import { ObjectType, RoofTexture } from 'src/types';
import { CSG } from 'three-csg-ts';
import {
  ConvexGeoProps,
  euler,
  getDistance,
  getIntersectionPoint,
  getNormal,
  handleRoofContextMenu,
  handleRoofPointerDown,
  handleUndoableResizeRoofHeight,
  useRoofTexture,
  RoofWireframeProps,
} from './roof';

const centerPointPosition = new Vector3();
const intersectionPlanePosition = new Vector3();
const intersectionPlaneRotation = new Euler();
const zeroVector = new Vector3();
const zVector3 = new Vector3(0, 0, 1);

const PyramidRoofWirefram = React.memo(({ roofSegments, thickness, lineWidth, lineColor }: RoofWireframeProps) => {
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

  const periphery = <Line points={peripheryPoints} lineWidth={lineWidth} color={lineColor} />;

  return (
    <>
      {periphery}
      <group position={[0, 0, thickness]}>
        {periphery}
        {roofSegments.map((segment, idx) => {
          const [leftPoint, rightPoint, zeroVector] = segment.points;
          const isFlat = Math.abs(leftPoint.z) < 0.015;
          const points = [leftPoint.clone().sub(thicknessVector), leftPoint];
          if (!isFlat) {
            points.push(zeroVector);
          }
          return <Line key={idx} points={points} lineWidth={lineWidth} color={lineColor} />;
        })}
      </group>
    </>
  );
});

const PyramidRoof = ({
  cx,
  cy,
  cz,
  lz,
  id,
  parentId,
  wallsId,
  selected,
  textureType,
  color,
  overhang,
  thickness,
  locked,
  lineWidth = 0.2,
  lineColor = 'black',
}: PyramidRoofModel) => {
  const setCommonStore = useStore(Selector.set);
  const getElementById = useStore(Selector.getElementById);
  const removeElementById = useStore(Selector.removeElementById);
  const updateRoofHeight = useStore(Selector.updateRoofHeight);
  const elements = useStore(Selector.elements);
  const { camera, gl } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);

  const [h, setH] = useState(lz);
  const [minHeight, setMinHeight] = useState(lz);
  const [showIntersectionPlane, setShowIntersectionPlane] = useState(false);

  const intersectionPlaneRef = useRef<Mesh>(null);
  const isWallLoopRef = useRef(false);
  const oldHeight = useRef<number>(h);

  const prevWallsIdSet = new Set<string>(wallsId);

  useEffect(() => {
    if (h < minHeight) {
      setH(minHeight);
    }
  }, [minHeight]);

  useEffect(() => {
    setH(lz);
  }, [lz]);

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const getWallPoint = (wallArray: WallModel[]) => {
    const arr: Point2[] = [];
    const length = wallArray.length;
    for (const w of wallArray) {
      if (w.leftPoint[0] && w.leftPoint[1]) {
        arr.push({ x: w.leftPoint[0], y: w.leftPoint[1] });
      }
    }
    if (!isWallLoopRef.current) {
      if (
        (wallArray[length - 1].rightPoint[0] || wallArray[length - 1].rightPoint[0] === 0) &&
        (wallArray[length - 1].rightPoint[1] || wallArray[length - 1].rightPoint[1] === 0)
      ) {
        arr.push({ x: wallArray[length - 1].rightPoint[0], y: wallArray[length - 1].rightPoint[1] });
      }
    }
    return arr;
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

  const needUpdateWallsId = (wallArray: WallModel[], wallsIdSet: Set<string>) => {
    if (wallArray.length !== wallsIdSet.size) {
      return true;
    }
    for (const w of wallArray) {
      if (!wallsIdSet.has(w.id)) {
        return true;
      }
    }
    return false;
  };

  const getOverhangHeight = () => {
    let height = Infinity;

    for (let i = 0; i < currentWallArray.length; i++) {
      const w = currentWallArray[i];
      const leftPoint = new Vector3(w.leftPoint[0], w.leftPoint[1]);
      const rightPoint = new Vector3(w.rightPoint[0], w.rightPoint[1]);
      const { lh, rh } = getWallHeight(currentWallArray, i);
      const dLeft = getDistance(leftPoint, rightPoint, centerPointPosition);
      const overhangHeightLeft = Math.min((overhang / dLeft) * (centerPointPosition.z - lh), lh);
      const dRight = getDistance(leftPoint, rightPoint, centerPointPosition);
      const overhangHeightRight = Math.min((overhang / dRight) * (centerPointPosition.z - rh), rh);
      height = Math.min(Math.min(overhangHeightLeft, overhangHeightRight), height);
    }

    return Number.isNaN(height) ? 0 : height;
  };

  // get Walls array from left to right
  const currentWallArray = useMemo(() => {
    for (const wid of wallsId) {
      let wall = getElementById(wid) as WallModel;
      if (!wall) return [];

      const array = [];
      const startWall = wall;
      while (wall && (!wall.roofId || wall.roofId === id)) {
        array.push(wall);
        if (wall.leftJoints[0]) {
          if (wall.leftJoints[0] !== startWall.id) {
            wall = getElementById(wall.leftJoints[0]) as WallModel;
          }
          // is a loop
          else {
            array.reverse();
            isWallLoopRef.current = true;
            return array;
          }
        } else {
          break;
        }
      }

      array.reverse();

      wall = getElementById(startWall.rightJoints[0]) as WallModel;
      while (wall && (!wall.roofId || wall.roofId === id)) {
        array.push(wall);
        if (wall.rightJoints[0] && wall.rightJoints[0] !== startWall.id) {
          wall = getElementById(wall.rightJoints[0]) as WallModel;
        } else {
          break;
        }
      }
      isWallLoopRef.current = false;
      if (array.length > 1) {
        return array;
      }
    }
    return [];
  }, [wallsId, elements]);

  const centerPoint = useMemo(() => {
    if (currentWallArray.length < 2) {
      return { x: 0, y: 0 };
    }
    const points = getWallPoint(currentWallArray);
    if (points.length < 3) {
      return { x: 0, y: 0 };
    }
    const p = Util.calculatePolygonCentroid(points);
    if (Number.isNaN(p.x) || Number.isNaN(p.y)) {
      return { x: 0, y: 0 };
    }
    centerPointPosition.set(p.x, p.y, h - 0.01);
    return p;
  }, [currentWallArray, h]);

  const overhangs = useMemo(() => {
    const res = currentWallArray.map((wall) => getNormal(wall).multiplyScalar(overhang));
    if (!isWallLoopRef.current) {
      const n = new Vector3()
        .subVectors(
          new Vector3(
            currentWallArray[currentWallArray.length - 1].rightPoint[0],
            currentWallArray[currentWallArray.length - 1].rightPoint[1],
          ),
          new Vector3(currentWallArray[0].leftPoint[0], currentWallArray[0].leftPoint[1]),
        )
        .applyEuler(euler)
        .normalize()
        .multiplyScalar(overhang);
      res.push(n);
    }
    return res;
  }, [currentWallArray, overhang]);

  const wallPointsAfterOffset = useMemo(() => {
    const res = currentWallArray.map((wall, idx) => ({
      leftPoint: new Vector3(wall.leftPoint[0], wall.leftPoint[1]).add(overhangs[idx]),
      rightPoint: new Vector3(wall.rightPoint[0], wall.rightPoint[1]).add(overhangs[idx]),
    }));
    if (!isWallLoopRef.current) {
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
  }, [overhangs]);

  const thicknessVector = useMemo(() => {
    return zVector3.clone().multiplyScalar(thickness);
  }, [thickness]);

  const roofSegments = useMemo(() => {
    const segments: ConvexGeoProps[] = [];
    if (currentWallArray.length < 2) {
      return segments;
    }
    let minHeight = 0;

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
        if (!isWallLoopRef.current) {
          if (i === 0) {
            lh = currentWallArray[0].lz;
          }
          if (i === currentWallArray.length - 1) {
            rh = currentWallArray[currentWallArray.length - 1].lz;
          }
        }
        minHeight = Math.max(minHeight, Math.max(lh, rh));

        const wallLeftPointAfterOverhang = getIntersectionPoint(
          wallPointsAfterOffset[i].leftPoint,
          wallPointsAfterOffset[i].rightPoint,
          wallPointsAfterOffset[(i + wallPointsAfterOffset.length - 1) % wallPointsAfterOffset.length].leftPoint,
          wallPointsAfterOffset[(i + wallPointsAfterOffset.length - 1) % wallPointsAfterOffset.length].rightPoint,
        )
          .setZ(lh - overhangHeight)
          .sub(centerPointPosition);

        const wallRightPointAfterOverhang = getIntersectionPoint(
          wallPointsAfterOffset[i].leftPoint,
          wallPointsAfterOffset[i].rightPoint,
          wallPointsAfterOffset[(i + 1) % wallPointsAfterOffset.length].leftPoint,
          wallPointsAfterOffset[(i + 1) % wallPointsAfterOffset.length].rightPoint,
        )
          .setZ(rh - overhangHeight)
          .sub(centerPointPosition);

        const direction = -w.relativeAngle;
        const length = new Vector3(w.cx, w.cy).sub(centerPointPosition.clone().setZ(0)).length();
        points.push(wallLeftPointAfterOverhang, wallRightPointAfterOverhang, zeroVector, zeroVector);
        points.push(
          wallLeftPointAfterOverhang.clone().add(thicknessVector),
          wallRightPointAfterOverhang.clone().add(thicknessVector),
          zeroVector.clone().add(thicknessVector),
          zeroVector.clone().add(thicknessVector),
        );
        segments.push({ points, direction, length });
      }
    }
    if (!isWallLoopRef.current) {
      const idx = wallPointsAfterOffset.length - 1;
      const leftPointAfterOverhang = getIntersectionPoint(
        wallPointsAfterOffset[idx].leftPoint,
        wallPointsAfterOffset[idx].rightPoint,
        wallPointsAfterOffset[idx - 1].leftPoint,
        wallPointsAfterOffset[idx - 1].rightPoint,
      )
        .setZ(currentWallArray[currentWallArray.length - 1].lz - overhangHeight)
        .sub(centerPointPosition);
      const rightPointAfterOverhang = getIntersectionPoint(
        wallPointsAfterOffset[idx].leftPoint,
        wallPointsAfterOffset[idx].rightPoint,
        wallPointsAfterOffset[0].leftPoint,
        wallPointsAfterOffset[0].rightPoint,
      )
        .setZ(currentWallArray[0].lz - overhangHeight)
        .sub(centerPointPosition);

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
      points.push(leftPointAfterOverhang, rightPointAfterOverhang, zeroVector, zeroVector);
      points.push(
        leftPointAfterOverhang.clone().add(thicknessVector),
        rightPointAfterOverhang.clone().add(thicknessVector),
        zeroVector.clone().add(thicknessVector),
        zeroVector.clone().add(thicknessVector),
      );
      segments.push({ points, direction: -angle, length });
    }

    setMinHeight(minHeight);
    return segments;
  }, [currentWallArray, centerPoint]);

  // set position and rotation
  const parent = getElementById(parentId);
  let rotation = 0;
  if (parent) {
    cx = parent.cx;
    cy = parent.cy;
    cz = parent.lz;
    rotation = parent.rotation[2];

    const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - rotation;
    intersectionPlanePosition.set(centerPoint.x, centerPoint.y, h);
    intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
  }

  // update new roofId
  useEffect(() => {
    if (currentWallArray.length >= 2 && needUpdateWallsId(currentWallArray, prevWallsIdSet)) {
      const newWallsIdAray = currentWallArray.map((v) => v.id);
      const newWallsIdSet = new Set(newWallsIdAray);
      setCommonStore((state) => {
        for (const e of state.elements) {
          if (e.id === id) {
            (e as RoofModel).wallsId = newWallsIdAray;
          }
          if (e.type === ObjectType.Wall && prevWallsIdSet.has(e.id) && !newWallsIdSet.has(e.id)) {
            (e as WallModel).roofId = null;
            (e as WallModel).leftRoofHeight = undefined;
            (e as WallModel).rightRoofHeight = undefined;
          }
        }
      });
    }
  }, [currentWallArray, prevWallsIdSet]);

  useEffect(() => {
    if (currentWallArray.length > 1) {
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

  return (
    <group position={[cx, cy, cz]} rotation={[0, 0, rotation]} name={`Pyramid Roof Group ${id}`}>
      {/* roof segments group */}
      <group
        name={`Pyramid Roof Segments Group`}
        position={[centerPoint.x, centerPoint.y, h]}
        onPointerDown={(e) => {
          handleRoofPointerDown(e, id, parentId);
        }}
        onContextMenu={(e) => {
          handleRoofContextMenu(e, id);
        }}
      >
        {roofSegments.map((segment, idx) => {
          const { points, direction, length } = segment;
          if (points.length > 0) {
            const [leftPoint, rightPoint, zeroVector] = points;
            const isFlat = Math.abs(leftPoint.z) < 0.01;
            if (leftPoint.distanceTo(rightPoint) > 0.1) {
              return (
                <group name={`Roof segment ${idx}`} key={idx}>
                  <RoofSegment
                    points={points}
                    direction={isFlat ? 0 : direction}
                    length={isFlat ? 1 : length}
                    textureType={textureType}
                    color={color ?? 'white'}
                  />
                </group>
              );
            }
          }
        })}
        <PyramidRoofWirefram
          roofSegments={roofSegments}
          thickness={thickness}
          lineColor={lineColor}
          lineWidth={lineWidth}
        />
      </group>

      {/* handle */}
      {selected && !locked && (
        <Sphere
          args={[0.3]}
          position={[centerPoint.x, centerPoint.y, h + thickness + 0.15]}
          onPointerDown={() => {
            oldHeight.current = h;
            setShowIntersectionPlane(true);
            useStoreRef.getState().setEnableOrbitController(false);
          }}
          onPointerUp={() => {
            setShowIntersectionPlane(false);
            useStoreRef.getState().setEnableOrbitController(true);
          }}
        />
      )}

      {/* intersection plane */}
      {showIntersectionPlane && (
        <Plane
          name="Roof Intersection Plane"
          ref={intersectionPlaneRef}
          args={[1000, 100]}
          visible={false}
          rotation={intersectionPlaneRotation}
          position={intersectionPlanePosition}
          onPointerMove={(e) => {
            if (intersectionPlaneRef.current) {
              setRayCast(e);
              const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
              if (intersects[0]) {
                const point = intersects[0].point;
                if (point.z < 0.001) {
                  return;
                }
                setH(Math.max(minHeight, point.z - (parent?.lz ?? 0) - 0.3));
              }
            }
          }}
          onPointerUp={(e) => {
            updateRoofHeight(id, h);
            handleUndoableResizeRoofHeight(id, oldHeight.current, h);
            setShowIntersectionPlane(false);
            useStoreRef.getState().setEnableOrbitController(true);
          }}
        />
      )}
    </group>
  );
};

const RoofSegment = ({
  points,
  direction,
  length,
  textureType,
  color,
}: {
  points: Vector3[];
  direction: number;
  length: number;
  textureType: RoofTexture;
  color: string;
}) => {
  // const mat = useMemo(() => {
  //   const m = new MeshStandardMaterial();
  //   m.map = texture;
  //   return m;
  // }, []);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const meshRef = useRef<Mesh>(null);
  const texture = useRoofTexture(textureType);

  if (meshRef.current) {
    points.push(new Vector3(0, 0, -0.001));

    const geo = new ConvexGeometry(points, direction, length);

    // todo: if has window
    if (false) {
      // const h: Vector3[] = [];
      // h.push(new Vector3(0, 0, -3));
      // h.push(new Vector3(0, 0, 3));
      // h.push(new Vector3(1, 1, -3));
      // h.push(new Vector3(1, 1, 3));
      // h.push(new Vector3(1, -1, -3));
      // h.push(new Vector3(1, -1, 3));
      // const holeMesh = new Mesh(new ConvexGeometry(h), mat);
      // const res = CSG.subtract(roofMesh, holeMesh);
      // meshRef.current.geometry = res.geometry;
    } else {
      meshRef.current.geometry = geo;
    }
  }

  return (
    <mesh ref={meshRef} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
      <meshStandardMaterial
        side={DoubleSide}
        map={texture}
        color={textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white'}
      />
    </mesh>
  );
};

export default PyramidRoof;
