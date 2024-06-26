/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Space, Switch } from 'antd';
import { MenuItem } from '../contextMenu/menuItems';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import * as Selector from '../../stores/selector';
import { useLanguage } from 'src/hooks';
import React from 'react';

export const SolarPanelNoAnimationSwitch = React.memo(() => {
  const lang = useLanguage();
  const noAnimationForSolarPanelSimulation = useStore(Selector.world.noAnimationForSolarPanelSimulation);

  return (
    <MenuItem noPadding stayAfterClick>
      <Space style={{ width: '280px' }}>{i18n.t('menu.solarPanel.SolarPanelSimulationNoAnimation', lang) + ':'}</Space>
      <Switch
        checked={noAnimationForSolarPanelSimulation}
        onChange={(checked) => {
          useStore.getState().set((state) => {
            state.world.noAnimationForSolarPanelSimulation = checked;
          });
        }}
      />
    </MenuItem>
  );
});
