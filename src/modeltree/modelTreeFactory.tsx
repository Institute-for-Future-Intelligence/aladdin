/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import i18n from '../i18n/i18n';
import { InputNumber, Space, TreeDataNode } from 'antd';
import AzimuthInput from './azimuthInput';
import { createTooltip, getCoordinates, getDimension, i18nType } from './modelTreeUtils';
import React from 'react';
import { BatteryStorageModel } from '../models/BatteryStorageModel';
import { ParabolicDishModel } from '../models/ParabolicDishModel';
import SizeInput from './sizeInput';
import LatusRectumInput from './latusRectumInput';
import PoleHeightInput from './poleHeightInput';
import ReflectanceInput from './reflectanceInput';
import AbsorptanceInput from './absorptanceInput';
import { useStore } from '../stores/common';
import { ParabolicTroughModel } from '../models/ParabolicTroughModel';
import ModuleLengthInput from './moduleLengthInput';
import { HeliostatModel } from '../models/HeliostatModel';
import { FresnelReflectorModel } from '../models/FresnelReflectorModel';
import { WindTurbineModel } from '../models/WindTurbineModel';
import { TreeModel } from '../models/TreeModel';
import TreeSelection from '../components/contextMenu/elementMenu/billboardMenu/treeSelection';
import { FlowerModel } from '../models/FlowerModel';
import FlowerSelection from '../components/contextMenu/elementMenu/billboardMenu/flowerSelection';
import { HumanModel } from '../models/HumanModel';
import HumanSelection from '../components/contextMenu/elementMenu/billboardMenu/humanSelection';
import { PolygonModel } from '../models/PolygonModel';
import { SolarPanelModel } from '../models/SolarPanelModel';
import SolarPanelModelSelection from './solarPanelModelSelection';
import SolarPanelOrientationSelect from './solarPanelOrientationSelect';
import SolarPanelLengthInput from './solarPanelLengthInput';
import SolarPanelWidthInput from './solarPanelWidthInput';
import SolarPanelTiltAngleInput from './solarPanelTiltAngleInput';
import SolarPanelTrackerSelection from './solarPanelTrackerSelection';
import { WallModel } from '../models/WallModel';
import { WindowModel } from '../models/WindowModel';
import { DoorModel } from '../models/DoorModel';
import { SensorModel } from '../models/SensorModel';
import { LightModel } from '../models/LightModel';
import UValueInput from './uValueInput';
import HeatCapacityInput from './heatCapacityInput';
import ColorInput from './colorInput';
import ShgcInput from './shgcInput';
import TintInput from './tintInput';
import LabelInput from './labelInput';
import { ObjectType } from '../types';
import RValueInput from './rValueInput';
import { SolarWaterHeaterModel } from '../models/SolarWaterHeaterModel';
import { RoofModel } from '../models/RoofModel';
import WallTextureInput from './wallTextureInput';
import RoofTextureInput from './roofTextureInput';
import PolygonTextureInput from './polygonTextureInput';
import { ColorType } from '../constants';
import LineWidthInput from './lineWidthInput';
import LineStyleInput from './lineStyleInput';
import {
  PolygonFillCheckbox,
  PolygonOutlineCheckbox,
} from '../components/contextMenu/elementMenu/polygonMenu/polygonMenuItems';
import OpacityInput from './opacityInput';
import BatteryIdInput from './batteryIdInput';
import ChargingEfficiencyInput from './chargingEfficiencyInput';
import DischargingEfficiencyInput from './dischargingEfficiencyInput';
import RoofSideColorInput from './roofSideColorInput';
import WindowTypeInput from './windowTypeInput';
import SolarPanelBatterySelect from './solarPanelBatterySelect';
import SolarPanelFrameColorInput from './solarPanelFrameColorInput';
import { SolarCollectorSunBeamCheckbox } from '../components/contextMenu/menuItems';
import ReflectorOpticalEfficiencyInput from './reflectorOpticalEfficiencyInput';
import ReceiverThermalEfficiencyInput from './receiverThermalEfficiencyInput';
import HeliostatTowerSelect from './heliostatTowerSelect';
import FresnelReceiverSelect from './fresnelReceiverSelect';
import {
  BillboardFlipCheckbox,
  HumanObserverCheckbox,
  TreeShowModelCheckbox,
} from '../components/contextMenu/elementMenu/billboardMenu/billboardMenuItems';
import DoorTextureInput from './doorTextureInput';
import DoorTypeInput from './doorTypeInput';

