/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import * as Selector from './stores/selector';
import React, { useMemo } from 'react';
import { InputNumber, Space, Tooltip, TreeDataNode } from 'antd';
import { ObjectType } from './types';
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

  const getCoordinates = (e: ElementModel) => {
    return [
      {
        checkable: false,
        title: (
          <Space>
            <span>x : </span>
            <InputNumber value={e.cx} precision={2} />
          </Space>
        ),
        key: e.id + ' x',
      },
      {
        checkable: false,
        title: (
          <Space>
            <span>y : </span>
            <InputNumber value={e.cy} precision={2} />
          </Space>
        ),
        key: e.id + ' y',
      },
      {
        checkable: false,
        title: (
          <Space>
            <span>z : </span>
            <InputNumber value={e.cz} precision={2} />
          </Space>
        ),
        key: e.id + ' z',
      },
    ];
  };

  const getDimension = (e: ElementModel) => {
    return [
      {
        checkable: false,
        title: (
          <Space>
            <span>Lx : </span>
            <InputNumber value={e.lx} precision={2} />
          </Space>
        ),
        key: e.id + ' lx',
      },
      {
        checkable: false,
        title: (
          <Space>
            <span>Ly : </span>
            <InputNumber value={e.ly} precision={2} />
          </Space>
        ),
        key: e.id + ' ly',
      },
      {
        checkable: false,
        title: (
          <Space>
            <span>Lz : </span>
            <InputNumber value={e.lz} precision={2} />
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

  return useMemo(() => {
    const array: TreeDataNode[] = [];
    for (const e of elements) {
      if (e.type === ObjectType.Foundation) {
        const foundationChildren = getChildren(e.id);
        const children: TreeDataNode[] = [];
        for (const s of foundationChildren) {
          const grandChildren: TreeDataNode[] = [];
          switch (s.type) {
            case ObjectType.Tree: {
              const treeModel = s as TreeModel;
              grandChildren.push({
                checkable: false,
                title: <span>Type : {treeModel.name}</span>,
                key: s.id + ' Name',
              });
              grandChildren.push({
                checkable: false,
                title: (
                  <Space>
                    <span>Spread : </span>
                    <InputNumber value={treeModel.lx} precision={2} />
                  </Space>
                ),
                key: s.id + ' Spread',
              });
              grandChildren.push({
                checkable: false,
                title: (
                  <Space>
                    <span>Height : </span>
                    <InputNumber value={treeModel.lz} precision={2} />
                  </Space>
                ),
                key: s.id + ' Height',
              });
              break;
            }
            case ObjectType.Flower: {
              grandChildren.push({
                checkable: false,
                title: <span>Type : {(s as FlowerModel).name}</span>,
                key: s.id + ' Name',
              });
              break;
            }
            case ObjectType.Human: {
              grandChildren.push({
                checkable: false,
                title: <span>Name : {(s as HumanModel).name}</span>,
                key: s.id + ' Name',
              });
              break;
            }
          }
          grandChildren.push(...getCoordinates(s));
          if (s.type === ObjectType.Wall) {
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>R-value : </span>
                  <InputNumber value={(s as WallModel).rValue ?? DEFAULT_WALL_R_VALUE} precision={2} />
                </Space>
              ),
              key: s.id + ' R-value',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>Volumetric Heat Capacity : </span>
                  <InputNumber value={(s as WallModel).volumetricHeatCapacity ?? 0.5} precision={2} />
                </Space>
              ),
              key: s.id + ' Heat Capacity',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>Thickness : </span>
                  <InputNumber value={(s as WallModel).ly} precision={2} />
                </Space>
              ),
              key: s.id + ' Thickness',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>Height : </span>
                  <InputNumber value={(s as WallModel).lz} precision={2} />
                </Space>
              ),
              key: s.id + ' Height',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>Eaves Overhang Length : </span>
                  <InputNumber value={(s as WallModel).eavesLength} precision={2} />
                </Space>
              ),
              key: s.id + ' Overhang',
            });
            const wallChildren = getChildren(s.id);
            for (const c of wallChildren) {
              switch (c.type) {
                case ObjectType.Window: {
                  const windowChildren: TreeDataNode[] = [];
                  windowChildren.push(...getCoordinates(c));
                  windowChildren.push(...getDimension(c));
                  windowChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>U-value : </span>
                        <InputNumber value={(c as WindowModel).uValue ?? DEFAULT_WINDOW_U_VALUE} precision={2} />
                      </Space>
                    ),
                    key: c.id + ' U-value',
                  });
                  windowChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>SHGC : </span>
                        <InputNumber value={1 - (c as WindowModel).opacity ?? 0.5} precision={2} />
                      </Space>
                    ),
                    key: c.id + ' shgc',
                  });
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(c.id, c.type),
                    key: c.id,
                    children: windowChildren,
                  });
                  break;
                }
                case ObjectType.Door: {
                  const doorChildren: TreeDataNode[] = [];
                  doorChildren.push(...getCoordinates(c));
                  doorChildren.push(...getDimension(c));
                  doorChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>U-value : </span>
                        <InputNumber value={(c as DoorModel).uValue ?? DEFAULT_DOOR_U_VALUE} precision={2} />
                      </Space>
                    ),
                    key: c.id + ' U-value',
                  });
                  doorChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>Volumetric Heat Capacity : </span>
                        <InputNumber value={(c as DoorModel).volumetricHeatCapacity ?? 0.5} precision={2} />
                      </Space>
                    ),
                    key: c.id + ' Heat Capacity',
                  });
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(c.id, c.type),
                    key: c.id,
                    children: doorChildren,
                  });
                  break;
                }
                case ObjectType.SolarPanel: {
                  const solarPanelChildren: TreeDataNode[] = [];
                  solarPanelChildren.push(...getCoordinates(c));
                  solarPanelChildren.push(...getDimension(c));
                  solarPanelChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>Model : </span>
                        <span>{(c as SolarPanelModel).pvModelName}</span>
                      </Space>
                    ),
                    key: c.id + ' Model',
                  });
                  solarPanelChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>Orientation : </span>
                        <span>{(c as SolarPanelModel).orientation}</span>
                      </Space>
                    ),
                    key: c.id + ' Orientation',
                  });
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(c.id, 'Wall-Mounted Solar Panels' + (c.label ? ' (' + c.label + ')' : '')),
                    key: c.id,
                    children: solarPanelChildren,
                  });
                  break;
                }
                case ObjectType.Sensor: {
                  const sensorChildren: TreeDataNode[] = [];
                  sensorChildren.push(...getCoordinates(c));
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(c.id, c.type),
                    key: c.id,
                    children: sensorChildren,
                  });
                  break;
                }
                case ObjectType.Light: {
                  const lightChildren: TreeDataNode[] = [];
                  lightChildren.push(...getCoordinates(c));
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(c.id, c.type),
                    key: c.id,
                    children: lightChildren,
                  });
                  break;
                }
              }
            }
          } else if (s.type === ObjectType.Roof) {
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>R-value : </span>
                  <InputNumber value={(s as RoofModel).rValue ?? DEFAULT_ROOF_R_VALUE} precision={2} />
                </Space>
              ),
              key: s.id + ' R-value',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>Volumetric Heat Capacity : </span>
                  <InputNumber value={(s as RoofModel).volumetricHeatCapacity ?? 0.5} precision={2} />
                </Space>
              ),
              key: s.id + ' Heat Capacity',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>Thickness : </span>
                  <InputNumber value={(s as RoofModel).thickness} precision={2} />
                </Space>
              ),
              key: s.id + ' Thickness',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>Rise : </span>
                  <InputNumber value={(s as RoofModel).rise} precision={2} />
                </Space>
              ),
              key: s.id + ' Rise',
            });
            const roofChildren = getChildren(s.id);
            for (const c of roofChildren) {
              switch (c.type) {
                case ObjectType.Window: {
                  const windowChildren: TreeDataNode[] = [];
                  windowChildren.push(...getCoordinates(c));
                  windowChildren.push(...getDimension(c));
                  windowChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>U-value : </span>
                        <InputNumber value={(c as WindowModel).uValue ?? DEFAULT_WINDOW_U_VALUE} precision={2} />
                      </Space>
                    ),
                    key: c.id + ' U-value',
                  });
                  windowChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>SHGC : </span>
                        <InputNumber value={1 - (c as WindowModel).opacity ?? 0.5} precision={2} />
                      </Space>
                    ),
                    key: c.id + ' shgc',
                  });
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(c.id, 'Skylight Window'),
                    key: c.id,
                    children: windowChildren,
                  });
                  break;
                }
                case ObjectType.SolarPanel: {
                  const solarPanelChildren: TreeDataNode[] = [];
                  solarPanelChildren.push(...getCoordinates(c));
                  solarPanelChildren.push(...getDimension(c));
                  solarPanelChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>Model : </span>
                        <span>{(c as SolarPanelModel).pvModelName}</span>
                      </Space>
                    ),
                    key: c.id + ' Model',
                  });
                  solarPanelChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>Orientation : </span>
                        <span>{(c as SolarPanelModel).orientation}</span>
                      </Space>
                    ),
                    key: c.id + ' Orientation',
                  });
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(c.id, 'Rooftop Solar Panels' + (c.label ? ' (' + c.label + ')' : '')),
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
                    title: createTooltip(c.id, c.type + (c.label ? ' (' + c.label + ')' : '')),
                    key: c.id,
                    children: solarWaterHeaterChildren,
                  });
                  break;
                }
                case ObjectType.Sensor: {
                  const sensorChildren: TreeDataNode[] = [];
                  sensorChildren.push(...getCoordinates(c));
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(c.id, c.type),
                    key: c.id,
                    children: sensorChildren,
                  });
                  break;
                }
                case ObjectType.Light: {
                  const lightChildren: TreeDataNode[] = [];
                  lightChildren.push(...getCoordinates(c));
                  grandChildren.push({
                    checkable: true,
                    title: createTooltip(c.id, c.type),
                    key: c.id,
                    children: lightChildren,
                  });
                  break;
                }
              }
            }
          }
          children.push({
            title: createTooltip(s.id, s.type + (s.label ? ' (' + s.label + ')' : '')),
            key: s.id,
            children: grandChildren,
          });
        }
        const f = e as FoundationModel;
        array.push({
          title: createTooltip(f.id, (f.notBuilding ? f.type : 'Building') + (f.label ? ' (' + f.label + ')' : '')),
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
              title: <span>Type : {treeModel.name}</span>,
              key: e.id + ' Name',
            });
            properties.push({
              checkable: false,
              title: (
                <Space>
                  <span>Spread : </span>
                  <InputNumber value={treeModel.lx} precision={2} />
                </Space>
              ),
              key: e.id + ' Spread',
            });
            properties.push({
              checkable: false,
              title: (
                <Space>
                  <span>Height : </span>
                  <InputNumber value={treeModel.lz} precision={2} />
                </Space>
              ),
              key: e.id + ' Height',
            });
            break;
          }
          case ObjectType.Flower: {
            properties.push({
              checkable: false,
              title: <span>Type : {(e as FlowerModel).name}</span>,
              key: e.id + ' Name',
            });
            break;
          }
          case ObjectType.Human: {
            properties.push({
              checkable: false,
              title: <span>Name : {(e as HumanModel).name}</span>,
              key: e.id + ' Name',
            });
            break;
          }
        }
        properties.push(...getCoordinates(e));
        array.push({
          title: createTooltip(e.id, e.type + (e.label ? ' (' + e.label + ')' : '')),
          key: e.id,
          children: properties,
        });
      }
    }
    return array;
  }, [elements]);
};
