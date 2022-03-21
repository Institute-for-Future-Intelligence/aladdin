/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Line, Plane, Sphere } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HALF_PI } from 'src/constants';
import { Point2 } from 'src/models/Point2';
import { HipRoofModel } from 'src/models/RoofModel';
import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import * as Selector from 'src/stores/selector';
import { Util } from 'src/Util';
import { DoubleSide, Euler, Mesh, Raycaster, Vector2, Vector3 } from 'three';

interface RoofSegmentWireframeProps {
  leftRoof: Vector3;
  rightRoof: Vector3;
  leftRidge: Vector3;
  rightRidge: Vector3;
}

enum RoofHandleType {
  Mid = 'Mid',
  Left = 'Left',
  Right = 'Right',
  Null = 'Null',
}

const intersectionPlanePosition = new Vector3();
const intersectionPlaneRotation = new Euler();

const HipRoof = ({
  id,
  parentId,
  cx,
  cy,
  cz,
  lz,
  wallsId,
  leftRidgeLength,
  rightRidgeLength,
  selected,
}: HipRoofModel) => {
  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);
  const removeElementById = useStore(Selector.removeElementById);
  const elements = useStore(Selector.elements);

  // set position and rotation
  const parent = getElementById(parentId);
  let rotation = 0;
  if (parent) {
    cx = parent.cx;
    cy = parent.cy;
    cz = parent.lz;
    rotation = parent.rotation[2];
  }

  const [leftRidgeLengthCurr, setLeftRidgeLengthCurr] = useState(leftRidgeLength);
  const [rightRidgeLengthCurr, setRightRidgeLengthCurr] = useState(rightRidgeLength);
  const [h, setH] = useState(lz);
  const [minHeight, setMinHeight] = useState(lz);
  const [enableIntersectionPlane, setEnableIntersectionPlane] = useState(false);
  const [roofHandleType, setRoofHandleType] = useState<RoofHandleType>(RoofHandleType.Null);

  const intersectionPlaneRef = useRef<Mesh>(null);
  const { gl, camera } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);

  useEffect(() => {
    if (h < minHeight) {
      setH(minHeight * 1.5);
    }
  }, [minHeight]);

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

  const getWallPoint = (wallArray: WallModel[]) => {
    const arr: Point2[] = [];
    for (const w of wallArray) {
      if (w.leftPoint[0] && w.leftPoint[1]) {
        arr.push({ x: w.leftPoint[0], y: w.leftPoint[1] });
      }
    }
    return arr;
  };

  const centroid2D = useMemo(() => {
    if (currentWallArray.length !== 4) {
      return new Vector2();
    }
    const points = getWallPoint(currentWallArray);
    const p = Util.calculatePolygonCentroid(points);
    return new Vector2(p.x, p.y);
  }, [currentWallArray]);

  const ridgeLeftPoint = useMemo(() => {
    const vector = new Vector3();
    const center = new Vector3(centroid2D.x, centroid2D.y, h);
    const wall = getElementById(wallsId[0]) as WallModel;
    if (wall) {
      vector.setX(-leftRidgeLengthCurr).applyEuler(new Euler(0, 0, wall.relativeAngle)).add(center);
    }
    return vector;
  }, [centroid2D, h, leftRidgeLengthCurr]);

  const ridgeRightPoint = useMemo(() => {
    const vector = new Vector3();
    const center = new Vector3(centroid2D.x, centroid2D.y, h);
    const wall = getElementById(wallsId[0]) as WallModel;
    if (wall) {
      vector.setX(rightRidgeLengthCurr).applyEuler(new Euler(0, 0, wall.relativeAngle)).add(center);
    }
    return vector;
  }, [centroid2D, h, rightRidgeLengthCurr]);

  const ridgeMidPoint = useMemo(() => {
    return new Vector3(centroid2D.x, centroid2D.y, h);
  }, [centroid2D, h]);

  const makeSement = (vector: Vector3[], p1: Vector3, p2: Vector3, p3: Vector3, p4: Vector3) => {
    vector.push(p1, p2, p3, p4);
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

  const roofSegments = useMemo(() => {
    const segments: Vector3[][] = [];
    let minHeight = 0;
    if (currentWallArray.length !== 4) {
      return segments;
    }
    for (let i = 0; i < 4; i++) {
      const vector: Vector3[] = [];
      const wall = currentWallArray[i];
      const { lh, rh } = getWallHeight(currentWallArray, i);
      minHeight = Math.max(minHeight, Math.max(lh, rh));
      const wallLeftPoint = new Vector3(wall.leftPoint[0], wall.leftPoint[1], lh).sub(ridgeMidPoint);
      const wallRightPoint = new Vector3(wall.rightPoint[0], wall.rightPoint[1], rh).sub(ridgeMidPoint);
      const ridgeLeft = ridgeLeftPoint.clone().sub(ridgeMidPoint);
      const ridgeRight = ridgeRightPoint.clone().sub(ridgeMidPoint);
      switch (i) {
        case 0:
          makeSement(vector, wallLeftPoint, wallRightPoint, ridgeRight, ridgeLeft);
          break;
        case 1:
          makeSement(vector, wallLeftPoint, wallRightPoint, ridgeRight, ridgeRight);
          break;
        case 2:
          makeSement(vector, wallLeftPoint, wallRightPoint, ridgeLeft, ridgeRight);
          break;
        case 3:
          makeSement(vector, wallLeftPoint, wallRightPoint, ridgeLeft, ridgeLeft);
          break;
      }
      segments.push(vector);
    }
    setMinHeight(minHeight);
    return segments;
  }, [currentWallArray, ridgeLeftPoint, ridgeRightPoint, h]);

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  useEffect(() => {
    if (currentWallArray.length === 4) {
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
    <group position={[cx, cy, cz + 0.01]} rotation={[0, 0, rotation]} name={`HipRoof Group ${id}`}>
      {/* roof segment group */}
      <group
        name="Roof Segments Group"
        position={[centroid2D.x, centroid2D.y, h]}
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
        {roofSegments.map((v, i) => {
          const [leftRoof, rightRoof, rightRidge, leftRidge] = v;
          const showCenterWireFrame = Math.abs(leftRoof.z) > 0.1;
          return (
            <group key={i} name={`Roof segment ${i}`}>
              <mesh>
                <convexGeometry args={[v]} />
                <meshStandardMaterial side={DoubleSide} color="#2F4F4F" />
              </mesh>
              <Line points={[leftRoof, rightRoof]} lineWidth={0.2} />
              {showCenterWireFrame && (
                <RoofSegmentWireframe
                  leftRoof={leftRoof}
                  leftRidge={leftRidge}
                  rightRoof={rightRoof}
                  rightRidge={rightRidge}
                />
              )}
            </group>
          );
        })}
      </group>

      {/* handles */}
      {selected && (
        <group>
          {/* left handle */}
          <Sphere
            position={[ridgeLeftPoint.x, ridgeLeftPoint.y, ridgeLeftPoint.z]}
            args={[0.3]}
            onPointerDown={() => {
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeLeftPoint.x, ridgeLeftPoint.y, h);
              if (parent && currentWallArray[0]) {
                const r = currentWallArray[0].relativeAngle;
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Left);
              useStoreRef.getState().setEnableOrbitController(false);
            }}
          />
          {/* mid handle */}
          <Sphere
            position={[ridgeMidPoint.x, ridgeMidPoint.y, ridgeMidPoint.z]}
            args={[0.3]}
            onPointerDown={() => {
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeMidPoint.x, ridgeMidPoint.y, h);
              if (parent) {
                const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - parent.rotation[2];
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Mid);
              useStoreRef.getState().setEnableOrbitController(false);
            }}
          />
          {/* right handle */}
          <Sphere
            position={[ridgeRightPoint.x, ridgeRightPoint.y, ridgeRightPoint.z]}
            args={[0.3]}
            onPointerDown={() => {
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeRightPoint.x, ridgeRightPoint.y, h);
              if (parent && currentWallArray[0]) {
                const r = currentWallArray[0].relativeAngle;
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Right);
              useStoreRef.getState().setEnableOrbitController(false);
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
            if (intersectionPlaneRef.current) {
              setRayCast(e);
              const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
              if (intersects[0] && parent) {
                const point = intersects[0].point;
                switch (roofHandleType) {
                  case RoofHandleType.Left: {
                    const midPointVector = ridgeMidPoint
                      .clone()
                      .sub(intersectionPlanePosition)
                      .applyEuler(new Euler(0, 0, -intersectionPlaneRotation.z));

                    const p = point
                      .clone()
                      .sub(new Vector3(parent.cx, parent.cy, parent.cz))
                      .applyEuler(new Euler(0, 0, -parent.rotation[2]))
                      .sub(intersectionPlanePosition)
                      .applyEuler(new Euler(0, 0, -intersectionPlaneRotation.z));

                    const d = new Vector3().subVectors(p, midPointVector).x;

                    setLeftRidgeLengthCurr(
                      Math.max(Math.min(-d, currentWallArray[0].lx / 2), -rightRidgeLengthCurr + 0.1),
                    );
                    break;
                  }
                  case RoofHandleType.Right: {
                    const midPointVector = ridgeMidPoint
                      .clone()
                      .sub(intersectionPlanePosition)
                      .applyEuler(new Euler(0, 0, -intersectionPlaneRotation.z));

                    const p = point
                      .clone()
                      .sub(new Vector3(parent.cx, parent.cy, parent.cz))
                      .applyEuler(new Euler(0, 0, -parent.rotation[2]))
                      .sub(intersectionPlanePosition)
                      .applyEuler(new Euler(0, 0, -intersectionPlaneRotation.z));

                    const d = new Vector3().subVectors(p, midPointVector).x;

                    if (currentWallArray[0]) {
                      setRightRidgeLengthCurr(
                        Math.max(Math.min(d, currentWallArray[0].lx / 2), -leftRidgeLengthCurr + 0.1),
                      );
                    }
                    break;
                  }
                  case RoofHandleType.Mid: {
                    setH(Math.max(minHeight, point.z - (parent?.lz ?? 0) - 0.3));
                    break;
                  }
                }
              }
            }
          }}
          onPointerUp={() => {
            setEnableIntersectionPlane(false);
            setRoofHandleType(RoofHandleType.Null);
            useStoreRef.getState().setEnableOrbitController(true);
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  (e as HipRoofModel).leftRidgeLength = leftRidgeLengthCurr;
                  (e as HipRoofModel).rightRidgeLength = rightRidgeLengthCurr;
                  (e as HipRoofModel).lz = h;
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

const RoofSegmentWireframe = ({ leftRoof, leftRidge, rightRoof, rightRidge }: RoofSegmentWireframeProps) => {
  const lineWidth = 0.2;
  return (
    <>
      <Line points={[rightRoof, rightRidge]} lineWidth={lineWidth} />
      <Line points={[rightRidge, leftRidge]} lineWidth={lineWidth} />
      <Line points={[leftRidge, leftRoof]} lineWidth={lineWidth} />
    </>
  );
};

export default HipRoof;