export const createRoofNode = (roof: RoofModel) => {
  const lang = { lng: useStore.getState().language };
  const node: TreeDataNode[] = [];
  const roofChildren = useStore.getState().getChildren(roof.id);
  for (const c of roofChildren) {
    switch (c.type) {
      case ObjectType.Window: {
        node.push({
          checkable: true,
          title: createTooltip(c.id, i18n.t('modelTree.SkylightWindow', lang)),
          key: c.id,
          children: createWindowNode(c as WindowModel, true),
        });
        break;
      }
      case ObjectType.SolarPanel: {
        const solarPanelChildren: TreeDataNode[] = createSolarPanelNode(c as SolarPanelModel, true);
        node.push({
          checkable: true,
          title: createTooltip(
            c.id,
            i18n.t('modelTree.RooftopSolarPanels', lang) + (c.label ? ' (' + c.label + ')' : ''),
          ),
          key: c.id,
          children: solarPanelChildren,
        });
        break;
      }
      case ObjectType.SolarWaterHeater: {
        node.push({
          checkable: true,
          title: createTooltip(c.id, i18nType(c) + (c.label ? ' (' + c.label + ')' : '')),
          key: c.id,
          children: createSolarWaterHeaterNode(c as SolarWaterHeaterModel),
        });
        break;
      }
      case ObjectType.Sensor: {
        node.push({
          checkable: true,
          title: createTooltip(c.id, i18nType(c)),
          key: c.id,
          children: createSensorNode(c as SensorModel),
        });
        break;
      }
      case ObjectType.Light: {
        node.push({
          checkable: true,
          title: createTooltip(c.id, i18nType(c)),
          key: c.id,
          children: createLightNode(c as LightModel),
        });
        break;
      }
    }
  }
  node.push({
    checkable: false,
    title: <RValueInput element={roof as RoofModel} title={i18n.t('word.RValue', lang)} />,
    key: roof.id + ' R-value',
  });
  node.push({
    checkable: false,
    title: <HeatCapacityInput element={roof as RoofModel} />,
    key: roof.id + ' Heat Capacity',
  });
  node.push({
    checkable: false,
    title: (
      <Space>
        <span>{i18n.t('word.Thickness', lang)} : </span>
        <InputNumber
          value={(roof as RoofModel).thickness}
          precision={2}
          min={0.05}
          max={1}
          step={0.01}
          disabled={roof.locked}
          onChange={(value) => {
            if (value !== null) {
              useStore.getState().set((state) => {
                const el = state.elements.find((e) => e.id === roof.id);
                if (el) {
                  (el as RoofModel).thickness = value;
                }
              });
            }
          }}
        />
        {i18n.t('word.MeterAbbreviation', lang)}
      </Space>
    ),
    key: roof.id + ' Thickness',
  });
  node.push({
    checkable: false,
    title: (
      <Space>
        <span>{i18n.t('roofMenu.Rise', lang)} : </span>
        <InputNumber
          value={(roof as RoofModel).rise}
          precision={2}
          min={0}
          step={0.1}
          disabled={roof.locked}
          onChange={(value) => {
            if (value !== null) {
              useStore.getState().set((state) => {
                const el = state.elements.find((e) => e.id === roof.id);
                if (el) {
                  (el as RoofModel).rise = value;
                }
              });
            }
          }}
        />
        {i18n.t('word.MeterAbbreviation', lang)}
      </Space>
    ),
    key: roof.id + ' Rise',
  });
  node.push({
    checkable: false,
    title: <ColorInput element={roof} />,
    key: roof.id + ' Color',
  });
  node.push({
    checkable: false,
    title: <RoofSideColorInput roof={roof} />,
    key: roof.id + ' Side Color',
  });
  node.push({
    checkable: false,
    title: <RoofTextureInput roof={roof} />,
    key: roof.id + ' Texture',
  });
  return node;
};

