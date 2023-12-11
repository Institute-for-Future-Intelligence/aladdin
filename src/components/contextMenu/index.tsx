/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Dropdown } from 'antd';
import { useStore } from '../../stores/common';
import * as Selector from '../../stores/selector';
import { ObjectType } from '../../types';
import {
  createGroundMenu,
  createSkyMenu,
  createFoundationMenu,
  createCuboidMenu,
  createWallMenu,
  createRoofMenu,
  createSolarPanelMenu,
  createWindowMenu,
  createDoorMenu,
  createSensorMenu,
  createLightMenu,
  createHumanMenu,
  createTreeMenu,
  createFlowerMenu,
  createParabolicTroughMenu,
  createParabolicDishMenu,
  createFresnelReflectorMenu,
  createHeliostatMenu,
  createPolygonMenu,
  createPolygonVertexMenu,
} from './elementMenu';
import { WindTurbineMenu } from './elementMenu/windTurbineMenu';
import { useSelectedElement } from './elementMenu/menuHooks';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';

export interface ContextMenuProps {
  [key: string]: any;
}

const DropdownContextMenu: React.FC<ContextMenuProps> = ({ children }) => {
  useStore((state) => state.elements.length);
  useStore((state) => state.viewState.groundImage);
  usePrimitiveStore((state) => state.contextMenuFlag);
  const selectedElement = useSelectedElement();
  const contextMenuObjectType = useStore(Selector.contextMenuObjectType);

  const [_, update] = useState(false);

  // use ref to avoid object type to be null, which is not acceptted by antd menu
  const objectTypeRef = useRef(contextMenuObjectType);
  if (contextMenuObjectType !== null) {
    objectTypeRef.current = contextMenuObjectType;
  }

  const elementRef = useRef(selectedElement);
  if (selectedElement !== undefined) {
    elementRef.current = selectedElement;
  }

  const updateMenu = () => update((b) => !b);

  const createMenu = () => {
    if (objectTypeRef.current === null || elementRef.current === undefined) return { items: [] };
    switch (objectTypeRef.current) {
      case ObjectType.Ground:
        return createGroundMenu(updateMenu);
      case ObjectType.Sky:
        return createSkyMenu();
      case ObjectType.Foundation:
        return createFoundationMenu(elementRef.current);
      case ObjectType.Cuboid:
        return createCuboidMenu(elementRef.current);
      case ObjectType.Wall:
        return createWallMenu(elementRef.current);
      case ObjectType.Roof:
        return createRoofMenu(elementRef.current);
      case ObjectType.SolarPanel:
        return createSolarPanelMenu(elementRef.current);
      case ObjectType.Window:
        return createWindowMenu(elementRef.current);
      case ObjectType.Door:
        return createDoorMenu(elementRef.current);
      case ObjectType.Sensor:
        return createSensorMenu(elementRef.current);
      case ObjectType.Light:
        return createLightMenu(elementRef.current);
      case ObjectType.Human:
        return createHumanMenu(elementRef.current);
      case ObjectType.Tree:
        return createTreeMenu(elementRef.current);
      case ObjectType.Flower:
        return createFlowerMenu(elementRef.current);
      case ObjectType.ParabolicTrough:
        return createParabolicTroughMenu(elementRef.current);
      case ObjectType.ParabolicDish:
        return createParabolicDishMenu(elementRef.current);
      case ObjectType.FresnelReflector:
        return createFresnelReflectorMenu(elementRef.current);
      case ObjectType.Heliostat:
        return createHeliostatMenu(elementRef.current);
      case ObjectType.Polygon:
        return createPolygonMenu(elementRef.current);
      case ObjectType.PolygonVertex:
        return createPolygonVertexMenu(elementRef.current);

      // case ObjectType.WindTurbine:
      //   return (
      //     <Menu triggerSubMenuAction={'click'}>
      //       <WindTurbineMenu />
      //     </Menu>
      //   );
      default:
        return { items: [] };
    }
  };

  return (
    <Dropdown trigger={['contextMenu']} menu={createMenu()}>
      {children}
    </Dropdown>
  );
};

export default React.memo(DropdownContextMenu);
