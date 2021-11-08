/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DoubleSide,
  Euler,
  Mesh,
  MeshStandardMaterial,
  Raycaster,
  RepeatWrapping,
  Shape,
  ShapeBufferGeometry,
  TextureLoader,
  Vector2,
  Vector3,
} from 'three';
import { Line, Plane, Sphere } from '@react-three/drei';

import { ActionType, ObjectType, ResizeHandleType, ResizeHandleType as RType } from 'src/types';
import { Util } from 'src/Util';
import { HIGHLIGHT_HANDLE_COLOR, RESIZE_HANDLE_COLOR } from '../constants';
import { CommonStoreState, useStore } from 'src/stores/common';
import { WallModel } from 'src/models/WallModel';
import WallExteriorImage from '../resources/WallExteriorImage.png';
import { ElementModelFactory } from 'src/models/ElementModelFactory';
import * as Selector from 'src/stores/selector';
import { RoofPoint } from 'src/models/RoofModel';
import { WindowModel } from 'src/models/WindowModel';
import { FoundationGrid } from './foundation';
import { useThree } from '@react-three/fiber';
import { ElementModel } from 'src/models/ElementModel';

interface WindowProps {
  id: string;
  wlx: number;
  wlz: number;
  wcx: number;
  wcz: number;
  diff: Vector3;
}

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
  parentId,
  selected = false,
  locked = false,
}: WallModel) => {
  const setCommonStore = useStore(Selector.set);
  const getElementById = useStore(Selector.getElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const selectMe = useStore(Selector.selectMe);
  const shadowEnabled = useStore(Selector.viewstate.shadowEnabled);

  const objectTypeToAddRef = useRef(useStore.getState().objectTypeToAdd);
  const resizeAnchorRef = useRef(useStore.getState().resizeAnchor);
  const resizeHandleTypeRef = useRef(useStore.getState().resizeHandleType);
  const buildingWallIDRef = useRef(useStore.getState().buildingWallID);
  const enableFineGridRef = useRef(useStore.getState().enableFineGrid);

  const intersectionPlaneRef = useRef<Mesh>(null);
  const outSideWallRef = useRef<Mesh>(null);
  const insideWallRef = useRef<Mesh>(null);
  const topSurfaceRef = useRef<Mesh>(null);
  const resizeHandleLLRef = useRef<Mesh>();
  const resizeHandleLRRef = useRef<Mesh>();
  const resizeHandleULRef = useRef<Mesh>();
  const resizeHandleURRef = useRef<Mesh>();
  const grabRef = useRef<ElementModel | null>(null);

  const [renderWindows, setRenderWindows] = useState<WindowModel[]>(windows);
  const [wallAbsPosition, setWallAbsPosition] = useState<Vector3>();
  const [wallAbsAngle, setWallAbsAngle] = useState<number>();
  const [movingWindow, setMovingWindow] = useState<WindowProps | null>(null);
  const [resizingWindow, setResizingWindow] = useState<WindowProps | null>(null);
  const [invalidWindowID, setInvalidWindowID] = useState<string | null>(null);
  const [isBuildingNewWindow, setIsBuildingNewWindow] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [init, setInit] = useState(false);
  const [x, setX] = useState(lx / 2);
  const [y, setY] = useState(ly / 2);
  const [z, setZ] = useState(lz / 2);

  const parentSelector = useCallback((state: CommonStoreState) => {
    for (const e of state.elements) {
      if (e.id === parentId) {
        return e;
      }
    }
    return null;
  }, []);

  const parent = useStore(parentSelector);
  const elementModel = getElementById(id) as WallModel;
  const highLight = lx === 0;

  const { camera, gl } = useThree();

  const ray = useMemo(() => new Raycaster(), []);

  const whiteWallMaterial = useMemo(() => new MeshStandardMaterial({ color: 'white', side: DoubleSide }), []);

  const texture = useMemo(() => {
    return new TextureLoader().load(WallExteriorImage, (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.offset.set(0, 0);
      texture.repeat.set(0.6, 0.6);
    });
  }, []);

  // subscribe common store
  useEffect(() => {
    useStore.subscribe((state) => (objectTypeToAddRef.current = state.objectTypeToAdd));
    useStore.subscribe((state) => (resizeAnchorRef.current = state.resizeAnchor));
    useStore.subscribe((state) => (resizeHandleTypeRef.current = state.resizeHandleType));
    useStore.subscribe((state) => (buildingWallIDRef.current = state.buildingWallID));
    useStore.subscribe((state) => (enableFineGridRef.current = state.enableFineGrid));
  }, []);

  useEffect(() => {
    setX(lx / 2);
    setY(ly / 2);
    setZ(lz / 2);
  }, [lx, ly, lz]);

  // wall position and rotation
  useEffect(() => {
    if (parent) {
      setWallAbsPosition(Util.wallAbsolutePosition(new Vector3(cx, cy), parent).setZ(lz / 2 + parent.lz));
      setWallAbsAngle(parent.rotation[2] + relativeAngle);
      setInit(true);
    }
  }, [cx, cy, lz, parent?.cx, parent?.cy, parent?.cz, parent?.rotation, relativeAngle]);

  // outside wall
  useEffect(() => {
    if (outSideWallRef.current) {
      const wallShape = new Shape();
      drawRectangle(wallShape, lx, lz);

      windows.forEach((w) => {
        if (w.id !== invalidWindowID) {
          const window = new Shape();
          drawRectangle(window, w.lx * lx, w.lz * lz, w.cx * lx, w.cz * lz);
          wallShape.holes.push(window);
        }
      });

      outSideWallRef.current.geometry = new ShapeBufferGeometry(wallShape);
      outSideWallRef.current.material = new MeshStandardMaterial({ map: texture, side: DoubleSide });
    }
  }, [init, lx, lz, windows]);

  // inside wall
  useEffect(() => {
    if (insideWallRef.current) {
      const wallShape = new Shape();
      drawRectangle(wallShape, lx, lz, 0, 0, leftOffset, rightOffset);

      windows.forEach((w) => {
        if (w.id !== invalidWindowID) {
          const window = new Shape();
          drawRectangle(window, w.lx * lx, w.lz * lz, w.cx * lx, w.cz * lz);
          wallShape.holes.push(window);
        }
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

  // windows
  useEffect(() => {
    setRenderWindows([...windows]);
  }, [windows]);

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

  const getWindowRelativePos = (p: Vector3, wall: WallModel) => {
    const { cx, cy, cz } = wall;
    const foundation = getElementById(wall.parentId);
    if (foundation && wallAbsAngle !== undefined) {
      const wallAbsPos = Util.wallAbsolutePosition(new Vector3(cx, cy, cz), foundation).setZ(lz / 2 + foundation.lz);
      const relativePos = new Vector3().subVectors(p, wallAbsPos).applyEuler(new Euler(0, 0, -wallAbsAngle));
      return relativePos;
    }
    return new Vector3();
  };

  const stickToNormalGrid = (v: Vector3) => {
    return new Vector3(Math.round(v.x), v.y, Math.round(v.z));
  };

  const stickToFineGrid = (v: Vector3) => {
    const x = parseFloat((Math.round(v.x / 0.2) * 0.2).toFixed(1));
    const z = parseFloat((Math.round(v.z / 0.2) * 0.2).toFixed(1));
    return new Vector3(x, v.y, z);
  };

  const movingWindowInsideWall = (p: Vector3) => {
    if (movingWindow) {
      const { wlx, wlz } = movingWindow;
      const maxX = (lx - wlx) / 2;
      const maxZ = (lz - wlz) / 2;
      if (p.x > maxX) {
        p.setX(maxX - 0.1);
      } else if (p.x < -maxX) {
        p.setX(-maxX + 0.1);
      }
      if (p.z > maxZ) {
        p.setZ(maxZ - 0.1);
      } else if (p.z < -maxZ) {
        p.setZ(-maxZ + 0.1);
      }
    }
    return p;
  };

  const resizingWindowInsideWall = (p: Vector3) => {
    p.setZ(Math.min(p.z, lz / 2 - 0.2));
    if (p.x > lx / 2) {
      p.setX(lx / 2 - 0.2);
    }
    if (p.x < -lx / 2) {
      p.setX(-lx / 2 + 0.2);
    }
    return p;
  };

  const checkWindowCollision = (id: string, p: Vector3, wlx: number, wlz: number) => {
    if (wlx < 0.1 || wlz < 0.1) {
      return false;
    }
    for (const w of windows) {
      if (w.id !== id) {
        const minX = w.cx * lx - (w.lx * lx) / 2; // target window left
        const maxX = w.cx * lx + (w.lx * lx) / 2; // target window right
        const minZ = w.cz * lz - (w.lz * lz) / 2; // target window bot
        const maxZ = w.cz * lz + (w.lz * lz) / 2; // target window up
        const wMinX = p.x - wlx / 2; // current window left
        const wMaxX = p.x + wlx / 2; // current window right
        const wMinZ = p.z - wlz / 2; // current window bot
        const wMaxZ = p.z + wlz / 2; // current window up
        if (
          ((wMinX >= minX && wMinX <= maxX) ||
            (wMaxX >= minX && wMaxX <= maxX) ||
            (minX >= wMinX && minX <= wMaxX) ||
            (maxX >= wMinX && maxX <= wMaxX)) &&
          ((wMinZ >= minZ && wMinZ <= maxZ) ||
            (wMaxZ >= minZ && wMaxZ <= maxZ) ||
            (minZ >= wMinZ && minZ <= wMaxZ) ||
            (maxZ >= wMinZ && maxZ <= wMaxZ))
        ) {
          return false; // has collision
        }
      }
    }
    return true; // no collision
  };

  const checkWallLoop = (id: string) => {
    const startID = id;
    const points: RoofPoint[] = [];

    let wall = getElementById(id) as WallModel;
    while (wall && wall.leftJoints.length > 0) {
      const point = [...wall.leftPoint];
      points.push({ x: point[0], y: point[1] });
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
            rotation={[Math.PI / 2, 0, 0]}
            castShadow={shadowEnabled}
            receiveShadow={shadowEnabled}
            onPointerDown={(e) => {
              if (e.button === 2 || buildingWallIDRef.current) return; // ignore right-click
              setCommonStore((state) => {
                state.contextMenuObjectType = null;
              });

              selectMe(id, e, ActionType.Select);
              const selectedElement = getSelectedElement();
              grabRef.current = selectedElement;

              if (selectedElement) {
                if (selectedElement.id === id) {
                  // no child of this wall is clicked
                  const objectTypeToAdd = useStore.getState().objectTypeToAdd;
                  if (objectTypeToAdd === ObjectType.Roof) {
                    const points = checkWallLoop(elementModel.id);
                    if (points) {
                      const parent = getElementById(elementModel.parentId);
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
                } else {
                  // a child of this wall is clicked
                }
              }
            }}
            onPointerUp={() => {
              if (grabRef.current) {
                grabRef.current = null;
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
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Select);
            }}
          />

          {/* top surface */}
          <mesh
            ref={topSurfaceRef}
            position={[0, y, z]}
            castShadow={shadowEnabled}
            receiveShadow={shadowEnabled}
            onPointerDown={(e) => {
              selectMe(id, e, ActionType.Select);
            }}
          />

          {/* side surfaces */}
          {leftOffset == 0 && (
            <Plane
              args={[lz, ly]}
              position={[-x + 0.01, y, 0]}
              rotation={[0, Math.PI / 2, 0]}
              onPointerDown={(e) => {
                selectMe(id, e, ActionType.Select);
              }}
            >
              <meshStandardMaterial color={'white'} side={DoubleSide} />
            </Plane>
          )}
          {rightOffset == 0 && (
            <Plane
              args={[lz, ly]}
              position={[x - 0.01, y, 0]}
              rotation={[0, Math.PI / 2, 0]}
              onPointerDown={(e) => {
                selectMe(id, e, ActionType.Select);
              }}
            >
              <meshStandardMaterial color={'white'} side={DoubleSide} />
            </Plane>
          )}

          {/* intersection plane */}
          {true && (
            <Plane
              name={'intersection plane ' + id}
              ref={intersectionPlaneRef}
              args={[lx + (showGrid ? 50 : 1), lz + (showGrid ? 10 : 1)]}
              position={[0, ly / 2 + 0.01, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              visible={false}
              onPointerMove={(e) => {
                const mouse = new Vector2();
                mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
                mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
                ray.setFromCamera(mouse, camera);

                if (intersectionPlaneRef.current) {
                  const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
                  const pointer = intersects[0].point;

                  // add new window
                  if (objectTypeToAddRef.current === ObjectType.Window) {
                    let relativePos = getWindowRelativePos(pointer, elementModel);
                    if (enableFineGridRef.current) {
                      relativePos = stickToFineGrid(relativePos);
                    } else {
                      relativePos = stickToNormalGrid(relativePos);
                    }
                    const newWindow = ElementModelFactory.makeWindow(
                      elementModel,
                      relativePos.x / lx,
                      0,
                      relativePos.z / lz,
                    );
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === elementModel.id) {
                          (e as WallModel).windows.push(newWindow);
                        }
                      }
                      state.objectTypeToAdd = ObjectType.None;
                      state.enableOrbitController = false;
                    });
                    setMovingWindow({ id: newWindow.id, wlx: 0, wlz: 0, wcx: 0, wcz: 0, diff: new Vector3() });
                    setShowGrid(true);
                    setIsBuildingNewWindow(true);
                  }

                  // moving and resizing
                  if (movingWindow) {
                    const { id, diff, wlx, wlz } = movingWindow;
                    const absPos = new Vector3().addVectors(pointer, diff);
                    let relativePos = getWindowRelativePos(absPos, elementModel);
                    if (enableFineGridRef.current) {
                      relativePos = stickToFineGrid(relativePos);
                    } else {
                      relativePos = stickToNormalGrid(relativePos);
                    }
                    relativePos = movingWindowInsideWall(relativePos);
                    if (checkWindowCollision(id, relativePos, wlx, wlz)) {
                      setInvalidWindowID(null);
                    } else {
                      setInvalidWindowID(id);
                    }
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
                  } else if (resizingWindow) {
                    let p = getWindowRelativePos(pointer, elementModel);

                    if (enableFineGridRef.current) {
                      p = stickToFineGrid(p);
                    } else {
                      p = stickToNormalGrid(p);
                    }
                    p = resizingWindowInsideWall(p);
                    const r = getWindowRelativePos(resizeAnchorRef.current, elementModel);
                    const v = new Vector3().subVectors(r, p);
                    const relativePos = new Vector3().addVectors(r, p).divideScalar(2);
                    if (outSideWallRef.current) {
                      if (checkWindowCollision(resizingWindow.id, relativePos, Math.abs(v.x), Math.abs(v.z))) {
                        setInvalidWindowID(null);
                      } else {
                        setInvalidWindowID(resizingWindow.id);
                      }
                      setCommonStore((state) => {
                        for (const e of state.elements) {
                          if (e.id === elementModel.id) {
                            for (const w of (e as WallModel).windows) {
                              if (w.id == resizingWindow.id) {
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
                  } else if (
                    grabRef.current?.id === id &&
                    (resizeHandleTypeRef.current == ResizeHandleType.UpperRight ||
                      resizeHandleTypeRef.current == ResizeHandleType.UpperLeft)
                  ) {
                    let height = new Vector3().subVectors(pointer, resizeAnchorRef.current);
                    if (enableFineGridRef.current) {
                      height = stickToFineGrid(height);
                    } else {
                      height = stickToNormalGrid(height);
                    }
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === elementModel.id) {
                          (e as WallModel).lz = Math.max(height.z, 0.5);
                        }
                      }
                    });
                  }
                }
              }}
              onPointerDown={() => {
                // building new window
                if (movingWindow && resizeHandleLLRef.current) {
                  setCommonStore((state) => {
                    const anchor = resizeHandleLLRef.current!.localToWorld(new Vector3(0, 0, 0));
                    state.resizeAnchor.copy(anchor);
                  });
                  setResizingWindow(movingWindow);
                  setMovingWindow(null);
                }
                const selectedElement = getSelectedElement();
                if (selectedElement) {
                  grabRef.current = selectedElement;
                }
              }}
              onPointerUp={() => {
                if (invalidWindowID) {
                  if (isBuildingNewWindow) {
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === elementModel.id) {
                          (e as WallModel).windows.pop();
                        }
                      }
                    });
                  } else if (movingWindow || resizingWindow) {
                    const wcx = movingWindow ? movingWindow.wcx : resizingWindow!.wcx;
                    const wcz = movingWindow ? movingWindow.wcz : resizingWindow!.wcz;
                    const wlx = movingWindow ? movingWindow.wlx : resizingWindow!.wlx;
                    const wlz = movingWindow ? movingWindow.wlz : resizingWindow!.wlz;
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === elementModel.id) {
                          for (const w of (e as WallModel).windows) {
                            if (w.id == movingWindow?.id || w.id == resizingWindow?.id) {
                              w.cx = wcx / lx;
                              w.cz = wcz / lz;
                              w.lx = wlx / lx;
                              w.lz = wlz / lz;
                            }
                          }
                        }
                      }
                      state.enableOrbitController = true;
                    });
                  }
                }

                setMovingWindow(null);
                setResizingWindow(null);
                setInvalidWindowID(null);
                setShowGrid(false);
                setIsBuildingNewWindow(false);
                if (grabRef.current) {
                  grabRef.current = null;
                }
              }}
            >
              <meshBasicMaterial side={DoubleSide} />
            </Plane>
          )}

          {/* windows */}
          {renderWindows.map((window) => {
            let { id, lx: wlx, lz: wlz, cx: wcx, cz: wcz } = window;
            wlx = wlx * lx;
            wlz = wlz * lz;
            wcx = wcx * lx;
            wcz = wcz * lz;
            const color = invalidWindowID == id ? 'red' : '#477395';
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
                        setMovingWindow({ id, wlx, wlz, wcx, wcz, diff });
                        setShowGrid(true);
                        setCommonStore((state) => {
                          state.enableOrbitController = false;
                        });
                      } else {
                        selectMe(id, e, ActionType.Select);
                        const selectedElement = getSelectedElement();
                        grabRef.current = selectedElement;
                      }
                    }
                  }}
                  onPointerUp={() => {
                    setShowGrid(false);
                    if (grabRef.current) {
                      grabRef.current = null;
                    }
                  }}
                >
                  <meshBasicMaterial side={DoubleSide} color={color} opacity={0.5} transparent={true} />
                </Plane>

                {/* wireframes */}
                <WindowWireFrame x={wlx / 2} z={wlz / 2} />

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
                        setShowGrid(true);
                        setResizingWindow({ id, wlx, wlz, wcx, wcz, diff: new Vector3() });
                        if (resizeHandleLLRef.current) {
                          setCommonStore((state) => {
                            const anchor = resizeHandleLLRef.current!.localToWorld(new Vector3(wlx, 0, wlz));
                            state.resizeAnchor.copy(anchor);
                          });
                        }
                      }}
                      onPointerUp={() => {
                        setShowGrid(false);
                      }}
                    />
                    <Sphere
                      ref={resizeHandleULRef}
                      name={ResizeHandleType.UpperLeft}
                      args={[0.1, 6, 6]}
                      position={[-wlx / 2, 0, wlz / 2]}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                        setShowGrid(true);
                        setResizingWindow({ id, wlx, wlz, wcx, wcz, diff: new Vector3() });
                        if (resizeHandleULRef.current) {
                          setCommonStore((state) => {
                            const anchor = resizeHandleULRef.current!.localToWorld(new Vector3(wlx, 0, -wlz));
                            state.resizeAnchor.copy(anchor);
                          });
                        }
                      }}
                      onPointerUp={() => {
                        setShowGrid(false);
                      }}
                    />
                    <Sphere
                      ref={resizeHandleLRRef}
                      name={ResizeHandleType.LowerRight}
                      args={[0.1, 6, 6]}
                      position={[wlx / 2, 0, -wlz / 2]}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                        setShowGrid(true);
                        setResizingWindow({ id, wlx, wlz, wcx, wcz, diff: new Vector3() });
                        if (resizeHandleLRRef.current) {
                          setCommonStore((state) => {
                            const anchor = resizeHandleLRRef.current!.localToWorld(new Vector3(-wlx, 0, wlz));
                            state.resizeAnchor.copy(anchor);
                          });
                        }
                      }}
                      onPointerUp={() => {
                        setShowGrid(false);
                      }}
                    />
                    <Sphere
                      ref={resizeHandleURRef}
                      name={ResizeHandleType.UpperRight}
                      args={[0.1, 6, 6]}
                      position={[wlx / 2, 0, wlz / 2]}
                      onPointerDown={(e) => {
                        selectMe(id, e, ActionType.Resize);
                        setShowGrid(true);
                        setResizingWindow({ id, wlx, wlz, wcx, wcz, diff: new Vector3() });
                        if (resizeHandleURRef.current) {
                          setCommonStore((state) => {
                            const anchor = resizeHandleURRef.current!.localToWorld(new Vector3(-wlx, 0, -wlz));
                            state.resizeAnchor.copy(anchor);
                          });
                        }
                      }}
                      onPointerUp={() => {
                        setShowGrid(false);
                      }}
                    />
                  </group>
                )}
              </group>
            );
          })}

          {/* wireFrame */}
          <WallWireFrame x={x} z={z} />

          {/* handles */}
          {selected && !locked && (
            <WallResizeHandleWarpper x={x} z={z} id={id} highLight={highLight} setShowGrid={setShowGrid} />
          )}

          {/* grid */}
          {showGrid && (
            <group position={[0, -0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <FoundationGrid args={[lx, lz, 0]} objectType={ObjectType.Wall} />
            </group>
          )}
        </group>
      )}
    </>
  );
};

