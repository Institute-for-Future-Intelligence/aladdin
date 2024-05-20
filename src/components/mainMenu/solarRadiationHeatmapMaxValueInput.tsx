/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { InputNumber, Space } from 'antd';
import { useStore } from 'src/stores/common';
import { MenuItem } from '../contextMenu/menuItems';
import i18n from 'src/i18n/i18n';
import * as Selector from '../../stores/selector';
import { useLanguage } from 'src/hooks';
import React from 'react';

export const SolarRadiationHeatmapMaxValueInput = React.memo(() => {
  const lang = useLanguage();
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  return (
    <MenuItem noPadding stayAfterClick>
      <Space style={{ width: '280px' }}>{i18n.t('menu.physics.SolarRadiationHeatmapMaxValue', lang) + ':'}</Space>
      <InputNumber
        min={0.5}
        max={50}
        step={0.5}
        style={{ width: 60 }}
        precision={1}
        value={solarRadiationHeatmapMaxValue ?? 5}
        onChange={(value) => {
          useStore.getState().set((state) => {
            if (value === null) return;
            state.viewState.solarRadiationHeatMapMaxValue = value;
          });
        }}
      />
    </MenuItem>
  );
});
