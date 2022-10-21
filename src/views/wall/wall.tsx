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
  BackSide,
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
import { Box, Plane } from '@react-three/drei';
import { ActionType, MoveHandleType, ObjectType, Orientation, ResizeHandleType, WallTexture } from 'src/types';
import { Util } from 'src/Util';
import { useStore } from 'src/stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import { ElementModel } from 'src/models/ElementModel';
import { WindowModel } from 'src/models/WindowModel';
import { WallModel, WallStructure } from 'src/models/WallModel';
import { ElementModelFactory } from 'src/models/ElementModelFactory';
import { Point2 } from 'src/models/Point2';
import { ElementGrid } from '../elementGrid';
import Window from '../window/window';
import WallWireFrame from './wallWireFrame';
import WallResizeHandleWarpper from './wallResizeHandleWrapper';
import WallMoveHandleWarpper from './wallMoveHandleWrapper';
import * as Selector from 'src/stores/selector';
import { FINE_GRID_SCALE, HALF_PI, LOCKED_ELEMENT_SELECTION_COLOR, NORMAL_GRID_SCALE, TWO_PI } from 'src/constants';
import { UndoableMove } from 'src/undo/UndoableMove';
import { UndoableAdd } from 'src/undo/UndoableAdd';
import { UndoableResizeElementOnWall } from 'src/undo/UndoableResize';
import { DoorModel } from 'src/models/DoorModel';
import Door from '../door';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import SolarPanelOnWall from '../solarPanel/solarPanelOnWall';

