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
import { ParabolicCollector } from '../models/ParabolicCollector';

const AbsorptanceInput = ({ collector }: { collector: ParabolicCollector }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const [value, setValue] = useState<number>(collector.absorptance);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (value: number) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === collector.id);
      if (a) {
        (a as ParabolicCollector).absorptance = value;
      }
    });
  };

  const confirm = () => {
    const oldValue = collector.absorptance;
    const newValue = value;
    if (Math.abs(oldValue - newValue) < ZERO_TOLERANCE) return;
    const undoableChange = {
      name: 'Set Absorptance for ' + collector.type,
      timestamp: Date.now(),
      oldValue,
      newValue,
      changedElementId: collector.id,
      changedElementType: collector.type,
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
      <span>{t('concentratedSolarPowerCollectorMenu.ReceiverAbsorptance', lang)} : </span>
      <InputNumber
        value={parseFloat(value.toFixed(2))}
        precision={2}
        step={0.01}
        min={0}
        max={1}
        disabled={collector.locked}
        onChange={(value) => {
          if (value !== null) setValue(value);
        }}
        onBlur={confirm}
        onPressEnter={confirm}
      />
    </Space>
  );
};

export default AbsorptanceInput;
