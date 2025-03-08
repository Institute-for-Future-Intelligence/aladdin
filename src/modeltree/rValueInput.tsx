/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { InputNumber, Space } from 'antd';
import { useStore } from '../stores/common';
import React, { useEffect, useState } from 'react';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { ZERO_TOLERANCE } from '../constants';
import { FoundationModel } from '../models/FoundationModel';
import { RoofModel } from '../models/RoofModel';
import { WallModel } from '../models/WallModel';

const RValueInput = ({ element, title }: { element: FoundationModel | RoofModel | WallModel; title: string }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const [value, setValue] = useState<number>(element.rValue ?? 2);

  useEffect(() => {
    setValue(element.rValue ?? 2);
  }, [element.rValue]);

  const update = (value: number) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === element.id);
      if (a) {
        (a as FoundationModel | RoofModel | WallModel).rValue = value;
      }
    });
  };

  const confirm = () => {
    const oldValue = element.rValue ?? 2; // foundation rValue may be undefined for older models
    const newValue = value;
    if (Math.abs(oldValue - newValue) < ZERO_TOLERANCE) return;
    const undoableChange = {
      name: 'Set R-Value for ' + element.type,
      timestamp: Date.now(),
      oldValue,
      newValue,
      changedElementId: element.id,
      changedElementType: element.type,
      undo: () => {
        const a = undoableChange.oldValue as number;
        setValue(a);
        update(a);
      },
      redo: () => {
        const a = undoableChange.newValue as number;
        setValue(a);
        update(a);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    update(newValue);
  };

  return (
    <Space>
      <span>{title} : </span>
      <InputNumber
        value={parseFloat(value.toFixed(2))}
        precision={2}
        min={0.01}
        max={100}
        step={0.05}
        disabled={element.locked}
        onChange={(value) => {
          if (value !== null) setValue(value);
        }}
        onBlur={confirm}
        onPressEnter={confirm}
      />
      m²·℃/W
    </Space>
  );
};

export default RValueInput;
