/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import FoundationTexture00 from '../../resources/tiny_white_square.png';
import FoundationTexture01 from '../../resources/foundation_01.png';
import FoundationTexture02 from '../../resources/foundation_02.png';
import FoundationTexture03 from '../../resources/foundation_03.png';
import FoundationTexture04 from '../../resources/foundation_04.png';
import FoundationTexture05 from '../../resources/foundation_05.png';
import FoundationTexture06 from '../../resources/foundation_06.png';
import FoundationTexture07 from '../../resources/foundation_07.png';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Line, Plane, Sphere } from '@react-three/drei';
import { CanvasTexture, Euler, Group, Mesh, Raycaster, RepeatWrapping, TextureLoader, Vector2, Vector3 } from 'three';
import { useStore } from '../../stores/common';
import { useRefStore } from '../../stores/commonRef';
import { FoundationModel } from '../../models/FoundationModel';
import { ThreeEvent, useThree } from '@react-three/fiber';
import {
  ActionType,
  FoundationTexture,
  MoveHandleType,
  ObjectType,
  Orientation,
  ResizeHandleType,
  RotateHandleType,
  SolarStructure,
  WallSide,
} from '../../types';
import {
  HALF_PI,
  HIGHLIGHT_HANDLE_COLOR,
  LOCKED_ELEMENT_SELECTION_COLOR,
  MOVE_HANDLE_COLOR_1,
  MOVE_HANDLE_COLOR_2,
  ORIGIN_VECTOR2,
  RESIZE_HANDLE_COLOR,
  TWO_PI,
  UNIT_VECTOR_POS_Z,
  ZERO_TOLERANCE,
} from '../../constants';
import { Util } from '../../Util';
import { ElementModel } from '../../models/ElementModel';
import { SolarPanelModel } from '../../models/SolarPanelModel';
import { ParabolicTroughModel } from '../../models/ParabolicTroughModel';
import { ParabolicDishModel } from '../../models/ParabolicDishModel';
import { PolarGrid } from '../polarGrid';
import { WallModel } from '../../models/WallModel';
import RotateHandle from '../../components/rotateHandle';
import Wireframe from '../../components/wireframe';
import * as Selector from '../../stores/selector';
import { FlippedWallSide, UndoableAdd, UndoableAddWall } from '../../undo/UndoableAdd';
import { UndoableMove, UndoableMoveWall } from '../../undo/UndoableMove';
import { UndoableResize, UndoableResizeWall } from '../../undo/UndoableResize';
import { UndoableChange } from '../../undo/UndoableChange';
import { ElementGrid } from '../elementGrid';
import i18n from '../../i18n/i18n';
import { PolygonModel } from '../../models/PolygonModel';
import { Point2 } from '../../models/Point2';
import { HorizontalRuler } from '../horizontalRuler';
import { showError } from '../../helpers';
import { SolarCollector } from '../../models/SolarCollector';
import { FresnelReflectorModel } from '../../models/FresnelReflectorModel';
import SolarUpdraftTower from '../solarUpdraftTower';
import SolarPowerTower from '../solarPowerTower';
import SolarReceiverPipe from '../solarReceiverPipe';
import { UndoablePaste } from '../../undo/UndoablePaste';
import GroupMaster from 'src/components/groupMaster';
import { useHandleSize } from '../wall/hooks';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { InnerCommonStoreState } from 'src/stores/InnerCommonState';
import produce from 'immer';
import { useDataStore } from '../../stores/commonData';
import { useGroupMaster, useSelected } from '../hooks';
import { debounce } from 'lodash';
import BuildingRenderer from './buildingRenderer';

interface WallAuxiliaryType {
  show: boolean;
  direction: 'x' | 'y' | 'xy' | null;
  position: number[] | null;
}

interface SnapTargetType {
  id: string | null;
  point: Vector3 | null;
  side: WallSide | null;
  jointId: string | undefined;
}

export const FOUNDATION_GROUP_NAME = 'Foundation Group';

