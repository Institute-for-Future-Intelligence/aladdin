/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import * as Selector from './stores/selector';
import React, { useMemo } from 'react';
import { InputNumber, Space, TreeDataNode } from 'antd';
import { ObjectType } from './types';
import { HumanModel } from './models/HumanModel';
import { GROUND_ID } from './constants';
import { TreeModel } from './models/TreeModel';
import { ElementModel } from './models/ElementModel';
import { FlowerModel } from './models/FlowerModel';
import { WindowModel } from './models/WindowModel';
import { DoorModel } from './models/DoorModel';
import { SolarPanelModel } from './models/SolarPanelModel';

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

  const getHumanTreeFlowerName = (e: ElementModel) => {
    let name = undefined;
    if (e.type === ObjectType.Human || e.type === ObjectType.Flower || e.type === ObjectType.Tree) {
      if (e.type === ObjectType.Tree) {
        name = (e as TreeModel).name;
      } else if (e.type === ObjectType.Flower) {
        name = (e as FlowerModel).name;
      } else if (e.type === ObjectType.Human) {
        name = (e as HumanModel).name;
      }
    }
    return name;
  };

  return useMemo(() => {
    const array: TreeDataNode[] = [];
    for (const e of elements) {
      if (e.type === ObjectType.Foundation) {
        const foundationChildren = getChildren(e.id);
        const children: TreeDataNode[] = [];
        for (const s of foundationChildren) {
          const grandChildren: TreeDataNode[] = [];
          const name = getHumanTreeFlowerName(s);
          if (name) {
            grandChildren.push({
              checkable: false,
              title: <span>Name : {name}</span>,
              key: s.id + ' Name',
            });
          }
          grandChildren.push(...getCoordinates(s));
          if (s.type === ObjectType.Wall) {
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
                        <InputNumber value={(c as WindowModel).uValue ?? 2.0} precision={2} />
                      </Space>
                    ),
                    key: c.id + ' u-value',
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
                    title: <span>{c.type}</span>,
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
                        <InputNumber value={(c as DoorModel).uValue ?? 2.0} precision={2} />
                      </Space>
                    ),
                    key: c.id + ' u-value',
                  });
                  grandChildren.push({
                    checkable: true,
                    title: <span>{c.type}</span>,
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
                    key: c.id + ' model',
                  });
                  grandChildren.push({
                    checkable: true,
                    title: <span>{c.type}</span>,
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
                    title: <span>{c.type}</span>,
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
                    title: <span>{c.type}</span>,
                    key: c.id,
                    children: lightChildren,
                  });
                  break;
                }
              }
            }
          } else if (s.type === ObjectType.Roof) {
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
                        <InputNumber value={(c as WindowModel).uValue ?? 2.0} precision={2} />
                      </Space>
                    ),
                    key: c.id + ' u-value',
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
                    title: <span>{c.type}</span>,
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
                    key: c.id + ' model',
                  });
                  grandChildren.push({
                    checkable: true,
                    title: <span>{c.type}</span>,
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
                    title: <span>{c.type}</span>,
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
                    title: <span>{c.type}</span>,
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
                    title: <span>{c.type}</span>,
                    key: c.id,
                    children: lightChildren,
                  });
                  break;
                }
              }
            }
          }
          children.push({
            title: <span>{s.type + (s.label ? ' (' + s.label + ')' : '')}</span>,
            key: s.id,
            children: grandChildren,
          });
        }
        array.push({
          title: e.type + (e.label ? ' (' + e.label + ')' : ''),
          key: e.id,
          children,
        });
      } else if (e.parentId === GROUND_ID) {
        const properties: TreeDataNode[] = [];
        const name = getHumanTreeFlowerName(e);
        if (name) {
          properties.push({
            checkable: false,
            title: <span>Name : {name}</span>,
            key: e.id + ' Name',
          });
        }
        properties.push(...getCoordinates(e));
        array.push({
          title: e.type + (e.label ? ' (' + e.label + ')' : ''),
          key: e.id,
          children: properties,
        });
      }
    }
    return array;
  }, [elements]);
};
