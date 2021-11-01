/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DoubleSide,
  Euler,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  Shape,
  ShapeBufferGeometry,
  TextureLoader,
  Vector3,
} from 'three';
import { Line, Plane, Sphere } from '@react-three/drei';

import { ActionType, ObjectType, ResizeHandleType, ResizeHandleType as RType } from 'src/types';
import { Util } from 'src/Util';
import { HIGHLIGHT_HANDLE_COLOR, RESIZE_HANDLE_COLOR } from '../constants';
import { useStore } from 'src/stores/common';
import { WallModel } from 'src/models/WallModel';
import WallExteriorImage from '../resources/WallExteriorImage.png';
import { ElementModelFactory } from 'src/models/ElementModelFactory';
import * as Selector from 'src/stores/selector';

const Wall = ({
  id,
  cx,
  cy,
  lx = 1,
  ly = 0.5,
  lz = 4,
  relativeAngle,
  leftOffset = 0,
  rightOffset = 0,
  windows,
  parent,
  selected = false,
  locked = false,
}: WallModel) => {
  const setCommonStore = useStore(Selector.set);
  const updateElementById = useStore(Selector.updateElementById);
  const getElementById = useStore(Selector.getElementById);
  const selectMe = useStore(Selector.selectMe);
  const resizeAnchor = useStore(Selector.resizeAnchor);
  const shadowEnabled = useStore(Selector.viewstate.shadowEnabled);
  const orthographic = useStore(Selector.viewstate.orthographic);
  const buildingWallID = useStore(Selector.buildingWallID);

  const [wallAbsPosition, setWallAbsPosition] = useState<Vector3>();
  const [wallAbsAngle, setWallAbsAngle] = useState<number>();
  const [movingWindow, setMovingWindow] = useState<{ id: string; diff: Vector3 } | null>(null);
  const [resizingWindowID, setResizingWindowID] = useState<string | null>(null!);
  const [init, setInit] = useState(false);
  const [x, setX] = useState(lx / 2);
  const [y, setY] = useState(ly / 2);
  const [z, setZ] = useState(lz / 2);

  const outSideWallRef = useRef<Mesh>(null);
  const insideWallRef = useRef<Mesh>(null);
  const topSurfaceRef = useRef<Mesh>(null);
  const resizeHandleLLRef = useRef<Mesh>();
  const resizeHandleLRRef = useRef<Mesh>();
  const resizeHandleULRef = useRef<Mesh>();
  const resizeHandleURRef = useRef<Mesh>();

  const p = getElementById(parent.id);
  const elementModel = getElementById(id) as WallModel;
  const highLight = lx === 0;

  const whiteWallMaterial = useMemo(() => new MeshStandardMaterial({ color: 'white', side: DoubleSide }), []);

  const texture = useMemo(() => {
    return new TextureLoader().load(WallExteriorImage, (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.offset.set(0, 0);
      texture.repeat.set(0.6, 0.6);
    });
  }, []);

  useEffect(() => {
    setX(lx / 2);
    setY(ly / 2);
    setZ(lz / 2);
  }, [lx, ly, lz]);

  // wall position and rotation
  useEffect(() => {
    if (p) {
      setWallAbsPosition(Util.wallAbsolutePosition(new Vector3(cx, cy), p).setZ(lz / 2 + p.lz));
      setWallAbsAngle(p.rotation[2] + relativeAngle);
      setInit(true);
    }
  }, [cx, cy, p?.cx, p?.cy, p?.cz, p?.rotation, relativeAngle]);

  // outside wall
  useEffect(() => {
    if (outSideWallRef.current) {
      const wallShape = new Shape();
      drawRectangle(wallShape, lx, lz);

      windows.forEach((w) => {
        const window = new Shape();
        drawRectangle(window, w.lx * lx, w.lz * lz, w.cx * lx, w.cz * lz);
        wallShape.holes.push(window);
      });

      outSideWallRef.current.geometry = new ShapeBufferGeometry(wallShape);
      outSideWallRef.current.material = new MeshStandardMaterial({ map: texture, side: DoubleSide });
      outSideWallRef.current.rotation.set(Math.PI / 2, 0, 0);
    }
  }, [init, lx, lz, windows]);

  // inside wall
  useEffect(() => {
    if (insideWallRef.current) {
      const wallShape = new Shape();
      drawRectangle(wallShape, lx, lz, 0, 0, leftOffset, rightOffset);

      windows.forEach((w) => {
        const window = new Shape();
        drawRectangle(window, w.lx * lx, w.lz * lz, w.cx * lx, w.cz * lz);
        wallShape.holes.push(window);
      });

      insideWallRef.current.geometry = new ShapeBufferGeometry(wallShape);
      insideWallRef.current.material = whiteWallMaterial;
    }
  }, [init, leftOffset, rightOffset, lx, ly, lz, windows]);

  // top surface
  useEffect(() => {
    if (topSurfaceRef.current) {
      const topSurfaceShape = new Shape();
      drawTopSurface(topSurfaceShape, lx, ly, leftOffset, rightOffset);
      topSurfaceRef.current.geometry = new ShapeBufferGeometry(topSurfaceShape);
      topSurfaceRef.current.material = whiteWallMaterial;
    }
  }, [init, leftOffset, rightOffset, lx, ly, lz]);

  const drawTopSurface = (shape: Shape, lx: number, ly: number, leftOffset: number, rightOffset: number) => {
    const x = lx / 2;
    const y = ly / 2;
    shape.moveTo(-x, -y);
    shape.lineTo(x, -y);
    shape.lineTo(x - rightOffset, y);
    shape.lineTo(-x + leftOffset, y);
    shape.lineTo(-x, -y);
  };

  const drawRectangle = (shape: Shape, lx: number, ly: number, cx = 0, cy = 0, leftOffset = 0, rightOffset = 0) => {
    const x = lx / 2;
    const y = ly / 2;
    shape.moveTo(cx - x + leftOffset, cy - y);
    shape.lineTo(cx + x - rightOffset, cy - y);
    shape.lineTo(cx + x - rightOffset, cy + y);
    shape.lineTo(cx - x + leftOffset, cy + y);
    shape.lineTo(cx - x + leftOffset, cy - y);
  };

  const legalOnWall = (type: ObjectType) => {
    switch (type) {
      case ObjectType.Sensor:
      case ObjectType.SolarPanel:
      case ObjectType.Window:
        return true;
      default:
        return false;
    }
  };

  const getWindowRelativePos = (p: Vector3, wall: WallModel) => {
    const { cx, cy, cz } = wall;
    const foundation = getElementById(wall.parent.id);
    if (foundation && wallAbsAngle !== undefined) {
      const wallAbsPos = Util.wallAbsolutePosition(new Vector3(cx, cy, cz), foundation).setZ(lz / 2);
      const relativePos = new Vector3().subVectors(p, wallAbsPos).applyEuler(new Euler(0, 0, -wallAbsAngle));
      return relativePos;
    }
    return new Vector3();
  };

  const checkWallLoop = (id: string) => {
    const startID = id;
    const points: number[][] = [];

    let wall = getElementById(id) as WallModel;
    while (wall && wall.leftJoints.length > 0) {
      const point = [...wall.leftPoint];
      points.push(point);
      const id = wall.leftJoints[0].id;
      if (id === startID) {
        return points;
      } else {
        wall = getElementById(id) as WallModel;
      }
    }
    return null;
  };

  return (
    <>
      {wallAbsPosition && wallAbsAngle !== undefined && (
        <group name={`Wall Group ${id}`} position={wallAbsPosition} rotation={[0, 0, wallAbsAngle]}>
          {/* outside wall */}
          <mesh
            ref={outSideWallRef}
            castShadow={shadowEnabled}
            receiveShadow={shadowEnabled}
            onPointerDown={(e) => {
              if (e.button === 2 || buildingWallID) return; // ignore right-click
              setCommonStore((state) => {
                state.contextMenuObjectType = null;
              });

              const objectTypeToAdd = useStore.getState().objectTypeToAdd;
              if (legalOnWall(objectTypeToAdd) && elementModel) {
                // setShowGrid(true);
                const p = e.intersections[0].point;
                const relativePos = getWindowRelativePos(p, elementModel);
                const window = ElementModelFactory.makeWindow(elementModel, relativePos.x / lx, 0, relativePos.z / lz);
                updateElementById(id, {
                  windows: [...elementModel.windows, window],
                });
                setCommonStore((state) => {
                  state.objectTypeToAdd = ObjectType.None;
                });
              } else if (objectTypeToAdd === ObjectType.Roof) {
                const points = checkWallLoop(elementModel.id);
                if (points) {
                  const parent = getElementById(elementModel.parent.id);
                  if (parent) {
                    const roof = ElementModelFactory.makeRoof(lz, parent, points);
                    setCommonStore((state) => {
                      state.elements.push(roof);
                    });
                  }
                }
                setCommonStore((state) => {
                  state.objectTypeToAdd = ObjectType.None;
                });
              } else {
                selectMe(id, e, ActionType.Select);
              }
            }}
          />

          {/* inside wall */}
          <mesh
            ref={insideWallRef}
            position={[0, ly, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow={shadowEnabled}
            receiveShadow={shadowEnabled}
          />

          {/* top surface */}
          <mesh
            ref={topSurfaceRef}
            position={[0, y, z]}
            castShadow={shadowEnabled}
            receiveShadow={shadowEnabled}
            onPointerDown={() => {
              setCommonStore((state) => {
                for (const e of state.elements) {
                  e.selected = e.id === id;
                  if (e.type === ObjectType.Wall) {
                    for (const w of (e as WallModel).windows) {
                      w.selected = false;
                    }
                  }
                }
              });
            }}
          />

          {/* side surfaces */}
          {leftOffset == 0 && (
            <Plane args={[lz, ly]} position={[-x + 0.01, y, 0]} rotation={[0, Math.PI / 2, 0]}>
              <meshStandardMaterial color={'white'} side={DoubleSide} />
            </Plane>
          )}
          {rightOffset == 0 && (
            <Plane args={[lz, ly]} position={[x - 0.01, y, 0]} rotation={[0, Math.PI / 2, 0]}>
              <meshStandardMaterial color={'white'} side={DoubleSide} />
            </Plane>
          )}

          {/* window intersection plane */}
          <Plane
            name={'window intersection plane ' + id}
            args={[lx, lz]}
            position={[0, 0.01, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            visible={false}
            onPointerMove={(e) => {
              if (e.intersections[0].object.name === 'window intersection plane ' + id) {
                if (movingWindow) {
                  const pointer = e.intersections[0].point;
                  const { id, diff } = movingWindow;
                  const absPos = new Vector3().addVectors(pointer, diff);
                  const relativePos = getWindowRelativePos(absPos, elementModel);
                  setCommonStore((state) => {
                    for (const e of state.elements) {
                      if (e.id === elementModel.id) {
                        for (const w of (e as WallModel).windows) {
                          if (w.id == id) {
                            w.cx = relativePos.x / lx;
                            w.cz = relativePos.z / lz;
                          }
                        }
                      }
                    }
                  });
                } else if (resizingWindowID) {
                  const pointer = e.intersections[0].point;
                  const v = new Vector3().subVectors(resizeAnchor, pointer).applyEuler(new Euler(0, 0, -wallAbsAngle));
                  const windowAbsCenterPos = new Vector3().addVectors(resizeAnchor, pointer).divideScalar(2);
                  if (outSideWallRef.current) {
                    const wallAbsCenterPos = outSideWallRef.current.localToWorld(new Vector3());
                    const relativePos = new Vector3()
                      .subVectors(windowAbsCenterPos, wallAbsCenterPos)
                      .applyEuler(new Euler(0, 0, -wallAbsAngle));
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === elementModel.id) {
                          for (const w of (e as WallModel).windows) {
                            if (w.id == resizingWindowID) {
                              w.lx = Math.abs(v.x) / lx;
                              w.lz = Math.abs(v.z) / lz;
                              w.cx = relativePos.x / lx;
                              w.cz = relativePos.z / lz;
                            }
                          }
                        }
                      }
                    });
                  }
                }
              }
            }}
          />

          {/* windows */}
          {windows.map((window) => {
            let { id, lx: wlx, lz: wlz, cx: wcx, cz: wcz } = window;
            wlx = wlx * lx;
            wlz = wlz * lz;
            wcx = wcx * lx;
            wcz = wcz * lz;
            return (
              <group key={id} name={`Window group ${id}`} position={[wcx, 0, wcz]} castShadow receiveShadow>
                <Plane
                  name={'window ' + id}
                  args={[wlx, wlz]}
                  rotation={[Math.PI / 2, 0, 0]}
                  onPointerDown={(e) => {
                    if (e.intersections[0].object.name === 'window ' + id) {
                      if (window.selected) {
                        const v = e.intersections[0].object.localToWorld(new Vector3());
                        const diff = new Vector3().subVectors(v, e.intersections[0].point);
                        setMovingWindow({ id, diff });
                        setCommonStore((state) => {
                          state.enableOrbitController = false;
                        });
                      } else {
                        setCommonStore((state) => {
                          for (const elem of state.elements) {
                            elem.selected = false;
                            if (elem.id === elementModel.id) {
                              for (const window of elem.windows) {
                                window.selected = window.id === id;
                              }
                            }
                          }
                        });
                      }
                    }
                  }}
                  onPointerUp={() => {
                    setMovingWindow(null);
                  }}
                >
                  <meshBasicMaterial side={DoubleSide} color={'#477395'} opacity={0.5} transparent={true} />
                </Plane>

                {/* wireframes */}
                <group>
                  <Line
                    points={[
                      [-wlx / 2, 0, -wlz / 2],
                      [wlx / 2, 0, -wlz / 2],
                    ]}
                    linewidth={1}
                  />
                  <Line
                    points={[
                      [-wlx / 2, 0, -wlz / 2],
                      [-wlx / 2, 0, wlz / 2],
                    ]}
                    linewidth={1}
                  />
                  <Line
                    points={[
                      [wlx / 2, 0, wlz / 2],
                      [-wlx / 2, 0, wlz / 2],
                    ]}
                    linewidth={1}
                  />
                  <Line
                    points={[
                      [wlx / 2, 0, wlz / 2],
                      [wlx / 2, 0, -wlz / 2],
                    ]}
                    linewidth={1}
                  />
                  <Line
                    points={[
                      [-wlx / 2, 0, 0],
                      [wlx / 2, 0, 0],
                    ]}
                    linewidth={1}
                    color={'white'}
                  />
                  <Line
                    points={[
                      [0, 0, -wlz / 2],
                      [0, 0, wlz / 2],
                    ]}
                    linewidth={1}
                    color={'white'}
                  />
                </group>

                {/* handles */}
                {window.selected && (
                  <group>
                    <Sphere
                      ref={resizeHandleLLRef}
                      name={ResizeHandleType.LowerLeft}
                      args={[0.1, 6, 6]}
                      position={[-wlx / 2, 0, -wlz / 2]}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                        setResizingWindowID(id);
                        if (resizeHandleLLRef.current) {
                          setCommonStore((state) => {
                            const anchor = resizeHandleLLRef.current!.localToWorld(new Vector3(wlx, 0, wlz));
                            state.resizeAnchor.copy(anchor);
                          });
                        }
                      }}
                      onPointerUp={() => {
                        setResizingWindowID(null);
                      }}
                    />
                    <Sphere
                      ref={resizeHandleULRef}
                      name={ResizeHandleType.UpperLeft}
                      args={[0.1, 6, 6]}
                      position={[-wlx / 2, 0, wlz / 2]}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                        setResizingWindowID(id);
                        if (resizeHandleULRef.current) {
                          setCommonStore((state) => {
                            const anchor = resizeHandleULRef.current!.localToWorld(new Vector3(wlx, 0, -wlz));
                            state.resizeAnchor.copy(anchor);
                          });
                        }
                      }}
                      onPointerUp={() => {
                        setResizingWindowID(null);
                      }}
                    />
                    <Sphere
                      ref={resizeHandleLRRef}
                      name={ResizeHandleType.LowerRight}
                      args={[0.1, 6, 6]}
                      position={[wlx / 2, 0, -wlz / 2]}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                        setResizingWindowID(id);
                        if (resizeHandleLRRef.current) {
                          setCommonStore((state) => {
                            const anchor = resizeHandleLRRef.current!.localToWorld(new Vector3(-wlx, 0, wlz));
                            state.resizeAnchor.copy(anchor);
                          });
                        }
                      }}
                      onPointerUp={() => {
                        setResizingWindowID(null);
                      }}
                    />
                    <Sphere
                      ref={resizeHandleURRef}
                      name={ResizeHandleType.UpperRight}
                      args={[0.1, 6, 6]}
                      position={[wlx / 2, 0, wlz / 2]}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                        setResizingWindowID(id);
                        if (resizeHandleURRef.current) {
                          setCommonStore((state) => {
                            const anchor = resizeHandleURRef.current!.localToWorld(new Vector3(-wlx, 0, -wlz));
                            state.resizeAnchor.copy(anchor);
                          });
                        }
                      }}
                      onPointerUp={() => {
                        setResizingWindowID(null);
                      }}
                    />
                  </group>
                )}
              </group>
            );
          })}

          {/* wireFrame */}
          <group rotation={[Math.PI / 2, 0, 0]}>
            <Line
              points={[
                [-x, -z, 0],
                [-x, z, 0],
              ]}
              lineWidth={0.2}
            />
            <Line
              points={[
                [-x, -z, 0],
                [x, -z, 0],
              ]}
              lineWidth={0.2}
            />
            <Line
              points={[
                [x, z, 0],
                [-x, z, 0],
              ]}
              lineWidth={0.2}
            />
            <Line
              points={[
                [x, z, 0],
                [x, -z, 0],
              ]}
              lineWidth={0.2}
            />
          </group>

          {/* handles */}
          {(selected || buildingWallID === id) && !locked && (
            <>
              <ResizeHandle args={[-x, 0, -z]} id={id} handleType={RType.LowerLeft} highLight={highLight} />
              <ResizeHandle args={[x, 0, -z]} id={id} handleType={RType.LowerRight} highLight={highLight} />
              {!orthographic && (
                <ResizeHandle args={[-x, 0, z]} id={id} handleType={RType.UpperLeft} highLight={highLight} />
              )}
              {!orthographic && (
                <ResizeHandle args={[x, 0, z]} id={id} handleType={RType.UpperRight} highLight={highLight} />
              )}
            </>
          )}
        </group>
      )}
    </>
  );
};

