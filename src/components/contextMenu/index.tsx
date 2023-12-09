/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Dropdown } from 'antd';
import { useStore } from '../../stores/common';
import * as Selector from '../../stores/selector';
import { ObjectType } from '../../types';
import {
  HumanMenu,
  FlowerMenu,
  PolygonMenu,
  PolygonVertexMenu,
  ParabolicTroughMenu,
  ParabolicDishMenu,
  TreeMenu,
  FresnelReflectorMenu,
  HeliostatMenu,
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

  // const contextMenu = () => {
  //   switch (contextMenuObjectType) {
  //     case ObjectType.Ground:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <GroundMenu />
  //         </Menu>
  //       );
  //     case ObjectType.Sky:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <SkyMenu />
  //         </Menu>
  //       );
  //     case ObjectType.Foundation:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <FoundationMenu />
  //         </Menu>
  //       );
  //     case ObjectType.Cuboid:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <CuboidMenu />
  //         </Menu>
  //       );
  //     case ObjectType.Polygon:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <PolygonMenu />
  //         </Menu>
  //       );
  //     case ObjectType.PolygonVertex:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <PolygonVertexMenu />
  //         </Menu>
  //       );
  //     case ObjectType.SolarPanel:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <SolarPanelMenu />
  //         </Menu>
  //       );
  //     case ObjectType.ParabolicTrough:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <ParabolicTroughMenu />
  //         </Menu>
  //       );
  //     case ObjectType.ParabolicDish:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <ParabolicDishMenu />
  //         </Menu>
  //       );
  //     case ObjectType.FresnelReflector:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <FresnelReflectorMenu />
  //         </Menu>
  //       );
  //     case ObjectType.Heliostat:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <HeliostatMenu />
  //         </Menu>
  //       );
  //     case ObjectType.WindTurbine:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <WindTurbineMenu />
  //         </Menu>
  //       );
  //     case ObjectType.Sensor:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <SensorMenu />
  //         </Menu>
  //       );
  //     case ObjectType.Light:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <LightMenu />
  //         </Menu>
  //       );
  //     case ObjectType.Human:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <HumanMenu />
  //         </Menu>
  //       );
  //     case ObjectType.Tree:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <TreeMenu />
  //         </Menu>
  //       );
  //     case ObjectType.Flower:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <FlowerMenu />
  //         </Menu>
  //       );
  //     case ObjectType.Wall:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <WallMenu />
  //         </Menu>
  //       );
  //     case ObjectType.Window:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <WindowMenu />
  //         </Menu>
  //       );
  //     case ObjectType.Roof:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <RoofMenu />
  //         </Menu>
  //       );
  //     case ObjectType.Door:
  //       return (
  //         <Menu triggerSubMenuAction={'click'}>
  //           <DoorMenu />
  //         </Menu>
  //       );
  //     default:
  //       return <></>;
  //   }
  // };

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
      // case ObjectType.Polygon:
      //   return (
      //     <Menu triggerSubMenuAction={'click'}>
      //       <PolygonMenu />
      //     </Menu>
      //   );
      // case ObjectType.PolygonVertex:
      //   return (
      //     <Menu triggerSubMenuAction={'click'}>
      //       <PolygonVertexMenu />
      //     </Menu>
      //   );

      // case ObjectType.ParabolicTrough:
      //   return (
      //     <Menu triggerSubMenuAction={'click'}>
      //       <ParabolicTroughMenu />
      //     </Menu>
      //   );
      // case ObjectType.ParabolicDish:
      //   return (
      //     <Menu triggerSubMenuAction={'click'}>
      //       <ParabolicDishMenu />
      //     </Menu>
      //   );
      // case ObjectType.FresnelReflector:
      //   return (
      //     <Menu triggerSubMenuAction={'click'}>
      //       <FresnelReflectorMenu />
      //     </Menu>
      //   );
      // case ObjectType.Heliostat:
      //   return (
      //     <Menu triggerSubMenuAction={'click'}>
      //       <HeliostatMenu />
      //     </Menu>
      //   );
      // case ObjectType.WindTurbine:
      //   return (
      //     <Menu triggerSubMenuAction={'click'}>
      //       <WindTurbineMenu />
      //     </Menu>
      //   );
      // case ObjectType.Human:
      //   return (
      //     <Menu triggerSubMenuAction={'click'}>
      //       <HumanMenu />
      //     </Menu>
      //   );
      // case ObjectType.Tree:
      //   return (
      //     <Menu triggerSubMenuAction={'click'}>
      //       <TreeMenu />
      //     </Menu>
      //   );
      // case ObjectType.Flower:
      //   return (
      //     <Menu triggerSubMenuAction={'click'}>
      //       <FlowerMenu />
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
