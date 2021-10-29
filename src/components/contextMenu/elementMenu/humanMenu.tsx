/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Menu, Space } from 'antd';
import HumanSelection from 'src/components/humanSelection';
import { Copy, Cut, Lock } from '../menuItems';

export const HumanMenu = () => {
  return (
    <>
      <Copy />
      <Cut />
      <Lock />
      <Menu>
        <Menu.Item key={'human-change-person'} style={{ paddingLeft: '40px' }}>
          <Space style={{ width: '120px' }}>Change Person: </Space>
          <HumanSelection key={'humans'} />
        </Menu.Item>
      </Menu>
    </>
  );
};
