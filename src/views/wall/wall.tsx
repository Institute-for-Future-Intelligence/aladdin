/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackSide,
  CanvasTexture,
  DoubleSide,
  Euler,
  FrontSide,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Raycaster,
  RepeatWrapping,
  Shape,
  Vector2,
  Vector3,
} from 'three';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { Box, Cone, Cylinder, Line, Plane } from '@react-three/drei';
import { ActionType, MoveHandleType, ObjectType, Orientation, ResizeHandleType, WallTexture } from 'src/types';
import { Util } from 'src/Util';
import { useStore } from 'src/stores/common';
import { useRefStore } from 'src/stores/commonRef';
import { ElementModel } from 'src/models/ElementModel';
import { WindowModel, WindowType } from 'src/models/WindowModel';
import { WallFill, WallModel, WallStructure } from 'src/models/WallModel';
import { ElementModelFactory } from 'src/models/ElementModelFactory';
import { Point2 } from 'src/models/Point2';
import { ElementGrid } from '../elementGrid';
import Window, { WINDOW_GROUP_NAME } from '../window/window';
import WallWireFrame from './wallWireFrame';
import * as Selector from 'src/stores/selector';
import { UndoableAdd } from 'src/undo/UndoableAdd';
import { UndoableResizeElementOnWall } from 'src/undo/UndoableResize';
import { DoorModel, DoorType } from 'src/models/DoorModel';
import Door from '../door/door';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import SolarPanelOnWall from '../solarPanel/solarPanelOnWall';
import { useElements, useWallTexture } from './hooks';
import { FoundationModel } from 'src/models/FoundationModel';
import { HorizontalRuler } from '../horizontalRuler';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { useDataStore } from '../../stores/commonData';
import { showError } from 'src/helpers';
import i18n from 'src/i18n/i18n';
import { RoofUtil } from '../roof/RoofUtil';
import {
  DEFAULT_HEAT_FLUX_COLOR,
  DEFAULT_HEAT_FLUX_DENSITY_FACTOR,
  DEFAULT_HEAT_FLUX_SCALE_FACTOR,
  DEFAULT_HEAT_FLUX_WIDTH,
  FINE_GRID_SCALE,
  HALF_PI,
  INVALID_ELEMENT_COLOR,
  LOCKED_ELEMENT_SELECTION_COLOR,
  NORMAL_GRID_SCALE,
  UNIT_VECTOR_POS_Y,
  UNIT_VECTOR_POS_Z,
} from 'src/constants';
import { PolygonModel } from '../../models/PolygonModel';
import Polygon from '../polygon';
import { SharedUtil } from '../SharedUtil';
import { UndoableChange } from '../../undo/UndoableChange';
import Parapet, { DEFAULT_PARAPET_SETTINGS } from './parapet';
import { RoofModel } from 'src/models/RoofModel';

export const WALL_BLOCK_PLANE = 'Wall Block Plane';

export const WALL_INTERSECTION_PLANE_NAME = 'Wall Intersection Plane';

export const WALL_PADDING = 0.1;
export interface WallProps {
  wallModel: WallModel;
  foundationModel: FoundationModel;
}

const PERPENDICULAR_THRESHOLD = 0.087; // 5 degree

enum ElBeingAddedStatus {
  SettingStartPoint,
  SettingEndPoint,
}

type ElBeingAdded = {
  id: string;
  type: ObjectType;
  status: ElBeingAddedStatus;
};

type BoundedPointerOptions = {
  elementHalfSize?: number[];
  ignorePadding?: boolean;
  resizeAnchor?: Vector3;
};

