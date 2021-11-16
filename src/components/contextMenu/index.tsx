/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Dropdown, Menu } from 'antd';
import { useStore } from '../../stores/common';
import * as Selector from '../../stores/selector';
import { ObjectType } from '../../types';
import {
  CuboidMenu,
  FoundationMenu,
  GroundMenu,
  HumanMenu,
  SensorMenu,
  SkyMenu,
  SolarPanelMenu,
  TreeMenu,
  WallMenu,
  WindowMenu,
} from './elementMenu';

export interface ContextMenuProps {
  [key: string]: any;
}

const DropdownContextMenu: React.FC<ContextMenuProps> = ({ children }) => {
  const contextMenuObjectType = useStore(Selector.contextMenuObjectType);

  const contextMenu = () => {
    switch (contextMenuObjectType) {
      case ObjectType.Ground:
        return (
          <Menu>
            <GroundMenu />
          </Menu>
        );
      case ObjectType.Sky:
        return (
          <Menu>
            <SkyMenu />
          </Menu>
        );
      case ObjectType.Foundation:
        return (
          <Menu>
            <FoundationMenu />
          </Menu>
        );
      case ObjectType.Cuboid:
        return (
          <Menu>
            <CuboidMenu />
          </Menu>
        );
      case ObjectType.SolarPanel:
        return (
          <Menu>
            <SolarPanelMenu />
          </Menu>
        );
      case ObjectType.Sensor:
        return (
          <Menu>
            <SensorMenu />
          </Menu>
        );
      case ObjectType.Human:
        return (
          <Menu>
            <HumanMenu />
          </Menu>
        );
      case ObjectType.Tree:
        return (
          <Menu>
            <TreeMenu />
          </Menu>
        );
      case ObjectType.Wall:
        return (
          <Menu>
            <WallMenu />
          </Menu>
        );
      case ObjectType.Window:
        return (
          <Menu>
            <WindowMenu />
          </Menu>
        );
      default:
        return <></>;
    }
  };

  return (
    <Dropdown key={'canvas-context-menu'} trigger={['contextMenu']} overlay={contextMenu()}>
      {children}
    </Dropdown>
  );
};

export default React.memo(DropdownContextMenu);
