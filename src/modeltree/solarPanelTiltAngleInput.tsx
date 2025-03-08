/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { InputNumber, Space } from 'antd';
import { useStore } from '../stores/common';
import React, { useEffect, useState } from 'react';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { Util } from '../Util';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import { ZERO_TOLERANCE } from '../constants';

const SolarPanelTiltAngleInput = ({ solarPanel }: { solarPanel: SolarPanelModel }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const [value, setValue] = useState<number>(solarPanel.tiltAngle);

  useEffect(() => {
    setValue(solarPanel.tiltAngle);
  }, [solarPanel.tiltAngle]);

  const lang = useLanguage();
  const { t } = useTranslation();

  const updateAngle = (radians: number) => {
    useStore.getState().set((state) => {
      const element = state.elements.find((e) => e.id === solarPanel.id);
      if (element) {
        (element as SolarPanelModel).tiltAngle = radians;
      }
    });
  };

  const confirm = () => {
    const oldValue = solarPanel.tiltAngle;
    const newValue = value;
    if (Math.abs(oldValue - newValue) < ZERO_TOLERANCE) return;
    const undoableChange = {
      name: 'Set Tilt Angle for Solar Panel',
      timestamp: Date.now(),
      oldValue,
      newValue,
      changedElementId: solarPanel.id,
      changedElementType: solarPanel.type,
      undo: () => {
        const a = undoableChange.oldValue as number;
        setValue(a);
        updateAngle(a);
      },
      redo: () => {
        const a = undoableChange.newValue as number;
        setValue(a);
        updateAngle(a);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    updateAngle(newValue);
  };

  return (
    <Space>
      <span>{t('solarPanelMenu.TiltAngle', lang)} : </span>
      <InputNumber
        value={parseFloat(Util.toDegrees(value).toFixed(2))}
        precision={2}
        step={1}
        min={-90}
        max={90}
        formatter={(value) => `${value}°`}
        disabled={solarPanel.locked}
        onChange={(value) => {
          if (value !== null) {
            setValue(Util.toRadians(value));
          }
        }}
        onBlur={confirm}
        onPressEnter={confirm}
      />
    </Space>
  );
};

export default SolarPanelTiltAngleInput;
