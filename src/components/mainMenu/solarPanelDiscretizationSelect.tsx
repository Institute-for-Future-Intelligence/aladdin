/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Select, Space } from 'antd';
import { MenuItem } from '../contextMenu/menuItems';
import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import { Discretization } from 'src/types';
import * as Selector from '../../stores/selector';
import { useLanguage } from 'src/hooks';
import React from 'react';

const { Option } = Select;

export const SolarPanelDiscretizationSelect = React.memo(() => {
  const lang = useLanguage();
  const discretization = useStore(Selector.world.discretization);

  return (
    <MenuItem noPadding stayAfterClick>
      <Space style={{ width: '150px' }}>{i18n.t('menu.solarPanel.PanelDiscretization', lang) + ':'}</Space>
      <Select
        style={{ width: '165px' }}
        value={discretization ?? Discretization.APPROXIMATE}
        onChange={(value) => {
          useStore.getState().set((state) => {
            state.world.discretization = value;
          });
        }}
      >
        <Option key={Discretization.EXACT} value={Discretization.EXACT}>
          {i18n.t('menu.solarPanel.Exact', lang)}
        </Option>
        <Option key={Discretization.APPROXIMATE} value={Discretization.APPROXIMATE}>
          {i18n.t('menu.solarPanel.Approximate', lang)}
        </Option>
      </Select>
    </MenuItem>
  );
});
