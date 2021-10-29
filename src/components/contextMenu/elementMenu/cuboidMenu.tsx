/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Menu, Modal } from 'antd';
import { ColorPicker, Copy, Cut, Lock, Paste } from '../menuItems';
import SubMenu from 'antd/lib/menu/SubMenu';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import ReshapeElementMenu from 'src/components/reshapeElementMenu';

export const CuboidMenu = () => {
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const selectedElement = getSelectedElement();
  const countAllChildElementsByType = useStore((state) => state.countAllChildElementsByType);
  const removeAllChildElementsByType = useStore((state) => state.removeAllChildElementsByType);
  const contextMenuObjectType = useStore((state) => state.contextMenuObjectType);

  const sensorCountCuboid = selectedElement ? countAllChildElementsByType(selectedElement.id, ObjectType.Sensor) : 0;

  return (
    <Menu.ItemGroup>
      <Paste />
      <Copy />
      <Cut />
      <Lock />
      <ColorPicker />
      {sensorCountCuboid > 0 && contextMenuObjectType && (
        <SubMenu key={'clear'} title={'Clear'} style={{ paddingLeft: '24px' }}>
          {sensorCountCuboid > 0 && (
            <Menu.Item
              key={'remove-all-sensors'}
              onClick={() => {
                Modal.confirm({
                  title: 'Do you really want to remove all the ' + sensorCountCuboid + ' sensors on this cuboid?',
                  icon: <ExclamationCircleOutlined />,
                  okText: 'OK',
                  cancelText: 'Cancel',
                  onOk: () => {
                    if (selectedElement) {
                      removeAllChildElementsByType(selectedElement.id, ObjectType.Sensor);
                    }
                  },
                });
              }}
            >
              Remove All {sensorCountCuboid} Sensors
            </Menu.Item>
          )}
        </SubMenu>
      )}
      {selectedElement && contextMenuObjectType && (
        <ReshapeElementMenu elementId={selectedElement.id} name={'cuboid'} style={{ paddingLeft: '24px' }} />
      )}
    </Menu.ItemGroup>
  );
};
