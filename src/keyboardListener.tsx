/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { ActionInfo, MoveDirection, ObjectType } from './types';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { UndoableDelete, UndoableDeleteMultiple } from './undo/UndoableDelete';
import { UndoablePaste } from './undo/UndoablePaste';
import { UndoableCheck } from './undo/UndoableCheck';
import { UndoableResetView } from './undo/UndoableResetView';
import { showError, showInfo } from './helpers';
import i18n from './i18n/i18n';
import KeyboardEventHandler from 'react-keyboard-event-handler';
import { WallModel } from './models/WallModel';
import { useRefStore } from './stores/commonRef';
import { SolarPanelModel } from './models/SolarPanelModel';
import { Util } from './Util';
import { ElementModel } from './models/ElementModel';
import { GRID_RATIO, GROUND_ID, HOME_URL, UNDO_SHOW_INFO_DURATION } from './constants';
import { RoofUtil } from './views/roof/RoofUtil';
import { RoofModel } from './models/RoofModel';
import { spBoundaryCheck, spCollisionCheck } from './views/roof/roofRenderer';
import { usePrimitiveStore } from './stores/commonPrimitive';
import { debounce } from 'lodash';
import { SensorModel } from './models/SensorModel';
import { LightModel } from './models/LightModel';
import { Vector2, Vector3 } from 'three';
import { UndoableMoveAllByKey, UndoableMoveSelectedByKey } from './undo/UndoableMove';
import { GroupableModel, isGroupable } from './models/Groupable';
import { Point2 } from './models/Point2';
import { resetView, zoomView } from './components/mainMenu/viewMenu';
import { message } from 'antd';
import { FoundationModel } from './models/FoundationModel';

export interface KeyboardListenerProps {
  canvas?: HTMLCanvasElement | null;
}

const AutoDeletionListener = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const updateWallRightJointsById = useStore(Selector.updateWallRightJointsById);
  const updateWallLeftJointsById = useStore(Selector.updateWallLeftJointsById);
  const addUndoable = useStore(Selector.addUndoable);

  const listenToAutoDeletionByDeleteRef = useRef(false);
  const listenToAutoDeletionByCutRef = useRef(false);

  useStore(Selector.autoDeletedRoofIdSet);
  useStore(Selector.autoDeletedChild);
  usePrimitiveStore((state) => state.selectedElementId);

  useEffect(() => {
    useRefStore.setState({
      listenToAutoDeletionByDeleteRef: listenToAutoDeletionByDeleteRef,
      listenToAutoDeletionByCutRef: listenToAutoDeletionByCutRef,
    });
  }, []);

  const handleUndoAutoDeletion = debounce(() => {
    const selectedElementId = usePrimitiveStore.getState().selectedElementId;
    const selectedElementIdSet = useStore.getState().selectedElementIdSet;
    if (!selectedElementId || selectedElementIdSet.size === 0) return;

    const autoDeletedElements = useStore.getState().getAutoDeletedElements();
    if (!autoDeletedElements) return;

    const manualDeletedElements = useStore.getState().deletedElements;
    const manualCutElements = useStore.getState().elementsToPaste;

    const listenToAutoDeletionByCut = useRefStore.getState().listenToAutoDeletionByCutRef?.current;
    const listenToAutoDeletionByDelete = useRefStore.getState().listenToAutoDeletionByDeleteRef?.current;

    let combined: ElementModel[] = [];
    let undoName: string = '';
    if (listenToAutoDeletionByCut) {
      useRefStore.getState().setListenToAutoDeletionByCut(false);
      combined = [...manualCutElements, ...autoDeletedElements];
      undoName = 'Cut';
    } else if (listenToAutoDeletionByDelete) {
      useRefStore.getState().setListenToAutoDeletionByDelete(false);
      combined = [...manualDeletedElements, ...autoDeletedElements];
      undoName = 'Delete';
    }

    const undoableDeleteMultiple = {
      name: undoName,
      timestamp: Date.now(),
      deletedElements: [...combined],
      selectedElementId: selectedElementId,
      selectedElementIdSet: new Set(selectedElementIdSet),
      undo() {
        const deletedElements = undoableDeleteMultiple.deletedElements;
        if (!deletedElements || deletedElements.length === 0) return;

        for (const e of this.deletedElements) {
          if (e.type === ObjectType.Wall) {
            const wall = e as WallModel;
            if (wall.leftJoints.length > 0) {
              updateWallRightJointsById(wall.leftJoints[0], [wall.id]);
            }
            if (wall.rightJoints.length > 0) {
              updateWallLeftJointsById(wall.rightJoints[0], [wall.id]);
            }
          } else if (e.type === ObjectType.Roof) {
            setCommonStore((state) => {
              state.addedRoofIdSet.add(e.id);
            });
          }
        }

        const selectedElement = deletedElements.find((e) => e.id === this.selectedElementId) ?? null;

        setCommonStore((state) => {
          state.elements.push(...deletedElements);
          state.selectedElement = selectedElement;
          state.selectedElementIdSet = new Set(this.selectedElementIdSet);
          state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
          state.deletedRoofId = null;
          state.autoDeletedRoofs = null;
          state.deletedRoofIdSet.clear();
          state.autoDeletedRoofIdSet.clear();
          state.autoDeletedChild = null;
        });
      },
      redo() {
        if (undoableDeleteMultiple.deletedElements.length === 0) return;
        setCommonStore((state) => {
          state.selectedElement = state.elements.find((e) => e.id === this.selectedElementId) ?? null;
          state.selectedElementIdSet = new Set(this.selectedElementIdSet);
        });
        useStore.getState().removeSelectedElements();
      },
    } as UndoableDeleteMultiple;
    addUndoable(undoableDeleteMultiple);

    setCommonStore((state) => {
      state.selectedElement = null;
      state.selectedElementIdSet.clear();
      state.deletedRoofId = null;
      state.deletedRoofIdSet.clear();
      state.autoDeletedRoofs = null;
      state.autoDeletedRoofIdSet.clear();
      state.autoDeletedChild = null;
    });
    usePrimitiveStore.getState().setPrimitiveStore('selectedElementId', null);
  }, 50);

  const listenToAutoDeletion =
    useRefStore.getState().listenToAutoDeletionByCutRef?.current ||
    useRefStore.getState().listenToAutoDeletionByDeleteRef?.current;

  if (listenToAutoDeletion && useStore.getState().getAutoDeletedElements()) {
    handleUndoAutoDeletion();
  }

  return null;
});

