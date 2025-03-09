/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { Space } from 'antd';
import { useStore } from '../stores/common';
import React from 'react';
import { ElementModel } from '../models/ElementModel';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { LineWidth } from '../types';
import LineWidthSelect from '../components/contextMenu/elementMenu/polygonMenu/lineWidthSelect';

const LineWidthInput = ({ element }: { element: ElementModel }) => {
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (value: LineWidth) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === element.id);
      if (a) {
        a.lineWidth = value;
      }
    });
  };

  const setWidth = (value: LineWidth) => {
    const newValue = value;
    const oldValue = element.lineWidth ?? LineWidth.One;
    if (newValue === oldValue) return;
    const undoableChange = {
      name: 'Set Line Width for ' + element.type,
      timestamp: Date.now(),
      oldValue,
      newValue,
      changedElementId: element.id,
      changedElementType: element.type,
      undo: () => {
        update(undoableChange.oldValue as LineWidth);
      },
      redo: () => {
        update(undoableChange.newValue as LineWidth);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    update(newValue);
  };

  return (
    <Space>
      <span>{t('polygonMenu.LineWidth', lang)} : </span>
      <LineWidthSelect width={element.lineWidth ?? LineWidth.One} setWidth={setWidth} uiWidth={150} />
    </Space>
  );
};

export default LineWidthInput;
