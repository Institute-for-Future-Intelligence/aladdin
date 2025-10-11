/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { RoofModel, RoofStructure } from 'src/models/RoofModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Checkbox, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { UndoableRemoveAllChildren } from 'src/undo/UndoableRemoveAllChildren';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useLanguage } from 'src/hooks';
import i18n from 'src/i18n/i18n';
import { UndoableCheck } from 'src/undo/UndoableCheck';
import { UndoableChange } from 'src/undo/UndoableChange';
import React, { useEffect, useState } from 'react';
import { ContextMenuItem } from '../../menuItems';
import { ClickEvent, MenuItem, MenuRadioGroup, RadioChangeEvent } from '@szhsin/react-menu';

interface RoofMenuItemProps {
  roof: RoofModel;
  children?: React.ReactNode;
}

interface RemoveRoofElementsItemProps extends RoofMenuItemProps {
  objectType: ObjectType;
  modalTitle: string;
  onClickOk?: () => void;
}

interface LockRoofElementsItemProps extends RoofMenuItemProps {
  objectType: ObjectType;
  lock: boolean;
}

export const RoofCeilingCheckbox = ({ roof }: RoofMenuItemProps) => {
  // Menu item does not update when clicked. I have to set an internal state to fix this
  const [ceiling, setCeiling] = useState(roof.ceiling);
  const lang = useLanguage();

  useEffect(() => {
    setCeiling(roof.ceiling);
  }, [roof.ceiling]);

  const updateRoofCeiling = (roofId: string, b: boolean) => {
    useStore.getState().set((state) => {
      const roof = state.elements.find((e) => e.id === roofId && e.type === ObjectType.Roof) as RoofModel;
      if (roof) {
        roof.ceiling = b;
        state.actionState.roofCeiling = b;
      }
    });
  };

  const handleChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    const undoableCheck = {
      name: 'Roof Ceiling',
      timestamp: Date.now(),
      checked,
      selectedElementId: roof.id,
      selectedElementType: roof.type,
      undo: () => {
        updateRoofCeiling(roof.id, !undoableCheck.checked);
      },
      redo: () => {
        updateRoofCeiling(roof.id, undoableCheck.checked);
      },
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    updateRoofCeiling(roof.id, checked);
    setCeiling(checked);
  };

  return (
    <ContextMenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={ceiling} onChange={handleChange}>
        {i18n.t('roofMenu.Ceiling', lang)}
      </Checkbox>
    </ContextMenuItem>
  );
};

export const RemoveRoofElementsItem = ({
  roof,
  objectType,
  modalTitle,
  onClickOk,
  children,
}: RemoveRoofElementsItemProps) => {
  const removeAllChildElementsByType = useStore.getState().removeAllChildElementsByType;

  const handleModalOk = () => {
    const removed = useStore
      .getState()
      .elements.filter((e) => !e.locked && e.type === objectType && e.parentId === roof.id);
    removeAllChildElementsByType(roof.id, objectType);
    const removedElements = JSON.parse(JSON.stringify(removed));
    const undoableRemoveAllChildren = {
      name: `Remove All ${objectType}s on Roof`,
      timestamp: Date.now(),
      parentId: roof.id,
      removedElements: removedElements,
      undo: () => {
        useStore.getState().set((state) => {
          state.elements.push(...undoableRemoveAllChildren.removedElements);
        });
      },
      redo: () => {
        removeAllChildElementsByType(undoableRemoveAllChildren.parentId, objectType);
      },
    } as UndoableRemoveAllChildren;
    useStore.getState().addUndoable(undoableRemoveAllChildren);
  };

  const handleClickItem = () => {
    const onOk = onClickOk ?? handleModalOk;
    Modal.confirm({
      title: modalTitle,
      icon: <ExclamationCircleOutlined />,
      onOk: onOk,
    });
  };

  return (
    <ContextMenuItem noPadding onClick={handleClickItem}>
      {children}
    </ContextMenuItem>
  );
};

export const LockRoofElementsItem = ({ roof, objectType, lock, children }: LockRoofElementsItemProps) => {
  const updateElementLockById = useStore.getState().updateElementLockById;
  const updateElementUnlockByParentId = useStore.getState().updateElementLockByParentId;

  const handleClick = () => {
    const objectTypeText = objectType.replaceAll(' ', '');
    const oldLocks = new Map<string, boolean>();
    for (const elem of useStore.getState().elements) {
      if (elem.parentId === roof.id && elem.type === objectType) {
        oldLocks.set(elem.id, !!elem.locked);
      }
    }
    updateElementUnlockByParentId(roof.id, objectType, lock);

    const name = lock ? `Lock All Unlocked ${objectTypeText} on Roof` : `Unlock All Locked ${objectTypeText} on Roof`;

    const undoable = {
      name: name,
      timestamp: Date.now(),
      oldValues: oldLocks,
      newValue: true,
      undo: () => {
        for (const [id, locked] of undoable.oldValues.entries()) {
          updateElementLockById(id, locked as boolean);
        }
      },
      redo: () => {
        updateElementUnlockByParentId(roof.id, objectType, lock);
      },
    } as UndoableChangeGroup;
    useStore.getState().addUndoable(undoable);
  };

  return (
    <ContextMenuItem stayAfterClick noPadding onClick={handleClick}>
      {children}
    </ContextMenuItem>
  );
};

export const RoofStructureRadioGroup = ({ roof }: RoofMenuItemProps) => {
  const lang = useLanguage();

  const updateRoofStructureById = useStore.getState().updateRoofStructureById;

  const handleChange = (e: RadioChangeEvent) => {
    const undoableChange = {
      name: 'Select Roof Structure',
      timestamp: Date.now(),
      oldValue: roof.roofStructure ?? RoofStructure.Default,
      newValue: e.value,
      changedElementId: roof.id,
      changedElementType: roof.type,
      undo: () => {
        updateRoofStructureById(undoableChange.changedElementId, undoableChange.oldValue as RoofStructure);
      },
      redo: () => {
        updateRoofStructureById(undoableChange.changedElementId, undoableChange.newValue as RoofStructure);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateRoofStructureById(roof.id, e.value);
    useStore.getState().set((state) => {
      state.actionState.roofStructure = e.value;
    });
  };

  const onClick = (e: ClickEvent) => {
    e.keepOpen = true;
  };

  return (
    <MenuRadioGroup value={roof.roofStructure ?? RoofStructure.Default} onRadioChange={handleChange}>
      <MenuItem type="radio" value={RoofStructure.Default} onClick={onClick}>
        {i18n.t('roofMenu.DefaultStructure', lang)}
      </MenuItem>
      <MenuItem type="radio" value={RoofStructure.Rafter} onClick={onClick}>
        {i18n.t('roofMenu.RafterStructure', lang)}
      </MenuItem>
      {/*<MenuItem type="radio" value={RoofStructure.Glass} onClick={onClick}>*/}
      {/*  {i18n.t('roofMenu.GlassStructure', lang)}*/}
      {/*</MenuItem>*/}
    </MenuRadioGroup>
  );
};
