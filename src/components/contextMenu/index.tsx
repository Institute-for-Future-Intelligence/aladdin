/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
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
  PolygonMenu,
  PolygonVertexMenu,
  SensorMenu,
  SkyMenu,
  SolarPanelMenu,
  ParabolicTroughMenu,
  ParabolicDishMenu,
  TreeMenu,
  WallMenu,
  WindowMenu,
  FresnelReflectorMenu,
  HeliostatMenu,
  RoofMenu,
} from './elementMenu';
import { DoorMenu } from './elementMenu/doorMenu';
import { FlowerMenu } from './elementMenu/flowerMenu';

export interface ContextMenuProps {
  [key: string]: any;
}

const DropdownContextMenu: React.FC<ContextMenuProps> = ({ children }) => {
  const contextMenuObjectType = useStore(Selector.contextMenuObjectType);

  const contextMenu = () => {
    switch (contextMenuObjectType) {
      case ObjectType.Ground:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <GroundMenu />
          </Menu>
        );
      case ObjectType.Sky:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <SkyMenu />
          </Menu>
        );
      case ObjectType.Foundation:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <FoundationMenu />
          </Menu>
        );
      case ObjectType.Cuboid:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <CuboidMenu />
          </Menu>
        );
      case ObjectType.Polygon:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <PolygonMenu />
          </Menu>
        );
      case ObjectType.PolygonVertex:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <PolygonVertexMenu />
          </Menu>
        );
      case ObjectType.SolarPanel:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <SolarPanelMenu />
          </Menu>
        );
      case ObjectType.ParabolicTrough:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <ParabolicTroughMenu />
          </Menu>
        );
      case ObjectType.ParabolicDish:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <ParabolicDishMenu />
          </Menu>
        );
      case ObjectType.FresnelReflector:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <FresnelReflectorMenu />
          </Menu>
        );
      case ObjectType.Heliostat:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <HeliostatMenu />
          </Menu>
        );
      case ObjectType.Sensor:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <SensorMenu />
          </Menu>
        );
      case ObjectType.Human:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <HumanMenu />
          </Menu>
        );
      case ObjectType.Tree:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <TreeMenu />
          </Menu>
        );
      case ObjectType.Flower:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <FlowerMenu />
          </Menu>
        );
      case ObjectType.Wall:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <WallMenu />
          </Menu>
        );
      case ObjectType.Window:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <WindowMenu />
          </Menu>
        );
      case ObjectType.Roof:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <RoofMenu />
          </Menu>
        );
      case ObjectType.Door:
        return (
          <Menu triggerSubMenuAction={'click'}>
            <DoorMenu />
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
