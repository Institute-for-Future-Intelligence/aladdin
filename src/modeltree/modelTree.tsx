/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { GetRef, InputNumber, Space, Tooltip, Tree, TreeDataNode } from 'antd';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import { ElementModel } from '../models/ElementModel';
import { GROUND_ID } from '../constants';
import { ObjectType } from '../types';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { WindowModel } from '../models/WindowModel';
import { DoorModel } from '../models/DoorModel';
import { FoundationModel } from '../models/FoundationModel';
import { RoofModel } from '../models/RoofModel';
import { WallModel } from '../models/WallModel';
import { ParabolicDishModel } from '../models/ParabolicDishModel';
import { ParabolicTroughModel } from '../models/ParabolicTroughModel';
import { FresnelReflectorModel } from '../models/FresnelReflectorModel';
import { WindTurbineModel } from '../models/WindTurbineModel';
import { TreeModel } from '../models/TreeModel';
import TreeSelection from '../components/contextMenu/elementMenu/billboardMenu/treeSelection';
import FlowerSelection from '../components/contextMenu/elementMenu/billboardMenu/flowerSelection';
import { FlowerModel } from '../models/FlowerModel';
import HumanSelection from '../components/contextMenu/elementMenu/billboardMenu/humanSelection';
import { HumanModel } from '../models/HumanModel';
import { PolygonModel } from '../models/PolygonModel';
import { HeliostatModel } from '../models/HeliostatModel';
import LabelInput from './labelInput';
import ColorInput from './colorInput';
import AzimuthInput from './azimuthInput';
import TintInput from './tintInput';
import ShgcInput from './shgcInput';
import SolarPanelOrientationRadioGroup from './solarPanelOrientationRadioGroup';
import SolarPanelTrackerSelection from './solarPanelTrackerSelection';
import SolarPanelModelSelection from './solarPanelModelSelection';
import SolarPanelTiltAngleInput from './solarPanelTiltAngleInput';
import SolarPanelLengthInput from './solarPanelLengthInput';
import SolarPanelWidthInput from './solarPanelWidthInput';
import PoleHeightInput from './poleHeightInput';
import ModuleLengthInput from './moduleLengthInput';
import ReflectanceInput from './reflectanceInput';
import AbsorptanceInput from './absorptanceInput';
import LatusRectumInput from './latusRectumInput';
import LxLyLzInput from './LxLyLzInput';
import UValueInput from './uValueInput';
import RValueInput from './rValueInput';
import HeatCapacityInput from './heatCapacityInput';

