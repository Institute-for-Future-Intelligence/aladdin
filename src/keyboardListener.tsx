/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { ObjectType } from './types';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { UndoableDelete } from './undo/UndoableDelete';
import { UndoablePaste } from './undo/UndoablePaste';
import { UndoableCheck } from './undo/UndoableCheck';
import { UndoableResetView } from './undo/UndoableResetView';
import { showInfo } from './helpers';
import i18n from './i18n/i18n';
import { UndoableHorizontalMove } from './undo/UndoableHorizontalMove';
import { UndoableVerticalMove } from './undo/UndoableVerticalMove';
import KeyboardEventHandler from 'react-keyboard-event-handler';
import { WallModel } from './models/WallModel';

export interface KeyboardListenerProps {
  canvas?: HTMLCanvasElement;
  set2DView: (selected: boolean) => void;
  resetView: () => void;
  zoomView: (scale: number) => void;
}

const KeyboardListener = ({ canvas, set2DView, resetView, zoomView }: KeyboardListenerProps) => {
  const setCommonStore = useStore(Selector.set);
  const selectNone = useStore(Selector.selectNone);
  const language = useStore(Selector.language);
  const undoManager = useStore(Selector.undoManager);
  const addUndoable = useStore(Selector.addUndoable);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const autoRotate = useStore(Selector.viewState.autoRotate);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const copyElementById = useStore(Selector.copyElementById);
  const removeElementById = useStore(Selector.removeElementById);
  const pasteElements = useStore(Selector.pasteElementsByKey);
  const getElementById = useStore(Selector.getElementById);
  const updateElementCxById = useStore(Selector.updateElementCxById);
  const updateElementCyById = useStore(Selector.updateElementCyById);
  const updateWallLeftJointsById = useStore(Selector.updateWallLeftJointsById);
  const updateWallRightJointsById = useStore(Selector.updateWallRightJointsById);
  const setEnableFineGrid = useStore(Selector.setEnableFineGrid);
  const localFileDialogRequested = useStore(Selector.localFileDialogRequested);
  const cameraPosition = useStore(Selector.viewState.cameraPosition);
  const panCenter = useStore(Selector.viewState.panCenter);
  const copyCutElements = useStore(Selector.copyCutElements);
  const addedFoundationId = useStore(Selector.addedFoundationId);
  const addedCuboidId = useStore(Selector.addedCuboidId);
  const addedWallId = useStore(Selector.addedWallId);
  const addedWindowId = useStore(Selector.addedWindowId);

  const [keyPressed, setKeyPressed] = useState(false);
  const [keyName, setKeyName] = useState<string | null>(null);
  const [keyDown, setKeyDown] = useState(false);
  const [keyUp, setKeyUp] = useState(false);

  const moveStepRelative = 0.01;
  const moveStepAbsolute = 0.1;
  const lang = { lng: language };

  const handleKeys = [
    'left',
    'up',
    'right',
    'down',
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
    'shift',
    'esc',
    'ctrl+home',
    'meta+home',
    'ctrl+shift+o',
    'meta+shift+o',
    'ctrl+shift+s',
    'meta+shift+s',
    'delete',
    'f2',
    'f4',
  ];

  useEffect(() => {
    if (keyDown) {
      handleKeyDown();
    }
    if (keyUp) {
      handleKeyUp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyDown, keyUp]);

  const removeElement = (elemId: string, cut: boolean) => {
    removeElementById(elemId, cut);
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

  const handleKeyEvent = (key: string, down: boolean) => {
    if (down) {
      setKeyName(key);
      setKeyUp(false);
      setKeyDown(true);
    } else {
      setKeyDown(false);
      setKeyUp(true);
    }
  };

  const handleKeyDown = () => {
    const selectedElement = getSelectedElement();
    switch (keyName) {
      case 'left':
        if (orthographic) {
          if (selectedElement) {
            let displacement = 0;
            switch (selectedElement.type) {
              case ObjectType.Foundation:
              case ObjectType.Cuboid:
              case ObjectType.Tree:
              case ObjectType.Human:
                displacement = -moveStepAbsolute;
                break;
              case ObjectType.Sensor:
                const parent = getElementById(selectedElement.parentId);
                if (parent) {
                  const halfLx = selectedElement.lx / (2 * parent.lx);
                  const x = Math.max(-0.5 + halfLx, selectedElement.cx - moveStepRelative);
                  displacement = x - selectedElement.cx;
                }
                break;
              case ObjectType.SolarPanel:
                displacement = -moveStepRelative;
                break;
            }
            if (displacement !== 0) {
              const undoableMoveLeft = {
                name: 'Move Left',
                timestamp: Date.now(),
                displacement: displacement,
                movedElementId: selectedElement.id,
                undo: () => {
                  updateElementCxById(
                    undoableMoveLeft.movedElementId,
                    selectedElement.cx - undoableMoveLeft.displacement,
                  );
                },
                redo: () => {
                  updateElementCxById(
                    undoableMoveLeft.movedElementId,
                    selectedElement.cx + undoableMoveLeft.displacement,
                  );
                },
              } as UndoableHorizontalMove;
              addUndoable(undoableMoveLeft);
              updateElementCxById(selectedElement.id, selectedElement.cx + displacement);
            }
          }
        }
        break;
      case 'right':
        if (orthographic) {
          if (selectedElement) {
            let displacement = 0;
            switch (selectedElement.type) {
              case ObjectType.Foundation:
              case ObjectType.Cuboid:
              case ObjectType.Tree:
              case ObjectType.Human:
                displacement = moveStepAbsolute;
                break;
              case ObjectType.Sensor:
                const parent = getElementById(selectedElement.parentId);
                if (parent) {
                  const halfLx = parent ? selectedElement.lx / (2 * parent.lx) : 0;
                  const x = Math.min(0.5 - halfLx, selectedElement.cx + moveStepRelative);
                  displacement = x - selectedElement.cx;
                }
                break;
              case ObjectType.SolarPanel:
                displacement = moveStepRelative;
                break;
            }
            if (displacement !== 0) {
              const undoableMoveRight = {
                name: 'Move Right',
                timestamp: Date.now(),
                displacement: displacement,
                movedElementId: selectedElement.id,
                undo: () => {
                  updateElementCxById(
                    undoableMoveRight.movedElementId,
                    selectedElement.cx - undoableMoveRight.displacement,
                  );
                },
                redo: () => {
                  updateElementCxById(
                    undoableMoveRight.movedElementId,
                    selectedElement.cx + undoableMoveRight.displacement,
                  );
                },
              } as UndoableHorizontalMove;
              addUndoable(undoableMoveRight);
              updateElementCxById(selectedElement.id, selectedElement.cx + displacement);
            }
          }
        }
        break;
      case 'down':
        if (orthographic) {
          if (selectedElement) {
            let displacement = 0;
            switch (selectedElement.type) {
              case ObjectType.Foundation:
              case ObjectType.Cuboid:
              case ObjectType.Tree:
              case ObjectType.Human:
                displacement = -moveStepAbsolute;
                break;
              case ObjectType.Sensor:
                const parent = getElementById(selectedElement.parentId);
                if (parent) {
                  const halfLy = parent ? selectedElement.ly / (2 * parent.ly) : 0;
                  const y = Math.max(-0.5 + halfLy, selectedElement.cy - moveStepRelative);
                  displacement = y - selectedElement.cy;
                }
                break;
              case ObjectType.SolarPanel:
                displacement = -moveStepRelative;
                break;
            }
            if (displacement !== 0) {
              const undoableMoveDown = {
                name: 'Move Down',
                timestamp: Date.now(),
                displacement: displacement,
                movedElementId: selectedElement.id,
                undo: () => {
                  updateElementCyById(
                    undoableMoveDown.movedElementId,
                    selectedElement.cy - undoableMoveDown.displacement,
                  );
                },
                redo: () => {
                  updateElementCyById(
                    undoableMoveDown.movedElementId,
                    selectedElement.cy + undoableMoveDown.displacement,
                  );
                },
              } as UndoableVerticalMove;
              addUndoable(undoableMoveDown);
              updateElementCyById(selectedElement.id, selectedElement.cy + displacement);
            }
          }
        }
        break;
      case 'up':
        if (orthographic) {
          if (selectedElement) {
            let displacement = 0;
            switch (selectedElement.type) {
              case ObjectType.Foundation:
              case ObjectType.Cuboid:
              case ObjectType.Tree:
              case ObjectType.Human:
                displacement = moveStepAbsolute;
                break;
              case ObjectType.Sensor:
                const parent = getElementById(selectedElement.parentId);
                if (parent) {
                  const halfLy = parent ? selectedElement.ly / (2 * parent.ly) : 0;
                  const y = Math.min(0.5 - halfLy, selectedElement.cy + moveStepRelative);
                  displacement = y - selectedElement.cy;
                }
                break;
              case ObjectType.SolarPanel:
                displacement = moveStepRelative;
                break;
            }
            if (displacement !== 0) {
              const undoableMoveUp = {
                name: 'Move Up',
                timestamp: Date.now(),
                displacement: displacement,
                movedElementId: selectedElement.id,
                undo: () => {
                  updateElementCyById(undoableMoveUp.movedElementId, selectedElement.cy - undoableMoveUp.displacement);
                },
                redo: () => {
                  updateElementCyById(undoableMoveUp.movedElementId, selectedElement.cy + undoableMoveUp.displacement);
                },
              } as UndoableVerticalMove;
              addUndoable(undoableMoveUp);
              updateElementCyById(selectedElement.id, selectedElement.cy + displacement);
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
          removeElement(selectedElement.id, true);
          const cutElements = copyCutElements();
          const undoableCut = {
            name: 'Cut',
            timestamp: Date.now(),
            deletedElements: cutElements,
            undo: () => {
              setCommonStore((state) => {
                if (undoableCut.deletedElements && undoableCut.deletedElements.length > 0) {
                  for (const e of undoableCut.deletedElements) {
                    state.elements.push(e);
                  }
                  state.selectedElement = undoableCut.deletedElements[0];
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
      case 'ctrl+home':
      case 'meta+home': // for Mac
        if (!orthographic) {
          // if not already reset
          if (
            cameraPosition.x !== cameraPosition.y ||
            cameraPosition.y !== cameraPosition.z ||
            cameraPosition.x !== cameraPosition.z ||
            panCenter.x !== 0 ||
            panCenter.y !== 0 ||
            panCenter.z !== 0
          ) {
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
        }
        break;
      case 'f2':
        toggle2DView();
        break;
      case 'f4':
        toggleAutoRotate();
        break;
      case 'ctrl+f':
      case 'meta+f': // for Mac
        setCommonStore((state) => {
          state.createNewFileFlag = !state.createNewFileFlag;
        });
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
      case 'ctrl+shift+o':
      case 'meta+shift+o': // for Mac
        setCommonStore((state) => {
          state.listCloudFilesFlag = !state.listCloudFilesFlag;
        });
        break;
      case 'ctrl+shift+s':
      case 'meta+shift+s': // for Mac
        setCommonStore((state) => {
          state.saveCloudFileFlag = !state.saveCloudFileFlag;
        });
        break;
      case 'delete':
        if (selectedElement) {
          if (selectedElement.locked) {
            showInfo(i18n.t('shared.ThisElementIsLocked', lang));
          } else {
            removeElement(selectedElement.id, false);
            const deletedElements = useStore.getState().deletedElements;
            if (deletedElements.length > 0) {
              const undoableDelete = {
                name: 'Delete',
                timestamp: Date.now(),
                deletedElements: deletedElements,
                undo: () => {
                  const deletedElements = undoableDelete.deletedElements;
                  if (deletedElements && deletedElements.length > 0) {
                    if (deletedElements.length === 1 && deletedElements[0].type === ObjectType.Wall) {
                      const wall = deletedElements[0] as WallModel;
                      if (wall.leftJoints.length > 0) {
                        updateWallRightJointsById(wall.leftJoints[0], [wall.id]);
                      }
                      if (wall.rightJoints.length > 0) {
                        updateWallLeftJointsById(wall.rightJoints[0], [wall.id]);
                      }
                    }
                    setCommonStore((state) => {
                      for (const e of deletedElements) {
                        state.elements.push(e);
                      }
                      state.selectedElement = deletedElements[0];
                      state.updateWallMapOnFoundation = !state.updateWallMapOnFoundation;
                    });
                  }
                  // clonedElement.selected = true; FIXME: Why does this become readonly?
                },
                redo: () => {
                  if (undoableDelete.deletedElements && undoableDelete.deletedElements.length > 0) {
                    removeElement(undoableDelete.deletedElements[0].id, false);
                  }
                },
              } as UndoableDelete;
              addUndoable(undoableDelete);
            }
          }
        }
        break;
      case 'ctrl+z':
      case 'meta+z': // for Mac
        if (undoManager.hasUndo()) {
          undoManager.undo();
        }
        break;
      case 'ctrl+y':
      case 'meta+y': // for Mac
        if (undoManager.hasRedo()) {
          undoManager.redo();
        }
        break;
      case 'shift':
        setEnableFineGrid(true);
        break;
      case 'esc':
        if (addedFoundationId) {
          removeElementById(addedFoundationId, false);
        } else if (addedCuboidId) {
          removeElementById(addedCuboidId, false);
        } else if (addedWallId) {
          removeElementById(addedWallId, false);
        } else if (addedWindowId) {
          removeElementById(addedWindowId, false);
        }
        setCommonStore((state) => {
          state.objectTypeToAdd = ObjectType.None;
          state.moveHandleType = null;
          state.resizeHandleType = null;
          state.setEnableOrbitController(true);
        });
        selectNone();
        break;
    }
  };

  const handleKeyUp = () => {
    switch (keyName) {
      case 'shift': {
        setEnableFineGrid(false);
        break;
      }
    }
  };

  return (
    <>
      <KeyboardEventHandler
        handleKeys={handleKeys}
        handleEventType={'keydown'}
        onKeyEvent={(key, e) => {
          e.preventDefault();
          if (keyPressed) {
            return;
          }
          setKeyPressed(true);
          handleKeyEvent(key, true);
        }}
      />
      <KeyboardEventHandler
        handleKeys={handleKeys}
        handleEventType={'keyup'}
        onKeyEvent={(key, e) => {
          e.preventDefault();
          setKeyPressed(false);
          handleKeyEvent(key, false);
        }}
      />
    </>
  );
};

export default React.memo(KeyboardListener);
