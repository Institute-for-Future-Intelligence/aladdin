/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PyramidRoofModel, RoofModel } from 'src/models/RoofModel';
import { useStore } from 'src/stores/common';
import {
  BoxBufferGeometry,
  BoxGeometry,
  BufferGeometry,
  DoubleSide,
  Euler,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Raycaster,
  Shape,
  Vector2,
  Vector3,
} from 'three';
import * as Selector from 'src/stores/selector';
import { WallModel } from 'src/models/WallModel';
import { Box, Line, Plane, Sphere } from '@react-three/drei';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { HALF_PI } from 'src/constants';
import { useStoreRef } from 'src/stores/commonRef';
import { useThree } from '@react-three/fiber';
import { Point2 } from 'src/models/Point2';
import { Util } from 'src/Util';
import wall from '../wall/wall';
import { ObjectType } from 'src/types';
import { CSG } from 'three-csg-ts';
import { handleUndoableResizeRoofHeight } from './roof';

const centerPointPosition = new Vector3();
const intersectionPlanePosition = new Vector3();
const intersectionPlaneRotation = new Euler();
const zeroVector = new Vector3();

const PyramidRoof = ({ cx, cy, cz, lz, id, parentId, wallsId, selected }: PyramidRoofModel) => {
  const setCommonStore = useStore(Selector.set);
  const getElementById = useStore(Selector.getElementById);
  const removeElementById = useStore(Selector.removeElementById);
  const addUndoable = useStore(Selector.addUndoable);
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

  const roofSegments = useMemo(() => {
    const segments: Vector3[][] = [];
    if (currentWallArray.length < 2) {
      return segments;
    }
    let minHeight = 0;
    for (let i = 0; i < currentWallArray.length; i++) {
      const w = currentWallArray[i];
      if (
        w.leftPoint.length > 0 &&
        w.rightPoint.length > 0 &&
        (w.leftPoint[0] !== w.rightPoint[0] || w.leftPoint[1] !== w.rightPoint[1])
      ) {
        const vectors = [];
        const { lh, rh } = getWallHeight(currentWallArray, i);
        minHeight = Math.max(minHeight, Math.max(lh, rh));
        const leftPoint = new Vector3(w.leftPoint[0], w.leftPoint[1], lh).sub(centerPointPosition);
        const rightPoint = new Vector3(w.rightPoint[0], w.rightPoint[1], rh).sub(centerPointPosition);
        vectors.push(leftPoint, rightPoint, zeroVector, zeroVector);
        segments.push(vectors);
      }
    }
    if (!isWallLoopRef.current) {
      const firstWall = currentWallArray[0];
      const lastWall = currentWallArray[currentWallArray.length - 1];
      const leftPoint = new Vector3(
        lastWall.rightPoint[0] ?? lastWall.leftPoint[0],
        lastWall.rightPoint[1] ?? lastWall.leftPoint[1],
        lastWall.lz,
      ).sub(centerPointPosition);
      const rightPoint = new Vector3(firstWall.leftPoint[0], firstWall.leftPoint[1], firstWall.lz).sub(
        centerPointPosition,
      );
      segments[0][0].setZ(firstWall.lz - centerPointPosition.z);
      segments[segments.length - 1][1].setZ(lastWall.lz - centerPointPosition.z);
      const vectors = [];
      vectors.push(leftPoint, rightPoint, zeroVector, zeroVector);
      segments.push(vectors);
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
    <group position={[cx, cy, cz]} rotation={[0, 0, rotation]} name={`PyramidRoof Group ${id}`}>
      {/* roof segments group */}
      <group
        name="Roof Segments Group"
        position={[centerPoint.x, centerPoint.y, h]}
        scale={1.1}
        onPointerDown={(e) => {
          if (e.intersections[0].eventObject.name === e.eventObject.name) {
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  e.selected = true;
                } else {
                  e.selected = false;
                }
              }
            });
          }
        }}
      >
        {roofSegments.map((v, idx) => {
          if (v.length > 0) {
            const [leftPoint, rightPoint, zeroVector] = v;
            const showCenterWireFrame = Math.abs(leftPoint.z) > 0.1;
            if (leftPoint.distanceTo(rightPoint) > 0.1) {
              return (
                <group name={`Roof segment ${idx}`} key={idx}>
                  <RoofSegment v={v} />
                  <Line points={[leftPoint, rightPoint]} lineWidth={0.2} />
                  {showCenterWireFrame && (
                    <>
                      <Line points={[leftPoint, zeroVector]} lineWidth={0.2} />
                      <Line points={[rightPoint, zeroVector]} lineWidth={0.2} />
                    </>
                  )}
                </group>
              );
            }
          }
        })}
      </group>

      {/* handle */}
      {selected && (
        <Sphere
          args={[0.3]}
          position={[centerPoint.x, centerPoint.y, h + 0.3]}
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

const RoofSegment = ({ v }: { v: Vector3[] }) => {
  const mat = useMemo(() => {
    return new MeshStandardMaterial();
  }, []);
  const meshRef = useRef<Mesh>(null);

  if (meshRef.current) {
    v.push(new Vector3(0, 0, -0.001));

    const roofMesh = new Mesh(new ConvexGeometry(v), mat);

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
      meshRef.current.geometry = roofMesh.geometry;
    }
  }

  return (
    <mesh ref={meshRef} castShadow>
      <meshStandardMaterial side={DoubleSide} color="#2F4F4F" />
    </mesh>
  );
};

export default PyramidRoof;
