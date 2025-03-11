/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { Select, Space } from 'antd';
import { CommonStoreState, useStore } from '../stores/common';
import React, { useMemo } from 'react';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { ObjectType, SolarStructure } from '../types';
import { HeliostatModel } from '../models/HeliostatModel';
import { FoundationModel } from '../models/FoundationModel';
import i18n from '../i18n/i18n';

const { Option } = Select;

const HeliostatTowerSelect = ({ heliostat }: { heliostat: HeliostatModel }) => {
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const towers = useMemo(() => {
    const towerIds: string[] = [];
    for (const e of elements) {
      if (e.type === ObjectType.Foundation) {
        const f = e as FoundationModel;
        if (f.solarStructure === SolarStructure.FocusTower) {
          towerIds.push(f.id);
        }
      }
    }
    return towerIds;
  }, [elements]);

  const update = (towerId: string) => {
    useStore.getState().set((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Heliostat && e.id === heliostat.id && !e.locked) {
          (e as HeliostatModel).towerId = towerId;
          break;
        }
      }
    });
  };

  const setTowerId = (value: string) => {
    const oldValue = heliostat.towerId;
    const newValue = value;
    if (oldValue === newValue) return;
    const undoableChange = {
      name: 'Select Tower for Heliostat',
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
      <span>{t('heliostatMenu.Tower', lang)} : </span>
      <Select style={{ width: '120px' }} value={heliostat.towerId} onChange={setTowerId}>
        {towers.map((s, i) => {
          return (
            <Option key={i} value={s}>
              {i18n.t('heliostatMenu.Tower', lang) + ' ' + (i + 1)}
            </Option>
          );
        })}
      </Select>
    </Space>
  );
};

export default HeliostatTowerSelect;
