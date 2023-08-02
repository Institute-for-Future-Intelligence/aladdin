/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { Checkbox, Menu } from 'antd';
import { useStore } from '../../stores/common';
import * as Selector from '../../stores/selector';
import i18n from '../../i18n/i18n';
import { Util } from '../../Util';
import { UndoableDelete } from '../../undo/UndoableDelete';
import { UndoablePaste } from '../../undo/UndoablePaste';
import { UndoableCheck } from '../../undo/UndoableCheck';
import { ActionInfo, ObjectType } from '../../types';
import { showInfo } from 'src/helpers';
import { WallModel } from 'src/models/WallModel';
import { useRefStore } from 'src/stores/commonRef';

export const Paste = ({ paddingLeft = '36px', keyName }: { paddingLeft?: string; keyName: string }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const pasteElements = useStore(Selector.pasteElementsToPoint);
  const elementsToPaste = useStore(Selector.elementsToPaste);
  const removeElementById = useStore(Selector.removeElementById);
  const addUndoable = useStore(Selector.addUndoable);

  const isMac = Util.isMac();

  const paste = () => {
    if (elementsToPaste && elementsToPaste.length > 0) {
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
              state.updateElementOnRoofFlag = !state.updateElementOnRoofFlag;
            });
          },
        } as UndoablePaste;
        addUndoable(undoablePaste);
      }
    }
  };

  return (
    <Menu.Item key={keyName} onClick={paste} style={{ paddingLeft: paddingLeft }}>
      {i18n.t('word.Paste', { lng: language })}
      <span style={{ paddingLeft: '4px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+V)</span>
    </Menu.Item>
  );
};

export const Copy = ({ paddingLeft = '36px', keyName }: { paddingLeft?: string; keyName: string }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const copyElementById = useStore(Selector.copyElementById);
  const selectedElement = useStore(Selector.selectedElement);
  const loggable = useStore(Selector.loggable);
  const isMac = Util.isMac();

  const copyElement = () => {
    if (selectedElement) {
      copyElementById(selectedElement.id);
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

  return (
    <Menu.Item key={keyName} onClick={copyElement} style={{ paddingLeft: paddingLeft }}>
      {i18n.t('word.Copy', { lng: language })}
      <span style={{ paddingLeft: '4px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+C)</span>
    </Menu.Item>
  );
};

export const Cut = ({ paddingLeft = '36px', keyName }: { paddingLeft?: string; keyName: string }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const removeElementById = useStore(Selector.removeElementById);
  const selectedElement = useStore(Selector.selectedElement);
  const addUndoable = useStore(Selector.addUndoable);
  const isMac = Util.isMac();

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  const cut = () => {
    if (!selectedElement || selectedElement.type === ObjectType.Roof) return;
    if (selectedElement.locked) {
      showInfo(i18n.t('message.ThisElementIsLocked', lang));
    } else {
      const cutElements = removeElementById(selectedElement.id, true);
      if (cutElements.length === 0) return;

      if (Util.ifNeedListenToAutoDeletion(cutElements[0])) {
        useRefStore.getState().setListenToAutoDeletionByCut(true);
      } else {
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
                if (undoableCut.deletedElements[0].type === ObjectType.Wall) {
                  const wall = undoableCut.deletedElements[0] as WallModel;
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
              }
            });
          },
          redo: () => {
            if (undoableCut.deletedElements && undoableCut.deletedElements.length > 0) {
              removeElementById(undoableCut.deletedElements[0].id, true);
            }
          },
        } as UndoableDelete;
        addUndoable(undoableCut);
      }
    }
  };

  return (
    <Menu.Item key={keyName} onClick={cut} style={{ paddingLeft: paddingLeft }}>
      {i18n.t('word.Cut', { lng: language })}
      <span style={{ paddingLeft: '4px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+X)</span>
    </Menu.Item>
  );
};

export const Lock = ({ keyName }: { keyName: string }) => {
  const language = useStore(Selector.language);
  const updateElementLockById = useStore(Selector.updateElementLockById);
  const addUndoable = useStore(Selector.addUndoable);
  const selectedElement = useStore((state) => {
    for (const e of state.elements) {
      if (e.selected) {
        return e;
      }
    }
    return null;
  });

  const lockElement = (on: boolean) => {
    if (selectedElement) {
      updateElementLockById(selectedElement.id, on);
    }
  };

  return (
    <Menu.Item key={keyName}>
      <Checkbox
        checked={selectedElement?.locked}
        onChange={(e) => {
          const checked = e.target.checked;
          const undoableCheck = {
            name: 'Lock',
            timestamp: Date.now(),
            checked: checked,
            selectedElementId: selectedElement?.id,
            selectedElementType: selectedElement?.type,
            undo: () => {
              lockElement(!undoableCheck.checked);
            },
            redo: () => {
              lockElement(undoableCheck.checked);
            },
          } as UndoableCheck;
          addUndoable(undoableCheck);
          lockElement(checked);
        }}
      >
        {i18n.t('word.Lock', { lng: language })}
      </Checkbox>
    </Menu.Item>
  );
};
