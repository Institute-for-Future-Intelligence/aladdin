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
import { WindTurbineModel } from '../models/WindTurbineModel';

const WindTurbineTowerHeightInput = ({ turbine }: { turbine: WindTurbineModel }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const [value, setValue] = useState<number>(turbine.towerHeight);

  const lang = useLanguage();
  const { t } = useTranslation();

  useEffect(() => {
    setValue(turbine.towerHeight);
  }, [turbine.towerHeight]);

  const update = (value: number) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === turbine.id);
      if (a) {
        (a as WindTurbineModel).towerHeight = value;
      }
    });
  };

  const confirm = () => {
    const oldValue = turbine.towerHeight;
    if (Math.abs(value - oldValue) < ZERO_TOLERANCE) return;
    const undoableChange = {
      name: 'Set Wind Turbine Tower Height',
      timestamp: Date.now(),
      oldValue,
      newValue: value,
      changedElementId: turbine.id,
      changedElementType: turbine.type,
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
      <span>{t('windTurbineMenu.TowerHeight', lang)}: </span>
      <InputNumber
        value={parseFloat(value.toFixed(1))}
        precision={1}
        min={1}
        max={100}
        step={0.1}
        disabled={turbine.locked}
        onChange={(value) => {
          if (value !== null) setValue(value);
        }}
        onBlur={confirm}
        onPressEnter={confirm}
      />
    </Space>
  );
};

export default WindTurbineTowerHeightInput;
