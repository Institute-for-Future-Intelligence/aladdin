/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { Checkbox, Radio, RadioChangeEvent, Space } from 'antd';
import { DoorModel, DoorType } from 'src/models/DoorModel';
import { MenuItem } from '../../menuItems';
import { useLanguage } from 'src/views/hooks';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { UndoableCheck } from 'src/undo/UndoableCheck';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';

interface DoorMenuItemProps {
  door: DoorModel;
  children?: React.ReactNode;
}

export const DoorFilledCheckbox = ({ door }: DoorMenuItemProps) => {
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
    <MenuItem stayAfterClick>
      <Checkbox checked={door.filled} onChange={handleChange}>
        {i18n.t('doorMenu.Filled', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const DoorInteriorCheckbox = ({ door }: DoorMenuItemProps) => {
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
    <MenuItem stayAfterClick>
      <Checkbox checked={door.interior} onChange={handleChange}>
        {i18n.t('doorMenu.Interior', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const DoorTypeRadioGroup = ({ door }: DoorMenuItemProps) => {
  const lang = useLanguage();

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
      oldValue: door.doorType,
      newValue: e.target.value,
      changedElementId: door.id,
      changedElementType: door.type,
      undo: () => {
        updateDoorTypeById(undoableChange.changedElementId, undoableChange.oldValue as DoorType);
      },
      redo: () => {
        updateDoorTypeById(undoableChange.changedElementId, undoableChange.newValue as DoorType);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    updateDoorTypeById(door.id, e.target.value);
    useStore.getState().set((state) => {
      state.actionState.doorType = e.target.value;
    });
  };

  return (
    <MenuItem stayAfterClick>
      <Radio.Group value={door.doorType} onChange={handleChange}>
        <Space direction="vertical">
          <Radio value={DoorType.Default}>{i18n.t('doorMenu.Default', lang)}</Radio>
          <Radio value={DoorType.Arched}>{i18n.t('doorMenu.Arched', lang)}</Radio>
        </Space>
      </Radio.Group>
    </MenuItem>
  );
};
