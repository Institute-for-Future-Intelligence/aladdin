/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { ColorPicker, Space } from 'antd';
import { useStore } from '../stores/common';
import React from 'react';
import { ElementModel } from '../models/ElementModel';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';

const ColorInput = ({ element }: { element: ElementModel }) => {
  const updateElementColorById = useStore(Selector.updateElementColorById);
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  return (
    <Space>
      <span>{t('word.Color', lang)} : </span>
      <ColorPicker
        showText
        size={'small'}
        value={element.color}
        disabled={element.locked}
        onChange={(e) => {
          const oldColor = element.color;
          const undoableChange = {
            name: 'Set Color for ' + element.type,
            timestamp: Date.now(),
            oldValue: oldColor,
            newValue: '#' + e.toHex(),
            changedElementId: element.id,
            changedElementType: element.type,
            undo: () => {
              updateElementColorById(undoableChange.changedElementId, undoableChange.oldValue as string);
            },
            redo: () => {
              updateElementColorById(undoableChange.changedElementId, undoableChange.newValue as string);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateElementColorById(element.id, '#' + e.toHex());
        }}
      />
    </Space>
  );
};

export default ColorInput;