export const createWallNode = (wall: WallModel) => {
  const lang = { lng: useStore.getState().language };
  const node: TreeDataNode[] = [];
  const wallChildren = useStore.getState().getChildren(wall.id);
  for (const c of wallChildren) {
    switch (c.type) {
      case ObjectType.Window: {
        node.push({
          checkable: true,
          title: createTooltip(c.id, i18nType(c)),
          key: c.id,
          children: createWindowNode(c as WindowModel),
        });
        break;
      }
      case ObjectType.Door: {
        node.push({
          checkable: true,
          title: createTooltip(c.id, i18nType(c)),
          key: c.id,
          children: createDoorNode(c as DoorModel),
        });
        break;
      }
      case ObjectType.SolarPanel: {
        const solarPanelChildren: TreeDataNode[] = createSolarPanelNode(c as SolarPanelModel, true, true);
        node.push({
          checkable: true,
          title: createTooltip(
            c.id,
            i18n.t('modelTree.WallMountedSolarPanels', lang) + (c.label ? ' (' + c.label + ')' : ''),
          ),
          key: c.id,
          children: solarPanelChildren,
        });
        break;
      }
      case ObjectType.Sensor: {
        node.push({
          checkable: true,
          title: createTooltip(c.id, i18nType(c)),
          key: c.id,
          children: createSensorNode(c as SensorModel, true),
        });
        break;
      }
      case ObjectType.Light: {
        node.push({
          checkable: true,
          title: createTooltip(c.id, i18nType(c)),
          key: c.id,
          children: createLightNode(c as LightModel),
        });
        break;
      }
    }
  }
  node.push({
    checkable: false,
    title: <RValueInput element={wall} title={i18n.t('word.RValue', lang)} />,
    key: wall.id + ' R-value',
  });
  node.push({
    checkable: false,
    title: <HeatCapacityInput element={wall} />,
    key: wall.id + ' Heat Capacity',
  });
  node.push({
    checkable: false,
    title: <ColorInput element={wall} />,
    key: wall.id + ' Color',
  });
  node.push({
    checkable: false,
    title: <WallTextureInput wall={wall} />,
    key: wall.id + ' Texture',
  });
  node.push({
    checkable: false,
    title: (
      <SizeInput element={wall} variable={'ly'} title={i18n.t('word.Thickness', lang)} min={0.1} max={1} step={0.01} />
    ),
    key: wall.id + ' Thickness',
  });
  node.push({
    checkable: false,
    title: (
      <Space>
        <span>{i18n.t('word.Height', lang)} : </span>
        <InputNumber value={wall.lz} precision={2} disabled />
        {i18n.t('word.MeterAbbreviation', lang)}
      </Space>
    ),
    key: wall.id + ' Height',
  });
  node.push({
    checkable: false,
    title: (
      <Space>
        <span>{i18n.t('wallMenu.EavesLength', lang)} : </span>
        <InputNumber
          value={wall.eavesLength}
          precision={2}
          min={0}
          max={5}
          step={0.05}
          disabled={wall.locked}
          onChange={(value) => {
            if (value !== null) {
              useStore.getState().set((state) => {
                const el = state.elements.find((e) => e.id === wall.id);
                if (el) {
                  (el as WallModel).eavesLength = value;
                }
              });
            }
          }}
        />
        {i18n.t('word.MeterAbbreviation', lang)}
      </Space>
    ),
    key: wall.id + ' Overhang',
  });
  return node;
};

export const createSensorNode = (sensor: SensorModel, relative?: boolean) => {
  const node: TreeDataNode[] = [];
  node.push({
    checkable: false,
    title: <LabelInput element={sensor} />,
    key: sensor.id + ' Label',
  });
  node.push(...getCoordinates(sensor, relative));
  return node;
};

export const createLightNode = (light: LightModel, relative?: boolean) => {
  const node: TreeDataNode[] = [];
  node.push({
    checkable: false,
    title: <LabelInput element={light} />,
    key: light.id + ' Label',
  });
  node.push(...getCoordinates(light, relative));
  return node;
};

