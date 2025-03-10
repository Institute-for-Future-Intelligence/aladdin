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
import { RoofModel } from '../models/RoofModel';

const RoofSideColorInput = ({ roof, defaultColor }: { roof: RoofModel; defaultColor?: string }) => {
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (color: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === roof.id) {
          if (!e.locked) {
            (e as RoofModel).sideColor = color;
          }
          break;
        }
      }
    });
  };

  return (
    <Space>
      <span>{t('roofMenu.RoofSideColor', lang)} : </span>
      <ColorPicker
        showText
        size={'small'}
        value={roof.sideColor ?? defaultColor ?? 'white'}
        disabled={roof.locked}
        onChange={(e) => {
          const oldColor = roof.color;
          const undoableChange = {
            name: 'Set Roof Side Color',
            timestamp: Date.now(),
            oldValue: oldColor,
            newValue: '#' + e.toHex(),
            changedElementId: roof.id,
            changedElementType: roof.type,
            undo: () => {
              update(undoableChange.oldValue as string);
            },
            redo: () => {
              update(undoableChange.newValue as string);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          update('#' + e.toHex());
        }}
      />
    </Space>
  );
};

export default RoofSideColorInput;
