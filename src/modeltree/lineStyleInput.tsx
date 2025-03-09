/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { Space } from 'antd';
import { useStore } from '../stores/common';
import React from 'react';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { LineStyle } from '../types';
import { PolygonModel } from '../models/PolygonModel';
import LineStyleSelect from '../components/contextMenu/elementMenu/polygonMenu/lineStyleSelect';

const LineStyleInput = ({ polygon }: { polygon: PolygonModel }) => {
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (value: LineStyle) => {
    useStore.getState().set((state) => {
      const a = state.elements.find((e) => e.id === polygon.id);
      if (a) {
        (a as PolygonModel).lineStyle = value;
      }
    });
  };

  const setStyle = (value: LineStyle) => {
    const newValue = value;
    const oldValue = polygon.lineStyle ?? LineStyle.Solid;
    if (newValue === oldValue) return;
    const undoableChange = {
      name: 'Set Line Style for ' + polygon.type,
      timestamp: Date.now(),
      oldValue,
      newValue,
      changedElementId: polygon.id,
      changedElementType: polygon.type,
      undo: () => {
        update(undoableChange.oldValue as LineStyle);
      },
      redo: () => {
        update(undoableChange.newValue as LineStyle);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    update(newValue);
  };

  return (
    <Space>
      <span>{t('polygonMenu.LineStyle', lang)} : </span>
      <LineStyleSelect style={polygon.lineStyle ?? LineStyle.Solid} setStyle={setStyle} />
    </Space>
  );
};

export default LineStyleInput;
