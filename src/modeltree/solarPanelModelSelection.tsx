/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { Select, Space } from 'antd';
import { useStore } from '../stores/common';
import React, { useMemo } from 'react';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { Orientation } from '../types';
import { SolarPanelModel } from '../models/SolarPanelModel';
import i18n from '../i18n/i18n';

const SolarPanelModelSelection = ({ solarPanel }: { solarPanel: SolarPanelModel }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const supportedPvModules = useStore(Selector.supportedPvModules);
  const customPvModules = useStore(Selector.customPvModules);

  const lang = useLanguage();
  const { t } = useTranslation();

  const pvModules = useMemo(() => {
    return { ...customPvModules, ...supportedPvModules };
  }, [supportedPvModules, customPvModules]);

  const options = [];
  for (const key in pvModules) {
    const panel = pvModules[key];
    const t = key + (panel.bifacialityFactor > 0 ? ' (' + i18n.t('pvModelPanel.Bifacial', lang) + ')' : '');
    options.push({
      value: key,
      label: (
        <span
          title={t}
          style={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'start',
          }}
        >
          {t}
        </span>
      ),
    });
  }

  const updateModel = (value: string) => {
    useStore.getState().set((state) => {
      const elem = state.elements.find((e) => e.id === solarPanel.id);
      if (elem) {
        const panel = elem as SolarPanelModel;
        panel.pvModelName = value;
        let pvModel = state.supportedPvModules[value];
        if (!pvModel) pvModel = state.customPvModules[value];
        if (panel.orientation === Orientation.portrait) {
          // calculate the current x-y layout
          const nx = Math.max(1, Math.round(panel.lx / pvModel.width));
          const ny = Math.max(1, Math.round(panel.ly / pvModel.length));
          panel.lx = nx * pvModel.width;
          panel.ly = ny * pvModel.length;
        } else {
          // calculate the current x-y layout
          const nx = Math.max(1, Math.round(panel.lx / pvModel.length));
          const ny = Math.max(1, Math.round(panel.ly / pvModel.width));
          panel.lx = nx * pvModel.length;
          panel.ly = ny * pvModel.width;
        }
      }
    });
  };

  return (
    <Space>
      <span>{t('pvModelPanel.Model', lang)} : </span>
      <Select
        defaultValue="Custom"
        options={options}
        style={{ width: '200px' }}
        value={solarPanel.pvModelName}
        onChange={(value) => {
          const oldValue = solarPanel.pvModelName;
          if (oldValue === value) return;
          const undoableChange = {
            name: 'Select Model for Solar Panel',
            timestamp: Date.now(),
            oldValue,
            newValue: value,
            changedElementId: solarPanel.id,
            changedElementType: solarPanel.type,
            undo: () => {
              updateModel(undoableChange.oldValue as string);
            },
            redo: () => {
              updateModel(undoableChange.newValue as string);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateModel(value);
        }}
      />
    </Space>
  );
};

export default SolarPanelModelSelection;
