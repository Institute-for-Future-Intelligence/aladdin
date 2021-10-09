/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BoxGeometry,
  DoubleSide,
  EdgesGeometry,
  Euler,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  TextureLoader,
  Vector3,
} from 'three';
import { Box, Line, Plane, Sphere, useTexture } from '@react-three/drei';

import { ActionType, ObjectType, ResizeHandleType, ResizeHandleType as RType } from 'src/types';
import { Util } from 'src/Util';
import { HIGHLIGHT_HANDLE_COLOR, RESIZE_HANDLE_COLOR } from '../constants';
import { useStore } from 'src/stores/common';
import { WallModel } from 'src/models/WallModel';
import WireFrame from 'src/components/wireFrame';
import WallExteriorImage from '../resources/WallExteriorImage.png';
import { CSG } from 'three-csg-ts';
import { ElementModelFactory } from 'src/models/ElementModelFactory';

const Wall = ({
  id,
  cx,
  cy,
  lx = 1,
  ly = 0.5,
  lz = 4,
  relativeAngle,
  rotation = [0, 0, 0],
  leftOffset = 0,
  rightOffset = 0,
  windows,
  parent,
  color = 'gray',
  lineColor = 'black',
  lineWidth = 0.1,
  locked = false,
  selected = false,
}: WallModel) => {
  const buildingWallID = useStore((state) => state.buildingWallID);
  const shadowEnabled = useStore((state) => state.viewState.shadowEnabled);
  const setCommonStore = useStore((state) => state.set);
  const objectTypeToAdd = useStore((state) => state.objectTypeToAdd);
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const addElement = useStore((state) => state.addElement);
  const updateElementById = useStore((state) => state.updateElementById);
  const selectNone = useStore((state) => state.selectNone);

  const [wallAbsPosition, setWallAbsPosition] = useState<Vector3>();
  const [wallAbsAngle, setWallAbsAngle] = useState<number>();
  const [length, setLength] = useState<number>(lx);

  const baseRef = useRef<Mesh>();

  const getElementById = useStore((state) => state.getElementById);
  const selectMe = useStore((state) => state.selectMe);

  const p = getElementById(parent.id);
  const elementModel = getElementById(id) as WallModel;
  const highLight = lx === 0;

  const [init, setInit] = useState(false);
  useEffect(() => {
    if (p) {
      setWallAbsPosition(Util.wallAbsolutePosition(new Vector3(cx, cy), p).setZ(lz / 2 + p.lz));
      setWallAbsAngle(p.rotation[2] + relativeAngle);
      setInit(true);
    }
  }, [cx, cy, p?.cx, p?.cy, p?.cz, p?.rotation]);

  const texture = useMemo(() => {
    return new TextureLoader().load(WallExteriorImage, (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.offset.set(0, 0);
      texture.repeat.set(lx / 4, 1);
    });
  }, []);

  useEffect(() => {
    texture.repeat.set(lx / 4, 1);
  }, [lx]);

  useEffect(() => {
    if (lx > Math.abs(leftOffset) ?? 0 + Math.abs(rightOffset) ?? 0) {
      setLength(lx - leftOffset - rightOffset - 0.001);
    } else {
      setLength(lx);
    }
  }, [leftOffset, rightOffset, lx]);

  const wallRef = useRef<Mesh>(null);
  const coverRef = useRef<Mesh>(null);

  useEffect(() => {
    if (wallRef.current) {
      const box = new Mesh(new BoxGeometry(lx - leftOffset - rightOffset - 0.001, ly, lz));
      let res: any = box;
      windows.forEach((window) => {
        const w = new Mesh(new BoxGeometry(window.lx, window.ly, window.lz));
        w.position.set(window.cx - leftOffset / 2 + rightOffset / 2, 0, window.cz);
        w.updateMatrix();
        res = CSG.subtract(res, w);
      });
      const material1 = new MeshStandardMaterial({ color: 'white' });
      const material2 = new MeshStandardMaterial({ map: texture });
      wallRef.current.geometry = res.geometry;
      wallRef.current.material = material2;
      wallRef.current.position.set(leftOffset / 2 - rightOffset / 2, ly / 2, 0);
    }
  }, [init, lx, ly, lz, leftOffset, rightOffset, wallRef.current, windows]);

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

  const resizeHandleLLRef = useRef<Mesh>();
  const resizeHandleLRRef = useRef<Mesh>();
  const resizeHandleULRef = useRef<Mesh>();
  const resizeHandleURRef = useRef<Mesh>();
  const resizeHandleType = useStore((state) => state.resizeHandleType);
  const resizeAnchor = useStore((state) => state.resizeAnchor);
  const [movingWindow, setMovingWindow] = useState<{ id: string; diff: Vector3 } | null>(null);
  const [resizingWindowID, setResizingWindowID] = useState<string | null>(null!);

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
          {/* wall body */}
          <mesh
            ref={wallRef}
            castShadow
            receiveShadow
            onPointerDown={(e) => {
              if (e.button === 2) return; // ignore right-click
              setCommonStore((state) => {
                state.contextMenuObjectType = null;
              });
              selectMe(id, e, ActionType.Select);
              const selectedElement = getSelectedElement();
              // no child of this foundation is clicked
              if (selectedElement?.id === id) {
                if (legalOnWall(objectTypeToAdd) && elementModel) {
                  // setShowGrid(true);
                  const p = e.intersections[0].point;
                  const relativePos = getWindowRelativePos(p, elementModel);
                  const window = ElementModelFactory.makeWindow(
                    elementModel,
                    relativePos.x,
                    relativePos.y,
                    relativePos.z,
                  );
                  updateElementById(id, {
                    windows: [...elementModel.windows, window],
                  });
                  setCommonStore((state) => {
                    state.objectTypeToAdd = ObjectType.None;
                  });
                }
                if (objectTypeToAdd === ObjectType.Roof) {
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
                }
              }
              // a child of this foundation is clicked
              else {
                // if (selectedElement) {
                //   if (legalOnWall(selectedElement.type as ObjectType)) {
                //     grabRef.current = selectedElement;
                //     setShowGrid(true);
                //     // TODO: resizeHandleType === null ?
                //     // if (resizeHandleType) {
                //     //   setCommonStore((state) => {
                //     //     state.enableOrbitController = false;
                //     //   });
                //     // }
                //   }
                // }
              }
            }}
          />

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
                            w.cx = relativePos.x;
                            w.cz = relativePos.z;
                          }
                        }
                      }
                    }
                  });
                } else if (resizeHandleType) {
                  const pointer = e.intersections[0].point;
                  const v = new Vector3().subVectors(resizeAnchor, pointer).applyEuler(new Euler(0, 0, -wallAbsAngle));
                  const windowAbsCenterPos = new Vector3().addVectors(resizeAnchor, pointer).divideScalar(2);
                  if (wallRef.current) {
                    const wallAbsCenterPos = wallRef.current.localToWorld(new Vector3());
                    const relativePos = new Vector3()
                      .subVectors(windowAbsCenterPos, wallAbsCenterPos)
                      .applyEuler(new Euler(0, 0, -wallAbsAngle));
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === elementModel.id) {
                          for (const w of (e as WallModel).windows) {
                            if (w.id == resizingWindowID) {
                              w.lx = Math.abs(v.x);
                              w.lz = Math.abs(v.z);
                              w.cx = relativePos.x;
                              w.cy = relativePos.y;
                              w.cz = relativePos.z;
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

          {windows.map((window) => {
            const { id, cx, cz, lx, lz } = window;
            return (
              <group key={id} name={`Window group ${id}`} position={[cx, 0, cz]} castShadow receiveShadow>
                <Plane
                  name={'window ' + id}
                  args={[lx, lz]}
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
                        selectNone();
                        setCommonStore((state) => {
                          for (const elem of state.elements) {
                            if (elem.id === elementModel.id) {
                              for (const window of elem.windows) {
                                if (window.id === id) {
                                  window.selected = true;
                                }
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
                      [-lx / 2, 0, -lz / 2],
                      [lx / 2, 0, -lz / 2],
                    ]}
                    linewidth={1}
                  />
                  <Line
                    points={[
                      [-lx / 2, 0, -lz / 2],
                      [-lx / 2, 0, lz / 2],
                    ]}
                    linewidth={1}
                  />
                  <Line
                    points={[
                      [lx / 2, 0, lz / 2],
                      [-lx / 2, 0, lz / 2],
                    ]}
                    linewidth={1}
                  />
                  <Line
                    points={[
                      [lx / 2, 0, lz / 2],
                      [lx / 2, 0, -lz / 2],
                    ]}
                    linewidth={1}
                  />
                  <Line
                    points={[
                      [-lx / 2, 0, 0],
                      [lx / 2, 0, 0],
                    ]}
                    linewidth={1}
                    color={'white'}
                  />
                  <Line
                    points={[
                      [0, 0, -lz / 2],
                      [0, 0, lz / 2],
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
                      position={[-lx / 2, 0, -lz / 2]}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                        setResizingWindowID(id);
                        if (resizeHandleLLRef.current) {
                          setCommonStore((state) => {
                            const anchor = resizeHandleLLRef.current!.localToWorld(new Vector3(lx, 0, lz));
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
                      position={[-lx / 2, 0, lz / 2]}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                        setResizingWindowID(id);
                        if (resizeHandleULRef.current) {
                          setCommonStore((state) => {
                            const anchor = resizeHandleULRef.current!.localToWorld(new Vector3(lx, 0, -lz));
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
                      position={[lx / 2, 0, -lz / 2]}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                        setResizingWindowID(id);
                        if (resizeHandleLRRef.current) {
                          setCommonStore((state) => {
                            const anchor = resizeHandleLRRef.current!.localToWorld(new Vector3(-lx, 0, lz));
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
                      position={[lx / 2, 0, lz / 2]}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                        setResizingWindowID(id);
                        if (resizeHandleURRef.current) {
                          setCommonStore((state) => {
                            const anchor = resizeHandleURRef.current!.localToWorld(new Vector3(-lx, 0, -lz));
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
          {/* {!selected && <WireFrame args={[lx, ly, lz]} />} */}

          {/* handles */}
          {(selected || buildingWallID === id) && (
            <>
              <ResizeHandle args={[-lx / 2, 0, -lz / 2]} id={id} handleType={RType.LowerLeft} highLight={highLight} />
              <ResizeHandle args={[lx / 2, 0, -lz / 2]} id={id} handleType={RType.LowerRight} highLight={highLight} />
              <ResizeHandle args={[-lx / 2, 0, lz / 2]} id={id} handleType={RType.UpperLeft} highLight={highLight} />
              <ResizeHandle args={[lx / 2, 0, lz / 2]} id={id} handleType={RType.UpperRight} highLight={highLight} />
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
const ResizeHandle = ({ args, id, handleType, highLight, handleSize = 0.4 }: ResizeHandlesProps) => {
  const resizeHandleType = useStore((state) => state.resizeHandleType);
  const buildingWallID = useStore((state) => state.buildingWallID);

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

  const setCommonStore = useStore((state) => state.set);
  const selectMe = useStore((state) => state.selectMe);

  return (
    <Sphere
      name={handleType}
      ref={handleRef}
      args={[handleSize]}
      position={[x, y, z]}
      onPointerOver={() => {
        setHovered(true);
      }}
      onPointerOut={() => {
        setHovered(false);
      }}
      onPointerDown={(e) => {
        selectMe(id, e, ActionType.Resize);
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
