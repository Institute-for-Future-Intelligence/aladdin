/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { InputNumber, Space } from 'antd';
import { useStore } from '../stores/common';
import React, { useState } from 'react';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { ZERO_TOLERANCE } from '../constants';
import { RoofModel } from '../models/RoofModel';
import { WallModel } from '../models/WallModel';
import { DoorModel } from '../models/DoorModel';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';

const HeatCapacityInput = ({ element }: { element: WallModel | RoofModel | DoorModel }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const [value, setValue] = useState<number>(element.volumetricHeatCapacity ?? 0.5);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (value: number) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === element.id);
      if (a) {
        (a as WallModel | RoofModel | DoorModel).volumetricHeatCapacity = value;
      }
    });
  };

  const confirm = () => {
    const oldValue = element.volumetricHeatCapacity ?? 0.5;
    const newValue = value;
    if (Math.abs(oldValue - newValue) < ZERO_TOLERANCE) return;
    const undoableChange = {
      name: 'Set Volumetric Heat Capacity for ' + element.type,
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
      <span>{t('word.VolumetricHeatCapacity', lang)} : </span>
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
      kWh/(m³·℃)
    </Space>
  );
};

export default HeatCapacityInput;
