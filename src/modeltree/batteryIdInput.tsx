/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { Input, Space } from 'antd';
import { useStore } from '../stores/common';
import React, { useEffect, useState } from 'react';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { BatteryStorageModel } from '../models/BatteryStorageModel';

const BatteryIdInput = ({ battery }: { battery: BatteryStorageModel }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const [value, setValue] = useState<string>(battery.editableId ?? battery.id.slice(0, 4));

  useEffect(() => {
    setValue(battery.editableId ?? battery.id.slice(0, 4));
  }, [battery.editableId]);

  const update = (value: string) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === battery.id);
      if (a) {
        (a as BatteryStorageModel).editableId = value;
      }
    });
  };

  const confirm = () => {
    const oldValue = battery.editableId;
    if (value === oldValue) return;
    const undoableChange = {
      name: 'Set Unique ID for Battery',
      timestamp: Date.now(),
      oldValue,
      newValue: value,
      changedElementId: battery.id,
      changedElementType: battery.type,
      undo: () => {
        const a = undoableChange.oldValue as string;
        setValue(a);
        update(a);
      },
      redo: () => {
        const a = undoableChange.newValue as string;
        setValue(a);
        update(a);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    update(value);
  };

  return (
    <Space>
      <span>ID : </span>
      <Input
        value={value}
        disabled={battery.locked}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        onPressEnter={confirm}
        onBlur={confirm}
      />
    </Space>
  );
};

export default BatteryIdInput;
