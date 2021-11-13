/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Menu, Space } from 'antd';
import HumanSelection from './humanSelection';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';

export const HumanMenu = () => {
  const language = useStore(Selector.language);
  return (
    <>
      <Copy />
      <Cut />
      <Lock />
      <Menu>
        <Menu.Item key={'human-change-person'} style={{ paddingLeft: '36px' }}>
          <Space style={{ width: '120px' }}>{i18n.t('peopleMenu.ChangePerson', { lng: language })}: </Space>
          <HumanSelection key={'humans'} />
        </Menu.Item>
      </Menu>
    </>
  );
};