const Wall = ({ wallModel, foundationModel }: WallProps) => {
  let {
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
    color = 'white',
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
    structureSpacing = 2,
    structureWidth = 0.1,
    structureColor = 'white',
    opacity = 0.5,
    fill = WallFill.Full,
    unfilledHeight = 0.5,
    parapet = DEFAULT_PARAPET_SETTINGS,
    leftPoint,
    rightPoint,
  } = wallModel;

  leftRoofHeight = leftJoints.length > 0 ? leftRoofHeight : lz;
  rightRoofHeight = rightJoints.length > 0 ? rightRoofHeight : lz;

  const texture = useWallTexture(textureType);

  // common store
  const setCommonStore = useStore(Selector.set);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const selectMe = useStore(Selector.selectMe);
  const addUndoable = useStore(Selector.addUndoable);
  const isAddingElement = useStore(Selector.isAddingElement);
  const getHeatmap = useDataStore(Selector.getHeatmap);
  const updatePolygonVerticesById = useStore(Selector.updatePolygonVerticesById);

  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const sunlightDirection = useStore(Selector.sunlightDirection);
  const deletedRoofId = useStore(Selector.deletedRoofId);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const roofRise = useStore((state) => {
    if (!roofId) return 0;
    const roof = state.elements.find((e) => e.id === roofId) as RoofModel;
    if (!roof) return 0;
    return roof.rise;
  });

  // primitive store
  const setPrimitiveStore = usePrimitiveStore(Selector.setPrimitiveStore);
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const elementBeingCanceledId = usePrimitiveStore((state) => state.elementBeingCanceledId);
  const showWallIntersectionPlaneId = usePrimitiveStore((state) => state.showWallIntersectionPlaneId);

  // state
  const [showIntersectionPlane, setShowIntersectionPlane] = useState(false);
  const [heatmapTexture, setHeatmapTexture] = useState<CanvasTexture | null>(null);

  // hooks
  const { camera, gl, invalidate } = useThree();
  const { elementsOnWall, leftWall, rightWall } = useElements(id, leftJoints[0], rightJoints[0]);

  // object ref
  const outsideWallRef = useRef<Mesh>(null);
  const insideWallRef = useRef<Mesh>(null);
  const topSurfaceRef = useRef<Mesh>(null);
  const intersectionPlaneRef = useRef<Mesh>(null);

  // variables
  const grabRef = useRef<ElementModel | null>(null);
  const addedWindowIdRef = useRef<string | null>(null);
  const invalidElementIdRef = useRef<string | null>(null);
  const elBeingAddedRef = useRef<ElBeingAdded | null>(null);

  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;
  const wallAbsAngle = foundationModel ? foundationModel.rotation[2] + relativeAngle : relativeAngle;
  const leftOffset = Util.getInnerWallOffset(leftWall, lx, ly, relativeAngle, 'left');
  const rightOffset = Util.getInnerWallOffset(rightWall, lx, ly, relativeAngle, 'right');
  const transparent = wallStructure === WallStructure.Stud || wallStructure === WallStructure.Pillar;
  const night = sunlightDirection.z <= 0;
  const wallLeftHeight = leftRoofHeight ?? lz;
  const wallRightHeight = rightRoofHeight ?? lz;
  const realUnfilledHeight = fill === WallFill.Partial ? unfilledHeight : 0;
  const bottomZ = -hz + realUnfilledHeight;
  const castShadow = shadowEnabled && !transparent;
  const showParapet = isShowParapet();
  const parapetZ = Math.max(wallLeftHeight, wallRightHeight);

  const mouse = useMemo(() => new Vector2(), []);
  const ray = useMemo(() => new Raycaster(), []);

  const whiteMaterialDouble = useMemo(
    () => new MeshStandardMaterial({ color: 'white', side: DoubleSide, transparent: transparent, opacity: opacity }),
    [transparent, opacity],
  );

  const zmax = useMemo(() => {
    return Util.getHighestPointOfWall(wallModel);
  }, [
    wallModel.lz,
    wallModel.leftRoofHeight,
    wallModel.rightRoofHeight,
    wallModel.centerRoofHeight,
    wallModel.centerLeftRoofHeight,
    wallModel.centerRightRoofHeight,
  ]);

  const outsideWallShape = useMemo(() => {
    const wallShape = new Shape();
    drawWallShape(wallShape, lx, lz, 0, 0, 0, 0);

    elementsOnWall.forEach((e) => {
      if (e.type === ObjectType.Window && e.id !== invalidElementIdRef.current && e.lx > 0 && e.lz > 0) {
        const window = e as WindowModel;
        const windowShape = new Shape();
        const [wlx, wly, wcx, wcy] = [e.lx * lx, e.lz * lz, e.cx * lx, e.cz * lz];
        // old files don't have windowType
        if (window.windowType) {
          switch (window.windowType) {
            case WindowType.Default:
              drawRectWindow(windowShape, wlx, wly, wcx, wcy);
              break;
            case WindowType.Arched:
              drawArchWindow(windowShape, wlx, wly, wcx, wcy, window.archHeight);
              break;
          }
        } else {
          drawRectWindow(windowShape, wlx, wly, wcx, wcy);
        }
        wallShape.holes.push(windowShape);
      }
    });

    return wallShape;
  }, [
    lx,
    lz,
    fill,
    unfilledHeight,
    elementsOnWall,
    leftRoofHeight,
    rightRoofHeight,
    centerRoofHeight,
    centerLeftRoofHeight,
    centerRightRoofHeight,
  ]);

  const insideWallShape = useMemo(() => {
    const wallShape = new Shape();
    drawWallShape(wallShape, lx, lz, 0, 0, leftOffset, rightOffset);

    elementsOnWall.forEach((w) => {
      if (w.type === ObjectType.Window && w.id !== invalidElementIdRef.current && w.lx > 0 && w.lz > 0) {
        const window = w as WindowModel;
        const windowShape = new Shape();
        const [wlx, wly, wcx, wcy] = [w.lx * lx, w.lz * lz, w.cx * lx, w.cz * lz];
        // old files don't have windowType
        if (window.windowType) {
          switch (window.windowType) {
            case WindowType.Default:
              drawRectWindow(windowShape, wlx, wly, wcx, wcy);
              break;
            case WindowType.Arched:
              drawArchWindow(windowShape, wlx, wly, wcx, wcy, window.archHeight);
              break;
          }
        } else {
          drawRectWindow(windowShape, wlx, wly, wcx, wcy);
        }
        wallShape.holes.push(windowShape);
      }
    });
    return wallShape;
  }, [
    lx,
    lz,
    fill,
    unfilledHeight,
    leftOffset,
    rightOffset,
    elementsOnWall,
    leftRoofHeight,
    rightRoofHeight,
    centerRoofHeight,
    centerLeftRoofHeight,
    centerRightRoofHeight,
  ]);

  const topWallShape = useMemo(() => {
    const shape = new Shape();
    drawTopSurface(shape, lx, ly, leftOffset, rightOffset);
    return shape;
  }, [lx, ly, leftOffset, rightOffset]);

  const outerWallPoints2D = useMemo(() => {
    const points: Point2[] = [];
    const x = lx / 2;
    const y = lz / 2;
    if (fill === WallFill.Partial) {
      points.push({ x: -x + leftOffset, y: -y + unfilledHeight });
      points.push({ x: x - rightOffset, y: -y + unfilledHeight });
    } else {
      points.push({ x: -x, y: -y });
      points.push({ x: x, y: -y });
    }
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
  }, [
    lx,
    lz,
    fill,
    unfilledHeight,
    leftRoofHeight,
    rightRoofHeight,
    centerRoofHeight,
    centerLeftRoofHeight,
    centerRightRoofHeight,
  ]);

  const structureUnitArray = useMemo(() => {
    const arr: number[] = [];
    if (wallStructure === WallStructure.Stud) {
      let pos = -hx + structureWidth / 2;
      while (pos <= hx) {
        arr.push(pos);
        pos += structureSpacing;
      }
      arr.push(hx - structureWidth / 2);
    } else if (wallStructure === WallStructure.Pillar) {
      let pos = -hx;
      while (pos <= hx) {
        arr.push(pos);
        pos += structureSpacing;
      }
      arr.push(hx);
    }

    return arr;
  }, [wallStructure, structureWidth, structureSpacing, lx, ly, lz]);

  // parapet
  const wallDataToParapet = useMemo(() => ({ cx, cy, hx, hy, angle: relativeAngle }), [cx, cy, hx, hy, relativeAngle]);

  const currWallPointDataToParapet = useMemo(
    () => ({
      leftPoint,
      rightPoint,
      ly,
      copingsWidth: parapet.copingsWidth,
    }),
    [leftPoint, rightPoint, ly, parapet.copingsWidth],
  );

  const leftWallPointDataToParapet = useMemo(() => {
    if (!leftWall || !leftWall.parapet || !leftWall.parapet.display) return null;
    return {
      leftPoint: leftWall.leftPoint,
      rightPoint: leftWall.rightPoint,
      ly: leftWall.ly,
      copingsWidth: leftWall.parapet.copingsWidth,
    };
  }, [
    leftWall?.leftPoint,
    leftWall?.rightPoint,
    leftWall?.ly,
    leftWall?.parapet?.copingsWidth,
    leftWall?.parapet?.display,
  ]);

  const rightWallPointDataToParapet = useMemo(() => {
    if (!rightWall || !rightWall.parapet || !rightWall.parapet.display) return null;
    return {
      leftPoint: rightWall.leftPoint,
      rightPoint: rightWall.rightPoint,
      ly: rightWall.ly,
      copingsWidth: rightWall.parapet.copingsWidth,
    };
  }, [
    rightWall?.leftPoint,
    rightWall?.rightPoint,
    rightWall?.ly,
    rightWall?.parapet?.copingsWidth,
    rightWall?.parapet?.display,
  ]);

  // effects
  useEffect(() => {
    if (elBeingAddedRef.current && elBeingAddedRef.current.id === elementBeingCanceledId) {
      elBeingAddedRef.current = null;
      resetBeingAddedChildId();
    }
  }, [elementBeingCanceledId]);

  useEffect(() => {
    if (wallModel && showSolarRadiationHeatmap) {
      const heatmap = getHeatmap(wallModel.id);
      if (heatmap) {
        const t = Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5);
        if (t) {
          t.wrapS = RepeatWrapping;
          t.wrapT = RepeatWrapping;
          const shiftZ = lz === zmax ? 0 : (1 - lz / zmax) / 2;
          t.offset.set(-lx / 2, -zmax / 2 - shiftZ);
          t.center.set(lx / 2, zmax / 2);
          t.repeat.set(1 / lx, 1 / zmax);
          setHeatmapTexture(t);
        }
      }
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue]);

  useEffect(() => {
    if (deletedRoofId === roofId) {
      useStore.getState().set((state) => {
        const invalidateIdSet = new Set<string>();

        for (const e of state.elements) {
          if (e.id === id && e.type === ObjectType.Wall) {
            const wall = e as WallModel;
            wall.roofId = null;
            wall.leftRoofHeight = undefined;
            wall.rightRoofHeight = undefined;
            wall.centerRoofHeight = undefined;
            wall.centerLeftRoofHeight = undefined;
            wall.centerRightRoofHeight = undefined;

            if (elementsOnWall.length > 0) {
              const wallPoints = RoofUtil.getWallPoints2D(wall);
              elementsOnWall.forEach((e) => {
                const isSolarPanel = e.type === ObjectType.SolarPanel;
                const eLx = isSolarPanel ? e.lx - 0.01 : e.lx * lx;
                const eLz = isSolarPanel ? e.ly - 0.01 : e.lz * lz;
                const center = new Vector3(e.cx * lx, 0, e.cz * lz);
                if (!Util.isElementInsideWall(center, eLx, eLz, wallPoints)) {
                  invalidateIdSet.add(e.id);
                }
              });
            }
            break;
          }
        }
        if (invalidateIdSet.size > 0) {
          state.elements = state.elements.filter((e) => !invalidateIdSet.has(e.id));
        }
      });
    }
  }, [deletedRoofId]);

  function isShowParapet() {
    if (!roofId) return true;
    if (leftRoofHeight === undefined && rightRoofHeight === undefined) {
      return Math.abs(roofRise) < 0.01;
    }
    if (leftRoofHeight !== undefined && rightRoofHeight !== undefined) {
      return Math.abs(roofRise) < 0.01 && Math.abs(leftRoofHeight - rightRoofHeight) < 0.01;
    }
    return false;
  }

  function drawWallShape(
    shape: Shape,
    lx: number,
    ly: number,
    cx = 0,
    cy = 0,
    leftOffset = 0,
    rightOffset = 0,
    drawDoorShape = true,
  ) {
    const hx = lx / 2;
    const hy = ly / 2;

    if (fill === WallFill.Partial) {
      shape.moveTo(cx - hx + leftOffset, cy - hy + unfilledHeight); // lower left
      shape.lineTo(cx + hx - rightOffset, cy - hy + unfilledHeight); // lower right
    } else {
      shape.moveTo(cx - hx + leftOffset, cy - hy); // lower left
      if (drawDoorShape) {
        const doors = elementsOnWall
          .filter((e) => e.type === ObjectType.Door)
          .sort((a, b) => a.cx - b.cx) as DoorModel[];
        for (const door of doors) {
          if (door.id !== invalidElementIdRef.current) {
            const [dcx, dcy, dlx, dly] = [door.cx * lx, door.cz * ly, door.lx * lx, door.lz * lz];
            if (door.doorType === DoorType.Default) {
              shape.lineTo(cx + dcx - dlx / 2, cy - hy);
              shape.lineTo(cx + dcx - dlx / 2, cy - hy + dly);
              shape.lineTo(cx + dcx + dlx / 2, cy - hy + dly);
              shape.lineTo(cx + dcx + dlx / 2, cy - hy);
            } else {
              const ah = Math.min(door.archHeight, dly, dlx / 2);
              shape.lineTo(cx + dcx - dlx / 2, cy - hy);
              if (ah > 0.1) {
                shape.lineTo(cx + dcx - dlx / 2, cy - hy + dly / 2 - ah);
                const r = ah / 2 + dlx ** 2 / (8 * ah);
                const [cX, cY] = [dcx, cy + dcy + dly / 2 - r];
                const endAngle = Math.acos(Math.min(dlx / 2 / r, 1));
                const startAngle = Math.PI - endAngle;
                shape.absarc(cX, cY, r, startAngle, endAngle, true);
              } else {
                shape.lineTo(cx + dcx - dlx / 2, cy - hy + dly);
                shape.lineTo(cx + dcx + dlx / 2, cy - hy + dly);
              }
              shape.lineTo(cx + dcx + dlx / 2, cy - hy);
            }
          }
        }
      }
      shape.lineTo(cx + hx - rightOffset, cy - hy); // lower right
    }

    if (roofId) {
      if (rightRoofHeight) {
        shape.lineTo(cx + hx - rightOffset, rightRoofHeight - hy);
      } else {
        shape.lineTo(cx + hx - rightOffset, cy + hy); // upper right
      }
      centerRightRoofHeight && shape.lineTo(centerRightRoofHeight[0] * lx, centerRightRoofHeight[1] - hy);
      centerRoofHeight && shape.lineTo(centerRoofHeight[0] * lx, centerRoofHeight[1] - hy);
      centerLeftRoofHeight && shape.lineTo(centerLeftRoofHeight[0] * lx, centerLeftRoofHeight[1] - hy);
      if (leftRoofHeight) {
        shape.lineTo(cx - hx + leftOffset, leftRoofHeight - hy);
      } else {
        shape.lineTo(cx - hx + leftOffset, cy + hy); // upper left
      }
    } else {
      shape.lineTo(cx + hx - rightOffset, cy + hy); // upper right
      shape.lineTo(cx - hx + leftOffset, cy + hy); // upper left
    }

    shape.closePath();
  }

  function getRelativePosOnWall(p: Vector3, wall: WallModel) {
    const { cx, cy, cz } = wall;
    if (foundationModel && wallAbsAngle !== undefined) {
      const wallAbsPos = Util.wallAbsolutePosition(new Vector3(cx, cy, cz), foundationModel).setZ(
        lz / 2 + foundationModel.lz,
      );
      return new Vector3().subVectors(p, wallAbsPos).applyEuler(new Euler(0, 0, -wallAbsAngle));
    }
    return new Vector3();
  }

  function checkCollision(id: string, p: Vector3, elx: number, elz: number) {
    if (elx < 0.1 || elz < 0.1) {
      invalidElementIdRef.current = id;
      return false;
    }

    if (elx > lx || (!roofId && elz > lz)) {
      invalidElementIdRef.current = id;
      return false;
    }

    for (const e of elementsOnWall) {
      if (e.type === ObjectType.Polygon) continue;
      if (e.id !== id) {
        const cMinX = p.x - elx / 2; // current element left
        const cMaxX = p.x + elx / 2; // current element right
        const cMinZ = p.z - elz / 2; // current element bot
        const cMaxZ = p.z + elz / 2; // current element up
        switch (e.type) {
          case ObjectType.Door:
          case ObjectType.Window: {
            const tMinX = e.cx * lx - (e.lx * lx) / 2; // target element left
            const tMaxX = e.cx * lx + (e.lx * lx) / 2; // target element right
            const tMinZ = e.cz * lz - (e.lz * lz) / 2; // target element bot
            const tMaxZ = e.cz * lz + (e.lz * lz) / 2; // target element up
            if (collisionHelper([tMinX, tMaxX, tMinZ, tMaxZ, cMinX, cMaxX, cMinZ, cMaxZ], -0.05)) {
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
            if (collisionHelper([tMinX, tMaxX, tMinZ, tMaxZ, cMinX, cMaxX, cMinZ, cMaxZ], 0.1)) {
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
  }

  function checkOutsideBoundary(id: string, center: Vector3, eLx: number, eLz: number) {
    if (!Util.isElementInsideWall(center, eLx, eLz, outerWallPoints2D)) {
      invalidElementIdRef.current = id;
    }
  }

  function setRayCast(e: PointerEvent) {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  }

  function checkIfCanSelectMe(e: ThreeEvent<PointerEvent>) {
    return !(
      e.button === 2 ||
      useStore.getState().addedWallId ||
      addedWindowIdRef.current ||
      useStore.getState().moveHandleType ||
      useStore.getState().resizeHandleType ||
      useStore.getState().objectTypeToAdd !== ObjectType.None ||
      selected ||
      isAddingElement()
    );
  }

  function drawTopSurface(shape: Shape, lx: number, ly: number, leftOffset: number, rightOffset: number) {
    const x = lx / 2;
    const y = ly / 2;
    shape.moveTo(-x, -y);
    shape.lineTo(x, -y);
    shape.lineTo(x - rightOffset, y);
    shape.lineTo(-x + leftOffset, y);
    shape.closePath();
  }

  function drawRectWindow(shape: Shape, lx: number, ly: number, cx = 0, cy = 0) {
    const x = lx / 2;
    const y = ly / 2;
    shape.moveTo(cx - x, cy - y);
    shape.lineTo(cx + x, cy - y);
    shape.lineTo(cx + x, cy + y);
    shape.lineTo(cx - x, cy + y);
    shape.closePath();
  }

  function drawArchWindow(shape: Shape, lx: number, ly: number, cx: number, cy: number, archHeight = 0) {
    const hx = lx / 2;
    const hy = ly / 2;
    const ah = Math.min(archHeight, ly, hx);

    shape.moveTo(cx - hx, cy - hy);
    shape.lineTo(cx + hx, cy - hy);
    shape.lineTo(cx + hx, cy + hy - ah);

    if (ah > 0) {
      const r = ah / 2 + lx ** 2 / (8 * ah);
      const [cX, cY] = [cx, cy + hy - r];
      const startAngle = Math.acos(Math.min(1, hx / r));
      const endAngle = Math.PI - startAngle;
      shape.absarc(cX, cY, r, startAngle, endAngle, false);
    } else {
      shape.lineTo(cx - hx, cy + hy);
    }

    shape.closePath();
  }

  function snapToNormalGrid(v: Vector3) {
    const x = parseFloat((Math.round(v.x / NORMAL_GRID_SCALE) * NORMAL_GRID_SCALE).toFixed(1));
    const z = parseFloat((Math.round(v.z / NORMAL_GRID_SCALE) * NORMAL_GRID_SCALE).toFixed(1));
    return new Vector3(x, v.y, z);
  }

  function snapToFineGrid(v: Vector3) {
    const x = parseFloat((Math.round(v.x / FINE_GRID_SCALE) * FINE_GRID_SCALE).toFixed(1));
    const z = parseFloat((Math.round(v.z / FINE_GRID_SCALE) * FINE_GRID_SCALE).toFixed(1));
    return new Vector3(x, v.y, z);
  }

  function getPositionOnGrid(p: Vector3) {
    if (useStore.getState().enableFineGrid) {
      p = snapToFineGrid(p);
    } else {
      p = snapToNormalGrid(p);
    }
    return p;
  }

  function collisionHelper(args: number[], tolerance = 0) {
    let [tMinX, tMaxX, tMinZ, tMaxZ, cMinX, cMaxX, cMinZ, cMaxZ] = args;
    cMinX += tolerance;
    cMaxX -= tolerance;
    cMinZ += tolerance;
    cMaxZ -= tolerance;
    return (
      ((cMinX >= tMinX && cMinX <= tMaxX) ||
        (cMaxX >= tMinX && cMaxX <= tMaxX) ||
        (tMinX >= cMinX && tMinX <= cMaxX) ||
        (tMaxX >= cMinX && tMaxX <= cMaxX)) &&
      ((cMinZ >= tMinZ && cMinZ <= tMaxZ) ||
        (cMaxZ >= tMinZ && cMaxZ <= tMaxZ) ||
        (tMinZ >= cMinZ && tMinZ <= cMaxZ) ||
        (tMaxZ >= cMinZ && tMaxZ <= cMaxZ))
    );
  }

  function checkPerpendicular(leftWall: WallModel, rightWall: WallModel) {
    // from right point to left point
    const vLeft = new Vector3().subVectors(
      new Vector3().fromArray(leftWall.leftPoint).setZ(0),
      new Vector3().fromArray(leftWall.rightPoint).setZ(0),
    );
    const vRight = new Vector3().subVectors(
      new Vector3().fromArray(rightWall.rightPoint).setZ(0),
      new Vector3().fromArray(rightWall.leftPoint).setZ(0),
    );
    const angle = vRight.angleTo(vLeft);
    return Math.abs(angle - Math.PI / 2) < PERPENDICULAR_THRESHOLD;
  }

  function setElementPosDms(id: string, pos: number[], dms: number[], archHeight?: number) {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          [e.cx, e.cy, e.cz] = pos;
          [e.lx, e.ly, e.lz] = dms;
          if (archHeight !== undefined) {
            if (e.type === ObjectType.Window) {
              (e as WindowModel).archHeight = archHeight;
            } else if (e.type === ObjectType.Door) {
              (e as DoorModel).archHeight = archHeight;
            }
          }
          break;
        }
      }
    });
  }

  function handleUndoableAdd(elem: ElementModel) {
    const undoableAdd = {
      name: 'Add',
      timestamp: Date.now(),
      addedElement: elem,
      undo: () => {
        useStore.getState().removeElementById(elem.id, false);
      },
      redo: () => {
        useStore.getState().set((state) => {
          state.elements.push(undoableAdd.addedElement);
          state.selectedElement = undoableAdd.addedElement;
          state.deletedRoofId = null;
        });
      },
    } as UndoableAdd;
    addUndoable(undoableAdd);
  }

  function handleUndoableResize() {
    const oldElement = useStore.getState().selectedElement;
    if (!oldElement) return;
    const newElement = useStore.getState().getElementById(oldElement.id);
    if (!newElement) return;

    switch (newElement.type) {
      case ObjectType.Door:
      case ObjectType.Window:
      case ObjectType.SolarPanel:
        const undoableResize = {
          name: `Resize ${newElement.type}`,
          timestamp: Date.now(),
          resizedElementId: newElement.id,
          resizedElementType: newElement.type,
          oldPosition: [oldElement.cx, oldElement.cy, oldElement.cz],
          oldDimension: [oldElement.lx, oldElement.ly, oldElement.lz],
          newPosition: [newElement.cx, newElement.cy, newElement.cz],
          newDimension: [newElement.lx, newElement.ly, newElement.lz],
          oldArchHeight:
            oldElement.type === ObjectType.Window || oldElement.type === ObjectType.Door
              ? (oldElement as WindowModel).archHeight
              : undefined,
          newArchHeight:
            newElement.type === ObjectType.Window || newElement.type === ObjectType.Door
              ? (newElement as WindowModel).archHeight
              : undefined,
          undo() {
            setElementPosDms(this.resizedElementId, this.oldPosition, this.oldDimension, this.oldArchHeight);
          },
          redo() {
            setElementPosDms(this.resizedElementId, this.newPosition, this.newDimension, this.newArchHeight);
          },
        } as UndoableResizeElementOnWall;
        addUndoable(undoableResize);
        break;
      case ObjectType.Polygon:
        const oldPg = oldElement as PolygonModel;
        const newPg = newElement as PolygonModel;
        const undoableEditPolygon = {
          name: 'Edit Polygon',
          timestamp: Date.now(),
          oldValue: [...oldPg.vertices],
          newValue: [...newPg.vertices],
          changedElementId: newPg.id,
          changedElementType: newPg.type,
          undo() {
            updatePolygonVerticesById(this.changedElementId, this.oldValue as Point2[]);
          },
          redo() {
            updatePolygonVerticesById(this.changedElementId, this.newValue as Point2[]);
          },
        } as UndoableChange;
        addUndoable(undoableEditPolygon);
        break;
    }
  }

  function resetBeingAddedChildId() {
    useStore.getState().set((state) => {
      state.addedWindowId = null;
      state.addedDoorId = null;
    });
  }

  function isElementAllowedMovingAdd(objectType: ObjectType) {
    return objectType === ObjectType.Window || objectType === ObjectType.Door;
  }

  function isFirstIntersectedWall(e: ThreeEvent<PointerEvent>, id: string) {
    const intersectedWalls = e.intersections.filter((i) => i.object.name !== WALL_INTERSECTION_PLANE_NAME);
    if (
      intersectedWalls.length > 0 &&
      intersectedWalls[0].object.name === `${SharedUtil.WALL_OUTSIDE_SURFACE_MESH_NAME} ${id}`
    ) {
      return true;
    }
    return false;
  }

  function isFirstIntersectedObject(e: ThreeEvent<PointerEvent>) {
    return e.intersections.length > 0 && e.intersections[0].object === e.eventObject;
  }

  function ifChildNeedsChangeParent(wallId: string, child: ElementModel | null, event: ThreeEvent<PointerEvent>) {
    if (useStore.getState().moveHandleType && child && isChildType(child) && child.parentId !== wallId) {
      const intersections = event.intersections.filter(
        (i) =>
          i.eventObject.name.includes(SharedUtil.WALL_OUTSIDE_SURFACE_MESH_NAME) ||
          i.eventObject.name.includes(WINDOW_GROUP_NAME) ||
          i.eventObject.name === WALL_BLOCK_PLANE,
      );
      const hasBlockedPlane =
        intersections.length > 0 &&
        (intersections[0].eventObject.name === WALL_BLOCK_PLANE ||
          intersections[0].eventObject.name.includes(WINDOW_GROUP_NAME));

      if (!hasBlockedPlane) {
        return true;
      }
    }
    return false;
  }

  function isChildType(el: ElementModel | null) {
    if (!el) return false;
    switch (el.type) {
      case ObjectType.Window:
      case ObjectType.Door:
      case ObjectType.SolarPanel:
      case ObjectType.Light:
      case ObjectType.Sensor:
        return true;
    }
    return false;
  }

  function isArchedResize(el: ElementModel) {
    if (useStore.getState().resizeHandleType !== ResizeHandleType.Arch) return false;
    if (el.type === ObjectType.Window) {
      const window = el as WindowModel;
      return window.windowType === WindowType.Arched && window.archHeight !== undefined;
    }
    if (el.type === ObjectType.Door) {
      const door = el as DoorModel;
      return door.doorType === DoorType.Arched && door.archHeight !== undefined;
    }
  }

  function isPointerOutsideShape(boundedShape: Shape, pointer2D: Vector2) {
    const points = boundedShape.getPoints().map((point) => ({ x: point.x, y: point.y }));
    return !Util.isPointInside(pointer2D.x, pointer2D.y, points);
  }

  function offsetWallEdgePoints(start: Vector3, end: Vector3, elHx: number, elHy: number, padding: number) {
    const edgeVector = new Vector3().subVectors(end, start).normalize();
    let d;
    if (start.y < end.y) {
      const a = edgeVector.angleTo(new Vector3(-elHx, -elHy));
      d = Math.sin(a) * Math.hypot(elHx, elHy);
    } else {
      const a = edgeVector.angleTo(new Vector3(elHx, -elHy));
      d = Math.sin(Math.PI - a) * Math.hypot(elHx, elHy);
    }
    const offsetVector = edgeVector
      .clone()
      .applyEuler(new Euler(0, 0, HALF_PI))
      .multiplyScalar(d + padding);
    start.add(offsetVector);
    end.add(offsetVector);
  }

  function getClosestPointOnPolygon(polygon: Shape, point: Vector2) {
    const edges = polygon.getPoints();
    let closestPoint = point;
    let closestDistance = Infinity;
    for (let i = 0; i < edges.length; i++) {
      const edgeStart = edges[i];
      const edgeEnd = edges[(i + 1) % edges.length];
      const edgeDirection = edgeEnd.clone().sub(edgeStart);
      const edgeLengthSq = edgeDirection.lengthSq();
      const toStart = point.clone().sub(edgeStart);
      const projectionFactor = Math.max(0, Math.min(1, toStart.dot(edgeDirection) / edgeLengthSq));
      const closestEdgePoint = edgeStart.clone().add(edgeDirection.clone().multiplyScalar(projectionFactor));
      const distanceSq = closestEdgePoint.distanceToSquared(point);
      if (distanceSq < closestDistance) {
        closestPoint = closestEdgePoint;
        closestDistance = distanceSq;
      }
    }
    return closestPoint;
  }

  function getDiagonalResizedData(e: ThreeEvent<PointerEvent>, pointer: Vector3, anchor: Vector3) {
    const diagonal = new Vector3().subVectors(anchor, pointer);
    const center = new Vector3().addVectors(anchor, pointer).divideScalar(2);
    return {
      dimensionXZ: { x: Math.abs(diagonal.x), z: Math.abs(diagonal.z) },
      positionXZ: { x: center.x, z: center.z },
    };
  }

  function isValidToAddRoof(rect: boolean, sameHeight: boolean) {
    const wallMapOnFoundation = useStore.getState().elements.reduce((map, el) => {
      if (el.type === ObjectType.Wall && el.parentId === parentId) {
        map.set(el.id, el as WallModel);
      }
      return map;
    }, new Map<string, WallModel>());

    let isLoop = false,
      isSameHeight = true,
      isPerpendicular = true,
      count = 0;

    const lang = { lng: useStore.getState().language };
    const startWall = wallModel;
    let w = startWall;
    while (w && w.rightJoints.length > 0) {
      count++;
      const rightWall = wallMapOnFoundation.get(w.rightJoints[0]);
      if (!rightWall) break;
      if (sameHeight && rightWall.lz !== startWall.lz) {
        isSameHeight = false;
        showError(i18n.t('message.WallsAreNotAtSameHeight', lang));
        return false;
      }
      if (rect && !checkPerpendicular(w, rightWall)) {
        isPerpendicular = false;
        showError(i18n.t('message.WallsAreNotPerpendicular', lang));
        return false;
      }
      if (rightWall.id === startWall.id) {
        isLoop = true;
        break;
      }
      w = rightWall;
      // avoid infinite loop
      if (count > 100) break;
    }

    if (!isLoop) {
      showError(i18n.t('message.WallsAreNotConnected', lang));
      return false;
    }
    if (rect && count !== 4) {
      showError(i18n.t('message.WallsNumebrNeedToBeFour', lang));
      return false;
    }
    return true;
  }

  function isSettingElementStartPoint() {
    return (
      elBeingAddedRef.current &&
      elBeingAddedRef.current.status === ElBeingAddedStatus.SettingStartPoint &&
      useStore.getState().moveHandleType === MoveHandleType.Mid
    );
  }

  function isAllowedToSelectMe() {
    if (useStore.getState().moveHandleType || useStore.getState().resizeHandleType || selected || isAddingElement()) {
      return false;
    }
    return true;
  }

  function isRectWall() {
    if (!roofId) return true;
    if (leftRoofHeight !== rightRoofHeight) return false;
    if (centerRoofHeight !== undefined || centerLeftRoofHeight !== undefined || centerRightRoofHeight !== undefined)
      return false;
    return true;
  }

  /** Relative to wall and snapped to grid */
  function getPointer(e: ThreeEvent<PointerEvent>, object3D?: Object3D | null, diagonalVector?: Vector3) {
    setRayCast(e);
    const intersections = object3D ? ray.intersectObjects([object3D]) : e.intersections;
    const pointer = intersections[0]?.point ?? e.point;
    const relativePositionOnWall = getRelativePosOnWall(pointer, wallModel);
    const positionOnGrid = diagonalVector
      ? getPositionOnGrid(relativePositionOnWall.clone().add(diagonalVector)).sub(diagonalVector)
      : getPositionOnGrid(relativePositionOnWall);
    return {
      relativePointer: relativePositionOnWall,
      pointerOnGrid: positionOnGrid,
    };
  }

  function makeNewMovingElement(e: ThreeEvent<PointerEvent>, objectTypeToAdd: ObjectType) {
    if (!outsideWallRef.current) return null;
    const { pointerOnGrid } = getPointer(e, outsideWallRef.current);
    const cx = pointerOnGrid.x / wallModel.lx;
    const cz = pointerOnGrid.z / wallModel.lz;
    if (objectTypeToAdd === ObjectType.Window) {
      return ElementModelFactory.makeWindow(wallModel, cx, cz);
    }
    if (objectTypeToAdd === ObjectType.Door) {
      return ElementModelFactory.makeDoor(wallModel);
    }
    return null;
  }

  function setElementHasBeenAdded(newElement: ElementModel | null) {
    if (newElement) {
      elBeingAddedRef.current = {
        id: newElement.id,
        type: newElement.type,
        status: ElBeingAddedStatus.SettingStartPoint,
      };
    }
    setCommonStore((state) => {
      if (newElement) {
        state.elements.push(newElement);
        state.selectedElement = newElement;
        if (newElement.type === ObjectType.Window) {
          state.addedWindowId = newElement.id;
        } else if (newElement.type === ObjectType.Door) {
          state.addedDoorId = newElement.id;
        }
      }
      state.moveHandleType = MoveHandleType.Mid;
      state.objectTypeToAdd = ObjectType.None;
    });
  }

  function resetToAddingNewObjectStatus(elBeingAdded: ElBeingAdded | null) {
    if (!elBeingAdded) return;
    const { id, type } = elBeingAdded;
    setCommonStore((state) => {
      state.elements = state.elements.filter((e) => e.id !== id);
      state.selectedElement = null;
      state.moveHandleType = null;
      state.objectTypeToAdd = type;
      state.addedWindowId = null;
      state.addedDoorId = null;
    });
    elBeingAddedRef.current = null;
  }

  function getElementHalfSize(element?: ElementModel) {
    if (!element) return [0, 0];

    switch (element.type) {
      case ObjectType.Window: {
        const oldParentId = usePrimitiveStore.getState().oldParentId;
        if (element.parentId !== oldParentId) {
          const oldParent = useStore.getState().elements.find((e) => e.id === oldParentId);
          if (!oldParent) return [0, 0];
          return [(element.lx * oldParent.lx) / 2, (element.lz * oldParent.lz) / 2];
        } else {
          return [(element.lx * lx) / 2, (element.lz * lz) / 2];
        }
      }
      case ObjectType.Door: {
        return [(element.lx * lx) / 2, (element.lz * lz) / 2];
      }
      case ObjectType.SolarPanel: {
        return [element.lx / 2, element.ly / 2];
      }
    }
    return [WALL_PADDING, WALL_PADDING];
  }

  /** only use x y as 2D, from right to left */
  function getRoofPoints() {
    const roofPoints: Vector3[] = [];

    // exception: shed roof
    if (centerRoofHeight) {
      const x = centerRoofHeight[0];
      if (x === 0.5 && leftRoofHeight !== undefined) {
        roofPoints.push(new Vector3(hx, centerRoofHeight[1] - hz), new Vector3(-hx, leftRoofHeight - hz));
        return roofPoints;
      }
      if (x === -0.5 && rightRoofHeight !== undefined) {
        roofPoints.push(new Vector3(hx, rightRoofHeight - hz), new Vector3(-hx, centerRoofHeight[1] - hz));
        return roofPoints;
      }
    }

    if (rightRoofHeight !== undefined) {
      roofPoints.push(new Vector3(hx, rightRoofHeight - hz));
    } else {
      roofPoints.push(new Vector3(hx, hz));
    }
    if (centerRightRoofHeight !== undefined) {
      roofPoints.push(new Vector3(centerRightRoofHeight[0] * lx, centerRightRoofHeight[1] - hz));
    }
    if (centerRoofHeight !== undefined) {
      roofPoints.push(new Vector3(centerRoofHeight[0] * lx, centerRoofHeight[1] - hz));
    }
    if (centerLeftRoofHeight !== undefined) {
      roofPoints.push(new Vector3(centerLeftRoofHeight[0] * lx, centerLeftRoofHeight[1] - hz));
    }
    if (leftRoofHeight !== undefined) {
      roofPoints.push(new Vector3(-hx, leftRoofHeight - hz));
    } else {
      roofPoints.push(new Vector3(-hx, hz));
    }
    return roofPoints;
  }

  function getBoundedPointer(pointer: Vector3, options?: BoundedPointerOptions) {
    const ignorePadding = options?.ignorePadding;
    const elementHalfSize = options?.elementHalfSize ? [...options.elementHalfSize] : [0, 0];
    const botHeight = fill === WallFill.Partial ? unfilledHeight : 0;

    const padding = ignorePadding ? 0 : WALL_PADDING;
    const leftPadding = ignorePadding ? 0 : WALL_PADDING + leftOffset;
    const rightPadding = ignorePadding ? 0 : WALL_PADDING + rightOffset;
    const topPadding = padding;
    const botPadding = padding + botHeight;
    const [elHx, elHz] = elementHalfSize;

    const [boundingMinX, boundingMaxX, boundingMinZ, boundingMaxZ] = [
      -hx + elHx + leftPadding,
      hx - elHx - rightPadding,
      -hz + elHz + botPadding,
      hz - elHz - topPadding,
    ];

    const boundedPointer = pointer.clone();
    if (isRectWall()) {
      boundedPointer.setX(Util.clamp(pointer.x, boundingMinX, boundingMaxX));
      boundedPointer.setZ(Util.clamp(pointer.z, boundingMinZ, boundingMaxZ));
    } else {
      const boundedShape = getBoundedShape(elHx, elHz, boundingMinX, boundingMaxX, boundingMinZ, topPadding);
      const pointer2D = new Vector2(pointer.x, pointer.z);

      let maxY = Infinity;
      if (options?.resizeAnchor) {
        const anchorX = options.resizeAnchor.x;
        const roofPoints = getRoofPoints().reverse(); // from left to right.
        for (let i = 1; i < roofPoints.length; i++) {
          const start = roofPoints[i - 1];
          const end = roofPoints[i];
          if (anchorX >= start.x && anchorX <= end.x) {
            const k = (end.y - start.y) / (end.x - start.x);
            const b = -k * start.x + start.y;
            maxY = k * anchorX + b;
            break;
          }
        }
      }
      const isElementOutside = pointer2D.y > maxY;
      const isPointerOutside = isPointerOutsideShape(boundedShape, pointer2D);

      if (isPointerOutside) {
        const p = getClosestPointOnPolygon(boundedShape, pointer2D);
        boundedPointer.setX(p.x);
        boundedPointer.setZ(Math.min(p.y, maxY - botPadding));
      } else if (isElementOutside) {
        boundedPointer.setZ(maxY - botPadding);
      }
    }

    boundedPointer.setZ(Math.max(boundingMinZ, boundedPointer.z));
    return boundedPointer;
  }

  function moveElement(id: string, pointer: Vector3) {
    setCommonStore((state) => {
      const el = state.elements.find((e) => e.id === id);
      if (!el) return;

      switch (el.type) {
        case ObjectType.Window: {
          el.cx = pointer.x / lx;
          el.cz = pointer.z / lz;
          el.cy = el.id === invalidElementIdRef.current ? -0.01 : 0.3;
          (el as WindowModel).tint =
            el.id === invalidElementIdRef.current ? 'red' : (state.selectedElement as WindowModel).tint; // usePrimitiveStore.getState().oldWindowTint ?? '#73D8FF';
          break;
        }
        case ObjectType.Door: {
          const hz = lz / 2;
          el.cx = pointer.x / lx;
          el.cz = (pointer.z - hz) / 2 / lz;
          el.lz = (pointer.z + hz) / lz;
          break;
        }
        case ObjectType.SolarPanel: {
          el.cx = pointer.x / lx;
          el.cz = pointer.z / lz;
          el.color = el.id === invalidElementIdRef.current ? 'red' : '#fff';
          break;
        }
        case ObjectType.Sensor:
        case ObjectType.Light: {
          el.cx = pointer.x / lx;
          el.cz = pointer.z / lz;
          break;
        }
        case ObjectType.Polygon: {
          const pg = el as PolygonModel;
          if (pg.vertices.length > 0) {
            const centroid = Util.calculatePolygonCentroid(pg.vertices);
            const dx = -pointer.x / lx - centroid.x;
            const dy = -pointer.z / lz - centroid.y;
            const newVertices = pg.vertices.map((v) => ({ x: v.x + dx, y: v.y + dy }));
            (el as PolygonModel).vertices = newVertices;
          }
          break;
        }
      }
    });
  }

  function getBoundedShape(
    elHx: number,
    elHz: number,
    boundingMinX: number,
    boundingMaxX: number,
    boundingMinZ: number,
    topPadding: number,
  ) {
    const edgesPoints: { start: Vector3; end: Vector3 }[] = [];

    // starting from wall left edge, counter-clockwise
    edgesPoints.push({ start: new Vector3(boundingMinX, hz), end: new Vector3(boundingMinX, -hz) });

    // bottom edge
    edgesPoints.push({ start: new Vector3(-hx, boundingMinZ), end: new Vector3(hx, boundingMinZ) });

    // right
    edgesPoints.push({ start: new Vector3(boundingMaxX, -hz), end: new Vector3(boundingMaxX, hz) });

    const roofPoints = getRoofPoints();
    for (let i = 1; i < roofPoints.length; i++) {
      const start = roofPoints[i - 1].clone();
      const end = roofPoints[i].clone();
      offsetWallEdgePoints(start, end, elHx, elHz, topPadding);
      edgesPoints.push({ start, end });
    }

    const shape = new Shape();
    edgesPoints.push(edgesPoints[0]);
    for (let i = 1; i < edgesPoints.length; i++) {
      const edge1 = edgesPoints[i - 1];
      const edge2 = edgesPoints[i];
      const point = RoofUtil.getIntersectionPoint(edge1.start, edge1.end, edge2.start, edge2.end);
      if (i === 1) {
        shape.moveTo(point.x, point.y);
      } else {
        shape.lineTo(point.x, point.y);
      }
    }
    shape.closePath();
    return shape;
  }

  function getArchedResizedData(archedElement: WindowModel | DoorModel, pointer: Vector3, anchor: Vector3) {
    const [wlx, wlz] = [archedElement.lx * lx, archedElement.lz * lz];
    const archHeightBottom = wlz / 2 - Math.min(archedElement.archHeight, wlx / 2, wlz);
    const newArchHeight = Math.max(0, Math.min(pointer.z - anchor.z - archHeightBottom, wlx / 2));
    const newLz = archHeightBottom + newArchHeight + wlz / 2;
    const center = new Vector3(archedElement.cx * lx, archedElement.cy, archedElement.cz * lz + (newLz - wlz) / 2);
    return { newLz: newLz, newCz: center.z, newArchHeight: newArchHeight };
  }

  function handleWallBodyPointMove(e: ThreeEvent<PointerEvent>) {
    if (isFirstIntersectedWall(e, id)) {
      const objectTypeToAdd = useStore.getState().objectTypeToAdd;
      // add new element
      if (isElementAllowedMovingAdd(objectTypeToAdd)) {
        const newElement = makeNewMovingElement(e, objectTypeToAdd);
        setElementHasBeenAdded(newElement);
      }
      // move element being added
      if (isSettingElementStartPoint()) {
        const { pointerOnGrid } = getPointer(e, outsideWallRef.current);
        const boundedPointer = getBoundedPointer(pointerOnGrid);
        moveElement(elBeingAddedRef.current!.id, boundedPointer);
      }
      // move child across different parent
      const selectedElement = useStore.getState().selectedElement;
      if (ifChildNeedsChangeParent(id, selectedElement, e)) {
        setCommonStore((state) => {
          const el = state.elements.find((e) => e.id === selectedElement?.id);
          if (!el || (el.type === ObjectType.SolarPanel && (el as SolarPanelModel).parentType === undefined)) return;

          // keep old abs dimension
          if (el.type === ObjectType.Window) {
            const oldParent = state.elements.find((e) => e.id === el.parentId);
            if (oldParent) {
              const absLx = el.lx * oldParent.lx;
              const absLz = el.lz * oldParent.lz;
              el.lx = absLx / lx;
              el.lz = absLz / lz;
            }
          }

          const { pointerOnGrid } = getPointer(e, outsideWallRef.current);
          const elementHalfSize = getElementHalfSize(el);
          const boundedPointer = getBoundedPointer(pointerOnGrid, {
            elementHalfSize,
            ignorePadding: el.type === ObjectType.SolarPanel,
          });
          checkCollision(el.id, boundedPointer, elementHalfSize[0] * 2, elementHalfSize[1] * 2);

          el.cx = boundedPointer.x / lx;
          el.cz = boundedPointer.z / lz;
          el.parentId = id;
          el.foundationId = parentId;
          if (state.selectedElement) {
            state.selectedElement.parentId = id;
            state.selectedElement.foundationId = parentId;
          }

          if (el.type === ObjectType.Window) {
            el.cy = el.id === invalidElementIdRef.current ? -0.01 : 0.3;
            (el as WindowModel).tint =
              el.id === invalidElementIdRef.current ? 'red' : (state.selectedElement as WindowModel).tint;
          } else if (el.type === ObjectType.SolarPanel) {
            el.color = el.id === invalidElementIdRef.current ? 'red' : '#fff';
            (el as SolarPanelModel).parentType = ObjectType.Wall;
          }
        });
        setPrimitiveStore('showWallIntersectionPlaneId', id);
      }
    } else if (isSettingElementStartPoint()) {
      resetToAddingNewObjectStatus(elBeingAddedRef.current);
    }
  }

  function handleWallBodyPointerDown(e: ThreeEvent<PointerEvent>) {
    if (isSettingElementStartPoint()) {
      useRefStore.getState().setEnableOrbitController(false);
      setShowIntersectionPlane(true);
      const { pointerOnGrid } = getPointer(e, outsideWallRef.current);
      const boundedPointer = getBoundedPointer(pointerOnGrid);
      setCommonStore((state) => {
        state.moveHandleType = null;
        if (elBeingAddedRef.current?.type === ObjectType.Window) {
          state.resizeHandleType = ResizeHandleType.LowerRight;
          state.resizeAnchor.copy(boundedPointer); // relative to wall
        } else if (elBeingAddedRef.current?.type === ObjectType.Door) {
          state.resizeHandleType = ResizeHandleType.UpperRight;
          state.resizeAnchor.copy(boundedPointer).setZ(-lz / 2); // relative to wall
        }
      });
      elBeingAddedRef.current!.status = ElBeingAddedStatus.SettingEndPoint;
    } else if (isFirstIntersectedObject(e)) {
      const isAddingNewChildByClick = useStore.getState().objectTypeToAdd !== ObjectType.None;
      if (isAddingNewChildByClick) {
        const pointer = e.point; // should use getBoundedPointer
        addElementByClick(pointer, true);
      } else if (useStore.getState().groupActionMode) {
        setCommonStore((state) => {
          for (const e of state.elements) {
            e.selected = e.id === parentId;
          }
          state.groupMasterId = parentId;
        });
        e.stopPropagation();
      } else if (isAllowedToSelectMe()) {
        useStore.getState().selectMe(id, e, ActionType.Select);
      }
    }
  }

  function handleWallBodyPointerOut() {
    if (isSettingElementStartPoint()) {
      resetToAddingNewObjectStatus(elBeingAddedRef.current);
    }
    invalidElementIdRef.current = null;
  }

  function handleIntersectionPlanePointerMove(e: ThreeEvent<PointerEvent>) {
    const selectedElement = useStore.getState().selectedElement ?? getSelectedElement();
    if (selectedElement?.parentId === wallModel.id) {
      // move element
      if (useStore.getState().moveHandleType) {
        const diagonalVector = new Vector3((-selectedElement.lx / 2) * lx, 0, (selectedElement.lz / 2) * lz);
        const { relativePointer, pointerOnGrid } = getPointer(e, intersectionPlaneRef.current, diagonalVector);
        const elementHalfSize = getElementHalfSize(selectedElement);
        const boundedPointer = getBoundedPointer(pointerOnGrid, {
          elementHalfSize,
          ignorePadding: selectedElement.type === ObjectType.SolarPanel,
        });
        const [eLx, eLz] = [elementHalfSize[0] * 2, elementHalfSize[1] * 2];
        if (selectedElement.type !== ObjectType.Polygon) checkCollision(selectedElement.id, boundedPointer, eLx, eLz);
        if (selectedElement.type !== ObjectType.SolarPanel) {
          checkOutsideBoundary(selectedElement.id, boundedPointer, eLx, eLz);
        }
        moveElement(selectedElement.id, boundedPointer);
      }
      // resize element
      else if (useStore.getState().resizeHandleType) {
        const { relativePointer, pointerOnGrid } = getPointer(e, intersectionPlaneRef.current);
        const resizeHandleType = useStore.getState().resizeHandleType;
        const resizeAnchor = useStore.getState().resizeAnchor;
        switch (selectedElement.type) {
          case ObjectType.Window: {
            const window = selectedElement as WindowModel;
            const boundedPointer = getBoundedPointer(pointerOnGrid, { resizeAnchor });
            if (isArchedResize(window)) {
              const { newLz, newCz, newArchHeight } = getArchedResizedData(window, boundedPointer, resizeAnchor);
              const center = new Vector3(window.cx * lx, 0, newCz);
              checkCollision(window.id, center, window.lx * lx, newLz);
              checkOutsideBoundary(window.id, center, window.lx * lx, newLz);
              setCommonStore((state) => {
                const w = state.elements.find((e) => e.id === window.id) as WindowModel;
                if (!w) return;
                w.lz = newLz / lz;
                w.cz = newCz / lz;
                w.archHeight = newArchHeight;
                w.cy = w.id === invalidElementIdRef.current ? -0.01 : 0.3;
                w.tint = w.id === invalidElementIdRef.current ? 'red' : window.tint;
              });
            } else {
              const { dimensionXZ, positionXZ } = getDiagonalResizedData(e, boundedPointer, resizeAnchor);
              const center = new Vector3(positionXZ.x, 0, positionXZ.z);
              checkCollision(window.id, center, dimensionXZ.x, dimensionXZ.z);
              checkOutsideBoundary(window.id, center, dimensionXZ.x, dimensionXZ.z);
              setCommonStore((state) => {
                const w = state.elements.find((e) => e.id === window.id) as WindowModel;
                if (!w) return;
                w.lx = dimensionXZ.x / lx;
                w.lz = dimensionXZ.z / lz;
                w.cx = positionXZ.x / lx;
                w.cz = positionXZ.z / lz;
                w.cy = w.id === invalidElementIdRef.current ? -0.01 : 0.3;
                w.tint = w.id === invalidElementIdRef.current ? 'red' : window.tint;
              });
            }
            break;
          }
          case ObjectType.Door: {
            const door = selectedElement as DoorModel;
            const boundedPointer = getBoundedPointer(pointerOnGrid, { resizeAnchor });
            if (isArchedResize(door)) {
              const { newLz, newCz, newArchHeight } = getArchedResizedData(door, boundedPointer, resizeAnchor);
              const center = new Vector3(door.cx * lx, 0, newCz);
              checkCollision(door.id, center, door.lx * lx, newLz);
              checkOutsideBoundary(door.id, center, door.lx * lx, newLz);
              setCommonStore((state) => {
                const d = state.elements.find((e) => e.id === door.id) as DoorModel;
                if (!d) return;
                d.lz = newLz / lz;
                d.cz = newCz / lz;
                d.archHeight = newArchHeight;
                d.color = d.id === invalidElementIdRef.current ? INVALID_ELEMENT_COLOR : selectedElement.color;
              });
            } else {
              const { dimensionXZ, positionXZ } = getDiagonalResizedData(e, boundedPointer, resizeAnchor);
              const center = new Vector3(positionXZ.x, 0, positionXZ.z);
              checkCollision(door.id, center, dimensionXZ.x, dimensionXZ.z);
              checkOutsideBoundary(door.id, center, dimensionXZ.x, dimensionXZ.z);
              setCommonStore((state) => {
                const d = state.elements.find((e) => e.id === door.id) as DoorModel;
                if (!d) return;
                d.cx = positionXZ.x / lx;
                d.lx = dimensionXZ.x / lx;
                d.cz = (boundedPointer.z - lz / 2) / 2 / lz;
                d.lz = (boundedPointer.z + lz / 2) / lz;
                d.color = d.id === invalidElementIdRef.current ? INVALID_ELEMENT_COLOR : selectedElement.color;
              });
            }
            break;
          }
          case ObjectType.SolarPanel: {
            const solarPanel = selectedElement as SolarPanelModel;
            const [unitX, unitY] = getSolarPanelUnitLength(solarPanel);
            // Z direction
            if (resizeHandleType === ResizeHandleType.Lower || resizeHandleType === ResizeHandleType.Upper) {
              const ny = Math.max(1, Math.round(Math.abs(relativePointer.z - resizeAnchor.z) / unitY));
              const length = ny * unitY;
              const v = new Vector3(0, 0, relativePointer.z - resizeAnchor.z).normalize().multiplyScalar(length);
              const center = new Vector3().addVectors(resizeAnchor, v.clone().divideScalar(2));
              if (!Util.isElementInsideWall(center, solarPanel.lx - 0.01, length - 0.01, outerWallPoints2D)) {
                return;
              }
              checkCollision(solarPanel.id, center, solarPanel.lx, Math.abs(v.z));
              setCommonStore((state) => {
                const sp = state.elements.find((e) => e.id === solarPanel.id);
                if (!sp) return;
                sp.cz = center.z / lz;
                sp.ly = Math.abs(v.z);
                sp.color = sp.id === invalidElementIdRef.current ? 'red' : '#fff';
              });
            }
            // X direction
            else if (resizeHandleType === ResizeHandleType.Left || resizeHandleType === ResizeHandleType.Right) {
              const nx = Math.max(1, Math.round(Math.abs(relativePointer.x - resizeAnchor.x) / unitX));
              const length = nx * unitX;
              const v = new Vector3(relativePointer.x - resizeAnchor.x, 0, 0).normalize().multiplyScalar(length);
              const center = new Vector3().addVectors(resizeAnchor, v.clone().divideScalar(2));
              if (!Util.isElementInsideWall(center, length - 0.01, solarPanel.ly - 0.01, outerWallPoints2D)) {
                return;
              }
              checkCollision(solarPanel.id, center, Math.abs(v.x), solarPanel.ly);
              setCommonStore((state) => {
                const sp = state.elements.find((e) => e.id === solarPanel.id);
                if (!sp) return;
                sp.cx = center.x / lx;
                sp.lx = Math.abs(v.x);
                sp.color = sp.id === invalidElementIdRef.current ? 'red' : '#fff';
              });
            }
            break;
          }
          case ObjectType.Polygon: {
            setCommonStore((state) => {
              const p = state.elements.find((e) => e.id === selectedElement.id) as PolygonModel;
              if (p?.selectedIndex >= 0) {
                p.vertices[p.selectedIndex].x = -pointerOnGrid.x / lx;
                p.vertices[p.selectedIndex].y = -pointerOnGrid.z / lz;
              }
            });
            break;
          }
        }
      }
    }
  }

  function handleIntersectionPlanePointerUp() {
    if (invalidElementIdRef.current) {
      if (elBeingAddedRef.current && elBeingAddedRef.current.status === ElBeingAddedStatus.SettingEndPoint) {
        // remove new element directly
        setCommonStore((state) => {
          state.elements.pop();
        });
        elBeingAddedRef.current = null;
      } else if (useStore.getState().moveHandleType || useStore.getState().resizeHandleType) {
        SharedUtil.undoInvalidOperation();
      }
    } else {
      if (elBeingAddedRef.current) {
        if (elBeingAddedRef.current.status === ElBeingAddedStatus.SettingStartPoint) {
          setCommonStore((state) => {
            state.elements.pop();
          });
          elBeingAddedRef.current = null;
        } else if (elBeingAddedRef.current.status === ElBeingAddedStatus.SettingEndPoint) {
          const elements = useStore.getState().elements;
          const newElement = elements[elements.length - 1];
          if (newElement.lx * lx < 0.1 || newElement.lz * lz < 0.1) {
            setCommonStore((state) => {
              state.elements.pop();
            });
          } else {
            handleUndoableAdd(newElement);
          }
          elBeingAddedRef.current = null;
        }
      } else if (useStore.getState().moveHandleType) {
        SharedUtil.addUndoableMove();
      } else if (useStore.getState().resizeHandleType) {
        handleUndoableResize();
      }
    }

    useRefStore.getState().setEnableOrbitController(true);
    setShowIntersectionPlane(false);
    setCommonStore((state) => {
      state.moveHandleType = null;
      state.resizeHandleType = null;
      state.selectedElement = state.elements.find((e) => e.selected) as ElementModel;
    });
    setPrimitiveStore('showWallIntersectionPlaneId', null);
    invalidElementIdRef.current = null;
    resetBeingAddedChildId();
  }

  function addElementByClick(pointer?: Vector3, body?: boolean) {
    // add new elements
    if (foundationModel && useStore.getState().objectTypeToAdd) {
      let newElement: ElementModel | null = null;
      switch (useStore.getState().objectTypeToAdd) {
        case ObjectType.PyramidRoof: {
          if (!roofId && isValidToAddRoof(false, true)) {
            newElement = ElementModelFactory.makePyramidRoof([wallModel.id], foundationModel);
          }
          break;
        }
        case ObjectType.GableRoof: {
          if (!roofId && isValidToAddRoof(true, false)) {
            newElement = ElementModelFactory.makeGableRoof([wallModel.id], foundationModel);
          }
          break;
        }
        case ObjectType.HipRoof: {
          if (!roofId && isValidToAddRoof(true, true)) {
            newElement = ElementModelFactory.makeHipRoof([wallModel.id], foundationModel, lx / 2);
          }
          break;
        }
        case ObjectType.GambrelRoof: {
          if (!roofId && isValidToAddRoof(true, false)) {
            newElement = ElementModelFactory.makeGambrelRoof([wallModel.id], foundationModel);
          }
          break;
        }
        case ObjectType.MansardRoof: {
          if (!roofId && isValidToAddRoof(false, true)) {
            newElement = ElementModelFactory.makeMansardRoof([wallModel.id], foundationModel);
          }
          break;
        }
        case ObjectType.SolarPanel: {
          if (pointer && body) {
            const p = getRelativePosOnWall(pointer, wallModel);
            const angle = wallModel.relativeAngle - HALF_PI;
            const actionState = useStore.getState().actionState;
            newElement = ElementModelFactory.makeSolarPanel(
              wallModel,
              useStore.getState().getPvModule(actionState.solarPanelModelName ?? 'SPR-X21-335-BLK'),
              p.x / lx,
              0,
              p.z / lz,
              actionState.solarPanelOrientation ?? Orientation.landscape,
              actionState.solarPanelPoleHeight ?? 1,
              actionState.solarPanelPoleSpacing ?? 3,
              0,
              0,
              new Vector3(Math.cos(angle), Math.sin(angle), 0),
              [0, 0, 0],
              actionState.solarPanelFrameColor,
              undefined,
              undefined,
              ObjectType.Wall,
            );
          }
          break;
        }
        case ObjectType.Sensor: {
          if (pointer && body) {
            const p = getRelativePosOnWall(pointer, wallModel);
            const angle = wallModel.relativeAngle - HALF_PI;
            newElement = ElementModelFactory.makeSensor(
              wallModel,
              (p.x - 0.05) / lx,
              0,
              (p.z - 0.05) / lz,
              new Vector3(Math.cos(angle), Math.sin(angle), 0),
              [0, 0, 0],
            );
          }
          break;
        }
        case ObjectType.Light: {
          if (pointer && body) {
            const p = getRelativePosOnWall(pointer, wallModel);
            const angle = wallModel.relativeAngle - HALF_PI;
            const actionState = useStore.getState().actionState;
            newElement = ElementModelFactory.makeLight(
              wallModel,
              2,
              actionState.lightDistance,
              actionState.lightIntensity,
              actionState.lightColor,
              (p.x - 0.05) / lx,
              0,
              (p.z - 0.05) / lz,
              new Vector3(Math.cos(angle), Math.sin(angle), 0),
              [0, 0, 0],
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
          if (!state.actionModeLock) {
            state.objectTypeToAdd = ObjectType.None;
          }
        });
      }
    }
  }

  function handleContextMenu(e: ThreeEvent<MouseEvent>, mesh: Mesh | null, canPaste?: boolean) {
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
  }

  function handleWallSideSurfacePointerDown(e: ThreeEvent<PointerEvent>) {
    const objectTypeToAdd = useStore.getState().objectTypeToAdd;
    if (
      !isSettingElementStartPoint() &&
      !isAddingElement() &&
      isFirstIntersectedObject(e) &&
      objectTypeToAdd === ObjectType.None
    ) {
      if (useStore.getState().groupActionMode) {
        setCommonStore((state) => {
          for (const e of state.elements) {
            e.selected = e.id === parentId;
          }
          state.groupMasterId = parentId;
        });
        e.stopPropagation();
      } else if (isAllowedToSelectMe()) {
        useStore.getState().selectMe(id, e, ActionType.Select);
      }
    } else if (RoofUtil.isTypeRoof(objectTypeToAdd)) {
      handleWallBodyPointerDown(e);
    }
  }

  function handleStudPointerDown(e: ThreeEvent<PointerEvent>) {
    if (e.intersections.length === 0 || e.intersections[0].object !== e.eventObject) return;
    if (useStore.getState().groupActionMode) {
      setCommonStore((state) => {
        for (const e of state.elements) {
          e.selected = e.id === parentId;
        }
        state.groupMasterId = parentId;
      });
    } else {
      if (checkIfCanSelectMe(e)) {
        setCommonStore((state) => {
          state.contextMenuObjectType = null;
        });
        selectMe(id, e, ActionType.Select);
      }
      addElementByClick();
      e.stopPropagation();
    }
  }

  function handleStudContextMenu(e: ThreeEvent<MouseEvent>) {
    if (e.intersections.length > 0 && e.intersections[0].object === e.eventObject) {
      setCommonStore((state) => {
        state.contextMenuObjectType = ObjectType.Wall;
      });
      selectMe(id, e, ActionType.Select);
      e.stopPropagation();
    }
  }

  function handleParapetPointerDown(e: ThreeEvent<PointerEvent>) {
    if (e.intersections.length > 0 && e.intersections[0].eventObject === e.eventObject) {
      if (useStore.getState().groupActionMode) {
        setCommonStore((state) => {
          for (const e of state.elements) {
            e.selected = e.id === parentId;
          }
          state.groupMasterId = parentId;
        });
        e.stopPropagation();
      } else if (isAllowedToSelectMe()) {
        selectMe(id, e, ActionType.Select, true);
      }
    }
  }

  function handleParapetContextMenu(e: ThreeEvent<MouseEvent>) {
    setCommonStore((state) => {
      if (e.intersections.length > 0 && e.intersections[0].eventObject === e.eventObject) {
        state.contextMenuObjectType = ObjectType.Wall;
      }
    });
  }

  function renderStuds() {
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
        {structureUnitArray.map((pos, idx) => {
          let height;
          if (pos < wallCenterPos) {
            height =
              ((pos + hx) * (wallCenterHeight - wallLeftHeight)) / (wallCenterPos + hx) +
              wallLeftHeight -
              realUnfilledHeight;
          } else {
            height =
              ((pos - hx) * (wallCenterHeight - wallRightHeight)) / (wallCenterPos - hx) +
              wallRightHeight -
              realUnfilledHeight;
          }

          return (
            <Box
              key={idx}
              args={[structureWidth, ly, height]}
              position={[pos, hy, (height - lz) / 2 + realUnfilledHeight]}
              castShadow={shadowEnabled}
              receiveShadow={shadowEnabled}
              onContextMenu={handleStudContextMenu}
              onPointerDown={handleStudPointerDown}
            >
              <meshStandardMaterial color={structureColor} />
            </Box>
          );
        })}
        <Box
          args={[leftLength, ly, ly]}
          position={[-hx + leftX / 2, hy, (wallLeftHeight + wallCenterHeight) / 2 - hz - ly / 2]}
          rotation={[0, leftRotationY, 0]}
          castShadow={shadowEnabled}
          receiveShadow={shadowEnabled}
          onContextMenu={handleStudContextMenu}
          onPointerDown={handleStudPointerDown}
        >
          <meshStandardMaterial color={structureColor} />
        </Box>
        <Box
          args={[rightLength, ly, ly]}
          position={[hx - rightX / 2, hy, (wallRightHeight + wallCenterHeight) / 2 - hz - ly / 2]}
          rotation={[0, rightRotationY, 0]}
          castShadow={shadowEnabled}
          receiveShadow={shadowEnabled}
          onContextMenu={handleStudContextMenu}
          onPointerDown={handleStudPointerDown}
        >
          <meshStandardMaterial color={structureColor} />
        </Box>
      </group>
    );
  }

  function renderPillars() {
    let [wallCenterPos, wallCenterHeight] = centerRoofHeight ?? [0, (wallLeftHeight + wallRightHeight) / 2];
    wallCenterPos = wallCenterPos * lx;

    const leftX = wallCenterPos + hx;
    const leftLength = Math.hypot(leftX, wallCenterHeight - wallLeftHeight);
    const leftRotationY = -Math.atan2(wallCenterHeight - wallLeftHeight, leftX);

    const rightX = hx - wallCenterPos;
    const rightLength = Math.hypot(rightX, wallRightHeight - wallCenterHeight);
    const rightRotationY = -Math.atan2(wallRightHeight - wallCenterHeight, rightX);

    const topBarThicnkess = ly;

    return (
      <group name={`wall pillar group ${id}`} position={[0, -ly / 2, 0]}>
        {structureUnitArray.map((pos, idx) => {
          let height;
          if (pos < wallCenterPos) {
            height =
              ((pos + hx) * (wallCenterHeight - wallLeftHeight)) / (wallCenterPos + hx) +
              wallLeftHeight -
              realUnfilledHeight;
          } else {
            height =
              ((pos - hx) * (wallCenterHeight - wallRightHeight)) / (wallCenterPos - hx) +
              wallRightHeight -
              realUnfilledHeight;
          }
          return (
            <Cylinder
              key={idx}
              args={[structureWidth / 2, structureWidth / 2, height]}
              position={[pos, hy, (height - lz) / 2 + realUnfilledHeight]}
              rotation={[-HALF_PI, 0, 0]}
              castShadow={shadowEnabled}
              receiveShadow={shadowEnabled}
              onContextMenu={handleStudContextMenu}
              onPointerDown={handleStudPointerDown}
            >
              <meshStandardMaterial color={structureColor} />
            </Cylinder>
          );
        })}
        <Box
          args={[leftLength, structureWidth, topBarThicnkess]}
          position={[-hx + leftX / 2, hy, (wallLeftHeight + wallCenterHeight) / 2 - hz - topBarThicnkess / 2]}
          rotation={[0, leftRotationY, 0]}
          castShadow={shadowEnabled}
          receiveShadow={shadowEnabled}
          onContextMenu={handleStudContextMenu}
          onPointerDown={handleStudPointerDown}
        >
          <meshStandardMaterial color={structureColor} />
        </Box>
        <Box
          args={[rightLength, structureWidth, topBarThicnkess]}
          position={[hx - rightX / 2, hy, (wallRightHeight + wallCenterHeight) / 2 - hz - topBarThicnkess / 2]}
          rotation={[0, rightRotationY, 0]}
          castShadow={shadowEnabled}
          receiveShadow={shadowEnabled}
          onContextMenu={handleStudContextMenu}
          onPointerDown={handleStudPointerDown}
        >
          <meshStandardMaterial color={structureColor} />
        </Box>
      </group>
    );
  }

  return (
    <>
      {(opacity > 0 || wallStructure === WallStructure.Default) && (
        <>
          {/* simulation mesh */}
          <mesh
            name={'Wall Simulation Mesh'}
            uuid={id}
            userData={{ simulation: true }}
            rotation={[HALF_PI, 0, 0]}
            castShadow={false}
            receiveShadow={false}
            visible={false}
          >
            <shapeBufferGeometry args={[outsideWallShape]} />
            <meshBasicMaterial side={DoubleSide} />
          </mesh>
          {/* wall outside surface */}
          <mesh
            name={`${SharedUtil.WALL_OUTSIDE_SURFACE_MESH_NAME} ${id}`}
            ref={outsideWallRef}
            rotation={[HALF_PI, 0, 0]}
            castShadow={castShadow}
            receiveShadow={shadowEnabled}
            onContextMenu={(e) => {
              handleContextMenu(e, outsideWallRef.current, true);
            }}
            onPointerMove={handleWallBodyPointMove}
            onPointerDown={handleWallBodyPointerDown}
            onPointerOut={handleWallBodyPointerOut}
          >
            <shapeBufferGeometry args={[outsideWallShape]} />
            {showSolarRadiationHeatmap && heatmapTexture ? (
              <meshBasicMaterial
                attach="material"
                map={heatmapTexture}
                color={'white'}
                opacity={opacity}
                transparent={transparent}
              />
            ) : (
              <meshStandardMaterial
                attach="material"
                color={textureType === WallTexture.Default || textureType === WallTexture.NoTexture ? color : 'white'}
                map={texture}
                transparent={transparent}
                opacity={opacity}
              />
            )}
          </mesh>

          <mesh rotation={[HALF_PI, 0, 0]} position={[0, 0.05, 0]} castShadow={castShadow}>
            <shapeBufferGeometry args={[insideWallShape]} />
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
            onPointerDown={handleWallSideSurfacePointerDown}
            onContextMenu={(e) => {
              handleContextMenu(e, insideWallRef.current);
            }}
          >
            <shapeBufferGeometry args={[insideWallShape]} />
            <meshStandardMaterial
              color={transparent ? color : 'white'}
              transparent={transparent}
              opacity={opacity}
              side={night ? BackSide : DoubleSide}
            />
          </mesh>

          <mesh rotation={[HALF_PI, 0, 0]} position={[0, ly - 0.01, 0]} receiveShadow={true}>
            <shapeBufferGeometry args={[insideWallShape]} />
            <meshStandardMaterial color={'white'} side={FrontSide} transparent={transparent} opacity={opacity} />
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
              onPointerDown={handleWallSideSurfacePointerDown}
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
              args={[wallLeftHeight - realUnfilledHeight, ly]}
              material={whiteMaterialDouble}
              position={[-hx + 0.01, hy, bottomZ + (wallLeftHeight - realUnfilledHeight) / 2]}
              rotation={[0, HALF_PI, 0]}
              castShadow={castShadow}
              receiveShadow={shadowEnabled}
              onPointerDown={handleWallSideSurfacePointerDown}
            />
          )}
          {rightOffset === 0 && (
            <Plane
              args={[wallRightHeight - realUnfilledHeight, ly]}
              material={whiteMaterialDouble}
              position={[hx - 0.01, hy, bottomZ + (wallRightHeight - realUnfilledHeight) / 2]}
              rotation={[0, HALF_PI, 0]}
              castShadow={castShadow}
              receiveShadow={shadowEnabled}
              onPointerDown={handleWallSideSurfacePointerDown}
            />
          )}

          {/* intersection planes for children */}
          {(showIntersectionPlane || showWallIntersectionPlaneId === id) &&
            useStore.getState().selectedElement?.parentId === id && (
              <>
                <Plane
                  ref={intersectionPlaneRef}
                  name={WALL_INTERSECTION_PLANE_NAME}
                  args={[10000, 10000]}
                  position={[0, ly / 3, 0]}
                  rotation={[HALF_PI, 0, 0]}
                  onPointerMove={handleIntersectionPlanePointerMove}
                  onPointerUp={handleIntersectionPlanePointerUp}
                  visible={false}
                >
                  <meshBasicMaterial color={'blue'} side={DoubleSide} />
                </Plane>
                {/* block plane */}
                <Plane
                  name={WALL_BLOCK_PLANE}
                  args={[lx, lz]}
                  rotation={[HALF_PI, 0, 0]}
                  position={[0, ly, 0]}
                  onPointerMove={() => {
                    /* Do Not Delete! Capture event for wall pointer move*/
                  }}
                  visible={false}
                />
              </>
            )}

          {elementsOnWall.map((e) => {
            switch (e.type) {
              case ObjectType.Window: {
                return (
                  <Window
                    key={e.id}
                    {...(e as WindowModel)}
                    cx={e.cx * lx}
                    cy={e.cy * ly}
                    cz={e.cz * lz}
                    lx={e.lx * lx}
                    ly={ly}
                    lz={e.lz * lz}
                  />
                );
              }
              case ObjectType.Door: {
                if (fill !== WallFill.Full) return null;
                return (
                  <Door
                    key={e.id}
                    {...(e as DoorModel)}
                    cx={e.cx * lx}
                    cy={0}
                    cz={e.cz * lz}
                    lx={e.lx * lx}
                    ly={ly}
                    lz={e.lz * lz}
                  />
                );
              }
              case ObjectType.SolarPanel:
                let r = 0;
                if (foundationModel && wallModel) {
                  r = foundationModel.rotation[2] + wallModel.relativeAngle;
                }
                return (
                  <group key={e.id} position={[0, -e.lz / 2, 0]}>
                    <SolarPanelOnWall {...(e as SolarPanelModel)} cx={e.cx * lx} cz={e.cz * lz} absRotation={r} />
                  </group>
                );
              default:
                return null;
            }
          })}
        </>
      )}

      {elementsOnWall.map((e) => {
        if (e.type === ObjectType.Polygon && fill !== WallFill.Empty) {
          return <Polygon key={e.id} {...(e as PolygonModel)} />;
        }
        return null;
      })}

      {wallStructure === WallStructure.Stud && renderStuds()}
      {wallStructure === WallStructure.Pillar && renderPillars()}

      {/* parapet */}
      {showParapet && (
        <group
          name={'Wall Parapet Group'}
          position={[0, 0, parapetZ - hz]}
          onContextMenu={handleParapetContextMenu}
          onPointerDown={handleParapetPointerDown}
        >
          <Parapet
            args={parapet}
            wallData={wallDataToParapet}
            currWallPointData={currWallPointDataToParapet}
            leftWallPointData={leftWallPointDataToParapet}
            rightWallPointData={rightWallPointDataToParapet}
          />
        </group>
      )}

      {/* wireFrame */}
      {(wallStructure === WallStructure.Default || (locked && selected)) && (
        <WallWireFrame
          lineColor={selected && locked ? LOCKED_ELEMENT_SELECTION_COLOR : lineColor}
          lineWidth={selected && locked ? 2 : lineWidth}
          hx={hx}
          hz={hz}
          fill={fill}
          unfilledHeight={unfilledHeight}
          leftHeight={leftRoofHeight}
          rightHeight={rightRoofHeight}
          center={centerRoofHeight}
          centerLeft={centerLeftRoofHeight}
          centerRight={centerRightRoofHeight}
        />
      )}

      {/* ruler */}
      {selected && <HorizontalRuler element={wallModel} verticalLift={0} />}

      {/* grid */}
      {(showIntersectionPlane || showWallIntersectionPlaneId === id) &&
        useStore.getState().selectedElement?.parentId === id && (
          <group position={[0, -0.001, 0]} rotation={[HALF_PI, 0, 0]}>
            <ElementGrid hx={hx} hy={hz} hz={0} />
          </group>
        )}

      {/* heat flux */}
      <HeatFlux wallModel={wallModel} />
    </>
  );
};

