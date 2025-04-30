/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { InputNumber, Space } from 'antd';
import { useStore } from '../stores/common';
import React, { useEffect, useState } from 'react';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { WindowModel } from '../models/WindowModel';
import { ZERO_TOLERANCE } from '../constants';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';

const PermeabilityInput = ({ window }: { window: WindowModel }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const [value, setValue] = useState<number>(window.airPermeability ?? 0);

  const lang = useLanguage();
  const { t } = useTranslation();

  useEffect(() => {
    setValue(window.airPermeability ?? 0);
  }, [window.airPermeability]);

  const update = (permeability: number) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === window.id);
      if (a) {
        (a as WindowModel).airPermeability = permeability;
      }
    });
  };

  const confirm = () => {
    const oldValue = window.airPermeability ?? 0;
    const newValue = value;
    if (Math.abs(oldValue - newValue) < ZERO_TOLERANCE) return;
    const undoableChange = {
      name: 'Set Air Permeability for Window',
      timestamp: Date.now(),
      oldValue,
      newValue,
      changedElementId: window.id,
      changedElementType: window.type,
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
      <span>{t('word.AirPermeability', lang)} : </span>
      <InputNumber
        value={parseFloat(value.toFixed(1))}
        precision={1}
        min={0}
        max={100}
        step={0.1}
        disabled={window.locked}
        onChange={(v) => {
          if (v !== null) setValue(v);
        }}
        onPressEnter={confirm}
        onBlur={confirm}
      />
      m³/(h·m²)
    </Space>
  );
};

export default PermeabilityInput;
