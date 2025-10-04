/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import i18n from 'src/i18n/i18n';
import { LabelMark, MainMenuItem, MainSubMenu } from './mainMenuItems';
import { ActionInfo, ObjectType } from 'src/types';
import { showInfo } from 'src/helpers';
import { Util } from 'src/Util';
import { useRefStore } from 'src/stores/commonRef';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { WallModel } from 'src/models/WallModel';
import { UndoableDelete } from 'src/undo/UndoableDelete';
import { UndoablePaste } from 'src/undo/UndoablePaste';
import { UNDO_SHOW_INFO_DURATION } from 'src/constants';
import { t } from 'i18next';
import { useLanguage } from 'src/hooks';
import * as Selector from '../../stores/selector';

interface Props {
  isMac: boolean;
}
const EditMenu = ({ isMac }: Props) => {
  const lang = useLanguage();
  const elementsToPaste = useStore(Selector.elementsToPaste);
  const selectedElement = useStore(Selector.selectedElement);
  const undoManager = useStore(Selector.undoManager);

  const readyToPaste = elementsToPaste && elementsToPaste.length > 0;

  if (!(selectedElement || readyToPaste || undoManager.hasUndo() || undoManager.hasRedo())) return null;

  const loggable = useStore.getState().loggable;

  const setCommonStore = useStore.getState().set;

  const cutSelectedElement = () => {
    if (!selectedElement || selectedElement.type === ObjectType.Roof) return;
    if (selectedElement.locked) {
      showInfo(i18n.t('message.ThisElementIsLocked', lang));
    } else {
      const cutElements = useStore.getState().removeElementById(selectedElement.id, true);
      if (cutElements.length === 0) return;

      if (Util.isElementTriggerAutoDeletion(cutElements[0])) {
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
              for (const e of cutElements) {
                state.elements.push(e);
              }
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
              useStore.getState().removeElementById(undoableCut.deletedElements[0].id, true);
            }
          },
        } as UndoableDelete;
        useStore.getState().addUndoable(undoableCut);
      }
    }
  };

  const copySelectedElement = () => {
    if (selectedElement) {
      useStore.getState().copyElementById(selectedElement.id);
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
  };

  const pasteSelectedElement = () => {
    const elementsToPaste = useStore.getState().elementsToPaste;

    if (elementsToPaste && elementsToPaste.length > 0) {
      const pastedElements = useStore.getState().pasteElementsByKey();
      if (pastedElements.length > 0) {
        const undoablePaste = {
          name: 'Paste by Key',
          timestamp: Date.now(),
          pastedElements: JSON.parse(JSON.stringify(pastedElements)),
          undo: () => {
            for (const elem of undoablePaste.pastedElements) {
              useStore.getState().removeElementById(elem.id, false);
            }
          },
          redo: () => {
            setCommonStore((state) => {
              state.elements.push(...undoablePaste.pastedElements);
              state.selectedElement = undoablePaste.pastedElements[0];
            });
          },
        } as UndoablePaste;
        useStore.getState().addUndoable(undoablePaste);
      }
    }
  };

  const handleUndo = () => {
    if (undoManager.hasUndo()) {
      const commandName = undoManager.undo();
      if (commandName) showInfo(i18n.t('menu.edit.Undo', lang) + ': ' + commandName, UNDO_SHOW_INFO_DURATION);
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = {
            name: 'Undo',
            timestamp: new Date().getTime(),
          };
        });
      }
    }
  };

  const handleRedo = () => {
    if (undoManager.hasRedo()) {
      const commandName = undoManager.redo();
      if (commandName) showInfo(i18n.t('menu.edit.Redo', lang) + ': ' + commandName, UNDO_SHOW_INFO_DURATION);
      if (loggable) {
        setCommonStore((state) => {
          state.actionInfo = {
            name: 'Redo',
            timestamp: new Date().getTime(),
          };
        });
      }
    }
  };

  return (
    <MainSubMenu label={t('menu.editSubMenu', lang)}>
      {/* cut */}
      {selectedElement && (
        <MainMenuItem onClick={cutSelectedElement}>
          {i18n.t('word.Cut', lang)}
          <LabelMark>({isMac ? '⌘' : 'Ctrl'}+X)</LabelMark>
        </MainMenuItem>
      )}

      {/* copy */}
      {selectedElement && (
        <MainMenuItem onClick={copySelectedElement}>
          {i18n.t('word.Copy', lang)}
          <LabelMark>({isMac ? '⌘' : 'Ctrl'}+C)</LabelMark>
        </MainMenuItem>
      )}

      {/* paste */}
      {readyToPaste && (
        <MainMenuItem onClick={pasteSelectedElement}>
          {i18n.t('word.Paste', lang)}
          <LabelMark>({isMac ? '⌘' : 'Ctrl'}+V)</LabelMark>
        </MainMenuItem>
      )}

      {/* undo */}
      {undoManager.hasUndo() && (
        <MainMenuItem stayAfterClick onClick={handleUndo}>
          {i18n.t('menu.edit.Undo', lang) + ': ' + undoManager.getLastUndoName()}
          <LabelMark>({isMac ? '⌘' : 'Ctrl'}+Z)</LabelMark>
        </MainMenuItem>
      )}

      {/* redo */}
      {undoManager.hasRedo() && (
        <MainMenuItem stayAfterClick onClick={handleRedo}>
          {i18n.t('menu.edit.Redo', lang) + ': ' + undoManager.getLastRedoName()}
          <LabelMark>({isMac ? '⌘' : 'Ctrl'}+Y)</LabelMark>
        </MainMenuItem>
      )}
    </MainSubMenu>
  );
};

export default EditMenu;
