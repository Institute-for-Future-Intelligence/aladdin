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

const LightIntensityInput = ({ light }: { light: LightModel }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const [value, setValue] = useState<number>(light.intensity);

  const lang = useLanguage();
  const { t } = useTranslation();

  useEffect(() => {
    setValue(light.intensity);
  }, [light.intensity]);

  const update = (value: number) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === light.id);
      if (a) {
        (a as LightModel).intensity = value;
      }
    });
  };

  const confirm = () => {
    const oldValue = light.intensity;
    if (Math.abs(value - oldValue) < ZERO_TOLERANCE) return;
    const undoableChange = {
      name: 'Set Light Intensity',
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
      <span>{t('lightMenu.Intensity', lang)}: </span>
      <InputNumber
        value={parseFloat(value.toFixed(2))}
        precision={1}
        min={0.1}
        max={10}
        step={0.1}
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

export default LightIntensityInput;
