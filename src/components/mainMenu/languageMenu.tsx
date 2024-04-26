/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { Radio, RadioChangeEvent, Space } from 'antd';
import { useStore } from 'src/stores/common';

import zhCN from 'antd/lib/locale/zh_CN';
import zhTW from 'antd/lib/locale/zh_TW';
import esES from 'antd/lib/locale/es_ES';
import trTR from 'antd/lib/locale/tr_TR';
import enUS from 'antd/lib/locale/en_US';
import ukUA from 'antd/lib/locale/uk_UA';
import { Language } from 'src/types';
import { MenuItem } from '../contextMenu/menuItems';

export const LanguageRadioGroup = () => {
  const language = useStore.getState().language;

  const handleChange = (e: RadioChangeEvent) => {
    useStore.getState().set((state) => {
      state.language = e.target.value;
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

  return (
    <MenuItem stayAfterClick noPadding update>
      <Radio.Group value={language} style={{ height: '170px' }} onChange={handleChange}>
        <Space direction="vertical">
          <Radio style={{ width: '100%' }} value={'en'}>
            {Language.English}
          </Radio>
          <Radio style={{ width: '100%' }} value={'es'}>
            {Language.Spanish}
          </Radio>
          <Radio style={{ width: '100%' }} value={'zh_cn'}>
            {Language.ChineseSimplified}
          </Radio>
          <Radio style={{ width: '100%' }} value={'zh_tw'}>
            {Language.ChineseTraditional}
          </Radio>
          <Radio style={{ width: '100%' }} value={'tr'}>
            {Language.Turkish}
          </Radio>
          <Radio style={{ width: '100%' }} value={'ua'}>
            {Language.Ukrainian}
          </Radio>
        </Space>
      </Radio.Group>
    </MenuItem>
  );
};
