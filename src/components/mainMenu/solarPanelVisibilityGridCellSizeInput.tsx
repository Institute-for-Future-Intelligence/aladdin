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
import { DEFAULT_SOLAR_PANEL_VISIBILITY_GRID_CELL_SIZE } from 'src/constants';

export const SolarPanelVisibilityGridCellSizeInput = React.memo(() => {
  const lang = useLanguage();
  const solarPanelVisibilityGridCellSize = useStore(Selector.world.solarPanelVisibilityGridCellSize);

  return (
    <MainMenuItem stayAfterClick>
      <Space style={{ paddingRight: '10px' }}>{i18n.t('menu.solarPanel.VisibilityGridCellSize', lang) + ':'}</Space>
      <InputNumber
        min={0.1}
        max={5}
        step={0.1}
        style={{ width: 60 }}
        precision={1}
        value={solarPanelVisibilityGridCellSize ?? DEFAULT_SOLAR_PANEL_VISIBILITY_GRID_CELL_SIZE}
        onChange={(value) => {
          if (value === null) return;
          useStore.getState().set((state) => {
            state.world.solarPanelVisibilityGridCellSize = value;
          });
        }}
      />
      <Space style={{ paddingLeft: '10px' }}>{i18n.t('word.MeterAbbreviation', lang)}</Space>
    </MainMenuItem>
  );
});
