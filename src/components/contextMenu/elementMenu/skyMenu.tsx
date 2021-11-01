/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Checkbox, Menu, Radio } from 'antd';
import SubMenu from 'antd/lib/menu/SubMenu';
import { useStore } from 'src/stores/common';
import { Theme } from 'src/types';
import i18n from '../../../i18n';

export const SkyMenu = () => {
  const setCommonStore = useStore((state) => state.set);
  const axes = useStore((state) => state.viewState.axes);
  const theme = useStore((state) => state.viewState.theme);
  const language = useStore((state) => state.language);
  const lang = { lng: language };

  const radioStyle = {
    display: 'block',
    height: '30px',
    paddingLeft: '10px',
    lineHeight: '30px',
  };

  return (
    <>
      <Menu.Item key={'axes'}>
        <Checkbox
          checked={axes}
          onChange={(e) => {
            setCommonStore((state) => {
              state.viewState.axes = e.target.checked;
            });
          }}
        >
          {i18n.t('skyMenu.Axes', lang)}
        </Checkbox>
      </Menu.Item>
      <SubMenu key={'theme'} title={i18n.t('skyMenu.Theme', lang)} style={{ paddingLeft: '24px' }}>
        <Radio.Group
          value={theme}
          style={{ height: '135px' }}
          onChange={(e) => {
            setCommonStore((state) => {
              state.viewState.theme = e.target.value;
            });
          }}
        >
          <Radio style={radioStyle} value={Theme.Default}>
            {i18n.t('skyMenu.ThemeDefault', lang)}
          </Radio>
          <Radio style={radioStyle} value={Theme.Desert}>
            {i18n.t('skyMenu.ThemeDesert', lang)}
          </Radio>
          <Radio style={radioStyle} value={Theme.Forest}>
            {i18n.t('skyMenu.ThemeForest', lang)}
          </Radio>
          <Radio style={radioStyle} value={Theme.Grassland}>
            {i18n.t('skyMenu.ThemeGrassland', lang)}
          </Radio>
        </Radio.Group>
      </SubMenu>
    </>
  );
};
