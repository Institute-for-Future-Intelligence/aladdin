/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import WallTextureDefault from 'src/resources/wall_edge.png';
import WallTexture00 from 'src/resources/wall_00.png';
import WallTexture01 from 'src/resources/wall_01.png';
import WallTexture02 from 'src/resources/wall_02.png';
import WallTexture03 from 'src/resources/wall_03.png';
import WallTexture04 from 'src/resources/wall_04.png';
import WallTexture05 from 'src/resources/wall_05.png';
import WallTexture06 from 'src/resources/wall_06.png';
import WallTexture07 from 'src/resources/wall_07.png';
import WallTexture08 from 'src/resources/wall_08.png';
import WallTexture09 from 'src/resources/wall_09.png';
import WallTexture10 from 'src/resources/wall_10.png';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { ThreeEvent, useThree } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import { ActionType, MoveHandleType, ObjectType, ResizeHandleType, WallTexture } from 'src/types';
import { Util } from 'src/Util';
import { useStore } from 'src/stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import { ElementModel } from 'src/models/ElementModel';
import { WindowModel } from 'src/models/WindowModel';
import { WallModel } from 'src/models/WallModel';
import { ElementModelFactory } from 'src/models/ElementModelFactory';
import { Point2 } from 'src/models/Point2';
import { ElementGrid } from '../elementGrid';
import Window from '../window/window';
import WallWireFrame from './wallWireFrame';
import WallResizeHandleWarpper from './wallResizeHandleWarpper';
import * as Selector from 'src/stores/selector';
import { FINE_GRID_SCALE, HALF_PI, TWO_PI } from 'src/constants';
import { UndoableMove } from 'src/undo/UndoableMove';
import { UndoableAdd } from 'src/undo/UndoableAdd';
import { UndoableResizeWindow } from 'src/undo/UndoableResize';

