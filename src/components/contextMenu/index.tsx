/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { ReactNode, useState } from 'react';
import { useStore } from '../../stores/common';
import { ObjectType } from '../../types';
import SolarWaterHeaterMenu from './elementMenu/solarWaterHeaterMenu/solarWaterHeaterMenu';
import BatteryStorageMenu from './elementMenu/batteryStorageMenu/batteryStorageMenu';
import RulerMenu from './elementMenu/rulerMenu/rulerMenu';
import ProtractorMenu from './elementMenu/protractorMenu/protractorMenu';
import { ControlledMenu } from '@szhsin/react-menu';
import GroundMenu from './elementMenu/groundMenu/groundMenu';
import './style.css';
import SkyMenu from './elementMenu/skyMenu/skyMenu';
import FoundationMenu from './elementMenu/foundationMenu/foundationMenu';
import SensorMenu from './elementMenu/sensorMenu/sensorMenu';
import LightMenu from './elementMenu/lightMenu/lightMenu';
import HumanMenu from './elementMenu/billboardMenu/humanMenu';
import TreeMenu from './elementMenu/billboardMenu/treeMenu';
import FlowerMenu from './elementMenu/billboardMenu/flowerMenu';
import CuboidMenu from './elementMenu/cuboidMenu/cuboidMenu';
import WallMenu from './elementMenu/wallMenu/wallMenu';
import WindowMenu from './elementMenu/windowMenu/windowMenu';
import DoorMenu from './elementMenu/doorMenu/doorMenu';
import RoofMenu from './elementMenu/roofMenu/roofMenu';
import SolarPanelMenu from './elementMenu/solarPanelMenu/solarPanelMenu';
import ParabolicTroughMenu from './elementMenu/parabolicTroughMenu/parabolicTroughMenu';
import ParabolicDishMenu from './elementMenu/parabolicDishMenu/parabolicDishMenu';
import FresnelReflectorMenu from './elementMenu/fresnelReflectorMenu/fresnelReflectorMenu';
import HeliostatMenu from './elementMenu/heliostatMenu/heliostatMenu';
import WindTurbineMenu from './elementMenu/windTurbineMenu/windTurbineMenu';
import PolygonMenu from './elementMenu/polygonMenu/polygonMenu';
import PolygonVertexMenu from './elementMenu/polygonVertexMenu';

export interface ContextMenuProps {
  [key: string]: any;
}

const DropdownContextMenu = ({ children }: { children: ReactNode }) => {
  const [isOpen, setOpen] = useState(false);
  const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });

  const menus = () => {
    const objectType = useStore.getState().contextMenuObjectType;
    switch (objectType) {
      case ObjectType.Ground:
        return <GroundMenu />;
      case ObjectType.Sky:
        return <SkyMenu />;
      case ObjectType.Cuboid:
        return <CuboidMenu />;
      case ObjectType.Foundation:
        return <FoundationMenu />;
      case ObjectType.Wall:
        return <WallMenu />;
      case ObjectType.Roof:
        return <RoofMenu />;
      case ObjectType.Window:
        return <WindowMenu />;
      case ObjectType.Door:
        return <DoorMenu />;
      case ObjectType.SolarPanel:
        return <SolarPanelMenu />;
      case ObjectType.SolarWaterHeater:
        return <SolarWaterHeaterMenu />;
      case ObjectType.BatteryStorage:
        return <BatteryStorageMenu />;
      case ObjectType.ParabolicTrough:
        return <ParabolicTroughMenu />;
      case ObjectType.ParabolicDish:
        return <ParabolicDishMenu />;
      case ObjectType.FresnelReflector:
        return <FresnelReflectorMenu />;
      case ObjectType.Heliostat:
        return <HeliostatMenu />;
      case ObjectType.WindTurbine:
        return <WindTurbineMenu />;
      case ObjectType.Polygon:
        return <PolygonMenu />;
      case ObjectType.PolygonVertex:
        return <PolygonVertexMenu />;
      case ObjectType.Human:
        return <HumanMenu />;
      case ObjectType.Tree:
        return <TreeMenu />;
      case ObjectType.Flower:
        return <FlowerMenu />;
      case ObjectType.Sensor:
        return <SensorMenu />;
      case ObjectType.Light:
        return <LightMenu />;
      case ObjectType.Protractor:
        return <ProtractorMenu />;
      case ObjectType.Ruler:
        return <RulerMenu />;
    }
  };

  return (
    <div
      onContextMenu={(e) => {
        if (typeof document.hasFocus === 'function' && !document.hasFocus()) return;

        e.preventDefault();
        setAnchorPoint({ x: e.clientX, y: e.clientY });
        setOpen(true);
      }}
    >
      {children}
      <ControlledMenu
        anchorPoint={anchorPoint}
        state={isOpen ? 'open' : 'closed'}
        onClose={() => {
          setOpen(false);
        }}
        menuStyle={{ fontSize: '14px', minWidth: '4rem', borderRadius: '0.35rem' }}
      >
        {menus()}
      </ControlledMenu>
    </div>
  );
};

export default React.memo(DropdownContextMenu);
