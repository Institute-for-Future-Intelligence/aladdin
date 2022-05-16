/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Plane, Sphere } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HALF_PI } from 'src/constants';
import { ElementModel } from 'src/models/ElementModel';
import { Point2 } from 'src/models/Point2';
import { GambrelRoofModel } from 'src/models/RoofModel';
import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import * as Selector from 'src/stores/selector';
import { UnoableResizeGambrelAndMansardRoofRidge } from 'src/undo/UndoableResize';
import { Util } from 'src/Util';
import {
  BufferGeometry,
  DoubleSide,
  Euler,
  Float32BufferAttribute,
  Mesh,
  Raycaster,
  Texture,
  Vector2,
  Vector3,
} from 'three';
import { ConvexGeoProps, handleUndoableResizeRoofHeight, useRoofTexture } from './roof';
import { CSG } from 'three-csg-ts';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
import { ObjectType } from '../../types';

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

const intersectionPlanePosition = new Vector3();
const intersectionPlaneRotation = new Euler();
const zeroVector2 = new Vector2();

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
  color,
}: GambrelRoofModel) => {
  const texture = useRoofTexture(textureType);

  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);
  const removeElementById = useStore(Selector.removeElementById);
  const elements = useStore(Selector.elements); // todo: could optimize

  const [h, setH] = useState(lz); // todo: should have one when build
  const [minHeight, setMinHeight] = useState(lz / 2);
  const [roofHandleType, setRoofHandleType] = useState(RoofHandleType.Null);
  const [enableIntersectionPlane, setEnableIntersectionPlane] = useState(false);
  const intersectionPlaneRef = useRef<Mesh>(null);
  const { gl, camera } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);
  const oldHeight = useRef<number>(h);
  const oldRidgeVal = useRef<number>(0);

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
    if (h < minHeight) {
      setH(minHeight);
    }
  }, [minHeight]);

  useEffect(() => {
    setH(lz);
  }, [lz]);

  const updateRidge = (elemId: string, type: string, val: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === elemId) {
          switch (type) {
            case RoofHandleType.FrontLeft:
              (e as GambrelRoofModel).frontRidgeLeftPoint[0] = val;
              break;
            case RoofHandleType.FrontRight:
              (e as GambrelRoofModel).frontRidgeRightPoint[0] = val;
              break;
            case RoofHandleType.TopLeft:
              (e as GambrelRoofModel).topRidgeLeftPoint[0] = val;
              break;
            case RoofHandleType.TopRight:
              (e as GambrelRoofModel).topRidgeRightPoint[0] = val;
              break;
            case RoofHandleType.BackLeft:
              (e as GambrelRoofModel).backRidgeLeftPoint[0] = val;
              break;
            case RoofHandleType.BackRight:
              (e as GambrelRoofModel).backRidgeRightPoint[0] = val;
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

  const getRidgePoint = (wall: WallModel, px: number, ph: number) => {
    if (!wall) {
      return new Vector3();
    }
    const e = new Euler(0, 0, wall.relativeAngle);
    const v = new Vector3(px * wall.lx, 0, 0);
    const height = ph * (h - minHeight) + minHeight;
    return new Vector3(wall.cx, wall.cy, height).add(v.applyEuler(e));
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
    return getRidgePoint(wall, x, h).sub(centroid);
  }, [currentWallArray, centroid, frontRidgeLeftPoint]);

  const frontRidgeRightPointV3 = useMemo(() => {
    const wall = currentWallArray[1];
    const [x, h] = frontRidgeRightPoint;
    return getRidgePoint(wall, x, h).sub(centroid);
  }, [currentWallArray, centroid, frontRidgeRightPoint]);

  // back ridge
  const backRidgeLeftPointV3 = useMemo(() => {
    const wall = currentWallArray[1];
    const [x, h] = backRidgeLeftPoint;
    return getRidgePoint(wall, x, h).sub(centroid);
  }, [currentWallArray, centroid, backRidgeLeftPoint]);

  const backRidgeRightPointV3 = useMemo(() => {
    const wall = currentWallArray[3];
    const [x, h] = backRidgeRightPoint;
    return getRidgePoint(wall, x, h).sub(centroid);
  }, [currentWallArray, centroid, backRidgeRightPoint]);

  // todo: should determained by wall 0 and 2;
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
    // const segments: Vector3[][] = [];
    const segments: ConvexGeoProps[] = [];

    if (currentWallArray.length != 4) {
      return segments;
    }

    // front side
    const frontSide: Vector3[] = [];
    const frontWall = currentWallArray[0];
    const frontDirection = -frontWall.relativeAngle;
    const { lh: frontWallLh, rh: frontWallRh } = getWallHeight(currentWallArray, 0);
    const frontWallLeftPoint = new Vector3(frontWall.leftPoint[0], frontWall.leftPoint[1], frontWallLh).sub(centroid);
    const frontWallRightPoint = new Vector3(frontWall.rightPoint[0], frontWall.rightPoint[1], frontWallRh).sub(
      centroid,
    );
    const frontSideLenght = new Vector3(frontWall.cx, frontWall.cy).sub(topRidgeMidPointV3.setZ(0)).length();
    frontSide.push(frontWallLeftPoint, frontWallRightPoint, frontRidgeRightPointV3, frontRidgeLeftPointV3);
    segments.push({ points: frontSide, direction: frontDirection, length: frontSideLenght });

    // front top
    const frontTop: Vector3[] = [];
    frontTop.push(frontRidgeLeftPointV3, frontRidgeRightPointV3, topRidgeRightPointV3, topRidgeLeftPointV3);
    segments.push({ points: frontTop, direction: frontDirection, length: frontSideLenght });

    // back side
    const backSide: Vector3[] = [];
    const backWall = currentWallArray[2];
    const backDirection = -backWall.relativeAngle;
    const { lh: backWallLh, rh: backWallRh } = getWallHeight(currentWallArray, 2);
    const backWallLeftPoint = new Vector3(backWall.leftPoint[0], backWall.leftPoint[1], backWallLh).sub(centroid);
    const backWallRightPoint = new Vector3(backWall.rightPoint[0], backWall.rightPoint[1], backWallRh).sub(centroid);
    const backSideLenght = new Vector3(backWall.cx, backWall.cy).sub(topRidgeMidPointV3.setZ(0)).length();
    backSide.push(backWallLeftPoint, backWallRightPoint, backRidgeRightPointV3, backRidgeLeftPointV3);
    segments.push({ points: backSide, direction: backDirection, length: backSideLenght });

    // back top
    const backTop: Vector3[] = [];
    backTop.push(topRidgeLeftPointV3, topRidgeRightPointV3, backRidgeLeftPointV3, backRidgeRightPointV3);
    segments.push({ points: backTop, direction: backDirection, length: backSideLenght });

    return segments;
  }, [currentWallArray, h]);

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const setInterSectionPlane = (handlePointV3: Vector3, wall: WallModel) => {
    setEnableIntersectionPlane(true);
    useStoreRef.getState().setEnableOrbitController(false);
    intersectionPlanePosition.set(handlePointV3.x, handlePointV3.y, h).add(centroid);
    if (parent && wall) {
      const r = wall.relativeAngle;
      intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
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
                if (w.centerRoofHeight && w.centerLeftRoofHeight && w.centerRightRoofHeight) {
                  w.centerRoofHeight[0] = topRidgeRightPoint[0];
                  w.centerRoofHeight[1] = topRidgeRightPoint[1] * (h - minHeight) + minHeight;
                  w.centerLeftRoofHeight[0] = frontRidgeRightPoint[0];
                  w.centerLeftRoofHeight[1] = frontRidgeRightPoint[1] * (h - minHeight) + minHeight;
                  w.centerRightRoofHeight[0] = backRidgeLeftPoint[0];
                  w.centerRightRoofHeight[1] = backRidgeLeftPoint[1] * (h - minHeight) + minHeight;
                } else {
                  w.centerRoofHeight = [...topRidgeRightPoint];
                  w.centerLeftRoofHeight = [...frontRidgeRightPoint];
                  w.centerRightRoofHeight = [...backRidgeLeftPoint];
                }
              }
              if (i === 3) {
                if (w.centerRoofHeight && w.centerLeftRoofHeight && w.centerRightRoofHeight) {
                  w.centerRoofHeight[0] = topRidgeLeftPoint[0];
                  w.centerRoofHeight[1] = topRidgeLeftPoint[1] * (h - minHeight) + minHeight;
                  w.centerLeftRoofHeight[0] = backRidgeRightPoint[0];
                  w.centerLeftRoofHeight[1] = backRidgeRightPoint[1] * (h - minHeight) + minHeight;
                  w.centerRightRoofHeight[0] = frontRidgeLeftPoint[0];
                  w.centerRightRoofHeight[1] = frontRidgeLeftPoint[1] * (h - minHeight) + minHeight;
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
      setMinHeight(minHeight);
    } else {
      removeElementById(id, false);
    }
  }, [currentWallArray, h]);

  return (
    <group position={[cx, cy, cz + 0.01]} rotation={[0, 0, rotation]} name={`GambrelRoof Group ${id}`}>
      {/* roof segments */}
      <group
        position={[centroid.x, centroid.y, centroid.z]}
        scale={new Vector3(1.1, 1, 1)}
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
        {roofSegments.map((segment, i, arr) => {
          const { points, direction, length } = segment;
          const [leftRoof, rightRoof, rightRidge, leftRidge] = points;
          const isFlat = Math.abs(leftRoof.z) < 0.1;
          return (
            <group key={i} name={`Roof segment ${i}`}>
              <mesh>
                <convexGeometry args={[points, isFlat ? arr[0].direction : direction, isFlat ? 1 : length]} />
                <meshStandardMaterial map={texture} side={DoubleSide} color={color} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* handles */}
      {selected && (
        <group position={[centroid.x, centroid.y, centroid.z]}>
          <Sphere
            position={[topRidgeLeftPointV3.x, topRidgeLeftPointV3.y, topRidgeLeftPointV3.z]}
            args={[0.3]}
            onPointerDown={() => {
              oldRidgeVal.current = topRidgeLeftPoint[0];
              setInterSectionPlane(topRidgeLeftPointV3, currentWallArray[3]);
              setRoofHandleType(RoofHandleType.TopLeft);
            }}
          />
          <Sphere
            position={[topRidgeRightPointV3.x, topRidgeRightPointV3.y, topRidgeRightPointV3.z]}
            args={[0.3]}
            onPointerDown={() => {
              oldRidgeVal.current = topRidgeRightPoint[0];
              setInterSectionPlane(topRidgeRightPointV3, currentWallArray[1]);
              setRoofHandleType(RoofHandleType.TopRight);
            }}
          />
          <Sphere
            position={[topRidgeMidPointV3.x, topRidgeMidPointV3.y, topRidgeMidPointV3.z]}
            args={[0.3]}
            onPointerDown={() => {
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(topRidgeMidPointV3.x, topRidgeMidPointV3.y, h).add(centroid);
              if (parent) {
                const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - parent.rotation[2];
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.TopMid);
              useStoreRef.getState().setEnableOrbitController(false);
              oldHeight.current = h;
            }}
          />

          <Sphere
            position={[frontRidgeLeftPointV3.x, frontRidgeLeftPointV3.y, frontRidgeLeftPointV3.z]}
            args={[0.3]}
            onPointerDown={() => {
              oldRidgeVal.current = frontRidgeLeftPoint[0];
              setInterSectionPlane(frontRidgeLeftPointV3, currentWallArray[3]);
              setRoofHandleType(RoofHandleType.FrontLeft);
            }}
          />
          <Sphere
            position={[frontRidgeRightPointV3.x, frontRidgeRightPointV3.y, frontRidgeRightPointV3.z]}
            args={[0.3]}
            onPointerDown={() => {
              oldRidgeVal.current = frontRidgeRightPoint[0];
              setInterSectionPlane(frontRidgeRightPointV3, currentWallArray[1]);
              setRoofHandleType(RoofHandleType.FrontRight);
            }}
          />

          <Sphere
            position={[backRidgeLeftPointV3.x, backRidgeLeftPointV3.y, backRidgeLeftPointV3.z]}
            args={[0.3]}
            onPointerDown={() => {
              oldRidgeVal.current = backRidgeLeftPoint[0];
              setInterSectionPlane(backRidgeLeftPointV3, currentWallArray[1]);
              setRoofHandleType(RoofHandleType.BackLeft);
            }}
          />
          <Sphere
            position={[backRidgeRightPointV3.x, backRidgeRightPointV3.y, backRidgeRightPointV3.z]}
            args={[0.3]}
            onPointerDown={() => {
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
            if (intersectionPlaneRef.current) {
              setRayCast(e);
              const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
              if (intersects[0] && parent) {
                const point = intersects[0].point;
                switch (roofHandleType) {
                  case RoofHandleType.TopMid: {
                    setH(Math.max(minHeight, point.z - (parent?.lz ?? 0) - 0.3));
                    break;
                  }
                  case RoofHandleType.FrontLeft: {
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === id) {
                          if (parent && currentWallArray[3]) {
                            let px = getRelPos(parent, currentWallArray[3], point);
                            if (px < topRidgeLeftPoint[0]) {
                              px = topRidgeLeftPoint[0];
                            }
                            if (px > 0.5) {
                              px = 0.5;
                            }
                            (e as GambrelRoofModel).frontRidgeLeftPoint[0] = px;
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
                        if (e.id === id) {
                          if (parent && currentWallArray[3]) {
                            let px = getRelPos(parent, currentWallArray[3], point);
                            if (px < backRidgeRightPoint[0]) {
                              px = backRidgeRightPoint[0];
                            }
                            if (px > frontRidgeLeftPoint[0]) {
                              px = frontRidgeLeftPoint[0];
                            }
                            (e as GambrelRoofModel).topRidgeLeftPoint[0] = px;
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
                            let px = getRelPos(parent, currentWallArray[3], point);
                            if (px > topRidgeLeftPoint[0]) {
                              px = topRidgeLeftPoint[0];
                            }
                            if (px < -0.5) {
                              px = -0.5;
                            }
                            (e as GambrelRoofModel).backRidgeRightPoint[0] = px;
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
                        if (e.id === id) {
                          if (parent && currentWallArray[1]) {
                            let px = getRelPos(parent, currentWallArray[1], point);
                            if (px < -0.5) {
                              px = -0.5;
                            }
                            if (px > topRidgeRightPoint[0]) {
                              px = topRidgeRightPoint[0];
                            }
                            (e as GambrelRoofModel).frontRidgeRightPoint[0] = px;
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
                        if (e.id === id) {
                          if (parent && currentWallArray[1]) {
                            let px = getRelPos(parent, currentWallArray[1], point);
                            if (px < frontRidgeRightPoint[0]) {
                              px = frontRidgeRightPoint[0];
                            }
                            if (px > backRidgeLeftPoint[0]) {
                              px = backRidgeLeftPoint[0];
                            }
                            (e as GambrelRoofModel).topRidgeRightPoint[0] = px;
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
                            let px = getRelPos(parent, currentWallArray[1], point);
                            if (px > 0.5) {
                              px = 0.5;
                            }
                            if (px < topRidgeRightPoint[0]) {
                              px = topRidgeRightPoint[0];
                            }
                            (e as GambrelRoofModel).backRidgeLeftPoint[0] = px;
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
            switch (roofHandleType) {
              case RoofHandleType.TopMid: {
                handleUndoableResizeRoofHeight(id, oldHeight.current, h);
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
            setEnableIntersectionPlane(false);
            setRoofHandleType(RoofHandleType.Null);
            useStoreRef.getState().setEnableOrbitController(true);
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  const r = e as GambrelRoofModel;
                  r.lz = h;
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

interface RoofSegmentProps {
  points: Vector3[];
  texture: Texture;
}

// window test code
const RoofSegment = ({ texture }: { texture: Texture }) => {
  const ref = useRef<Mesh>(null);
  useEffect(() => {
    if (ref.current) {
      const a = new Vector3(0, 0, 0);
      const b = new Vector3(10, 0, 0);
      const c = new Vector3(10, 10, 0);

      const d = new Vector3(0, 10, 5);
      const e = new Vector3(10, 10, 0);
      const f = new Vector3(0, 0, 0);

      const points = [a, b, c, d, e, f];

      const uvs = [
        a.x / 10,
        a.y / 10,
        b.x / 10,
        b.y / 10,
        c.x / 10,
        c.y / 10,
        d.x / 10,
        d.y / 10,
        e.x / 10,
        e.y / 10,
        f.x / 10,
        f.y / 10,
      ];

      const roofGeometry = new BufferGeometry();
      roofGeometry.setFromPoints(points);
      roofGeometry.computeVertexNormals();
      roofGeometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

      const roofMesh = new Mesh(roofGeometry);

      const h: Vector3[] = [];
      h.push(new Vector3(4, 4, -1));
      h.push(new Vector3(6, 4, -1));
      h.push(new Vector3(4, 6, -1));
      h.push(new Vector3(6, 6, -1));
      h.push(new Vector3(4, 4, 5));
      h.push(new Vector3(6, 4, 5));
      h.push(new Vector3(4, 6, 5));
      h.push(new Vector3(6, 6, 5));

      const holeMesh = new Mesh(new ConvexGeometry(h));

      const res = CSG.union(roofMesh, holeMesh); // ???
      ref.current.geometry = res.geometry;
    }
  }, []);

  return (
    <mesh position={[0, 0, 8]} ref={ref}>
      <meshBasicMaterial side={DoubleSide} map={texture} />
    </mesh>
  );
};

export default GambrelRoof;