const useElements = (id: string, leftWallId?: string, rightWallId?: string, roofId?: string) => {
  const isElementTriggerWallChange = (elem: ElementModel) => {
    if (elem.parentId === id || elem.id === roofId) {
      return true;
    }
    return false;
  };

  const leftWall = useStore((state) => {
    if (leftWallId) {
      for (const e of state.elements) {
        if (e.id === leftWallId) {
          return e as WallModel;
        }
      }
    }
    return null;
  });

  const rightWall = useStore((state) => {
    if (rightWallId) {
      for (const e of state.elements) {
        if (e.id === rightWallId) {
          return e as WallModel;
        }
      }
    }
    return null;
  });

  const elementsTriggerChange = useStore((state) => state.elements.filter(isElementTriggerWallChange));

  const elementsOnWall = useMemo(
    () => elementsTriggerChange.filter((el) => Util.isLegalOnWall(el.type)),
    [JSON.stringify(elementsTriggerChange)],
  );

  return { elementsOnWall, leftWall, rightWall };
};

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
  lineColor = 'black',
  lineWidth = 0.2,
  parentId,
  selected = false,
  locked = false,
  roofId,
  leftRoofHeight,
  rightRoofHeight,
  centerRoofHeight,
  centerLeftRoofHeight,
  centerRightRoofHeight,
  wallStructure = WallStructure.Default,
  studSpacing = 2,
  opacity = 0.5,
  studColor = 'white',
  studWidth = 0.1,
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

    if (wallStructure === WallStructure.Stud) {
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
  }, [textureType, wallStructure]);
  const [texture, setTexture] = useState(textureLoader);

  const getElementById = useStore(Selector.getElementById);
  const wallModel = getElementById(id) as WallModel;
  const parent = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === parentId) {
        return e;
      }
    }
  });

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

  const intersectionPlaneRef = useRef<Mesh>(null);
  const outsideWallRef = useRef<Mesh>(null);
  // const outsideWallInnerFaceRef = useRef<Mesh>(null);
  const insideWallRef = useRef<Mesh>(null);
  const topSurfaceRef = useRef<Mesh>(null);
  const grabRef = useRef<ElementModel | null>(null);
  const isFirstMountRef = useRef(true);

  const addedWindowIdRef = useRef<string | null>(null);
  const isSettingWindowStartPointRef = useRef(false);
  const isSettingWindowEndPointRef = useRef(false);
  const invalidElementIdRef = useRef<string | null>(null);
  const isSettingDoorStartPointRef = useRef(false);
  const isSettingDoorEndPointRef = useRef(false);
  const oldPositionRef = useRef<number[]>([]);
  const oldDimensionRef = useRef<number[]>([]);

  const [originElements, setOriginElements] = useState<ElementModel[] | null>(null);
  const [showGrid, setShowGrid] = useState(false);

  const { elementsOnWall, leftWall, rightWall } = useElements(id, leftJoints[0], rightJoints[0]);

  const transparent = wallStructure === WallStructure.Stud;

  const { camera, gl } = useThree();
  const mouse = useMemo(() => new Vector2(), []);
  const ray = useMemo(() => new Raycaster(), []);
  const whiteMaterialDouble = useMemo(
    () => new MeshStandardMaterial({ color: 'white', side: DoubleSide, transparent: transparent, opacity: opacity }),
    [transparent, opacity],
  );

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

  if (leftWall) {
    const deltaAngle = (Math.PI * 3 - (relativeAngle - leftWall.relativeAngle)) % TWO_PI;
    if (deltaAngle <= HALF_PI + 0.01 && deltaAngle > 0) {
      leftOffset = Math.min(ly / Math.tan(deltaAngle) + leftWall.ly, lx);
    }
  }

  if (rightWall) {
    const deltaAngle = (Math.PI * 3 + relativeAngle - rightWall.relativeAngle) % TWO_PI;
    if (deltaAngle <= HALF_PI + 0.01 && deltaAngle > 0) {
      rightOffset = Math.min(ly / Math.tan(deltaAngle) + rightWall.ly, lx);
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

  const drawRectangle = (shape: Shape, lx: number, ly: number, cx = 0, cy = 0, leftOffset = 0, rightOffset = 0) => {
    const x = lx / 2;
    const y = ly / 2;
    shape.moveTo(cx - x + leftOffset, cy - y); // lower left
    shape.lineTo(cx + x - rightOffset, cy - y); // lower right

    if (roofId) {
      if (rightRoofHeight) {
        shape.lineTo(cx + x - rightOffset, rightRoofHeight - y);
      } else {
        shape.lineTo(cx + x - rightOffset, cy + y); // upper right
      }
      centerRightRoofHeight && shape.lineTo(centerRightRoofHeight[0] * lx, centerRightRoofHeight[1] - y);
      centerRoofHeight && shape.lineTo(centerRoofHeight[0] * lx, centerRoofHeight[1] - y);
      centerLeftRoofHeight && shape.lineTo(centerLeftRoofHeight[0] * lx, centerLeftRoofHeight[1] - y);
      if (leftRoofHeight) {
        shape.lineTo(cx - x + leftOffset, leftRoofHeight - y);
      } else {
        shape.lineTo(cx - x + leftOffset, cy + y); // upper left
      }
    } else {
      shape.lineTo(cx + x - rightOffset, cy + y); // upper right
      shape.lineTo(cx - x + leftOffset, cy + y); // upper left
    }

    shape.lineTo(cx - x + leftOffset, cy - y); // lower left
  };

  const drawWindow = (shape: Shape, lx: number, ly: number, cx = 0, cy = 0) => {
    const x = lx / 2;
    const y = ly / 2;
    shape.moveTo(cx - x, cy - y);
    shape.lineTo(cx + x, cy - y);
    shape.lineTo(cx + x, cy + y);
    shape.lineTo(cx - x, cy + y);
    shape.lineTo(cx - x, cy - y);
  };

  const outsiedWallShape = useMemo(() => {
    const wallShape = new Shape();
    drawRectangle(wallShape, lx, lz, 0, 0, 0, 0);

    elementsOnWall.forEach((w) => {
      if (w.type === ObjectType.Window && w.id !== invalidElementIdRef.current) {
        const window = new Shape();
        drawWindow(window, w.lx * lx, w.lz * lz, w.cx * lx, w.cz * lz);
        wallShape.holes.push(window);
      }
    });

    return wallShape;
  }, [
    lx,
    lz,
    elementsOnWall,
    leftRoofHeight,
    rightRoofHeight,
    centerRoofHeight,
    centerLeftRoofHeight,
    centerRightRoofHeight,
  ]);

  const insideWallShape = useMemo(() => {
    const wallShape = new Shape();
    drawRectangle(wallShape, lx, lz, 0, 0, leftOffset, rightOffset);

    elementsOnWall.forEach((w) => {
      if (w.type === ObjectType.Window && w.id !== invalidElementIdRef.current) {
        const window = new Shape();
        drawWindow(window, w.lx * lx, w.lz * lz, w.cx * lx, w.cz * lz);
        wallShape.holes.push(window);
      }
    });
    return wallShape;
  }, [
    lx,
    lz,
    leftOffset,
    rightOffset,
    elementsOnWall,
    leftRoofHeight,
    rightRoofHeight,
    centerRoofHeight,
    centerLeftRoofHeight,
    centerRightRoofHeight,
  ]);

  const intersectionPlaneShape = useMemo(() => {
    const wallShape = new Shape();
    drawRectangle(wallShape, lx, lz, 0, 0, 0, 0);
    return wallShape;
  }, [lx, lz, elementsOnWall]);

  const topWallShape = useMemo(() => {
    const shape = new Shape();
    drawTopSurface(shape, lx, ly, leftOffset, rightOffset);
    return shape;
  }, [lx, ly, leftOffset, rightOffset]);

  useEffect(() => {
    if (deletedWindowAndParentId && deletedWindowAndParentId[1] === id) {
      resetCurrentState();
      setShowGrid(false);
      setCommonStore((state) => {
        state.deletedWindowAndParentId = null;
      });
    }
  }, [deletedWindowAndParentId]);

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
            (e as WallModel).centerLeftRoofHeight = undefined;
            (e as WallModel).centerRightRoofHeight = undefined;
            break;
          }
        }
      });
    }
  }, [deletedRoofId]);

  useEffect(() => {
    isFirstMountRef.current = false;
  }, []);

  const getRelativePosOnWall = (p: Vector3, wall: WallModel) => {
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
    const x = parseFloat((Math.round(v.x / NORMAL_GRID_SCALE) * NORMAL_GRID_SCALE).toFixed(1));
    const z = parseFloat((Math.round(v.z / NORMAL_GRID_SCALE) * NORMAL_GRID_SCALE).toFixed(1));
    return new Vector3(x, v.y, z);
  };

  const snapToFineGrid = (v: Vector3) => {
    const x = parseFloat((Math.round(v.x / FINE_GRID_SCALE) * FINE_GRID_SCALE).toFixed(1));
    const z = parseFloat((Math.round(v.z / FINE_GRID_SCALE) * FINE_GRID_SCALE).toFixed(1));
    return new Vector3(x, v.y, z);
  };

  const wallPoints2D = useMemo(() => {
    const points: Point2[] = [];
    const x = lx / 2;
    const y = lz / 2;
    points.push({ x: -x, y: -y });
    points.push({ x: x, y: -y });
    rightRoofHeight ? points.push({ x: x, y: rightRoofHeight - y }) : points.push({ x: x, y: y });
    if (centerRightRoofHeight) {
      points.push({ x: centerRightRoofHeight[0] * lx, y: centerRightRoofHeight[1] - y });
    }
    if (centerRoofHeight) {
      points.push({ x: centerRoofHeight[0] * lx, y: centerRoofHeight[1] - y });
    }
    if (centerLeftRoofHeight) {
      points.push({ x: centerLeftRoofHeight[0] * lx, y: centerLeftRoofHeight[1] - y });
    }
    leftRoofHeight ? points.push({ x: -x, y: leftRoofHeight - y }) : points.push({ x: -x, y: y });

    return points;
  }, [lx, lz, leftRoofHeight, rightRoofHeight, centerRoofHeight, centerLeftRoofHeight, centerRightRoofHeight]);

  const isPointInside = (x: number, y: number) => {
    let inside = false;
    for (let i = 0, j = wallPoints2D.length - 1; i < wallPoints2D.length; j = i++) {
      const xi = wallPoints2D[i].x;
      const yi = wallPoints2D[i].y;
      const xj = wallPoints2D[j].x;
      const yj = wallPoints2D[j].y;
      if (yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  };

  const isMovingElementInsideWall = (p: Vector3, wlx: number, wlz: number) => {
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        if (!isPointInside(p.x + (wlx / 2) * i, p.z + (wlz / 2) * j)) {
          return false;
        }
      }
    }
    return true;
  };

  const collisionHelper = (args: number[]) => {
    let [tMinX, tMaxX, tMinZ, tMaxZ, cMinX, cMaxX, cMinZ, cMaxZ] = args;
    cMinX += 0.1;
    cMaxX -= 0.1;
    cMinZ += 0.1;
    cMaxZ -= 0.1;
    if (
      ((cMinX >= tMinX && cMinX <= tMaxX) ||
        (cMaxX >= tMinX && cMaxX <= tMaxX) ||
        (tMinX >= cMinX && tMinX <= cMaxX) ||
        (tMaxX >= cMinX && tMaxX <= cMaxX)) &&
      ((cMinZ >= tMinZ && cMinZ <= tMaxZ) ||
        (cMaxZ >= tMinZ && cMaxZ <= tMaxZ) ||
        (tMinZ >= cMinZ && tMinZ <= cMaxZ) ||
        (tMaxZ >= cMinZ && tMaxZ <= cMaxZ))
    ) {
      return true;
    }
    return false;
  };

  const checkCollision = (id: string, type: ObjectType, p: Vector3, wlx: number, wlz: number) => {
    if (wlx < 0.1 || wlz < 0.1) {
      invalidElementIdRef.current = id;
      return false;
    }

    for (const e of elementsOnWall) {
      if (e.id !== id) {
        const cMinX = p.x - wlx / 2; // current element left
        const cMaxX = p.x + wlx / 2; // current element right
        const cMinZ = p.z - wlz / 2; // current element bot
        const cMaxZ = p.z + wlz / 2; // current element up
        switch (e.type) {
          case ObjectType.Door:
          case ObjectType.Window: {
            const tMinX = e.cx * lx - (e.lx * lx) / 2; // target element left
            const tMaxX = e.cx * lx + (e.lx * lx) / 2; // target element right
            const tMinZ = e.cz * lz - (e.lz * lz) / 2; // target element bot
            const tMaxZ = e.cz * lz + (e.lz * lz) / 2; // target element up
            if (collisionHelper([tMinX, tMaxX, tMinZ, tMaxZ, cMinX, cMaxX, cMinZ, cMaxZ])) {
              invalidElementIdRef.current = id;
              return false;
            }
            break;
          }
          case ObjectType.SolarPanel: {
            const tMinX = e.cx * lx - e.lx / 2; // target element left
            const tMaxX = e.cx * lx + e.lx / 2; // target element right
            const tMinZ = e.cz * lz - e.ly / 2; // target element bot
            const tMaxZ = e.cz * lz + e.ly / 2; // target element up

            if (collisionHelper([tMinX, tMaxX, tMinZ, tMaxZ, cMinX, cMaxX, cMinZ, cMaxZ])) {
              invalidElementIdRef.current = id;
              return false;
            }
            break;
          }
        }
      }
    }
    invalidElementIdRef.current = null;

    return true; // no collision
  };

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const getPositionOnGrid = (p: Vector3) => {
    if (useStore.getState().enableFineGrid) {
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
      useStore.getState().addedWallId ||
      addedWindowIdRef.current ||
      useStore.getState().moveHandleType ||
      useStore.getState().resizeHandleType ||
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
    invalidElementIdRef.current = null;
    isSettingDoorStartPointRef.current = false;
    isSettingDoorEndPointRef.current = false;
  };

  const setElementPosDms = (id: string, pos: number[], dms: number[]) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          [e.cx, e.cy, e.cz] = pos;
          [e.lx, e.ly, e.lz] = dms;
          break;
        }
      }
    });
  };

  const handleUndoableAdd = (elem: ElementModel) => {
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
          state.deletedRoofId = null;
        });
      },
    } as UndoableAdd;
    addUndoable(undoableAdd);
  };

  const handleUndoableMove = (elem: ElementModel) => {
    const undoableMove = {
      name: 'Move',
      timestamp: Date.now(),
      movedElementId: elem.id,
      movedElementType: elem.type,
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

  const handleUndoableResize = (elem: ElementModel) => {
    switch (elem.type) {
      case ObjectType.Door:
      case ObjectType.Window:
      case ObjectType.SolarPanel:
        const undoableResize = {
          name: `Resize ${elem.type}`,
          timestamp: Date.now(),
          resizedElementId: elem.id,
          resizedElementType: elem.type,
          oldPosition: [...oldPositionRef.current],
          oldDimension: [...oldDimensionRef.current],
          newPosition: [elem.cx, elem.cy, elem.cz],
          newDimension: [elem.lx, elem.ly, elem.lz],
          undo: () => {
            setElementPosDms(undoableResize.resizedElementId, undoableResize.oldPosition, undoableResize.oldDimension);
          },
          redo: () => {
            setElementPosDms(undoableResize.resizedElementId, undoableResize.newPosition, undoableResize.newDimension);
          },
        } as UndoableResizeElementOnWall;
        addUndoable(undoableResize);
        break;
    }
  };

  const handleIntersectionPointerDown = (e: ThreeEvent<PointerEvent>) => {
    // return on right-click or not first wall
    if (e.button === 2 || useStore.getState().addedWallId || !checkIsFirstWall(e)) {
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

        // set door start point
        if (isSettingDoorStartPointRef.current) {
          useStoreRef.getState().setEnableOrbitController(false);
          setCommonStore((state) => {
            state.moveHandleType = null;
            state.resizeHandleType = ResizeHandleType.UpperRight;
            state.resizeAnchor.copy(pointer).setZ(-lz / 2);
          });
          isSettingDoorStartPointRef.current = false;
          isSettingDoorEndPointRef.current = true;
          return;
        }

        handleAddElement(pointer);

        const selectedElement = getSelectedElement();
        // a child of this wall is clicked
        if (selectedElement && selectedElement.parentId === id) {
          grabRef.current = selectedElement;
          if (useStore.getState().moveHandleType || useStore.getState().resizeHandleType) {
            setShowGrid(true);
            setOriginElements([...useStore.getState().elements]);
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
    if (invalidElementIdRef.current) {
      if (isSettingWindowEndPointRef.current) {
        setCommonStore((state) => {
          state.elements.pop();
        });
      } else {
        if (originElements) {
          setCommonStore((state) => {
            state.elements = [...originElements];
          });
        }
      }
      invalidElementIdRef.current = null;
      setOriginElements(null);
    }
    // add undo for valid operation
    else {
      const elem = getElementById(grabRef.current.id);
      if (elem) {
        if (useStore.getState().moveHandleType) {
          handleUndoableMove(elem);
        } else if (useStore.getState().resizeHandleType) {
          if (isSettingWindowEndPointRef.current || isSettingDoorEndPointRef.current) {
            handleUndoableAdd(elem);
          } else {
            handleUndoableResize(elem);
          }
        }
      }
    }

    setCommonStore((state) => {
      state.moveHandleType = null;
      state.resizeHandleType = null;
      state.addedWindowId = null;
      state.addedDoorId = null;
    });
    useStoreRef.getState().setEnableOrbitController(true);
    setShowGrid(false);
    resetCurrentState();
  };

  const handleIntersectionPointerMove = (e: ThreeEvent<PointerEvent>) => {
    // return if it's not first wall when adding new window
    if ((isSettingWindowStartPointRef.current || isSettingDoorStartPointRef.current) && !checkIsFirstWall(e)) {
      if (grabRef.current) {
        removeElementById(grabRef.current.id, false);
      }
      setCommonStore((state) => {
        if (isSettingWindowStartPointRef.current) {
          state.objectTypeToAdd = ObjectType.Window;
          state.addedWindowId = null;
        } else if (isSettingDoorStartPointRef.current) {
          state.objectTypeToAdd = ObjectType.Door;
          state.addedDoorId = null;
        }
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
          const moveHandleType = useStore.getState().moveHandleType;
          const resizeHandleType = useStore.getState().resizeHandleType;

          switch (grabRef.current.type) {
            case ObjectType.Window: {
              let p = getRelativePosOnWall(pointer, wallModel);
              if (moveHandleType) {
                const v = new Vector3((-grabRef.current.lx / 2) * lx, 0, (grabRef.current.lz / 2) * lz);
                p = getPositionOnGrid(p.clone().add(v)).sub(v);
                if (!isMovingElementInsideWall(p, grabRef.current.lx * lx, grabRef.current.lz * lz)) {
                  return;
                }
                checkCollision(
                  grabRef.current.id,
                  ObjectType.Window,
                  p,
                  grabRef.current.lx * lx,
                  grabRef.current.lz * lz,
                );
                setCommonStore((state) => {
                  for (const e of state.elements) {
                    if (e.id === grabRef.current?.id) {
                      e.cx = p.x / lx;
                      e.cz = p.z / lz;
                      e.cy = e.id === invalidElementIdRef.current ? -0.01 : 0.1;
                      (e as WindowModel).tint = e.id === invalidElementIdRef.current ? 'red' : '#73D8FF';
                    }
                  }
                });
              } else if (resizeHandleType) {
                p = getPositionOnGrid(p);
                if (!isPointInside(p.x, p.z)) {
                  return;
                }
                let resizeAnchor = getRelativePosOnWall(useStore.getState().resizeAnchor, wallModel);
                if (isSettingWindowEndPointRef.current) {
                  resizeAnchor = getPositionOnGrid(resizeAnchor);
                }
                const v = new Vector3().subVectors(resizeAnchor, p); // window diagonal vector
                let relativePos = new Vector3().addVectors(resizeAnchor, p).divideScalar(2);
                checkCollision(grabRef.current.id, ObjectType.Window, relativePos, Math.abs(v.x), Math.abs(v.z));
                setCommonStore((state) => {
                  for (const e of state.elements) {
                    if (e.id === grabRef.current?.id) {
                      e.lx = Math.abs(v.x) / lx;
                      e.lz = Math.abs(v.z) / lz;
                      e.cx = relativePos.x / lx;
                      e.cz = relativePos.z / lz;
                      e.cy = e.id === invalidElementIdRef.current ? -0.01 : 0.1;
                      (e as WindowModel).tint = e.id === invalidElementIdRef.current ? 'red' : '#73D8FF';
                    }
                  }
                });
              }
              break;
            }
            case ObjectType.Door: {
              let p = getRelativePosOnWall(pointer, wallModel);
              p = getPositionOnGrid(p);
              if (!isPointInside(p.x, p.z)) {
                return;
              }
              // adding door
              if (moveHandleType) {
                setCommonStore((state) => {
                  for (const e of state.elements) {
                    if (e.id === grabRef.current?.id) {
                      e.cx = p.x / lx;
                      e.cz = (p.z - lz / 2) / 2 / lz;
                      e.lz = (p.z + lz / 2) / lz;
                    }
                  }
                });
              } else if (resizeHandleType) {
                let resizeAnchor = getRelativePosOnWall(useStore.getState().resizeAnchor, wallModel);
                if (isSettingDoorEndPointRef.current) {
                  resizeAnchor = getPositionOnGrid(resizeAnchor);
                }
                const v = new Vector3().subVectors(resizeAnchor, p); // door diagonal vector
                let relativePos = new Vector3().addVectors(resizeAnchor, p).divideScalar(2);
                checkCollision(grabRef.current.id, ObjectType.Door, relativePos, Math.abs(v.x), Math.abs(v.z));
                setCommonStore((state) => {
                  for (const e of state.elements) {
                    if (e.id === grabRef.current?.id) {
                      e.cx = relativePos.x / lx;
                      e.lx = Math.abs(v.x) / lx;
                      e.cz = (p.z - lz / 2) / 2 / lz;
                      e.lz = (p.z + lz / 2) / lz;
                      e.color = e.id === invalidElementIdRef.current ? '#fe6f5e' : 'white';
                    }
                  }
                });
              }
              break;
            }
            case ObjectType.SolarPanel: {
              const pvModel = useStore.getState().getPvModule((grabRef.current as SolarPanelModel).pvModelName);
              let unitX = pvModel.width;
              let unitY = pvModel.length;
              if ((grabRef.current as SolarPanelModel).orientation === Orientation.landscape) {
                [unitX, unitY] = [unitY, unitX];
              }

              let p = getRelativePosOnWall(pointer, wallModel);
              if (moveHandleType) {
                const v = new Vector3(-grabRef.current.lx / 2, 0, grabRef.current.ly / 2);
                p = getPositionOnGrid(p.clone().add(v)).sub(v);
                if (!isMovingElementInsideWall(p, grabRef.current.lx, grabRef.current.ly)) {
                  return;
                }
                checkCollision(grabRef.current.id, ObjectType.SolarPanel, p, grabRef.current.lx, grabRef.current.ly);
                setCommonStore((state) => {
                  for (const e of state.elements) {
                    if (e.id === grabRef.current?.id) {
                      e.cx = p.x / lx;
                      e.cz = p.z / lz;
                      e.color = e.id === invalidElementIdRef.current ? 'red' : '#fff';
                    }
                  }
                });
              } else if (resizeHandleType) {
                const resizeAnchor = getRelativePosOnWall(useStore.getState().resizeAnchor, wallModel);
                setCommonStore((state) => {
                  for (const e of state.elements) {
                    if (e.id === grabRef.current?.id) {
                      if (
                        state.resizeHandleType === ResizeHandleType.Lower ||
                        state.resizeHandleType === ResizeHandleType.Upper
                      ) {
                        const ny = Math.max(1, Math.round(Math.abs(p.z - resizeAnchor.z) / unitY));
                        const length = ny * unitY;
                        const v = new Vector3(0, 0, p.z - resizeAnchor.z).normalize().multiplyScalar(length);
                        const c = new Vector3().addVectors(resizeAnchor, v.clone().divideScalar(2));
                        e.cz = c.z / lz;
                        e.ly = Math.abs(v.z);
                        checkCollision(grabRef.current.id, ObjectType.SolarPanel, c, e.lx, Math.abs(v.z));
                      } else if (
                        state.resizeHandleType === ResizeHandleType.Left ||
                        state.resizeHandleType === ResizeHandleType.Right
                      ) {
                        const nx = Math.max(1, Math.round(Math.abs(p.x - resizeAnchor.x) / unitX));
                        const length = nx * unitX;
                        const v = new Vector3(p.x - resizeAnchor.x, 0, 0).normalize().multiplyScalar(length);
                        const c = new Vector3().addVectors(resizeAnchor, v.clone().divideScalar(2));
                        e.cx = c.x / lx;
                        e.lx = Math.abs(v.x);
                        checkCollision(grabRef.current.id, ObjectType.SolarPanel, c, Math.abs(v.x), e.ly);
                      }
                      e.color = e.id === invalidElementIdRef.current ? 'red' : '#fff';
                    }
                  }
                });
              }
              break;
            }
            case ObjectType.Sensor: {
              break;
            }
          }
        }

        // add new element
        switch (useStore.getState().objectTypeToAdd) {
          case ObjectType.Window: {
            let relativePos = getRelativePosOnWall(pointer, wallModel);
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
          case ObjectType.Door: {
            const newDoor = ElementModelFactory.makeDoor(wallModel); //todo
            useStoreRef.getState().setEnableOrbitController(false);
            setCommonStore((state) => {
              state.objectTypeToAdd = ObjectType.None;
              state.elements.push(newDoor);
              state.moveHandleType = MoveHandleType.Mid;
              state.selectedElement = newDoor;
              state.addedDoorId = newDoor.id;
            });
            setShowGrid(true);
            grabRef.current = newDoor;
            isSettingDoorStartPointRef.current = true;
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
    if (grabRef.current && (isSettingDoorStartPointRef.current || isSettingWindowStartPointRef.current)) {
      setCommonStore((state) => {
        if (isSettingDoorStartPointRef.current) {
          state.objectTypeToAdd = ObjectType.Door;
          state.addedDoorId = null;
        }
        if (isSettingWindowStartPointRef.current) {
          state.objectTypeToAdd = ObjectType.Window;
          state.addedWindowId = null;
        }
      });
      removeElementById(grabRef.current!.id, false);
      setShowGrid(false);
      resetCurrentState();
    }
  };

  const handleWallBodyPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (useStore.getState().groupActionMode) {
      setCommonStore((state) => {
        for (const e of state.elements) {
          e.selected = e.id === parentId;
        }
        state.elementGroupId = parentId;
      });
      e.stopPropagation();
    } else {
      if (checkIfCanSelectMe(e)) {
        setCommonStore((state) => {
          state.contextMenuObjectType = null;
        });
        selectMe(id, e, ActionType.Select);
      }
      handleAddElement();
    }
  };

  const handleAddElement = (pointer?: Vector3) => {
    // add new elements
    if (parent && useStore.getState().objectTypeToAdd) {
      let newElement: ElementModel | null = null;
      switch (useStore.getState().objectTypeToAdd) {
        case ObjectType.PyramidRoof: {
          if (!roofId) {
            newElement = ElementModelFactory.makePyramidRoof([wallModel.id], parent, lz);
          }
          break;
        }
        case ObjectType.GableRoof: {
          if (!roofId) {
            newElement = ElementModelFactory.makeGableRoof([wallModel.id], parent, lz);
          }
          break;
        }
        case ObjectType.HipRoof: {
          if (!roofId) {
            newElement = ElementModelFactory.makeHipRoof([wallModel.id], parent, lz, lx / 2);
          }
          break;
        }
        case ObjectType.GambrelRoof: {
          if (!roofId) {
            newElement = ElementModelFactory.makeGambrelRoof([wallModel.id], parent, lz);
          }
          break;
        }
        case ObjectType.MansardRoof: {
          if (!roofId) {
            newElement = ElementModelFactory.makeMansardRoof([wallModel.id], parent, lz);
          }
          break;
        }
        case ObjectType.SolarPanel: {
          if (pointer) {
            const p = getRelativePosOnWall(pointer, wallModel);
            newElement = ElementModelFactory.makeSolarPanel(
              wallModel,
              useStore.getState().getPvModule('SPR-X21-335-BLK'),
              p.x / lx,
              0,
              p.z / lz,
              Orientation.landscape,
              new Vector3(0, -1, 0),
              [0, 0, 0],
              undefined,
              undefined,
              ObjectType.Wall,
            );
          }
          break;
        }
      }
      if (newElement) {
        handleUndoableAdd(newElement);
        setCommonStore((state) => {
          state.elements.push(newElement as ElementModel);
          if (newElement && newElement.type === ObjectType.Roof) {
            state.addedRoofId = newElement.id;
          }
          state.objectTypeToAdd = ObjectType.None;
        });
      }
    }
  };

  const handleContextMenu = (e: ThreeEvent<MouseEvent>, mesh: Mesh | null, canPaste?: boolean) => {
    if (grabRef.current) {
      return;
    }
    selectMe(id, e, ActionType.Select);
    setCommonStore((state) => {
      if (e.intersections.length > 0 && e.intersections[0].object === mesh) {
        state.contextMenuObjectType = ObjectType.Wall;
        if (canPaste) {
          state.pastePoint.copy(e.intersections[0].point);
        }
      }
    });
  };

  const handleStudPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.intersections.length === 0 || e.intersections[0].object !== e.eventObject) return;
    if (useStore.getState().groupActionMode) {
      setCommonStore((state) => {
        for (const e of state.elements) {
          e.selected = e.id === parentId;
        }
        state.elementGroupId = parentId;
      });
    } else {
      if (checkIfCanSelectMe(e)) {
        setCommonStore((state) => {
          state.contextMenuObjectType = null;
        });
        selectMe(id, e, ActionType.Select);
      }
      handleAddElement();
      e.stopPropagation();
    }
  };

  const handleStudContextMenu = (e: ThreeEvent<MouseEvent>) => {
    if (e.intersections.length > 0 && e.intersections[0].object === e.eventObject) {
      setCommonStore((state) => {
        state.contextMenuObjectType = ObjectType.Wall;
      });
      selectMe(id, e, ActionType.Select);
      e.stopPropagation();
    }
  };

  const studs = useMemo(() => {
    const arr: number[] = [];
    if (wallStructure === WallStructure.Stud) {
      let pos = -hx + studWidth / 2;
      while (pos <= hx) {
        arr.push(pos);
        pos += studSpacing;
      }
    }
    arr.push(hx - studWidth / 2);
    return arr;
  }, [wallStructure, studWidth, studSpacing, lx, ly, lz]);

  const castShadow = shadowEnabled && !transparent;

  const wallStuds = () => {
    const wallLeftHeight = leftRoofHeight ?? lz;
    const wallRightHeight = rightRoofHeight ?? lz;
    let [wallCenterPos, wallCenterHeight] = centerRoofHeight ?? [0, (wallLeftHeight + wallRightHeight) / 2];
    wallCenterPos = wallCenterPos * lx;

    const leftX = wallCenterPos + hx;
    const leftLength = Math.hypot(leftX, wallCenterHeight - wallLeftHeight);
    const leftRotationY = -Math.atan2(wallCenterHeight - wallLeftHeight, leftX);

    const rightX = hx - wallCenterPos;
    const rightLength = Math.hypot(rightX, wallRightHeight - wallCenterHeight);
    const rightRotationY = -Math.atan2(wallRightHeight - wallCenterHeight, rightX);

    return (
      <group name={`wall stud group ${id}`}>
        {studs.map((pos, idx) => {
          let height;
          if (pos < wallCenterPos) {
            height = ((pos + hx) * (wallCenterHeight - wallLeftHeight)) / (wallCenterPos + hx) + wallLeftHeight;
          } else {
            height = ((pos - hx) * (wallCenterHeight - wallRightHeight)) / (wallCenterPos - hx) + wallRightHeight;
          }

          return (
            <Box
              key={idx}
              args={[studWidth, ly, height]}
              position={[pos, hy, (height - lz) / 2]}
              castShadow={shadowEnabled}
              receiveShadow={shadowEnabled}
              onContextMenu={handleStudContextMenu}
              onPointerDown={handleStudPointerDown}
            >
              <meshStandardMaterial color={studColor} />
            </Box>
          );
        })}
        <Box
          args={[leftLength, ly, studWidth]}
          position={[-hx + leftX / 2, hy, (wallLeftHeight + wallCenterHeight) / 2 - hz - studWidth / 2]}
          rotation={[0, leftRotationY, 0]}
          castShadow={shadowEnabled}
          receiveShadow={shadowEnabled}
          onContextMenu={handleStudContextMenu}
          onPointerDown={handleStudPointerDown}
        >
          <meshStandardMaterial color={studColor} />
        </Box>
        <Box
          args={[rightLength, ly, studWidth]}
          position={[hx - rightX / 2, hy, (wallRightHeight + wallCenterHeight) / 2 - hz - studWidth / 2]}
          rotation={[0, rightRotationY, 0]}
          castShadow={shadowEnabled}
          receiveShadow={shadowEnabled}
          onContextMenu={handleStudContextMenu}
          onPointerDown={handleStudPointerDown}
        >
          <meshStandardMaterial color={studColor} />
        </Box>
      </group>
    );
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
          {(opacity > 0 || wallStructure === WallStructure.Default) && (
            <>
              {/* outside wall */}
              <mesh
                name={'Outside Wall'}
                uuid={id}
                userData={{ simulation: true }}
                ref={outsideWallRef}
                rotation={[HALF_PI, 0, 0]}
                castShadow={castShadow}
                receiveShadow={shadowEnabled}
                onContextMenu={(e) => {
                  handleContextMenu(e, outsideWallRef.current, true);
                }}
                onPointerDown={handleWallBodyPointerDown}
              >
                <shapeBufferGeometry args={[outsiedWallShape]} />
                <meshStandardMaterial
                  color={textureType === WallTexture.Default || textureType === WallTexture.NoTexture ? color : 'white'}
                  map={texture}
                  transparent={transparent}
                  opacity={opacity}
                />
              </mesh>

              <mesh rotation={[HALF_PI, 0, 0]} position={[0, 0.05, 0]} castShadow={castShadow} scale={[0.95, 1, 1]}>
                <shapeBufferGeometry args={[outsiedWallShape]} />
                <meshStandardMaterial color={'white'} side={BackSide} transparent={transparent} opacity={opacity} />
              </mesh>

              {/* inside wall */}
              <mesh
                name={'Inside Wall'}
                ref={insideWallRef}
                position={[0, ly, 0]}
                rotation={[HALF_PI, 0, 0]}
                castShadow={castShadow}
                receiveShadow={shadowEnabled}
                onPointerDown={handleWallBodyPointerDown}
                onContextMenu={(e) => {
                  handleContextMenu(e, insideWallRef.current);
                }}
              >
                <shapeBufferGeometry args={[insideWallShape]} />
                <meshStandardMaterial
                  color={transparent ? color : 'white'}
                  transparent={transparent}
                  opacity={opacity}
                  side={DoubleSide}
                />
              </mesh>

              {/* top surface */}
              {!roofId && (
                <mesh
                  name={'Top Wall'}
                  ref={topSurfaceRef}
                  material={whiteMaterialDouble}
                  position={[0, hy, hz]}
                  castShadow={castShadow}
                  receiveShadow={shadowEnabled}
                  onPointerDown={handleWallBodyPointerDown}
                  onContextMenu={(e) => {
                    handleContextMenu(e, topSurfaceRef.current);
                  }}
                >
                  <shapeBufferGeometry args={[topWallShape]} />
                </mesh>
              )}

              {/* side surfaces */}
              {leftOffset === 0 && (
                <Plane
                  args={[leftRoofHeight ?? lz, ly]}
                  material={whiteMaterialDouble}
                  position={[-hx + 0.01, hy, -(lz - (leftRoofHeight ?? lz)) / 2]}
                  rotation={[0, HALF_PI, 0]}
                  castShadow={castShadow}
                  receiveShadow={shadowEnabled}
                  onPointerDown={handleWallBodyPointerDown}
                />
              )}
              {rightOffset === 0 && (
                <Plane
                  args={[rightRoofHeight ?? lz, ly]}
                  material={whiteMaterialDouble}
                  position={[hx - 0.01, hy, -(lz - (rightRoofHeight ?? lz)) / 2]}
                  rotation={[0, HALF_PI, 0]}
                  castShadow={castShadow}
                  receiveShadow={shadowEnabled}
                  onPointerDown={handleWallBodyPointerDown}
                />
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
                <shapeBufferGeometry args={[intersectionPlaneShape]} />
                <meshBasicMaterial />
              </mesh>

              {elementsOnWall.map((e) => {
                switch (e.type) {
                  case ObjectType.Window:
                    return <Window key={e.id} {...(e as WindowModel)} />;
                  case ObjectType.Door:
                    return <Door key={e.id} {...(e as DoorModel)} />;
                  case ObjectType.SolarPanel:
                    let r = 0;
                    if (parent && wallModel) {
                      r = parent.rotation[2] + wallModel.relativeAngle;
                    }
                    return (
                      <group key={e.id} position={[0, -e.lz / 2, 0]}>
                        <SolarPanelOnWall {...(e as SolarPanelModel)} cx={e.cx * lx} cz={e.cz * lz} absRotation={r} />
                      </group>
                    );
                }
              })}
            </>
          )}

          {wallStructure === WallStructure.Stud && wallStuds()}

          {/* wireFrame */}
          {(wallStructure === WallStructure.Default || (locked && selected)) && (
            <WallWireFrame
              lineColor={selected && locked ? LOCKED_ELEMENT_SELECTION_COLOR : lineColor}
              lineWidth={selected && locked ? 2 : lineWidth}
              x={hx}
              z={hz}
              leftHeight={leftRoofHeight}
              rightHeight={rightRoofHeight}
              center={centerRoofHeight}
              centerLeft={centerLeftRoofHeight}
              centerRight={centerRightRoofHeight}
            />
          )}

          {/* handles */}
          {selected && !locked && <WallResizeHandleWarpper x={hx} z={hz} id={id} highLight={highLight} />}
          {selected && !locked && lx > 0.5 && <WallMoveHandleWarpper ply={ly} phz={hz} />}

          {/* grid */}
          {showGrid && (useStore.getState().moveHandleType || useStore.getState().resizeHandleType) && (
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
