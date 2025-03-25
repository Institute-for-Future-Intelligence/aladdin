/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { ColorPicker, Space } from 'antd';
import { useStore } from '../stores/common';
import React from 'react';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';

const GroundColorInput = () => {
  const groundColor = useStore(Selector.viewState.groundColor);
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (color: string) => {
    useStore.getState().set((state) => {
      state.viewState.groundColor = color;
    });
  };

  return (
    <Space>
      <span>{t('word.Color', lang)} : </span>
      <ColorPicker
        showText
        size={'small'}
        value={groundColor ?? '#16A5A5'}
        onChange={(e) => {
          const oldValue = groundColor;
          const newValue = '#' + e.toHex();
          const undoableChange = {
            name: 'Set Ground Color',
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
        }}
      />
    </Space>
  );
};

export default GroundColorInput;