export const createSolarWaterHeaterNode = (heater: SolarWaterHeaterModel) => {
  const node: TreeDataNode[] = [];
  node.push({
    checkable: false,
    title: <ColorInput element={heater} defaultColor={'#808080'} />,
    key: heater.id + ' Color',
  });
  node.push({
    checkable: false,
    title: <SolarCollectorSunBeamCheckbox solarCollector={heater} forModelTree />,
    key: heater.id + ' Sun Beam',
  });
  node.push({
    checkable: false,
    title: <LabelInput element={heater} />,
    key: heater.id + ' Label',
  });
  node.push(...getCoordinates(heater));
  node.push(...getDimension(heater));
  return node;
};

export const createDoorNode = (door: DoorModel) => {
  const node: TreeDataNode[] = [];
  node.push({
    checkable: false,
    title: <UValueInput element={door} />,
    key: door.id + ' U-value',
  });
  node.push({
    checkable: false,
    title: <HeatCapacityInput element={door} />,
    key: door.id + ' Heat Capacity',
  });
  node.push({
    checkable: false,
    title: <DoorTypeInput door={door} />,
    key: door.id + ' Type',
  });
  node.push({
    checkable: false,
    title: <ColorInput element={door} />,
    key: door.id + ' Color',
  });
  node.push({
    checkable: false,
    title: <DoorTextureInput door={door} />,
    key: door.id + ' Texture',
  });
  node.push(...getDimension(door, true));
  node.push(...getCoordinates(door, true));
  return node;
};

export const createWindowNode = (window: WindowModel, skylight?: boolean) => {
  const node: TreeDataNode[] = [];
  node.push({
    checkable: false,
    title: <UValueInput element={window} />,
    key: window.id + ' U-value',
  });
  node.push({
    checkable: false,
    title: <ShgcInput window={window} />,
    key: window.id + ' shgc',
  });
  node.push({
    checkable: false,
    title: <TintInput window={window} />,
    key: window.id + ' Tint',
  });
  node.push({
    checkable: false,
    title: <WindowTypeInput window={window} />,
    key: window.id + ' Type',
  });
  if (!skylight) {
    node.push(...getDimension(window, true));
  }
  node.push(...getCoordinates(window, true));
  return node;
};

export const createSolarPanelNode = (solarPanel: SolarPanelModel, fixed?: boolean, relative?: boolean) => {
  const node: TreeDataNode[] = [];
  node.push({
    checkable: false,
    title: <SolarPanelModelSelection solarPanel={solarPanel} />,
    key: solarPanel.id + ' Model',
  });
  if (!fixed) {
    node.push({
      checkable: false,
      title: <SolarPanelTrackerSelection solarPanel={solarPanel} />,
      key: solarPanel.id + ' Tracker',
    });
  }
  node.push({
    checkable: false,
    title: <SolarPanelOrientationSelect solarPanel={solarPanel} />,
    key: solarPanel.id + ' Orientation',
  });
  node.push({
    checkable: false,
    title: <SolarPanelLengthInput solarPanel={solarPanel} />,
    key: solarPanel.id + ' Length',
  });
  node.push({
    checkable: false,
    title: <SolarPanelWidthInput solarPanel={solarPanel} />,
    key: solarPanel.id + ' Width',
  });
  if (!fixed) {
    node.push({
      checkable: false,
      title: <PoleHeightInput collector={solarPanel} />,
      key: solarPanel.id + ' Pole Height',
    });
    node.push({
      checkable: false,
      title: <SolarPanelTiltAngleInput solarPanel={solarPanel} />,
      key: solarPanel.id + ' Tilt Angle',
    });
    node.push({
      checkable: false,
      title: <AzimuthInput element={solarPanel} relative={true} />,
      key: solarPanel.id + ' Azimuth',
    });
  }
  node.push({
    checkable: false,
    title: <SolarPanelBatterySelect solarPanel={solarPanel} />,
    key: solarPanel.id + ' Battery',
  });
  node.push({
    checkable: false,
    title: <SolarPanelFrameColorInput solarPanel={solarPanel} />,
    key: solarPanel.id + ' Frame Color',
  });
  node.push({
    checkable: false,
    title: <SolarCollectorSunBeamCheckbox solarCollector={solarPanel} forModelTree />,
    key: solarPanel.id + ' Sun Beam',
  });
  node.push({
    checkable: false,
    title: <LabelInput element={solarPanel} />,
    key: solarPanel.id + ' Label',
  });
  node.push(...getCoordinates(solarPanel, relative));
  return node;
};

