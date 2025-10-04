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
import { DEFAULT_VIEW_SOLAR_RADIATION_HEAT_MAP_MAX_VALUE } from 'src/constants';

export const SolarRadiationHeatmapMaxValueInput = React.memo(() => {
  const lang = useLanguage();
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  return (
    <MainMenuItem stayAfterClick>
      <Space style={{ width: '300px' }}>{i18n.t('menu.physics.SolarRadiationHeatmapMaxValue', lang) + ':'}</Space>
      <InputNumber
        min={0.5}
        max={50}
        step={0.5}
        style={{ width: 60 }}
        precision={1}
        value={solarRadiationHeatmapMaxValue ?? DEFAULT_VIEW_SOLAR_RADIATION_HEAT_MAP_MAX_VALUE}
        onChange={(value) => {
          useStore.getState().set((state) => {
            if (value === null) return;
            state.viewState.solarRadiationHeatMapMaxValue = value;
          });
        }}
      />
    </MainMenuItem>
  );
});
