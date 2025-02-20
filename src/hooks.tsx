/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import * as Selector from './stores/selector';
import React, { useMemo } from 'react';
import { InputNumber, Radio, Space, Tooltip, TreeDataNode } from 'antd';
import { ObjectType, Orientation } from './types';
import {
  DEFAULT_DOOR_U_VALUE,
  DEFAULT_ROOF_R_VALUE,
  DEFAULT_WALL_R_VALUE,
  DEFAULT_WINDOW_U_VALUE,
  GROUND_ID,
} from './constants';
import { TreeModel } from './models/TreeModel';
import { ElementModel } from './models/ElementModel';
import { WindowModel } from './models/WindowModel';
import { DoorModel } from './models/DoorModel';
import { SolarPanelModel } from './models/SolarPanelModel';
import { RoofModel } from './models/RoofModel';
import { WallModel } from './models/WallModel';
import { HumanModel } from './models/HumanModel';
import { FlowerModel } from './models/FlowerModel';
import { FoundationModel } from './models/FoundationModel';
import { useTranslation } from 'react-i18next';
import { Util } from './Util';
import { PolygonModel } from './models/PolygonModel';
import { ParabolicDishModel } from './models/ParabolicDishModel';
import { ParabolicTroughModel } from './models/ParabolicTroughModel';
import { WindTurbineModel } from './models/WindTurbineModel';
import { FresnelReflectorModel } from './models/FresnelReflectorModel';
import HumanSelection from './components/contextMenu/elementMenu/billboardMenu/humanSelection';
import TreeSelection from './components/contextMenu/elementMenu/billboardMenu/treeSelection';
import FlowerSelection from './components/contextMenu/elementMenu/billboardMenu/flowerSelection';

export const useSelected = (id: string) => {
  return useStore((state) => state.selectedElementIdSet.has(id) && !state.groupActionMode);
};

export const useLanguage = () => {
  const language = useStore(Selector.language);
  return useMemo(() => {
    return { lng: language };
  }, [language]);
};

export const useWeather = (city: string | null) => {
  return useStore.getState().getWeather(city ?? 'Boston MA, USA');
  // useMemo may cache undefined
  // return useMemo(() => useStore.getState().getWeather(city ?? 'Boston MA, USA'), [city]);
};

