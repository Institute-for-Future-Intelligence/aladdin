/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useRef } from 'react';
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
  createWindTurbineMenu,
} from './elementMenu';
import { useSelectedElement } from './elementMenu/menuHooks';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { ElementModel } from 'src/models/ElementModel';
import './style.css';
export interface ContextMenuProps {
  [key: string]: any;
}

const useContextMenu = () => {
  const contextMenuObjectType = useStore(Selector.contextMenuObjectType);
  const selectedElement = useSelectedElement();

  const ctxRef = useRef(contextMenuObjectType);
  const elRef = useRef(selectedElement);

  // dropdown menu fades out about 0.2s, so we have to preserve the state util the menu is fully disappeared.
  if (contextMenuObjectType !== null) {
    ctxRef.current = contextMenuObjectType;
    elRef.current = selectedElement;
  } else {
    setTimeout(() => {
      ctxRef.current = contextMenuObjectType;
      elRef.current = contextMenuObjectType === null ? undefined : selectedElement;
    }, 200);
  }

  return [ctxRef.current, elRef.current] as [ObjectType | null, ElementModel | undefined];
};

const DropdownContextMenu: React.FC<ContextMenuProps> = ({ children }) => {
  usePrimitiveStore((state) => state.contextMenuFlag);

  const [contextMenuObjectType, selectedElement] = useContextMenu();

  const createMenu = () => {
    if (!selectedElement) {
      if (contextMenuObjectType === ObjectType.Ground) return createGroundMenu();
      if (contextMenuObjectType === ObjectType.Sky) return createSkyMenu();
      return { items: [] };
    }
    switch (contextMenuObjectType) {
      case ObjectType.Foundation:
        return createFoundationMenu(selectedElement);
      case ObjectType.Cuboid:
        return createCuboidMenu(selectedElement);
      case ObjectType.Wall:
        return createWallMenu(selectedElement);
      case ObjectType.Roof:
        return createRoofMenu(selectedElement);
      case ObjectType.SolarPanel:
        return createSolarPanelMenu(selectedElement);
      case ObjectType.Window:
        return createWindowMenu(selectedElement);
      case ObjectType.Door:
        return createDoorMenu(selectedElement);
      case ObjectType.Sensor:
        return createSensorMenu(selectedElement);
      case ObjectType.Light:
        return createLightMenu(selectedElement);
      case ObjectType.Human:
        return createHumanMenu(selectedElement);
      case ObjectType.Tree:
        return createTreeMenu(selectedElement);
      case ObjectType.Flower:
        return createFlowerMenu(selectedElement);
      case ObjectType.ParabolicTrough:
        return createParabolicTroughMenu(selectedElement);
      case ObjectType.ParabolicDish:
        return createParabolicDishMenu(selectedElement);
      case ObjectType.FresnelReflector:
        return createFresnelReflectorMenu(selectedElement);
      case ObjectType.Heliostat:
        return createHeliostatMenu(selectedElement);
      case ObjectType.Polygon:
        return createPolygonMenu(selectedElement);
      case ObjectType.PolygonVertex:
        return createPolygonVertexMenu(selectedElement);
      case ObjectType.WindTurbine:
        return createWindTurbineMenu(selectedElement);
      default:
        return { items: [] };
    }
  };

  return (
    <Dropdown trigger={['contextMenu']} menu={createMenu()} overlayClassName="my-overlay">
      {children}
    </Dropdown>
  );
};

export default React.memo(DropdownContextMenu);
