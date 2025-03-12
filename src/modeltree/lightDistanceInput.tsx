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
import { LightModel } from '../models/LightModel';

const LightDistanceInput = ({ light }: { light: LightModel }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const [value, setValue] = useState<number>(light.distance);

  const lang = useLanguage();
  const { t } = useTranslation();

  useEffect(() => {
    setValue(light.distance);
  }, [light.distance]);

  const update = (value: number) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === light.id);
      if (a) {
        (a as LightModel).distance = value;
      }
    });
  };

  const confirm = () => {
    const oldValue = light.distance;
    if (Math.abs(value - oldValue) < ZERO_TOLERANCE) return;
    const undoableChange = {
      name: 'Set Light Distance',
      timestamp: Date.now(),
      oldValue,
      newValue: value,
      changedElementId: light.id,
      changedElementType: light.type,
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
      <span>{t('lightMenu.MaximumDistance', lang)}: </span>
      <InputNumber
        value={parseFloat(value.toFixed(2))}
        precision={1}
        min={1}
        max={10}
        step={1}
        disabled={light.locked}
        onChange={(value) => {
          if (value !== null) setValue(value);
        }}
        onBlur={confirm}
        onPressEnter={confirm}
      />
    </Space>
  );
};

export default LightDistanceInput;
