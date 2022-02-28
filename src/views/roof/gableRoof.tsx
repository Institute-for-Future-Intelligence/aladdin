/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Plane, Sphere } from '@react-three/drei';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Point2 } from 'src/models/Point2';
import { GableRoofModel } from 'src/models/RoofModel';
import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { DoubleSide, Euler, Mesh, Raycaster, Vector2, Vector3 } from 'three';
import { useStoreRef } from 'src/stores/commonRef';
import { useThree } from '@react-three/fiber';
import { HALF_PI } from 'src/constants';
import { ElementModel } from 'src/models/ElementModel';

const intersectionPlanePosition = new Vector3();
const intersectionPlaneRotation = new Euler();
const zeroVector2 = new Vector2();

enum RoofHandleType {
  Mid = 'Mid',
  Left = 'Left',
  Right = 'Right',
  Null = 'Null',
}

const GableRoof = ({ id, parentId, cx, cy, cz, wallsId, selected }: GableRoofModel) => {
  const setCommonStore = useStore(Selector.set);
  const getElementById = useStore(Selector.getElementById);
  const elements = useStore(Selector.elements);
  const { gl, camera } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);

  const [h, setH] = useState(8);
  const [showIntersectionPlane, setShowIntersectionPlane] = useState(false);
  const [roofHandleType, setRoofHandleType] = useState<RoofHandleType>(RoofHandleType.Null);

  const shedWallIndex = useRef(-1);
  const intersectionPlaneRef = useRef<Mesh>(null);

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const getWallCenterPoint = (wall: WallModel) => {
    if (wall.centerRoofHeight) {
      const v = new Vector3(wall.centerRoofHeight[0] * wall.lx, 0, 0);
      const e = new Euler(0, 0, wall.relativeAngle);
      return new Vector3(wall.cx, wall.cy, h).add(v.applyEuler(e));
    } else {
      return new Vector3(wall.cx, wall.cy, h);
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

  const currentWallArray = useMemo(() => {
    const array: WallModel[] = [];
    if (wallsId.length > 0) {
      const wall = getElementById(wallsId[0]) as WallModel;
      array.push(wall);
      if (wall) {
        const leftWall = getElementById(wall.leftJoints[0]) as WallModel;
        const rightWall = getElementById(wall.rightJoints[0]) as WallModel;
        if (leftWall && rightWall) {
          array.push(leftWall, rightWall);
          const midWall = getElementById(leftWall.leftJoints[0]) as WallModel;
          if (midWall) {
            array.push(midWall);
          }
        }
      }
    }
    return array;
  }, [elements]);

  const ridgeLeftPoint = useMemo(() => {
    const wall = currentWallArray[1];
    return getWallCenterPoint(wall);
  }, [currentWallArray, h]);

  const ridgeRightPoint = useMemo(() => {
    const wall = currentWallArray[2];
    return getWallCenterPoint(wall);
  }, [currentWallArray, h]);

  const ridgeMidPoint = useMemo(() => {
    return new Vector3((ridgeLeftPoint.x + ridgeRightPoint.x) / 2, (ridgeLeftPoint.y + ridgeRightPoint.y) / 2, h);
  }, [ridgeLeftPoint, ridgeRightPoint]);

  const roofSegments = useMemo(() => {
    const segments: Vector3[][] = [];

    // shed roof
    if (currentWallArray[1].centerRoofHeight && Math.abs(currentWallArray[1].centerRoofHeight[0]) === 0.5) {
      const vector = [];
      const currWall = currentWallArray[currentWallArray[1].centerRoofHeight[0] < 0 ? 0 : 3];
      const currLeftPoint = new Vector3();
      const currRightPoint = new Vector3();
      currLeftPoint.set(currWall.leftPoint[0], currWall.leftPoint[1], currWall.lz).sub(ridgeMidPoint);
      currRightPoint.set(currWall.rightPoint[0], currWall.rightPoint[1], currWall.lz).sub(ridgeMidPoint);
      vector.push(
        currLeftPoint,
        currRightPoint,
        ridgeLeftPoint.clone().sub(ridgeMidPoint),
        ridgeRightPoint.clone().sub(ridgeMidPoint),
      );
      segments.push(vector);
    }
    // gable roof
    else {
      for (let i = 0; i < 4; i += 3) {
        const vector = [];
        const currWall = currentWallArray[i];
        const currLeftPoint = new Vector3();
        const currRightPoint = new Vector3();
        currLeftPoint.set(currWall.leftPoint[0], currWall.leftPoint[1], currWall.lz).sub(ridgeMidPoint);
        currRightPoint.set(currWall.rightPoint[0], currWall.rightPoint[1], currWall.lz).sub(ridgeMidPoint);
        vector.push(
          currLeftPoint,
          currRightPoint,
          ridgeLeftPoint.clone().sub(ridgeMidPoint),
          ridgeRightPoint.clone().sub(ridgeMidPoint),
        );
        segments.push(vector);
      }
    }

    return segments;
  }, [currentWallArray, ridgeLeftPoint, ridgeRightPoint, h]);

  // set position and rotation
  const parent = getElementById(parentId);
  let rotation = 0;
  if (parent) {
    cx = parent.cx;
    cy = parent.cy;
    cz = parent.lz;
    rotation = parent.rotation[2];
  }

  useEffect(() => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === currentWallArray[1].id) {
          const w = e as WallModel;
          w.roofId = id;
          if (w.centerRoofHeight) {
            w.centerRoofHeight[1] = h;
          } else {
            w.centerRoofHeight = [0, h];
          }
        }
        if (e.id === currentWallArray[2].id) {
          const w = e as WallModel;
          w.roofId = id;
          if (w.centerRoofHeight) {
            w.centerRoofHeight[1] = h;
          } else {
            w.centerRoofHeight = [0, h];
          }
        }
      }
    });
  }, [currentWallArray, h]);

  return (
    <group position={[cx, cy, cz]} rotation={[0, 0, rotation]} name={`GableRoof Group ${id}`}>
      {/* roof segments group */}
      <group
        name={'Roof Segment Group'}
        position={[ridgeMidPoint.x, ridgeMidPoint.y, ridgeMidPoint.z]}
        scale={1.1} // todo: should use actual mid point
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
          return (
            <mesh key={i}>
              <convexGeometry args={[v]} />
              <meshStandardMaterial side={DoubleSide} color="#2F4F4F" />
            </mesh>
          );
        })}
      </group>

      {/* handles */}
      {selected && (
        <group>
          {/* mid handle */}
          <Sphere
            position={[ridgeMidPoint.x, ridgeMidPoint.y, ridgeMidPoint.z + 0.15]}
            args={[0.3]}
            onPointerDown={() => {
              setShowIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeMidPoint.x, ridgeMidPoint.y, h);
              if (parent) {
                const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - parent.rotation[2];
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Mid);
              useStoreRef.getState().setEnableOrbitController(false);
            }}
          />
          {/* side handles */}
          <Sphere
            position={[ridgeLeftPoint.x, ridgeLeftPoint.y, ridgeLeftPoint.z + 0.15]}
            args={[0.3]}
            onPointerDown={() => {
              setShowIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeLeftPoint.x, ridgeLeftPoint.y, h);
              if (parent && currentWallArray[1]) {
                const r = currentWallArray[1].relativeAngle;
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.Left);
              useStoreRef.getState().setEnableOrbitController(false);
            }}
          />
          <Sphere
            position={[ridgeRightPoint.x, ridgeRightPoint.y, ridgeRightPoint.z + 0.15]}
            args={[0.3]}
            onPointerDown={() => {
              setShowIntersectionPlane(true);
              intersectionPlanePosition.set(ridgeRightPoint.x, ridgeRightPoint.y, h);
              if (parent && currentWallArray[2]) {
                const r = currentWallArray[2].relativeAngle;
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
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
            if (intersectionPlaneRef.current) {
              setRayCast(e);
              const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
              if (intersects[0]) {
                const point = intersects[0].point;
                switch (roofHandleType) {
                  case RoofHandleType.Left: {
                    const wall = currentWallArray[1];
                    if (wall) {
                      const foundation = getElementById(wall.parentId);
                      if (foundation) {
                        const x = getRelPos(foundation, wall, point);
                        setCommonStore((state) => {
                          for (const e of state.elements) {
                            if (e.id === wall.id) {
                              const w = e as WallModel;
                              if (w.centerRoofHeight) {
                                w.centerRoofHeight[0] = x;
                              } else {
                                w.centerRoofHeight = [x, h];
                              }
                            }
                            if (e.id === currentWallArray[2].id) {
                              const w = e as WallModel;
                              if (w.centerRoofHeight) {
                                w.centerRoofHeight[0] = -x;
                              } else {
                                w.centerRoofHeight = [-x, h];
                              }
                            }
                            if (e.id === currentWallArray[3].id) {
                              if (x === -0.5) {
                                const w = e as WallModel;
                                w.roofId = id;
                                w.leftRoofHeight = h - w.lz / 2;
                                w.rightRoofHeight = h - w.lz / 2;
                                w.centerRoofHeight = undefined;
                              } else {
                                const w = e as WallModel;
                                w.leftRoofHeight = undefined;
                                w.rightRoofHeight = undefined;
                              }
                            }
                            if (e.id === currentWallArray[0].id) {
                              if (x === 0.5) {
                                const w = e as WallModel;
                                w.roofId = id;
                                w.leftRoofHeight = h - w.lz / 2;
                                w.rightRoofHeight = h - w.lz / 2;
                                w.centerRoofHeight = undefined;
                              } else {
                                const w = e as WallModel;
                                w.leftRoofHeight = undefined;
                                w.rightRoofHeight = undefined;
                              }
                            }
                          }
                        });
                      }
                    }
                    break;
                  }
                  case RoofHandleType.Right: {
                    const wall = currentWallArray[2];
                    if (wall) {
                      const foundation = getElementById(wall.parentId);
                      if (foundation) {
                        const x = getRelPos(foundation, wall, point);
                        setCommonStore((state) => {
                          for (const e of state.elements) {
                            if (e.id === wall.id) {
                              const w = e as WallModel;
                              if (w.centerRoofHeight) {
                                w.centerRoofHeight[0] = x;
                              } else {
                                w.centerRoofHeight = [x, h];
                              }
                            }
                            if (e.id === currentWallArray[1].id) {
                              const w = e as WallModel;
                              if (w.centerRoofHeight) {
                                w.centerRoofHeight[0] = -x;
                              } else {
                                w.centerRoofHeight = [-x, h];
                              }
                            }
                            if (e.id === currentWallArray[3].id) {
                              if (x === 0.5) {
                                const w = e as WallModel;
                                w.roofId = id;
                                w.leftRoofHeight = h - w.lz / 2;
                                w.rightRoofHeight = h - w.lz / 2;
                                w.centerRoofHeight = undefined;
                              } else {
                                const w = e as WallModel;
                                w.leftRoofHeight = undefined;
                                w.rightRoofHeight = undefined;
                              }
                            }
                            if (e.id === currentWallArray[0].id) {
                              if (x === -0.5) {
                                const w = e as WallModel;
                                w.roofId = id;
                                w.leftRoofHeight = h - w.lz / 2;
                                w.rightRoofHeight = h - w.lz / 2;
                                w.centerRoofHeight = undefined;
                              } else {
                                const w = e as WallModel;
                                w.leftRoofHeight = undefined;
                                w.rightRoofHeight = undefined;
                              }
                            }
                          }
                        });
                      }
                    }
                    break;
                  }
                  case RoofHandleType.Mid: {
                    if (parent) {
                      setH(point.z - parent.lz - 0.3); // todo
                    }
                    break;
                  }
                }
              }
            }
          }}
          onPointerUp={() => {
            setShowIntersectionPlane(false);
            setRoofHandleType(RoofHandleType.Null);
            useStoreRef.getState().setEnableOrbitController(true);
          }}
        >
          <meshBasicMaterial side={DoubleSide} transparent={true} opacity={0.5} />
        </Plane>
      )}
    </group>
  );
};

const RoofSegment = () => {};

export default GableRoof;
