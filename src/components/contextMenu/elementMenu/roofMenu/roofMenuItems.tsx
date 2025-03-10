/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { RoofModel, RoofStructure } from 'src/models/RoofModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { MenuItem } from '../../menuItems';
import { Checkbox, Modal, Radio, RadioChangeEvent, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { UndoableRemoveAllChildren } from 'src/undo/UndoableRemoveAllChildren';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useLanguage } from 'src/hooks';
import i18n from 'src/i18n/i18n';
import { UndoableCheck } from 'src/undo/UndoableCheck';
import { UndoableChange } from 'src/undo/UndoableChange';
import React from 'react';

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
  const lang = useLanguage();

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
      checked: checked,
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
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={roof.ceiling} onChange={handleChange}>
        {i18n.t('roofMenu.Ceiling', lang)}
      </Checkbox>
    </MenuItem>
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
    <MenuItem update noPadding onClick={handleClickItem}>
      {children}
    </MenuItem>
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
    <MenuItem stayAfterClick update noPadding onClick={handleClick}>
      {children}
    </MenuItem>
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
      newValue: e.target.value,
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
    updateRoofStructureById(roof.id, e.target.value);
    useStore.getState().set((state) => {
      state.actionState.roofStructure = e.target.value;
    });
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Radio.Group value={roof.roofStructure ?? RoofStructure.Default} onChange={handleChange}>
        <Space direction="vertical">
          <Radio style={{ width: '100%' }} value={RoofStructure.Default}>
            {i18n.t('roofMenu.DefaultStructure', lang)}
          </Radio>
          <Radio style={{ width: '100%' }} value={RoofStructure.Rafter}>
            {i18n.t('roofMenu.RafterStructure', lang)}
          </Radio>
          {/*<Radio style={{ width: '100%' }} value={RoofStructure.Glass}>*/}
          {/*  {i18n.t('roofMenu.GlassStructure', lang)}*/}
          {/*</Radio>*/}
        </Space>
      </Radio.Group>
    </MenuItem>
  );
};
