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
import { DoorModel, DoorType } from '../models/DoorModel';

const { Option } = Select;

const DoorTypeInput = ({ door }: { door: DoorModel }) => {
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (value: DoorType) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === door.id);
      if (a) {
        (a as DoorModel).doorType = value;
      }
    });
  };

  const setType = (value: DoorType) => {
    const newValue = value;
    const oldValue = door.doorType ?? DoorType.Default;
    if (newValue === oldValue) return;
    const undoableChange = {
      name: 'Set Door Type',
      timestamp: Date.now(),
      oldValue,
      newValue,
      changedElementId: door.id,
      changedElementType: door.type,
      undo: () => {
        update(undoableChange.oldValue as DoorType);
      },
      redo: () => {
        update(undoableChange.newValue as DoorType);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    update(newValue);
  };

  return (
    <Space>
      <span>{t('word.Type', lang)} : </span>
      <Select style={{ width: '120px' }} value={door.doorType} onChange={(value) => setType(value)}>
        <Option key={DoorType.Default} value={DoorType.Default}>
          {t('doorMenu.Default', lang)}
        </Option>
        <Option key={DoorType.Arched} value={DoorType.Arched}>
          {t('doorMenu.Arched', lang)}
        </Option>
      </Select>
    </Space>
  );
};

export default DoorTypeInput;
