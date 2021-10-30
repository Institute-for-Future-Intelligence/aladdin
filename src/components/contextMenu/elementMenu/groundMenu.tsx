/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Checkbox, InputNumber, Menu, Modal, Space } from 'antd';
import SubMenu from 'antd/lib/menu/SubMenu';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { CompactPicker } from 'react-color';

import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Paste } from '../menuItems';

export const GroundMenu = () => {
  const albedo = useStore((state) => state.world.ground.albedo);
  const groundColor = useStore((state) => state.viewState.groundColor);
  const setCommonStore = useStore((state) => state.set);
  const countElementsByType = useStore((state) => state.countElementsByType);
  const removeElementsByType = useStore((state) => state.removeElementsByType);

  const groundImage = useStore((state) => state.viewState.groundImage);
  const treeCount = countElementsByType(ObjectType.Tree);
  const humanCount = countElementsByType(ObjectType.Human);

  return (
    <>
      <Paste />
      {humanCount > 0 && (
        <Menu.Item
          style={{ paddingLeft: '36px' }}
          key={'ground-remove-all-humans'}
          onClick={() => {
            Modal.confirm({
              title: 'Do you really want to remove all ' + humanCount + ' people?',
              icon: <ExclamationCircleOutlined />,
              okText: 'OK',
              cancelText: 'Cancel',
              onOk: () => {
                removeElementsByType(ObjectType.Human);
              },
            });
          }}
        >
          Remove All {humanCount} People
        </Menu.Item>
      )}
      {treeCount > 0 && (
        <Menu.Item
          style={{ paddingLeft: '36px' }}
          key={'ground-remove-all-trees'}
          onClick={() => {
            Modal.confirm({
              title: 'Do you really want to remove all ' + treeCount + ' trees?',
              icon: <ExclamationCircleOutlined />,
              okText: 'OK',
              cancelText: 'Cancel',
              onOk: () => {
                removeElementsByType(ObjectType.Tree);
              },
            });
          }}
        >
          Remove All {treeCount} Trees
        </Menu.Item>
      )}
      <Menu>
        <Menu.Item style={{ paddingLeft: '36px' }} key={'ground-albedo'}>
          <Space style={{ width: '60px' }}>Albedo:</Space>
          <InputNumber
            min={0.05}
            max={1}
            step={0.01}
            precision={2}
            value={albedo}
            onChange={(value) => {
              if (value) {
                setCommonStore((state) => {
                  state.world.ground.albedo = value;
                });
              }
            }}
          />
        </Menu.Item>
      </Menu>
      <Menu.Item key={'image-on-ground'}>
        <Checkbox
          checked={groundImage}
          onChange={(e) => {
            setCommonStore((state) => {
              state.viewState.groundImage = e.target.checked;
            });
          }}
        >
          Image on Ground
        </Checkbox>
      </Menu.Item>
      <SubMenu key={'ground-color'} title={'Color'} style={{ paddingLeft: '24px' }}>
        <CompactPicker
          color={groundColor}
          onChangeComplete={(colorResult) => {
            setCommonStore((state) => {
              state.viewState.groundColor = colorResult.hex;
            });
          }}
        />
      </SubMenu>
    </>
  );
};