export const createPolygonNode = (polygon: PolygonModel) => {
  const lang = { lng: useStore.getState().language };
  const node: TreeDataNode[] = [];
  node.push({
    checkable: false,
    title: (
      <span>
        {i18n.t('modelTree.VertexCount', lang)} : {polygon.vertices.length}
      </span>
    ),
    key: polygon.id + ' Vertex Count',
  });
  node.push({
    checkable: false,
    title: <PolygonFillCheckbox polygon={polygon} forModelTree />,
    key: polygon.id + ' Filled',
  });
  node.push({
    checkable: false,
    title: <ColorInput element={polygon} title={i18n.t('polygonMenu.FillColor', lang)} />,
    key: polygon.id + ' Fill Color',
  });
  node.push({
    checkable: false,
    title: <PolygonTextureInput polygon={polygon} />,
    key: polygon.id + ' Fill Texture',
  });
  node.push({
    checkable: false,
    title: <OpacityInput element={polygon} />,
    key: polygon.id + ' Opacity',
  });
  node.push({
    checkable: false,
    title: <PolygonOutlineCheckbox polygon={polygon} forModelTree />,
    key: polygon.id + ' Outline',
  });
  node.push({
    checkable: false,
    title: <ColorInput element={polygon} type={ColorType.Line} title={i18n.t('polygonMenu.LineColor', lang)} />,
    key: polygon.id + ' Line Color',
  });
  node.push({
    checkable: false,
    title: <LineWidthInput element={polygon} />,
    key: polygon.id + ' Line Width',
  });
  node.push({
    checkable: false,
    title: <LineStyleInput polygon={polygon} />,
    key: polygon.id + ' Line style',
  });
  return node;
};

export const createHumanNode = (human: HumanModel) => {
  const lang = { lng: useStore.getState().language };
  const node: TreeDataNode[] = [];
  node.push({
    checkable: false,
    title: (
      <Space>
        <span>{i18n.t('word.Name', lang)} :</span>
        <HumanSelection human={human} disabled={human.locked} />
      </Space>
    ),
    key: human.id + ' Name',
  });
  node.push({
    checkable: false,
    title: <HumanObserverCheckbox human={human} forModelTree />,
    key: human.id + ' Observer',
  });
  node.push({
    checkable: false,
    title: <BillboardFlipCheckbox billboardModel={human} forModelTree />,
    key: human.id + ' Flip',
  });
  node.push(...getCoordinates(human));
  return node;
};

export const createFlowerNode = (flower: FlowerModel) => {
  const lang = { lng: useStore.getState().language };
  const node: TreeDataNode[] = [];
  node.push({
    checkable: false,
    title: (
      <Space>
        <span>{i18n.t('word.Type', lang)} :</span>
        <FlowerSelection flower={flower} disabled={flower.locked} />
      </Space>
    ),
    key: flower.id + ' Type',
  });
  node.push({
    checkable: false,
    title: <BillboardFlipCheckbox billboardModel={flower} forModelTree />,
    key: flower.id + ' Flip',
  });
  node.push(...getCoordinates(flower));
  return node;
};