interface ResizeHandlesProps {
  x: number;
  z: number;
  id: string;
  handleType: RType;
  highLight: boolean;
  handleSize?: number;
  setShowGrid: (b: boolean) => void;
}

interface WallResizeHandleWarpperProps {
  x: number;
  z: number;
  id: string;
  highLight: boolean;
  setShowGrid: (b: boolean) => void;
}

interface WallWireFrameProps {
  x: number;
  z: number;
  lineWidth?: number;
}

interface WindowWireFrameProps {
  x: number;
  z: number;
  lineWidth?: number;
}

const WallResizeHandle = React.memo(
  ({ x, z, id, handleType, highLight, handleSize = 0.3, setShowGrid }: ResizeHandlesProps) => {
    const setCommonStore = useStore(Selector.set);
    const selectMe = useStore(Selector.selectMe);
    const resizeHandleType = useStore(Selector.resizeHandleType);
    const buildingWallID = useStore(Selector.buildingWallID);

    const [hovered, setHovered] = useState(false);

    const handleRef = useRef<Mesh>(null);

    const color = // handleType === RType.UpperRight ? 'blue' : 'white';
      highLight ||
      hovered ||
      handleType === resizeHandleType ||
      (buildingWallID && (handleType === RType.LowerRight || handleType === RType.UpperRight))
        ? HIGHLIGHT_HANDLE_COLOR
        : RESIZE_HANDLE_COLOR;

    return (
      <Sphere
        name={handleType}
        ref={handleRef}
        args={[handleSize]}
        position={[x, 0, z]}
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
            if (handleType === ResizeHandleType.LowerLeft || handleType === ResizeHandleType.LowerRight) {
              setCommonStore((state) => {
                const anchor = handleRef.current!.localToWorld(new Vector3(-x * 2, 0, 0));
                state.resizeAnchor.copy(anchor);
              });
            } else if (handleType === ResizeHandleType.UpperLeft || handleType === ResizeHandleType.UpperRight) {
              setCommonStore((state) => {
                const anchor = handleRef.current!.localToWorld(new Vector3(0, 0, -z * 2));
                state.resizeAnchor.copy(anchor);
              });
              setShowGrid(true);
            }
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
  },
);

const WallResizeHandleWarpper = React.memo(({ x, z, id, highLight, setShowGrid }: WallResizeHandleWarpperProps) => {
  const orthographic = useStore(Selector.viewstate.orthographic);
  return (
    <React.Fragment>
      <WallResizeHandle
        x={-x}
        z={-z}
        id={id}
        handleType={RType.LowerLeft}
        highLight={highLight}
        setShowGrid={setShowGrid}
      />
      <WallResizeHandle
        x={x}
        z={-z}
        id={id}
        handleType={RType.LowerRight}
        highLight={highLight}
        setShowGrid={setShowGrid}
      />
      {!orthographic && (
        <WallResizeHandle
          x={-x}
          z={z}
          id={id}
          handleType={RType.UpperLeft}
          highLight={highLight}
          setShowGrid={setShowGrid}
        />
      )}
      {!orthographic && (
        <WallResizeHandle
          x={x}
          z={z}
          id={id}
          handleType={RType.UpperRight}
          highLight={highLight}
          setShowGrid={setShowGrid}
        />
      )}
    </React.Fragment>
  );
});

const WallWireFrame = React.memo(({ x, z, lineWidth = 0.2 }: WallWireFrameProps) => {
  return (
    <React.Fragment>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <Line
          points={[
            [-x, -z, 0],
            [-x, z, 0],
          ]}
          lineWidth={lineWidth}
        />
        <Line
          points={[
            [-x, -z, 0],
            [x, -z, 0],
          ]}
          lineWidth={lineWidth}
        />
        <Line
          points={[
            [x, z, 0],
            [-x, z, 0],
          ]}
          lineWidth={lineWidth}
        />
        <Line
          points={[
            [x, z, 0],
            [x, -z, 0],
          ]}
          lineWidth={lineWidth}
        />
      </group>
    </React.Fragment>
  );
});

const WindowWireFrame = React.memo(({ x, z, lineWidth = 1 }: WindowWireFrameProps) => {
  return (
    <React.Fragment>
      <Line
        points={[
          [-x, 0, -z],
          [x, 0, -z],
        ]}
        linewidth={lineWidth}
      />
      <Line
        points={[
          [-x, 0, -z],
          [-x, 0, z],
        ]}
        linewidth={lineWidth}
      />
      <Line
        points={[
          [x, 0, z],
          [-x, 0, z],
        ]}
        linewidth={lineWidth}
      />
      <Line
        points={[
          [x, 0, z],
          [x, 0, -z],
        ]}
        linewidth={lineWidth}
      />
      <Line
        points={[
          [-x, 0, 0],
          [x, 0, 0],
        ]}
        linewidth={lineWidth}
        color={'white'}
      />
      <Line
        points={[
          [0, 0, -z],
          [0, 0, z],
        ]}
        linewidth={lineWidth}
        color={'white'}
      />
    </React.Fragment>
  );
});

export default React.memo(Wall);