const Wall = ({
  id,
  cx,
  cy,
  lx = 1,
  ly = 0.5,
  lz = 4,
  relativeAngle,
  leftJoints,
  rightJoints,
  textureType,
  color,
  parentId,
  selected = false,
  locked = false,
  roofId,
  leftRoofHeight,
  rightRoofHeight,
  centerRoofHeight,
}: WallModel) => {
  const textureLoader = useMemo(() => {
    let textureImg;
    switch (textureType) {
      case WallTexture.Default:
        textureImg = WallTextureDefault;
        break;
      case WallTexture.NoTexture:
        textureImg = WallTexture00;
        break;
      case WallTexture.Texture01:
        textureImg = WallTexture01;
        break;
      case WallTexture.Texture02:
        textureImg = WallTexture02;
        break;
      case WallTexture.Texture03:
        textureImg = WallTexture03;
        break;
      case WallTexture.Texture04:
        textureImg = WallTexture04;
        break;
      case WallTexture.Texture05:
        textureImg = WallTexture05;
        break;
      case WallTexture.Texture06:
        textureImg = WallTexture06;
        break;
      case WallTexture.Texture07:
        textureImg = WallTexture07;
        break;
      case WallTexture.Texture08:
        textureImg = WallTexture08;
        break;
      case WallTexture.Texture09:
        textureImg = WallTexture09;
        break;
      case WallTexture.Texture10:
        textureImg = WallTexture10;
        break;
      default:
        textureImg = WallTexture00;
    }

    return new TextureLoader().load(textureImg, (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.offset.set(0, 0);
      let repeatX = 0.6;
      let repeatY = 0.6;
      switch (textureType) {
        case WallTexture.Default:
          repeatX = 2;
          repeatY = 2;
          break;
        case WallTexture.Texture03:
          repeatX = 2;
          repeatY = 1;
          break;
        case WallTexture.Texture06:
          repeatX = 1;
          repeatY = 1;
          break;
      }
      texture.repeat.set(repeatX, repeatY);
      setTexture(texture);
    });
  }, [textureType]);
  const [texture, setTexture] = useState(textureLoader);

  const getElementById = useStore(Selector.getElementById);
  const parent = getElementById(parentId);
  const wallModel = getElementById(id) as WallModel;

  const elements = useStore(Selector.elements);
  const deletedWindowAndParentId = useStore(Selector.deletedWindowAndParentId);
  const deletedRoofId = useStore(Selector.deletedRoofId);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const setCommonStore = useStore(Selector.set);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const selectMe = useStore(Selector.selectMe);
  const removeElementById = useStore(Selector.removeElementById);
  const isAddingElement = useStore(Selector.isAddingElement);
  const addUndoable = useStore(Selector.addUndoable);
  const setElementPosition = useStore(Selector.setElementPosition);

  const objectTypeToAddRef = useRef(useStore.getState().objectTypeToAdd);
  const moveHandleTypeRef = useRef(useStore.getState().moveHandleType);
  const resizeHandleTypeRef = useRef(useStore.getState().resizeHandleType);
  const resizeAnchorRef = useRef(useStore.getState().resizeAnchor);
  const addedWallIdRef = useRef(useStore.getState().addedWallId);
  const enableFineGridRef = useRef(useStore.getState().enableFineGrid);

  const intersectionPlaneRef = useRef<Mesh>(null);
  const outSideWallRef = useRef<Mesh>(null);
  const insideWallRef = useRef<Mesh>(null);
  const topSurfaceRef = useRef<Mesh>(null);
  const grabRef = useRef<ElementModel | null>(null);

  const addedWindowIdRef = useRef<string | null>(null);
  const isSettingWindowStartPointRef = useRef(false);
  const isSettingWindowEndPointRef = useRef(false);
  const invalidWindowIdRef = useRef<string | null>(null);
  const oldPositionRef = useRef<number[]>([]);
  const oldDimensionRef = useRef<number[]>([]);

  const [originElements, setOriginElements] = useState<ElementModel[] | null>([]);
  const [showGrid, setShowGrid] = useState(false);
  const [windows, setWindows] = useState<WindowModel[]>([]);

  const { camera, gl } = useThree();
  const mouse = useMemo(() => new Vector2(), []);
  const ray = useMemo(() => new Raycaster(), []);
  const whiteWallMaterial = useMemo(() => new MeshStandardMaterial({ color: 'white', side: DoubleSide }), []);

  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;
  const highLight = lx === 0;
  const wallAbsPosition = parent
    ? Util.wallAbsolutePosition(new Vector3(cx, cy), parent).setZ(hz + parent.lz)
    : new Vector3(cx, cy, hz);
  const wallAbsAngle = parent ? parent.rotation[2] + relativeAngle : relativeAngle;

  leftRoofHeight = leftJoints.length > 0 ? leftRoofHeight : lz;
  rightRoofHeight = rightJoints.length > 0 ? rightRoofHeight : lz;

  let leftOffset = 0;
  let rightOffset = 0;

  if (leftJoints.length > 0) {
    const targetWall = getElementById(leftJoints[0]) as WallModel;
    if (targetWall) {
      const deltaAngle = (Math.PI * 3 - (relativeAngle - targetWall.relativeAngle)) % TWO_PI;
      if (deltaAngle < HALF_PI && deltaAngle > 0) {
        leftOffset = Math.min(ly / Math.tan(deltaAngle), lx);
      }
    }
  }

  if (rightJoints.length > 0) {
    const targetWall = getElementById(rightJoints[0]) as WallModel;
    if (targetWall) {
      const deltaAngle = (Math.PI * 3 + relativeAngle - targetWall.relativeAngle) % TWO_PI;
      if (deltaAngle < HALF_PI && deltaAngle > 0) {
        rightOffset = Math.min(ly / Math.tan(deltaAngle), lx);
      }
    }
  }

  const drawTopSurface = (shape: Shape, lx: number, ly: number, leftOffset: number, rightOffset: number) => {
    const x = lx / 2;
    const y = ly / 2;
    shape.moveTo(-x, -y);
    shape.lineTo(x, -y);
    shape.lineTo(x - rightOffset, y);
    shape.lineTo(-x + leftOffset, y);
    shape.lineTo(-x, -y);
  };

  const drawRectangle = (
    shape: Shape,
    lx: number,
    ly: number,
    cx = 0,
    cy = 0,
    leftOffset = 0,
    rightOffset = 0,
    leftRoofHeight?: number,
    rightRoofHeight?: number,
    centerRoofHeight?: number[],
  ) => {
    const x = lx / 2;
    const y = ly / 2;
    shape.moveTo(cx - x + leftOffset, cy - y); // lower left
    shape.lineTo(cx + x - rightOffset, cy - y); // lower right
    if (roofId && (leftRoofHeight || rightRoofHeight || centerRoofHeight)) {
      shape.lineTo(cx + x - rightOffset, rightRoofHeight ? rightRoofHeight - y : cy + 2 * y - y);
      centerRoofHeight && shape.lineTo(centerRoofHeight[0] * lx, centerRoofHeight[1] - y);
      shape.lineTo(cx - x + leftOffset, leftRoofHeight ? leftRoofHeight - y : cy + 2 * y - y);
    } else {
      shape.lineTo(cx + x - rightOffset, cy + y); // upper right
      shape.lineTo(cx - x + leftOffset, cy + y); // upper left
    }
    shape.lineTo(cx - x + leftOffset, cy - y); // lower left
  };

  // outside wall
  if (outSideWallRef.current) {
    const wallShape = new Shape();
    drawRectangle(wallShape, lx, lz, 0, 0, 0, 0, leftRoofHeight, rightRoofHeight, centerRoofHeight);

    windows.forEach((w) => {
      if (w.id !== invalidWindowIdRef.current) {
        const window = new Shape();
        drawRectangle(window, w.lx * lx, w.lz * lz, w.cx * lx, w.cz * lz);
        wallShape.holes.push(window);
      }
    });
    outSideWallRef.current.geometry = new ShapeBufferGeometry(wallShape);
  }

  // inside wall
  if (insideWallRef.current) {
    const wallShape = new Shape();
    drawRectangle(wallShape, lx, lz, 0, 0, leftOffset, rightOffset, leftRoofHeight, rightRoofHeight, centerRoofHeight);

    windows.forEach((w) => {
      if (w.id !== invalidWindowIdRef.current) {
        const window = new Shape();
        drawRectangle(window, w.lx * lx, w.lz * lz, w.cx * lx, w.cz * lz);
        wallShape.holes.push(window);
      }
    });

    insideWallRef.current.geometry = new ShapeBufferGeometry(wallShape);
    insideWallRef.current.material = whiteWallMaterial;
  }

  // intersection plane
  if (intersectionPlaneRef.current) {
    const wallShape = new Shape();
    drawRectangle(wallShape, lx, lz, 0, 0, 0, 0, leftRoofHeight, rightRoofHeight);
    intersectionPlaneRef.current.geometry = new ShapeBufferGeometry(wallShape);
  }

  // top surface
  if (topSurfaceRef.current) {
    const topSurfaceShape = new Shape();
    drawTopSurface(topSurfaceShape, lx, ly, leftOffset, rightOffset);
    topSurfaceRef.current.geometry = new ShapeBufferGeometry(topSurfaceShape);
    topSurfaceRef.current.material = whiteWallMaterial;
  }

  // subscribe common store
  useEffect(() => {
    const unsubscribe = useStore.subscribe((state) => {
      objectTypeToAddRef.current = state.objectTypeToAdd;
      moveHandleTypeRef.current = state.moveHandleType;
      resizeHandleTypeRef.current = state.resizeHandleType;
      addedWallIdRef.current = state.addedWallId;
      enableFineGridRef.current = state.enableFineGrid;
      resizeAnchorRef.current = state.resizeAnchor;
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (deletedWindowAndParentId && deletedWindowAndParentId[1] === id) {
      resetCurrentState();
      setShowGrid(false);
      setCommonStore((state) => {
        state.deletedWindowAndParentId = null;
      });
    }
  }, [deletedWindowAndParentId]);

  // windows
  useEffect(() => {
    setWindows(elements.filter((e) => e.type === ObjectType.Window && e.parentId === id));
  }, [elements]);

  // roof
  useEffect(() => {
    if (deletedRoofId === roofId) {
      setCommonStore((state) => {
        for (const e of state.elements) {
          if (e.id === id) {
            (e as WallModel).roofId = null;
            (e as WallModel).leftRoofHeight = undefined;
            (e as WallModel).rightRoofHeight = undefined;
            (e as WallModel).centerRoofHeight = undefined;
            break;
          }
        }
      });
    }
  }, [deletedRoofId]);

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

  const snapToNormalGrid = (v: Vector3) => {
    return new Vector3(Math.round(v.x), v.y, Math.round(v.z));
  };

  const snapToFineGrid = (v: Vector3) => {
    const x = parseFloat((Math.round(v.x / FINE_GRID_SCALE) * FINE_GRID_SCALE).toFixed(1));
    const z = parseFloat((Math.round(v.z / FINE_GRID_SCALE) * FINE_GRID_SCALE).toFixed(1));
    return new Vector3(x, v.y, z);
  };

  const movingWindowInsideWall = (p: Vector3, wlx: number, wlz: number) => {
    const margin = 0.1;
    const maxX = (lx - wlx) / 2;
    const maxZ = (lz - wlz) / 2;
    if (p.x > maxX) {
      p.setX(maxX - margin);
    } else if (p.x < -maxX) {
      p.setX(-maxX + margin);
    }
    if (p.z > maxZ) {
      p.setZ(maxZ - margin);
    } else if (p.z < -maxZ) {
      p.setZ(-maxZ + margin);
    }
    return p;
  };

  const resizingWindowInsideWall = (p: Vector3) => {
    const margin = 0.1;
    if (p.z > hz - margin) {
      p.setZ(hz - margin);
    }
    if (p.z < -hz + margin) {
      p.setZ(-hz + margin);
    }
    if (p.x > hx - margin) {
      p.setX(hx - margin);
    }
    if (p.x < -hx + margin) {
      p.setX(-hx + margin);
    }
    return p;
  };

  const checkWindowCollision = (id: string, p: Vector3, wlx: number, wlz: number) => {
    if (wlx < 0.1 || wlz < 0.1) {
      invalidWindowIdRef.current = id;
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
          invalidWindowIdRef.current = id;
          return false; // has collision
        }
      }
    }
    invalidWindowIdRef.current = null;
    return true; // no collision
  };

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const getPositionOnGrid = (p: Vector3) => {
    if (enableFineGridRef.current) {
      p = snapToFineGrid(p);
    } else {
      p = snapToNormalGrid(p);
    }
    return p;
  };

  const checkIsFirstWall = (e: ThreeEvent<PointerEvent>) => {
    for (const intersection of e.intersections) {
      if (intersection.object.name.includes('Wall Intersection Plane')) {
        return intersection.object.name === `Wall Intersection Plane ${id}`;
      }
    }
    return false;
  };

  const checkIfCanSelectMe = (e: ThreeEvent<PointerEvent>) => {
    if (
      e.button === 2 ||
      addedWallIdRef.current ||
      addedWindowIdRef.current ||
      moveHandleTypeRef.current ||
      resizeHandleTypeRef.current ||
      useStore.getState().objectTypeToAdd !== ObjectType.None ||
      selected ||
      isAddingElement()
    ) {
      return false;
    }
    return true;
  };

  const resetCurrentState = () => {
    grabRef.current = null;
    addedWindowIdRef.current = null;
    isSettingWindowStartPointRef.current = false;
    isSettingWindowEndPointRef.current = false;
    invalidWindowIdRef.current = null;
  };

  const addUndoableAdd = (elem: ElementModel) => {
    const undoableAdd = {
      name: 'Add',
      timestamp: Date.now(),
      addedElement: elem,
      undo: () => {
        removeElementById(elem.id, false);
      },
      redo: () => {
        setCommonStore((state) => {
          state.elements.push(undoableAdd.addedElement);
          state.selectedElement = undoableAdd.addedElement;
        });
      },
    } as UndoableAdd;
    addUndoable(undoableAdd);
  };

  const addUndoableMove = (elem: ElementModel) => {
    const undoableMove = {
      name: 'Move',
      timestamp: Date.now(),
      movedElementId: elem.id,
      oldCx: oldPositionRef.current[0],
      oldCy: oldPositionRef.current[1],
      oldCz: oldPositionRef.current[2],
      newCx: elem.cx,
      newCy: elem.cy,
      newCz: elem.cz,
      undo: () => {
        setElementPosition(undoableMove.movedElementId, undoableMove.oldCx, undoableMove.oldCy, undoableMove.oldCz);
      },
      redo: () => {
        setElementPosition(undoableMove.movedElementId, undoableMove.newCx, undoableMove.newCy, undoableMove.newCz);
      },
    } as UndoableMove;
    addUndoable(undoableMove);
  };

  const addUndoableResize = (elem: ElementModel) => {
    switch (elem.type) {
      case ObjectType.Window:
        const undoableResize = {
          name: 'Resize',
          timestamp: Date.now(),
          resizedElementId: elem.id,
          oldPosition: [...oldPositionRef.current],
          oldDimension: [...oldDimensionRef.current],
          newPosition: [elem.cx, elem.cy, elem.cz],
          newDimension: [elem.lx, elem.ly, elem.lz],
          undo: () => {
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === undoableResize.resizedElementId) {
                  [e.cx, e.cy, e.cz] = undoableResize.oldPosition;
                  [e.lx, e.ly, e.lz] = undoableResize.oldDimension;
                  break;
                }
              }
            });
          },
          redo: () => {
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === undoableResize.resizedElementId) {
                  [e.cx, e.cy, e.cz] = undoableResize.newPosition;
                  [e.lx, e.ly, e.lz] = undoableResize.newDimension;
                  break;
                }
              }
            });
          },
        } as UndoableResizeWindow;
        addUndoable(undoableResize);
        break;
    }
  };

  const handleIntersectionPointerDown = (e: ThreeEvent<PointerEvent>) => {
    // return on right-click or not first wall
    if (e.button === 2 || addedWallIdRef.current || !checkIsFirstWall(e)) {
      return;
    }

    setRayCast(e);

    if (intersectionPlaneRef.current) {
      const intersects = ray.intersectObjects([intersectionPlaneRef.current]);

      if (intersects.length > 0) {
        const pointer = intersects[0].point;

        // set window start point
        if (isSettingWindowStartPointRef.current) {
          useStoreRef.getState().setEnableOrbitController(false);
          setCommonStore((state) => {
            state.moveHandleType = null;
            state.resizeHandleType = ResizeHandleType.LowerRight;
            state.resizeAnchor.copy(pointer);
          });
          isSettingWindowStartPointRef.current = false;
          isSettingWindowEndPointRef.current = true;
          return;
        }

        // add new elements
        switch (objectTypeToAddRef.current) {
          case ObjectType.Roof: {
            if (parent && !roofId) {
              const roof = ElementModelFactory.makeRoof(lz, parent, [wallModel.id], lx / 2);
              setCommonStore((state) => {
                state.elements.push(roof);
              });
            }
            setCommonStore((state) => {
              state.objectTypeToAdd = ObjectType.None;
            });
            return;
          }
        }

        const selectedElement = getSelectedElement();

        // a child of this wall is clicked
        if (selectedElement && selectedElement.parentId === id) {
          grabRef.current = selectedElement;
          if (moveHandleTypeRef.current || resizeHandleTypeRef.current) {
            setShowGrid(true);
            setOriginElements([...elements]);
            oldPositionRef.current = [selectedElement.cx, selectedElement.cy, selectedElement.cz];
            oldDimensionRef.current = [selectedElement.lx, selectedElement.ly, selectedElement.lz];
          }
        }
      }
    }
  };

  const handleIntersectionPointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2 || grabRef.current === null || grabRef.current.parentId !== id) {
      return;
    }
    if (invalidWindowIdRef.current) {
      if (isSettingWindowEndPointRef.current) {
        setCommonStore((state) => {
          state.elements.pop();
        });
      } else {
        setCommonStore((state) => {
          if (originElements) {
            state.elements = [...originElements];
          }
        });
      }
      invalidWindowIdRef.current = null;
      setOriginElements(null);
    }
    // add undo for valid window operation
    else {
      const elem = getElementById(grabRef.current.id);
      if (elem) {
        if (moveHandleTypeRef.current) {
          addUndoableMove(elem);
        } else if (resizeHandleTypeRef.current) {
          if (isSettingWindowEndPointRef.current) {
            addUndoableAdd(elem);
          } else {
            addUndoableResize(elem);
          }
        }
      }
    }

    setCommonStore((state) => {
      state.moveHandleType = null;
      state.resizeHandleType = null;
      state.addedWindowId = null;
    });
    useStoreRef.getState().setEnableOrbitController(true);
    setShowGrid(false);
    resetCurrentState();
  };

  const handleIntersectionPointerMove = (e: ThreeEvent<PointerEvent>) => {
    // return if it's not first wall when adding new window
    if (isSettingWindowStartPointRef.current && !checkIsFirstWall(e)) {
      if (grabRef.current) {
        removeElementById(grabRef.current.id, false);
      }
      setCommonStore((state) => {
        state.objectTypeToAdd = ObjectType.Window;
        state.addedWindowId = null;
      });
      setShowGrid(false);
      resetCurrentState();
      return;
    }

    setRayCast(e);

    if (intersectionPlaneRef.current) {
      const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
      if (intersects.length > 0) {
        const pointer = intersects[0].point;

        // move or resize
        if (grabRef.current && grabRef.current.parentId === id) {
          const moveHandleType = moveHandleTypeRef.current;
          const resizeHandleType = resizeHandleTypeRef.current;

          switch (grabRef.current.type) {
            case ObjectType.Window: {
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
                      e.color = e.id === invalidWindowIdRef.current ? 'red' : '#477395';
                    }
                  }
                });
              } else if (resizeHandleType) {
                p = resizingWindowInsideWall(p);
                let resizeAnchor = getWindowRelativePos(resizeAnchorRef.current, wallModel);
                if (isSettingWindowEndPointRef.current) {
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
                      e.color = e.id === invalidWindowIdRef.current ? 'red' : '#477395';
                    }
                  }
                });
              }
              break;
            }
            case ObjectType.SolarPanel: {
              break;
            }
            case ObjectType.Sensor: {
              break;
            }
          }
        }

        // add new element
        switch (objectTypeToAddRef.current) {
          case ObjectType.Window: {
            let relativePos = getWindowRelativePos(pointer, wallModel);
            relativePos = getPositionOnGrid(relativePos);

            const newWindow = ElementModelFactory.makeWindow(wallModel, relativePos.x / lx, 0, relativePos.z / lz);
            useStoreRef.getState().setEnableOrbitController(false);
            setCommonStore((state) => {
              state.objectTypeToAdd = ObjectType.None;
              state.elements.push(newWindow);
              state.moveHandleType = MoveHandleType.Mid;
              state.selectedElement = newWindow;
              state.addedWindowId = newWindow.id;
            });
            setShowGrid(true);
            grabRef.current = newWindow;
            addedWindowIdRef.current = newWindow.id;
            isSettingWindowStartPointRef.current = true;
            break;
          }
          case ObjectType.SolarPanel: {
            break;
          }
          case ObjectType.Sensor: {
            break;
          }
        }
      }
    }
  };

  const handleIntersectionPointerOut = (e: ThreeEvent<PointerEvent>) => {
    if (isSettingWindowStartPointRef.current && grabRef.current) {
      removeElementById(grabRef.current.id, false);
      setCommonStore((state) => {
        state.objectTypeToAdd = ObjectType.Window;
        state.addedWindowId = null;
      });
      setShowGrid(false);
      resetCurrentState();
    }
  };

  const handleWallBodyPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (checkIfCanSelectMe(e)) {
      setCommonStore((state) => {
        state.contextMenuObjectType = null;
      });
      selectMe(id, e, ActionType.Select);
    }
  };

  return (
    <>
      {parent && wallAbsPosition && wallAbsAngle !== undefined && (
        <group
          name={`Wall Group ${id}`}
          position={wallAbsPosition}
          rotation={[0, 0, wallAbsAngle]}
          userData={{ aabb: true }}
        >
          {/* outside wall */}
          <mesh
            name={'Outside Wall'}
            uuid={id}
            userData={{ simulation: true }}
            ref={outSideWallRef}
            rotation={[HALF_PI, 0, 0]}
            castShadow={shadowEnabled}
            receiveShadow={shadowEnabled}
            onContextMenu={(e) => {
              if (grabRef.current) {
                return;
              }
              selectMe(id, e, ActionType.Select);
              setCommonStore((state) => {
                if (e.intersections.length > 0 && e.intersections[0].object === outSideWallRef.current) {
                  state.contextMenuObjectType = ObjectType.Wall;
                  state.pastePoint.copy(e.intersections[0].point);
                }
              });
            }}
            onPointerDown={handleWallBodyPointerDown}
          >
            <meshBasicMaterial
              color={textureType === WallTexture.Default || textureType === WallTexture.NoTexture ? color : 'white'}
              map={texture}
              side={DoubleSide}
            />
          </mesh>

          {/* inside wall */}
          <mesh
            name={'Inside Wall'}
            ref={insideWallRef}
            position={[0, ly, 0]}
            rotation={[HALF_PI, 0, 0]}
            castShadow={shadowEnabled}
            receiveShadow={shadowEnabled}
            onPointerDown={handleWallBodyPointerDown}
          />

          {/* top surface */}
          {!roofId && (
            <mesh
              name={'Top Wall'}
              ref={topSurfaceRef}
              position={[0, hy, hz]}
              castShadow={shadowEnabled}
              receiveShadow={shadowEnabled}
              onPointerDown={handleWallBodyPointerDown}
            />
          )}

          {/* side surfaces */}
          {leftOffset === 0 && (
            <Plane
              args={[leftRoofHeight ?? lz, ly]}
              position={[-hx + 0.01, hy, -(lz - (leftRoofHeight ?? lz)) / 2]}
              rotation={[0, HALF_PI, 0]}
              castShadow={shadowEnabled}
              receiveShadow={shadowEnabled}
              onPointerDown={handleWallBodyPointerDown}
            >
              <meshStandardMaterial color={'white'} side={DoubleSide} />
            </Plane>
          )}
          {rightOffset === 0 && (
            <Plane
              args={[rightRoofHeight ?? lz, ly]}
              position={[hx - 0.01, hy, -(lz - (rightRoofHeight ?? lz)) / 2]}
              rotation={[0, HALF_PI, 0]}
              castShadow={shadowEnabled}
              receiveShadow={shadowEnabled}
              onPointerDown={handleWallBodyPointerDown}
            >
              <meshStandardMaterial color={'white'} side={DoubleSide} />
            </Plane>
          )}

          {/* intersection plane */}
          <mesh
            name={`Wall Intersection Plane ${id}`}
            ref={intersectionPlaneRef}
            position={[0, ly / 2 + 0.01, 0]}
            rotation={[HALF_PI, 0, 0]}
            visible={false}
            onPointerDown={handleIntersectionPointerDown}
            onPointerUp={handleIntersectionPointerUp}
            onPointerMove={handleIntersectionPointerMove}
            onPointerOut={handleIntersectionPointerOut}
          >
            <meshBasicMaterial />
          </mesh>

          {windows.map((e) => {
            return <Window key={e.id} {...(e as WindowModel)} />;
          })}

          {/* wireFrame */}
          {selected ? (
            <WallWireFrame x={hx} z={hz} />
          ) : (
            <WallWireFrame x={hx} z={hz} leftHeight={leftRoofHeight} rightHeight={rightRoofHeight} />
          )}

          {/* handles */}
          {selected && !locked && <WallResizeHandleWarpper x={hx} z={hz} id={id} highLight={highLight} />}

          {/* grid */}
          {showGrid && (moveHandleTypeRef.current || resizeHandleTypeRef.current) && (
            <group position={[0, -0.001, 0]} rotation={[HALF_PI, 0, 0]}>
              <ElementGrid hx={hx} hy={hz} hz={0} />
            </group>
          )}
        </group>
      )}
    </>
  );
};

export default React.memo(Wall);