export const createTreeNode = (tree: TreeModel) => {
  const lang = { lng: useStore.getState().language };
  const node: TreeDataNode[] = [];
  node.push({
    checkable: false,
    title: (
      <Space>
        <span>{i18n.t('word.Type', lang)} : </span>
        <TreeSelection tree={tree} disabled={tree.locked} />
      </Space>
    ),
    key: tree.id + ' Type',
  });
  node.push({
    checkable: false,
    title: (
      <SizeInput element={tree} variable={'lx'} title={i18n.t('treeMenu.Spread', lang)} min={1} max={100} step={1} />
    ),
    key: tree.id + ' Spread',
  });
  node.push({
    checkable: false,
    title: <SizeInput element={tree} variable={'lz'} title={i18n.t('word.Height', lang)} min={1} max={100} step={1} />,
    key: tree.id + ' Height',
  });
  node.push({
    checkable: false,
    title: <TreeShowModelCheckbox tree={tree} forModelTree />,
    key: tree.id + ' Show Model',
  });
  node.push({
    checkable: false,
    title: <BillboardFlipCheckbox billboardModel={tree} forModelTree />,
    key: tree.id + ' Flip',
  });
  node.push({
    checkable: false,
    title: <LabelInput element={tree} />,
    key: tree.id + ' Label',
  });
  node.push(...getCoordinates(tree));
  return node;
};

export const createBatteryStorageNode = (battery: BatteryStorageModel) => {
  const node: TreeDataNode[] = [];
  node.push({
    checkable: false,
    title: <BatteryIdInput battery={battery} />,
    key: battery.id + ' ID',
  });
  node.push({
    checkable: false,
    title: <ChargingEfficiencyInput battery={battery} />,
    key: battery.id + ' Charging Efficiency',
  });
  node.push({
    checkable: false,
    title: <DischargingEfficiencyInput battery={battery} />,
    key: battery.id + ' Discharging Efficiency',
  });
  node.push({
    checkable: false,
    title: <AzimuthInput element={battery} relative={true} />,
    key: battery.id + ' Azimuth',
  });
  node.push({
    checkable: false,
    title: <ColorInput element={battery} />,
    key: battery.id + ' Color',
  });
  node.push({
    checkable: false,
    title: <LabelInput element={battery} />,
    key: battery.id + ' Label',
  });
  node.push(...getDimension(battery));
  node.push(...getCoordinates(battery));
  return node;
};

export const createParabolicDishNode = (dish: ParabolicDishModel) => {
  const lang = { lng: useStore.getState().language };
  const node: TreeDataNode[] = [];
  node.push({
    checkable: false,
    title: (
      <SizeInput
        element={dish}
        variable={'lx'}
        title={i18n.t('parabolicDishMenu.RimDiameter', lang)}
        min={1}
        max={10}
        step={0.05}
      />
    ),
    key: dish.id + ' Rim Diameter',
  });
  node.push({
    checkable: false,
    title: <LatusRectumInput collector={dish} />,
    key: dish.id + ' Latus Rectum',
  });
  node.push({
    checkable: false,
    title: <PoleHeightInput collector={dish} extra={true} />,
    key: dish.id + ' Extra Pole Height',
  });
  node.push({
    checkable: false,
    title: <ReflectanceInput collector={dish} />,
    key: dish.id + ' Reflectance',
  });
  node.push({
    checkable: false,
    title: <AbsorptanceInput collector={dish} />,
    key: dish.id + ' Absorptance',
  });
  node.push({
    checkable: false,
    title: <ReflectorOpticalEfficiencyInput collector={dish} />,
    key: dish.id + ' Reflector Optical Efficiency',
  });
  node.push({
    checkable: false,
    title: <ReceiverThermalEfficiencyInput collector={dish} />,
    key: dish.id + ' Receiver Thermal Efficiency',
  });
  node.push({
    checkable: false,
    title: <SolarCollectorSunBeamCheckbox solarCollector={dish} forModelTree />,
    key: dish.id + ' Sun Beam',
  });
  node.push({
    checkable: false,
    title: <LabelInput element={dish} />,
    key: dish.id + ' Label',
  });
  node.push(...getCoordinates(dish, true));
  return node;
};

