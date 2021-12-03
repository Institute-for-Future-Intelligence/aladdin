/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect } from 'react';
import { ObjectType } from './types';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { ElementModel } from './models/ElementModel';
import { UndoableDelete } from './undo/UndoableDelete';
import { UndoablePaste } from './undo/UndoablePaste';
import { UndoableCheck } from './undo/UndoableCheck';
import { UndoableResetView } from './undo/UndoableResetView';

export interface KeyboardListenerProps {
  keyFlag: boolean; // flip this every time to ensure that handleKey is called in useEffect
  keyName: string | undefined;
  keyDown: boolean;
  keyUp: boolean;
  canvas?: HTMLCanvasElement;
  set2DView: (selected: boolean) => void;
  resetView: () => void;
  zoomView: (scale: number) => void;
}

const KeyboardListener = ({
  keyFlag,
  keyName,
  keyDown,
  keyUp,
  canvas,
  set2DView,
  resetView,
  zoomView,
}: KeyboardListenerProps) => {
  const setCommonStore = useStore(Selector.set);
  const undoManager = useStore(Selector.undoManager);
  const addUndoable = useStore(Selector.addUndoable);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const autoRotate = useStore(Selector.viewState.autoRotate);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const copyElementById = useStore(Selector.copyElementById);
  const removeElementById = useStore(Selector.removeElementById);
  const pasteElements = useStore(Selector.pasteElementsByKey);
  const getElementById = useStore(Selector.getElementById);
  const setElementPosition = useStore(Selector.setElementPosition);
  const setEnableFineGrid = useStore(Selector.setEnableFineGrid);
  const localFileDialogRequested = useStore(Selector.localFileDialogRequested);
  const buildingWallID = useStore(Selector.buildingWallID);
  const cameraPosition = useStore(Selector.viewState.cameraPosition);
  const panCenter = useStore(Selector.viewState.panCenter);
  const buildingWindowID = useStore(Selector.buildingWindowID);

  const moveStepRelative = 0.01;
  const moveStepAbsolute = 0.1;

  useEffect(() => {
    handleKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyFlag, keyName, keyDown, keyUp]);

  const removeElement = (elem: ElementModel, cut: boolean) => {
    removeElementById(elem.id, cut);
    if (canvas) {
      canvas.style.cursor = 'default'; // if an element is deleted but the cursor is not default
    }
  };

  const toggle2DView = () => {
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

  const toggleAutoRotate = () => {
    if (!orthographic) {
      const undoableCheck = {
        name: 'Auto Rotate',
        timestamp: Date.now(),
        checked: !autoRotate,
        undo: () => {
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.None;
            state.viewState.autoRotate = !undoableCheck.checked;
          });
        },
        redo: () => {
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.None;
            state.viewState.autoRotate = undoableCheck.checked;
          });
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      setCommonStore((state) => {
        state.objectTypeToAdd = ObjectType.None;
        state.viewState.autoRotate = !state.viewState.autoRotate;
      });
    }
  };

  const handleKey = () => {
    const selectedElement = getSelectedElement();
    switch (keyName) {
      case 'left':
        if (orthographic) {
          if (selectedElement) {
            switch (selectedElement.type) {
              case ObjectType.Foundation:
              case ObjectType.Cuboid:
              case ObjectType.Tree:
              case ObjectType.Human:
                setElementPosition(selectedElement.id, selectedElement.cx - moveStepAbsolute, selectedElement.cy);
                break;
              case ObjectType.Sensor:
                const parent = getElementById(selectedElement.parentId);
                const halfLx = parent ? selectedElement.lx / (2 * parent.lx) : 0;
                const x = Math.max(-0.5 + halfLx, selectedElement.cx - moveStepRelative);
                setElementPosition(selectedElement.id, x, selectedElement.cy);
                break;
              case ObjectType.SolarPanel:
                setElementPosition(selectedElement.id, selectedElement.cx - moveStepRelative, selectedElement.cy);
                break;
            }
          }
        }
        break;
      case 'right':
        if (orthographic) {
          if (selectedElement) {
            switch (selectedElement.type) {
              case ObjectType.Foundation:
              case ObjectType.Cuboid:
              case ObjectType.Tree:
              case ObjectType.Human:
                setElementPosition(selectedElement.id, selectedElement.cx + moveStepAbsolute, selectedElement.cy);
                break;
              case ObjectType.Sensor:
                const parent = getElementById(selectedElement.parentId);
                const halfLx = parent ? selectedElement.lx / (2 * parent.lx) : 0;
                const x = Math.min(0.5 - halfLx, selectedElement.cx + moveStepRelative);
                setElementPosition(selectedElement.id, x, selectedElement.cy);
                break;
              case ObjectType.SolarPanel:
                setElementPosition(selectedElement.id, selectedElement.cx + moveStepRelative, selectedElement.cy);
                break;
            }
          }
        }
        break;
      case 'down':
        if (orthographic) {
          if (selectedElement) {
            switch (selectedElement.type) {
              case ObjectType.Foundation:
              case ObjectType.Cuboid:
              case ObjectType.Tree:
              case ObjectType.Human:
                setElementPosition(selectedElement.id, selectedElement.cx, selectedElement.cy - moveStepAbsolute);
                break;
              case ObjectType.Sensor:
                const parent = getElementById(selectedElement.parentId);
                const halfLy = parent ? selectedElement.ly / (2 * parent.ly) : 0;
                const y = Math.max(-0.5 + halfLy, selectedElement.cy - moveStepRelative);
                setElementPosition(selectedElement.id, selectedElement.cx, y);
                break;
              case ObjectType.SolarPanel:
                setElementPosition(selectedElement.id, selectedElement.cx, selectedElement.cy - moveStepRelative);
                break;
            }
          }
        }
        break;
      case 'up':
        if (orthographic) {
          if (selectedElement) {
            switch (selectedElement.type) {
              case ObjectType.Foundation:
              case ObjectType.Cuboid:
              case ObjectType.Tree:
              case ObjectType.Human:
                setElementPosition(selectedElement.id, selectedElement.cx, selectedElement.cy + moveStepAbsolute);
                break;
              case ObjectType.Sensor:
                const parent = getElementById(selectedElement.parentId);
                const halfLy = parent ? selectedElement.ly / (2 * parent.ly) : 0;
                const y = Math.min(0.5 - halfLy, selectedElement.cy + moveStepRelative);
                setElementPosition(selectedElement.id, selectedElement.cx, y);
                break;
              case ObjectType.SolarPanel:
                setElementPosition(selectedElement.id, selectedElement.cx, selectedElement.cy + moveStepRelative);
                break;
            }
          }
        }
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
        if (selectedElement) {
          copyElementById(selectedElement.id);
        }
        break;
      case 'ctrl+x':
      case 'meta+x': // for Mac
        if (selectedElement) {
          removeElement(selectedElement, true);
          // do not use {...selectedElement} as it does not do deep copy
          const clonedElement = JSON.parse(JSON.stringify(selectedElement));
          clonedElement.selected = false;
          const undoableCut = {
            name: 'Cut',
            timestamp: Date.now(),
            deletedElement: clonedElement,
            undo: () => {
              setCommonStore((state) => {
                state.elements.push(undoableCut.deletedElement);
                state.selectedElement = undoableCut.deletedElement;
              });
              // clonedElement.selected = true; FIXME: Why does this become readonly?
            },
            redo: () => {
              const elem = getElementById(undoableCut.deletedElement.id);
              if (elem) {
                removeElement(elem, true);
              }
            },
          } as UndoableDelete;
          addUndoable(undoableCut);
        }
        break;
      case 'ctrl+v':
      case 'meta+v': // for Mac
        if (keyUp) {
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
        }
        break;
      case 'ctrl+home':
      case 'meta+home': // for Mac
        if (!orthographic) {
          const undoableResetView = {
            name: 'Reset View',
            timestamp: Date.now(),
            oldCameraPosition: { ...cameraPosition },
            oldPanCenter: { ...panCenter },
            undo: () => {
              setCommonStore((state) => {
                const v = state.viewState;
                v.cameraPosition.x = undoableResetView.oldCameraPosition.x;
                v.cameraPosition.y = undoableResetView.oldCameraPosition.y;
                v.cameraPosition.z = undoableResetView.oldCameraPosition.z;
                v.panCenter.x = undoableResetView.oldPanCenter.x;
                v.panCenter.y = undoableResetView.oldPanCenter.y;
                v.panCenter.z = undoableResetView.oldPanCenter.z;
              });
            },
            redo: () => {
              resetView();
            },
          } as UndoableResetView;
          addUndoable(undoableResetView);
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.None;
            state.viewState.orthographic = false;
          });
          resetView();
        }
        break;
      case 'f2':
        toggle2DView();
        break;
      case 'f4':
        toggleAutoRotate();
        break;
      case 'ctrl+o':
      case 'meta+o': // for Mac
        if (!localFileDialogRequested) {
          setCommonStore((state) => {
            state.localFileDialogRequested = true;
            state.openLocalFileFlag = !state.openLocalFileFlag;
          });
        }
        break;
      case 'ctrl+s':
      case 'meta+s': // for Mac
        setCommonStore((state) => {
          state.saveLocalFileDialogVisible = true;
        });
        break;
      case 'ctrl+shift+s':
      case 'meta+shift+s': // for Mac
        if (keyUp) {
          setCommonStore((state) => {
            state.updateCloudFileFlag = !state.updateCloudFileFlag;
          });
        }
        break;
      case 'delete':
        if (selectedElement) {
          removeElement(selectedElement, false);
          // do not use {...selectedElement} as it does not do deep copy
          const clonedElement = JSON.parse(JSON.stringify(selectedElement));
          clonedElement.selected = false;
          const undoableDelete = {
            name: 'Delete',
            timestamp: Date.now(),
            deletedElement: clonedElement,
            undo: () => {
              setCommonStore((state) => {
                state.elements.push(undoableDelete.deletedElement);
                state.selectedElement = undoableDelete.deletedElement;
              });
              // clonedElement.selected = true; FIXME: Why does this become readonly?
            },
            redo: () => {
              const elem = getElementById(undoableDelete.deletedElement.id);
              if (elem) {
                removeElement(elem, false);
              }
            },
          } as UndoableDelete;
          addUndoable(undoableDelete);
        }
        break;
      case 'ctrl+z':
      case 'meta+z': // for Mac
        if (keyUp) {
          if (undoManager.hasUndo()) {
            undoManager.undo();
          }
        }
        break;
      case 'ctrl+y':
      case 'meta+y': // for Mac
        if (keyUp) {
          if (undoManager.hasRedo()) {
            undoManager.redo();
          }
        }
        break;
      case 'shift':
        if (keyDown) {
          setEnableFineGrid(true);
        } else if (keyUp) {
          setEnableFineGrid(false);
        }
        break;
      case 'esc':
        if (keyDown) {
          if (buildingWallID) {
            removeElementById(buildingWallID, false);
          } else if (buildingWindowID) {
            removeElementById(buildingWindowID, false);
          }
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.None;
            state.moveHandleType = null;
            state.resizeHandleType = null;
            state.enableOrbitController = true;
          });
        }
        break;
    }
  };

  return <></>;
};

export default React.memo(KeyboardListener);
