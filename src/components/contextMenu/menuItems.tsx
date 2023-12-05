/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Checkbox } from 'antd';
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
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { useLanguage } from 'src/views/hooks';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { ElementModel } from 'src/models/ElementModel';

interface MenuItemProps {
  stayAfterClick?: boolean;
  textSelectable?: boolean;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => void;
}

export const MenuItem: React.FC<MenuItemProps> = ({ stayAfterClick, textSelectable = true, onClick, children }) => {
  const handleClick = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    if (onClick) {
      onClick(e);
    }
    if (stayAfterClick) {
      e.stopPropagation();
    }
  };

  return (
    <span
      onClick={handleClick}
      style={{
        userSelect: textSelectable ? 'auto' : 'none',
        display: 'inline-block',
        width: '100%',
      }}
    >
      {children}
    </span>
  );
};

export const Paste = () => {
  const setCommonStore = useStore(Selector.set);
  const pasteElements = useStore(Selector.pasteElementsToPoint);
  const elementsToPaste = useStore(Selector.elementsToPaste);
  const removeElementById = useStore(Selector.removeElementById);
  const lang = useLanguage();

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
              state.updateElementOnRoofFlag = true;
            });
          },
        } as UndoablePaste;
        useStore.getState().addUndoable(undoablePaste);
      }
    }
  };

  return (
    <MenuItem onClick={paste}>
      {i18n.t('word.Paste', lang)}
      <span style={{ paddingLeft: '4px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+V)</span>
    </MenuItem>
  );
};

export const Copy = () => {
  const setCommonStore = useStore(Selector.set);
  const copyElementById = useStore(Selector.copyElementById);
  const loggable = useStore(Selector.loggable);
  const lang = useLanguage();
  const isMac = Util.isMac();

  const copyElement = () => {
    const selectedElement = useStore.getState().selectedElement;
    if (!selectedElement) return;
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
  };

  return (
    <MenuItem onClick={copyElement}>
      {i18n.t('word.Copy', lang)}
      <span style={{ paddingLeft: '4px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+C)</span>
    </MenuItem>
  );
};

export const Cut = () => {
  const setCommonStore = useStore(Selector.set);
  const removeElementById = useStore(Selector.removeElementById);
  const isMac = Util.isMac();
  const lang = useLanguage();

  const cut = () => {
    const selectedElement = useStore.getState().selectedElement;
    if (!selectedElement || selectedElement.type === ObjectType.Roof) return;
    if (selectedElement.locked) {
      showInfo(i18n.t('message.ThisElementIsLocked', lang));
    } else {
      const cutElements = removeElementById(selectedElement.id, true);
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
              removeElementById(undoableCut.deletedElements[0].id, true);
            }
          },
        } as UndoableDelete;
        useStore.getState().addUndoable(undoableCut);
      }
    }
  };

  return (
    <MenuItem onClick={cut}>
      {i18n.t('word.Cut', lang)}
      <span style={{ paddingLeft: '4px', fontSize: 9 }}>({isMac ? '⌘' : 'Ctrl'}+X)</span>
    </MenuItem>
  );
};

export const Lock = ({ selectedElement }: { selectedElement: ElementModel }) => {
  const lang = useLanguage();
  const updateElementLockById = useStore(Selector.updateElementLockById);
  const addUndoable = useStore(Selector.addUndoable);

  const lockElement = (on: boolean) => {
    if (!selectedElement) return;
    updateElementLockById(selectedElement.id, on);
  };

  const onChange = (e: CheckboxChangeEvent) => {
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
  };

  return (
    <MenuItem stayAfterClick>
      <Checkbox checked={selectedElement.locked} onChange={onChange}>
        {i18n.t('word.Lock', lang)}
      </Checkbox>
    </MenuItem>
  );
};
