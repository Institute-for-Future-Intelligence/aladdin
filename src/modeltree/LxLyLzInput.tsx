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
import { ElementModel } from '../models/ElementModel';

export interface LxLyLzInputProps {
  element: ElementModel;
  variable: 'lx' | 'ly' | 'lz';
  title: string;
  min: number;
  max: number;
  step: number;
  relative?: boolean;
}

const LxLyLzInput = ({ element, variable, title, min, max, step, relative }: LxLyLzInputProps) => {
  const addUndoable = useStore(Selector.addUndoable);
  const [value, setValue] = useState<number>(element[variable]);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (value: number) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === element.id);
      if (a) a[variable] = value;
    });
  };

  const confirm = () => {
    const oldValue = element[variable];
    const newValue = value;
    if (Math.abs(oldValue - newValue) < ZERO_TOLERANCE) return;
    const undoableChange = {
      name: 'Set ' + title + ' for ' + element.type,
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
        min={min}
        max={max}
        step={step}
        disabled={element.locked}
        onChange={(value) => {
          if (value !== null) setValue(value);
        }}
        onBlur={confirm}
        onPressEnter={confirm}
      />
      {t(relative ? 'word.Relative' : 'word.MeterAbbreviation', lang)}
    </Space>
  );
};

export default LxLyLzInput;
