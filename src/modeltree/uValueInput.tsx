/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { InputNumber, Space } from 'antd';
import { useStore } from '../stores/common';
import React, { useState } from 'react';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { ZERO_TOLERANCE } from '../constants';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import { WindowModel } from '../models/WindowModel';
import { DoorModel } from '../models/DoorModel';

const UValueInput = ({ element }: { element: WindowModel | DoorModel }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const [value, setValue] = useState<number>(element.uValue ?? 2);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (value: number) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === element.id);
      if (a) {
        (a as WindowModel | DoorModel).uValue = value;
      }
    });
  };

  const confirm = () => {
    const oldValue = element.uValue;
    const newValue = value;
    if (Math.abs(oldValue - newValue) < ZERO_TOLERANCE) return;
    const undoableChange = {
      name: 'Set U-Value for ' + element.type,
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
      <span>{t('word.UValue', lang)} : </span>
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
      W/(m²·℃)
    </Space>
  );
};

export default UValueInput;