export const createParabolicTroughNode = (trough: ParabolicTroughModel) => {
  const lang = { lng: useStore.getState().language };
  const node: TreeDataNode[] = [];
  node.push({
    checkable: false,
    title: (
      <SizeInput
        element={trough}
        variable={'ly'}
        title={i18n.t('word.Length', lang)}
        min={trough.moduleLength}
        max={200 * trough.moduleLength}
        step={trough.moduleLength}
      />
    ),
    key: trough.id + ' Length',
  });
  node.push({
    checkable: false,
    title: (
      <SizeInput element={trough} variable={'lx'} title={i18n.t('word.Width', lang)} min={1} max={10} step={0.1} />
    ),
    key: trough.id + ' Width',
  });
  node.push({
    checkable: false,
    title: <ModuleLengthInput collector={trough} />,
    key: trough.id + ' Module Length',
  });
  node.push({
    checkable: false,
    title: <LatusRectumInput collector={trough} />,
    key: trough.id + ' Latus Rectum',
  });
  node.push({
    checkable: false,
    title: <PoleHeightInput collector={trough} extra={true} />,
    key: trough.id + ' Extra Pole Height',
  });
  node.push({
    checkable: false,
    title: <ReflectanceInput collector={trough} />,
    key: trough.id + ' Reflectance',
  });
  node.push({
    checkable: false,
    title: <AbsorptanceInput collector={trough} />,
    key: trough.id + ' Absorptance',
  });
  node.push({
    checkable: false,
    title: <ReflectorOpticalEfficiencyInput collector={trough} />,
    key: trough.id + ' Reflector Optical Efficiency',
  });
  node.push({
    checkable: false,
    title: <ReceiverThermalEfficiencyInput collector={trough} />,
    key: trough.id + ' Receiver Thermal Efficiency',
  });
  node.push({
    checkable: false,
    title: <SolarCollectorSunBeamCheckbox solarCollector={trough} forModelTree />,
    key: trough.id + ' Sun Beam',
  });
  node.push({
    checkable: false,
    title: <LabelInput element={trough} />,
    key: trough.id + ' Label',
  });
  node.push(...getCoordinates(trough, true));
  return node;
};

export const createHeliostatNode = (heliostat: HeliostatModel) => {
  const lang = { lng: useStore.getState().language };
  const node: TreeDataNode[] = [];
  node.push({
    checkable: false,
    title: (
      <SizeInput element={heliostat} variable={'lx'} title={i18n.t('word.Length', lang)} min={1} max={20} step={0.05} />
    ),
    key: heliostat.id + ' Length',
  });
  node.push({
    checkable: false,
    title: (
      <SizeInput element={heliostat} variable={'ly'} title={i18n.t('word.Width', lang)} min={1} max={20} step={0.05} />
    ),
    key: heliostat.id + ' Width',
  });
  node.push({
    checkable: false,
    title: <HeliostatTowerSelect heliostat={heliostat} />,
    key: heliostat.id + ' Tower',
  });
  node.push({
    checkable: false,
    title: <PoleHeightInput collector={heliostat} extra={true} />,
    key: heliostat.id + ' Extra Pole Height',
  });
  node.push({
    checkable: false,
    title: <ReflectanceInput collector={heliostat} />,
    key: heliostat.id + ' Reflectance',
  });
  node.push({
    checkable: false,
    title: <SolarCollectorSunBeamCheckbox solarCollector={heliostat} forModelTree />,
    key: heliostat.id + ' Sun Beam',
  });
  node.push({
    checkable: false,
    title: <LabelInput element={heliostat} />,
    key: heliostat.id + ' Label',
  });
  node.push(...getCoordinates(heliostat, true));
  return node;
};

