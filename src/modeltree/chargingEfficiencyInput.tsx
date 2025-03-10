/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { InputNumber, Space } from 'antd';
import { useStore } from '../stores/common';
import React, { useEffect, useState } from 'react';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { BatteryStorageModel } from '../models/BatteryStorageModel';
import { ZERO_TOLERANCE } from '../constants';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';

const ChargingEfficiencyInput = ({ battery }: { battery: BatteryStorageModel }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const [value, setValue] = useState<number>(battery.chargingEfficiency ?? 0.95);

  const lang = useLanguage();
  const { t } = useTranslation();

  useEffect(() => {
    setValue(battery.chargingEfficiency ?? 0.95);
  }, [battery.chargingEfficiency]);

  const update = (value: number) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === battery.id);
      if (a) {
        (a as BatteryStorageModel).chargingEfficiency = value;
      }
    });
  };

  const confirm = () => {
    const oldValue = battery.chargingEfficiency;
    if (Math.abs(value - oldValue) < ZERO_TOLERANCE) return;
    const undoableChange = {
      name: 'Set Charging Efficiency for Battery',
      timestamp: Date.now(),
      oldValue,
      newValue: value,
      changedElementId: battery.id,
      changedElementType: battery.type,
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
    update(value);
  };

  return (
    <Space>
      <span>{t('batteryStorageMenu.ChargingEfficiency', lang)}: </span>
      <InputNumber
        value={parseFloat(value.toFixed(2))}
        precision={2}
        min={0.3}
        max={0.99}
        step={0.05}
        disabled={battery.locked}
        onChange={(value) => {
          if (value !== null) setValue(value);
        }}
        onBlur={confirm}
        onPressEnter={confirm}
      />
    </Space>
  );
};

export default ChargingEfficiencyInput;
