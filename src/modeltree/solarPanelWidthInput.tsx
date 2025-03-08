/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { InputNumber, Space } from 'antd';
import { useStore } from '../stores/common';
import React, { useEffect, useMemo, useState } from 'react';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { Util } from '../Util';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import { ZERO_TOLERANCE } from '../constants';
import { Orientation } from '../types';

const SolarPanelWidthInput = ({ solarPanel }: { solarPanel: SolarPanelModel }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const supportedPvModules = useStore(Selector.supportedPvModules);
  const customPvModules = useStore(Selector.customPvModules);

  const [value, setValue] = useState<number>(solarPanel.ly);

  useEffect(() => {
    setValue(solarPanel.ly);
  }, [solarPanel.ly]);

  const lang = useLanguage();
  const { t } = useTranslation();

  const pvModules = useMemo(() => {
    return { ...customPvModules, ...supportedPvModules };
  }, [supportedPvModules, customPvModules]);

  const pvModel = pvModules[solarPanel.pvModelName];
  if (!pvModel) return null;
  const dy = solarPanel.orientation === Orientation.portrait ? pvModel.length : pvModel.width;

  const updateWidth = (value: number) => {
    useStore.getState().set((state) => {
      const element = state.elements.find((e) => e.id === solarPanel.id);
      if (element) {
        const sp = element as SolarPanelModel;
        sp.ly = Util.panelizeLy(sp, pvModel, value);
      }
    });
  };

  const confirm = () => {
    const oldValue = solarPanel.ly;
    const newValue = value;
    if (Math.abs(oldValue - newValue) < ZERO_TOLERANCE) return;
    const undoableChange = {
      name: 'Set Width for Solar Panel Array',
      timestamp: Date.now(),
      oldValue,
      newValue,
      changedElementId: solarPanel.id,
      changedElementType: solarPanel.type,
      undo: () => {
        const a = undoableChange.oldValue as number;
        setValue(a);
        updateWidth(a);
      },
      redo: () => {
        const a = undoableChange.newValue as number;
        setValue(a);
        updateWidth(a);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    updateWidth(newValue);
  };

  const panelize = (value: number) => {
    let l = value ?? 1;
    const n = Math.max(1, Math.ceil((l - dy / 2) / dy));
    l = n * dy;
    return l;
  };

  return (
    <Space>
      <span>{t('word.Width', lang)} : </span>
      <InputNumber
        value={parseFloat(value.toFixed(2))}
        precision={2}
        step={dy}
        min={dy}
        disabled={solarPanel.locked}
        onChange={(value) => {
          if (value !== null) setValue(panelize(value));
        }}
        onBlur={confirm}
        onPressEnter={confirm}
      />
    </Space>
  );
};

export default SolarPanelWidthInput;