interface ResizeHandlesProps {
  args: [x: number, y: number, z: number];
  id: string;
  handleType: RType;
  highLight: boolean;
  handleSize?: number;
}
const ResizeHandle = ({ args, id, handleType, highLight, handleSize = 0.3 }: ResizeHandlesProps) => {
  const setCommonStore = useStore(Selector.set);
  const selectMe = useStore(Selector.selectMe);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const buildingWallID = useStore(Selector.buildingWallID);

  const [hovered, setHovered] = useState(false);

  const handleRef = useRef<Mesh>(null);

  const [x, y, z] = args;

  const color = // handleType === RType.UpperRight ? 'blue' : 'white';
    highLight ||
    hovered ||
    handleType === resizeHandleType ||
    (buildingWallID && (handleType === RType.LowerRight || handleType === RType.UpperRight))
      ? HIGHLIGHT_HANDLE_COLOR
      : RESIZE_HANDLE_COLOR;

  // https://github.com/mrdoob/three.js/issues/20220

  return (
    <Sphere
      name={handleType}
      ref={handleRef}
      args={[handleSize]}
      position={args}
      onPointerOver={() => {
        setHovered(true);
      }}
      onPointerOut={() => {
        setHovered(false);
      }}
      onPointerDown={(e) => {
        if (!buildingWallID) {
          selectMe(id, e, ActionType.Resize);
        }
        if (handleRef) {
          setCommonStore((state) => {
            const anchor = handleRef.current!.localToWorld(new Vector3(-x * 2, 0, 0));
            state.resizeAnchor.copy(anchor);
          });
        }
      }}
      onPointerUp={() => {
        setCommonStore((state) => {
          state.enableOrbitController = true;
        });
      }}
    >
      <meshStandardMaterial color={color} />
    </Sphere>
  );
};

export default Wall;
