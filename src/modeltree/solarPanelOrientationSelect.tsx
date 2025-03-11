/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { Select, Space } from 'antd';
import { useStore } from '../stores/common';
import React from 'react';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { Orientation } from '../types';
import { SolarPanelModel } from '../models/SolarPanelModel';

const { Option } = Select;

const SolarPanelOrientationSelect = ({ solarPanel }: { solarPanel: SolarPanelModel }) => {
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (orientation: Orientation) => {
    useStore.getState().set((state) => {
      const elem = state.elements.find((e) => e.id === solarPanel.id);
      if (elem) {
        let pvModel = state.supportedPvModules[solarPanel.pvModelName];
        if (!pvModel) pvModel = state.customPvModules[solarPanel.pvModelName];
        state.setSolarPanelOrientation(elem as SolarPanelModel, pvModel, orientation);
      }
    });
  };

  const setOrientation = (orientation: Orientation) => {
    const oldValue = solarPanel.orientation;
    const newValue = orientation;
    if (oldValue === newValue) return;
    const undoableChange = {
      name: 'Set Orientation for Solar Panel',
      timestamp: Date.now(),
      oldValue,
      newValue,
      changedElementId: solarPanel.id,
      changedElementType: solarPanel.type,
      undo: () => {
        update(undoableChange.oldValue as Orientation);
      },
      redo: () => {
        update(undoableChange.newValue as Orientation);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    update(newValue);
  };

  return (
    <Space>
      <span>{t('solarPanelMenu.Orientation', lang)} : </span>
      <Select style={{ width: '120px' }} value={solarPanel.orientation} onChange={(value) => setOrientation(value)}>
        <Option key={Orientation.portrait} value={Orientation.portrait}>
          {t('solarPanelMenu.Portrait', lang)}
        </Option>
        <Option key={Orientation.landscape} value={Orientation.landscape}>
          {t('solarPanelMenu.Landscape', lang)}
        </Option>
      </Select>
    </Space>
  );
};

export default SolarPanelOrientationSelect;