interface HeatFluxProps {
  wallModel: WallModel;
}

const HeatFlux = ({ wallModel }: HeatFluxProps) => {
  const { id, lx, lz } = wallModel;
  const getChildrenOfType = useStore(Selector.getChildrenOfType);
  const heatFluxScaleFactor = useStore(Selector.viewState.heatFluxScaleFactor);
  const heatFluxColor = useStore(Selector.viewState.heatFluxColor);
  const heatFluxWidth = useStore(Selector.viewState.heatFluxWidth);
  const hourlyHeatExchangeArrayMap = useDataStore(Selector.hourlyHeatExchangeArrayMap);
  const showHeatFluxes = usePrimitiveStore(Selector.showHeatFluxes);

  const heatFluxArrowHead = useRef<number>(0);
  const heatFluxArrowEuler = useRef<Euler>();

  const heatFluxes: Vector3[][] | undefined = useMemo(() => {
    if (!showHeatFluxes) return undefined;
    const heat = hourlyHeatExchangeArrayMap.get(id);
    if (!heat) return undefined;
    const sum = heat.reduce((a, b) => a + b, 0);
    let area = Util.getPolygonArea(Util.getWallVertices(wallModel, 0));
    if (area === 0) return undefined;
    const windows = getChildrenOfType(ObjectType.Window, id);
    const doors = getChildrenOfType(ObjectType.Door, id);
    if (windows && windows.length > 0) {
      for (const w of windows) {
        // window dimension is relative to the wall
        area -= Util.getWindowArea(w as WindowModel, wallModel);
      }
    }
    if (doors && doors.length > 0) {
      for (const d of doors) {
        // door dimension is relative to the wall
        area -= d.lx * d.lz * wallModel.lx * wallModel.lz;
      }
    }
    const world = useStore.getState().world;
    const cellSize = DEFAULT_HEAT_FLUX_DENSITY_FACTOR * (world.solarRadiationHeatmapGridCellSize ?? 0.5);
    const lz = Util.getHighestPointOfWall(wallModel); // height
    const nx = Math.max(2, Math.round(lx / cellSize));
    const nz = Math.max(2, Math.round(lz / cellSize));
    const dx = lx / nx;
    const dz = lz / nz;
    const halfDif = (lz - wallModel.lz) / 2;
    const intensity = (sum / area) * (heatFluxScaleFactor ?? DEFAULT_HEAT_FLUX_SCALE_FACTOR);
    heatFluxArrowHead.current = intensity < 0 ? 1 : 0;
    heatFluxArrowEuler.current = Util.getEuler(
      UNIT_VECTOR_POS_Z,
      UNIT_VECTOR_POS_Y,
      'YXZ',
      Math.sign(intensity) * HALF_PI,
    );
    const vectors: Vector3[][] = [];
    const polygon = Util.getWallVertices(wallModel, 0);
    for (let kx = 0; kx < nx; kx++) {
      for (let kz = 0; kz < nz; kz++) {
        const v: Vector3[] = [];
        const rx = (kx - nx / 2 + 0.5) * dx;
        const rz = (kz - nz / 2 + 0.5) * dz + halfDif;
        if (Util.isPointInside(rx, rz, polygon)) {
          let isWall = true;
          if (windows && windows.length > 0) {
            for (const w of windows) {
              if (w.type !== ObjectType.Window) continue;
              const cx = w.cx * wallModel.lx;
              const cz = w.cz * wallModel.lz;
              const hx = (w.lx * wallModel.lx) / 2;
              const hz = (w.lz * wallModel.lz) / 2;
              const win = w as WindowModel;
              if (win.windowType === WindowType.Arched) {
                // TODO: Deal with arched window
                if (rx >= cx - hx && rx < cx + hx && rz >= cz - hz && rz < cz + hz) {
                  isWall = false;
                  break;
                }
              } else {
                if (rx >= cx - hx && rx < cx + hx && rz >= cz - hz && rz < cz + hz) {
                  isWall = false;
                  break;
                }
              }
            }
          }
          if (doors && doors.length > 0) {
            for (const d of doors) {
              const cx = d.cx * lx;
              const cz = d.cz * lz;
              const hx = (d.lx * lx) / 2;
              const hz = (d.lz * lz) / 2;
              // TODO: Deal with arched door
              if (rx >= cx - hx && rx < cx + hx && rz >= cz - hz && rz < cz + hz) {
                isWall = false;
                break;
              }
            }
          }
          if (isWall) {
            if (intensity < 0) {
              v.push(new Vector3(rx, 0, rz));
              v.push(new Vector3(rx, intensity, rz));
            } else {
              v.push(new Vector3(rx, 0, rz));
              v.push(new Vector3(rx, -intensity, rz));
            }
            vectors.push(v);
          }
        }
      }
    }
    return vectors;
  }, [lx, lz, showHeatFluxes, heatFluxScaleFactor]);

  if (!heatFluxes) return null;

  return (
    <>
      {heatFluxes.map((v, index) => (
        <React.Fragment key={index}>
          <Line
            points={v}
            name={'Heat Flux ' + index}
            lineWidth={heatFluxWidth ?? DEFAULT_HEAT_FLUX_WIDTH}
            color={heatFluxColor ?? DEFAULT_HEAT_FLUX_COLOR}
          />
          ;
          <Cone
            userData={{ unintersectable: true }}
            position={v[heatFluxArrowHead.current]
              .clone()
              .add(new Vector3(0, heatFluxArrowHead.current === 0 ? -0.1 : 0.1, 0))}
            args={[0.06, 0.2, 4, 1]}
            name={'Normal Vector Arrow Head'}
            rotation={heatFluxArrowEuler.current ?? [0, 0, 0]}
          >
            <meshBasicMaterial attach="material" color={heatFluxColor ?? DEFAULT_HEAT_FLUX_COLOR} />
          </Cone>
        </React.Fragment>
      ))}
    </>
  );
};

export function getSolarPanelUnitLength(solarPanel: SolarPanelModel) {
  const pvModel = useStore.getState().getPvModule(solarPanel.pvModelName);
  if (solarPanel.orientation === Orientation.landscape) {
    return [pvModel.length, pvModel.width];
  } else {
    return [pvModel.width, pvModel.length];
  }
}

export default React.memo(Wall);