const handleKeys = [
  'left',
  'up',
  'right',
  'down',
  'shift+left',
  'shift+up',
  'shift+right',
  'shift+down',
  'ctrl+shift+left',
  'ctrl+shift+up',
  'ctrl+shift+right',
  'ctrl+shift+down',
  'meta+shift+left',
  'meta+shift+up',
  'meta+shift+right',
  'meta+shift+down',
  'ctrl+f',
  'meta+f',
  'ctrl+o',
  'meta+o',
  'ctrl+s',
  'meta+s',
  'ctrl+c',
  'meta+c',
  'ctrl+x',
  'meta+x',
  'ctrl+v',
  'meta+v',
  'ctrl+[',
  'meta+[',
  'ctrl+]',
  'meta+]',
  'ctrl+z',
  'meta+z',
  'ctrl+y',
  'meta+y',
  'ctrl+m',
  'meta+m',
  'ctrl+u', // navigation controls
  'meta+u',
  'ctrl+b',
  'meta+b',
  'shift',
  'esc',
  'ctrl+home',
  'ctrl+alt+h',
  'ctrl+shift+o',
  'meta+shift+o',
  'ctrl+shift+s',
  'meta+shift+s',
  'delete',
  'backspace',
  'alt+backspace',
  'f2',
  'f4',
  'ctrl',
];

