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
import { WindowModel, WindowType } from '../models/WindowModel';

const { Option } = Select;

const WindowTypeInput = ({ window }: { window: WindowModel }) => {
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (value: WindowType) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === window.id);
      if (a) {
        (a as WindowModel).windowType = value;
      }
    });
  };

  const setType = (value: WindowType) => {
    const newValue = value;
    const oldValue = window.windowType ?? WindowType.Default;
    if (newValue === oldValue) return;
    const undoableChange = {
      name: 'Set Window Type',
      timestamp: Date.now(),
      oldValue,
      newValue,
      changedElementId: window.id,
      changedElementType: window.type,
      undo: () => {
        update(undoableChange.oldValue as WindowType);
      },
      redo: () => {
        update(undoableChange.newValue as WindowType);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    update(newValue);
  };

  return (
    <Space>
      <span>{t('word.Type', lang)} : </span>
      <Select style={{ width: '120px' }} value={window.windowType} onChange={(value) => setType(value)}>
        <Option key={WindowType.Default} value={WindowType.Default}>
          {t('windowMenu.Default', lang)}
        </Option>
        <Option key={WindowType.Arched} value={WindowType.Arched}>
          {t('windowMenu.Arched', lang)}
        </Option>
        <Option key={WindowType.Polygonal} value={WindowType.Polygonal}>
          {t('windowMenu.Polygonal', lang)}
        </Option>
      </Select>
    </Space>
  );
};

export default WindowTypeInput;
