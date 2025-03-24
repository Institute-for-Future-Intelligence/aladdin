/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { Select, Space } from 'antd';
import { useStore } from '../stores/common';
import React from 'react';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { Theme } from '../types';
import { themes } from '../constants';
import i18n from '../i18n/i18n';

const SkyThemeSelect = () => {
  const theme = useStore(Selector.viewState.theme);
  const addUndoable = useStore(Selector.addUndoable);

  const lang = useLanguage();
  const { t } = useTranslation();

  const update = (theme: Theme) => {
    useStore.getState().set((state) => {
      state.viewState.theme = theme;
    });
  };

  const setTheme = (t: Theme) => {
    const oldValue = theme;
    const newValue = t;
    if (oldValue === newValue) return;
    const undoableChange = {
      name: 'Set Sky Theme',
      timestamp: Date.now(),
      oldValue,
      newValue,
      undo: () => {
        update(undoableChange.oldValue as Theme);
      },
      redo: () => {
        update(undoableChange.newValue as Theme);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    update(newValue);
  };

  const options = [];
  for (const x of themes) {
    options.push({
      value: x['value'],
      label: (
        <span
          title={t(x['label'], lang)}
          style={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'start',
          }}
        >
          {t(x['label'], lang)}
        </span>
      ),
    });
  }

  return (
    <Space>
      <span>{i18n.t('skyMenu.Theme', lang)} :</span>
      <Select
        defaultValue={Theme.Default}
        options={options}
        style={{ width: '160px' }}
        value={theme as Theme}
        onChange={setTheme}
      />
    </Space>
  );
};

export default SkyThemeSelect;