export const createFresnelReflectorNode = (fresnel: FresnelReflectorModel) => {
  const lang = { lng: useStore.getState().language };
  const node: TreeDataNode[] = [];
  node.push({
    checkable: false,
    title: (
      <SizeInput
        element={fresnel}
        variable={'ly'}
        title={i18n.t('word.Length', lang)}
        min={fresnel.moduleLength}
        max={200 * fresnel.moduleLength}
        step={fresnel.moduleLength}
      />
    ),
    key: fresnel.id + ' Length',
  });
  node.push({
    checkable: false,
    title: (
      <SizeInput element={fresnel} variable={'lx'} title={i18n.t('word.Width', lang)} min={1} max={10} step={0.05} />
    ),
    key: fresnel.id + ' Width',
  });
  node.push({
    checkable: false,
    title: <ModuleLengthInput collector={fresnel} />,
    key: fresnel.id + ' Module Length',
  });
  node.push({
    checkable: false,
    title: <FresnelReceiverSelect fresnel={fresnel} />,
    key: fresnel.id + ' Receiver',
  });
  node.push({
    checkable: false,
    title: <PoleHeightInput collector={fresnel} extra={true} />,
    key: fresnel.id + ' Extra Pole Height',
  });
  node.push({
    checkable: false,
    title: <ReflectanceInput collector={fresnel} />,
    key: fresnel.id + ' Reflectance',
  });
  node.push({
    checkable: false,
    title: <SolarCollectorSunBeamCheckbox solarCollector={fresnel} forModelTree />,
    key: fresnel.id + ' Sun Beam',
  });
  node.push({
    checkable: false,
    title: <LabelInput element={fresnel} />,
    key: fresnel.id + ' Label',
  });
  node.push(...getCoordinates(fresnel, true));
  return node;
};

export const createWindTurbineNode = (turbine: WindTurbineModel) => {
  const lang = { lng: useStore.getState().language };
  const node: TreeDataNode[] = [];
  node.push({
    checkable: false,
    title: (
      <Space>
        <span>{i18n.t('windTurbineMenu.TowerHeight', lang)} : </span>
        <InputNumber
          value={turbine.towerHeight}
          precision={2}
          min={1}
          max={100}
          step={1}
          disabled={turbine.locked}
          onChange={(value) => {
            if (value !== null) {
              useStore.getState().set((state) => {
                const el = state.elements.find((e) => e.id === turbine.id);
                if (el) {
                  (el as WindTurbineModel).towerHeight = value;
                }
              });
            }
          }}
        />
        {i18n.t('word.MeterAbbreviation', lang)}
      </Space>
    ),
    key: turbine.id + ' Tower Height',
  });
  node.push({
    checkable: false,
    title: (
      <Space>
        <span>{i18n.t('windTurbineMenu.TowerRadius', lang)} : </span>
        <InputNumber
          value={turbine.towerRadius}
          precision={2}
          min={0.1}
          max={2}
          step={0.1}
          disabled={turbine.locked}
          onChange={(value) => {
            if (value !== null) {
              useStore.getState().set((state) => {
                const el = state.elements.find((e) => e.id === turbine.id);
                if (el) {
                  (el as WindTurbineModel).towerRadius = value;
                }
              });
            }
          }}
        />
        {i18n.t('word.MeterAbbreviation', lang)}
      </Space>
    ),
    key: turbine.id + ' Tower Radius',
  });
  node.push({
    checkable: false,
    title: (
      <Space>
        <span>{i18n.t('windTurbineMenu.BladeNumber', lang)} : </span>
        <InputNumber
          value={turbine.numberOfBlades}
          precision={0}
          min={1}
          max={8}
          step={1}
          disabled={turbine.locked}
          onChange={(value) => {
            if (value !== null) {
              useStore.getState().set((state) => {
                const el = state.elements.find((e) => e.id === turbine.id);
                if (el) {
                  (el as WindTurbineModel).numberOfBlades = value;
                }
              });
            }
          }}
        />
      </Space>
    ),
    key: turbine.id + ' Blade Number',
  });
  node.push({
    checkable: false,
    title: (
      <Space>
        <span>{i18n.t('windTurbineMenu.RotorBladeRadius', lang)} : </span>
        <InputNumber
          value={turbine.bladeRadius}
          precision={2}
          min={1}
          max={100}
          step={1}
          disabled={turbine.locked}
          onChange={(value) => {
            if (value !== null) {
              useStore.getState().set((state) => {
                const el = state.elements.find((e) => e.id === turbine.id);
                if (el) {
                  (el as WindTurbineModel).bladeRadius = value;
                }
              });
            }
          }}
        />
        {i18n.t('word.MeterAbbreviation', lang)}
      </Space>
    ),
    key: turbine.id + ' Blade Radius',
  });
  node.push({
    checkable: false,
    title: <LabelInput element={turbine} />,
    key: turbine.id + ' Label',
  });
  node.push(...getCoordinates(turbine, true));
  return node;
};
