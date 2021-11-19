/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import Wall_00_Img from '../resources/wall_00.png';
import Wall_01_Img from '../resources/wall_01.png';
import Wall_02_Img from '../resources/wall_02.png';
import Wall_03_Img from '../resources/wall_03.png';
import Wall_04_Img from '../resources/wall_04.png';
import Wall_05_Img from '../resources/wall_05.png';
import Wall_06_Img from '../resources/wall_06.png';
import Wall_07_Img from '../resources/wall_07.png';
import Wall_08_Img from '../resources/wall_08.png';

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
import { useThree } from '@react-three/fiber';
import { Box, Line, Plane } from '@react-three/drei';
import {
  ActionType,
  MoveHandleType,
  ObjectType,
  ResizeHandleType,
  ResizeHandleType as RType,
  WallTexture,
} from 'src/types';
import { Util } from '../Util';
import { HIGHLIGHT_HANDLE_COLOR, RESIZE_HANDLE_COLOR } from '../constants';
import { CommonStoreState, useStore } from '../stores/common';
import { ElementModel } from '../models/ElementModel';
import { WindowModel } from '../models/WindowModel';
import { WallModel } from '../models/WallModel';
import { ElementModelFactory } from '../models/ElementModelFactory';
import { RoofPoint } from '../models/RoofModel';
import { FoundationGrid } from './foundation';
import Window from './window';
import * as Selector from '../stores/selector';

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
  leftJoints,
  rightJoints,
  textureType,
  parentId,
  selected = false,
  locked = false,
}: WallModel) => {
  const textureLoader = useMemo(() => {
    let textureImg;
    switch (textureType) {
      case WallTexture.NoTexture:
        textureImg = Wall_00_Img;
        break;
      case WallTexture.Texture_1:
        textureImg = Wall_01_Img;
        break;
      case WallTexture.Texture_2:
        textureImg = Wall_02_Img;
        break;
      case WallTexture.Texture_3:
        textureImg = Wall_03_Img;
        break;
      case WallTexture.Texture_4:
        textureImg = Wall_04_Img;
        break;
      case WallTexture.Texture_5:
        textureImg = Wall_05_Img;
        break;
      case WallTexture.Texture_6:
        textureImg = Wall_06_Img;
        break;
      case WallTexture.Texture_7:
        textureImg = Wall_07_Img;
        break;
      case WallTexture.Texture_8:
        textureImg = Wall_08_Img;
        break;
      default:
        textureImg = Wall_00_Img;
    }

    return new TextureLoader().load(textureImg, (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.offset.set(0, 0);
      texture.repeat.set(0.6, 0.6);
      setTexture(texture);
    });
  }, [textureType]);
  const [texture, setTexture] = useState(textureLoader);

  const setCommonStore = useStore(Selector.set);
  const getElementById = useStore(Selector.getElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const selectMe = useStore(Selector.selectMe);
  const elements = useStore(Selector.elements);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const objectTypeToAddRef = useRef(useStore.getState().objectTypeToAdd);
  const moveHandleTypeRef = useRef(useStore.getState().moveHandleType);
  const resizeHandleTypeRef = useRef(useStore.getState().resizeHandleType);
  const resizeAnchorRef = useRef(useStore.getState().resizeAnchor);
  const buildingWallIDRef = useRef(useStore.getState().buildingWallID);
  const enableFineGridRef = useRef(useStore.getState().enableFineGrid);

  const intersectionPlaneRef = useRef<Mesh>(null);
  const outSideWallRef = useRef<Mesh>(null);
  const insideWallRef = useRef<Mesh>(null);
  const topSurfaceRef = useRef<Mesh>(null);
  const grabRef = useRef<ElementModel | null>(null);

  const [x, setX] = useState(lx / 2);
  const [y, setY] = useState(ly / 2);
  const [z, setZ] = useState(lz / 2);
  const [wallAbsPosition, setWallAbsPosition] = useState<Vector3>();
  const [wallAbsAngle, setWallAbsAngle] = useState<number>();
  const [leftOffsetState, setLeftOffsetState] = useState(leftOffset);
  const [rightOffsetState, setRightOffsetState] = useState(rightOffset);
  const [init, setInit] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  const [windows, setWindows] = useState<WindowModel[]>([]);
  const [isBuildingNewWindow, setIsBuildingNewWindow] = useState(false);
  const [invalidWindowID, setInvalidWindowID] = useState<string | null>(null);
  const [originElements, setOriginElements] = useState<ElementModel[]>([]);

  const parentSelector = useCallback((state: CommonStoreState) => {
    for (const e of state.elements) {
      if (e.id === parentId) {
        return e;
      }
    }
    return null;
  }, []);

  const parent = useStore(parentSelector);
  const wallModel = getElementById(id) as WallModel;
  const highLight = lx === 0;

  const { camera, gl, scene } = useThree();

  const ray = useMemo(() => new Raycaster(), []);

  const whiteWallMaterial = useMemo(() => new MeshStandardMaterial({ color: 'white', side: DoubleSide }), []);

  // subscribe common store
  useEffect(() => {
    useStore.subscribe((state) => (objectTypeToAddRef.current = state.objectTypeToAdd));
    useStore.subscribe((state) => (moveHandleTypeRef.current = state.moveHandleType));
    useStore.subscribe((state) => (resizeHandleTypeRef.current = state.resizeHandleType));
    useStore.subscribe((state) => (resizeAnchorRef.current = state.resizeAnchor));
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

  // wall offset state
  useEffect(() => {
    setLeftOffsetState(leftOffset);
  }, [leftOffset]);

  useEffect(() => {
    setRightOffsetState(rightOffset);
  }, [rightOffset]);

  useEffect(() => {
    if (leftJoints.length > 0) {
      const targetWall = getElementById(leftJoints[0].id);
      if (targetWall) {
        const deltaAngle = (Math.PI * 3 - (relativeAngle - targetWall.relativeAngle)) % (Math.PI * 2);
        const offset = ly / Math.tan(deltaAngle);
        setLeftOffsetState(offset);
      }
    }
    if (rightJoints.length > 0) {
      const targetWall = getElementById(rightJoints[0].id);
      if (targetWall) {
        const deltaAngle = (Math.PI * 3 + relativeAngle - targetWall.relativeAngle) % (Math.PI * 2);
        const offset = ly / Math.tan(deltaAngle);
        setRightOffsetState(offset);
      }
    }
  }, [ly]);

  // windows
  useEffect(() => {
    setWindows(elements.filter((e) => e.type === ObjectType.Window && e.parentId === id));
  }, [elements]);

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
      gl.render(scene, camera);
    }
  }, [init, lx, lz, windows]);

  // inside wall
  useEffect(() => {
    if (insideWallRef.current) {
      const wallShape = new Shape();
      drawRectangle(wallShape, lx, lz, 0, 0, leftOffsetState, rightOffsetState);

      windows.forEach((w) => {
        if (w.id !== invalidWindowID) {
          const window = new Shape();
          drawRectangle(window, w.lx * lx, w.lz * lz, w.cx * lx, w.cz * lz);
          wallShape.holes.push(window);
        }
      });

      insideWallRef.current.geometry = new ShapeBufferGeometry(wallShape);
      insideWallRef.current.material = whiteWallMaterial;
      gl.render(scene, camera);
    }
  }, [init, leftOffsetState, rightOffsetState, lx, ly, lz, windows]);

  // top surface
  useEffect(() => {
    if (topSurfaceRef.current) {
      const topSurfaceShape = new Shape();
      drawTopSurface(topSurfaceShape, lx, ly, leftOffsetState, rightOffsetState);
      topSurfaceRef.current.geometry = new ShapeBufferGeometry(topSurfaceShape);
      topSurfaceRef.current.material = whiteWallMaterial;
      gl.render(scene, camera);
    }
  }, [init, leftOffsetState, rightOffsetState, lx, ly, lz]);

  const drawTopSurface = (shape: Shape, lx: number, ly: number, leftOffsetState: number, rightOffsetState: number) => {
    const x = lx / 2;
    const y = ly / 2;
    shape.moveTo(-x, -y);
    shape.lineTo(x, -y);
    shape.lineTo(x - rightOffsetState, y);
    shape.lineTo(-x + leftOffsetState, y);
    shape.lineTo(-x, -y);
  };

  const drawRectangle = (
    shape: Shape,
    lx: number,
    ly: number,
    cx = 0,
    cy = 0,
    leftOffsetState = 0,
    rightOffsetState = 0,
  ) => {
    const x = lx / 2;
    const y = ly / 2;
    shape.moveTo(cx - x + leftOffsetState, cy - y);
    shape.lineTo(cx + x - rightOffsetState, cy - y);
    shape.lineTo(cx + x - rightOffsetState, cy + y);
    shape.lineTo(cx - x + leftOffsetState, cy + y);
    shape.lineTo(cx - x + leftOffsetState, cy - y);
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

  const movingWindowInsideWall = (p: Vector3, wlx: number, wlz: number) => {
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
      setInvalidWindowID(id);
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
          setInvalidWindowID(id);
          return false; // has collision
        }
      }
    }
    setInvalidWindowID(null);
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

  const setRayCast = (e: PointerEvent) => {
    const mouse = new Vector2();
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const getPositionOnGrid = (p: Vector3) => {
    if (enableFineGridRef.current) {
      p = stickToFineGrid(p);
    } else {
      p = stickToNormalGrid(p);
    }
    return p;
  };

  return (
    <>
      {wallAbsPosition && wallAbsAngle !== undefined && (
        <group
          name={`Wall Group ${id}`}
          position={wallAbsPosition}
          rotation={[0, 0, wallAbsAngle]}
          userData={{ parentId: parentId }}
        >
          {/* outside wall */}
          <mesh
            name={'Outside Wall'}
            ref={outSideWallRef}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow={shadowEnabled}
            receiveShadow={shadowEnabled}
            onContextMenu={(e) => {
              selectMe(id, e, ActionType.Select);
              setCommonStore((state) => {
                if (e.intersections.length > 0 && e.intersections[0].object === outSideWallRef.current) {
                  state.contextMenuObjectType = ObjectType.Wall;
                }
              });
            }}
            onPointerDown={(e) => {
              if (e.button === 2 || buildingWallIDRef.current) return; // ignore right-click
              setCommonStore((state) => {
                state.contextMenuObjectType = null;
              });

              if (
                !moveHandleTypeRef.current &&
                !resizeHandleTypeRef.current &&
                useStore.getState().objectTypeToAdd === ObjectType.None
              ) {
                selectMe(id, e, ActionType.Select);
              }
            }}
          >
            <meshBasicMaterial map={texture} side={DoubleSide} />
          </mesh>

          {/* inside wall */}
          <mesh
            name={'Inside Wall'}
            ref={insideWallRef}
            position={[0, ly, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow={shadowEnabled}
            receiveShadow={shadowEnabled}
            onPointerDown={(e) => {
              if (e.button === 2 || buildingWallIDRef.current) return; // ignore right-click
              selectMe(id, e, ActionType.Select);
            }}
          />

          {/* top surface */}
          <mesh
            name={'Top Wall'}
            ref={topSurfaceRef}
            position={[0, y, z]}
            castShadow={shadowEnabled}
            receiveShadow={shadowEnabled}
            onPointerDown={(e) => {
              if (e.button === 2 || buildingWallIDRef.current) return; // ignore right-click
              selectMe(id, e, ActionType.Select);
            }}
          />

          {/* side surfaces */}
          {leftOffsetState == 0 && (
            <Plane
              args={[lz, ly]}
              position={[-x + 0.01, y, 0]}
              rotation={[0, Math.PI / 2, 0]}
              onPointerDown={(e) => {
                if (e.button === 2 || buildingWallIDRef.current) return; // ignore right-click
                selectMe(id, e, ActionType.Select);
              }}
            >
              <meshStandardMaterial color={'white'} side={DoubleSide} />
            </Plane>
          )}
          {rightOffsetState == 0 && (
            <Plane
              args={[lz, ly]}
              position={[x - 0.01, y, 0]}
              rotation={[0, Math.PI / 2, 0]}
              onPointerDown={(e) => {
                if (e.button === 2 || buildingWallIDRef.current) return; // ignore right-click
                selectMe(id, e, ActionType.Select);
              }}
            >
              <meshStandardMaterial color={'white'} side={DoubleSide} />
            </Plane>
          )}

          {/* intersection plane */}
          <Plane
            name={'Wall Intersection Plane ' + id}
            ref={intersectionPlaneRef}
            args={[lx, lz]}
            position={[0, ly / 2 + 0.01, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            visible={false}
            onPointerMove={(e) => {
              setRayCast(e);

              if (intersectionPlaneRef.current) {
                const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
                if (intersects.length > 0) {
                  const pointer = intersects[0].point;

                  // move or resize
                  if (grabRef.current?.parentId === id) {
                    const moveHandleType = moveHandleTypeRef.current;
                    const resizeHandleType = resizeHandleTypeRef.current;

                    if (grabRef.current?.type === ObjectType.Window) {
                      let p = getWindowRelativePos(pointer, wallModel);
                      p = getPositionOnGrid(p);

                      if (moveHandleType) {
                        p = movingWindowInsideWall(p, grabRef.current.lx * lx, grabRef.current.lz * lz);
                        checkWindowCollision(grabRef.current.id, p, grabRef.current.lx * lx, grabRef.current.lz * lz);
                        setCommonStore((state) => {
                          for (const e of state.elements) {
                            if (e.id === grabRef.current?.id) {
                              e.cx = p.x / lx;
                              e.cz = p.z / lz;
                              e.color = e.id === invalidWindowID ? 'red' : '#477395';
                            }
                          }
                        });
                      } else if (resizeHandleType) {
                        p = resizingWindowInsideWall(p);
                        let resizeAnchor = getWindowRelativePos(resizeAnchorRef.current, wallModel);
                        if (isBuildingNewWindow) {
                          resizeAnchor = getPositionOnGrid(resizeAnchor);
                        }
                        const v = new Vector3().subVectors(resizeAnchor, p); // window diagonal vector
                        let relativePos = new Vector3().addVectors(resizeAnchor, p).divideScalar(2);
                        checkWindowCollision(grabRef.current.id, relativePos, Math.abs(v.x), Math.abs(v.z));
                        setCommonStore((state) => {
                          for (const e of state.elements) {
                            if (e.id === grabRef.current?.id) {
                              e.lx = Math.abs(v.x) / lx;
                              e.lz = Math.abs(v.z) / lz;
                              e.cx = relativePos.x / lx;
                              e.cz = relativePos.z / lz;
                              e.color = e.id === invalidWindowID ? 'red' : '#477395';
                            }
                          }
                        });
                      }
                    } else if (grabRef.current?.type === ObjectType.SolarPanel) {
                    } else if (grabRef.current?.type === ObjectType.Sensor) {
                    }
                  }

                  // add new window
                  if (objectTypeToAddRef.current === ObjectType.Window) {
                    let relativePos = getWindowRelativePos(pointer, wallModel);
                    relativePos = getPositionOnGrid(relativePos);

                    const newWindow = ElementModelFactory.makeWindow(
                      wallModel,
                      relativePos.x / lx,
                      0,
                      relativePos.z / lz,
                    );
                    setCommonStore((state) => {
                      state.enableOrbitController = false;
                      state.objectTypeToAdd = ObjectType.None;
                      state.elements.push(newWindow);
                      state.selectedElement = newWindow;
                      state.moveHandleType = MoveHandleType.Mid;
                    });
                    setShowGrid(true);
                    setIsBuildingNewWindow(true);
                    grabRef.current = newWindow;
                  }
                  // add new solar panel
                  else if (objectTypeToAddRef.current === ObjectType.SolarPanel) {
                  }
                  // add new sensor
                  else if (objectTypeToAddRef.current === ObjectType.Sensor) {
                  }
                }
              }
            }}
            onPointerDown={(e) => {
              if (e.button === 2 || buildingWallIDRef.current) return; // ignore right-click
              setRayCast(e);

              if (intersectionPlaneRef.current) {
                const intersects = ray.intersectObjects([intersectionPlaneRef.current]);

                if (intersects.length > 0) {
                  const pointer = intersects[0].point;

                  // set window start point
                  if (isBuildingNewWindow) {
                    setCommonStore((state) => {
                      state.moveHandleType = null;
                      state.resizeHandleType = ResizeHandleType.LowerRight;
                      state.resizeAnchor.copy(pointer);
                    });
                  }

                  const selectedElement = getSelectedElement();
                  grabRef.current = selectedElement;

                  if (objectTypeToAddRef.current === ObjectType.Roof) {
                    const points = checkWallLoop(wallModel.id);
                    if (points && parent) {
                      const roof = ElementModelFactory.makeRoof(lz, parent, points);
                      setCommonStore((state) => {
                        state.elements.push(roof);
                      });
                    }
                    setCommonStore((state) => {
                      state.objectTypeToAdd = ObjectType.None;
                    });
                  }

                  if (selectedElement && selectedElement.parentId === id) {
                    if (selectedElement.id === id) {
                      // no child of this wall is clicked
                    } else {
                      // a child of this wall is clicked
                      if (moveHandleTypeRef.current || resizeHandleTypeRef.current) {
                        setShowGrid(true);
                      }
                    }
                  }
                  setOriginElements([...elements]);
                }
              }
            }}
            onPointerUp={() => {
              if (invalidWindowID) {
                if (isBuildingNewWindow) {
                  setCommonStore((state) => {
                    state.elements.pop();
                  });
                  setIsBuildingNewWindow(false);
                } else {
                  setCommonStore((state) => {
                    if (originElements) {
                      state.elements = [...originElements];
                    }
                    state.enableOrbitController = true;
                  });
                }
                setInvalidWindowID(null);
                setOriginElements([]);
              }
              setShowGrid(false);
              setIsBuildingNewWindow(false);
              setCommonStore((state) => {
                state.moveHandleType = null;
                state.resizeHandleType = null;
              });

              grabRef.current = null;
            }}
          />

          {windows.map((e) => {
            return <Window key={e.id} {...(e as WindowModel)} />;
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

    let lx = handleSize,
      ly = handleSize,
      lz = handleSize;
    if (handleType === RType.LowerRight || handleType === RType.LowerLeft) {
      lx = handleSize * 1.7;
    } else {
      ly = handleSize / 2;
      lz = handleSize * 1.7;
    }
    return (
      <Box
        name={handleType}
        ref={handleRef}
        args={[lx, ly, lz]}
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
              // setShowGrid(true);
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
      </Box>
    );
  },
);

const WallResizeHandleWarpper = React.memo(({ x, z, id, highLight, setShowGrid }: WallResizeHandleWarpperProps) => {
  const orthographic = useStore(Selector.viewState.orthographic);
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

export default React.memo(Wall);
