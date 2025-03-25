/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { Checkbox, Space } from 'antd';
import { useStore } from '../stores/common';
import React from 'react';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import * as Selector from '../stores/selector';
import { UndoableCheck } from '../undo/UndoableCheck';

const HeliodonCheckbox = () => {
  const heliodon = useStore(Selector.viewState.heliodon);
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (selected: boolean) => {
    useStore.getState().set((state) => {
      state.viewState.heliodon = selected;
      if (state.viewState.heliodon) {
        state.updateSceneRadius();
      }
    });
  };

  const setHeliodon = (b: boolean) => {
    const undoableCheck = {
      name: 'Show Heliodon',
      timestamp: Date.now(),
      checked: !heliodon,
      undo: () => update(!undoableCheck.checked),
      redo: () => update(undoableCheck.checked),
    } as UndoableCheck;
    addUndoable(undoableCheck);
    update(b);
  };

  return (
    <Space>
      <span>{t('menu.settings.Heliodon', lang)} :</span>
      <Checkbox checked={heliodon} onChange={(e) => setHeliodon(e.target.checked)} />
    </Space>
  );
};

export default HeliodonCheckbox;
