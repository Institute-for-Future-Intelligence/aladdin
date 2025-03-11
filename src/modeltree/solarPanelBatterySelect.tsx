/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { Select, Space } from 'antd';
import { CommonStoreState, useStore } from '../stores/common';
import React from 'react';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { ObjectType } from '../types';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { BatteryStorageModel } from '../models/BatteryStorageModel';

const SolarPanelBatterySelect = ({ solarPanel }: { solarPanel: SolarPanelModel }) => {
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const getOptions = () => {
    const options: { value: string; label: string }[] = [{ value: 'None', label: 'None' }];
    let idx = 1;
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.BatteryStorage) {
        const label = idx + ' - ' + ((e as BatteryStorageModel).editableId ?? e.id.slice(0, 4));
        idx++;
        options.push({ value: e.id, label: label });
      }
    }
    return options;
  };

  const update = (selection: string) => {
    useStore.getState().set((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.id === solarPanel.id && !e.locked) {
          (e as SolarPanelModel).batteryStorageId = selection;
          break;
        }
      }
    });
  };

  const setSelection = (value: string) => {
    const oldValue = solarPanel.batteryStorageId;
    const newValue = value;
    if (oldValue === newValue) return;
    const undoableChange = {
      name: 'Set Battery Storage ID for Solar Panel',
      timestamp: Date.now(),
      oldValue,
      newValue,
      undo: () => {
        update(undoableChange.oldValue as string);
      },
      redo: () => {
        update(undoableChange.newValue as string);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    update(newValue);
  };

  return (
    <Space>
      <span>{t('solarPanelMenu.BatteryStorageSelection', lang)} : </span>
      <Select
        style={{ width: '150px' }}
        value={solarPanel.batteryStorageId ?? 'None'}
        onChange={(value) => setSelection(value)}
        options={getOptions()}
      />
    </Space>
  );
};

export default SolarPanelBatterySelect;