const KeyboardListener = React.memo(({ canvas }: KeyboardListenerProps) => {
  const setCommonStore = useStore(Selector.set);
  const loggable = useStore(Selector.loggable);
  const selectNone = useStore(Selector.selectNone);
  const language = useStore(Selector.language);
  const undoManager = useStore(Selector.undoManager);
  const addUndoable = useStore(Selector.addUndoable);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const getElementById = useStore(Selector.getElementById);
  const copyElementById = useStore(Selector.copyElementById);
  const removeElementById = useStore(Selector.removeElementById);
  const pasteElements = useStore(Selector.pasteElementsByKey);
  const getParent = useStore(Selector.getParent);
  const updateWallLeftJointsById = useStore(Selector.updateWallLeftJointsById);
  const updateWallRightJointsById = useStore(Selector.updateWallRightJointsById);
  const setEnableFineGrid = useStore(Selector.setEnableFineGrid);
  const overlapWithSibling = useStore(Selector.overlapWithSibling);
  const logAction = useStore(Selector.logAction);

  const lastKeyMoveTimeRef = useRef<number | null>(null);

  const moveStepAbsolute = 0.1;

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  const removeElement = (elemId: string, cut: boolean) => {
    if (canvas) {
      canvas.style.cursor = 'default'; // if an element is deleted but the cursor is not default
    }
    return removeElementById(elemId, cut);
  };

  const toggle2DView = () => {
    if (useStore.getState().viewState.navigationView) return;
    const set2DView = useStore.getState().set2DView;
    const undoableCheck = {
      name: 'Set 2D View',
      timestamp: Date.now(),
      checked: !orthographic,
      undo: () => {
        set2DView(!undoableCheck.checked);
      },
      redo: () => {
        set2DView(undoableCheck.checked);
      },
    } as UndoableCheck;
    addUndoable(undoableCheck);
    set2DView(!orthographic);
    setCommonStore((state) => {
      state.viewState.autoRotate = false;
    });
  };

  const toggleNavigationView = () => {
    if (orthographic) return;
    const setNavigationView = useStore.getState().setNavigationView;
    const undoableCheck = {
      name: 'Set Navigation View',
      timestamp: Date.now(),
      checked: !useStore.getState().viewState.navigationView,
      undo: () => {
        setNavigationView(!undoableCheck.checked);
      },
      redo: () => {
        setNavigationView(undoableCheck.checked);
      },
    } as UndoableCheck;
    addUndoable(undoableCheck);
    setNavigationView(!useStore.getState().viewState.navigationView);
    setCommonStore((state) => {
      state.viewState.autoRotate = false;
    });
  };

  const toggleAutoRotate = () => {
    if (orthographic) return;
    const undoableCheck = {
      name: 'Auto Rotate',
      timestamp: Date.now(),
      checked: !useStore.getState().viewState.autoRotate,
      undo: () => {
        setCommonStore((state) => {
          state.objectTypeToAdd = ObjectType.None;
          state.groupActionMode = false;
          state.viewState.autoRotate = !undoableCheck.checked;
        });
      },
      redo: () => {
        setCommonStore((state) => {
          state.objectTypeToAdd = ObjectType.None;
          state.groupActionMode = false;
          state.viewState.autoRotate = undoableCheck.checked;
        });
      },
    } as UndoableCheck;
    addUndoable(undoableCheck);
    setCommonStore((state) => {
      state.objectTypeToAdd = ObjectType.None;
      state.groupActionMode = false;
      state.viewState.autoRotate = !state.viewState.autoRotate;
    });
  };

  const isNewPositionOk = (elem: ElementModel, cx: number, cy: number) => {
    const clone = JSON.parse(JSON.stringify(elem)) as ElementModel;
    clone.cx = cx;
    clone.cy = cy;
    if (elem.type === ObjectType.SolarPanel && (elem as SolarPanelModel).parentType === ObjectType.Roof) {
      if (elem.parentId && elem.foundationId) {
        const roof = getElementById(elem.parentId) as RoofModel;
        const foundation = getElementById(elem.foundationId);
        if (roof && foundation) {
          const boundaryVertices = RoofUtil.getRoofBoundaryVertices(roof);
          const solarPanelVertices = RoofUtil.getSolarPanelVerticesOnRoof(clone as SolarPanelModel, foundation);
          if (
            !spBoundaryCheck(solarPanelVertices, boundaryVertices) ||
            !spCollisionCheck(clone as SolarPanelModel, foundation, solarPanelVertices)
          ) {
            return false;
          }
        }
      }
      return true;
    }
    if (overlapWithSibling(clone)) {
      showError(i18n.t('message.MoveCancelledBecauseOfOverlap', lang));
      return false;
    }
    if (clone.type === ObjectType.SolarPanel) {
      const parent = getParent(elem);
      if (parent && !Util.isSolarCollectorWithinHorizontalSurface(clone as SolarPanelModel, parent)) {
        showError(i18n.t('message.MoveOutsideBoundaryCancelled', lang));
        return false;
      }
    }
    return true;
  };

  const canBeMovedIn2DMode = (e: ElementModel) => {
    switch (e.type) {
      case ObjectType.Roof:
      case ObjectType.Door:
      case ObjectType.Window:
        return false;
      case ObjectType.SolarPanel:
      case ObjectType.Sensor:
      case ObjectType.Light: {
        const el = e as SensorModel | LightModel | SolarPanelModel;
        if (el.parentType === ObjectType.Wall || el.parentType === ObjectType.Roof) {
          return false;
        }
        if (el.parentType === ObjectType.Cuboid) {
          return el.rotation[2] === 1;
        }
        return true;
      }
      case ObjectType.Wall: {
        const wall = e as WallModel;
        return !(wall.leftJoints.length !== 0 || wall.rightJoints.length !== 0);
      }
      default:
        return true;
    }
  };

  const isSameTypeGroup = (selectedType: ObjectType, currType: ObjectType) => {
    switch (selectedType) {
      case ObjectType.Foundation:
      case ObjectType.Cuboid:
        return currType === ObjectType.Foundation || currType === ObjectType.Cuboid;
      default:
        return currType !== ObjectType.Foundation && currType !== ObjectType.Cuboid;
    }
  };

  const handleGroupMaster = (arr: GroupableModel[]) => {
    const allBases = useStore
      .getState()
      .elements.filter((e) => isGroupable(e) && e.parentId === GROUND_ID) as GroupableModel[];

    const idSet = new Set(arr.map((e) => e.id));
    const verticesMap = new Map<string, Point2[]>();

    for (const base of allBases) {
      const vertices = Util.fetchFoundationVertexCoordinates(base);
      verticesMap.set(base.id, vertices);
    }

    const checkBaseOverlap = (curr: GroupableModel) => {
      for (const base of allBases) {
        if (!idSet.has(base.id) && Util.areBasesOverlapped(curr.id, base.id, verticesMap)) {
          idSet.add(base.id);
          arr.push(base);
          if (base.enableGroupMaster) {
            checkBaseOverlap(base);
          }
        }
      }
    };

    for (const curr of arr) {
      if (curr.enableGroupMaster) {
        checkBaseOverlap(curr);
      }
    }
  };

  const getElementsToBeMoved = () => {
    const elementsToBeMoved = [] as ElementModel[];

    const selectedElementIdSet = useStore.getState().selectedElementIdSet;
    const selectedElement = getSelectedElement();

    if (!selectedElement || selectedElementIdSet.size === 0) return elementsToBeMoved;

    if (selectedElement) {
      const lastSelectedType = selectedElement.type;
      const parentId = selectedElement.parentId;
      const filtered = useStore
        .getState()
        .elements.filter(
          (e) =>
            isSameTypeGroup(lastSelectedType, e.type) &&
            canBeMovedIn2DMode(e) &&
            e.parentId === parentId &&
            selectedElementIdSet.has(e.id),
        );
      elementsToBeMoved.push(...filtered);

      if (isGroupable(selectedElement) && elementsToBeMoved.length > 0 && parentId === GROUND_ID) {
        handleGroupMaster(elementsToBeMoved as GroupableModel[]);
      }
    }

    return elementsToBeMoved;
  };

  const getElementNewPosition = (oldCx: number, oldCy: number, displacement: number, direction: MoveDirection) => {
    switch (direction) {
      case MoveDirection.Left:
        return [oldCx - displacement, oldCy];
      case MoveDirection.Right:
        return [oldCx + displacement, oldCy];
      case MoveDirection.Up:
        return [oldCx, oldCy + displacement];
      case MoveDirection.Down:
        return [oldCx, oldCy - displacement];
    }
  };

  const updateElementMoveByKey = (elementDisplacementMap: Map<string, Vector2>, undo = false) => {
    setCommonStore((state) => {
      let updateWallMapOnFoundationFlag = false;

      for (const e of state.elements) {
        if (elementDisplacementMap.has(e.id)) {
          const distVector = elementDisplacementMap.get(e.id);
          if (distVector !== undefined) {
            const newCx = e.cx + (undo ? -distVector.x : distVector.x);
            const newCy = e.cy + (undo ? -distVector.y : distVector.y);
            if (e.type === ObjectType.Wall) {
              const wall = e as WallModel;
              const dist = new Vector3(newCx - wall.cx, newCy - wall.cy);
              const newLeftPoint = new Vector3().fromArray(wall.leftPoint).setZ(0).add(dist);
              const newRightPoint = new Vector3().fromArray(wall.rightPoint).setZ(0).add(dist);
              wall.leftPoint = newLeftPoint.toArray();
              wall.rightPoint = newRightPoint.toArray();
              updateWallMapOnFoundationFlag = true;
            }
            e.cx = newCx;
            e.cy = newCy;

            if (e.type === ObjectType.BatteryStorage || e.type === ObjectType.SolarPanel) {
              const foundation = state.elements.find(
                (el) => el.id === e.parentId && el.type === ObjectType.Foundation,
              ) as FoundationModel;
              if (foundation && foundation.enableSlope) {
                e.cz = foundation.lz + Util.getZOnSlope(foundation.lx, foundation.slope, e.cx);
              }
            }
          }
        } else if (state.selectedElementIdSet.has(e.id)) {
          state.selectedElementIdSet.delete(e.id);
        }
      }

      if (state.selectedElement?.type === ObjectType.Cuboid || state.selectedElement?.type === ObjectType.Foundation) {
        state.groupActionUpdateFlag = !state.groupActionUpdateFlag;
      } else if (updateWallMapOnFoundationFlag) {
        state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
      }
    });
  };

  const updateMovementForAll = (displacement: Vector2, undo = false) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (Util.isFoundationOrCuboid(e) || (Util.isPlantOrHuman(e) && e.parentId === GROUND_ID)) {
          e.cx = e.cx + (undo ? -displacement.x : displacement.x);
          e.cy = e.cy + (undo ? -displacement.y : displacement.y);
        }
      }
    });
  };

  const setDisplacementVector = (v: Vector2, dist: number, dir: MoveDirection) => {
    if (dir === MoveDirection.Left) v.x -= dist;
    if (dir === MoveDirection.Right) v.x += dist;
    if (dir === MoveDirection.Up) v.y += dist;
    if (dir === MoveDirection.Down) v.y -= dist;
    return v;
  };

  const needUpdateUndoSelected = (elementsToBeMoved: ElementModel[]) => {
    const lastTime = lastKeyMoveTimeRef.current;
    lastKeyMoveTimeRef.current = Date.now();
    const lastUndoCommand = useStore.getState().undoManager.getLastUndoCommand();
    if (lastUndoCommand && lastUndoCommand.name === 'Move Selected Elements By Key') {
      const currTime = lastKeyMoveTimeRef.current;
      if (lastTime && currTime - lastTime > 500) {
        return false;
      }
      const map = (lastUndoCommand as UndoableMoveSelectedByKey).movedElementsDisplacementMap;
      if (map.size !== elementsToBeMoved.length) return false;
      for (const e of elementsToBeMoved) {
        if (!map.has(e.id)) return false;
      }
      return true;
    }
    return false;
  };

  const needUpdateUndoAll = () => {
    const lastTime = lastKeyMoveTimeRef.current;
    lastKeyMoveTimeRef.current = Date.now();
    const lastUndoCommand = useStore.getState().undoManager.getLastUndoCommand();
    // need to update last undo command
    if (lastUndoCommand && lastUndoCommand.name === 'Move All By Key') {
      const currTime = lastKeyMoveTimeRef.current;
      return !(lastTime && currTime - lastTime > 500);
    }
    return false;
  };

  const moveByKey = (direction: MoveDirection, scale: number) => {
    if (!orthographic) return;

    // foundation and cuboid can be moved together, child elements on same parent can be moved together.
    const elementsToBeMoved = getElementsToBeMoved();
    const selectedElement = getSelectedElement();
    const displacement = scale * moveStepAbsolute;

    if (selectedElement && elementsToBeMoved.length > 0) {
      const currentDisplacementMap = new Map<string, Vector2>();
      // need to update last undo command
      if (needUpdateUndoSelected(elementsToBeMoved)) {
        const lastUndoCommand = useStore.getState().undoManager.getLastUndoCommand() as UndoableMoveSelectedByKey;
        const map = lastUndoCommand.movedElementsDisplacementMap;
        for (const e of elementsToBeMoved) {
          switch (e.type) {
            case ObjectType.Foundation:
            case ObjectType.Cuboid:
            case ObjectType.Wall:
            case ObjectType.Tree:
            case ObjectType.Flower:
            case ObjectType.Human: {
              const distVector = map.get(e.id);
              if (distVector) {
                setDisplacementVector(distVector, displacement, direction);
              }
              currentDisplacementMap.set(e.id, setDisplacementVector(new Vector2(), displacement, direction));
              break;
            }
            case ObjectType.Light:
            case ObjectType.Sensor: {
              const parent = getParent(selectedElement);
              if (parent) {
                let displacementRel = displacement / parent.lx;
                const [newCx, newCy] = getElementNewPosition(e.cx, e.cy, displacementRel, direction);
                const halfLx = e.lx / (2 * parent.lx);
                const halfLy = e.lx / (2 * parent.ly);
                switch (direction) {
                  case MoveDirection.Left:
                  case MoveDirection.Right: {
                    const x = Util.clamp(newCx, -0.5 + halfLx, 0.5 - halfLx);
                    displacementRel = Math.abs(x - selectedElement.cx);
                    break;
                  }
                  case MoveDirection.Up:
                  case MoveDirection.Down: {
                    const y = Util.clamp(newCy, -0.5 + halfLy, 0.5 - halfLy);
                    displacementRel = Math.abs(y - selectedElement.cy);
                    break;
                  }
                }
                const distVector = map.get(e.id);
                if (distVector) {
                  setDisplacementVector(distVector, displacementRel, direction);
                }
                currentDisplacementMap.set(e.id, setDisplacementVector(new Vector2(), displacementRel, direction));
              }
              break;
            }
            case ObjectType.SolarPanel:
            case ObjectType.BatteryStorage:
            case ObjectType.ParabolicDish:
            case ObjectType.ParabolicTrough:
            case ObjectType.FresnelReflector:
            case ObjectType.Heliostat: {
              const parent = getParent(e);
              if (parent) {
                let accept = true;
                let displacementRel = displacement;
                switch (direction) {
                  case MoveDirection.Left:
                  case MoveDirection.Right: {
                    displacementRel = displacement / parent.lx;
                    break;
                  }
                  case MoveDirection.Up:
                  case MoveDirection.Down: {
                    displacementRel = displacement / parent.ly;
                    break;
                  }
                }
                if (e.type === ObjectType.SolarPanel) {
                  const [newCx, newCy] = getElementNewPosition(e.cx, e.cy, displacementRel, direction);
                  accept = isNewPositionOk(e, newCx, newCy);
                }
                if (accept) {
                  const distVector = map.get(e.id);
                  if (distVector) {
                    setDisplacementVector(distVector, displacementRel, direction);
                  }
                  currentDisplacementMap.set(e.id, setDisplacementVector(new Vector2(), displacementRel, direction));
                } else {
                  return;
                }
              }
              break;
            }
          }
        }
      } else {
        for (const e of elementsToBeMoved) {
          switch (e.type) {
            case ObjectType.Foundation:
            case ObjectType.Cuboid:
            case ObjectType.Wall:
            case ObjectType.Tree:
            case ObjectType.Flower:
            case ObjectType.Human: {
              currentDisplacementMap.set(e.id, setDisplacementVector(new Vector2(), displacement, direction));
              break;
            }
            case ObjectType.Light:
            case ObjectType.Sensor: {
              const parent = getParent(selectedElement);
              if (parent) {
                let displacementRel = displacement / parent.lx;
                const [newCx, newCy] = getElementNewPosition(e.cx, e.cy, displacementRel, direction);
                const halfLx = e.lx / (2 * parent.lx);
                const halfLy = e.lx / (2 * parent.ly);
                switch (direction) {
                  case MoveDirection.Left:
                  case MoveDirection.Right: {
                    const x = Util.clamp(newCx, -0.5 + halfLx, 0.5 - halfLx);
                    displacementRel = Math.abs(x - selectedElement.cx);
                    break;
                  }
                  case MoveDirection.Up:
                  case MoveDirection.Down: {
                    const y = Util.clamp(newCy, -0.5 + halfLy, 0.5 - halfLy);
                    displacementRel = Math.abs(y - selectedElement.cy);
                    break;
                  }
                }
                currentDisplacementMap.set(e.id, setDisplacementVector(new Vector2(), displacementRel, direction));
              }
              break;
            }
            case ObjectType.SolarPanel:
            case ObjectType.BatteryStorage:
            case ObjectType.ParabolicDish:
            case ObjectType.ParabolicTrough:
            case ObjectType.FresnelReflector:
            case ObjectType.Heliostat: {
              const parent = getParent(e);
              if (parent) {
                let accept = true;
                let displacementRel = displacement;
                switch (direction) {
                  case MoveDirection.Left:
                  case MoveDirection.Right: {
                    displacementRel = displacement / parent.lx;
                    break;
                  }
                  case MoveDirection.Up:
                  case MoveDirection.Down: {
                    displacementRel = displacement / parent.ly;
                    break;
                  }
                }
                if (e.type === ObjectType.SolarPanel) {
                  const [newCx, newCy] = getElementNewPosition(e.cx, e.cy, displacementRel, direction);
                  accept = isNewPositionOk(e, newCx, newCy);
                }
                if (accept) {
                  currentDisplacementMap.set(e.id, setDisplacementVector(new Vector2(), displacementRel, direction));
                } else {
                  return;
                }
              }
              break;
            }
          }
        }

        const undoableMoveSelected = {
          name: `Move Selected Elements By Key`,
          timestamp: Date.now(),
          direction: direction,
          movedElementsDisplacementMap: new Map(currentDisplacementMap),
          undo: () => {
            updateElementMoveByKey(undoableMoveSelected.movedElementsDisplacementMap, true);
          },
          redo: () => {
            updateElementMoveByKey(undoableMoveSelected.movedElementsDisplacementMap);
          },
        } as UndoableMoveSelectedByKey;
        addUndoable(undoableMoveSelected);
      }
      updateElementMoveByKey(currentDisplacementMap);
    } else {
      const currDistVector = setDisplacementVector(new Vector2(), displacement, direction);
      const lastUndoCommand = useStore.getState().undoManager.getLastUndoCommand();
      // need to update last undo command
      if (needUpdateUndoAll()) {
        const distVector = (lastUndoCommand as UndoableMoveAllByKey).displacement;
        setDisplacementVector(distVector, displacement, direction);
      } else {
        const undoableMoveAll = {
          name: `Move All By Key`,
          timestamp: Date.now(),
          displacement: currDistVector,
          undo: () => {
            updateMovementForAll(undoableMoveAll.displacement, true);
          },
          redo: () => {
            updateMovementForAll(undoableMoveAll.displacement, false);
          },
        } as UndoableMoveAllByKey;
        addUndoable(undoableMoveAll);
      }
      updateMovementForAll(currDistVector);
    }
  };

  const setMultiSelectionMode = (b: boolean) => {
    useStore.getState().set((state) => {
      state.multiSelectionsMode = b;
    });
  };

  const handleKeyDown = (key: string) => {
    const selectedElement = getSelectedElement();
    const step = 5;
    switch (key) {
      case 'left':
        moveByKey(MoveDirection.Left, step);
        break;
      case 'shift+left':
        moveByKey(MoveDirection.Left, step / GRID_RATIO);
        break;
      case 'ctrl+shift+left':
      case 'meta+shift+left':
        moveByKey(MoveDirection.Left, step * GRID_RATIO);
        break;
      case 'right':
        moveByKey(MoveDirection.Right, step);
        break;
      case 'shift+right':
        moveByKey(MoveDirection.Right, step / GRID_RATIO);
        break;
      case 'ctrl+shift+right':
      case 'meta+shift+right':
        moveByKey(MoveDirection.Right, step * GRID_RATIO);
        break;
      case 'down':
        moveByKey(MoveDirection.Down, step);
        break;
      case 'shift+down':
        moveByKey(MoveDirection.Down, step / GRID_RATIO);
        break;
      case 'ctrl+shift+down':
      case 'meta+shift+down':
        moveByKey(MoveDirection.Down, step * GRID_RATIO);
        break;
      case 'up':
        moveByKey(MoveDirection.Up, step);
        break;
      case 'shift+up':
        moveByKey(MoveDirection.Up, step / GRID_RATIO);
        break;
      case 'ctrl+shift+up':
      case 'meta+shift+up':
        moveByKey(MoveDirection.Up, step * GRID_RATIO);
        break;
      case 'ctrl+[':
      case 'meta+[': // for Mac
        zoomView(0.9);
        break;
      case 'ctrl+]':
      case 'meta+]': // for Mac
        zoomView(1.1);
        break;
      case 'ctrl+c':
      case 'meta+c': // for Mac
        if (selectedElement && selectedElement.type !== ObjectType.Roof) {
          copyElementById(selectedElement.id);
          setCommonStore((state) => {
            state.selectedElementIdSet.clear();
            state.selectedElementIdSet.add(selectedElement.id);
          });
          if (loggable) {
            setCommonStore((state) => {
              state.actionInfo = {
                name: 'Copy',
                timestamp: new Date().getTime(),
                elementId: selectedElement.id,
                elementType: selectedElement.type,
              } as ActionInfo;
            });
          }
        }
        break;
      case 'ctrl+x':
      case 'meta+x': // for Mac
        if (!selectedElement || selectedElement.type === ObjectType.Roof) break;
        if (selectedElement.locked) {
          showInfo(i18n.t('message.ThisElementIsLocked', lang));
        } else {
          const cutElements = removeElement(selectedElement.id, true);
          if (cutElements.length === 0) break;

          if (Util.isElementTriggerAutoDeletion(selectedElement)) {
            useRefStore.getState().setListenToAutoDeletionByCut(true);
            usePrimitiveStore.getState().setPrimitiveStore('selectedElementId', selectedElement.id);
          } else {
            const undoableCut = {
              name: 'Cut',
              timestamp: Date.now(),
              deletedElements: cutElements,
              selectedElementId: selectedElement.id,
              undo: () => {
                const cutElements = undoableCut.deletedElements;
                if (cutElements.length === 0) return;

                const selectedElement = cutElements.find((e) => e.id === undoableCut.selectedElementId);
                if (!selectedElement) return;

                setCommonStore((state) => {
                  state.elements.push(...cutElements);
                  state.selectedElementIdSet.clear();
                  state.selectedElementIdSet.add(selectedElement.id);
                  state.selectedElement = selectedElement;
                  if (selectedElement.type === ObjectType.Wall) {
                    const wall = selectedElement as WallModel;
                    let leftWallId: string | null = null;
                    let rightWallId: string | null = null;
                    if (wall.leftJoints.length > 0) {
                      leftWallId = wall.leftJoints[0];
                    }
                    if (wall.rightJoints.length > 0) {
                      rightWallId = wall.rightJoints[0];
                    }
                    if (leftWallId || rightWallId) {
                      for (const e of state.elements) {
                        if (e.id === leftWallId && e.type === ObjectType.Wall) {
                          (e as WallModel).rightJoints[0] = wall.id;
                        }
                        if (e.id === rightWallId && e.type === ObjectType.Wall) {
                          (e as WallModel).leftJoints[0] = wall.id;
                        }
                      }
                    }
                  }
                });
              },
              redo: () => {
                if (undoableCut.deletedElements && undoableCut.deletedElements.length > 0) {
                  removeElement(undoableCut.deletedElements[0].id, true);
                }
              },
            } as UndoableDelete;
            addUndoable(undoableCut);
          }
        }
        break;
      case 'ctrl+v':
      case 'meta+v': {
        // for Mac
        const pastedElements = pasteElements();
        if (pastedElements.length > 0) {
          const undoablePaste = {
            name: 'Paste by Key',
            timestamp: Date.now(),
            pastedElements: JSON.parse(JSON.stringify(pastedElements)),
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
        break;
      }
      case 'ctrl+alt+h': // for Mac and Chrome OS
      case 'ctrl+home': {
        if (!orthographic) {
          const cameraPosition = useStore.getState().viewState.cameraPosition;
          const panCenter = useStore.getState().viewState.panCenter;

          // if not already reset
          if (
            cameraPosition[0] !== cameraPosition[1] ||
            cameraPosition[1] !== cameraPosition[2] ||
            cameraPosition[0] !== cameraPosition[2] ||
            panCenter[0] !== 0 ||
            panCenter[1] !== 0 ||
            panCenter[2] !== 0
          ) {
            const undoableResetView = {
              name: 'Reset View',
              timestamp: Date.now(),
              oldCameraPosition: [...cameraPosition],
              oldPanCenter: [...panCenter],
              undo: () => {
                const orbitControlsRef = useRefStore.getState().orbitControlsRef;
                if (orbitControlsRef?.current) {
                  orbitControlsRef.current.object.position.set(
                    undoableResetView.oldCameraPosition[0],
                    undoableResetView.oldCameraPosition[1],
                    undoableResetView.oldCameraPosition[2],
                  );
                  orbitControlsRef.current.target.set(
                    undoableResetView.oldPanCenter[0],
                    undoableResetView.oldPanCenter[1],
                    undoableResetView.oldPanCenter[2],
                  );
                  orbitControlsRef.current.update();
                  setCommonStore((state) => {
                    const v = state.viewState;
                    v.cameraPosition = [...undoableResetView.oldCameraPosition];
                    v.panCenter = [...undoableResetView.oldPanCenter];
                  });
                }
              },
              redo: () => {
                resetView();
              },
            } as UndoableResetView;
            addUndoable(undoableResetView);
            setCommonStore((state) => {
              state.objectTypeToAdd = ObjectType.None;
              state.groupActionMode = false;
              state.viewState.orthographic = false;
            });
            resetView();
          }
        }
        break;
      }
      case 'f2':
      case 'ctrl+b':
      case 'meta+b':
        toggle2DView();
        break;
      case 'ctrl+u':
      case 'meta+u':
        toggleNavigationView();
        break;
      case 'f4':
      case 'ctrl+m':
      case 'meta+m':
        toggleAutoRotate();
        break;
      case 'ctrl+f':
      case 'meta+f': // for Mac
        usePrimitiveStore.getState().set((state) => {
          state.createNewFileFlag = true;
          state.openModelsMap = false;
        });
        setCommonStore((state) => {
          state.objectTypeToAdd = ObjectType.None;
          state.groupActionMode = false;
          window.history.pushState({}, document.title, HOME_URL);
          if (loggable) logAction('Create New File');
        });
        break;
      case 'ctrl+s':
      case 'meta+s': // for Mac
        usePrimitiveStore.getState().set((state) => {
          state.saveLocalFileDialogVisible = true;
        });
        if (loggable) logAction('Save Local File');
        break;
      case 'ctrl+shift+o':
      case 'meta+shift+o': // for Mac
        usePrimitiveStore.getState().set((state) => {
          state.listCloudFilesFlag = true;
          state.openModelsMap = false;
        });
        if (loggable) logAction('List Cloud Files');
        break;
      case 'ctrl+shift+s':
      case 'meta+shift+s': // for Mac
        usePrimitiveStore.getState().setSaveCloudFileFlag(true);
        if (loggable) logAction('Save Cloud File');
        break;
      case 'alt+backspace':
      case 'backspace':
      case 'delete': {
        const selectedElementIdSet = useStore.getState().selectedElementIdSet;
        if (!selectedElement || selectedElementIdSet.size === 0) break;

        const deletedElements = useStore.getState().removeSelectedElements();
        if (deletedElements.length === 0) break;

        const ifNeedTriggerAutoDeletion = () => {
          const foundations = deletedElements.filter((e) => e.type === ObjectType.Foundation);
          const foundationsIdSet = new Set(foundations.map((e) => e.id));
          const trigger = deletedElements.find(
            (e) => !foundationsIdSet.has(e.parentId) && Util.isElementTriggerAutoDeletion(e),
          );
          return !!trigger;
        };

        if (ifNeedTriggerAutoDeletion()) {
          // handle undo in AutoDeletionListener
          useRefStore.getState().setListenToAutoDeletionByDelete(true);
          usePrimitiveStore.getState().setPrimitiveStore('selectedElementId', selectedElement.id);
        } else {
          if (deletedElements.length === 1) {
            const undoableDelete = {
              name: 'Delete',
              timestamp: Date.now(),
              deletedElements: [...deletedElements],
              selectedElementId: selectedElement.id,
              undo: () => {
                const deletedElements = undoableDelete.deletedElements;
                if (!deletedElements || deletedElements.length === 0) return;
                setCommonStore((state) => {
                  state.elements.push(...deletedElements);
                  state.selectedElementIdSet.clear();
                  const selectedElement = state.elements.find((e) => e.id === undoableDelete.selectedElementId);
                  if (selectedElement) {
                    state.selectedElementIdSet.add(selectedElement.id);
                    state.selectedElement = selectedElement;
                  }
                  state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
                  state.deletedRoofId = null;
                  state.deletedRoofIdSet.clear();
                });
                if (selectedElement.type === ObjectType.Wall) {
                  const wall = selectedElement as WallModel;
                  if (wall.leftJoints.length > 0) {
                    updateWallRightJointsById(wall.leftJoints[0], [wall.id]);
                  }
                  if (wall.rightJoints.length > 0) {
                    updateWallLeftJointsById(wall.rightJoints[0], [wall.id]);
                  }
                }
              },
              redo: () => {
                const deletedElements = undoableDelete.deletedElements;
                if (!deletedElements || deletedElements.length === 0) return;
                const selectedElement = deletedElements.find((e) => e.id === undoableDelete.selectedElementId);
                if (!selectedElement) return;
                removeElement(selectedElement.id, false);
              },
            } as UndoableDelete;
            addUndoable(undoableDelete);
          } else {
            const undoableDeleteMultiple = {
              name: 'Delete Multiple',
              timestamp: Date.now(),
              deletedElements: [...deletedElements],
              selectedElementId: selectedElement.id,
              selectedElementIdSet: new Set(selectedElementIdSet),
              undo() {
                const deletedElements = this.deletedElements;
                if (!deletedElements || deletedElements.length === 0) return;
                const selectedElement = deletedElements.find((e) => e.id === this.selectedElementId);
                if (!selectedElement) return;
                setCommonStore((state) => {
                  state.elements.push(...deletedElements);
                  state.selectedElement = selectedElement;
                  state.selectedElementIdSet = new Set(this.selectedElementIdSet);
                  state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
                  state.deletedRoofId = null;
                  state.deletedRoofIdSet.clear();
                });
                for (const e of this.deletedElements) {
                  if (e.type === ObjectType.Wall) {
                    const wall = e as WallModel;
                    if (wall.leftJoints.length > 0) {
                      updateWallRightJointsById(wall.leftJoints[0], [wall.id]);
                    }
                    if (wall.rightJoints.length > 0) {
                      updateWallLeftJointsById(wall.rightJoints[0], [wall.id]);
                    }
                  }
                }
              },
              redo() {
                setCommonStore((state) => {
                  state.selectedElement = state.elements.find((e) => e.id === this.selectedElementId) ?? null;
                  state.selectedElementIdSet = new Set(this.selectedElementIdSet);
                });
                useStore.getState().removeSelectedElements();
              },
            } as UndoableDeleteMultiple;
            addUndoable(undoableDeleteMultiple);
          }
          setCommonStore((state) => {
            state.selectedElement = null;
            state.selectedElementIdSet.clear();
          });
        }
        break;
      }
      case 'ctrl+z':
      case 'meta+z': // for Mac
        if (undoManager.hasUndo()) {
          const commandName = undoManager.undo();
          if (commandName) {
            message.destroy();
            showInfo(i18n.t('menu.edit.Undo', lang) + ': ' + commandName, UNDO_SHOW_INFO_DURATION);
          }
          if (useStore.getState().groupActionMode) {
            setCommonStore((state) => {
              state.groupActionUpdateFlag = !state.groupActionUpdateFlag;
            });
          }
          if (loggable) logAction('Undo');
        }
        break;
      case 'ctrl+y':
      case 'meta+y': // for Mac
        if (undoManager.hasRedo()) {
          const commandName = undoManager.redo();
          if (commandName) {
            message.destroy();
            showInfo(i18n.t('menu.edit.Redo', lang) + ': ' + commandName, UNDO_SHOW_INFO_DURATION);
          }
          if (useStore.getState().groupActionMode) {
            setCommonStore((state) => {
              state.groupActionUpdateFlag = !state.groupActionUpdateFlag;
            });
          }
          if (loggable) logAction('Redo');
        }
        break;
      case 'shift':
        if (useStore.getState().viewState.navigationView) {
          usePrimitiveStore.getState().set((state) => {
            state.navigationMoveSpeed = 5 * useStore.getState().minimumNavigationMoveSpeed;
            state.navigationTurnSpeed = 5 * useStore.getState().minimumNavigationTurnSpeed;
          });
        }
        setEnableFineGrid(true);
        break;
      case 'esc': {
        const addedFoundationID = useStore.getState().addedFoundationId;
        const addedCuboidId = useStore.getState().addedCuboidId;
        const addedRulerId = useStore.getState().addedRulerId;
        const addedWallId = useStore.getState().addedWallId;
        const addedWindowId = useStore.getState().addedWindowId;
        const addedDoorId = useStore.getState().addedDoorId;
        if (addedFoundationID) {
          removeElementById(addedFoundationID, false);
        } else if (addedCuboidId) {
          removeElementById(addedCuboidId, false);
        } else if (addedRulerId) {
          removeElementById(addedRulerId, false);
        } else if (addedWallId) {
          removeElementById(addedWallId, false);
        } else if (addedWindowId) {
          removeElementById(addedWindowId, false);
          usePrimitiveStore.getState().setPrimitiveStore('elementBeingCanceledId', addedWindowId);
        } else if (addedDoorId) {
          removeElementById(addedDoorId, false);
          usePrimitiveStore.getState().setPrimitiveStore('elementBeingCanceledId', addedDoorId);
        }
        setCommonStore((state) => {
          state.objectTypeToAdd = ObjectType.None;
          state.actionModeLock = false;
          state.moveHandleType = null;
          state.resizeHandleType = null;
          state.groupActionMode = false;
        });
        useRefStore.getState().setEnableOrbitController(true);
        selectNone();
        break;
      }
      case 'ctrl': {
        setMultiSelectionMode(true);
        break;
      }
    }
  };

  const handleKeyUp = (key: string) => {
    switch (key) {
      case 'shift':
        if (useStore.getState().viewState.navigationView) {
          usePrimitiveStore.getState().set((state) => {
            state.navigationMoveSpeed = useStore.getState().minimumNavigationMoveSpeed;
            state.navigationTurnSpeed = useStore.getState().minimumNavigationTurnSpeed;
          });
        }
        setEnableFineGrid(false);
        break;
      case 'ctrl+o':
      case 'meta+o': // for Mac
        // this must be handled as a key-up event because it brings up a native file dialog
        // when the key is down and the corresponding key-up event would never be processed as the focus is lost
        if (!useStore.getState().localFileDialogRequested) {
          usePrimitiveStore.getState().set((state) => {
            state.openLocalFileFlag = true;
          });
          setCommonStore((state) => {
            state.localFileDialogRequested = true;
            if (loggable) state.logAction('Open Local File');
          });
        }
        break;
      case 'ctrl': {
        setMultiSelectionMode(false);
        break;
      }
    }
  };

  useEffect(
    () => () => {
      keyNameRef.current = null;
    },
    [],
  );

  const keyNameRef = useRef<string | null>(null);

  return (
    <>
      <KeyboardEventHandler
        handleFocusableElements={false}
        handleKeys={handleKeys}
        handleEventType={'keydown'}
        onKeyEvent={(key, e) => {
          e.preventDefault();
          if (keyNameRef.current === key) return;
          keyNameRef.current = key;
          handleKeyDown(key);
        }}
      />
      <KeyboardEventHandler
        handleFocusableElements={false}
        handleKeys={handleKeys}
        handleEventType={'keyup'}
        onKeyEvent={(key, e) => {
          e.preventDefault();
          keyNameRef.current = null;
          handleKeyUp(key);
        }}
      />
      <AutoDeletionListener />
    </>
  );
});

export default KeyboardListener;
