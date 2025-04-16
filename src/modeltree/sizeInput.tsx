/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { InputNumber, Space } from 'antd';
import { useStore } from '../stores/common';
import React, { useEffect, useState } from 'react';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { ZERO_TOLERANCE } from '../constants';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import { ElementModel } from '../models/ElementModel';
import { FresnelReflectorModel } from '../models/FresnelReflectorModel';
import { ParabolicTroughModel } from '../models/ParabolicTroughModel';
import { ObjectType } from '../types';

export interface LxLyLzInputProps {
  element: ElementModel;
  variable: 'lx' | 'ly' | 'lz';
  title: string;
  min: number;
  max: number;
  step: number;
  relative?: boolean;
}

const SizeInput = ({ element, variable, title, min, max, step, relative }: LxLyLzInputProps) => {
  const addUndoable = useStore(Selector.addUndoable);

  const ev = element[variable];
  const [value, setValue] = useState<number>(ev);

  useEffect(() => {
    setValue(ev);
  }, [ev]);

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

  const modularizeLength = (value: number) => {
    if (element.type !== ObjectType.FresnelReflector && element.type !== ObjectType.ParabolicTrough) return value;
    const e = element as FresnelReflectorModel | ParabolicTroughModel;
    const length = value ?? 1;
    const n = Math.max(1, Math.ceil((length - e.moduleLength / 2) / e.moduleLength));
    return n * e.moduleLength;
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
          if (value !== null) {
            if (variable === 'ly') {
              const v = modularizeLength(value);
              setValue(v);
              update(v);
            } else {
              setValue(value);
              update(value);
            }
          }
        }}
        onBlur={confirm}
        onPressEnter={confirm}
      />
      {t(relative ? 'word.Relative' : 'word.MeterAbbreviation', lang)}
    </Space>
  );
};

export default SizeInput;
