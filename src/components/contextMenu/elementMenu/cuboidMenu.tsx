/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Menu, Modal } from 'antd';
import { ColorPicker, Copy, Cut, Lock, Paste } from '../menuItems';
import SubMenu from 'antd/lib/menu/SubMenu';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useStore } from 'src/stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType } from 'src/types';
import ReshapeElementMenu from 'src/components/reshapeElementMenu';
import i18n from '../../../i18n/i18n';

export const CuboidMenu = () => {
  const language = useStore(Selector.language);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const selectedElement = getSelectedElement();
  const countAllChildElementsByType = useStore(Selector.countAllChildElementsByType);
  const countAllChildSolarPanels = useStore(Selector.countAllChildSolarPanels);
  const removeAllChildElementsByType = useStore(Selector.removeAllChildElementsByType);
  const contextMenuObjectType = useStore(Selector.contextMenuObjectType);

  const sensorCountCuboid = selectedElement ? countAllChildElementsByType(selectedElement.id, ObjectType.Sensor) : 0;
  const solarRackCountCuboid = selectedElement
    ? countAllChildElementsByType(selectedElement.id, ObjectType.SolarPanel)
    : 0;
  const solarPanelCountCuboid = selectedElement ? countAllChildSolarPanels(selectedElement.id) : 0;
  const lang = { lng: language };

  return (
    <Menu.ItemGroup>
      <Paste />
      <Copy />
      <Cut />
      <Lock />
      <ColorPicker />
      {sensorCountCuboid > 0 && contextMenuObjectType && (
        <SubMenu key={'clear'} title={i18n.t('word.Clear', lang)} style={{ paddingLeft: '24px' }}>
          {sensorCountCuboid > 0 && (
            <Menu.Item
              key={'remove-all-sensors-on-cuboid'}
              onClick={() => {
                Modal.confirm({
                  title: 'Do you really want to remove all the ' + sensorCountCuboid + ' sensors on this cuboid?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (selectedElement) {
                      removeAllChildElementsByType(selectedElement.id, ObjectType.Sensor);
                    }
                  },
                });
              }}
            >
              {i18n.t('cuboidMenu.RemoveAllSensors', lang)} ({sensorCountCuboid})
            </Menu.Item>
          )}
          {solarPanelCountCuboid > 0 && (
            <Menu.Item
              key={'remove-all-solar-panels-on-cuboid'}
              onClick={() => {
                Modal.confirm({
                  title:
                    'Do you really want to remove all the ' +
                    solarPanelCountCuboid +
                    ' solar panels mounted on ' +
                    solarRackCountCuboid +
                    ' racks on this cuboid?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (selectedElement) {
                      removeAllChildElementsByType(selectedElement.id, ObjectType.SolarPanel);
                    }
                  },
                });
              }}
            >
              {i18n.t('cuboidMenu.RemoveAllSolarPanels', lang)}&nbsp; ({solarPanelCountCuboid}, {solarRackCountCuboid}{' '}
              {i18n.t('cuboidMenu.Racks', lang)})
            </Menu.Item>
          )}
        </SubMenu>
      )}
      {selectedElement && contextMenuObjectType && (
        <ReshapeElementMenu elementId={selectedElement.id} name={'cuboid'} style={{ paddingLeft: '20px' }} />
      )}
    </Menu.ItemGroup>
  );
};
