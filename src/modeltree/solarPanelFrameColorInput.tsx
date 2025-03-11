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
import { SolarPanelModel } from '../models/SolarPanelModel';

const SolarPanelFrameColorInput = ({ solarPanel }: { solarPanel: SolarPanelModel }) => {
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (color: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.id === solarPanel.id) {
          if (!e.locked) {
            (e as SolarPanelModel).frameColor = color;
          }
          break;
        }
      }
    });
  };

  return (
    <Space>
      <span>{t('solarPanelMenu.FrameColor', lang)} : </span>
      <ColorPicker
        showText
        size={'small'}
        value={solarPanel.frameColor ?? 'white'}
        disabled={solarPanel.locked}
        onChange={(e) => {
          const oldColor = solarPanel.frameColor ?? '#fff';
          const undoableChange = {
            name: 'Set Solar Panel Frame Color',
            timestamp: Date.now(),
            oldValue: oldColor,
            newValue: '#' + e.toHex(),
            changedElementId: solarPanel.id,
            changedElementType: solarPanel.type,
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

export default SolarPanelFrameColorInput;
