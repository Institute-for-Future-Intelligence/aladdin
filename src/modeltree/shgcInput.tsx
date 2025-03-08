/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { InputNumber, Space } from 'antd';
import { useStore } from '../stores/common';
import React, { useState } from 'react';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { WindowModel } from '../models/WindowModel';
import { ZERO_TOLERANCE } from '../constants';

const ShgcInput = ({ window }: { window: WindowModel }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const [value, setValue] = useState<number>(1 - (window.opacity ?? 0.5));

  const updateOpacity = (opacity: number) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === window.id);
      if (a) {
        (a as WindowModel).opacity = opacity;
      }
    });
  };

  const confirm = () => {
    const oldOpacity = window.opacity;
    const newOpacity = 1 - value;
    if (Math.abs(oldOpacity - newOpacity) < ZERO_TOLERANCE) return;
    const undoableChange = {
      name: 'Set SHGC for Window',
      timestamp: Date.now(),
      oldValue: oldOpacity,
      newValue: newOpacity,
      changedElementId: window.id,
      changedElementType: window.type,
      undo: () => {
        const a = undoableChange.oldValue as number;
        setValue(1 - a);
        updateOpacity(a);
      },
      redo: () => {
        const a = undoableChange.newValue as number;
        setValue(1 - a);
        updateOpacity(a);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    updateOpacity(newOpacity);
  };

  return (
    <Space>
      <span>SHGC : </span>
      <InputNumber
        value={parseFloat(value.toFixed(2))}
        precision={2}
        min={0}
        max={1}
        step={0.01}
        disabled={window.locked}
        onChange={(v) => {
          if (v !== null) setValue(v);
        }}
        onPressEnter={confirm}
        onBlur={confirm}
      />
    </Space>
  );
};

export default ShgcInput;
