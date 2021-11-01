/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Menu, Modal } from 'antd';
import { ColorPicker, Copy, Cut, Lock, Paste } from '../menuItems';
import SubMenu from 'antd/lib/menu/SubMenu';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import ReshapeElementMenu from 'src/components/reshapeElementMenu';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import i18n from '../../../i18n/i18n';

export const FoundationMenu = () => {
  const language = useStore((state) => state.language);
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const countAllChildElementsByType = useStore((state) => state.countAllChildElementsByType);
  const countAllChildSolarPanels = useStore((state) => state.countAllChildSolarPanels);
  const removeAllChildElementsByType = useStore((state) => state.removeAllChildElementsByType);

  const contextMenuObjectType = useStore((state) => state.contextMenuObjectType);
  const selectedElement = getSelectedElement();
  const sensorCountFoundation = selectedElement
    ? countAllChildElementsByType(selectedElement.id, ObjectType.Sensor)
    : 0;
  const solarRackCountFoundation = selectedElement
    ? countAllChildElementsByType(selectedElement.id, ObjectType.SolarPanel)
    : 0;
  const solarPanelCountFoundation = selectedElement ? countAllChildSolarPanels(selectedElement.id) : 0;
  const lang = { lng: language };

  return (
    <Menu.ItemGroup>
      <Paste />
      <Copy />
      <Cut />
      <Lock />
      {(sensorCountFoundation > 0 || solarPanelCountFoundation > 0) && contextMenuObjectType && (
        <SubMenu key={'clear'} title={i18n.t('word.Clear', lang)} style={{ paddingLeft: '24px' }}>
          {sensorCountFoundation > 0 && (
            <Menu.Item
              key={'remove-all-sensors-on-foundation'}
              onClick={() => {
                Modal.confirm({
                  title:
                    'Do you really want to remove all the ' + sensorCountFoundation + ' sensors on this foundation?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (selectedElement) {
                      removeAllChildElementsByType(selectedElement.id, ObjectType.Sensor);
                    }
                  },
                });
              }}
            >
              {i18n.t('foundationMenu.RemoveAllSensors', lang)} ({sensorCountFoundation})
            </Menu.Item>
          )}
          {solarPanelCountFoundation > 0 && (
            <Menu.Item
              key={'remove-all-solar-panels-on-foundation'}
              onClick={() => {
                Modal.confirm({
                  title:
                    'Do you really want to remove all the ' +
                    solarPanelCountFoundation +
                    ' solar panels mounted on ' +
                    solarRackCountFoundation +
                    ' racks on this foundation?',
                  icon: <ExclamationCircleOutlined />,
                  onOk: () => {
                    if (selectedElement) {
                      removeAllChildElementsByType(selectedElement.id, ObjectType.SolarPanel);
                    }
                  },
                });
              }}
            >
              {i18n.t('foundationMenu.RemoveAllSolarPanels', lang)}&nbsp; ({solarPanelCountFoundation},{' '}
              {solarRackCountFoundation} {i18n.t('foundationMenu.Racks', lang)})
            </Menu.Item>
          )}
        </SubMenu>
      )}
      <ColorPicker />
      {selectedElement && contextMenuObjectType && (
        <ReshapeElementMenu elementId={selectedElement.id} name={'foundation'} style={{ paddingLeft: '20px' }} />
      )}
    </Menu.ItemGroup>
  );
};