const ModelTree = React.memo(() => {
  const modelTreeExpandedKeys = usePrimitiveStore(Selector.modelTreeExpandedKeys);
  const selectElement = useStore(Selector.selectElement);

  const modelTreeRef = useRef<GetRef<typeof Tree>>(null);

  useEffect(() => {
    if (modelTreeRef.current && modelTreeExpandedKeys.length > 0) {
      modelTreeRef.current?.scrollTo({ key: modelTreeExpandedKeys[modelTreeExpandedKeys.length - 1] });
    }
  }, [modelTreeExpandedKeys]);

  const elements = useStore(Selector.elements);
  const getChildren = useStore(Selector.getChildren);
  const getParent = useStore(Selector.getParent);
  const getElementById = useStore(Selector.getElementById);
  const supportedPvModules = useStore(Selector.supportedPvModules);
  const customPvModules = useStore(Selector.customPvModules);

  const lang = useLanguage();
  const { t } = useTranslation();

  const pvModules = useMemo(() => {
    return { ...customPvModules, ...supportedPvModules };
  }, [supportedPvModules, customPvModules]);

  const handleCoordinateChange = (element: ElementModel, prop: 'cx' | 'cy' | 'cz', value: number) => {
    if (element.parentId === GROUND_ID && prop === 'cz') return;
    useStore.getState().set((state) => {
      const el = state.elements.find((e) => e.id === element.id);
      if (el) {
        el[prop] = value;
      }
    });
  };

  const getCoordinates = (e: ElementModel, relative?: boolean) => {
    // hardcode the rules for allowing and disallowing coordinate changes from the model tree
    const parent = getParent(e);
    const disableAll =
      e.locked ||
      e.type === ObjectType.SolarWaterHeater ||
      (parent?.type === ObjectType.Roof &&
        (e.type === ObjectType.SolarPanel || e.type === ObjectType.Sensor || e.type === ObjectType.Light));
    const disableX = e.type === ObjectType.Wall;
    const disableY =
      e.type === ObjectType.Window ||
      e.type === ObjectType.Door ||
      e.type === ObjectType.Wall ||
      (parent?.type === ObjectType.Wall &&
        (e.type === ObjectType.SolarPanel || e.type === ObjectType.Sensor || e.type === ObjectType.Light));
    const disableZ =
      e.parentId === GROUND_ID ||
      ((parent?.type === ObjectType.Foundation || parent?.type === ObjectType.Cuboid) &&
        (e.type === ObjectType.SolarPanel ||
          e.type === ObjectType.Sensor ||
          e.type === ObjectType.Light ||
          e.type === ObjectType.ParabolicDish ||
          e.type === ObjectType.ParabolicTrough ||
          e.type === ObjectType.FresnelReflector ||
          e.type === ObjectType.Heliostat ||
          e.type === ObjectType.Polygon ||
          e.type === ObjectType.Human ||
          e.type === ObjectType.Flower ||
          e.type === ObjectType.Tree ||
          e.type === ObjectType.BatteryStorage ||
          e.type === ObjectType.WindTurbine)) ||
      e.type === ObjectType.Wall;

    return [
      {
        checkable: false,
        title: (
          <Space>
            <span>x : </span>
            <InputNumber
              step={relative ? 0.01 : 0.1}
              value={e.cx}
              precision={2}
              disabled={disableAll || disableX}
              onChange={(value) => {
                if (value !== null) handleCoordinateChange(e, 'cx', value);
              }}
            />
            {t(relative ? 'word.Relative' : 'word.MeterAbbreviation', lang)}
          </Space>
        ),
        key: e.id + ' x',
      },
      {
        checkable: false,
        title: (
          <Space>
            <span>y : </span>
            <InputNumber
              step={relative ? 0.01 : 0.1}
              value={e.cy}
              precision={2}
              disabled={disableAll || disableY}
              onChange={(value) => {
                if (value !== null) handleCoordinateChange(e, 'cy', value);
              }}
            />
            {t(relative ? 'word.Relative' : 'word.MeterAbbreviation', lang)}
          </Space>
        ),
        key: e.id + ' y',
      },
      {
        checkable: false,
        title: (
          <Space>
            <span>z : </span>
            <InputNumber
              step={relative ? 0.01 : 0.1}
              value={e.cz}
              precision={2}
              disabled={disableAll || disableZ}
              onChange={(value) => {
                if (value !== null) handleCoordinateChange(e, 'cz', value);
              }}
            />
            {t(relative ? 'word.Relative' : 'word.MeterAbbreviation', lang)}
          </Space>
        ),
        key: e.id + ' z',
      },
    ];
  };

  const handleDimensionChange = (element: ElementModel, prop: 'lx' | 'ly' | 'lz', value: number) => {
    useStore.getState().set((state) => {
      const el = state.elements.find((e) => e.id === element.id);
      if (el) {
        el[prop] = value;
      }
    });
  };

  const getDimension = (e: ElementModel, relative?: boolean) => {
    const parent = getParent(e);
    const disableAll = e.locked;
    const disableY =
      e.type == ObjectType.SolarWaterHeater || e.type === ObjectType.Window || e.type === ObjectType.Door;
    const disableZ = e.type == ObjectType.SolarWaterHeater || e.type === ObjectType.Door;
    return [
      {
        checkable: false,
        title: (
          <Space>
            <span>Lx : </span>
            <InputNumber
              value={(relative && parent ? parent.lx : 1) * e.lx}
              min={0.01}
              precision={2}
              step={relative ? 0.01 : 0.1}
              disabled={disableAll}
              onChange={(value) => {
                if (value !== null) handleDimensionChange(e, 'lx', relative && parent ? value / parent.lx : value);
              }}
            />
            {t('word.MeterAbbreviation', lang)}
          </Space>
        ),
        key: e.id + ' lx',
      },
      {
        checkable: false,
        title: (
          <Space>
            <span>Ly : </span>
            <InputNumber
              value={(relative && parent ? parent.ly : 1) * e.ly}
              precision={2}
              min={0.01}
              step={relative ? 0.01 : 0.1}
              disabled={disableAll || disableY}
              onChange={(value) => {
                if (value !== null) handleDimensionChange(e, 'ly', relative && parent ? value / parent.ly : value);
              }}
            />
            {t('word.MeterAbbreviation', lang)}
          </Space>
        ),
        key: e.id + ' ly',
      },
      {
        checkable: false,
        title: (
          <Space>
            <span>Lz : </span>
            <InputNumber
              value={(relative && parent ? parent.lz : 1) * e.lz}
              precision={2}
              min={0.01}
              step={relative ? 0.01 : 0.1}
              disabled={disableAll || disableZ}
              onChange={(value) => {
                if (value !== null) handleDimensionChange(e, 'lz', relative && parent ? value / parent.lz : value);
              }}
            />
            {t('word.MeterAbbreviation', lang)}
          </Space>
        ),
        key: e.id + ' lz',
      },
    ];
  };

  const createTooltip = (id: string, text: string) => {
    return (
      <Tooltip
        placement={'right'}
        title={'ID: ' + id}
        color={'white'}
        styles={{ body: { color: 'gray', fontSize: '12px' } }}
      >
        <span>{text}</span>
      </Tooltip>
    );
  };

  const i18nType = (e: ElementModel) => {
    switch (e.type) {
      case ObjectType.Human: {
        return t('shared.HumanElement', lang);
      }
      case ObjectType.Flower: {
        return t('shared.FlowerElement', lang);
      }
      case ObjectType.Tree: {
        return t('shared.TreeElement', lang);
      }
      case ObjectType.Polygon: {
        return t('shared.PolygonElement', lang);
      }
      case ObjectType.Foundation: {
        return t('shared.FoundationElement', lang);
      }
      case ObjectType.Cuboid: {
        return t('shared.CuboidElement', lang);
      }
      case ObjectType.Wall: {
        return t('shared.WallElement', lang);
      }
      case ObjectType.Roof: {
        return t('shared.RoofElement', lang);
      }
      case ObjectType.Window: {
        return t('shared.WindowElement', lang);
      }
      case ObjectType.Door: {
        return t('shared.DoorElement', lang);
      }
      case ObjectType.SolarWaterHeater: {
        return t('shared.SolarWaterHeaterElement', lang);
      }
      case ObjectType.Sensor: {
        return t('shared.SensorElement', lang);
      }
      case ObjectType.Light: {
        return t('shared.LightElement', lang);
      }
      case ObjectType.SolarPanel: {
        const parent = getElementById(e.parentId);
        return t(
          parent?.type === ObjectType.Foundation ? 'modelTree.GroundMountedSolarPanels' : 'shared.SolarPanelElement',
          lang,
        );
      }
      case ObjectType.ParabolicDish: {
        return t('shared.ParabolicDishElement', lang);
      }
      case ObjectType.ParabolicTrough: {
        return t('shared.ParabolicTroughElement', lang);
      }
      case ObjectType.FresnelReflector: {
        return t('shared.FresnelReflectorElement', lang);
      }
      case ObjectType.Heliostat: {
        return t('shared.HeliostatElement', lang);
      }
      case ObjectType.WindTurbine: {
        return t('shared.WindTurbineElement', lang);
      }
      case ObjectType.BatteryStorage: {
        return t('shared.BatteryStorageElement', lang);
      }
    }
    return 'Unknown';
  };

  const modelTree = useMemo(() => {
    const array: TreeDataNode[] = [];
    for (const e of elements) {
      if (e.type === ObjectType.Foundation) {
        const foundationChildren = getChildren(e.id);
        const children: TreeDataNode[] = [];
        for (const s of foundationChildren) {
          const grandChildren: TreeDataNode[] = [];
          if (s.type === ObjectType.BatteryStorage) {
            grandChildren.push({
              checkable: false,
              title: <AzimuthInput element={s} relative={true} />,
              key: s.id + ' Azimuth',
            });
            grandChildren.push(...getDimension(s));
          } else if (s.type === ObjectType.ParabolicDish) {
            const dish = s as ParabolicDishModel;
            grandChildren.push({
              checkable: false,
              title: (
                <LxLyLzInput
                  element={s}
                  variable={'lx'}
                  title={t('parabolicDishMenu.RimDiameter', lang)}
                  min={1}
                  max={10}
                  step={0.05}
                />
              ),
              key: s.id + ' Rim Diameter',
            });
            grandChildren.push({
              checkable: false,
              title: <LatusRectumInput collector={dish} />,
              key: s.id + ' Latus Rectum',
            });
            grandChildren.push({
              checkable: false,
              title: <PoleHeightInput collector={dish} extra={true} />,
              key: s.id + ' Extra Pole Height',
            });
            grandChildren.push({
              checkable: false,
              title: <ReflectanceInput collector={dish} />,
              key: s.id + ' Reflectance',
            });
            grandChildren.push({
              checkable: false,
              title: <AbsorptanceInput collector={dish} />,
              key: s.id + ' Absorptance',
            });
          } else if (s.type === ObjectType.ParabolicTrough) {
            const trough = s as ParabolicTroughModel;
            grandChildren.push({
              checkable: false,
              title: (
                <LxLyLzInput
                  element={s}
                  variable={'ly'}
                  title={t('word.Length', lang)}
                  min={trough.moduleLength}
                  max={100 * trough.moduleLength}
                  step={trough.moduleLength}
                />
              ),
              key: s.id + ' Length',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <LxLyLzInput element={s} variable={'lx'} title={t('word.Width', lang)} min={1} max={10} step={0.1} />
              ),
              key: s.id + ' Width',
            });
            grandChildren.push({
              checkable: false,
              title: <ModuleLengthInput collector={trough} />,
              key: s.id + ' Module Length',
            });
            grandChildren.push({
              checkable: false,
              title: <LatusRectumInput collector={trough} />,
              key: s.id + ' Latus Rectum',
            });
            grandChildren.push({
              checkable: false,
              title: <PoleHeightInput collector={trough} extra={true} />,
              key: s.id + ' Extra Pole Height',
            });
            grandChildren.push({
              checkable: false,
              title: <ReflectanceInput collector={trough} />,
              key: s.id + ' Reflectance',
            });
            grandChildren.push({
              checkable: false,
              title: <AbsorptanceInput collector={trough} />,
              key: s.id + ' Absorptance',
            });
          } else if (s.type === ObjectType.Heliostat) {
            const heliostat = s as HeliostatModel;
            grandChildren.push({
              checkable: false,
              title: (
                <LxLyLzInput element={s} variable={'lx'} title={t('word.Length', lang)} min={1} max={20} step={0.05} />
              ),
              key: s.id + ' Length',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <LxLyLzInput element={s} variable={'ly'} title={t('word.Width', lang)} min={1} max={20} step={0.05} />
              ),
              key: s.id + ' Width',
            });
            grandChildren.push({
              checkable: false,
              title: <PoleHeightInput collector={heliostat} extra={true} />,
              key: s.id + ' Extra Pole Height',
            });
            grandChildren.push({
              checkable: false,
              title: <ReflectanceInput collector={heliostat} />,
              key: s.id + ' Reflectance',
            });
          } else if (s.type === ObjectType.FresnelReflector) {
            const fresnel = s as FresnelReflectorModel;
            grandChildren.push({
              checkable: false,
              title: (
                <LxLyLzInput
                  element={s}
                  variable={'ly'}
                  title={t('word.Length', lang)}
                  min={fresnel.moduleLength}
                  max={100 * fresnel.moduleLength}
                  step={fresnel.moduleLength}
                />
              ),
              key: s.id + ' Length',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <LxLyLzInput element={s} variable={'lx'} title={t('word.Width', lang)} min={1} max={10} step={0.05} />
              ),
              key: s.id + ' Width',
            });
            grandChildren.push({
              checkable: false,
              title: <ModuleLengthInput collector={fresnel} />,
              key: s.id + ' Module Length',
            });
            grandChildren.push({
              checkable: false,
              title: <PoleHeightInput collector={fresnel} extra={true} />,
              key: s.id + ' Extra Pole Height',
            });
            grandChildren.push({
              checkable: false,
              title: <ReflectanceInput collector={fresnel} />,
              key: s.id + ' Reflectance',
            });
          } else if (s.type === ObjectType.WindTurbine) {
            const turbine = s as WindTurbineModel;
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('windTurbineMenu.TowerHeight', lang)} : </span>
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
                  {t('word.MeterAbbreviation', lang)}
                </Space>
              ),
              key: s.id + ' Tower Height',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('windTurbineMenu.TowerRadius', lang)} : </span>
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
                  {t('word.MeterAbbreviation', lang)}
                </Space>
              ),
              key: s.id + ' Tower Radius',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('windTurbineMenu.BladeNumber', lang)} : </span>
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
              key: s.id + ' Blade Number',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('windTurbineMenu.RotorBladeRadius', lang)} : </span>
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
                  {t('word.MeterAbbreviation', lang)}
                </Space>
              ),
              key: s.id + ' Blade Radius',
            });
          } else if (s.type === ObjectType.Tree) {
            const treeModel = s as TreeModel;
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('word.Type', lang)} : </span>
                  <TreeSelection tree={treeModel} disabled={treeModel.locked} />
                </Space>
              ),
              key: s.id + ' Type',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <LxLyLzInput
                  element={s}
                  variable={'lx'}
                  title={t('treeMenu.Spread', lang)}
                  min={1}
                  max={100}
                  step={1}
                />
              ),
              key: s.id + ' Spread',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <LxLyLzInput element={s} variable={'lz'} title={t('word.Height', lang)} min={1} max={100} step={1} />
              ),
              key: s.id + ' Height',
            });
          } else if (s.type === ObjectType.Flower) {
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('word.Type', lang)} :</span>
                  <FlowerSelection flower={s as FlowerModel} disabled={s.locked} />
                </Space>
              ),
              key: s.id + ' Type',
            });
          } else if (s.type === ObjectType.Human) {
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('word.Name', lang)} :</span>
                  <HumanSelection human={s as HumanModel} disabled={s.locked} />
                </Space>
              ),
              key: s.id + ' Name',
            });
          } else if (s.type === ObjectType.Polygon) {
            grandChildren.push({
              checkable: false,
              title: (
                <span>
                  {t('modelTree.VertexCount', lang)} : {(s as PolygonModel).vertices.length}
                </span>
              ),
              key: s.id + ' Vertex Count',
            });
          } else if (s.type === ObjectType.SolarPanel) {
            const solarPanel = s as SolarPanelModel;
            grandChildren.push({
              checkable: false,
              title: <SolarPanelModelSelection solarPanel={solarPanel} />,
              key: s.id + ' Model',
            });
            grandChildren.push({
              checkable: false,
              title: <SolarPanelTrackerSelection solarPanel={solarPanel} />,
              key: s.id + ' Tracker',
            });
            grandChildren.push({
              checkable: false,
              title: <SolarPanelOrientationRadioGroup solarPanel={solarPanel} />,
              key: s.id + ' Orientation',
            });
            grandChildren.push({
              checkable: false,
              title: <SolarPanelLengthInput solarPanel={solarPanel} />,
              key: s.id + ' Length',
            });
            grandChildren.push({
              checkable: false,
              title: <SolarPanelWidthInput solarPanel={solarPanel} />,
              key: s.id + ' Width',
            });
            grandChildren.push({
              checkable: false,
              title: <PoleHeightInput collector={solarPanel} />,
              key: s.id + ' Pole Height',
            });
            grandChildren.push({
              checkable: false,
              title: <SolarPanelTiltAngleInput solarPanel={solarPanel} />,
              key: s.id + ' Tilt Angle',
            });
            grandChildren.push({
              checkable: false,
              title: <AzimuthInput element={solarPanel} relative={true} />,
              key: s.id + ' Azimuth',
            });
          } else if (s.type === ObjectType.Wall) {
            const wall = s as WallModel;
            const wallChildren = getChildren(s.id);
            for (const c of wallChildren) {
              switch (c.type) {
                case ObjectType.Window: {
                  const window = c as WindowModel;
                  const windowChildren: TreeDataNode[] = [];
                  windowChildren.push({
                    checkable: false,
                    title: <UValueInput element={window} />,
                    key: c.id + ' U-value',
                  });
                  windowChildren.push({
                    checkable: false,
                    title: <ShgcInput window={window} />,
                    key: c.id + ' shgc',
                  });
                  windowChildren.push({
                    checkable: false,
                    title: <TintInput window={window} />,
                    key: c.id + ' Tint',
                  });
                  windowChildren.push(...getCoordinates(c, true));
                  windowChildren.push(...getDimension(c, true));
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(c.id, i18nType(c)),
                    key: c.id,
                    children: windowChildren,
                  });
                  break;
                }
                case ObjectType.Door: {
                  const doorChildren: TreeDataNode[] = [];
                  doorChildren.push({
                    checkable: false,
                    title: <UValueInput element={c as DoorModel} />,
                    key: c.id + ' U-value',
                  });
                  doorChildren.push({
                    checkable: false,
                    title: <HeatCapacityInput element={c as DoorModel} />,
                    key: c.id + ' Heat Capacity',
                  });
                  doorChildren.push({
                    checkable: false,
                    title: <ColorInput element={c} />,
                    key: c.id + ' Color',
                  });
                  doorChildren.push(...getCoordinates(c, true));
                  doorChildren.push(...getDimension(c, true));
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(c.id, i18nType(c)),
                    key: c.id,
                    children: doorChildren,
                  });
                  break;
                }
                case ObjectType.SolarPanel: {
                  const solarPanelChildren: TreeDataNode[] = [];
                  const solarPanel = c as SolarPanelModel;
                  solarPanelChildren.push({
                    checkable: false,
                    title: <SolarPanelModelSelection solarPanel={solarPanel} />,
                    key: c.id + ' Model',
                  });
                  solarPanelChildren.push({
                    checkable: false,
                    title: <SolarPanelOrientationRadioGroup solarPanel={solarPanel} />,
                    key: c.id + ' Orientation',
                  });
                  solarPanelChildren.push({
                    checkable: false,
                    title: <SolarPanelLengthInput solarPanel={solarPanel} />,
                    key: c.id + ' Length',
                  });
                  solarPanelChildren.push({
                    checkable: false,
                    title: <SolarPanelWidthInput solarPanel={solarPanel} />,
                    key: c.id + ' Width',
                  });
                  solarPanelChildren.push({
                    checkable: false,
                    title: <LabelInput element={c} />,
                    key: c.id + ' Label',
                  });
                  solarPanelChildren.push(...getCoordinates(c, true));
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(
                      c.id,
                      t('modelTree.WallMountedSolarPanels', lang) + (c.label ? ' (' + c.label + ')' : ''),
                    ),
                    key: c.id,
                    children: solarPanelChildren,
                  });
                  break;
                }
                case ObjectType.Sensor: {
                  const sensorChildren: TreeDataNode[] = [];
                  sensorChildren.push({
                    checkable: false,
                    title: <LabelInput element={c} />,
                    key: c.id + ' Label',
                  });
                  sensorChildren.push(...getCoordinates(c, true));
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(c.id, i18nType(c)),
                    key: c.id,
                    children: sensorChildren,
                  });
                  break;
                }
                case ObjectType.Light: {
                  const lightChildren: TreeDataNode[] = [];
                  lightChildren.push({
                    checkable: false,
                    title: <LabelInput element={c} />,
                    key: c.id + ' Label',
                  });
                  lightChildren.push(...getCoordinates(c, true));
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(c.id, i18nType(c)),
                    key: c.id,
                    children: lightChildren,
                  });
                  break;
                }
              }
            }
            grandChildren.push({
              checkable: false,
              title: <RValueInput element={wall} title={t('word.RValue', lang)} />,
              key: s.id + ' R-value',
            });
            grandChildren.push({
              checkable: false,
              title: <HeatCapacityInput element={wall} />,
              key: s.id + ' Heat Capacity',
            });
            grandChildren.push({
              checkable: false,
              title: <ColorInput element={s} />,
              key: s.id + ' Color',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <LxLyLzInput
                  element={s}
                  variable={'ly'}
                  title={t('word.Thickness', lang)}
                  min={0.1}
                  max={1}
                  step={0.01}
                />
              ),
              key: s.id + ' Thickness',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('word.Height', lang)} : </span>
                  <InputNumber value={wall.lz} precision={2} disabled />
                  {t('word.MeterAbbreviation', lang)}
                </Space>
              ),
              key: s.id + ' Height',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('wallMenu.EavesLength', lang)} : </span>
                  <InputNumber
                    value={wall.eavesLength}
                    precision={2}
                    min={0}
                    max={5}
                    step={0.05}
                    disabled={s.locked}
                    onChange={(value) => {
                      if (value !== null) {
                        useStore.getState().set((state) => {
                          const el = state.elements.find((e) => e.id === s.id);
                          if (el) {
                            (el as WallModel).eavesLength = value;
                          }
                        });
                      }
                    }}
                  />
                  {t('word.MeterAbbreviation', lang)}
                </Space>
              ),
              key: s.id + ' Overhang',
            });
          } else if (s.type === ObjectType.Roof) {
            const roofChildren = getChildren(s.id);
            for (const c of roofChildren) {
              switch (c.type) {
                case ObjectType.Window: {
                  const window = c as WindowModel;
                  const windowChildren: TreeDataNode[] = [];
                  windowChildren.push({
                    checkable: false,
                    title: <UValueInput element={window} />,
                    key: c.id + ' U-value',
                  });
                  windowChildren.push({
                    checkable: false,
                    title: <ShgcInput window={window} />,
                    key: c.id + ' shgc',
                  });
                  windowChildren.push({
                    checkable: false,
                    title: <TintInput window={window} />,
                    key: c.id + ' Tint',
                  });
                  windowChildren.push(...getCoordinates(c));
                  windowChildren.push(...getDimension(c));
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(c.id, t('modelTree.SkylightWindow', lang)),
                    key: c.id,
                    children: windowChildren,
                  });
                  break;
                }
                case ObjectType.SolarPanel: {
                  const solarPanelChildren: TreeDataNode[] = [];
                  const solarPanel = c as SolarPanelModel;
                  solarPanelChildren.push({
                    checkable: false,
                    title: <SolarPanelModelSelection solarPanel={solarPanel} />,
                    key: c.id + ' Model',
                  });
                  solarPanelChildren.push({
                    checkable: false,
                    title: <SolarPanelOrientationRadioGroup solarPanel={solarPanel} />,
                    key: c.id + ' Orientation',
                  });
                  solarPanelChildren.push({
                    checkable: false,
                    title: <SolarPanelLengthInput solarPanel={solarPanel} />,
                    key: c.id + ' Length',
                  });
                  solarPanelChildren.push({
                    checkable: false,
                    title: <SolarPanelWidthInput solarPanel={solarPanel} />,
                    key: c.id + ' Width',
                  });
                  solarPanelChildren.push({
                    checkable: false,
                    title: <LabelInput element={c} />,
                    key: c.id + ' Label',
                  });
                  solarPanelChildren.push(...getCoordinates(c));
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(
                      c.id,
                      t('modelTree.RooftopSolarPanels', lang) + (c.label ? ' (' + c.label + ')' : ''),
                    ),
                    key: c.id,
                    children: solarPanelChildren,
                  });
                  break;
                }
                case ObjectType.SolarWaterHeater: {
                  const solarWaterHeaterChildren: TreeDataNode[] = [];
                  solarWaterHeaterChildren.push({
                    checkable: false,
                    title: <ColorInput element={c} />,
                    key: c.id + ' Color',
                  });
                  solarWaterHeaterChildren.push({
                    checkable: false,
                    title: <LabelInput element={c} />,
                    key: c.id + ' Label',
                  });
                  solarWaterHeaterChildren.push(...getCoordinates(c));
                  solarWaterHeaterChildren.push(...getDimension(c));
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(c.id, i18nType(c) + (c.label ? ' (' + c.label + ')' : '')),
                    key: c.id,
                    children: solarWaterHeaterChildren,
                  });
                  break;
                }
                case ObjectType.Sensor: {
                  const sensorChildren: TreeDataNode[] = [];
                  sensorChildren.push(...getCoordinates(c, true));
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(c.id, i18nType(c)),
                    key: c.id,
                    children: sensorChildren,
                  });
                  break;
                }
                case ObjectType.Light: {
                  const lightChildren: TreeDataNode[] = [];
                  lightChildren.push(...getCoordinates(c, true));
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(c.id, i18nType(c)),
                    key: c.id,
                    children: lightChildren,
                  });
                  break;
                }
              }
            }
            grandChildren.push({
              checkable: false,
              title: <RValueInput element={s as RoofModel} title={t('word.RValue', lang)} />,
              key: s.id + ' R-value',
            });
            grandChildren.push({
              checkable: false,
              title: <HeatCapacityInput element={s as RoofModel} />,
              key: s.id + ' Heat Capacity',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('word.Thickness', lang)} : </span>
                  <InputNumber
                    value={(s as RoofModel).thickness}
                    precision={2}
                    min={0.05}
                    max={1}
                    step={0.01}
                    disabled={s.locked}
                    onChange={(value) => {
                      if (value !== null) {
                        useStore.getState().set((state) => {
                          const el = state.elements.find((e) => e.id === s.id);
                          if (el) {
                            (el as RoofModel).thickness = value;
                          }
                        });
                      }
                    }}
                  />
                  {t('word.MeterAbbreviation', lang)}
                </Space>
              ),
              key: s.id + ' Thickness',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('roofMenu.Rise', lang)} : </span>
                  <InputNumber
                    value={(s as RoofModel).rise}
                    precision={2}
                    min={0}
                    step={0.1}
                    disabled={s.locked}
                    onChange={(value) => {
                      if (value !== null) {
                        useStore.getState().set((state) => {
                          const el = state.elements.find((e) => e.id === s.id);
                          if (el) {
                            (el as RoofModel).rise = value;
                          }
                        });
                      }
                    }}
                  />
                  {t('word.MeterAbbreviation', lang)}
                </Space>
              ),
              key: s.id + ' Rise',
            });
            grandChildren.push({
              checkable: false,
              title: <ColorInput element={s} />,
              key: s.id + ' Color',
            });
          }
          if (s.type !== ObjectType.Roof) {
            if (s.type !== ObjectType.Human && s.type !== ObjectType.Flower) {
              grandChildren.push({
                checkable: false,
                title: <LabelInput element={s} />,
                key: s.id + ' Label',
              });
            }
            const relative =
              s.type === ObjectType.ParabolicDish ||
              s.type === ObjectType.ParabolicTrough ||
              s.type === ObjectType.Heliostat ||
              s.type === ObjectType.FresnelReflector ||
              s.type === ObjectType.WindTurbine ||
              s.type === ObjectType.Sensor ||
              s.type === ObjectType.Light;
            grandChildren.push(...getCoordinates(s, relative));
          }
          children.push({
            title: createTooltip(s.id, i18nType(s) + (s.label ? ' (' + s.label + ')' : '')),
            key: s.id,
            children: grandChildren,
          });
        }
        const f = e as FoundationModel;
        if (!f.notBuilding) {
          children.push({
            checkable: false,
            title: <RValueInput element={f} title={t('foundationMenu.GroundFloorRValue', lang)} />,
            key: f.id + ' R-value',
          });
        }
        children.push({
          checkable: false,
          title: <AzimuthInput element={f} />,
          key: f.id + ' Azimuth',
        });
        children.push({
          checkable: false,
          title: <ColorInput element={f} />,
          key: f.id + ' Color',
        });
        children.push({
          checkable: false,
          title: <LabelInput element={f} />,
          key: f.id + ' Label',
        });
        children.push(...getCoordinates(f));
        children.push(...getDimension(f));
        array.push({
          title: createTooltip(
            f.id,
            (f.notBuilding ? i18nType(f) : t('word.Building', lang)) + (f.label ? ' (' + f.label + ')' : ''),
          ),
          key: f.id,
          children,
        });
      } else if (e.parentId === GROUND_ID) {
        const properties: TreeDataNode[] = [];
        switch (e.type) {
          case ObjectType.Tree: {
            const treeModel = e as TreeModel;
            properties.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('word.Type', lang)} :</span>
                  <TreeSelection tree={treeModel} disabled={treeModel.locked} />
                </Space>
              ),
              key: e.id + ' Type',
            });
            properties.push({
              checkable: false,
              title: (
                <LxLyLzInput
                  element={e}
                  variable={'lx'}
                  title={t('treeMenu.Spread', lang)}
                  min={1}
                  max={100}
                  step={1}
                />
              ),
              key: e.id + ' Spread',
            });
            properties.push({
              checkable: false,
              title: (
                <LxLyLzInput element={e} variable={'lz'} title={t('word.Height', lang)} min={1} max={100} step={1} />
              ),
              key: e.id + ' Height',
            });
            properties.push({
              checkable: false,
              title: <LabelInput element={e} />,
              key: e.id + ' Label',
            });
            properties.push(...getCoordinates(e));
            break;
          }
          case ObjectType.Flower: {
            properties.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('word.Type', lang)} :</span>
                  <FlowerSelection flower={e as FlowerModel} disabled={e.locked} />
                </Space>
              ),
              key: e.id + ' Type',
            });
            properties.push(...getCoordinates(e));
            break;
          }
          case ObjectType.Human: {
            properties.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('word.Name', lang)} :</span>
                  <HumanSelection human={e as HumanModel} disabled={e.locked} />
                </Space>
              ),
              key: e.id + ' Name',
            });
            properties.push(...getCoordinates(e));
            break;
          }
          case ObjectType.Cuboid: {
            const cuboidChildren = getChildren(e.id);
            for (const s of cuboidChildren) {
              const grandChildren: TreeDataNode[] = [];
              if (s.type === ObjectType.Tree) {
                const treeModel = s as TreeModel;
                grandChildren.push({
                  checkable: false,
                  title: (
                    <Space>
                      <span>{t('word.Type', lang)} : </span>
                      <TreeSelection tree={treeModel} disabled={treeModel.locked} />
                    </Space>
                  ),
                  key: s.id + ' Type',
                });
                grandChildren.push({
                  checkable: false,
                  title: (
                    <LxLyLzInput
                      element={s}
                      variable={'lx'}
                      title={t('treeMenu.Spread', lang)}
                      min={1}
                      max={100}
                      step={1}
                    />
                  ),
                  key: s.id + ' Spread',
                });
                grandChildren.push({
                  checkable: false,
                  title: (
                    <LxLyLzInput
                      element={s}
                      variable={'lz'}
                      title={t('word.Height', lang)}
                      min={1}
                      max={100}
                      step={1}
                    />
                  ),
                  key: s.id + ' Height',
                });
              } else if (s.type === ObjectType.Flower) {
                grandChildren.push({
                  checkable: false,
                  title: (
                    <Space>
                      <span>{t('word.Type', lang)} :</span>
                      <FlowerSelection flower={s as FlowerModel} disabled={s.locked} />
                    </Space>
                  ),
                  key: s.id + ' Type',
                });
              } else if (s.type === ObjectType.Human) {
                grandChildren.push({
                  checkable: false,
                  title: (
                    <Space>
                      <span>{t('word.Name', lang)} :</span>
                      <HumanSelection human={s as HumanModel} disabled={s.locked} />
                    </Space>
                  ),
                  key: s.id + ' Name',
                });
              } else if (s.type === ObjectType.Polygon) {
                grandChildren.push({
                  checkable: false,
                  title: (
                    <span>
                      {t('modelTree.VertexCount', lang)} : {(s as PolygonModel).vertices.length}
                    </span>
                  ),
                  key: s.id + ' Vertex Count',
                });
              } else if (s.type === ObjectType.SolarPanel) {
                const solarPanel = s as SolarPanelModel;
                grandChildren.push({
                  checkable: false,
                  title: <SolarPanelModelSelection solarPanel={solarPanel} />,
                  key: s.id + ' Model',
                });
                grandChildren.push({
                  checkable: false,
                  title: <SolarPanelOrientationRadioGroup solarPanel={solarPanel} />,
                  key: s.id + ' Orientation',
                });
                grandChildren.push({
                  checkable: false,
                  title: <SolarPanelLengthInput solarPanel={solarPanel} />,
                  key: s.id + ' Length',
                });
                grandChildren.push({
                  checkable: false,
                  title: <SolarPanelWidthInput solarPanel={solarPanel} />,
                  key: s.id + ' Width',
                });
                grandChildren.push({
                  checkable: false,
                  title: <PoleHeightInput collector={solarPanel} />,
                  key: s.id + ' Pole Height',
                });
                grandChildren.push({
                  checkable: false,
                  title: <SolarPanelTiltAngleInput solarPanel={solarPanel} />,
                  key: s.id + ' Tilt Angle',
                });
                grandChildren.push({
                  checkable: false,
                  title: <AzimuthInput element={solarPanel} relative={true} />,
                  key: s.id + ' Azimuth',
                });
                grandChildren.push(...getDimension(s));
              }
              if (s.type !== ObjectType.Flower && s.type !== ObjectType.Human && s.type !== ObjectType.Polygon) {
                grandChildren.push({
                  checkable: false,
                  title: <LabelInput element={s} />,
                  key: s.id + ' Label',
                });
              }
              const relative = s.type === ObjectType.Light || s.type === ObjectType.Sensor;
              grandChildren.push(...getCoordinates(s, relative));
              properties.push({
                title: createTooltip(s.id, i18nType(s) + (s.label ? ' (' + s.label + ')' : '')),
                key: s.id,
                children: grandChildren,
              });
            }
            properties.push({
              checkable: false,
              title: <AzimuthInput element={e} />,
              key: e.id + ' Azimuth',
            });
            properties.push(...getCoordinates(e));
            properties.push(...getDimension(e));
            break;
          }
        }
        array.push({
          title: createTooltip(e.id, i18nType(e) + (e.label ? ' (' + e.label + ')' : '')),
          key: e.id,
          children: properties,
        });
      }
    }
    return array;
  }, [elements, lang, pvModules]);

  return (
    <Tree
      ref={modelTreeRef}
      virtual={false}
      checkable={false}
      defaultExpandAll
      autoExpandParent
      showLine
      showIcon
      expandedKeys={modelTreeExpandedKeys}
      selectedKeys={modelTreeExpandedKeys}
      // checkedKeys={[]}
      onCheck={() => {}}
      onSelect={(keys) => {
        const key = (keys as string[])[0];
        // we use a space after the UID of an element for the keys of its properties
        if (key && !key.includes(' ')) selectElement(key);
      }}
      onExpand={(keys, node) => {
        if (node.expanded) {
          selectElement((keys as string[])[0], true);
        } else {
          selectElement('none');
        }
        usePrimitiveStore.getState().set((state) => {
          state.modelTreeExpandedKeys = [...keys] as string[];
        });
      }}
      treeData={modelTree}
      onContextMenu={(e) => {
        // do not invoke the context menu from the canvas if any
        e.preventDefault();
        e.stopPropagation();
      }}
    />
  );
});

export default ModelTree;
