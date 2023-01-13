/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import WallTextureDefault from 'src/resources/wall_edge.png';
import WallTexture00 from 'src/resources/tiny_white_square.png';
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
  CanvasTexture,
  DoubleSide,
  Euler,
  FrontSide,
  Mesh,
  MeshStandardMaterial,
  Raycaster,
  RepeatWrapping,
  Shape,
  TextureLoader,
  Vector2,
  Vector3,
} from 'three';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { Box, Cone, Cylinder, Line, Plane } from '@react-three/drei';
import { ActionType, MoveHandleType, ObjectType, Orientation, ResizeHandleType, WallTexture } from 'src/types';
import { Util } from 'src/Util';
import { useStore } from 'src/stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import { ElementModel } from 'src/models/ElementModel';
import { ShutterProps, WindowModel, WindowType } from 'src/models/WindowModel';
import { WallFill, WallModel, WallStructure } from 'src/models/WallModel';
import { ElementModelFactory } from 'src/models/ElementModelFactory';
import { Point2 } from 'src/models/Point2';
import { ElementGrid } from '../elementGrid';
import Window from '../window/window';
import WallWireFrame from './wallWireFrame';
import * as Selector from 'src/stores/selector';
import {
  DEFAULT_HEAT_FLUX_COLOR,
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
import { UndoableMove } from 'src/undo/UndoableMove';
import { UndoableAdd } from 'src/undo/UndoableAdd';
import { UndoableResizeElementOnWall } from 'src/undo/UndoableResize';
import { DoorModel, DoorType } from 'src/models/DoorModel';
import Door from '../door/door';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import SolarPanelOnWall from '../solarPanel/solarPanelOnWall';
import { useElements } from './hooks';
import { FoundationModel } from 'src/models/FoundationModel';
import { HorizontalRuler } from '../horizontalRuler';
import { InnerCommonState } from 'src/stores/InnerCommonState';
import { usePrimitiveStore } from '../../stores/commonPrimitive';
import { useDataStore } from '../../stores/commonData';

export interface WallProps {
  wallModel: WallModel;
  foundationModel: FoundationModel;
}

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
  } = wallModel;

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
      invalidate();
    });
  }, [textureType, wallStructure]);
  const [texture, setTexture] = useState(textureLoader);
  const { invalidate } = useThree();

  const world = useStore.getState().world;
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const getHeatmap = useStore(Selector.getHeatmap);
  const [heatmapTexture, setHeatmapTexture] = useState<CanvasTexture | null>(null);
  const heatFluxScaleFactor = useStore(Selector.viewState.heatFluxScaleFactor);
  const heatFluxColor = useStore(Selector.viewState.heatFluxColor);
  const heatFluxWidth = useStore(Selector.viewState.heatFluxWidth);
  const hourlyHeatExchangeArrayMap = useDataStore(Selector.hourlyHeatExchangeArrayMap);
  const getChildrenOfType = useStore(Selector.getChildrenOfType);

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

  const heatFluxArrowHead = useRef<number>(0);
  const heatFluxEuler = useRef<Euler>();

  const heatFluxes: Vector3[][] | undefined = useMemo(() => {
    if (!showSolarRadiationHeatmap) return undefined;
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
    const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
    const lz = Util.getHighestPointOfWall(wallModel); // height
    const nx = Math.max(2, Math.round(lx / cellSize));
    const nz = Math.max(2, Math.round(lz / cellSize));
    const dx = lx / nx;
    const dz = lz / nz;
    const halfDif = (lz - wallModel.lz) / 2;
    const intensity = (sum / area) * (heatFluxScaleFactor ?? DEFAULT_HEAT_FLUX_SCALE_FACTOR);
    heatFluxArrowHead.current = intensity < 0 ? 1 : 0;
    heatFluxEuler.current = Util.getEuler(UNIT_VECTOR_POS_Z, UNIT_VECTOR_POS_Y, Math.sign(intensity) * HALF_PI);
    const vectors: Vector3[][] = [];
    const polygon = Util.getWallVertices(wallModel, 0);
    for (let kx = 0; kx < nx; kx++) {
      for (let kz = 0; kz < nz; kz++) {
        const v: Vector3[] = [];
        const rx = (kx - nx / 2 + 0.5) * dx;
        const rz = (kz - nz / 2 + 0.5) * dz + halfDif;
        if (Util.pointInsidePolygon({ x: rx, y: rz } as Point2, polygon)) {
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
  }, [lx, lz, showSolarRadiationHeatmap]);

  const deletedWindowAndParentId = useStore(Selector.deletedWindowAndParentId);
  const deletedDoorAndParentId = useStore(Selector.deletedDoorAndParentId);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const setCommonStore = useStore(Selector.set);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const selectMe = useStore(Selector.selectMe);
  const removeElementById = useStore(Selector.removeElementById);
  const isAddingElement = useStore(Selector.isAddingElement);
  const addUndoable = useStore(Selector.addUndoable);
  const setElementPosition = useStore(Selector.setElementPosition);
  const getElementById = useStore(Selector.getElementById);
  const sunlightDirection = useStore(Selector.sunlightDirection);
  const night = sunlightDirection.z <= 0;

  const deletedRoofId = useStore(Selector.deletedRoofId);

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
              const wallPoints = Util.getWallInnerSideShapePoints(wall);
              elementsOnWall.forEach((e) => {
                if (!Util.isElementInsideWall(new Vector3(e.cx * lx, 0, e.cz * lz), e.lx * lx, e.lz * lz, wallPoints)) {
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

  const intersectionPlaneRef = useRef<Mesh>(null);
  const outsideWallRef = useRef<Mesh>(null);
  // const outsideWallInnerFaceRef = useRef<Mesh>(null);
  const insideWallRef = useRef<Mesh>(null);
  const topSurfaceRef = useRef<Mesh>(null);
  const grabRef = useRef<ElementModel | null>(null);

  const addedWindowIdRef = useRef<string | null>(null);
  const isSettingWindowStartPointRef = useRef(false);
  const isSettingWindowEndPointRef = useRef(false);
  const invalidElementIdRef = useRef<string | null>(null);
  const isSettingDoorStartPointRef = useRef(false);
  const isSettingDoorEndPointRef = useRef(false);
  const oldPositionRef = useRef<number[]>([]);
  const oldDimensionRef = useRef<number[]>([]);
  const oldTintRef = useRef<string>('#73D8FF');
  const oldDoorColorRef = useRef<string>('white');
  const oldWindowArchHeight = useRef<number>();

  const [originElements, setOriginElements] = useState<ElementModel[] | null>(null);
  const [showGrid, setShowGrid] = useState(false);

  const { elementsOnWall, leftWall, rightWall } = useElements(id, leftJoints[0], rightJoints[0]);

  const transparent = wallStructure === WallStructure.Stud || wallStructure === WallStructure.Pillar;

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
  const wallAbsAngle = foundationModel ? foundationModel.rotation[2] + relativeAngle : relativeAngle;

  leftRoofHeight = leftJoints.length > 0 ? leftRoofHeight : lz;
  rightRoofHeight = rightJoints.length > 0 ? rightRoofHeight : lz;

  const leftOffset = Util.getInnerWallOffset(leftWall, lx, ly, relativeAngle, 'left');
  const rightOffset = Util.getInnerWallOffset(rightWall, lx, ly, relativeAngle, 'right');

  const drawTopSurface = (shape: Shape, lx: number, ly: number, leftOffset: number, rightOffset: number) => {
    const x = lx / 2;
    const y = ly / 2;
    shape.moveTo(-x, -y);
    shape.lineTo(x, -y);
    shape.lineTo(x - rightOffset, y);
    shape.lineTo(-x + leftOffset, y);
    shape.closePath();
  };

  const drawWallShape = (
    shape: Shape,
    lx: number,
    ly: number,
    cx = 0,
    cy = 0,
    leftOffset = 0,
    rightOffset = 0,
    drawDoorShape = true,
  ) => {
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
  };

  const drawRectWindow = (shape: Shape, lx: number, ly: number, cx = 0, cy = 0) => {
    const x = lx / 2;
    const y = ly / 2;
    shape.moveTo(cx - x, cy - y);
    shape.lineTo(cx + x, cy - y);
    shape.lineTo(cx + x, cy + y);
    shape.lineTo(cx - x, cy + y);
    shape.closePath();
  };

  const drawArchWindow = (shape: Shape, lx: number, ly: number, cx: number, cy: number, archHeight = 0) => {
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
  };

  const outsideWallShape = useMemo(() => {
    const wallShape = new Shape();
    drawWallShape(wallShape, lx, lz, 0, 0, 0, 0);

    elementsOnWall.forEach((e) => {
      if (e.type === ObjectType.Window && e.id !== invalidElementIdRef.current) {
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
      if (w.type === ObjectType.Window && w.id !== invalidElementIdRef.current) {
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

  const intersectionPlaneShape = useMemo(() => {
    const wallShape = new Shape();
    drawWallShape(wallShape, lx, lz, 0, 0, 0, 0, false);
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
    elementsOnWall,
  ]);

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
        state.addedWindowId = null;
      });
    }
  }, [deletedWindowAndParentId]);

  useEffect(() => {
    if (deletedDoorAndParentId && deletedDoorAndParentId[1] === id) {
      resetCurrentState();
      setShowGrid(false);
      setCommonStore((state) => {
        state.deletedDoorAndParentId = null;
        state.addedDoorId = null;
      });
    }
  }, [deletedDoorAndParentId]);

  const getRelativePosOnWall = (p: Vector3, wall: WallModel) => {
    const { cx, cy, cz } = wall;
    if (foundationModel && wallAbsAngle !== undefined) {
      const wallAbsPos = Util.wallAbsolutePosition(new Vector3(cx, cy, cz), foundationModel).setZ(
        lz / 2 + foundationModel.lz,
      );
      return new Vector3().subVectors(p, wallAbsPos).applyEuler(new Euler(0, 0, -wallAbsAngle));
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

  const innerWallPoints2D = useMemo(() => {
    const points: Point2[] = [];
    const x = lx / 2;
    const y = lz / 2;
    if (fill === WallFill.Partial) {
      points.push({ x: -x + leftOffset, y: -y + unfilledHeight });
      points.push({ x: x - rightOffset, y: -y + unfilledHeight });
    } else {
      points.push({ x: -x + leftOffset, y: -y });
      points.push({ x: x - rightOffset, y: -y });
    }
    rightRoofHeight
      ? points.push({ x: x - rightOffset, y: rightRoofHeight - y })
      : points.push({ x: x - rightOffset, y: y });
    if (centerRightRoofHeight) {
      points.push({ x: centerRightRoofHeight[0] * lx, y: centerRightRoofHeight[1] - y });
    }
    if (centerRoofHeight) {
      points.push({ x: centerRoofHeight[0] * lx, y: centerRoofHeight[1] - y });
    }
    if (centerLeftRoofHeight) {
      points.push({ x: centerLeftRoofHeight[0] * lx, y: centerLeftRoofHeight[1] - y });
    }
    leftRoofHeight
      ? points.push({ x: -x + leftOffset, y: leftRoofHeight - y })
      : points.push({ x: -x + leftOffset, y: y });

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
    leftOffset,
    rightOffset,
  ]);

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

  const collisionHelper = (args: number[], tolerance = 0) => {
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
  };

  const resetCurrentState = () => {
    grabRef.current = null;
    addedWindowIdRef.current = null;
    isSettingWindowStartPointRef.current = false;
    isSettingWindowEndPointRef.current = false;
    invalidElementIdRef.current = null;
    isSettingDoorStartPointRef.current = false;
    isSettingDoorEndPointRef.current = false;
    oldWindowArchHeight.current = undefined;
  };

  const setElementPosDms = (id: string, pos: number[], dms: number[], archHeight?: number) => {
    setCommonStore((state) => {
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
          oldArchHeight: oldWindowArchHeight.current,
          newArchHeight:
            elem.type === ObjectType.Window || elem.type === ObjectType.Door
              ? (elem as WindowModel).archHeight
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
            if (selectedElement.type === ObjectType.Window) {
              oldTintRef.current = (selectedElement as WindowModel).tint;
              oldWindowArchHeight.current = (selectedElement as WindowModel).archHeight;
            }
            if (selectedElement.type === ObjectType.Door) {
              oldDoorColorRef.current = (selectedElement as DoorModel).color ?? 'white';
              oldWindowArchHeight.current = (selectedElement as DoorModel).archHeight;
            }
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
      if (isSettingWindowEndPointRef.current || isSettingDoorEndPointRef.current) {
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
      if (state.actionModeLock) {
        if (isSettingDoorEndPointRef.current) {
          state.objectTypeToAdd = ObjectType.Door;
        } else if (isSettingWindowEndPointRef.current) {
          state.objectTypeToAdd = ObjectType.Window;
        }
        InnerCommonState.selectNone(state);
      }
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
                if (!Util.isElementInsideWall(p, grabRef.current.lx * lx, grabRef.current.lz * lz, innerWallPoints2D)) {
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
                      e.cy = e.id === invalidElementIdRef.current ? -0.01 : 0.3;
                      (e as WindowModel).tint = e.id === invalidElementIdRef.current ? 'red' : oldTintRef.current;
                      break;
                    }
                  }
                });
              } else if (resizeHandleType) {
                p = getPositionOnGrid(p);
                if (!Util.isPointInside(p.x, p.z, innerWallPoints2D)) {
                  return;
                }
                let resizeAnchor = getRelativePosOnWall(useStore.getState().resizeAnchor, wallModel);
                if (isSettingWindowEndPointRef.current) {
                  resizeAnchor = getPositionOnGrid(resizeAnchor);
                }
                const window = grabRef.current as WindowModel;
                if (
                  window.windowType === WindowType.Arched &&
                  resizeHandleType === ResizeHandleType.Arch &&
                  window.archHeight !== undefined
                ) {
                  const [wlx, wlz] = [window.lx * lx, window.lz * lz];
                  const archHeightBottom = wlz / 2 - Math.min(window.archHeight, wlx / 2, wlz);
                  const newArchHeight = Math.max(0, Math.min(p.z - resizeAnchor.z - archHeightBottom, wlx / 2));
                  const newWindowHeight = archHeightBottom + newArchHeight + wlz / 2;
                  const relativePos = new Vector3(
                    window.cx * lx,
                    window.cy,
                    window.cz * lz + (newWindowHeight - wlz) / 2,
                  );
                  checkCollision(grabRef.current.id, ObjectType.Window, relativePos, wlx, newWindowHeight);
                  setCommonStore((state) => {
                    for (const e of state.elements) {
                      if (e.id === grabRef.current?.id) {
                        e.lz = newWindowHeight / lz;
                        e.cz = relativePos.z / lz;
                        e.cy = e.id === invalidElementIdRef.current ? -0.01 : 0.3;
                        (e as WindowModel).tint = e.id === invalidElementIdRef.current ? 'red' : oldTintRef.current;
                        (e as WindowModel).archHeight = newArchHeight;
                      }
                    }
                  });
                } else {
                  const v = new Vector3().subVectors(resizeAnchor, p); // window diagonal vector
                  const relativePos = new Vector3().addVectors(resizeAnchor, p).divideScalar(2);
                  checkCollision(grabRef.current.id, ObjectType.Window, relativePos, Math.abs(v.x), Math.abs(v.z));
                  setCommonStore((state) => {
                    for (const e of state.elements) {
                      if (e.id === grabRef.current?.id) {
                        const window = e as WindowModel;
                        window.lx = Math.abs(v.x) / lx;
                        window.lz = Math.abs(v.z) / lz;
                        window.cx = relativePos.x / lx;
                        window.cz = relativePos.z / lz;
                        window.cy = window.id === invalidElementIdRef.current ? -0.01 : 0.3;
                        window.tint = window.id === invalidElementIdRef.current ? 'red' : oldTintRef.current;
                      }
                    }
                  });
                }
              }
              break;
            }
            case ObjectType.Door: {
              let p = getRelativePosOnWall(pointer, wallModel);
              p = getPositionOnGrid(p);
              if (!Util.isPointInside(p.x, p.z, innerWallPoints2D)) {
                return;
              }
              // adding door
              if (moveHandleType) {
                checkCollision(
                  grabRef.current.id,
                  ObjectType.Door,
                  p,
                  grabRef.current.lx * lx,
                  grabRef.current.lz * lz,
                );
                setCommonStore((state) => {
                  for (const e of state.elements) {
                    if (e.id === grabRef.current?.id) {
                      e.cx = p.x / lx;
                      e.cz = (p.z - lz / 2) / 2 / lz;
                      e.lz = (p.z + lz / 2) / lz;
                      break;
                    }
                  }
                });
              } else if (resizeHandleType) {
                let resizeAnchor = getRelativePosOnWall(useStore.getState().resizeAnchor, wallModel);
                if (isSettingDoorEndPointRef.current) {
                  resizeAnchor = getPositionOnGrid(resizeAnchor);
                }
                const door = grabRef.current as DoorModel;
                if (
                  door.doorType === DoorType.Arched &&
                  resizeHandleType === ResizeHandleType.Arch &&
                  door.archHeight !== undefined
                ) {
                  const [dlx, dlz] = [door.lx * lx, door.lz * lz];
                  const archHeightBottom = dlz / 2 - Math.min(door.archHeight, dlx / 2, dlz);
                  const newArchHeight = Math.max(0, Math.min(p.z - resizeAnchor.z - archHeightBottom, dlx / 2));
                  const newDoorHeight = archHeightBottom + newArchHeight + dlz / 2;
                  const relativePos = new Vector3(door.cx * lx, door.cy, door.cz * lz + (newDoorHeight - dlz) / 2);
                  checkCollision(grabRef.current.id, ObjectType.Door, relativePos, dlx, newDoorHeight);
                  setCommonStore((state) => {
                    for (const e of state.elements) {
                      if (e.id === grabRef.current?.id && e.type === ObjectType.Door) {
                        e.lz = newDoorHeight / lz;
                        e.cz = relativePos.z / lz;
                        (e as DoorModel).color =
                          e.id === invalidElementIdRef.current ? INVALID_ELEMENT_COLOR : oldDoorColorRef.current;
                        (e as DoorModel).archHeight = newArchHeight;
                      }
                    }
                  });
                } else {
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
                        e.color =
                          e.id === invalidElementIdRef.current ? INVALID_ELEMENT_COLOR : oldDoorColorRef.current;
                        break;
                      }
                    }
                  });
                }
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
                if (!Util.isElementInsideWall(p, grabRef.current.lx, grabRef.current.ly, outerWallPoints2D)) {
                  return;
                }
                checkCollision(grabRef.current.id, ObjectType.SolarPanel, p, grabRef.current.lx, grabRef.current.ly);
                setCommonStore((state) => {
                  for (const e of state.elements) {
                    if (e.id === grabRef.current?.id) {
                      e.cx = p.x / lx;
                      e.cz = p.z / lz;
                      e.color = e.id === invalidElementIdRef.current ? 'red' : '#fff';
                      break;
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
                      break;
                    }
                  }
                });
              }
              break;
            }
            case ObjectType.Light:
            case ObjectType.Sensor: {
              let p = getRelativePosOnWall(pointer, wallModel);
              if (moveHandleType) {
                const v = new Vector3(-grabRef.current.lx / 2, 0, grabRef.current.ly / 2);
                p = getPositionOnGrid(p.clone().add(v)).sub(v);
                if (!Util.isElementInsideWall(p, grabRef.current.lx, grabRef.current.ly, outerWallPoints2D)) {
                  return;
                }
                setCommonStore((state) => {
                  for (const e of state.elements) {
                    if (e.id === grabRef.current?.id) {
                      e.cx = (p.x - 0.05) / lx;
                      e.cz = (p.z + 0.05) / lz;
                      break;
                    }
                  }
                });
              }
              break;
            }
          }
        }

        // add new element
        switch (useStore.getState().objectTypeToAdd) {
          case ObjectType.Window: {
            const actionState = useStore.getState().actionState;
            let relativePos = getRelativePosOnWall(pointer, wallModel);
            relativePos = getPositionOnGrid(relativePos);
            const shutter = {
              showLeft: actionState.windowShutterLeft,
              showRight: actionState.windowShutterRight,
              color: actionState.windowShutterColor,
              width: actionState.windowShutterWidth,
            } as ShutterProps;
            const newWindow = ElementModelFactory.makeWindow(
              wallModel,
              actionState.windowColor,
              actionState.windowTint,
              actionState.windowOpacity,
              actionState.windowUValue,
              actionState.windowMullion,
              actionState.windowMullionWidth,
              actionState.windowMullionSpacing,
              actionState.windowMullionColor,
              shutter,
              actionState.windowFrame,
              actionState.windowFrameWidth,
              actionState.windowType,
              actionState.windowArchHeight,
              relativePos.x / lx,
              0,
              relativePos.z / lz,
            );
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
            const actionState = useStore.getState().actionState;
            const newDoor = ElementModelFactory.makeDoor(
              wallModel,
              actionState.doorColor,
              actionState.doorUValue,
              actionState.doorTexture,
              actionState.doorArchHeight,
              actionState.doorType,
              actionState.doorFilled,
            );
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
    if (e.intersections.length > 0) {
      const intersectableObjects = e.intersections.filter(
        (obj) => !obj.eventObject.name.startsWith('Wall Intersection Plane'),
      );
      if (intersectableObjects[0].eventObject !== e.eventObject) return;
    }
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
          InnerCommonState.selectMe(state, id, e, ActionType.Select);
        });
      }
      if (outsideWallRef.current) {
        const intersects = ray.intersectObjects([outsideWallRef.current]);
        if (intersects.length > 0) {
          const pointer = intersects[0].point;
          handleAddElement(pointer, true);
        }
      }
    }
  };

  const handleAddElement = (pointer?: Vector3, body?: boolean) => {
    // add new elements
    if (foundationModel && useStore.getState().objectTypeToAdd) {
      let newElement: ElementModel | null = null;
      switch (useStore.getState().objectTypeToAdd) {
        case ObjectType.PyramidRoof: {
          if (!roofId) {
            const actionState = useStore.getState().actionState;
            newElement = ElementModelFactory.makePyramidRoof(
              [wallModel.id],
              foundationModel,
              actionState.roofRise,
              actionState.roofThickness,
              actionState.roofRValue,
              actionState.roofOverhang,
              actionState.roofColor,
              actionState.roofSideColor,
              actionState.roofTexture,
            );
          }
          break;
        }
        case ObjectType.GableRoof: {
          if (!roofId) {
            const actionState = useStore.getState().actionState;
            newElement = ElementModelFactory.makeGableRoof(
              [wallModel.id],
              foundationModel,
              actionState.roofRise,
              actionState.roofThickness,
              actionState.roofRValue,
              actionState.roofOverhang,
              actionState.roofColor,
              actionState.roofSideColor,
              actionState.roofTexture,
            );
          }
          break;
        }
        case ObjectType.HipRoof: {
          if (!roofId) {
            const actionState = useStore.getState().actionState;
            newElement = ElementModelFactory.makeHipRoof(
              [wallModel.id],
              foundationModel,
              actionState.roofRise,
              lx / 2,
              actionState.roofThickness,
              actionState.roofRValue,
              actionState.roofOverhang,
              actionState.roofColor,
              actionState.roofSideColor,
              actionState.roofTexture,
            );
          }
          break;
        }
        case ObjectType.GambrelRoof: {
          if (!roofId) {
            const actionState = useStore.getState().actionState;
            newElement = ElementModelFactory.makeGambrelRoof(
              [wallModel.id],
              foundationModel,
              actionState.roofRise,
              actionState.roofThickness,
              actionState.roofRValue,
              actionState.roofOverhang,
              actionState.roofColor,
              actionState.roofSideColor,
              actionState.roofTexture,
            );
          }
          break;
        }
        case ObjectType.MansardRoof: {
          if (!roofId) {
            const actionState = useStore.getState().actionState;
            newElement = ElementModelFactory.makeMansardRoof(
              [wallModel.id],
              foundationModel,
              actionState.roofRise,
              actionState.roofThickness,
              actionState.roofRValue,
              actionState.roofOverhang,
              actionState.roofColor,
              actionState.roofSideColor,
              actionState.roofTexture,
            );
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

  const castShadow = shadowEnabled && !transparent;

  const renderStuds = () => {
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
  };

  const renderPillars = () => {
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
  };

  const wallLeftHeight = leftRoofHeight ?? lz;
  const wallRightHeight = rightRoofHeight ?? lz;
  const realUnfilledHeight = fill === WallFill.Partial ? unfilledHeight : 0;
  const bottomZ = -hz + realUnfilledHeight;

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
          {/* outside wall */}
          <mesh
            name={'Outside Wall'}
            ref={outsideWallRef}
            rotation={[HALF_PI, 0, 0]}
            castShadow={castShadow}
            receiveShadow={shadowEnabled}
            onContextMenu={(e) => {
              handleContextMenu(e, outsideWallRef.current, true);
            }}
            onPointerDown={handleWallBodyPointerDown}
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
              args={[wallLeftHeight - realUnfilledHeight, ly]}
              material={whiteMaterialDouble}
              position={[-hx + 0.01, hy, bottomZ + (wallLeftHeight - realUnfilledHeight) / 2]}
              rotation={[0, HALF_PI, 0]}
              castShadow={castShadow}
              receiveShadow={shadowEnabled}
              onPointerDown={handleWallBodyPointerDown}
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
              onPointerDown={handleWallBodyPointerDown}
            />
          )}

          {/* intersection plane for child */}
          <mesh
            // Important: name related to selectMe function in common store
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

      {wallStructure === WallStructure.Stud && renderStuds()}
      {wallStructure === WallStructure.Pillar && renderPillars()}

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
      {showGrid && (useStore.getState().moveHandleType || useStore.getState().resizeHandleType) && (
        <group position={[0, -0.001, 0]} rotation={[HALF_PI, 0, 0]}>
          <ElementGrid hx={hx} hy={hz} hz={0} />
        </group>
      )}

      {heatFluxes &&
        heatFluxes.map((v, index) => {
          return (
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
                rotation={heatFluxEuler.current ?? [0, 0, 0]}
              >
                <meshBasicMaterial attach="material" color={heatFluxColor ?? DEFAULT_HEAT_FLUX_COLOR} />
              </Cone>
            </React.Fragment>
          );
        })}
    </>
  );
};

export default React.memo(Wall);
