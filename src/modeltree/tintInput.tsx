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
import { WindowModel } from '../models/WindowModel';

const TintInput = ({ window }: { window: WindowModel }) => {
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const updateTint = (color: string) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === window.id);
      if (a) {
        (a as WindowModel).tint = color;
      }
    });
  };

  return (
    <Space>
      <span>{t('windowMenu.Tint', lang)} : </span>
      <ColorPicker
        showText
        size={'small'}
        value={window.tint}
        disabled={window.locked}
        onChange={(e) => {
          const oldTint = window.tint;
          const undoableChange = {
            name: 'Set Tint for Window',
            timestamp: Date.now(),
            oldValue: oldTint,
            newValue: '#' + e.toHex(),
            changedElementId: window.id,
            changedElementType: window.type,
            undo: () => {
              updateTint(undoableChange.oldValue as string);
            },
            redo: () => {
              updateTint(undoableChange.newValue as string);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateTint('#' + e.toHex());
        }}
      />
    </Space>
  );
};

export default TintInput;
