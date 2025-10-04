/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { InputNumber, Space } from 'antd';
import { useStore } from 'src/stores/common';
import i18n from 'src/i18n/i18n';
import * as Selector from '../../stores/selector';
import { useLanguage } from 'src/hooks';
import React from 'react';
import { MainMenuItem } from './mainMenuItems';

export const SensorSimulationSamplingFrequencyInput = React.memo(() => {
  const lang = useLanguage();
  const timesPerHour = useStore(Selector.world.timesPerHour);

  return (
    <MainMenuItem stayAfterClick>
      <Space style={{ width: '150px' }}>{i18n.t('menu.option.SamplingFrequency', lang) + ':'}</Space>
      <InputNumber
        min={1}
        max={60}
        step={1}
        style={{ width: 60 }}
        precision={0}
        value={timesPerHour}
        formatter={(a) => Number(a).toFixed(0)}
        onChange={(value) => {
          if (value === null) return;
          useStore.getState().set((state) => {
            state.world.timesPerHour = value;
          });
        }}
      />
      <Space style={{ paddingLeft: '10px' }}>{i18n.t('menu.option.TimesPerHour', lang)}</Space>
    </MainMenuItem>
  );
});
