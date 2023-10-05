/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { ActionInfo, ObjectType } from './types';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { UndoableDelete, UndoableDeleteMultiple } from './undo/UndoableDelete';
import { UndoablePaste } from './undo/UndoablePaste';
import { UndoableCheck } from './undo/UndoableCheck';
import { UndoableResetView } from './undo/UndoableResetView';
import { showError, showInfo } from './helpers';
import i18n from './i18n/i18n';
import { UndoableMoveInX } from './undo/UndoableMoveInX';
import { UndoableMoveInY } from './undo/UndoableMoveInY';
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

export interface KeyboardListenerProps {
  canvas?: HTMLCanvasElement | null;
  set2DView: (selected: boolean) => void;
  setNavigationView: (selected: boolean) => void;
  resetView: () => void;
  zoomView: (scale: number) => void;
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
    useRefStore.setState((state) => {
      state.listenToAutoDeletionByDeleteRef = listenToAutoDeletionByDeleteRef;
      state.listenToAutoDeletionByCutRef = listenToAutoDeletionByCutRef;
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

const KeyboardListener = ({ canvas, set2DView, setNavigationView, resetView, zoomView }: KeyboardListenerProps) => {
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
  const updateElementCxById = useStore(Selector.updateElementCxById);
  const updateElementCyById = useStore(Selector.updateElementCyById);
  const updateWallLeftJointsById = useStore(Selector.updateWallLeftJointsById);
  const updateWallRightJointsById = useStore(Selector.updateWallRightJointsById);
  const setEnableFineGrid = useStore(Selector.setEnableFineGrid);
  const overlapWithSibling = useStore(Selector.overlapWithSibling);

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

  const toggleNatigationView = () => {
    if (orthographic) return;
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

  const moveLeft = (scale: number) => {
    if (orthographic) {
      const selectedElement = getSelectedElement();
      if (selectedElement) {
        let displacement = 0;
        switch (selectedElement.type) {
          case ObjectType.Foundation:
          case ObjectType.Cuboid: {
            displacement = -moveStepAbsolute;
            if (useStore.getState().groupActionMode) {
              setCommonStore((state) => {
                state.groupActionUpdateFlag = !state.groupActionUpdateFlag;
              });
            }
            break;
          }
          case ObjectType.Tree:
          case ObjectType.Flower:
          case ObjectType.Human: {
            displacement = -moveStepAbsolute;
            break;
          }
          case ObjectType.Wall: {
            const wall = selectedElement as WallModel;
            if (wall.leftJoints.length === 0 && wall.rightJoints.length === 0) {
              displacement = -moveStepAbsolute;
            }
            break;
          }
          case ObjectType.Sensor: {
            const parent = getParent(selectedElement);
            if (parent) {
              const halfLx = selectedElement.lx / (2 * parent.lx);
              const x = Math.max(-0.5 + halfLx, selectedElement.cx - moveStepAbsolute / parent.lx);
              displacement = x - selectedElement.cx;
            }
            break;
          }
          case ObjectType.SolarPanel:
          case ObjectType.ParabolicDish:
          case ObjectType.ParabolicTrough:
          case ObjectType.FresnelReflector:
          case ObjectType.Heliostat: {
            const parent = getParent(selectedElement);
            if (parent) {
              displacement = -moveStepAbsolute / parent.lx;
            }
            break;
          }
        }
        if (displacement !== 0) {
          let accept = true;
          // for the time being, we deal with solar panels only
          if (selectedElement.type === ObjectType.SolarPanel) {
            accept = isNewPositionOk(selectedElement, selectedElement.cx + displacement, selectedElement.cy);
          }
          if (accept) {
            displacement *= scale;
            const undoableMoveLeft = {
              name: 'Move Left',
              timestamp: Date.now(),
              displacement: displacement,
              movedElementId: selectedElement.id,
              movedElementType: selectedElement.type,
              undo: () => {
                const elem = useStore.getState().getElementById(undoableMoveLeft.movedElementId);
                if (elem) {
                  updateElementCxById(elem.id, elem.cx - undoableMoveLeft.displacement);
                }
              },
              redo: () => {
                const elem = useStore.getState().getElementById(undoableMoveLeft.movedElementId);
                if (elem) {
                  updateElementCxById(elem.id, elem.cx + undoableMoveLeft.displacement);
                }
              },
            } as UndoableMoveInX;
            addUndoable(undoableMoveLeft);
            updateElementCxById(selectedElement.id, selectedElement.cx + displacement);
          }
        }
      } else {
        // if no element is selected, move everything
        const displacement = -moveStepAbsolute * scale;
        const undoableMoveAllLeft = {
          name: 'Move All Left',
          timestamp: Date.now(),
          displacement: displacement,
          undo: () => {
            for (const e of useStore.getState().elements) {
              if (Util.isFoundationOrCuboid(e) || (Util.isPlantOrHuman(e) && e.parentId === GROUND_ID)) {
                updateElementCxById(e.id, e.cx - undoableMoveAllLeft.displacement);
              }
            }
          },
          redo: () => {
            for (const e of useStore.getState().elements) {
              if (Util.isFoundationOrCuboid(e) || (Util.isPlantOrHuman(e) && e.parentId === GROUND_ID)) {
                updateElementCxById(e.id, e.cx + undoableMoveAllLeft.displacement);
              }
            }
          },
        } as UndoableMoveInX;
        addUndoable(undoableMoveAllLeft);
        for (const e of useStore.getState().elements) {
          if (Util.isFoundationOrCuboid(e) || (Util.isPlantOrHuman(e) && e.parentId === GROUND_ID)) {
            updateElementCxById(e.id, e.cx + displacement);
          }
        }
      }
    }
  };

  const moveRight = (scale: number) => {
    if (orthographic) {
      const selectedElement = getSelectedElement();
      if (selectedElement) {
        let displacement = 0;
        switch (selectedElement.type) {
          case ObjectType.Foundation:
          case ObjectType.Cuboid: {
            displacement = moveStepAbsolute;
            if (useStore.getState().groupActionMode) {
              setCommonStore((state) => {
                state.groupActionUpdateFlag = !state.groupActionUpdateFlag;
              });
            }
            break;
          }
          case ObjectType.Tree:
          case ObjectType.Flower:
          case ObjectType.Human: {
            displacement = moveStepAbsolute;
            break;
          }
          case ObjectType.Wall: {
            const wall = selectedElement as WallModel;
            if (wall.leftJoints.length === 0 && wall.rightJoints.length === 0) {
              displacement = moveStepAbsolute;
            }
            break;
          }
          case ObjectType.Sensor: {
            const parent = getParent(selectedElement);
            if (parent) {
              const halfLx = parent ? selectedElement.lx / (2 * parent.lx) : 0;
              const x = Math.min(0.5 - halfLx, selectedElement.cx + moveStepAbsolute / parent.lx);
              displacement = x - selectedElement.cx;
            }
            break;
          }
          case ObjectType.SolarPanel:
          case ObjectType.ParabolicDish:
          case ObjectType.ParabolicTrough:
          case ObjectType.FresnelReflector:
          case ObjectType.Heliostat: {
            const parent = getParent(selectedElement);
            if (parent) {
              displacement = moveStepAbsolute / parent.lx;
            }
            break;
          }
        }
        if (displacement !== 0) {
          let accept = true;
          // for the time being, we deal with solar panels only
          if (selectedElement.type === ObjectType.SolarPanel) {
            accept = isNewPositionOk(selectedElement, selectedElement.cx + displacement, selectedElement.cy);
          }
          if (accept) {
            displacement *= scale;
            const undoableMoveRight = {
              name: 'Move Right',
              timestamp: Date.now(),
              displacement: displacement,
              movedElementId: selectedElement.id,
              movedElementType: selectedElement.type,
              undo: () => {
                const elem = useStore.getState().getElementById(undoableMoveRight.movedElementId);
                if (elem) {
                  updateElementCxById(elem.id, elem.cx - undoableMoveRight.displacement);
                }
              },
              redo: () => {
                const elem = useStore.getState().getElementById(undoableMoveRight.movedElementId);
                if (elem) {
                  updateElementCxById(elem.id, elem.cx + undoableMoveRight.displacement);
                }
              },
            } as UndoableMoveInX;
            addUndoable(undoableMoveRight);
            updateElementCxById(selectedElement.id, selectedElement.cx + displacement);
          }
        }
      } else {
        // if no element is selected, move everything
        const displacement = moveStepAbsolute * scale;
        const undoableMoveAllRight = {
          name: 'Move All Right',
          timestamp: Date.now(),
          displacement: displacement,
          undo: () => {
            for (const e of useStore.getState().elements) {
              if (Util.isFoundationOrCuboid(e) || (Util.isPlantOrHuman(e) && e.parentId === GROUND_ID)) {
                updateElementCxById(e.id, e.cx - undoableMoveAllRight.displacement);
              }
            }
          },
          redo: () => {
            for (const e of useStore.getState().elements) {
              if (Util.isFoundationOrCuboid(e) || (Util.isPlantOrHuman(e) && e.parentId === GROUND_ID)) {
                updateElementCxById(e.id, e.cx + undoableMoveAllRight.displacement);
              }
            }
          },
        } as UndoableMoveInX;
        addUndoable(undoableMoveAllRight);
        for (const e of useStore.getState().elements) {
          if (Util.isFoundationOrCuboid(e) || (Util.isPlantOrHuman(e) && e.parentId === GROUND_ID)) {
            updateElementCxById(e.id, e.cx + displacement);
          }
        }
      }
    }
  };

  const moveUp = (scale: number) => {
    if (orthographic) {
      const selectedElement = getSelectedElement();
      if (selectedElement) {
        let displacement = 0;
        switch (selectedElement.type) {
          case ObjectType.Foundation:
          case ObjectType.Cuboid: {
            displacement = moveStepAbsolute;
            if (useStore.getState().groupActionMode) {
              setCommonStore((state) => {
                state.groupActionUpdateFlag = !state.groupActionUpdateFlag;
              });
            }
            break;
          }
          case ObjectType.Tree:
          case ObjectType.Flower:
          case ObjectType.Human: {
            displacement = moveStepAbsolute;
            break;
          }
          case ObjectType.Wall: {
            const wall = selectedElement as WallModel;
            if (wall.leftJoints.length === 0 && wall.rightJoints.length === 0) {
              displacement = moveStepAbsolute;
            }
            break;
          }
          case ObjectType.Sensor: {
            const parent = getParent(selectedElement);
            if (parent) {
              const halfLy = parent ? selectedElement.ly / (2 * parent.ly) : 0;
              const y = Math.min(0.5 - halfLy, selectedElement.cy + moveStepAbsolute / parent.ly);
              displacement = y - selectedElement.cy;
            }
            break;
          }
          case ObjectType.SolarPanel:
          case ObjectType.ParabolicDish:
          case ObjectType.ParabolicTrough:
          case ObjectType.FresnelReflector:
          case ObjectType.Heliostat: {
            const parent = getParent(selectedElement);
            if (parent) {
              displacement = moveStepAbsolute / parent.ly;
            }
            break;
          }
        }
        if (displacement !== 0) {
          let accept = true;
          // for the time being, we deal with solar panels only
          if (selectedElement.type === ObjectType.SolarPanel) {
            accept = isNewPositionOk(selectedElement, selectedElement.cx, selectedElement.cy + displacement);
          }
          if (accept) {
            displacement *= scale;
            const undoableMoveUp = {
              name: 'Move Up',
              timestamp: Date.now(),
              displacement: displacement,
              movedElementId: selectedElement.id,
              movedElementType: selectedElement.type,
              undo: () => {
                const elem = useStore.getState().getElementById(undoableMoveUp.movedElementId);
                if (elem) {
                  updateElementCyById(elem.id, elem.cy - undoableMoveUp.displacement);
                }
              },
              redo: () => {
                const elem = useStore.getState().getElementById(undoableMoveUp.movedElementId);
                if (elem) {
                  updateElementCyById(elem.id, elem.cy + undoableMoveUp.displacement);
                }
              },
            } as UndoableMoveInY;
            addUndoable(undoableMoveUp);
            updateElementCyById(selectedElement.id, selectedElement.cy + displacement);
          }
        }
      } else {
        // if no element is selected, move everything
        const displacement = moveStepAbsolute * scale;
        const undoableMoveAllUp = {
          name: 'Move All Up',
          timestamp: Date.now(),
          displacement: displacement,
          undo: () => {
            for (const e of useStore.getState().elements) {
              if (Util.isFoundationOrCuboid(e) || (Util.isPlantOrHuman(e) && e.parentId === GROUND_ID)) {
                updateElementCyById(e.id, e.cy - undoableMoveAllUp.displacement);
              }
            }
          },
          redo: () => {
            for (const e of useStore.getState().elements) {
              if (Util.isFoundationOrCuboid(e) || (Util.isPlantOrHuman(e) && e.parentId === GROUND_ID)) {
                updateElementCyById(e.id, e.cy + undoableMoveAllUp.displacement);
              }
            }
          },
        } as UndoableMoveInY;
        addUndoable(undoableMoveAllUp);
        for (const e of useStore.getState().elements) {
          if (Util.isFoundationOrCuboid(e) || (Util.isPlantOrHuman(e) && e.parentId === GROUND_ID)) {
            updateElementCyById(e.id, e.cy + displacement);
          }
        }
      }
    }
  };

  const moveDown = (scale: number) => {
    if (orthographic) {
      const selectedElement = getSelectedElement();
      if (selectedElement) {
        let displacement = 0;
        switch (selectedElement.type) {
          case ObjectType.Foundation:
          case ObjectType.Cuboid: {
            displacement = -moveStepAbsolute;
            if (useStore.getState().groupActionMode) {
              setCommonStore((state) => {
                state.groupActionUpdateFlag = !state.groupActionUpdateFlag;
              });
            }
            break;
          }
          case ObjectType.Tree:
          case ObjectType.Flower:
          case ObjectType.Human: {
            displacement = -moveStepAbsolute;
            break;
          }
          case ObjectType.Wall: {
            const wall = selectedElement as WallModel;
            if (wall.leftJoints.length === 0 && wall.rightJoints.length === 0) {
              displacement = -moveStepAbsolute;
            }
            break;
          }
          case ObjectType.Sensor: {
            const parent = getParent(selectedElement);
            if (parent) {
              const halfLy = parent ? selectedElement.ly / (2 * parent.ly) : 0;
              const y = Math.max(-0.5 + halfLy, selectedElement.cy - moveStepAbsolute / parent.ly);
              displacement = y - selectedElement.cy;
            }
            break;
          }
          case ObjectType.SolarPanel:
          case ObjectType.ParabolicDish:
          case ObjectType.ParabolicTrough:
          case ObjectType.FresnelReflector:
          case ObjectType.Heliostat: {
            const parent = getParent(selectedElement);
            if (parent) {
              displacement = -moveStepAbsolute / parent.ly;
            }
            break;
          }
        }
        if (displacement !== 0) {
          let accept = true;
          // for the time being, we deal with solar panels only
          if (selectedElement.type === ObjectType.SolarPanel) {
            accept = isNewPositionOk(selectedElement, selectedElement.cx, selectedElement.cy + displacement);
          }
          if (accept) {
            displacement *= scale;
            const undoableMoveDown = {
              name: 'Move Down',
              timestamp: Date.now(),
              displacement: displacement,
              movedElementId: selectedElement.id,
              movedElementType: selectedElement.type,
              undo: () => {
                const elem = useStore.getState().getElementById(undoableMoveDown.movedElementId);
                if (elem) {
                  updateElementCyById(elem.id, elem.cy - undoableMoveDown.displacement);
                }
              },
              redo: () => {
                const elem = useStore.getState().getElementById(undoableMoveDown.movedElementId);
                if (elem) {
                  updateElementCyById(elem.id, elem.cy + undoableMoveDown.displacement);
                }
              },
            } as UndoableMoveInY;
            addUndoable(undoableMoveDown);
            updateElementCyById(selectedElement.id, selectedElement.cy + displacement);
          }
        }
      } else {
        // if no element is selected, move everything
        const displacement = -moveStepAbsolute * scale;
        const undoableMoveAllDown = {
          name: 'Move All Down',
          timestamp: Date.now(),
          displacement: displacement,
          undo: () => {
            for (const e of useStore.getState().elements) {
              if (Util.isFoundationOrCuboid(e) || (Util.isPlantOrHuman(e) && e.parentId === GROUND_ID)) {
                updateElementCyById(e.id, e.cy - undoableMoveAllDown.displacement);
              }
            }
          },
          redo: () => {
            for (const e of useStore.getState().elements) {
              if (Util.isFoundationOrCuboid(e) || (Util.isPlantOrHuman(e) && e.parentId === GROUND_ID)) {
                updateElementCyById(e.id, e.cy + undoableMoveAllDown.displacement);
              }
            }
          },
        } as UndoableMoveInY;
        addUndoable(undoableMoveAllDown);
        for (const e of useStore.getState().elements) {
          if (Util.isFoundationOrCuboid(e) || (Util.isPlantOrHuman(e) && e.parentId === GROUND_ID)) {
            updateElementCyById(e.id, e.cy + displacement);
          }
        }
      }
    }
  };

  const setMultiSelectionMode = (b: boolean) => {
    useStore.getState().set((state) => {
      state.multiSelectionsMode = b;
    });
  };

  const handleKeyDown = (key: string) => {
    const selectedElement = getSelectedElement();
    const step = 1;
    switch (key) {
      case 'left':
        moveLeft(step);
        break;
      case 'shift+left':
        moveLeft(step / GRID_RATIO);
        break;
      case 'ctrl+shift+left':
      case 'meta+shift+left':
        moveLeft(step * GRID_RATIO);
        break;
      case 'right':
        moveRight(step);
        break;
      case 'shift+right':
        moveRight(step / GRID_RATIO);
        break;
      case 'ctrl+shift+right':
      case 'meta+shift+right':
        moveRight(step * GRID_RATIO);
        break;
      case 'down':
        moveDown(step);
        break;
      case 'shift+down':
        moveDown(step / GRID_RATIO);
        break;
      case 'ctrl+shift+down':
      case 'meta+shift+down':
        moveDown(step * GRID_RATIO);
        break;
      case 'up':
        moveUp(step);
        break;
      case 'shift+up':
        moveUp(step / GRID_RATIO);
        break;
      case 'ctrl+shift+up':
      case 'meta+shift+up':
        moveUp(step * GRID_RATIO);
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
      case 'meta+v': // for Mac
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
      case 'ctrl+alt+h': // for Mac and Chrome OS
      case 'ctrl+home':
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
      case 'f2':
      case 'ctrl+b':
      case 'meta+b':
        toggle2DView();
        break;
      case 'ctrl+u':
      case 'meta+u':
        toggleNatigationView();
        break;
      case 'f4':
      case 'ctrl+m':
      case 'meta+m':
        toggleAutoRotate();
        break;
      case 'ctrl+f':
      case 'meta+f': // for Mac
        setCommonStore((state) => {
          state.createNewFileFlag = true;
          state.objectTypeToAdd = ObjectType.None;
          state.groupActionMode = false;
          window.history.pushState({}, document.title, HOME_URL);
          if (loggable) {
            state.actionInfo = {
              name: 'Create New File',
              timestamp: new Date().getTime(),
            };
          }
        });
        usePrimitiveStore.setState((state) => {
          state.openModelsMap = false;
        });
        break;
      case 'ctrl+s':
      case 'meta+s': // for Mac
        usePrimitiveStore.setState((state) => {
          state.saveLocalFileDialogVisible = true;
        });
        if (loggable) {
          setCommonStore((state) => {
            state.actionInfo = {
              name: 'Save Local File',
              timestamp: new Date().getTime(),
            };
          });
        }
        break;
      case 'ctrl+shift+o':
      case 'meta+shift+o': // for Mac
        usePrimitiveStore.setState((state) => {
          state.listCloudFilesFlag = true;
          state.openModelsMap = false;
        });
        if (loggable) {
          setCommonStore((state) => {
            state.actionInfo = {
              name: 'List Cloud Files',
              timestamp: new Date().getTime(),
            };
          });
        }
        break;
      case 'ctrl+shift+s':
      case 'meta+shift+s': // for Mac
        usePrimitiveStore.getState().setSaveCloudFileFlag(true);
        if (loggable) {
          setCommonStore((state) => {
            state.actionInfo = {
              name: 'Save Cloud File',
              timestamp: new Date().getTime(),
            };
          });
        }
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
                const selectedElement = deletedElements.find((e) => e.id === undoableDelete.selectedElementId);
                if (!selectedElement) return;
                setCommonStore((state) => {
                  state.elements.push(...deletedElements);
                  state.selectedElementIdSet.clear();
                  state.selectedElementIdSet.add(selectedElement.id);
                  state.selectedElement = selectedElement;
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
          if (useStore.getState().groupActionMode) {
            setCommonStore((state) => {
              state.groupActionUpdateFlag = !state.groupActionUpdateFlag;
            });
          }
          if (commandName) showInfo(i18n.t('menu.edit.Undo', lang) + ': ' + commandName, UNDO_SHOW_INFO_DURATION);
          if (loggable) {
            setCommonStore((state) => {
              state.actionInfo = {
                name: 'Undo',
                timestamp: new Date().getTime(),
              } as ActionInfo;
            });
          }
        }
        break;
      case 'ctrl+y':
      case 'meta+y': // for Mac
        if (undoManager.hasRedo()) {
          const commandName = undoManager.redo();
          if (commandName) showInfo(i18n.t('menu.edit.Redo', lang) + ': ' + commandName, UNDO_SHOW_INFO_DURATION);
          if (useStore.getState().groupActionMode) {
            setCommonStore((state) => {
              state.groupActionUpdateFlag = !state.groupActionUpdateFlag;
            });
          }
          if (loggable) {
            setCommonStore((state) => {
              state.actionInfo = {
                name: 'Redo',
                timestamp: new Date().getTime(),
              } as ActionInfo;
            });
          }
        }
        break;
      case 'shift':
        if (useStore.getState().viewState.navigationView) {
          usePrimitiveStore.setState((state) => {
            state.navigationMoveSpeed = 5 * useStore.getState().minimumNavigationMoveSpeed;
            state.navigationTurnSpeed = 5 * useStore.getState().minimumNavigationTurnSpeed;
          });
        }
        setEnableFineGrid(true);
        break;
      case 'esc': {
        const addedFoundationID = useStore.getState().addedFoundationId;
        const addedCuboidId = useStore.getState().addedCuboidId;
        const addedWallId = useStore.getState().addedWallId;
        const addedWindowId = useStore.getState().addedWindowId;
        const addedDoorId = useStore.getState().addedDoorId;
        if (addedFoundationID) {
          removeElementById(addedFoundationID, false);
        } else if (addedCuboidId) {
          removeElementById(addedCuboidId, false);
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
          usePrimitiveStore.setState((state) => {
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
          setCommonStore((state) => {
            state.localFileDialogRequested = true;
            state.openLocalFileFlag = true;
            if (loggable) {
              state.actionInfo = {
                name: 'Open Local File',
                timestamp: new Date().getTime(),
              };
            }
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
};

export default React.memo(KeyboardListener);