export const useModelTree = () => {
  const elements = useStore(Selector.elements);
  const getChildren = useStore(Selector.getChildren);
  const getParent = useStore(Selector.getParent);
  const getElementById = useStore(Selector.getElementById);

  const lang = useLanguage();
  const { t } = useTranslation();

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
    const disableAll = e.locked || e.type === ObjectType.SolarPanel;
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

  const createSolarPanelOrientationRadioGroup = (s: SolarPanelModel) => {
    return (
      <Space>
        <span>{t('solarPanelMenu.Orientation', lang)} : </span>
        <Radio.Group
          value={s.orientation}
          options={[
            { value: Orientation.portrait, label: t('solarPanelMenu.Portrait', lang) },
            { value: Orientation.landscape, label: t('solarPanelMenu.Landscape', lang) },
          ]}
          onChange={(e) => {
            useStore.getState().set((state) => {
              const elem = state.elements.find((e) => e.id === s.id);
              if (elem) {
                (elem as SolarPanelModel).orientation = e.target.value;
              }
            });
          }}
        />
      </Space>
    );
  };

  const createSolarPanelTiltAngleInput = (s: SolarPanelModel) => {
    return (
      <Space>
        <span>{t('solarPanelMenu.TiltAngle', lang)} : </span>
        <InputNumber
          value={parseFloat(Util.toDegrees(s.tiltAngle).toFixed(2))}
          precision={2}
          step={1}
          min={-90}
          max={90}
          formatter={(value) => `${value}°`}
          disabled={s.locked}
          onChange={(value) => {
            if (value !== null) {
              useStore.getState().set((state) => {
                const element = state.elements.find((e) => e.id === s.id);
                if (element) {
                  (element as SolarPanelModel).tiltAngle = Util.toRadians(value);
                }
              });
            }
          }}
        />
      </Space>
    );
  };

  const createAzimuthInput = (s: ElementModel) => {
    return (
      <Space>
        <span>{t('word.Azimuth', lang)} : </span>
        <InputNumber
          value={parseFloat(Util.toDegrees(s.rotation[2]).toFixed(2))}
          precision={2}
          step={1}
          min={-180}
          max={180}
          formatter={(value) => `${value}°`}
          disabled={s.locked}
          onChange={(value) => {
            if (value !== null) {
              useStore.getState().set((state) => {
                const element = state.elements.find((e) => e.id === s.id);
                if (element) {
                  element.rotation[2] = Util.toRadians(value);
                }
              });
            }
          }}
        />
      </Space>
    );
  };

  const createLxInput = (
    s: ElementModel,
    title: string,
    min: number,
    max: number,
    step: number,
    relative?: boolean,
  ) => {
    return (
      <Space>
        <span>{title} : </span>
        <InputNumber
          value={s.lx}
          precision={2}
          min={min}
          max={max}
          step={step}
          disabled={s.locked}
          onChange={(value) => {
            if (value !== null) {
              useStore.getState().set((state) => {
                const element = state.elements.find((e) => e.id === s.id);
                if (element) element.lx = value;
              });
            }
          }}
        />
        {t(relative ? 'word.Relative' : 'word.MeterAbbreviation', lang)}
      </Space>
    );
  };

  const createLyInput = (
    s: ElementModel,
    title: string,
    min: number,
    max: number,
    step: number,
    relative?: boolean,
  ) => {
    return (
      <Space>
        <span>{title} : </span>
        <InputNumber
          value={s.ly}
          precision={2}
          min={min}
          max={max}
          step={step}
          disabled={s.locked}
          onChange={(value) => {
            if (value !== null) {
              useStore.getState().set((state) => {
                const element = state.elements.find((e) => e.id === s.id);
                if (element) element.ly = value;
              });
            }
          }}
        />
        {t(relative ? 'word.Relative' : 'word.MeterAbbreviation', lang)}
      </Space>
    );
  };

  const createLzInput = (
    s: ElementModel,
    title: string,
    min: number,
    max: number,
    step: number,
    relative?: boolean,
  ) => {
    return (
      <Space>
        <span>{title} : </span>
        <InputNumber
          value={s.lz}
          precision={2}
          min={min}
          max={max}
          step={step}
          disabled={s.locked}
          onChange={(value) => {
            if (value !== null) {
              useStore.getState().set((state) => {
                const element = state.elements.find((e) => e.id === s.id);
                if (element) element.lz = value;
              });
            }
          }}
        />
        {t(relative ? 'word.Relative' : 'word.MeterAbbreviation', lang)}
      </Space>
    );
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

  return useMemo(() => {
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
              title: createAzimuthInput(s),
              key: s.id + ' Azimuth',
            });
            grandChildren.push(...getDimension(s));
          } else if (s.type === ObjectType.ParabolicDish) {
            const dish = s as ParabolicDishModel;
            grandChildren.push({
              checkable: false,
              title: createLxInput(s, t('parabolicDishMenu.RimDiameter', lang), 1, 10, 0.05),
              key: s.id + ' Rim Diameter',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('parabolicDishMenu.LatusRectum', lang)} : </span>
                  <InputNumber
                    value={dish.latusRectum}
                    precision={2}
                    min={1}
                    max={20}
                    step={0.1}
                    disabled={dish.locked}
                    onChange={(value) => {
                      if (value !== null) {
                        useStore.getState().set((state) => {
                          const el = state.elements.find((e) => e.id === dish.id);
                          if (el) {
                            (el as ParabolicDishModel).latusRectum = value;
                          }
                        });
                      }
                    }}
                  />
                  {t('word.MeterAbbreviation', lang)}
                </Space>
              ),
              key: s.id + ' Latus Rectum',
            });
          } else if (s.type === ObjectType.ParabolicTrough) {
            const trough = s as ParabolicTroughModel;
            grandChildren.push({
              checkable: false,
              title: createLyInput(
                s,
                t('word.Length', lang),
                trough.moduleLength,
                100 * trough.moduleLength,
                trough.moduleLength,
              ),
              key: s.id + ' Length',
            });
            grandChildren.push({
              checkable: false,
              title: createLxInput(s, t('word.Width', lang), 1, 10, 0.1),
              key: s.id + ' Width',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('parabolicTroughMenu.LatusRectum', lang)} : </span>
                  <InputNumber
                    value={trough.latusRectum}
                    precision={2}
                    min={1}
                    max={20}
                    step={0.1}
                    disabled={trough.locked}
                    onChange={(value) => {
                      if (value !== null) {
                        useStore.getState().set((state) => {
                          const el = state.elements.find((e) => e.id === trough.id);
                          if (el) {
                            (el as ParabolicTroughModel).latusRectum = value;
                          }
                        });
                      }
                    }}
                  />
                  {t('word.MeterAbbreviation', lang)}
                </Space>
              ),
              key: s.id + ' Latus Rectum',
            });
          } else if (s.type === ObjectType.Heliostat) {
            grandChildren.push({
              checkable: false,
              title: createLxInput(s, t('word.Length', lang), 1, 20, 0.05),
              key: s.id + ' Length',
            });
            grandChildren.push({
              checkable: false,
              title: createLyInput(s, t('word.Width', lang), 1, 20, 0.05),
              key: s.id + ' Width',
            });
          } else if (s.type === ObjectType.FresnelReflector) {
            const fresnel = s as FresnelReflectorModel;
            grandChildren.push({
              checkable: false,
              title: createLyInput(
                s,
                t('word.Length', lang),
                fresnel.moduleLength,
                100 * fresnel.moduleLength,
                fresnel.moduleLength,
              ),
              key: s.id + ' Length',
            });
            grandChildren.push({
              checkable: false,
              title: createLxInput(s, t('word.Width', lang), 1, 10, 0.05),
              key: s.id + ' Width',
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
              title: createLxInput(s, t('treeMenu.Spread', lang), 1, 100, 1),
              key: s.id + ' Spread',
            });
            grandChildren.push({
              checkable: false,
              title: createLzInput(s, t('word.Height', lang), 1, 100, 1),
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
              title: (
                <Space>
                  <span>{t('pvModelPanel.Model', lang)} : </span>
                  <span>{solarPanel.pvModelName}</span>
                </Space>
              ),
              key: s.id + ' Model',
            });
            grandChildren.push({
              checkable: false,
              title: createSolarPanelOrientationRadioGroup(s as SolarPanelModel),
              key: s.id + ' Orientation',
            });
            grandChildren.push({
              checkable: false,
              title: createSolarPanelTiltAngleInput(s as SolarPanelModel),
              key: s.id + ' Tilt Angle',
            });
            grandChildren.push(...getDimension(s));
          } else if (s.type === ObjectType.Wall) {
            const wallChildren = getChildren(s.id);
            for (const c of wallChildren) {
              switch (c.type) {
                case ObjectType.Window: {
                  const windowChildren: TreeDataNode[] = [];
                  windowChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>{t('word.UValue', lang)} : </span>
                        <InputNumber
                          value={(c as WindowModel).uValue ?? DEFAULT_WINDOW_U_VALUE}
                          precision={2}
                          min={0.01}
                          max={100}
                          step={0.05}
                          disabled={c.locked}
                          onChange={(value) => {
                            if (value !== null) {
                              useStore.getState().set((state) => {
                                const el = state.elements.find((e) => e.id === c.id);
                                if (el) {
                                  (el as WindowModel).uValue = value;
                                }
                              });
                            }
                          }}
                        />
                        W/(m²·℃)
                      </Space>
                    ),
                    key: c.id + ' U-value',
                  });
                  windowChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>SHGC : </span>
                        <InputNumber
                          value={1 - ((c as WindowModel).opacity ?? 0.5)}
                          precision={2}
                          min={0}
                          max={1}
                          step={0.01}
                          disabled={c.locked}
                          onChange={(value) => {
                            if (value !== null) {
                              useStore.getState().set((state) => {
                                const el = state.elements.find((e) => e.id === c.id);
                                if (el) {
                                  (el as WindowModel).opacity = 1 - value;
                                }
                              });
                            }
                          }}
                        />
                      </Space>
                    ),
                    key: c.id + ' shgc',
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
                    title: (
                      <Space>
                        <span>{t('word.UValue', lang)} : </span>
                        <InputNumber
                          value={(c as DoorModel).uValue ?? DEFAULT_DOOR_U_VALUE}
                          precision={2}
                          min={0.01}
                          max={100}
                          step={0.05}
                          disabled={c.locked}
                          onChange={(value) => {
                            if (value !== null) {
                              useStore.getState().set((state) => {
                                const el = state.elements.find((e) => e.id === c.id);
                                if (el) {
                                  (el as DoorModel).uValue = value;
                                }
                              });
                            }
                          }}
                        />
                        W/(m²·℃)
                      </Space>
                    ),
                    key: c.id + ' U-value',
                  });
                  doorChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>{t('word.VolumetricHeatCapacity', lang)} : </span>
                        <InputNumber
                          value={(c as DoorModel).volumetricHeatCapacity ?? 0.5}
                          precision={2}
                          min={0.01}
                          max={100}
                          step={0.05}
                          disabled={c.locked}
                          onChange={(value) => {
                            if (value !== null) {
                              useStore.getState().set((state) => {
                                const el = state.elements.find((e) => e.id === c.id);
                                if (el) {
                                  (el as DoorModel).volumetricHeatCapacity = value;
                                }
                              });
                            }
                          }}
                        />
                        kWh/(m³·℃)
                      </Space>
                    ),
                    key: c.id + ' Heat Capacity',
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
                  solarPanelChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>{t('pvModelPanel.Model', lang)} : </span>
                        <span>{(c as SolarPanelModel).pvModelName}</span>
                      </Space>
                    ),
                    key: c.id + ' Model',
                  });
                  solarPanelChildren.push({
                    checkable: false,
                    title: createSolarPanelOrientationRadioGroup(c as SolarPanelModel),
                    key: c.id + ' Orientation',
                  });
                  solarPanelChildren.push(...getCoordinates(c, true));
                  solarPanelChildren.push(...getDimension(c));
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
              title: (
                <Space>
                  <span>{t('word.RValue', lang)} : </span>
                  <InputNumber
                    value={(s as WallModel).rValue ?? DEFAULT_WALL_R_VALUE}
                    precision={2}
                    min={0.01}
                    max={100}
                    step={0.05}
                    disabled={s.locked}
                    onChange={(value) => {
                      if (value !== null) {
                        useStore.getState().set((state) => {
                          const el = state.elements.find((e) => e.id === s.id);
                          if (el) {
                            (el as WallModel).rValue = value;
                          }
                        });
                      }
                    }}
                  />
                  m²·℃/W
                </Space>
              ),
              key: s.id + ' R-value',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('word.VolumetricHeatCapacity', lang)} : </span>
                  <InputNumber
                    value={(s as WallModel).volumetricHeatCapacity ?? 0.5}
                    precision={2}
                    min={0.01}
                    max={100}
                    step={0.05}
                    disabled={s.locked}
                    onChange={(value) => {
                      if (value !== null) {
                        useStore.getState().set((state) => {
                          const el = state.elements.find((e) => e.id === s.id);
                          if (el) {
                            (el as WallModel).volumetricHeatCapacity = value;
                          }
                        });
                      }
                    }}
                  />
                  kWh/(m³·℃)
                </Space>
              ),
              key: s.id + ' Heat Capacity',
            });
            grandChildren.push({
              checkable: false,
              title: createLyInput(s, t('word.Thickness', lang), 0.1, 1, 0.01),
              key: s.id + ' Thickness',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('word.Height', lang)} : </span>
                  <InputNumber value={(s as WallModel).lz} precision={2} disabled />
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
                    value={(s as WallModel).eavesLength}
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
                  const windowChildren: TreeDataNode[] = [];
                  windowChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>{t('word.UValue', lang)} : </span>
                        <InputNumber
                          value={(c as WindowModel).uValue ?? DEFAULT_WINDOW_U_VALUE}
                          precision={2}
                          min={0.01}
                          max={100}
                          step={0.05}
                          disabled={c.locked}
                          onChange={(value) => {
                            if (value !== null) {
                              useStore.getState().set((state) => {
                                const el = state.elements.find((e) => e.id === c.id);
                                if (el) {
                                  (el as WindowModel).uValue = value;
                                }
                              });
                            }
                          }}
                        />
                        W/(m²·℃)
                      </Space>
                    ),
                    key: c.id + ' U-value',
                  });
                  windowChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>SHGC : </span>
                        <InputNumber
                          value={1 - ((c as WindowModel).opacity ?? 0.5)}
                          precision={2}
                          min={0}
                          max={1}
                          step={0.01}
                          disabled={c.locked}
                          onChange={(value) => {
                            if (value !== null) {
                              useStore.getState().set((state) => {
                                const el = state.elements.find((e) => e.id === c.id);
                                if (el) {
                                  (el as WindowModel).opacity = 1 - value;
                                }
                              });
                            }
                          }}
                        />
                      </Space>
                    ),
                    key: c.id + ' shgc',
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
                  solarPanelChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>{t('pvModelPanel.Model', lang)} : </span>
                        <span>{(c as SolarPanelModel).pvModelName}</span>
                      </Space>
                    ),
                    key: c.id + ' Model',
                  });
                  solarPanelChildren.push({
                    checkable: false,
                    title: createSolarPanelOrientationRadioGroup(c as SolarPanelModel),
                    key: c.id + ' Orientation',
                  });
                  solarPanelChildren.push(...getCoordinates(c));
                  solarPanelChildren.push(...getDimension(c));
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
              title: (
                <Space>
                  <span>{t('word.RValue', lang)} : </span>
                  <InputNumber
                    value={(s as RoofModel).rValue ?? DEFAULT_ROOF_R_VALUE}
                    precision={2}
                    min={0.01}
                    max={100}
                    step={0.05}
                    disabled={s.locked}
                    onChange={(value) => {
                      if (value !== null) {
                        useStore.getState().set((state) => {
                          const el = state.elements.find((e) => e.id === s.id);
                          if (el) {
                            (el as RoofModel).rValue = value;
                          }
                        });
                      }
                    }}
                  />
                  m²·℃/W
                </Space>
              ),
              key: s.id + ' R-value',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('word.VolumetricHeatCapacity', lang)} : </span>
                  <InputNumber
                    value={(s as RoofModel).volumetricHeatCapacity ?? 0.5}
                    precision={2}
                    min={0.01}
                    max={100}
                    step={0.05}
                    disabled={s.locked}
                    onChange={(value) => {
                      if (value !== null) {
                        useStore.getState().set((state) => {
                          const el = state.elements.find((e) => e.id === s.id);
                          if (el) {
                            (el as RoofModel).volumetricHeatCapacity = value;
                          }
                        });
                      }
                    }}
                  />
                  kWh/(m³·℃)
                </Space>
              ),
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
          }
          if (s.type !== ObjectType.Roof) {
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
            title: (
              <Space>
                <span>{t('foundationMenu.GroundFloorRValue', lang)} : </span>
                <InputNumber
                  value={f.rValue ?? 2}
                  precision={2}
                  min={0.01}
                  max={100}
                  step={0.05}
                  disabled={f.locked}
                  onChange={(value) => {
                    if (value !== null) {
                      useStore.getState().set((state) => {
                        const el = state.elements.find((e) => e.id === f.id);
                        if (el) {
                          (el as FoundationModel).rValue = value;
                        }
                      });
                    }
                  }}
                />
                m²·℃/W
              </Space>
            ),
            key: f.id + ' R-value',
          });
        }
        children.push({
          checkable: false,
          title: createAzimuthInput(f),
          key: f.id + ' Azimuth',
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
              title: createLxInput(e, t('treeMenu.Spread', lang), 1, 100, 1),
              key: e.id + ' Spread',
            });
            properties.push({
              checkable: false,
              title: createLzInput(e, t('word.Height', lang), 1, 100, 1),
              key: e.id + ' Height',
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
                  title: createLxInput(s, t('treeMenu.Spread', lang), 1, 100, 1),
                  key: s.id + ' Spread',
                });
                grandChildren.push({
                  checkable: false,
                  title: createLzInput(s, t('word.Height', lang), 1, 100, 1),
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
                  title: (
                    <Space>
                      <span>{t('pvModelPanel.Model', lang)} : </span>
                      <span>{solarPanel.pvModelName}</span>
                    </Space>
                  ),
                  key: s.id + ' Model',
                });
                grandChildren.push({
                  checkable: false,
                  title: createSolarPanelOrientationRadioGroup(s as SolarPanelModel),
                  key: s.id + ' Orientation',
                });
                grandChildren.push({
                  checkable: false,
                  title: createSolarPanelTiltAngleInput(s as SolarPanelModel),
                  key: s.id + ' Tilt Angle',
                });
                grandChildren.push(...getDimension(s));
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
              title: createAzimuthInput(e),
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
  }, [elements, lang]);
};
