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
import { DoorModel } from '../models/DoorModel';

const DoorFrameColorInput = ({ door, defaultColor }: { door: DoorModel; defaultColor?: string }) => {
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (color: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === door.id) {
          if (!e.locked) {
            (e as DoorModel).frameColor = color;
          }
          break;
        }
      }
    });
  };

  return (
    <Space>
      <span>{t('doorMenu.FrameColor', lang)} : </span>
      <ColorPicker
        showText
        size={'small'}
        value={door.frameColor ?? defaultColor ?? 'white'}
        disabled={door.locked}
        onChange={(e) => {
          const oldColor = door.color;
          const undoableChange = {
            name: 'Set Door Frame Color',
            timestamp: Date.now(),
            oldValue: oldColor,
            newValue: '#' + e.toHex(),
            changedElementId: door.id,
            changedElementType: door.type,
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

export default DoorFrameColorInput;
