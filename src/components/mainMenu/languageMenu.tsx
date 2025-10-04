/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';

import zhCN from 'antd/lib/locale/zh_CN';
import zhTW from 'antd/lib/locale/zh_TW';
import esES from 'antd/lib/locale/es_ES';
import trTR from 'antd/lib/locale/tr_TR';
import enUS from 'antd/lib/locale/en_US';
import ukUA from 'antd/lib/locale/uk_UA';
import { Language } from 'src/types';
import React from 'react';
import * as Selector from '../../stores/selector';
import { ClickEvent, MenuItem, MenuRadioGroup, RadioChangeEvent } from '@szhsin/react-menu';
import i18n from 'src/i18n/i18n';
import { useLanguage } from 'src/hooks';
import { MainSubMenu } from './mainMenuItems';

export const LanguageRadioGroup = React.memo(() => {
  const language = useStore(Selector.language);
  const lang = useLanguage();

  const handleChange = (e: RadioChangeEvent) => {
    useStore.getState().set((state) => {
      state.language = e.value;
      state.lang = { lng: e.value };
      switch (state.language) {
        case 'zh_cn':
          state.locale = zhCN;
          break;
        case 'zh_tw':
          state.locale = zhTW;
          break;
        case 'es':
          state.locale = esES;
          break;
        case 'tr':
          state.locale = trTR;
          break;
        case 'ua':
          state.locale = ukUA;
          break;
        default:
          state.locale = enUS;
      }
    });
  };

  const onClickItem = (e: ClickEvent) => {
    e.keepOpen = true;
  };

  return (
    <MainSubMenu label={i18n.t('menu.languageSubMenu', lang)}>
      <MenuRadioGroup value={language} onRadioChange={handleChange}>
        <MenuItem type="radio" value={'en'} onClick={onClickItem}>
          {Language.English}
        </MenuItem>
        <MenuItem type="radio" value={'es'} onClick={onClickItem}>
          {Language.Spanish}
        </MenuItem>
        <MenuItem type="radio" value={'zh_cn'} onClick={onClickItem}>
          {Language.ChineseSimplified}
        </MenuItem>
        <MenuItem type="radio" value={'zh_tw'} onClick={onClickItem}>
          {Language.ChineseTraditional}
        </MenuItem>
        <MenuItem type="radio" value={'tr'} onClick={onClickItem}>
          {Language.Turkish}
        </MenuItem>
        <MenuItem type="radio" value={'ua'} onClick={onClickItem}>
          {Language.Ukrainian}
        </MenuItem>
      </MenuRadioGroup>
    </MainSubMenu>
  );
});
