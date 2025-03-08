/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { InputNumber, Space } from 'antd';
import { useStore } from '../stores/common';
import React, { useState } from 'react';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { ZERO_TOLERANCE } from '../constants';
import { SolarCollector } from '../models/SolarCollector';

const PoleHeightInput = ({ collector, extra }: { collector: SolarCollector; extra?: boolean }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const [value, setValue] = useState<number>(collector.poleHeight);

  const lang = useLanguage();
  const { t } = useTranslation();

  const updateHeight = (value: number) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === collector.id);
      if (a) {
        (a as SolarCollector).poleHeight = value;
      }
    });
  };

  const confirm = () => {
    const oldValue = collector.poleHeight;
    const newValue = value;
    if (Math.abs(newValue - oldValue) < ZERO_TOLERANCE) return;
    const undoableChange = {
      name: 'Set Pole Height for ' + collector.type,
      timestamp: Date.now(),
      oldValue,
      newValue,
      changedElementId: collector.id,
      changedElementType: collector.type,
      undo: () => {
        const a = undoableChange.oldValue as number;
        setValue(a);
        updateHeight(a);
      },
      redo: () => {
        const a = undoableChange.newValue as number;
        setValue(a);
        updateHeight(a);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    updateHeight(newValue);
  };

  return (
    <Space>
      <span>{t(extra ? 'solarCollectorMenu.ExtraPoleHeight' : 'solarCollectorMenu.PoleHeight', lang)} : </span>
      <InputNumber
        value={parseFloat(value.toFixed(2))}
        precision={2}
        step={0.1}
        min={0}
        max={10}
        disabled={collector.locked}
        onChange={(value) => {
          if (value !== null) setValue(value);
        }}
        onBlur={confirm}
        onPressEnter={confirm}
      />
      {t('word.MeterAbbreviation', lang)}
    </Space>
  );
};

export default PoleHeightInput;
