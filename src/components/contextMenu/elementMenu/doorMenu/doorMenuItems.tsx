/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Checkbox, Radio, RadioChangeEvent, Space } from 'antd';
import { DoorModel, DoorType } from 'src/models/DoorModel';
import { MenuItem } from '../../menuItems';
import { useLanguage } from 'src/hooks';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { UndoableCheck } from 'src/undo/UndoableCheck';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import React from 'react';

interface DoorMenuItemProps {
  door: DoorModel;
  children?: React.ReactNode;
}

export const DoorFilledCheckbox = React.memo(({ door }: DoorMenuItemProps) => {
  const lang = useLanguage();

  const updateDoorFilledById = (id: string, checked: boolean) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Door) {
          (e as DoorModel).filled = checked;
          break;
        }
      }
    });
  };

  const handleChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    const undoableCheck = {
      name: 'Filled Door',
      timestamp: Date.now(),
      checked: checked,
      selectedElementId: door.id,
      selectedElementType: door.type,
      undo: () => {
        updateDoorFilledById(door.id, !undoableCheck.checked);
      },
      redo: () => {
        updateDoorFilledById(door.id, undoableCheck.checked);
      },
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    updateDoorFilledById(door.id, checked);
    useStore.getState().set((state) => {
      state.actionState.doorFilled = checked;
    });
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={door.filled} onChange={handleChange}>
        {i18n.t('doorMenu.Filled', lang)}
      </Checkbox>
    </MenuItem>
  );
});

export const DoorFramedCheckbox = React.memo(({ door }: DoorMenuItemProps) => {
  const lang = useLanguage();

  const updateById = (id: string, framed: boolean) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Door) {
          (e as DoorModel).frameless = !framed;
          break;
        }
      }
    });
  };

  const handleChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    const undoableCheck = {
      name: 'Framed Door',
      timestamp: Date.now(),
      checked,
      selectedElementId: door.id,
      selectedElementType: door.type,
      undo: () => {
        updateById(door.id, !undoableCheck.checked);
      },
      redo: () => {
        updateById(door.id, undoableCheck.checked);
      },
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    updateById(door.id, checked);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={!door.frameless} onChange={handleChange}>
        {i18n.t('doorMenu.Framed', lang)}
      </Checkbox>
    </MenuItem>
  );
});

export const DoorInteriorCheckbox = React.memo(({ door }: DoorMenuItemProps) => {
  const lang = useLanguage();

  const updateInteriorById = (id: string, interior: boolean) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Door) {
          (e as DoorModel).interior = interior;
          break;
        }
      }
    });
  };

  const handleChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    const undoableCheck = {
      name: 'Interior Door',
      timestamp: Date.now(),
      checked: checked,
      selectedElementId: door.id,
      selectedElementType: door.type,
      undo: () => {
        updateInteriorById(door.id, !undoableCheck.checked);
      },
      redo: () => {
        updateInteriorById(door.id, undoableCheck.checked);
      },
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    updateInteriorById(door.id, checked);
    useStore.getState().set((state) => {
      state.actionState.doorInterior = checked;
    });
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={door.interior} onChange={handleChange}>
        {i18n.t('doorMenu.Interior', lang)}
      </Checkbox>
    </MenuItem>
  );
});

export const DoorTypeRadioGroup = React.memo(({ door }: DoorMenuItemProps) => {
  const lang = useLanguage();

  const _door = useStore((state) =>
    state.elements.find((e) => e.id === door.id && e.type === ObjectType.Door),
  ) as DoorModel;
  const updateDoorTypeById = (id: string, type: DoorType) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Door) {
          (e as DoorModel).doorType = type;
          break;
        }
      }
    });
  };

  const handleChange = (e: RadioChangeEvent) => {
    const undoableChange = {
      name: 'Select Door Type',
      timestamp: Date.now(),
      oldValue: _door.doorType,
      newValue: e.target.value,
      changedElementId: _door.id,
      changedElementType: _door.type,
      undo: () => {
        updateDoorTypeById(undoableChange.changedElementId, undoableChange.oldValue as DoorType);
      },
      redo: () => {
        updateDoorTypeById(undoableChange.changedElementId, undoableChange.newValue as DoorType);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateDoorTypeById(_door.id, e.target.value);
    useStore.getState().set((state) => {
      state.actionState.doorType = e.target.value;
    });
  };

  if (!_door) return null;
  return (
    <MenuItem stayAfterClick noPadding>
      <Radio.Group value={_door.doorType} onChange={handleChange}>
        <Space direction="vertical">
          <Radio style={{ width: '100%' }} value={DoorType.Default}>
            {i18n.t('doorMenu.Default', lang)}
          </Radio>
          <Radio style={{ width: '100%' }} value={DoorType.Arched}>
            {i18n.t('doorMenu.Arched', lang)}
          </Radio>
        </Space>
      </Radio.Group>
    </MenuItem>
  );
});
