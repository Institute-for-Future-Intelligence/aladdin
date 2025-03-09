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
import { ColorType } from '../constants';

const ColorInput = ({ element, type, title }: { element: ElementModel; type?: ColorType; title?: string }) => {
  const updateElementColorById = useStore(Selector.updateElementColorById);
  const updateElementLineColorById = useStore(Selector.updateElementLineColorById);
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (elementId: string, color: string) => {
    if (type === ColorType.Line) {
      updateElementLineColorById(elementId, color);
    } else {
      updateElementColorById(elementId, color);
    }
  };

  return (
    <Space>
      <span>{title ?? t('word.Color', lang)} : </span>
      <ColorPicker
        showText
        size={'small'}
        value={type === ColorType.Line ? element.lineColor ?? '#000' : element.color}
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
              update(undoableChange.changedElementId, undoableChange.oldValue as string);
            },
            redo: () => {
              update(undoableChange.changedElementId, undoableChange.newValue as string);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          update(element.id, '#' + e.toHex());
        }}
      />
    </Space>
  );
};

export default ColorInput;
