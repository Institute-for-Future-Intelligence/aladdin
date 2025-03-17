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
import { Util } from '../Util';

const WindTurbineYawInput = ({ turbine }: { turbine: WindTurbineModel }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const [value, setValue] = useState<number>(turbine.relativeYawAngle);

  const lang = useLanguage();
  const { t } = useTranslation();

  useEffect(() => {
    setValue(turbine.relativeYawAngle);
  }, [turbine.relativeYawAngle]);

  const update = (value: number) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === turbine.id);
      if (a) {
        (a as WindTurbineModel).relativeYawAngle = value;
      }
    });
  };

  const confirm = () => {
    const oldValue = turbine.relativeYawAngle;
    if (Math.abs(value - oldValue) < ZERO_TOLERANCE) return;
    const undoableChange = {
      name: 'Set Wind Turbine Yaw Angle',
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
      <span>{t('windTurbineMenu.RelativeYawAngle', lang)}: </span>
      <InputNumber
        value={parseFloat(Util.toDegrees(value).toFixed(2))}
        precision={2}
        min={-180}
        max={180}
        step={1}
        formatter={(value) => `${value}°`}
        disabled={turbine.locked}
        onChange={(value) => {
          if (value !== null) setValue(Util.toRadians(value));
        }}
        onBlur={confirm}
        onPressEnter={confirm}
      />
    </Space>
  );
};

export default WindTurbineYawInput;