const Foundation = (foundationModel: FoundationModel) => {
  const {
    id,
    cx,
    cy,
    lx = 1,
    ly = 1,
    lz = 0.1,
    rotation = [0, 0, 0],
    color = 'gray',
    lineColor = 'black',
    lineWidth = 0.2,
    locked = false,
    showLabel = false,
    textureType = FoundationTexture.NoTexture,
    solarStructure,
  } = foundationModel;

  const selected = useSelected(id);

  const language = useStore(Selector.language);
  const orthographic = useStore(Selector.viewState.orthographic);
  const getElementById = useStore(Selector.getElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const setCommonStore = useStore(Selector.set);
  const setElementPosition = useStore(Selector.setElementPosition);
  const setElementSize = useStore(Selector.setElementSize);
  const updateElementLxById = useStore(Selector.updateElementLxById);
  const updateElementLyById = useStore(Selector.updateElementLyById);
  const updateWallLeftJointsById = useStore(Selector.updateWallLeftJointsById);
  const updateWallRightJointsById = useStore(Selector.updateWallRightJointsById);
  const updateWallLeftPointById = useStore(Selector.updateWallLeftPointById);
  const updateSolarCollectorRelativeAzimuthById = useStore(Selector.updateSolarCollectorRelativeAzimuthById);
  const updatePolygonVertexPositionById = useStore(Selector.updatePolygonVertexPositionById);
  const updatePolygonVerticesById = useStore(Selector.updatePolygonVerticesById);
  const pasteElements = useStore(Selector.pasteElementsToPoint);
  const elementsToPaste = useStore(Selector.elementsToPaste);
  const removeElementById = useStore(Selector.removeElementById);
  const selectMe = useStore(Selector.selectMe);
  const addElement = useStore(Selector.addElement);
  const getPvModule = useStore(Selector.getPvModule);
  const deletedWallID = useStore(Selector.deletedWallId);
  const updateWallMapOnFoundationFlag = useStore(Selector.updateWallMapOnFoundationFlag);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const groundImage = useStore(Selector.viewState.groundImage);
  const addedFoundationID = useStore(Selector.addedFoundationId);
  const addUndoable = useStore(Selector.addUndoable);
  const isAddingElement = useStore(Selector.isAddingElement);
  const overlapWithSibling = useStore(Selector.overlapWithSibling);
  const hoveredHandle = useStore(Selector.hoveredHandle);
  const showSolarRadiationHeatmap = usePrimitiveStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const solarRadiationHeatmapReflectionOnly = useStore(Selector.viewState.solarRadiationHeatmapReflectionOnly);
  const getHeatmap = useDataStore(Selector.getHeatmap);
  const groupMasterId = useStore(Selector.groupMasterId);

  const { baseGroupSet, childCuboidSet, groupMasterDimension, groupMasterPosition, groupMasterRotation } =
    useGroupMaster(foundationModel, groupMasterId);

  const {
    camera,
    gl: { domElement },
  } = useThree();
  const [hovered, setHovered] = useState(false);
  const [heatmapTexture, setHeatmapTexture] = useState<CanvasTexture | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [wallAuxToAxis, setWallAuxToAxis] = useState<WallAuxiliaryType>({
    show: false,
    direction: null,
    position: null,
  });
  const [wallAuxToWallArray, setWallAuxToWallArray] = useState<WallAuxiliaryType[]>([
    { show: false, direction: null, position: null },
    { show: false, direction: null, position: null },
  ]);

  const addedWallIdRef = useRef<string | null>(null);
  const isSettingWallStartPointRef = useRef(false);
  const isSettingWallEndPointRef = useRef(false);
  const elementsStateBeforeResizingRef = useRef<ElementModel[] | null>(null);
  const flippedWallSide = useRef<FlippedWallSide>(FlippedWallSide.null);

  // Use 1: Directly use to get wall points to snap.
  // Use 2: Need update first before other use. Intend to reduce call getElementById()
  const wallMapOnFoundation = useRef<Map<string, WallModel>>(new Map());

  const groupRef = useRef<Group>(null);
  const baseRef = useRef<Mesh>();
  const grabRef = useRef<ElementModel | null>(null);
  const intersectPlaneRef = useRef<Mesh>();
  const resizeHandleLLRef = useRef<Mesh>();
  const resizeHandleULRef = useRef<Mesh>();
  const resizeHandleLRRef = useRef<Mesh>();
  const resizeHandleURRef = useRef<Mesh>();
  const moveHandleLowerRef = useRef<Mesh>();
  const moveHandleUpperRef = useRef<Mesh>();
  const moveHandleLeftRef = useRef<Mesh>();
  const moveHandleRightRef = useRef<Mesh>();
  const oldPositionRef = useRef<Vector3>(new Vector3());
  const newPositionRef = useRef<Vector3>(new Vector3());
  const oldDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const newDimensionRef = useRef<Vector3>(new Vector3(1, 1, 1));
  const oldAzimuthRef = useRef<number>(0);
  const newAzimuthRef = useRef<number>(0);
  const oldVerticesRef = useRef<Point2[]>([]);
  const newVerticesRef = useRef<Point2[]>([]);
  const oldJointsRef = useRef<string[][]>([]);
  const newJointsRef = useRef<string[][]>([]);
  const oldPointRef = useRef<number[][]>([]);
  const newPointRef = useRef<number[][]>([]);

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);
  const mouse = useMemo(() => new Vector2(), []);
  const ray = useMemo(() => new Raycaster(), []);
  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;
  const positionLL = useMemo(() => new Vector3(-hx, -hy, hz), [hx, hy, hz]);
  const positionUL = useMemo(() => new Vector3(-hx, hy, hz), [hx, hy, hz]);
  const positionLR = useMemo(() => new Vector3(hx, -hy, hz), [hx, hy, hz]);
  const positionUR = useMemo(() => new Vector3(hx, hy, hz), [hx, hy, hz]);

  // experimental wall handle size, may useful for foundation handles too
  const handleRadius = useHandleSize();

  const moveHandleRadius = handleRadius;
  const resizeHandleRadius = handleRadius;
  const rotateHandleRadius = handleRadius * 4;
  const rotateHandlePosition = hy + rotateHandleRadius;

  // for undo auto deletion
  type UndoMoveWall = { wall: WallModel; newAngle: number; newJoints: string[][] };
  const listenToAutoDeletionRef = useRef(false);
  const undoableMoveWallArgsRef = useRef<UndoMoveWall | null>(null);
  // only one roof is affected, so no need to use set
  const autoDeletedRoofs = useStore(Selector.autoDeletedRoofs);
  const autoDeletedChild = useStore(Selector.autoDeletedChild);

  const intersectionPlanePosition = useMemo(() => new Vector3(), []);
  if (grabRef.current) {
    let poleHeight = -1;
    switch (grabRef.current.type) {
      case ObjectType.SolarPanel:
        poleHeight = (grabRef.current as SolarPanelModel).poleHeight;
        break;
      case ObjectType.ParabolicTrough:
        // pole height of parabolic trough is relative to its half width
        const trough = grabRef.current as ParabolicTroughModel;
        poleHeight = trough.poleHeight + trough.lx / 2;
        break;
      case ObjectType.ParabolicDish:
        // pole height of parabolic dish is relative to its radius
        const dish = grabRef.current as ParabolicDishModel;
        poleHeight = dish.poleHeight + dish.lx / 2 + (dish.lx * dish.lx) / (4 * dish.latusRectum);
        break;
      case ObjectType.FresnelReflector:
        // pole height of Fresnel reflector is relative to its half width
        const reflector = grabRef.current as FresnelReflectorModel;
        poleHeight = reflector.poleHeight + reflector.lx / 2;
        break;
    }
    if (poleHeight >= 0) {
      intersectionPlanePosition.set(0, 0, foundationModel?.lz / 2 + poleHeight);
    }
  }

  useEffect(() => {
    wallMapOnFoundation.current.clear();
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.Wall && e.parentId === id) {
        wallMapOnFoundation.current.set(e.id, e as WallModel);
      }
    }
  }, [updateWallMapOnFoundationFlag]);

  useEffect(() => {
    if (deletedWallID && deletedWallID === addedWallIdRef.current) {
      wallMapOnFoundation.current.delete(deletedWallID);
      isSettingWallStartPointRef.current = false;
      isSettingWallEndPointRef.current = false;
      addedWallIdRef.current = null;
      setCommonStore((state) => {
        if (state.addedWallId === state.deletedWallId) {
          state.addedWallId = null;
        }
        state.deletedWallId = null;
      });
      useRefStore.getState().setEnableOrbitController(true);
      setWallAuxToAxis({ show: false, direction: null, position: null });
      setWallAuxToWallArray([
        { show: false, direction: null, position: null },
        { show: false, direction: null, position: null },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletedWallID]);

  useEffect(() => {
    if (foundationModel && showSolarRadiationHeatmap) {
      const heatmap = getHeatmap(foundationModel.id);
      if (heatmap) {
        setHeatmapTexture(Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5));
      } else {
        setHeatmapTexture(null);
      }
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue, solarRadiationHeatmapReflectionOnly]);

  // for undo auto deletion
  useEffect(() => {
    if (!listenToAutoDeletionRef.current || !useStore.getState().getAutoDeletedElements()) return;
    handleUndoMoveWallWithAutoDeletion();
  }, [autoDeletedRoofs, autoDeletedChild]);

  const handleUndoMoveWallWithAutoDeletion = debounce(() => {
    if (!undoableMoveWallArgsRef.current) return;

    const autoDeletedElements = useStore.getState().getAutoDeletedElements();
    if (!autoDeletedElements) return;

    const { wall, newAngle, newJoints } = undoableMoveWallArgsRef.current;
    const undoableMove = {
      name: 'Move Wall',
      timestamp: Date.now(),
      id: wall.id,
      oldPoints: [[...oldPointRef.current[0]], [...oldPointRef.current[1]]],
      newPoints: [[...wall.leftPoint], [...wall.rightPoint]],
      oldJoints: [[...oldJointsRef.current[0]], [...oldJointsRef.current[1]]],
      newJoints: [[...newJoints[0]], [...newJoints[1]]],
      oldAngle: oldAzimuthRef.current,
      newAngle: newAngle,
      flippedWallSide: flippedWallSide.current,
      autoDeletedElements: [...autoDeletedElements],
      undo() {
        switch (this.flippedWallSide) {
          case FlippedWallSide.loop:
            flipWallLoop(this.id);
            break;
          case FlippedWallSide.left:
            const lw = getElementById(this.newJoints[0][0]) as WallModel;
            if (lw) {
              flipWallsClockwise(lw);
            }
            break;
          case FlippedWallSide.right:
            const rw = getElementById(this.newJoints[1][0]) as WallModel;
            if (rw) {
              flipWallsCounterClockwise(rw);
            }
            break;
        }
        const [oldLeftJoints, oldRightJoints] = this.oldJoints;
        const [newLeftJoints, newRightJoints] = this.newJoints;
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.id === this.id) {
              const [leftPoint, rightPoint] = this.oldPoints;
              e.cx = (leftPoint[0] + rightPoint[0]) / 2;
              e.cy = (leftPoint[1] + rightPoint[1]) / 2;
              e.lx = Math.hypot(leftPoint[0] - rightPoint[0], leftPoint[1] - rightPoint[1]);
              const w = e as WallModel;
              w.relativeAngle = this.oldAngle;
              w.leftPoint = [...leftPoint];
              w.rightPoint = [...rightPoint];
              w.leftJoints = [...oldLeftJoints];
              w.rightJoints = [...oldRightJoints];
              break;
            }
          }
          state.resizeHandleType = null;
          state.elements.push(...this.autoDeletedElements);
          state.deletedRoofId = null;
          state.autoDeletedChild = null;
          state.autoDeletedRoofs = null;
          state.autoDeletedRoofIdSet.clear();
        });
        if (oldLeftJoints[0] !== newLeftJoints[0]) {
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.type === ObjectType.Wall) {
                if (e.id === oldLeftJoints[0]) {
                  (e as WallModel).rightJoints = [this.id];
                }
                if (e.id === newLeftJoints[0]) {
                  if (this.flippedWallSide !== FlippedWallSide.left) {
                    (e as WallModel).rightJoints = [];
                  } else {
                    (e as WallModel).leftJoints = [];
                  }
                }
              }
            }
          });
        }
        if (oldRightJoints[0] !== newRightJoints[0]) {
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.type === ObjectType.Wall) {
                if (e.id === oldRightJoints[0]) {
                  (e as WallModel).leftJoints = [this.id];
                }
                if (e.id === newRightJoints[0]) {
                  if (this.flippedWallSide !== FlippedWallSide.right) {
                    (e as WallModel).leftJoints = [];
                  } else {
                    (e as WallModel).rightJoints = [];
                  }
                }
              }
            }
          });
        }
        flippedWallSide.current = FlippedWallSide.null;
      },
      redo() {
        const [oldLeftJoints, oldRightJoints] = this.oldJoints;
        const [newLeftJoints, newRightJoints] = this.newJoints;
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.id === this.id && e.type === ObjectType.Wall) {
              const [leftPoint, rightPoint] = this.newPoints;
              e.cx = (leftPoint[0] + rightPoint[0]) / 2;
              e.cy = (leftPoint[1] + rightPoint[1]) / 2;
              e.lx = Math.hypot(leftPoint[0] - rightPoint[0], leftPoint[1] - rightPoint[1]);
              const w = e as WallModel;
              w.relativeAngle = this.newAngle;
              w.leftPoint = [...leftPoint];
              w.rightPoint = [...rightPoint];
              w.leftJoints = [...newLeftJoints];
              w.rightJoints = [...newRightJoints];
              break;
            }
          }
        });
        if (oldLeftJoints[0] !== newLeftJoints[0]) {
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.type === ObjectType.Wall) {
                if (e.id === oldLeftJoints[0]) {
                  (e as WallModel).rightJoints = [];
                }
                if (e.id === newLeftJoints[0]) {
                  if (this.flippedWallSide === FlippedWallSide.right) {
                    (e as WallModel).leftJoints = [this.id];
                  } else {
                    (e as WallModel).rightJoints = [this.id];
                  }
                }
              }
            }
          });
        }
        if (oldRightJoints[0] !== newRightJoints[0]) {
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.type === ObjectType.Wall) {
                if (e.id === oldRightJoints[0]) {
                  (e as WallModel).leftJoints = [];
                }
                if (e.id === newRightJoints[0]) {
                  if (this.flippedWallSide === FlippedWallSide.right) {
                    (e as WallModel).rightJoints = [this.id];
                  } else {
                    (e as WallModel).leftJoints = [this.id];
                  }
                }
              }
            }
          });
        }
        switch (this.flippedWallSide) {
          case FlippedWallSide.loop:
            flipWallLoop(this.id);
            break;
          case FlippedWallSide.left:
            const lw = getElementById(this.newJoints[0][0]) as WallModel;
            if (lw) {
              flipWallsCounterClockwise(lw);
            }
            break;
          case FlippedWallSide.right:
            const rw = getElementById(this.newJoints[1][0]) as WallModel;
            if (rw) {
              flipWallsClockwise(rw);
            }
            break;
        }
        const set = new Set(this.autoDeletedElements.map((e) => e.id));
        setCommonStore((state) => {
          state.resizeHandleType = null;
          state.elements = state.elements.filter((e) => !set.has(e.id));
          const deletedRoof = this.autoDeletedElements.find((e) => e.type === ObjectType.Roof);
          if (deletedRoof) {
            state.deletedRoofId = deletedRoof.id;
          }
        });
        flippedWallSide.current = FlippedWallSide.null;
      },
    } as UndoableMoveWall;
    addUndoable(undoableMove);

    listenToAutoDeletionRef.current = false;
    setCommonStore((state) => {
      state.autoDeletedRoofs = null;
      state.autoDeletedRoofIdSet.clear();
      state.autoDeletedChild = null;
    });
  }, 100);

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const fetchRepeatDividers = (textureType: FoundationTexture) => {
    switch (textureType) {
      case FoundationTexture.Texture01:
        return { x: 1, y: 1 };
      case FoundationTexture.Texture02:
        return { x: 2, y: 2 };
      case FoundationTexture.Texture03:
        return { x: 0.4, y: 0.4 };
      case FoundationTexture.Texture04:
        return { x: 0.25, y: 0.25 };
      case FoundationTexture.Texture05:
        return { x: 5, y: 5 };
      case FoundationTexture.Texture06:
        return { x: 1, y: 1 };
      case FoundationTexture.Texture07:
        return { x: 1, y: 1 };
      default:
        return { x: 1, y: 1 };
    }
  };

  const textureLoader = useMemo(() => {
    let textureImg;
    switch (textureType) {
      case FoundationTexture.Texture01:
        textureImg = FoundationTexture01;
        break;
      case FoundationTexture.Texture02:
        textureImg = FoundationTexture02;
        break;
      case FoundationTexture.Texture03:
        textureImg = FoundationTexture03;
        break;
      case FoundationTexture.Texture04:
        textureImg = FoundationTexture04;
        break;
      case FoundationTexture.Texture05:
        textureImg = FoundationTexture05;
        break;
      case FoundationTexture.Texture06:
        textureImg = FoundationTexture06;
        break;
      case FoundationTexture.Texture07:
        textureImg = FoundationTexture07;
        break;
      default:
        textureImg = FoundationTexture00;
    }
    return new TextureLoader().load(textureImg, (t) => {
      t.wrapS = t.wrapT = RepeatWrapping;
      const param = fetchRepeatDividers(textureType);
      t.repeat.set(lx / param.x, ly / param.y);
      setTexture(t);
    });
  }, [textureType, lx, ly]);
  const [texture, setTexture] = useState(textureLoader);

  const hoverHandle = useCallback(
    (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => {
      if (usePrimitiveStore.getState().duringCameraInteraction) return;
      if (e.intersections.length > 0) {
        // QUICK FIX: For some reason, the top one can sometimes be the ground, so we also go to the second one
        const intersected =
          e.intersections[0].object === e.eventObject ||
          (e.intersections.length > 1 && e.intersections[1].object === e.eventObject);
        if (intersected) {
          setCommonStore((state) => {
            state.hoveredHandle = handle;
          });
          if (Util.isMoveHandle(handle)) {
            domElement.style.cursor = 'move';
          } else if (handle === RotateHandleType.Lower || handle === RotateHandleType.Upper) {
            domElement.style.cursor = 'grab';
          } else {
            domElement.style.cursor = useStore.getState().addedFoundationId ? 'crosshair' : 'pointer';
          }
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
  );

  const noHoverHandle = useCallback(() => {
    setCommonStore((state) => {
      state.hoveredHandle = null;
    });
    domElement.style.cursor = useStore.getState().addedFoundationId ? 'crosshair' : 'default';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // only these elements are allowed to be on the foundation
  const legalOnFoundation = (type: ObjectType) => {
    switch (type) {
      case ObjectType.Human:
      case ObjectType.Tree:
      case ObjectType.Flower:
      case ObjectType.Polygon:
      case ObjectType.Sensor:
      case ObjectType.Light:
      case ObjectType.SolarPanel:
      case ObjectType.ParabolicDish:
      case ObjectType.ParabolicTrough:
      case ObjectType.FresnelReflector:
      case ObjectType.Heliostat:
      case ObjectType.WindTurbine:
      case ObjectType.Wall:
        return true;
      default:
        return false;
    }
  };

  const findMagnetPoint = (pointer: Vector3, minDist: number) => {
    let min = minDist;
    let targetPoint: Vector3 | null = null;
    let targetID: string | null = null;
    let targetSide: WallSide | null = null;
    let jointId: string | undefined = undefined;
    if (!useStore.getState().enableFineGrid) {
      for (const [id, wall] of wallMapOnFoundation.current) {
        if (id === addedWallIdRef.current || (grabRef.current && id === grabRef.current.id)) continue;
        const leftPoint = new Vector3(wall.leftPoint[0], wall.leftPoint[1], 0);
        const rightPoint = new Vector3(wall.rightPoint[0], wall.rightPoint[1], 0);
        const distStart = leftPoint?.distanceTo(pointer) ?? Number.MAX_VALUE;
        const distEnd = rightPoint?.distanceTo(pointer) ?? Number.MAX_VALUE;
        const flag = distStart <= distEnd;
        const dist = flag ? distStart : distEnd;
        const point = flag ? leftPoint : rightPoint;
        if (dist <= min + 0.01) {
          min = dist;
          targetPoint = point;
          jointId = flag ? wall.leftJoints[0] : wall.rightJoints[0];
          targetID = id;
          targetSide = flag ? WallSide.Left : WallSide.Right;
          // if (targetID && !jointId) {
          //   return { id: targetID, point: targetPoint, side: targetSide, jointId };
          // }
        }
      }
    }
    return { id: targetID, point: targetPoint, side: targetSide, jointId } as SnapTargetType;
  };

  const updatePointer = (p: Vector3, targetPoint?: Vector3 | null) => {
    if (!useStore.getState().enableFineGrid) {
      if (targetPoint) {
        p = targetPoint;
      } else {
        p = Util.snapToNormalGrid(p);
      }
    } else {
      p = Util.snapToFineGrid(p);
      targetPoint = null;
    }
    return p;
  };

  const flipWallLoop = (currentWallId: string) => {
    wallMapOnFoundation.current.clear();
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.Wall && e.parentId === id) {
        wallMapOnFoundation.current.set(e.id, e as WallModel);
      }
    }
    let wall = wallMapOnFoundation.current.get(currentWallId);
    while (wall && wall.leftJoints.length > 0) {
      const wallCopy = wallMapOnFoundation.current.get(wall.id) as WallModel;
      if (!wallCopy) {
        break;
      }

      setCommonStore((state) => {
        for (const e of state.elements) {
          if (e.id === wallCopy.id) {
            const w = e as WallModel;
            w.relativeAngle = (wallCopy.relativeAngle + Math.PI) % TWO_PI;
            w.leftPoint = [...wallCopy.rightPoint];
            w.rightPoint = [...wallCopy.leftPoint];
            w.leftJoints = [wallCopy.rightJoints[0]];
            w.rightJoints = [wallCopy.leftJoints[0]];
            break;
          }
        }
      });

      wall = wallMapOnFoundation.current.get(wall.leftJoints[0]);
      if (wall && wall!.id === currentWallId) {
        break;
      }
    }

    setCommonStore((state) => {
      state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
      if (useStore.getState().resizeHandleType) {
        state.resizeHandleType =
          useStore.getState().resizeHandleType === ResizeHandleType.LowerLeft
            ? ResizeHandleType.LowerRight
            : ResizeHandleType.LowerLeft;
      }
    });

    flippedWallSide.current =
      flippedWallSide.current === FlippedWallSide.null ? FlippedWallSide.loop : FlippedWallSide.null;
  };

  const flipWallsClockwise = (currWall: WallModel, targetWall?: WallModel) => {
    wallMapOnFoundation.current.clear();
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.Wall && e.parentId === id) {
        wallMapOnFoundation.current.set(e.id, e as WallModel);
      }
    }
    const flipWallHead = currWall;
    let flipWall = currWall;
    while (flipWall) {
      const flipWallCopy = wallMapOnFoundation.current.get(flipWall.id) as WallModel;
      if (!flipWallCopy) {
        break;
      }
      setCommonStore((state) => {
        for (const e of state.elements) {
          if (flipWallCopy && e.id === flipWallCopy.id) {
            const wall = e as WallModel;
            wall.relativeAngle = (flipWallCopy.relativeAngle + Math.PI) % TWO_PI;
            wall.leftPoint = [...flipWallCopy.rightPoint];
            wall.rightPoint = [...flipWallCopy.leftPoint];
            wall.leftJoints = flipWallCopy.rightJoints.length > 0 ? [flipWallCopy.rightJoints[0]] : [];
            wall.rightJoints = flipWallCopy.leftJoints.length > 0 ? [flipWallCopy.leftJoints[0]] : [];
            break;
          }
        }
      });
      let nextWall: WallModel | undefined = undefined;
      if (flipWallCopy.leftJoints.length > 0) {
        nextWall = wallMapOnFoundation.current.get(flipWallCopy.leftJoints[0]);
      }
      if (nextWall && nextWall.id !== flipWallHead.id) {
        flipWall = nextWall;
      } else {
        break;
      }
    }
    setCommonStore((state) => {
      if (targetWall) {
        for (const e of state.elements) {
          if (e.type === ObjectType.Wall) {
            if (e.id === flipWallHead.id) {
              (e as WallModel).leftJoints = [targetWall.id];
            }
            if (e.id === targetWall.id) {
              (e as WallModel).rightJoints = [flipWallHead.id];
            }
          }
        }
      }
      state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
      state.resizeHandleType = ResizeHandleType.LowerLeft;
    });

    // side after flip
    flippedWallSide.current =
      flippedWallSide.current === FlippedWallSide.null ? FlippedWallSide.right : FlippedWallSide.null;
  };

  const flipWallsCounterClockwise = (currWall: WallModel, targetWall?: WallModel) => {
    wallMapOnFoundation.current.clear();
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.Wall && e.parentId === id) {
        wallMapOnFoundation.current.set(e.id, e as WallModel);
      }
    }
    const flipWallHead = currWall;
    let flipWall = currWall;
    while (flipWall) {
      const flipWallCopy = wallMapOnFoundation.current.get(flipWall.id) as WallModel;
      if (!flipWallCopy) {
        break;
      }
      setCommonStore((state) => {
        for (const e of state.elements) {
          if (flipWallCopy && e.id === flipWallCopy.id) {
            const wall = e as WallModel;
            wall.relativeAngle = (flipWallCopy.relativeAngle + Math.PI) % TWO_PI;
            wall.leftPoint = [...flipWallCopy.rightPoint];
            wall.rightPoint = [...flipWallCopy.leftPoint];
            wall.leftJoints = flipWallCopy.rightJoints.length > 0 ? [flipWallCopy.rightJoints[0]] : [];
            wall.rightJoints = flipWallCopy.leftJoints.length > 0 ? [flipWallCopy.leftJoints[0]] : [];
            break;
          }
        }
      });
      let nextWall: WallModel | undefined = undefined;
      if (flipWallCopy.rightJoints.length > 0) {
        nextWall = wallMapOnFoundation.current.get(flipWallCopy.rightJoints[0]);
      }
      if (nextWall && nextWall.id !== flipWallHead.id) {
        flipWall = nextWall;
      } else {
        break;
      }
    }
    setCommonStore((state) => {
      if (targetWall) {
        for (const e of state.elements) {
          if (e.type === ObjectType.Wall) {
            if (e.id === flipWallHead.id) {
              (e as WallModel).rightJoints = [targetWall.id];
            }
            if (e.id === targetWall.id) {
              (e as WallModel).leftJoints = [flipWallHead.id];
            }
          }
        }
      }
      state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
      state.resizeHandleType = ResizeHandleType.LowerRight;
    });
    // side after flip
    flippedWallSide.current =
      flippedWallSide.current === FlippedWallSide.null ? FlippedWallSide.left : FlippedWallSide.null;
  };

  const checkWallLoop = (currentWallId: string) => {
    let wall: WallModel | undefined = undefined;

    wallMapOnFoundation.current.clear();
    for (const e of useStore.getState().elements) {
      if (e.id === currentWallId) {
        wall = e as WallModel;
      }
      if (e.type === ObjectType.Wall && e.parentId === id) {
        wallMapOnFoundation.current.set(e.id, e as WallModel);
      }
    }

    // check is loop closed
    let isClosed = false;
    while (wall && wall.leftJoints.length > 0) {
      wall = wallMapOnFoundation.current.get(wall.leftJoints[0]);
      if (wall?.id === currentWallId) {
        isClosed = true;
        break;
      }
    }

    if (isClosed) {
      // get interior angle sum
      let totalAngle = 0;
      let totalNumber = 0;
      while (wall && wall.leftJoints.length > 0) {
        const targetWall = wallMapOnFoundation.current.get(wall.leftJoints[0]);
        const deltaAngle = (Math.PI * 3 - (wall.relativeAngle - targetWall!.relativeAngle)) % TWO_PI;
        totalAngle += deltaAngle;
        totalNumber += 1;
        wall = targetWall;
        if (wall!.id === currentWallId) {
          break;
        }
      }

      // check if it needs a flip
      if (totalAngle > (totalNumber - 2) * Math.PI + 0.1) {
        flipWallLoop(currentWallId);
      } else {
        if (flippedWallSide.current !== FlippedWallSide.null) {
          flippedWallSide.current = FlippedWallSide.loop;
        }
      }
    }

    return isClosed;
  };

  const handleUndoableAdd = (element: ElementModel) => {
    const undoableAdd = {
      name: 'Add',
      timestamp: Date.now(),
      addedElement: element,
      undo: () => {
        removeElementById(undoableAdd.addedElement.id, false);
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

  const handleUndoableAddWall = (element: WallModel) => {
    const undoableAdd = {
      name: 'Add',
      timestamp: Date.now(),
      addedElement: element,
      flippedWallSide: flippedWallSide.current,
      undo: () => {
        const wall = undoableAdd.addedElement as WallModel;
        removeElementById(wall.id, false);
        if (
          (undoableAdd.flippedWallSide === FlippedWallSide.right ||
            undoableAdd.flippedWallSide === FlippedWallSide.loop) &&
          wall.rightJoints.length > 0
        ) {
          const rightWall = getElementById(wall.rightJoints[0]);
          if (rightWall) {
            flipWallsCounterClockwise(rightWall as WallModel);
          }
        } else if (undoableAdd.flippedWallSide === FlippedWallSide.left && wall.leftJoints.length > 0) {
          const leftWall = getElementById(wall.leftJoints[0]);
          if (leftWall) {
            flipWallsClockwise(leftWall as WallModel);
          }
        }
      },
      redo: () => {
        const wall = undoableAdd.addedElement as WallModel;
        if (
          undoableAdd.flippedWallSide === FlippedWallSide.right ||
          (undoableAdd.flippedWallSide === FlippedWallSide.loop && wall.rightJoints.length > 0)
        ) {
          const rightWall = getElementById(wall.rightJoints[0]);
          if (rightWall) {
            flipWallsClockwise(rightWall as WallModel);
          }
        } else if (undoableAdd.flippedWallSide === FlippedWallSide.left && wall.leftJoints.length > 0) {
          const leftWall = getElementById(wall.leftJoints[0]);
          if (leftWall) {
            flipWallsCounterClockwise(leftWall as WallModel);
          }
        }
        if (wall.rightJoints.length > 0) {
          updateWallLeftJointsById(wall.rightJoints[0], [wall.id]);
        }
        if (wall.leftJoints.length > 0) {
          updateWallRightJointsById(wall.leftJoints[0], [wall.id]);
        }
        setCommonStore((state) => {
          state.elements.push(wall);
          state.selectedElement = wall;
          state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
        });
      },
    } as UndoableAddWall;
    addUndoable(undoableAdd);
  };

  const handleUndoableResizeWall = (element: WallModel) => {
    const autoDeletedElement = useStore.getState().getAutoDeletedElements();
    const undoableResize = {
      name: 'Resize Wall',
      timestamp: Date.now(),
      resizedElementId: element.id,
      resizedElementType: element.type,
      oldPosition: oldPositionRef.current.clone(),
      newPosition: newPositionRef.current.clone(),
      oldDimension: oldDimensionRef.current.clone(),
      newDimension: newDimensionRef.current.clone(),
      oldAngle: oldAzimuthRef.current,
      newAngle: newAzimuthRef.current,
      oldJoints: [[...oldJointsRef.current[0]], [...oldJointsRef.current[1]]],
      newJoints: [[...newJointsRef.current[0]], [...newJointsRef.current[1]]],
      oldPoint: [[...oldPointRef.current[0]], [...oldPointRef.current[1]]],
      newPoint: [[...newPointRef.current[0]], [...newPointRef.current[1]]],
      flippedWallSide: flippedWallSide.current,
      autoDeletedElement: autoDeletedElement ? [...autoDeletedElement] : [],
      undo: () => {
        switch (undoableResize.flippedWallSide) {
          case FlippedWallSide.right:
            if (undoableResize.newJoints[1]) {
              const rightWall = getElementById(undoableResize.newJoints[1][0]);
              if (rightWall) {
                flipWallsCounterClockwise(rightWall as WallModel);
              }
            }
            break;
          case FlippedWallSide.left:
            if (undoableResize.newJoints[0]) {
              const leftWall = getElementById(undoableResize.newJoints[0][0]);
              if (leftWall) {
                flipWallsClockwise(leftWall as WallModel);
              }
            }
            break;
          case FlippedWallSide.loop:
            if (undoableResize.newJoints[0] && undoableResize.newJoints[1]) {
              flipWallLoop(undoableResize.resizedElementId);
            } else if (undoableResize.newJoints[1]) {
              const rightWall = getElementById(undoableResize.newJoints[1][0]);
              if (rightWall) {
                flipWallsCounterClockwise(rightWall as WallModel);
              }
            } else if (undoableResize.newJoints[0]) {
              const leftWall = getElementById(undoableResize.newJoints[0][0]);
              if (leftWall) {
                flipWallsClockwise(leftWall as WallModel);
              }
            }
            break;
        }
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.id === undoableResize.resizedElementId) {
              const w = e as WallModel;
              w.cx = undoableResize.oldPosition.x;
              w.cy = undoableResize.oldPosition.y;
              w.cz = undoableResize.oldPosition.z;
              w.lx = undoableResize.oldDimension.x;
              w.ly = undoableResize.oldDimension.y;
              w.lz = undoableResize.oldDimension.z;
              w.relativeAngle = undoableResize.oldAngle;
              w.leftJoints = [...undoableResize.oldJoints[0]];
              w.rightJoints = [...undoableResize.oldJoints[1]];
              w.leftPoint = [...undoableResize.oldPoint[0]];
              w.rightPoint = [...undoableResize.oldPoint[1]];

              switch (undoableResize.flippedWallSide) {
                case FlippedWallSide.loop: {
                  // old left
                  if (undoableResize.oldJoints[0] !== undoableResize.newJoints[1]) {
                    for (const n of state.elements) {
                      if (n.type === ObjectType.Wall) {
                        if (n.id === undoableResize.newJoints[1][0]) {
                          (n as WallModel).rightJoints = [];
                        }
                        if (n.id === undoableResize.oldJoints[0][0]) {
                          (n as WallModel).rightJoints = [undoableResize.resizedElementId];
                        }
                      }
                    }
                  }
                  // old right
                  else if (undoableResize.oldJoints[1] !== undoableResize.newJoints[0]) {
                    for (const n of state.elements) {
                      if (n.type === ObjectType.Wall) {
                        if (n.id === undoableResize.newJoints[0][0]) {
                          (n as WallModel).leftJoints = [];
                        }
                        if (n.id === undoableResize.oldJoints[1][0]) {
                          (n as WallModel).leftJoints = [undoableResize.resizedElementId];
                        }
                      }
                    }
                  }
                  break;
                }
                case FlippedWallSide.left:
                case FlippedWallSide.right: {
                  // old left attach, do: new right detach
                  if (!undoableResize.oldJoints[0] && undoableResize.newJoints[1]) {
                    for (const n of state.elements) {
                      if (n.type === ObjectType.Wall && n.id === undoableResize.newJoints[1][0]) {
                        (n as WallModel).leftJoints = [];
                        break;
                      }
                    }
                  }
                  // old right attach, do: new left detach
                  else if (!undoableResize.oldJoints[1] && undoableResize.newJoints[0]) {
                    for (const n of state.elements) {
                      if (n.type === ObjectType.Wall && n.id === undoableResize.newJoints[0][0]) {
                        (n as WallModel).rightJoints = [];
                        break;
                      }
                    }
                  }
                  // change old left attach side
                  else if (undoableResize.flippedWallSide === FlippedWallSide.left && undoableResize.oldJoints[0]) {
                    for (const n of state.elements) {
                      if (n.type === ObjectType.Wall) {
                        if (n.id === undoableResize.newJoints[1][0]) {
                          (n as WallModel).leftJoints = [];
                        }
                        if (n.id === undoableResize.oldJoints[0][0]) {
                          (n as WallModel).rightJoints = [w.id];
                        }
                      }
                    }
                  }
                  // change old right attach side
                  else if (undoableResize.flippedWallSide === FlippedWallSide.right && undoableResize.oldJoints[1]) {
                    for (const n of state.elements) {
                      if (n.type === ObjectType.Wall) {
                        if (n.id === undoableResize.newJoints[0][0]) {
                          (n as WallModel).rightJoints = [];
                        }
                        if (n.id === undoableResize.oldJoints[1][0]) {
                          (n as WallModel).leftJoints = [w.id];
                        }
                      }
                    }
                  }
                  break;
                }
                case FlippedWallSide.null: {
                  // left handle
                  if (undoableResize.oldJoints[0] !== undoableResize.newJoints[0]) {
                    for (const n of state.elements) {
                      if (n.type === ObjectType.Wall) {
                        if (n.id === undoableResize.newJoints[0][0]) {
                          (n as WallModel).rightJoints = [];
                        }
                        if (n.id === undoableResize.oldJoints[0][0]) {
                          (n as WallModel).rightJoints = [w.id];
                        }
                      }
                    }
                  }
                  // right handle
                  if (undoableResize.oldJoints[1] !== undoableResize.newJoints[1]) {
                    for (const n of state.elements) {
                      if (n.type === ObjectType.Wall) {
                        if (n.id === undoableResize.newJoints[1][0]) {
                          (n as WallModel).leftJoints = [];
                        }
                        if (n.id === undoableResize.oldJoints[1][0]) {
                          (n as WallModel).leftJoints = [w.id];
                        }
                      }
                    }
                  }
                  state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
                  break;
                }
              }
              break;
            }
          }
          state.elements.push(...undoableResize.autoDeletedElement);
          state.resizeHandleType = null;
          state.deletedRoofId = null;
          state.autoDeletedRoofs = null;
          state.autoDeletedRoofIdSet.clear();
          state.autoDeletedChild = null;
        });
        flippedWallSide.current = FlippedWallSide.null;
      },
      redo: () => {
        if (undoableResize.autoDeletedElement.length > 0) {
          removeElementById(undoableResize.autoDeletedElement[0].id, false, false, true);
        }
        const deletedIdSet = new Set(undoableResize.autoDeletedElement.map((e) => e.id));
        setCommonStore((state) => {
          state.elements = state.elements.filter((e) => !deletedIdSet.has(e.id));
          for (const e of state.elements) {
            if (e.id === undoableResize.resizedElementId) {
              const w = e as WallModel;
              w.cx = undoableResize.newPosition.x;
              w.cy = undoableResize.newPosition.y;
              w.cz = undoableResize.newPosition.z;
              w.lx = undoableResize.newDimension.x;
              w.ly = undoableResize.newDimension.y;
              w.lz = undoableResize.newDimension.z;

              switch (undoableResize.flippedWallSide) {
                case FlippedWallSide.left:
                  w.relativeAngle = (undoableResize.newAngle + Math.PI) % TWO_PI;
                  for (const n of state.elements) {
                    if (n.type === ObjectType.Wall && n.id === undoableResize.oldJoints[0][0]) {
                      (n as WallModel).rightJoints = [];
                      break;
                    }
                  }
                  break;
                case FlippedWallSide.right:
                  w.relativeAngle = (undoableResize.newAngle + Math.PI) % TWO_PI;
                  for (const n of state.elements) {
                    if (n.type === ObjectType.Wall && n.id === undoableResize.oldJoints[1][0]) {
                      (n as WallModel).leftJoints = [];
                      break;
                    }
                  }
                  break;
                case FlippedWallSide.loop:
                  w.relativeAngle = (undoableResize.newAngle + Math.PI) % TWO_PI;
                  w.leftJoints = [...undoableResize.newJoints[1]];
                  w.rightJoints = [...undoableResize.newJoints[0]];
                  w.leftPoint = [...undoableResize.newPoint[1]];
                  w.rightPoint = [...undoableResize.newPoint[0]];
                  for (const n of state.elements) {
                    if (n.type === ObjectType.Wall) {
                      if (n.id === undoableResize.newJoints[0][0]) {
                        (n as WallModel).leftJoints = [w.id];
                      }
                      if (n.id === undoableResize.newJoints[1][0]) {
                        (n as WallModel).rightJoints = [w.id];
                      }
                    }
                  }
                  break;
                case FlippedWallSide.null:
                  w.relativeAngle = undoableResize.newAngle;
                  w.leftJoints = [...undoableResize.newJoints[0]];
                  w.rightJoints = [...undoableResize.newJoints[1]];
                  w.leftPoint = [...undoableResize.newPoint[0]];
                  w.rightPoint = [...undoableResize.newPoint[1]];
                  // left handle
                  if (undoableResize.oldJoints[0][0] !== undoableResize.newJoints[0][0]) {
                    // left handle
                    for (const n of state.elements) {
                      if (n.type === ObjectType.Wall) {
                        if (n.id === undoableResize.newJoints[0][0]) {
                          (n as WallModel).rightJoints = [w.id];
                        }
                        if (n.id === undoableResize.oldJoints[0][0]) {
                          (n as WallModel).rightJoints = [];
                        }
                      }
                    }
                  }
                  // right handle
                  if (undoableResize.oldJoints[1][0] !== undoableResize.newJoints[1][0]) {
                    for (const n of state.elements) {
                      if (n.type === ObjectType.Wall) {
                        if (n.id === undoableResize.newJoints[1][0]) {
                          (n as WallModel).leftJoints = [w.id];
                        }
                        if (n.id === undoableResize.oldJoints[1][0]) {
                          (n as WallModel).leftJoints = [];
                        }
                      }
                    }
                  }
                  state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
                  break;
              }
              break;
            }
          }
          state.resizeHandleType = null;
        });
        setTimeout(() => {
          setCommonStore((state) => {
            state.deletedRoofId = null;
            state.autoDeletedRoofs = null;
            state.autoDeletedRoofIdSet.clear();
          });
        });
        switch (undoableResize.flippedWallSide) {
          case FlippedWallSide.left: {
            const currWall = getElementById(undoableResize.resizedElementId) as WallModel;
            const targetWall = getElementById(undoableResize.newJoints[1][0]) as WallModel;
            flipWallsCounterClockwise(currWall, targetWall);
            break;
          }
          case FlippedWallSide.right: {
            const currWall = getElementById(undoableResize.resizedElementId) as WallModel;
            const targetWall = getElementById(undoableResize.newJoints[0][0]) as WallModel;
            flipWallsClockwise(currWall, targetWall);
            break;
          }
          case FlippedWallSide.loop:
            wallMapOnFoundation.current.clear();
            for (const e of useStore.getState().elements) {
              if (e.type === ObjectType.Wall && e.parentId === id) {
                wallMapOnFoundation.current.set(e.id, e as WallModel);
              }
            }
            flipWallLoop(undoableResize.resizedElementId);
            break;
        }
        flippedWallSide.current = FlippedWallSide.null;
      },
    } as UndoableResizeWall;
    addUndoable(undoableResize);
    setCommonStore((state) => {
      state.actionState.wallHeight = element.lz;
      state.deletedRoofId = null;
      state.autoDeletedRoofs = null;
      state.autoDeletedRoofIdSet.clear();
      state.autoDeletedChild = [];
    });
  };

  const handleUndoableMoveWall = (wall: WallModel, newAngle: number, newJoints: string[][]) => {
    if (!wall.roofId) {
      const undoableMove = {
        name: 'Move Wall',
        timestamp: Date.now(),
        id: wall.id,
        oldPoints: [[...oldPointRef.current[0]], [...oldPointRef.current[1]]],
        newPoints: [[...wall.leftPoint], [...wall.rightPoint]],
        oldJoints: [[...oldJointsRef.current[0]], [...oldJointsRef.current[1]]],
        newJoints: [[...newJoints[0]], [...newJoints[1]]],
        oldAngle: oldAzimuthRef.current,
        newAngle: newAngle,
        flippedWallSide: flippedWallSide.current,
        undo() {
          switch (this.flippedWallSide) {
            case FlippedWallSide.loop:
              flipWallLoop(this.id);
              break;
            case FlippedWallSide.left:
              const lw = getElementById(this.newJoints[0][0]) as WallModel;
              if (lw) {
                flipWallsClockwise(lw);
              }
              break;
            case FlippedWallSide.right:
              const rw = getElementById(this.newJoints[1][0]) as WallModel;
              if (rw) {
                flipWallsCounterClockwise(rw);
              }
              break;
          }
          const [oldLeftJoints, oldRightJoints] = this.oldJoints;
          const [newLeftJoints, newRightJoints] = this.newJoints;
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === this.id) {
                const [leftPoint, rightPoint] = this.oldPoints;
                e.cx = (leftPoint[0] + rightPoint[0]) / 2;
                e.cy = (leftPoint[1] + rightPoint[1]) / 2;
                e.lx = Math.hypot(leftPoint[0] - rightPoint[0], leftPoint[1] - rightPoint[1]);
                const w = e as WallModel;
                w.relativeAngle = this.oldAngle;
                w.leftPoint = [...leftPoint];
                w.rightPoint = [...rightPoint];
                w.leftJoints = [...oldLeftJoints];
                w.rightJoints = [...oldRightJoints];
                break;
              }
            }
            state.resizeHandleType = null;
          });
          if (oldLeftJoints[0] !== newLeftJoints[0]) {
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall) {
                  if (e.id === oldLeftJoints[0]) {
                    (e as WallModel).rightJoints = [this.id];
                  }
                  if (e.id === newLeftJoints[0]) {
                    if (this.flippedWallSide !== FlippedWallSide.left) {
                      (e as WallModel).rightJoints = [];
                    } else {
                      (e as WallModel).leftJoints = [];
                    }
                  }
                }
              }
            });
          }
          if (oldRightJoints[0] !== newRightJoints[0]) {
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall) {
                  if (e.id === oldRightJoints[0]) {
                    (e as WallModel).leftJoints = [this.id];
                  }
                  if (e.id === newRightJoints[0]) {
                    if (this.flippedWallSide !== FlippedWallSide.right) {
                      (e as WallModel).leftJoints = [];
                    } else {
                      (e as WallModel).rightJoints = [];
                    }
                  }
                }
              }
            });
          }
          flippedWallSide.current = FlippedWallSide.null;
        },
        redo() {
          const [oldLeftJoints, oldRightJoints] = this.oldJoints;
          const [newLeftJoints, newRightJoints] = this.newJoints;
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === this.id && e.type === ObjectType.Wall) {
                const [leftPoint, rightPoint] = this.newPoints;
                e.cx = (leftPoint[0] + rightPoint[0]) / 2;
                e.cy = (leftPoint[1] + rightPoint[1]) / 2;
                e.lx = Math.hypot(leftPoint[0] - rightPoint[0], leftPoint[1] - rightPoint[1]);
                const w = e as WallModel;
                w.relativeAngle = this.newAngle;
                w.leftPoint = [...leftPoint];
                w.rightPoint = [...rightPoint];
                w.leftJoints = [...newLeftJoints];
                w.rightJoints = [...newRightJoints];
                break;
              }
            }
          });
          if (oldLeftJoints[0] !== newLeftJoints[0]) {
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall) {
                  if (e.id === oldLeftJoints[0]) {
                    (e as WallModel).rightJoints = [];
                  }
                  if (e.id === newLeftJoints[0]) {
                    if (this.flippedWallSide === FlippedWallSide.right) {
                      (e as WallModel).leftJoints = [this.id];
                    } else {
                      (e as WallModel).rightJoints = [this.id];
                    }
                  }
                }
              }
            });
          }
          if (oldRightJoints[0] !== newRightJoints[0]) {
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall) {
                  if (e.id === oldRightJoints[0]) {
                    (e as WallModel).leftJoints = [];
                  }
                  if (e.id === newRightJoints[0]) {
                    if (this.flippedWallSide === FlippedWallSide.right) {
                      (e as WallModel).rightJoints = [this.id];
                    } else {
                      (e as WallModel).leftJoints = [this.id];
                    }
                  }
                }
              }
            });
          }
          switch (this.flippedWallSide) {
            case FlippedWallSide.loop:
              flipWallLoop(this.id);
              break;
            case FlippedWallSide.left:
              const lw = getElementById(this.newJoints[0][0]) as WallModel;
              if (lw) {
                flipWallsCounterClockwise(lw);
              }
              break;
            case FlippedWallSide.right:
              const rw = getElementById(this.newJoints[1][0]) as WallModel;
              if (rw) {
                flipWallsClockwise(rw);
              }
              break;
          }
          setCommonStore((state) => {
            state.resizeHandleType = null;
          });
          flippedWallSide.current = FlippedWallSide.null;
        },
      } as UndoableMoveWall;
      addUndoable(undoableMove);
    } else {
      listenToAutoDeletionRef.current = true;
      undoableMoveWallArgsRef.current = { wall, newAngle, newJoints: [[...newJoints[0]], [...newJoints[1]]] };
    }
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2) {
      if (e.altKey) {
        selectMe(id, e, ActionType.Select);
      }
      return;
    }
    setCommonStore((state) => {
      state.contextMenuObjectType = null;
    });
    if (useStore.getState().objectTypeToAdd !== ObjectType.Window && !isAddingElement()) {
      selectMe(id, e, ActionType.Select);
    }
    const selectedElement = getSelectedElement();
    let bypass = false;
    if (
      e.intersections[0].object.name === ObjectType.Polygon &&
      useStore.getState().objectTypeToAdd !== ObjectType.None
    ) {
      bypass = true;
    }
    // no child of this foundation is clicked
    if (selectedElement?.id === id || bypass) {
      if (useStore.getState().groupActionMode) {
        useStore.getState().setGroupMasterId(id);
      }
      if (legalOnFoundation(useStore.getState().objectTypeToAdd)) {
        if (foundationModel) {
          setShowGrid(true);
          const position = e.intersections.filter(
            (obj) => !obj.eventObject.name.startsWith('Wall Intersection Plane'),
          )[0].point;
          const addedElement = addElement(foundationModel, position);
          if (addedElement) {
            handleUndoableAdd(addedElement);
          }
          setCommonStore((state) => {
            if (!state.actionModeLock) state.objectTypeToAdd = ObjectType.None;
          });
        }
      } else {
        useRefStore.getState().selectNone();
        useRefStore.setState((state) => {
          state.foundationRef = groupRef;
        });
      }
    }
    // a child of this foundation is clicked
    else {
      if (selectedElement && selectedElement.parentId === id) {
        if (legalOnFoundation(selectedElement.type)) {
          grabRef.current = selectedElement;
          if (selectedElement.type === ObjectType.Wall && !isSettingWallStartPointRef.current) {
            elementsStateBeforeResizingRef.current = [...useStore.getState().elements];
          }
          setShowGrid(true);
          oldPositionRef.current.set(selectedElement.cx, selectedElement.cy, selectedElement.cz);
          oldDimensionRef.current.set(selectedElement.lx, selectedElement.ly, selectedElement.lz);
          switch (selectedElement.type) {
            case ObjectType.SolarPanel:
            case ObjectType.ParabolicTrough:
            case ObjectType.FresnelReflector:
              oldAzimuthRef.current = (selectedElement as SolarCollector).relativeAzimuth;
              break;
            case ObjectType.Polygon:
              oldVerticesRef.current = (selectedElement as PolygonModel).vertices.map((v) => ({ ...v }));
              break;
            case ObjectType.Wall:
              const wall = selectedElement as WallModel;
              oldAzimuthRef.current = wall.relativeAngle;
              oldJointsRef.current = [[...wall.leftJoints], [...wall.rightJoints]];
              oldPointRef.current = [[...wall.leftPoint], [...wall.rightPoint]];
              wallNewLeftJointIdRef.current = wall.leftJoints[0];
              wallNewRightJointIdRef.current = wall.rightJoints[0];
              wallMapOnFoundation.current.clear();
              for (const e of useStore.getState().elements) {
                if (e.type === ObjectType.Wall && e.parentId === id) {
                  wallMapOnFoundation.current.set(e.id, e as WallModel);
                }
              }
          }
        }
      }
    }

    if (isSettingWallStartPointRef.current && addedWallIdRef.current && baseRef.current) {
      const intersects = ray.intersectObjects([baseRef.current]);
      if (intersects.length === 0) return;
      let p = Util.wallRelativePosition(intersects[0].point, foundationModel);

      if (wallAuxToWallArray[0].position) {
        p.setX(wallAuxToWallArray[0].position[0]);
        p.setY(wallAuxToWallArray[0].position[1]);
      }

      const { id: targetID, point: targetPoint, side: targetSide, jointId: targetJointId } = findMagnetPoint(p, 1.5);
      p = updatePointer(p, targetPoint);

      let resizeHandleType = ResizeHandleType.LowerRight;

      // attach to other wall
      if (targetID) {
        const targetWall = getElementById(targetID) as WallModel;

        // left to right
        if (targetSide === WallSide.Right) {
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.type === ObjectType.Wall) {
                if (e.id === addedWallIdRef.current) {
                  const wall = e as WallModel;
                  wall.cx = p.x;
                  wall.cy = p.y;
                  if (targetWall.rightJoints.length === 0) {
                    wall.leftJoints = [targetWall.id];
                  }
                }
                if (e.id === targetID && targetWall.rightJoints.length === 0) {
                  (e as WallModel).rightJoints = addedWallIdRef.current ? [addedWallIdRef.current] : [];
                }
              }
            }
          });
        }
        // left to left
        else if (targetSide === WallSide.Left && !targetJointId) {
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.type === ObjectType.Wall) {
                if (e.id === addedWallIdRef.current) {
                  const wall = e as WallModel;
                  wall.cx = p.x;
                  wall.cy = p.y;
                  if (targetWall.leftJoints.length === 0) {
                    wall.rightJoints = [targetWall.id];
                  }
                }
                if (e.id === targetID && targetWall.leftJoints.length === 0) {
                  (e as WallModel).leftJoints = addedWallIdRef.current ? [addedWallIdRef.current] : [];
                }
              }
            }
          });
          resizeHandleType = ResizeHandleType.LowerLeft;
        }
      }
      // no attach to wall
      else {
        setElementPosition(addedWallIdRef.current, p.x, p.y);
      }
      isSettingWallStartPointRef.current = false;
      isSettingWallEndPointRef.current = true;
      updateWallLeftPointById(addedWallIdRef.current, [p.x, p.y, p.z]);
      setCommonStore((state) => {
        state.resizeHandleType = resizeHandleType;
        state.resizeAnchor = Util.wallAbsolutePosition(p, foundationModel);
      });
      useRefStore.getState().setEnableOrbitController(false);
      grabRef.current = selectedElement;
    }
  };

  const handlePointerUp = (e: ThreeEvent<MouseEvent>) => {
    if (e.altKey && e.button === 2) {
      // for pasting to the right-clicked position while the alt key is held down
      if (elementsToPaste && elementsToPaste.length > 0) {
        setCommonStore((state) => {
          state.pastePoint.copy(e.intersections[0].point);
          state.clickObjectType = ObjectType.Foundation;
          state.pasteNormal = UNIT_VECTOR_POS_Z;
        });
        const pastedElements = pasteElements();
        if (pastedElements.length > 0) {
          const undoablePaste = {
            name: 'Paste to Point',
            timestamp: Date.now(),
            pastedElements: pastedElements.map((m) => ({ ...m })),
            undo: () => {
              for (const elem of undoablePaste.pastedElements) {
                removeElementById(elem.id, false);
              }
            },
            redo: () => {
              setCommonStore((state) => {
                state.elements.push(...undoablePaste.pastedElements);
                state.selectedElement = undoablePaste.pastedElements[0];
              });
            },
          } as UndoablePaste;
          addUndoable(undoablePaste);
        }
      }
    }
    if (
      !grabRef.current ||
      grabRef.current.parentId !== id ||
      grabRef.current.type === ObjectType.Tree ||
      grabRef.current.type === ObjectType.Flower ||
      grabRef.current.type === ObjectType.Human
    )
      return;
    const elem = getElementById(grabRef.current.id);
    if (!elem) return;
    switch (elem.type) {
      case ObjectType.Wall: {
        const wall = elem as WallModel;
        if (isSettingWallStartPointRef.current) {
          setCommonStore((state) => {
            state.elements.pop();
            state.addedWallId = null;
            if (state.actionModeLock) {
              state.objectTypeToAdd = ObjectType.Wall;
              InnerCommonStoreState.selectNone(state);
            }
          });
          if (addedWallIdRef.current) {
            wallMapOnFoundation.current.delete(addedWallIdRef.current);
          }
          addedWallIdRef.current = null;
          isSettingWallStartPointRef.current = false;
          isSettingWallEndPointRef.current = false;
        } else if (isSettingWallEndPointRef.current && addedWallIdRef.current && baseRef.current) {
          useRefStore.getState().setEnableOrbitController(true);
          setCommonStore((state) => {
            if (state.actionModeLock) {
              state.objectTypeToAdd = ObjectType.Wall;
              InnerCommonStoreState.selectNone(state);
            }
            state.addedWallId = null;
            if (wall.lx === 0 && elementsStateBeforeResizingRef.current) {
              state.elements = [...elementsStateBeforeResizingRef.current];
              if (addedWallIdRef.current) {
                wallMapOnFoundation.current.delete(addedWallIdRef.current);
              }
            } else {
              handleUndoableAddWall(wall as WallModel);
              wallMapOnFoundation.current.set(wall.id, wall);
            }
          });
          addedWallIdRef.current = null;
          isSettingWallEndPointRef.current = false;
        } else {
          if (useStore.getState().resizeHandleType) {
            if (wall.lx > 0.45) {
              wallMapOnFoundation.current.set(wall.id, wall);
              newPositionRef.current.set(wall.cx, wall.cy, wall.cz);
              newDimensionRef.current.set(wall.lx, wall.ly, wall.lz);
              newAzimuthRef.current = wall.relativeAngle;
              newJointsRef.current = [[...wall.leftJoints], [...wall.rightJoints]];
              newPointRef.current = [[...wall.leftPoint], [...wall.rightPoint]];
              handleUndoableResizeWall(wall);
            } else {
              setCommonStore((state) => {
                if (elementsStateBeforeResizingRef.current) {
                  state.elements = [...elementsStateBeforeResizingRef.current];
                  elementsStateBeforeResizingRef.current = null;
                }
              });
            }
          } else if (useStore.getState().moveHandleType) {
            let newAngle = wall.relativeAngle;
            let newLeftJoints: string[] = [];
            let newRightJoints: string[] = [];

            if (wallNewLeftJointIdRef.current) {
              // detach old left wall
              if (
                wall.leftJoints.length > 0 &&
                (wallNewLeftJointIdRef.current !== wall.leftJoints[0] ||
                  (wallNewLeftJointIdRef.current === wall.leftJoints[0] && flipCurrWallRef.current))
              ) {
                updateWallRightJointsById(wall.leftJoints[0], []);
              }
              // attach new
              if (flipCurrWallRef.current) {
                updateWallLeftJointsById(wallNewLeftJointIdRef.current, [wall.id]);
                newRightJoints = [wallNewLeftJointIdRef.current];
              } else {
                newLeftJoints = [wallNewLeftJointIdRef.current];
                if (flipLeftHandSideWallRef.current) {
                  updateWallLeftJointsById(wallNewLeftJointIdRef.current, [wall.id]);
                  const lw = getElementById(wallNewLeftJointIdRef.current) as WallModel;
                  if (lw) {
                    flipWallsCounterClockwise(lw);
                  }
                } else {
                  updateWallRightJointsById(wallNewLeftJointIdRef.current, [wall.id]);
                }
              }
            }
            // detach old
            else if (wall.leftJoints.length > 0 && wall.leftJoints[0] !== wallNewRightJointIdRef.current) {
              newLeftJoints = [];
              updateWallRightJointsById(wall.leftJoints[0], []);
            }

            if (wallNewRightJointIdRef.current) {
              // detach old right wall
              if (
                wall.rightJoints.length > 0 &&
                (wallNewRightJointIdRef.current !== wall.rightJoints[0] ||
                  (wallNewRightJointIdRef.current === wall.rightJoints[0] && flipCurrWallRef.current)) &&
                wall.rightJoints[0] !== wallNewLeftJointIdRef.current
              ) {
                updateWallLeftJointsById(wall.rightJoints[0], []);
              }
              // attach new
              if (flipCurrWallRef.current) {
                updateWallRightJointsById(wallNewRightJointIdRef.current, [wall.id]);
                newLeftJoints = [wallNewRightJointIdRef.current!];
              } else {
                newRightJoints = [wallNewRightJointIdRef.current];
                if (flipRightHandSideWallRef.current) {
                  updateWallRightJointsById(wallNewRightJointIdRef.current, [wall.id]);
                  const rw = getElementById(wallNewRightJointIdRef.current) as WallModel;
                  if (rw) {
                    flipWallsClockwise(rw);
                  }
                } else {
                  updateWallLeftJointsById(wallNewRightJointIdRef.current, [wall.id]);
                }
              }
            }
            // detach old
            else if (wall.rightJoints.length > 0 && wall.rightJoints[0] !== wallNewLeftJointIdRef.current) {
              newRightJoints = [];
              updateWallLeftJointsById(wall.rightJoints[0], []);
            }

            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === wall.id && e.type === ObjectType.Wall) {
                  const w = e as WallModel;
                  if (flipCurrWallRef.current) {
                    newAngle = (w.relativeAngle + Math.PI) % TWO_PI;
                    w.relativeAngle = newAngle;
                    [w.leftPoint, w.rightPoint] = [[...w.rightPoint], [...w.leftPoint]];
                  }

                  if (newLeftJoints.length === 0 && newRightJoints.length === 0) {
                    w.roofId = null;
                  } else if (newLeftJoints.length > 0) {
                    const newLeftWall = state.elements.find((e) => e.id === newLeftJoints[0]) as WallModel;
                    if (newLeftWall) {
                      w.roofId = newLeftWall.roofId;
                    }
                  } else if (newRightJoints.length > 0) {
                    const newRightWall = state.elements.find((e) => e.id === newRightJoints[0]) as WallModel;
                    if (newRightWall) {
                      w.roofId = newRightWall.roofId;
                    }
                  }

                  w.leftJoints = [...newLeftJoints];
                  w.rightJoints = [...newRightJoints];
                  break;
                }
              }
              state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
            });

            checkWallLoop(wall.id);

            handleUndoableMoveWall(wall, newAngle, [[...newLeftJoints], [...newRightJoints]]);

            flipCurrWallRef.current = false;
            flipLeftHandSideWallRef.current = false;
            flipRightHandSideWallRef.current = false;
            wallNewLeftJointIdRef.current = null;
            wallNewRightJointIdRef.current = null;
          }
        }
        flippedWallSide.current = FlippedWallSide.null;
        setCommonStore((state) => {
          state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
        });
        setWallAuxToAxis({ show: false, direction: null, position: null });
        setWallAuxToWallArray([
          { show: false, direction: null, position: null },
          { show: false, direction: null, position: null },
        ]);
        break;
      }
      case ObjectType.Polygon: {
        if (useStore.getState().moveHandleType || useStore.getState().resizeHandleType) {
          newVerticesRef.current = (elem as PolygonModel).vertices.map((v) => ({ ...v }));
          const undoableEditPolygon = {
            name: useStore.getState().moveHandleType ? 'Move Polygon' : 'Resize Polygon',
            timestamp: Date.now(),
            oldValue: oldVerticesRef.current,
            newValue: newVerticesRef.current,
            changedElementId: elem.id,
            changedElementType: elem.type,
            undo: () => {
              updatePolygonVerticesById(undoableEditPolygon.changedElementId, undoableEditPolygon.oldValue as Point2[]);
            },
            redo: () => {
              updatePolygonVerticesById(undoableEditPolygon.changedElementId, undoableEditPolygon.newValue as Point2[]);
            },
          } as UndoableChange;
          addUndoable(undoableEditPolygon);
        }
        break;
      }
      default: {
        if (useStore.getState().resizeHandleType) {
          newPositionRef.current.set(elem.cx, elem.cy, elem.cz);
          newDimensionRef.current.set(elem.lx, elem.ly, elem.lz);
          if (
            newPositionRef.current.distanceToSquared(oldPositionRef.current) > ZERO_TOLERANCE ||
            newDimensionRef.current.distanceToSquared(oldDimensionRef.current) > ZERO_TOLERANCE
          ) {
            const undoableResize = {
              name: 'Resize',
              timestamp: Date.now(),
              resizedElementId: grabRef.current.id,
              resizedElementType: grabRef.current.type,
              oldCx: oldPositionRef.current.x,
              oldCy: oldPositionRef.current.y,
              oldCz: oldPositionRef.current.z,
              newCx: newPositionRef.current.x,
              newCy: newPositionRef.current.y,
              newCz: newPositionRef.current.z,
              oldLx: oldDimensionRef.current.x,
              oldLy: oldDimensionRef.current.y,
              oldLz: oldDimensionRef.current.z,
              newLx: newDimensionRef.current.x,
              newLy: newDimensionRef.current.y,
              newLz: newDimensionRef.current.z,
              undo: () => {
                setElementPosition(
                  undoableResize.resizedElementId,
                  undoableResize.oldCx,
                  undoableResize.oldCy,
                  undoableResize.oldCz,
                );
                setElementSize(
                  undoableResize.resizedElementId,
                  undoableResize.oldLx,
                  undoableResize.oldLy,
                  undoableResize.oldLz,
                );
              },
              redo: () => {
                setElementPosition(
                  undoableResize.resizedElementId,
                  undoableResize.newCx,
                  undoableResize.newCy,
                  undoableResize.newCz,
                );
                setElementSize(
                  undoableResize.resizedElementId,
                  undoableResize.newLx,
                  undoableResize.newLy,
                  undoableResize.newLz,
                );
              },
            } as UndoableResize;
            addUndoable(undoableResize);
          }
        } else if (useStore.getState().rotateHandleType) {
          // currently, solar collectors are the only type of child that can be rotated
          if (Util.isSolarCollector(grabRef.current)) {
            const collector = grabRef.current as SolarCollector;
            if (Math.abs(newAzimuthRef.current - oldAzimuthRef.current) > ZERO_TOLERANCE) {
              if (isSolarCollectorNewAzimuthOk(collector, newAzimuthRef.current)) {
                setCommonStore((state) => {
                  state.selectedElementAngle = newAzimuthRef.current;
                });
                const undoableRotate = {
                  name: 'Rotate',
                  timestamp: Date.now(),
                  oldValue: oldAzimuthRef.current,
                  newValue: newAzimuthRef.current,
                  changedElementId: collector.id,
                  changedElementType: collector.type,
                  undo: () => {
                    updateSolarCollectorRelativeAzimuthById(
                      undoableRotate.changedElementId,
                      undoableRotate.oldValue as number,
                    );
                  },
                  redo: () => {
                    updateSolarCollectorRelativeAzimuthById(
                      undoableRotate.changedElementId,
                      undoableRotate.newValue as number,
                    );
                  },
                } as UndoableChange;
                addUndoable(undoableRotate);
              } else {
                updateSolarCollectorRelativeAzimuthById(collector.id, oldAzimuthRef.current);
              }
            }
          }
        } else {
          // for moving sensors, lights, and solar collectors
          newPositionRef.current.set(elem.cx, elem.cy, elem.cz);
          if (newPositionRef.current.distanceToSquared(oldPositionRef.current) > ZERO_TOLERANCE) {
            let accept = true;
            if (Util.isSolarCollector(elem)) {
              accept = isSolarCollectorNewPositionOk(elem as SolarCollector, elem.cx, elem.cy);
            }
            if (accept) {
              const undoableMove = {
                name: 'Move',
                timestamp: Date.now(),
                movedElementId: elem.id,
                movedElementType: elem.type,
                oldCx: oldPositionRef.current.x,
                oldCy: oldPositionRef.current.y,
                oldCz: oldPositionRef.current.z,
                newCx: newPositionRef.current.x,
                newCy: newPositionRef.current.y,
                newCz: newPositionRef.current.z,
                undo: () => {
                  setElementPosition(
                    undoableMove.movedElementId,
                    undoableMove.oldCx,
                    undoableMove.oldCy,
                    undoableMove.oldCz,
                  );
                },
                redo: () => {
                  setElementPosition(
                    undoableMove.movedElementId,
                    undoableMove.newCx,
                    undoableMove.newCy,
                    undoableMove.newCz,
                  );
                },
              } as UndoableMove;
              addUndoable(undoableMove);
            } else {
              setElementPosition(elem.id, oldPositionRef.current.x, oldPositionRef.current.y, oldPositionRef.current.z);
            }
          }
        }
      }
    }
    setShowGrid(false);
    grabRef.current = null;
    setCommonStore((state) => {
      state.resizeHandleType = null;
      state.moveHandleType = null;
    });
  };

  const wallNewLeftJointIdRef = useRef<string | null>(null);
  const wallNewRightJointIdRef = useRef<string | null>(null);
  const flipCurrWallRef = useRef(false);
  const flipRightHandSideWallRef = useRef(false);
  const flipLeftHandSideWallRef = useRef(false);

  const getWallAngleByPointer = (anchor: Vector3, pointer: Vector3, handleType: ResizeHandleType) => {
    let angle =
      Math.atan2(pointer.y - anchor.y, pointer.x - anchor.x) -
      (handleType === ResizeHandleType.LowerLeft ? Math.PI : 0);
    angle = angle >= 0 ? angle : (TWO_PI + angle) % TWO_PI;
    return angle;
  };

  const alignToWall = (p: Vector3, targetId?: string | null) => {
    const THRESHOLD = 1;
    let alignedX: number | null = null;
    let alignedY: number | null = null;
    let minX = Infinity;
    let minY = Infinity;
    for (const [id, wall] of wallMapOnFoundation.current) {
      if (grabRef.current !== null && wall.id !== grabRef.current.id && wall.id !== targetId) {
        const leftXDiff = Math.abs(p.x - wall.leftPoint[0]);
        const rightXDiff = Math.abs(p.x - wall.rightPoint[0]);
        const leftYDiff = Math.abs(p.y - wall.leftPoint[1]);
        const rightYDiff = Math.abs(p.y - wall.rightPoint[1]);
        if (leftXDiff < THRESHOLD && leftXDiff < minX) {
          minX = leftXDiff;
          alignedX = wall.leftPoint[0];
        }
        if (rightXDiff < THRESHOLD && rightXDiff < minX) {
          minX = rightXDiff;
          alignedX = wall.rightPoint[0];
        }
        if (leftYDiff < THRESHOLD && leftYDiff < minY) {
          minY = leftYDiff;
          alignedY = wall.leftPoint[1];
        }
        if (rightYDiff < THRESHOLD && rightYDiff < minY) {
          minY = rightYDiff;
          alignedY = wall.rightPoint[1];
        }
      }
    }

    return [alignedX, alignedY];
  };

  const alignToAxis = (anchor: Vector3, p: Vector3, handle: ResizeHandleType) => {
    const ALIGN_ANGLE_THRESHOLD = 0.05;
    const ALIGN_LENGTH_THRESHOLD = 1;
    const angle = getWallAngleByPointer(anchor, p, handle);
    let alignedX: number | null = null;
    let alignedY: number | null = null;
    if (
      angle < ALIGN_ANGLE_THRESHOLD ||
      angle > TWO_PI - ALIGN_ANGLE_THRESHOLD ||
      Math.abs(angle - Math.PI) < ALIGN_ANGLE_THRESHOLD ||
      Math.abs(p.y - anchor.y) < ALIGN_LENGTH_THRESHOLD
    ) {
      alignedY = anchor.y;
    } else if (
      Math.abs(angle - Math.PI / 2) < ALIGN_ANGLE_THRESHOLD ||
      Math.abs(angle - (3 * Math.PI) / 2) < ALIGN_ANGLE_THRESHOLD ||
      Math.abs(p.x - anchor.x) < ALIGN_LENGTH_THRESHOLD
    ) {
      alignedX = anchor.x;
    }
    return [alignedX, alignedY];
  };

  const alignPointer = (anchor: Vector3, p: Vector3, handle: ResizeHandleType, targetId?: string | null) => {
    const [alignedToWallX, alignedToWallY] = alignToWall(p);
    const [alignedToAxisX, alignedToAxisY] = alignToAxis(anchor, p, handle); // coordinates after align to axis

    const alignedX = getClosestAlignedPoint(p.x, alignedToWallX, alignedToAxisX);
    const alignedY = getClosestAlignedPoint(p.y, alignedToWallY, alignedToAxisY);

    return new Vector3(alignedX, alignedY, p.z);
  };

  const getClosestAlignedPoint = (p: number, val1: number | null, val2: number | null) => {
    if (val1 !== null && val2 !== null) {
      return Math.abs(val1 - p) < Math.abs(val2 - p) ? val1 : val2;
    } else if (val1 !== null) {
      return val1;
    } else if (val2 !== null) {
      return val2;
    }
    return p;
  };

  const checkAndSetPosAlignToWall = (p: Vector3, idx = 0, targetId?: string | null) => {
    let [minX, minY] = [Infinity, Infinity];
    let alignedX: number | null = null;
    let alignedY: number | null = null;
    for (const [id, wall] of wallMapOnFoundation.current) {
      if (grabRef.current !== null && wall.id !== grabRef.current.id && wall.id !== targetId) {
        const leftXDiff = Math.abs(p.x - wall.leftPoint[0]);
        const rightXDiff = Math.abs(p.x - wall.rightPoint[0]);
        if (leftXDiff < 0.01 && leftXDiff < minX) {
          minX = leftXDiff;
          alignedX = wall.leftPoint[0];
        }
        if (rightXDiff < 0.01 && rightXDiff < minX) {
          minX = rightXDiff;
          alignedX = wall.rightPoint[0];
        }

        const leftYDiff = Math.abs(p.y - wall.leftPoint[1]);
        const rightYDiff = Math.abs(p.y - wall.rightPoint[1]);
        if (leftYDiff < 0.01 && leftYDiff < minY) {
          minY = leftYDiff;
          alignedY = wall.leftPoint[1];
        }
        if (rightYDiff < 0.01 && rightYDiff < minY) {
          minY = rightYDiff;
          alignedY = wall.rightPoint[1];
        }
      }
    }
    setWallAuxToWallArray(
      produce((draft) => {
        if (alignedX !== null && alignedY !== null) {
          draft[idx].direction = 'xy';
          draft[idx].position = [alignedX, alignedY];
        } else if (alignedX !== null) {
          draft[idx].direction = 'y';
          draft[idx].position = [alignedX, p.y];
        } else if (alignedY !== null) {
          draft[idx].direction = 'x';
          draft[idx].position = [p.x, alignedY];
        } else {
          draft[idx].direction = null;
          draft[idx].position = null;
        }
      }),
    );
    return [alignedX !== null, alignedY !== null];
  };

  const checkAndSetPosAlignToAxis = (p: Vector3, angle: number) => {
    if (Math.abs(angle) < 0.01 || Math.abs(angle - Math.PI) < 0.01) {
      setWallAuxToAxis((prev) => ({ ...prev, direction: 'x', position: [p.x, p.y] }));
      return [true, false];
    } else if (Math.abs(angle - Math.PI / 2) < 0.01 || Math.abs(angle - (3 * Math.PI) / 2) < 0.01) {
      setWallAuxToAxis((prev) => ({ ...prev, direction: 'y', position: [p.x, p.y] }));
      return [false, true];
    } else {
      setWallAuxToAxis((prev) => ({ ...prev, direction: null, position: null }));
      return [false, false];
    }
  };

  const setShowWallAux = (toWall: boolean, toAxis: boolean) => {
    setWallAuxToWallArray(
      produce((draft) => {
        draft[0].show = toWall;
      }),
    );
    setWallAuxToAxis((prev) => ({ ...prev, show: toAxis }));
  };

  const handleShowAuxiliary = (p: Vector3, angle: number) => {
    const [isAlignedToWallX, isAlignedToWallY] = checkAndSetPosAlignToWall(p);
    const [isAlignedToAxisX, isAlignedToAxisY] = checkAndSetPosAlignToAxis(p, angle);

    if (isAlignedToWallX && isAlignedToWallY) {
      setShowWallAux(true, false);
    } else if (isAlignedToWallX) {
      setShowWallAux(true, !isAlignedToAxisY && isAlignedToAxisX);
    } else if (isAlignedToWallY) {
      setShowWallAux(true, !isAlignedToAxisX && isAlignedToAxisY);
    } else {
      setShowWallAux(false, isAlignedToAxisX || isAlignedToAxisY);
    }
  };

  // handle pointer move
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!foundationModel) return;
    if (grabRef.current && Util.isSolarCollector(grabRef.current)) return;
    const objectTypeToAdd = useStore.getState().objectTypeToAdd;
    if (!grabRef.current && !addedWallIdRef.current && objectTypeToAdd !== ObjectType.Wall) return;
    if (grabRef.current?.parentId !== id && objectTypeToAdd === ObjectType.None) return;
    const moveHandleType = useStore.getState().moveHandleType;
    const resizeHandleType = useStore.getState().resizeHandleType;
    const resizeAnchor = useStore.getState().resizeAnchor;
    setRayCast(e);
    if (baseRef.current) {
      const intersects = ray.intersectObjects([baseRef.current]);
      if (intersects.length === 0) return;
      let p = intersects[0].point;
      if (grabRef.current && grabRef.current.type && !grabRef.current.locked && intersects.length > 0) {
        switch (grabRef.current.type) {
          case ObjectType.Sensor:
          case ObjectType.Light:
            p = Util.relativeCoordinates(p.x, p.y, p.z, foundationModel);
            setElementPosition(grabRef.current.id, p.x, p.y);
            break;
          case ObjectType.Polygon:
            const polygon = grabRef.current as PolygonModel;
            if (moveHandleType === MoveHandleType.Default) {
              // do not snap the centroid to the grid
              p = Util.relativeCoordinates(p.x, p.y, p.z, foundationModel);
              const centroid = Util.calculatePolygonCentroid(polygon.vertices);
              const dx = p.x - centroid.x;
              const dy = p.y - centroid.y;
              const copy = polygon.vertices.map((v) => ({ ...v }));
              copy.forEach((v: Point2) => {
                v.x += dx;
                v.y += dy;
              });
              // update all the vertices at once with the DEEP COPY above
              // do not update each vertex's position one by one (it is slower)
              updatePolygonVerticesById(polygon.id, copy);
            } else if (resizeHandleType === ResizeHandleType.Default) {
              // snap to the grid (do not call Util.relativeCoordinates because we have to snap in the middle)
              p.x -= foundationModel.cx;
              p.y -= foundationModel.cy;
              p.applyEuler(new Euler().fromArray(foundationModel.rotation.map((a) => -a)));
              p = useStore.getState().enableFineGrid ? Util.snapToFineGrid(p) : Util.snapToNormalGrid(p);
              p.x /= foundationModel.lx;
              p.y /= foundationModel.ly;
              updatePolygonVertexPositionById(polygon.id, polygon.selectedIndex, p.x, p.y);
            }
            break;
          case ObjectType.Wall:
            if (useStore.getState().selectedElement?.type !== ObjectType.Wall) break;
            if (
              resizeHandleType &&
              (resizeHandleType === ResizeHandleType.LowerLeft || resizeHandleType === ResizeHandleType.LowerRight)
            ) {
              const anchor = Util.wallRelativePosition(resizeAnchor, foundationModel);
              p = Util.wallRelativePosition(p, foundationModel);

              let target: SnapTargetType | null = null;

              if (useStore.getState().enableFineGrid) {
                p = Util.snapToFineGrid(p);
              } else {
                target = findMagnetPoint(p, 1.5);
                if (target?.point) {
                  p = target.point;
                } else {
                  p = Util.snapToNormalGrid(p);
                  p = alignPointer(anchor, p, resizeHandleType);

                  target = findMagnetPoint(p, 1.5);
                  if (target?.point) {
                    p = target.point;
                  }
                }
              }

              const angle = getWallAngleByPointer(anchor, p, resizeHandleType);
              handleShowAuxiliary(p, angle);

              const lx = p.distanceTo(anchor);
              const relativeCenter = new Vector3().addVectors(p, anchor).divideScalar(2);
              const leftPoint = resizeHandleType === ResizeHandleType.LowerLeft ? p : anchor;
              const rightPoint = resizeHandleType === ResizeHandleType.LowerLeft ? anchor : p;

              setCommonStore((state) => {
                for (const e of state.elements) {
                  if (e.id === grabRef.current!.id && e.type === ObjectType.Wall) {
                    const wall = e as WallModel;
                    wall.cx = relativeCenter.x;
                    wall.cy = relativeCenter.y;
                    wall.lx = lx;
                    wall.relativeAngle = angle;
                    wall.leftPoint = [leftPoint.x, leftPoint.y, 0];
                    wall.rightPoint = [rightPoint.x, rightPoint.y, 0];
                    break;
                  }
                }
              });

              const currWall = getElementById(grabRef.current.id) as WallModel;
              if (currWall) {
                // attach to other wall
                if (target && target.point) {
                  if (target.id && target.side && !target.jointId) {
                    const targetWall = getElementById(target.id) as WallModel;
                    if (targetWall) {
                      // left to left
                      if (
                        resizeHandleType === ResizeHandleType.LowerLeft &&
                        targetWall.leftJoints.length === 0 &&
                        target.side === WallSide.Left
                      ) {
                        if (currWall.leftJoints.length > 0 && currWall.leftJoints[0] !== target.id) {
                          const detachId = currWall.leftJoints[0];
                          setCommonStore((state) => {
                            for (const e of state.elements) {
                              if (e.id === detachId && e.type === ObjectType.Wall) {
                                (e as WallModel).rightJoints = [];
                                break;
                              }
                            }
                          });
                        }
                        flipWallsCounterClockwise(currWall, targetWall);
                      }
                      // right to right
                      else if (
                        resizeHandleType === ResizeHandleType.LowerRight &&
                        targetWall.rightJoints.length === 0 &&
                        target.side === WallSide.Right
                      ) {
                        if (currWall.rightJoints.length > 0 && currWall.rightJoints[0] !== target.id) {
                          const detachId = currWall.rightJoints[0];
                          setCommonStore((state) => {
                            for (const e of state.elements) {
                              if (e.id === detachId && e.type === ObjectType.Wall) {
                                (e as WallModel).leftJoints = [];
                                break;
                              }
                            }
                          });
                        }
                        flipWallsClockwise(currWall, targetWall);
                      }
                      // right to left side
                      else if (
                        resizeHandleType === ResizeHandleType.LowerRight &&
                        target.side === WallSide.Left &&
                        targetWall.leftJoints.length === 0 &&
                        targetWall.rightJoints[0] !== currWall.id
                      ) {
                        setCommonStore((state) => {
                          let detachId: string | null = null;
                          if (currWall.rightJoints.length > 0 && currWall.rightJoints[0] !== target?.id) {
                            detachId = currWall.rightJoints[0];
                          }
                          for (const e of state.elements) {
                            if (e.type === ObjectType.Wall) {
                              if (e.id === currWall.id) {
                                (e as WallModel).rightJoints = [targetWall.id];
                              }
                              if (e.id === targetWall.id) {
                                (e as WallModel).leftJoints = [currWall.id];
                              }
                              if (e.id === detachId) {
                                (e as WallModel).leftJoints = [];
                              }
                            }
                          }
                        });
                      }
                      // left to right side
                      else if (
                        resizeHandleType === ResizeHandleType.LowerLeft &&
                        target.side === WallSide.Right &&
                        targetWall.rightJoints.length === 0 &&
                        targetWall.leftJoints[0] !== currWall.id
                      ) {
                        setCommonStore((state) => {
                          let detachId: string | null = null;
                          if (currWall.leftJoints.length > 0 && currWall.leftJoints[0] !== target?.id) {
                            detachId = currWall.leftJoints[0];
                          }
                          for (const e of state.elements) {
                            if (e.type === ObjectType.Wall) {
                              if (e.id === currWall.id) {
                                (e as WallModel).leftJoints = [targetWall.id];
                              }
                              if (e.id === targetWall.id) {
                                (e as WallModel).rightJoints = [currWall.id];
                              }
                              if (e.id === detachId) {
                                (e as WallModel).rightJoints = [];
                              }
                            }
                          }
                        });
                      }

                      checkWallLoop(currWall.id);
                    }
                  }
                }
                // detach
                else {
                  if (resizeHandleType === ResizeHandleType.LowerRight && currWall.rightJoints.length > 0) {
                    const targetWallId = currWall.rightJoints[0];
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.type === ObjectType.Wall) {
                          if (e.id === currWall.id) {
                            (e as WallModel).rightJoints = [];
                          }
                          if (e.id === targetWallId) {
                            (e as WallModel).leftJoints = [];
                          }
                        }
                      }
                      state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
                    });
                  } else if (resizeHandleType === ResizeHandleType.LowerLeft && currWall.leftJoints.length > 0) {
                    const targetWallId = currWall.leftJoints[0];
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.type === ObjectType.Wall) {
                          if (e.id === currWall.id) {
                            (e as WallModel).leftJoints = [];
                          }
                          if (e.id === targetWallId) {
                            (e as WallModel).rightJoints = [];
                          }
                        }
                      }
                      state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
                    });
                  }
                }
              }
            } else if (moveHandleType) {
              const currWall = getElementById(grabRef.current.id) as WallModel;
              if (currWall) {
                p = Util.wallRelativePosition(p, foundationModel);

                const handleOffset = new Vector3();
                const euler = new Euler(0, 0, currWall.relativeAngle);
                if (moveHandleType === MoveHandleType.Lower) {
                  handleOffset.setY(handleRadius);
                } else if (moveHandleType === MoveHandleType.Upper) {
                  handleOffset.setY(-handleRadius - currWall.ly);
                }
                p.add(handleOffset.applyEuler(euler));

                const leftPoint = new Vector3().addVectors(p, new Vector3(-currWall.lx / 2, 0, 0).applyEuler(euler));
                const rightPoint = new Vector3().addVectors(p, new Vector3(currWall.lx / 2, 0, 0).applyEuler(euler));
                let leftFlip: boolean | null = null;
                let rightFlip: boolean | null = null;
                let stretched = false;

                flipCurrWallRef.current = false;
                flipLeftHandSideWallRef.current = false;
                flipRightHandSideWallRef.current = false;
                wallNewLeftJointIdRef.current = null;
                wallNewRightJointIdRef.current = null;

                const updateWallPointAfterSnap = (targetPoint: Vector3, side: 'left' | 'right') => {
                  const point = side === 'left' ? leftPoint : rightPoint;
                  const magnetOffset = new Vector3().subVectors(targetPoint, point);
                  p.add(magnetOffset);
                  leftPoint.add(magnetOffset);
                  rightPoint.add(magnetOffset);
                };

                if (!useStore.getState().enableFineGrid) {
                  let leftTarget = findMagnetPoint(leftPoint, 1);
                  if (leftTarget.point) {
                    updateWallPointAfterSnap(leftTarget.point, 'left');
                    if (leftTarget.id && (!leftTarget.jointId || leftTarget.jointId === currWall.id)) {
                      wallNewLeftJointIdRef.current = leftTarget.id;
                      leftFlip = leftTarget.side === WallSide.Left;
                    }
                  } else {
                    wallNewLeftJointIdRef.current = null;
                  }

                  let rightTarget = findMagnetPoint(rightPoint, 1);
                  if (rightTarget.point) {
                    if (!leftTarget.id) {
                      updateWallPointAfterSnap(rightTarget.point, 'right');
                    }
                    if (
                      rightTarget.id &&
                      (!rightTarget.jointId || rightTarget.jointId === currWall.id) &&
                      (leftTarget.id !== rightTarget.id || leftTarget.side !== rightTarget.side)
                    ) {
                      wallNewRightJointIdRef.current = rightTarget.id;
                      rightFlip = rightTarget.side === WallSide.Right;
                    }
                  } else {
                    wallNewRightJointIdRef.current = null;
                  }

                  if (!leftTarget.point && !rightTarget.point) {
                    const [leftAlignedToWallX, leftAlignedToWallY] = alignToWall(leftPoint);
                    const [rightAlignedToWallX, rightAlignedToWallY] = alignToWall(rightPoint);

                    if (leftAlignedToWallX !== null || rightAlignedToWallX !== null) {
                      const leftDiffX = (leftAlignedToWallX ?? Infinity) - leftPoint.x;
                      const rightDiffX = (rightAlignedToWallX ?? Infinity) - rightPoint.x;
                      const diffX = Math.min(leftDiffX, rightDiffX);
                      leftPoint.setX(leftPoint.x + diffX);
                      rightPoint.setX(rightPoint.x + diffX);
                      p.setX(p.x + diffX);

                      leftTarget = findMagnetPoint(leftPoint, 1);
                      if (leftTarget.point) {
                        updateWallPointAfterSnap(leftTarget.point, 'left');
                        if (leftTarget.id && (!leftTarget.jointId || leftTarget.jointId === currWall.id)) {
                          wallNewLeftJointIdRef.current = leftTarget.id;
                          leftFlip = leftTarget.side === WallSide.Left;
                        }
                      } else {
                        wallNewLeftJointIdRef.current = null;
                      }
                    }
                    if (leftAlignedToWallY !== null || rightAlignedToWallY !== null) {
                      const leftDiffY = (leftAlignedToWallY ?? Infinity) - leftPoint.y;
                      const rightDiffY = (rightAlignedToWallY ?? Infinity) - rightPoint.y;
                      const diffY = Math.min(leftDiffY, rightDiffY);
                      leftPoint.setY(leftPoint.y + diffY);
                      rightPoint.setY(rightPoint.y + diffY);
                      p.setY(p.y + diffY);

                      rightTarget = findMagnetPoint(rightPoint, 1);
                      if (rightTarget.point) {
                        if (!leftTarget.id) {
                          updateWallPointAfterSnap(rightTarget.point, 'right');
                        }
                        if (
                          rightTarget.id &&
                          (!rightTarget.jointId || rightTarget.jointId === currWall.id) &&
                          (leftTarget.id !== rightTarget.id || leftTarget.side !== rightTarget.side)
                        ) {
                          wallNewRightJointIdRef.current = rightTarget.id;
                          rightFlip = rightTarget.side === WallSide.Right;
                        }
                      } else {
                        wallNewRightJointIdRef.current = null;
                      }
                    }
                  }

                  const [isLeftAlignedToWallX, isLeftAlignedToWallY] = checkAndSetPosAlignToWall(leftPoint, 0);
                  const [isRightAlignedToWallX, isRightAlignedToWallY] = checkAndSetPosAlignToWall(rightPoint, 1);
                  setWallAuxToWallArray(
                    produce((draft) => {
                      draft[0].show = isLeftAlignedToWallX || isLeftAlignedToWallY;
                      draft[1].show = isRightAlignedToWallX || isRightAlignedToWallY;
                    }),
                  );

                  // *notice the different between false and null
                  if ((leftFlip && rightFlip === null) || (rightFlip && leftFlip === null) || (leftFlip && rightFlip)) {
                    flipCurrWallRef.current = true;
                  } else if ((leftFlip && rightFlip === false) || (rightFlip && leftFlip === false)) {
                    flipLeftHandSideWallRef.current = leftFlip;
                    flipRightHandSideWallRef.current = rightFlip;
                  }

                  if (leftTarget.point && rightTarget.point) {
                    if (leftTarget.id !== rightTarget.id || leftTarget.side !== rightTarget.side) {
                      leftPoint.copy(leftTarget.point);
                      rightPoint.copy(rightTarget.point);
                      stretched = true;
                    }
                  }
                }

                setCommonStore((state) => {
                  for (const e of state.elements) {
                    if (e.id === grabRef.current?.id && e.type === ObjectType.Wall) {
                      const wall = e as WallModel;
                      if (stretched) {
                        wall.cx = (leftPoint.x + rightPoint.x) / 2;
                        wall.cy = (leftPoint.y + rightPoint.y) / 2;
                        wall.lx = leftPoint.distanceTo(rightPoint);
                        let angle = Math.atan2(rightPoint.y - leftPoint.y, rightPoint.x - leftPoint.x);
                        angle = angle >= 0 ? angle : (TWO_PI + angle) % TWO_PI;
                        wall.relativeAngle = angle;
                      } else {
                        wall.cx = p.x;
                        wall.cy = p.y;
                      }
                      wall.leftPoint = leftPoint.toArray();
                      wall.rightPoint = rightPoint.toArray();
                      break;
                    }
                  }
                });
              }
            }
            break;
        }
      }
      if (objectTypeToAdd === ObjectType.Wall && !isSettingWallStartPointRef.current) {
        elementsStateBeforeResizingRef.current = [...useStore.getState().elements];
        const addedWall = addElement(foundationModel, p) as WallModel;
        grabRef.current = addedWall;
        addedWallIdRef.current = addedWall.id;
        isSettingWallStartPointRef.current = true;
        setShowGrid(true);
        useRefStore.getState().setEnableOrbitController(false);
        setCommonStore((state) => {
          state.addedWallId = addedWall.id;
          state.objectTypeToAdd = ObjectType.None;
        });
      }
      if (addedWallIdRef.current && isSettingWallStartPointRef.current) {
        p = Util.wallRelativePosition(intersects[0].point, foundationModel);

        let target: SnapTargetType | null = null;

        if (useStore.getState().enableFineGrid) {
          p = Util.snapToFineGrid(p);
        } else {
          target = findMagnetPoint(p, 1.5);
          if (target?.point) {
            p = target.point;
          } else {
            p = Util.snapToNormalGrid(p);

            const [alignedX, alignedY] = alignToWall(p);
            if (alignedX !== null) p.setX(alignedX);
            if (alignedY !== null) p.setY(alignedY);

            target = findMagnetPoint(p, 1.5);
            if (target?.point) {
              p = target.point;
            }
          }
        }

        const [isAlignedToWallX, isAlignedToWallY] = checkAndSetPosAlignToWall(p);
        setWallAuxToWallArray(
          produce((draft) => {
            draft[0].show = isAlignedToWallX || isAlignedToWallY;
          }),
        );

        setElementPosition(addedWallIdRef.current, p.x, p.y);
      }
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (e.intersections.length > 0) {
      const intersected = e.intersections[0].object === baseRef.current;
      if (intersected) {
        setHovered(true);
      }
    }
  };

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    setCommonStore((state) => {
      InnerCommonStoreState.selectMe(state, id, e, ActionType.Select);
      state.pastePoint.copy(e.intersections[0].point);
      state.clickObjectType = ObjectType.Foundation;
      state.pasteNormal = UNIT_VECTOR_POS_Z;
      if (e.altKey) {
        // when alt key is pressed, don't invoke context menu as it is reserved for fast click-paste
        state.contextMenuObjectType = null;
      } else {
        if (e.intersections.length > 0) {
          const intersected = e.intersections[0].object === baseRef.current;
          if (intersected) {
            state.contextMenuObjectType = ObjectType.Foundation;
          }
        }
      }
      state.pasteNormal = UNIT_VECTOR_POS_Z;
    });
  };

  const handlePointerOut = () => {
    setHovered(false);
    setShowGrid(false);
    if (grabRef.current) {
      if (isSettingWallStartPointRef.current) {
        removeElementById(grabRef.current.id, false);
        isSettingWallStartPointRef.current = false;
        setCommonStore((state) => {
          state.addedWallId = null;
          state.objectTypeToAdd = ObjectType.Wall;
        });
        grabRef.current = null;
      }
    }
    setWallAuxToAxis({ show: false, direction: null, position: null });
    setWallAuxToWallArray([
      { show: false, direction: null, position: null },
      { show: false, direction: null, position: null },
    ]);
  };

  const handlePointerEnter = (e: ThreeEvent<PointerEvent>) => {
    if (grabRef.current && Util.isPlantOrHuman(grabRef.current)) {
      const intersected = e.intersections[0].object === baseRef.current;
      if (intersected) {
        setShowGrid(true);
      }
    }
  };

  const isSolarCollectorNewPositionOk = (sc: SolarCollector, cx: number, cy: number) => {
    const clone = JSON.parse(JSON.stringify(sc)) as SolarCollector;
    clone.cx = cx;
    clone.cy = cy;
    if (overlapWithSibling(clone)) {
      showError(i18n.t('message.MoveCancelledBecauseOfOverlap', lang));
      return false;
    }
    if (!Util.isSolarCollectorWithinHorizontalSurface(clone, foundationModel)) {
      showError(i18n.t('message.MoveOutsideBoundaryCancelled', lang));
      return false;
    }
    return true;
  };

  const isSolarCollectorNewAzimuthOk = (sc: SolarCollector, az: number) => {
    const clone = JSON.parse(JSON.stringify(sc)) as SolarCollector;
    clone.relativeAzimuth = az;
    if (overlapWithSibling(clone)) {
      showError(i18n.t('message.RotationCancelledBecauseOfOverlap', lang));
      return false;
    }
    if (!Util.isSolarCollectorWithinHorizontalSurface(clone, foundationModel)) {
      showError(i18n.t('message.RotationOutsideBoundaryCancelled', lang));
      return false;
    }
    return true;
  };

  const isSolarCollectorNewSizeOk = (sc: SolarCollector, cx: number, cy: number, lx: number, ly: number) => {
    // check if the new length will cause the solar collector to intersect with the foundation
    if (
      sc.type === ObjectType.SolarPanel &&
      sc.tiltAngle !== 0 &&
      0.5 * ly * Math.abs(Math.sin(sc.tiltAngle)) > sc.poleHeight
    ) {
      // we only need to check solar panels, other collectors are guaranteed to not touch the ground
      return false;
    }
    // check if the new size will be within the foundation
    const clone = JSON.parse(JSON.stringify(sc)) as SolarCollector;
    clone.cx = cx;
    clone.cy = cy;
    clone.lx = lx;
    clone.ly = ly;
    return Util.isSolarCollectorWithinHorizontalSurface(clone, foundationModel);
  };

  const handleSolarCollectorPointerOut = () => {
    if (grabRef.current && Util.isSolarCollector(grabRef.current)) {
      // Have to get the latest from the store (we may change this to ref in the future)
      const sp = useStore.getState().getElementById(grabRef.current.id) as SolarCollector;
      if (useStore.getState().moveHandleType && !isSolarCollectorNewPositionOk(sp, sp.cx, sp.cy)) {
        setElementPosition(sp.id, oldPositionRef.current.x, oldPositionRef.current.y, oldPositionRef.current.z);
      }
    }
  };

  const handleSolarCollectorPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!intersectPlaneRef.current) return;
    if (!foundationModel) return;
    if (grabRef.current && foundationModel) {
      if (!Util.isSolarCollector(grabRef.current)) return;
      const collector = grabRef.current as SolarCollector;
      setRayCast(e);
      const intersects = ray.intersectObjects([intersectPlaneRef.current]);
      if (intersects.length > 0) {
        let p = intersects[0].point; // world coordinate
        const moveHandleType = useStore.getState().moveHandleType;
        const rotateHandleType = useStore.getState().rotateHandleType;
        const resizeHandleType = useStore.getState().resizeHandleType;
        if (moveHandleType && foundationModel) {
          p = Util.relativeCoordinates(p.x, p.y, p.z, foundationModel);
          setElementPosition(collector.id, p.x, p.y);
        } else if (rotateHandleType) {
          // tilt of solar panels not handled here
          if (rotateHandleType === RotateHandleType.Upper || rotateHandleType === RotateHandleType.Lower) {
            const pr = foundationModel.rotation[2]; // parent rotation
            const pc = new Vector2(foundationModel.cx, foundationModel.cy); // world parent center
            const cc = new Vector2(foundationModel.lx * collector.cx, foundationModel.ly * collector.cy) //local current center
              .rotateAround(ORIGIN_VECTOR2, pr); // add parent rotation
            const wc = new Vector2().addVectors(cc, pc); // world current center
            const rotation =
              Math.atan2(-p.x + wc.x, p.y - wc.y) - pr + (rotateHandleType === RotateHandleType.Lower ? 0 : Math.PI);
            const offset = Math.abs(rotation) > Math.PI ? -Math.sign(rotation) * TWO_PI : 0; // make sure angle is between -PI to PI
            const newAzimuth = rotation + offset;
            updateSolarCollectorRelativeAzimuthById(collector.id, newAzimuth);
            newAzimuthRef.current = newAzimuth;
          }
        } else if (resizeHandleType) {
          const resizeAnchor = useStore.getState().resizeAnchor;
          const wp = new Vector2(p.x, p.y);
          const resizeAnchor2D = new Vector2(resizeAnchor.x, resizeAnchor.y);
          const distance = wp.distanceTo(resizeAnchor2D);
          const angle = collector.relativeAzimuth + rotation[2]; // world panel azimuth
          const rp = new Vector2().subVectors(wp, resizeAnchor2D); // relative vector from anchor to pointer
          const wbc = new Vector2(cx, cy); // world foundation center
          if (collector.type === ObjectType.SolarPanel) {
            const solarPanel = collector as SolarPanelModel;
            const pvModel = getPvModule(solarPanel.pvModelName);
            switch (resizeHandleType) {
              case ResizeHandleType.Lower:
              case ResizeHandleType.Upper:
                {
                  const sign = resizeHandleType === ResizeHandleType.Lower ? 1 : -1;
                  const theta = rp.angle() - angle + sign * HALF_PI;
                  let dyl = distance * Math.cos(theta);
                  if (solarPanel.orientation === Orientation.portrait) {
                    const nx = Math.max(1, Math.ceil((dyl - pvModel.length / 2) / pvModel.length));
                    dyl = nx * pvModel.length;
                  } else {
                    const nx = Math.max(1, Math.ceil((dyl - pvModel.width / 2) / pvModel.width));
                    dyl = nx * pvModel.width;
                  }
                  const wcx = resizeAnchor.x + (sign * (dyl * Math.sin(angle))) / 2;
                  const wcy = resizeAnchor.y - (sign * (dyl * Math.cos(angle))) / 2;
                  const wc = new Vector2(wcx, wcy); // world panel center
                  const rc = new Vector2().subVectors(wc, wbc).rotateAround(ORIGIN_VECTOR2, -rotation[2]);
                  const newCx = rc.x / lx;
                  const newCy = rc.y / ly;
                  if (isSolarCollectorNewSizeOk(collector, newCx, newCy, collector.lx, dyl)) {
                    updateElementLyById(collector.id, dyl);
                    setElementPosition(collector.id, newCx, newCy);
                  }
                }
                break;
              case ResizeHandleType.Left:
              case ResizeHandleType.Right:
                {
                  let sign = resizeHandleType === ResizeHandleType.Left ? -1 : 1;
                  const theta = rp.angle() - angle + (resizeHandleType === ResizeHandleType.Left ? Math.PI : 0);
                  let dxl = distance * Math.cos(theta);
                  if (solarPanel.orientation === Orientation.portrait) {
                    const nx = Math.max(1, Math.ceil((dxl - pvModel.width / 2) / pvModel.width));
                    dxl = nx * pvModel.width;
                  } else {
                    const nx = Math.max(1, Math.ceil((dxl - pvModel.length / 2) / pvModel.length));
                    dxl = nx * pvModel.length;
                  }
                  const wcx = resizeAnchor.x + (sign * (dxl * Math.cos(angle))) / 2;
                  const wcy = resizeAnchor.y + (sign * (dxl * Math.sin(angle))) / 2;
                  const wc = new Vector2(wcx, wcy);
                  const rc = new Vector2().subVectors(wc, wbc).rotateAround(ORIGIN_VECTOR2, -rotation[2]);
                  const newCx = rc.x / lx;
                  const newCy = rc.y / ly;
                  if (isSolarCollectorNewSizeOk(collector, newCx, newCy, dxl, collector.ly)) {
                    updateElementLxById(collector.id, dxl);
                    setElementPosition(collector.id, newCx, newCy);
                  }
                }
                break;
            }
          } else if (collector.type === ObjectType.ParabolicTrough) {
            const parabolicTrough = collector as ParabolicTroughModel;
            switch (resizeHandleType) {
              case ResizeHandleType.Lower:
              case ResizeHandleType.Upper:
                // these two handles change the length, which is controlled by module length
                {
                  const sign = resizeHandleType === ResizeHandleType.Lower ? 1 : -1;
                  const theta = rp.angle() - angle + sign * HALF_PI;
                  let dyl = distance * Math.cos(theta);
                  const n = Math.max(
                    1,
                    Math.ceil((dyl - parabolicTrough.moduleLength / 2) / parabolicTrough.moduleLength),
                  );
                  dyl = n * parabolicTrough.moduleLength;
                  const wcx = resizeAnchor.x + (sign * (dyl * Math.sin(angle))) / 2;
                  const wcy = resizeAnchor.y - (sign * (dyl * Math.cos(angle))) / 2;
                  const wc = new Vector2(wcx, wcy); // world panel center
                  const rc = new Vector2().subVectors(wc, wbc).rotateAround(ORIGIN_VECTOR2, -rotation[2]);
                  const newCx = rc.x / lx;
                  const newCy = rc.y / ly;
                  if (isSolarCollectorNewSizeOk(collector, newCx, newCy, collector.lx, dyl)) {
                    updateElementLyById(collector.id, dyl);
                    setElementPosition(collector.id, newCx, newCy);
                  }
                }
                break;
              case ResizeHandleType.Left:
              case ResizeHandleType.Right:
                // these two handles change the width, which is not controlled by module length
                {
                  let sign = resizeHandleType === ResizeHandleType.Left ? -1 : 1;
                  const theta = rp.angle() - angle + (resizeHandleType === ResizeHandleType.Left ? Math.PI : 0);
                  let dxl = distance * Math.cos(theta);
                  const wcx = resizeAnchor.x + (sign * (dxl * Math.cos(angle))) / 2;
                  const wcy = resizeAnchor.y + (sign * (dxl * Math.sin(angle))) / 2;
                  const wc = new Vector2(wcx, wcy);
                  const rc = new Vector2().subVectors(wc, wbc).rotateAround(ORIGIN_VECTOR2, -rotation[2]);
                  const newCx = rc.x / lx;
                  const newCy = rc.y / ly;
                  if (isSolarCollectorNewSizeOk(collector, newCx, newCy, dxl, collector.ly)) {
                    updateElementLxById(collector.id, dxl);
                    setElementPosition(collector.id, newCx, newCy);
                    setCommonStore((state) => {
                      state.actionState.parabolicTroughWidth = dxl;
                    });
                  }
                }
                break;
            }
          } else if (collector.type === ObjectType.FresnelReflector) {
            const fresnelReflector = collector as FresnelReflectorModel;
            switch (resizeHandleType) {
              case ResizeHandleType.Lower:
              case ResizeHandleType.Upper:
                // these two handles change the length, which is controlled by module length
                {
                  const sign = resizeHandleType === ResizeHandleType.Lower ? 1 : -1;
                  const theta = rp.angle() - angle + sign * HALF_PI;
                  let dyl = distance * Math.cos(theta);
                  const n = Math.max(
                    1,
                    Math.ceil((dyl - fresnelReflector.moduleLength / 2) / fresnelReflector.moduleLength),
                  );
                  dyl = n * fresnelReflector.moduleLength;
                  const wcx = resizeAnchor.x + (sign * (dyl * Math.sin(angle))) / 2;
                  const wcy = resizeAnchor.y - (sign * (dyl * Math.cos(angle))) / 2;
                  const wc = new Vector2(wcx, wcy); // world panel center
                  const rc = new Vector2().subVectors(wc, wbc).rotateAround(ORIGIN_VECTOR2, -rotation[2]);
                  const newCx = rc.x / lx;
                  const newCy = rc.y / ly;
                  if (isSolarCollectorNewSizeOk(collector, newCx, newCy, collector.lx, dyl)) {
                    updateElementLyById(collector.id, dyl);
                    setElementPosition(collector.id, newCx, newCy);
                  }
                }
                break;
              case ResizeHandleType.Left:
              case ResizeHandleType.Right:
                // these two handles change the width, which is not controlled by module length
                {
                  let sign = resizeHandleType === ResizeHandleType.Left ? -1 : 1;
                  const theta = rp.angle() - angle + (resizeHandleType === ResizeHandleType.Left ? Math.PI : 0);
                  let dxl = distance * Math.cos(theta);
                  const wcx = resizeAnchor.x + (sign * (dxl * Math.cos(angle))) / 2;
                  const wcy = resizeAnchor.y + (sign * (dxl * Math.sin(angle))) / 2;
                  const wc = new Vector2(wcx, wcy);
                  const rc = new Vector2().subVectors(wc, wbc).rotateAround(ORIGIN_VECTOR2, -rotation[2]);
                  const newCx = rc.x / lx;
                  const newCy = rc.y / ly;
                  if (isSolarCollectorNewSizeOk(collector, newCx, newCy, dxl, collector.ly)) {
                    updateElementLxById(collector.id, dxl);
                    setElementPosition(collector.id, newCx, newCy);
                    setCommonStore((state) => {
                      state.actionState.fresnelReflectorWidth = dxl;
                    });
                  }
                }
                break;
            }
          } else if (collector.type === ObjectType.ParabolicDish) {
            const parabolicDish = collector as ParabolicDishModel;
            switch (resizeHandleType) {
              case ResizeHandleType.Left:
              case ResizeHandleType.Right:
              case ResizeHandleType.Lower:
              case ResizeHandleType.Upper: // all handles change the diameter of the dish
                const diameter = Math.min(10, distance);
                if (isSolarCollectorNewSizeOk(collector, parabolicDish.cx, parabolicDish.cy, collector.lx, diameter)) {
                  updateElementLxById(collector.id, diameter);
                  updateElementLyById(collector.id, diameter);
                  setCommonStore((state) => {
                    state.actionState.parabolicDishRimDiameter = diameter;
                  });
                }
                break;
            }
          }
        }
      }
    }
  };

  const opacity = groundImage ? (orthographic ? 0.25 : 0.75) : 1;

  return (
    <>
      <group
        ref={groupRef}
        name={`${FOUNDATION_GROUP_NAME} ${id}`}
        userData={{ aabb: true }}
        position={[cx, cy, hz]}
        rotation={[0, 0, rotation[2]]}
      >
        {/* draw rectangle */}
        <Box
          castShadow={shadowEnabled}
          receiveShadow={shadowEnabled}
          uuid={id}
          userData={{ simulation: true, stand: true }}
          ref={baseRef}
          name={'Foundation'}
          args={[lx, ly, lz]}
          onContextMenu={handleContextMenu}
          onPointerOver={handlePointerOver}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
          onPointerEnter={handlePointerEnter}
        >
          <meshStandardMaterial attachArray="material" color={color} transparent={groundImage} opacity={opacity} />
          <meshStandardMaterial attachArray="material" color={color} transparent={groundImage} opacity={opacity} />
          <meshStandardMaterial attachArray="material" color={color} transparent={groundImage} opacity={opacity} />
          <meshStandardMaterial attachArray="material" color={color} transparent={groundImage} opacity={opacity} />
          {showSolarRadiationHeatmap && heatmapTexture ? (
            <meshBasicMaterial
              attachArray="material"
              color={'white'}
              map={heatmapTexture}
              transparent={groundImage}
              opacity={opacity}
            />
          ) : (
            <meshStandardMaterial
              attachArray="material"
              color={textureType === FoundationTexture.NoTexture ? color : 'white'}
              map={texture}
              transparent={groundImage}
              opacity={opacity}
            />
          )}
          <meshStandardMaterial attachArray="material" color={color} transparent={groundImage} opacity={opacity} />
        </Box>

        {/* intersection plane */}
        {grabRef.current && Util.isSolarCollector(grabRef.current) && !grabRef.current.locked && (
          <Plane
            ref={intersectPlaneRef}
            name={'Foundation Intersection Plane'}
            position={intersectionPlanePosition}
            args={[lx, ly]}
            visible={false}
            onPointerMove={handleSolarCollectorPointerMove}
            onPointerOut={handleSolarCollectorPointerOut}
          />
        )}

        {showGrid && (
          <>
            {useStore.getState().rotateHandleType && grabRef.current && Util.isSolarCollector(grabRef.current) && (
              <PolarGrid element={grabRef.current} height={(grabRef.current as SolarCollector).poleHeight + hz} />
            )}
            {(useStore.getState().moveHandleType || useStore.getState().resizeHandleType || addedWallIdRef.current) && (
              <ElementGrid hx={hx} hy={hy} hz={hz} />
            )}
          </>
        )}

        {/* ruler */}
        {selected && <HorizontalRuler element={foundationModel} verticalLift={moveHandleRadius} />}

        {/* wireFrame */}
        {(!selected || groundImage) && (
          <Wireframe
            hx={hx}
            hy={hy}
            hz={hz}
            lineColor={groundImage && orthographic ? 'white' : lineColor}
            lineWidth={groundImage && orthographic ? lineWidth * 3 : lineWidth}
          />
        )}

        {/* highlight with a thick wireframe when it is selected but locked */}
        {selected && locked && (
          <Wireframe hx={hx} hy={hy} hz={hz} lineColor={LOCKED_ELEMENT_SELECTION_COLOR} lineWidth={lineWidth * 5} />
        )}

        {/* wall axis auxiliary line */}
        {wallAuxToAxis.show && (
          <group position={[0, 0, hz + 0.01]}>
            <WallAuxiliaryLine
              hx={hx}
              hy={hy}
              position={wallAuxToAxis.position}
              direction={wallAuxToAxis.direction}
              color={'black'}
            />
          </group>
        )}
        <group position={[0, 0, hz + 0.01]}>
          {wallAuxToWallArray.map((wallAuxToWall, idx) => {
            if (!wallAuxToWall.show) return null;
            return (
              <WallAuxiliaryLine
                key={idx}
                hx={hx}
                hy={hy}
                position={wallAuxToWall.position}
                direction={wallAuxToWall.direction}
                color={'yellow'}
              />
            );
          })}
        </group>

        {/* draw handles */}
        {selected && !locked && !groupMasterId && (
          <>
            {/* resize handles */}
            <Box
              ref={resizeHandleLLRef}
              position={[positionLL.x, positionLL.y, 0]}
              args={[resizeHandleRadius, resizeHandleRadius, lz * 1.2]}
              name={ResizeHandleType.LowerLeft}
              onPointerDown={(e) => {
                selectMe(id, e, ActionType.Resize);
                if (resizeHandleLLRef.current) {
                  setCommonStore((state) => {
                    const anchor = resizeHandleLLRef.current!.localToWorld(new Vector3(lx, ly, 0));
                    state.resizeAnchor.copy(anchor);
                  });
                }
              }}
              onPointerOver={(e) => {
                hoverHandle(e, ResizeHandleType.LowerLeft);
              }}
              onPointerOut={noHoverHandle}
            >
              <meshBasicMaterial
                attach="material"
                color={
                  hoveredHandle === ResizeHandleType.LowerLeft ||
                  useStore.getState().resizeHandleType === ResizeHandleType.LowerLeft
                    ? HIGHLIGHT_HANDLE_COLOR
                    : RESIZE_HANDLE_COLOR
                }
              />
            </Box>
            <Box
              ref={resizeHandleULRef}
              position={[positionUL.x, positionUL.y, 0]}
              args={[resizeHandleRadius, resizeHandleRadius, lz * 1.2]}
              name={ResizeHandleType.UpperLeft}
              onPointerDown={(e) => {
                selectMe(id, e, ActionType.Resize);
                if (resizeHandleULRef.current) {
                  setCommonStore((state) => {
                    const anchor = resizeHandleULRef.current!.localToWorld(new Vector3(lx, -ly, 0));
                    state.resizeAnchor.copy(anchor);
                  });
                }
              }}
              onPointerOver={(e) => {
                hoverHandle(e, ResizeHandleType.UpperLeft);
              }}
              onPointerOut={noHoverHandle}
            >
              <meshBasicMaterial
                attach="material"
                color={
                  hoveredHandle === ResizeHandleType.UpperLeft ||
                  useStore.getState().resizeHandleType === ResizeHandleType.UpperLeft
                    ? HIGHLIGHT_HANDLE_COLOR
                    : RESIZE_HANDLE_COLOR
                }
              />
            </Box>
            <Box
              ref={resizeHandleLRRef}
              position={[positionLR.x, positionLR.y, 0]}
              args={[resizeHandleRadius, resizeHandleRadius, lz * 1.2]}
              name={ResizeHandleType.LowerRight}
              onPointerDown={(e) => {
                selectMe(id, e, ActionType.Resize);
                if (resizeHandleLRRef.current) {
                  setCommonStore((state) => {
                    const anchor = resizeHandleLRRef.current!.localToWorld(new Vector3(-lx, ly, 0));
                    state.resizeAnchor.copy(anchor);
                  });
                }
              }}
              onPointerOver={(e) => {
                hoverHandle(e, ResizeHandleType.LowerRight);
              }}
              onPointerOut={noHoverHandle}
            >
              <meshBasicMaterial
                attach="material"
                color={
                  hoveredHandle === ResizeHandleType.LowerRight ||
                  useStore.getState().resizeHandleType === ResizeHandleType.LowerRight
                    ? HIGHLIGHT_HANDLE_COLOR
                    : RESIZE_HANDLE_COLOR
                }
              />
            </Box>
            <Box
              ref={resizeHandleURRef}
              position={[positionUR.x, positionUR.y, 0]}
              args={[resizeHandleRadius, resizeHandleRadius, lz * 1.2]}
              name={ResizeHandleType.UpperRight}
              onPointerDown={(e) => {
                selectMe(id, e, ActionType.Resize);
                if (resizeHandleURRef.current) {
                  setCommonStore((state) => {
                    const anchor = resizeHandleURRef.current!.localToWorld(new Vector3(-lx, -ly, 0));
                    state.resizeAnchor.copy(anchor);
                  });
                }
              }}
              onPointerOver={(e) => {
                hoverHandle(e, ResizeHandleType.UpperRight);
              }}
              onPointerOut={noHoverHandle}
            >
              <meshBasicMaterial
                attach="material"
                color={
                  hoveredHandle === ResizeHandleType.UpperRight ||
                  useStore.getState().resizeHandleType === ResizeHandleType.UpperRight
                    ? HIGHLIGHT_HANDLE_COLOR
                    : RESIZE_HANDLE_COLOR
                }
              />
            </Box>

            {!addedFoundationID && (
              <>
                {/* move handles */}
                <Sphere
                  ref={moveHandleLowerRef}
                  args={[moveHandleRadius, 6, 6, 0, Math.PI]}
                  position={[0, -hy - moveHandleRadius, 0]}
                  name={MoveHandleType.Lower}
                  onPointerDown={(e) => {
                    setCommonStore((state) => {
                      state.moveHandleType = MoveHandleType.Lower;
                      state.selectedElement = state.elements.find((e) => e.id === id) ?? null;
                      for (const e of state.elements) {
                        if (state.selectedElementIdSet.has(e.id) && !Util.isElementAllowedMultipleMoveOnGround(e)) {
                          state.selectedElementIdSet.delete(e.id);
                        }
                      }
                    });
                    useRefStore.getState().setEnableOrbitController(false);
                  }}
                  onPointerOver={(e) => {
                    hoverHandle(e, MoveHandleType.Lower);
                  }}
                  onPointerOut={noHoverHandle}
                >
                  <meshBasicMaterial
                    attach="material"
                    color={
                      hoveredHandle === MoveHandleType.Lower ||
                      useStore.getState().moveHandleType === MoveHandleType.Lower
                        ? HIGHLIGHT_HANDLE_COLOR
                        : MOVE_HANDLE_COLOR_2
                    }
                  />
                </Sphere>
                <Sphere
                  ref={moveHandleUpperRef}
                  args={[moveHandleRadius, 6, 6, 0, Math.PI]}
                  position={[0, hy + moveHandleRadius, 0]}
                  name={MoveHandleType.Upper}
                  onPointerDown={(e) => {
                    setCommonStore((state) => {
                      state.moveHandleType = MoveHandleType.Upper;
                      state.selectedElement = state.elements.find((e) => e.id === id) ?? null;
                      for (const e of state.elements) {
                        if (state.selectedElementIdSet.has(e.id) && !Util.isElementAllowedMultipleMoveOnGround(e)) {
                          state.selectedElementIdSet.delete(e.id);
                        }
                      }
                    });
                    useRefStore.getState().setEnableOrbitController(false);
                  }}
                  onPointerOver={(e) => {
                    hoverHandle(e, MoveHandleType.Upper);
                  }}
                  onPointerOut={noHoverHandle}
                >
                  <meshBasicMaterial
                    attach="material"
                    color={
                      hoveredHandle === MoveHandleType.Upper ||
                      useStore.getState().moveHandleType === MoveHandleType.Upper
                        ? HIGHLIGHT_HANDLE_COLOR
                        : MOVE_HANDLE_COLOR_2
                    }
                  />
                </Sphere>
                <Sphere
                  ref={moveHandleLeftRef}
                  args={[moveHandleRadius, 6, 6, 0, Math.PI]}
                  position={[-hx - moveHandleRadius, 0, 0]}
                  name={MoveHandleType.Left}
                  onPointerDown={(e) => {
                    setCommonStore((state) => {
                      state.moveHandleType = MoveHandleType.Left;
                      state.selectedElement = state.elements.find((e) => e.id === id) ?? null;
                      for (const e of state.elements) {
                        if (state.selectedElementIdSet.has(e.id) && !Util.isElementAllowedMultipleMoveOnGround(e)) {
                          state.selectedElementIdSet.delete(e.id);
                        }
                      }
                    });
                    useRefStore.getState().setEnableOrbitController(false);
                  }}
                  onPointerOver={(e) => {
                    hoverHandle(e, MoveHandleType.Left);
                  }}
                  onPointerOut={noHoverHandle}
                >
                  <meshBasicMaterial
                    attach="material"
                    color={
                      hoveredHandle === MoveHandleType.Left ||
                      useStore.getState().moveHandleType === MoveHandleType.Left
                        ? HIGHLIGHT_HANDLE_COLOR
                        : MOVE_HANDLE_COLOR_1
                    }
                  />
                </Sphere>
                <Sphere
                  ref={moveHandleRightRef}
                  args={[moveHandleRadius, 6, 6, 0, Math.PI]}
                  position={[hx + moveHandleRadius, 0, 0]}
                  name={MoveHandleType.Right}
                  onPointerDown={(e) => {
                    setCommonStore((state) => {
                      state.moveHandleType = MoveHandleType.Right;
                      state.selectedElement = state.elements.find((e) => e.id === id) ?? null;
                      for (const e of state.elements) {
                        if (state.selectedElementIdSet.has(e.id) && !Util.isElementAllowedMultipleMoveOnGround(e)) {
                          state.selectedElementIdSet.delete(e.id);
                        }
                      }
                    });
                    useRefStore.getState().setEnableOrbitController(false);
                  }}
                  onPointerOver={(e) => {
                    hoverHandle(e, MoveHandleType.Right);
                  }}
                  onPointerOut={noHoverHandle}
                >
                  <meshBasicMaterial
                    attach="material"
                    color={
                      hoveredHandle === MoveHandleType.Right ||
                      useStore.getState().moveHandleType === MoveHandleType.Right
                        ? HIGHLIGHT_HANDLE_COLOR
                        : MOVE_HANDLE_COLOR_1
                    }
                  />
                </Sphere>

                {/* rotation handle */}
                <RotateHandle
                  id={id}
                  position={[0, -rotateHandlePosition, 0]}
                  color={
                    hoveredHandle === RotateHandleType.Lower ||
                    useStore.getState().rotateHandleType === RotateHandleType.Lower
                      ? HIGHLIGHT_HANDLE_COLOR
                      : RESIZE_HANDLE_COLOR
                  }
                  ratio={rotateHandleRadius}
                  handleType={RotateHandleType.Lower}
                  hoverHandle={hoverHandle}
                  noHoverHandle={noHoverHandle}
                />
                <RotateHandle
                  id={id}
                  position={[0, rotateHandlePosition, 0]}
                  color={
                    hoveredHandle === RotateHandleType.Upper ||
                    useStore.getState().rotateHandleType === RotateHandleType.Upper
                      ? HIGHLIGHT_HANDLE_COLOR
                      : RESIZE_HANDLE_COLOR
                  }
                  ratio={rotateHandleRadius}
                  handleType={RotateHandleType.Upper}
                  hoverHandle={hoverHandle}
                  noHoverHandle={noHoverHandle}
                />
              </>
            )}
          </>
        )}

        {/* text */}
        {!addedFoundationID && (
          <>
            {(hovered || showLabel) && !selected && (
              <textSprite
                userData={{ unintersectable: true }}
                name={'Label'}
                text={
                  (foundationModel?.label ? foundationModel.label : i18n.t('shared.FoundationElement', lang)) +
                  (locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '')
                }
                color={foundationModel?.labelColor ?? 'white'}
                fontSize={foundationModel?.labelFontSize ?? 20}
                fontFace={'Roboto'}
                textHeight={foundationModel?.labelSize ?? 0.2}
                position={[0, 0, foundationModel?.labelHeight ?? hz + 0.2]}
              />
            )}
            {!locked && hoveredHandle === ResizeHandleType.LowerLeft && (
              <textSprite
                userData={{ unintersectable: true }}
                name={'Label-LL'}
                text={'LL'}
                fontSize={20}
                fontFace={'Times Roman'}
                textHeight={0.2}
                position={[-hx, -hy, hz + 0.2]}
              />
            )}
            {!locked && hoveredHandle === ResizeHandleType.UpperLeft && (
              <textSprite
                userData={{ unintersectable: true }}
                name={'Label-UL'}
                text={'UL'}
                fontSize={20}
                fontFace={'Times Roman'}
                textHeight={0.2}
                position={[-hx, hy, hz + 0.2]}
              />
            )}
            {!locked && hoveredHandle === ResizeHandleType.LowerRight && (
              <textSprite
                userData={{ unintersectable: true }}
                name={'Label-LR'}
                text={'LR'}
                fontSize={20}
                fontFace={'Times Roman'}
                textHeight={0.2}
                position={[hx, -hy, hz + 0.2]}
              />
            )}
            {!locked && hoveredHandle === ResizeHandleType.UpperRight && (
              <textSprite
                userData={{ unintersectable: true }}
                name={'Label-UR'}
                text={'UR'}
                fontSize={20}
                fontFace={'Times Roman'}
                textHeight={0.2}
                position={[hx, hy, hz + 0.2]}
              />
            )}
          </>
        )}
        {solarStructure === SolarStructure.FocusPipe && <SolarReceiverPipe foundation={foundationModel} />}
        {solarStructure === SolarStructure.FocusTower && <SolarPowerTower foundation={foundationModel} />}
        {solarStructure === SolarStructure.UpdraftTower && <SolarUpdraftTower foundation={foundationModel} />}

        <BuildingRenderer {...foundationModel} />
      </group>

      {selected && !locked && groupMasterId === id && foundationModel && groupMasterDimension && (
        <GroupMaster
          baseGroupSet={baseGroupSet}
          childCuboidSet={childCuboidSet}
          initalPosition={groupMasterPosition}
          initalDimension={groupMasterDimension}
          initalRotation={groupMasterRotation}
        />
      )}
    </>
  );
};

const WallAuxiliaryLine = ({
  hx,
  hy,
  position,
  direction,
  color,
}: {
  hx: number;
  hy: number;
  position: number[] | null;
  direction: 'x' | 'y' | 'xy' | null;
  color: string;
}) => {
  if (position === null) return null;

  const [x, y] = position;
  const points: [number, number, number][] = [];

  if (direction === 'x') {
    points.push([-hx, y, 0]);
    points.push([hx, y, 0]);
  } else if (direction === 'y') {
    points.push([x, -hy, 0]);
    points.push([x, hy, 0]);
  } else if (direction === 'xy') {
    return (
      <>
        <Line
          points={[
            [-hx, y, 0],
            [hx, y, 0],
          ]}
          color={color}
        />
        <Line
          points={[
            [x, -hy, 0],
            [x, hy, 0],
          ]}
          color={color}
        />
      </>
    );
  } else {
    return null;
  }

  return <Line points={points} color={color} />;
};

export default React.memo(Foundation);
