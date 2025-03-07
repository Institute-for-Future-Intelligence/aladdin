/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { Radio, Space } from 'antd';
import { useStore } from '../stores/common';
import React from 'react';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { Orientation } from '../types';
import { SolarPanelModel } from '../models/SolarPanelModel';

const SolarPanelOrientationRadioGroup = ({ solarPanel }: { solarPanel: SolarPanelModel }) => {
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const updateOrientation = (orientation: Orientation) => {
    useStore.getState().set((state) => {
      const elem = state.elements.find((e) => e.id === solarPanel.id);
      if (elem) {
        let pvModel = state.supportedPvModules[solarPanel.pvModelName];
        if (!pvModel) pvModel = state.customPvModules[solarPanel.pvModelName];
        state.setSolarPanelOrientation(elem as SolarPanelModel, pvModel, orientation);
      }
    });
  };

  return (
    <Space>
      <span>{t('solarPanelMenu.Orientation', lang)} : </span>
      <Radio.Group
        value={solarPanel.orientation}
        options={[
          { value: Orientation.portrait, label: t('solarPanelMenu.Portrait', lang) },
          { value: Orientation.landscape, label: t('solarPanelMenu.Landscape', lang) },
        ]}
        onChange={(e) => {
          const oldValue = solarPanel.orientation;
          const newValue = e.target.value;
          if (oldValue === newValue) return;
          const undoableChange = {
            name: 'Set Orientation for Solar Panel',
            timestamp: Date.now(),
            oldValue,
            newValue,
            changedElementId: solarPanel.id,
            changedElementType: solarPanel.type,
            undo: () => {
              updateOrientation(undoableChange.oldValue as Orientation);
            },
            redo: () => {
              updateOrientation(undoableChange.newValue as Orientation);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateOrientation(newValue);
        }}
      />
    </Space>
  );
};

export default SolarPanelOrientationRadioGroup;
