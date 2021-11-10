/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { ObjectType } from './types';
import { WallModel } from './models/WallModel';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { Input, Modal } from 'antd';
import i18n from './i18n/i18n';
import { ElementModel } from './models/ElementModel';
import { ElementModelCloner } from './models/ElementModelCloner';
import { UndoableDeletion } from './UndoableDeletion';

export interface KeyboardListenerProps {
  keyFlag: boolean; // flip this every time to ensure that handleKey is called in useEffect
  keyName: string | undefined;
  keyDown: boolean;
  keyUp: boolean;
  canvas?: HTMLCanvasElement;
  readLocalFile: () => void;
  writeLocalFile: () => boolean;
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
  readLocalFile,
  writeLocalFile,
  set2DView,
  resetView,
  zoomView,
}: KeyboardListenerProps) => {
  const setCommonStore = useStore(Selector.set);
  const undoManager = useStore((state) => state.undoManager);
  const addUndoable = useStore((state) => state.addUndoable);
  const language = useStore((state) => state.language);
  const orthographic = useStore(Selector.viewstate.orthographic) ?? false;
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const copyElementById = useStore((state) => state.copyElementById);
  const cutElementById = useStore((state) => state.cutElementById);
  const pasteElement = useStore((state) => state.pasteElementByKey);
  const deleteElementById = useStore(Selector.deleteElementById);
  const getElementById = useStore(Selector.getElementById);
  const updateElementById = useStore(Selector.updateElementById);
  const setElementPosition = useStore(Selector.setElementPosition);
  const localFileName = useStore((state) => state.localFileName);
  const localFileDialogRequested = useStore((state) => state.localFileDialogRequested);
  const setEnableFineGrid = useStore((state) => state.setEnableFineGrid);

  const [downloadDialogVisible, setDownloadDialogVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const lang = { lng: language };
  const moveStepRelative = 0.01;
  const moveStepAbsolute = 0.1;

  useEffect(() => {
    handleKey();
  }, [keyFlag, keyName, keyDown, keyUp]);

  const deleteElement = (elem: ElementModel) => {
    if (elem.type === ObjectType.Wall) {
      const currentWall = elem as WallModel;
      if (currentWall.leftJoints.length > 0) {
        const targetWall = getElementById(currentWall.leftJoints[0].id) as WallModel;
        if (targetWall) {
          updateElementById(targetWall.id, { rightOffset: 0, rightJoints: [] });
        }
      }
      if (currentWall.rightJoints.length > 0) {
        const targetWall = getElementById(currentWall.rightJoints[0].id) as WallModel;
        if (targetWall) {
          updateElementById(targetWall.id, { leftOffset: 0, leftJoints: [] });
        }
      }
      setCommonStore((state) => {
        state.deletedWallID = elem.id;
      });
    }
    deleteElementById(elem.id);
    if (canvas) {
      canvas.style.cursor = 'default'; // if an element is deleted but the cursor is not default
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
          cutElementById(selectedElement.id);
        }
        break;
      case 'ctrl+v':
      case 'meta+v': // for Mac
        if (keyUp) {
          pasteElement();
        }
        break;
      case 'ctrl+home':
      case 'meta+home': // for Mac
        if (!orthographic) {
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.None;
            state.viewState.orthographic = false;
          });
          set2DView(false);
          resetView();
        }
        break;
      case 'f2':
        setCommonStore((state) => {
          state.viewState.autoRotate = false;
        });
        set2DView(!orthographic);
        break;
      case 'f4':
        if (!orthographic) {
          setCommonStore((state) => {
            state.objectTypeToAdd = ObjectType.None;
            state.viewState.autoRotate = !state.viewState.autoRotate;
          });
        }
        break;
      case 'ctrl+o':
      case 'meta+o': // for Mac
        if (!localFileDialogRequested) {
          setCommonStore((state) => {
            state.localFileDialogRequested = true;
          });
          readLocalFile();
        }
        break;
      case 'ctrl+s':
      case 'meta+s': // for Mac
        setDownloadDialogVisible(true);
        break;
      case 'delete':
        if (selectedElement) {
          deleteElement(selectedElement);
          const parent = selectedElement.parentId ? getElementById(selectedElement.parentId) : null;
          const clonedElement = ElementModelCloner.clone(
            parent,
            selectedElement,
            selectedElement.cx,
            selectedElement.cy,
            selectedElement.cz,
          );
          const undoableDeletion = {
            name: 'Deletion',
            timestamp: Date.now(),
            deletedElement: clonedElement,
            undo: () => {
              setCommonStore((state) => {
                if (undoableDeletion.deletedElement) {
                  state.elements.push(undoableDeletion.deletedElement);
                  state.selectedElement = undoableDeletion.deletedElement;
                }
              });
            },
            redo: () => {
              if (undoableDeletion.deletedElement) {
                deleteElementById(undoableDeletion.deletedElement.id);
              }
            },
          } as UndoableDeletion;
          addUndoable(undoableDeletion);
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
    }
  };

  return (
    <>
      <Modal
        title={i18n.t('menu.file.DownloadAs', lang)}
        visible={downloadDialogVisible}
        onOk={() => {
          setConfirmLoading(true);
          if (writeLocalFile()) {
            setDownloadDialogVisible(false);
          }
          setConfirmLoading(false);
        }}
        confirmLoading={confirmLoading}
        onCancel={() => {
          setDownloadDialogVisible(false);
        }}
      >
        <Input
          placeholder="File name"
          value={localFileName}
          onPressEnter={writeLocalFile}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setCommonStore((state) => {
              state.localFileName = e.target.value;
            });
          }}
        />
      </Modal>
    </>
  );
};

export default React.memo(KeyboardListener);
