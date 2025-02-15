/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import * as Selector from './stores/selector';
import React, { useMemo } from 'react';
import { Image, InputNumber, Space, Tooltip, TreeDataNode } from 'antd';
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
import { useTranslation } from 'react-i18next';
import { FlowerData } from './FlowerData';
import { HumanData } from './HumanData';
import { TreeData } from './TreeData';
import { Util } from './Util';
import { PolygonModel } from './models/PolygonModel';

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

  const lang = useLanguage();
  const { t } = useTranslation();

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

  const i18nType = (e: ElementModel) => {
    switch (e.type) {
      case ObjectType.Human: {
        return t('modelTree.Human', lang);
      }
      case ObjectType.Flower: {
        return t('modelTree.Flower', lang);
      }
      case ObjectType.Tree: {
        return t('modelTree.Tree', lang);
      }
      case ObjectType.Polygon: {
        return t('shared.PolygonElement', lang);
      }
      case ObjectType.Foundation: {
        return t('modelTree.Foundation', lang);
      }
      case ObjectType.Wall: {
        return t('modelTree.Wall', lang);
      }
      case ObjectType.Roof: {
        return t('modelTree.Roof', lang);
      }
      case ObjectType.Window: {
        return t('modelTree.Window', lang);
      }
      case ObjectType.Door: {
        return t('modelTree.Door', lang);
      }
      case ObjectType.SolarWaterHeater: {
        return t('modelTree.SolarWaterHeater', lang);
      }
      case ObjectType.Sensor: {
        return t('modelTree.Sensor', lang);
      }
      case ObjectType.Light: {
        return t('modelTree.Light', lang);
      }
      case ObjectType.SolarPanel: {
        return t('modelTree.GroundMountedSolarPanels', lang);
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
          if (s.type === ObjectType.Tree) {
            const treeModel = s as TreeModel;
            const n = treeModel.name;
            grandChildren.push({
              checkable: false,
              title: (
                <span>
                  {t('word.Type', lang)} : {n}{' '}
                  <Image
                    style={{ paddingLeft: '6px' }}
                    height={'16px'}
                    src={TreeData.fetchTextureImage(n, 180, 42, 90, 300)}
                  />
                </span>
              ),
              key: s.id + ' Type',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('treeMenu.Spread', lang)} : </span>
                  <InputNumber value={treeModel.lx} precision={2} />
                </Space>
              ),
              key: s.id + ' Spread',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('word.Height', lang)} : </span>
                  <InputNumber value={treeModel.lz} precision={2} />
                </Space>
              ),
              key: s.id + ' Height',
            });
          } else if (s.type === ObjectType.Flower) {
            const n = (s as FlowerModel).name;
            grandChildren.push({
              checkable: false,
              title: (
                <span>
                  {t('word.Type', lang)} : {n}{' '}
                  <Image style={{ paddingLeft: '6px' }} height={'16px'} src={FlowerData.fetchTextureImage(n, false)} />
                </span>
              ),
              key: s.id + ' Type',
            });
          } else if (s.type === ObjectType.Human) {
            const n = (s as HumanModel).name;
            grandChildren.push({
              checkable: false,
              title: (
                <span>
                  {t('word.Name', lang)} : {n}{' '}
                  <Image style={{ paddingLeft: '6px' }} height={'16px'} src={HumanData.fetchTextureImage(n)} />
                </span>
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
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('pvModelPanel.Model', lang)} : </span>
                  <span>{(s as SolarPanelModel).pvModelName}</span>
                </Space>
              ),
              key: s.id + ' Model',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('solarPanelMenu.Orientation', lang)} : </span>
                  <span>{(s as SolarPanelModel).orientation}</span>
                </Space>
              ),
              key: s.id + ' Orientation',
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
                  windowChildren.push(...getCoordinates(c));
                  windowChildren.push(...getDimension(c));
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
                        <InputNumber value={(c as DoorModel).uValue ?? DEFAULT_DOOR_U_VALUE} precision={2} />
                      </Space>
                    ),
                    key: c.id + ' U-value',
                  });
                  doorChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>{t('word.VolumetricHeatCapacity', lang)} : </span>
                        <InputNumber value={(c as DoorModel).volumetricHeatCapacity ?? 0.5} precision={2} />
                      </Space>
                    ),
                    key: c.id + ' Heat Capacity',
                  });
                  doorChildren.push(...getCoordinates(c));
                  doorChildren.push(...getDimension(c));
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
                    title: (
                      <Space>
                        <span>{t('solarPanelMenu.Orientation', lang)} : </span>
                        <span>{(c as SolarPanelModel).orientation}</span>
                      </Space>
                    ),
                    key: c.id + ' Orientation',
                  });
                  solarPanelChildren.push(...getCoordinates(c));
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
                  sensorChildren.push(...getCoordinates(c));
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
                  lightChildren.push(...getCoordinates(c));
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
                  <InputNumber value={(s as WallModel).rValue ?? DEFAULT_WALL_R_VALUE} precision={2} />
                </Space>
              ),
              key: s.id + ' R-value',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('word.VolumetricHeatCapacity', lang)} : </span>
                  <InputNumber value={(s as WallModel).volumetricHeatCapacity ?? 0.5} precision={2} />
                </Space>
              ),
              key: s.id + ' Heat Capacity',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('word.Thickness', lang)} : </span>
                  <InputNumber value={(s as WallModel).ly} precision={2} />
                </Space>
              ),
              key: s.id + ' Thickness',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('word.Height', lang)} : </span>
                  <InputNumber value={(s as WallModel).lz} precision={2} />
                </Space>
              ),
              key: s.id + ' Height',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('wallMenu.EavesLength', lang)} : </span>
                  <InputNumber value={(s as WallModel).eavesLength} precision={2} />
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
                  windowChildren.push(...getCoordinates(c));
                  windowChildren.push(...getDimension(c));
                  windowChildren.push({
                    checkable: false,
                    title: (
                      <Space>
                        <span>{t('word.UValue', lang)} : </span>
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
                    title: (
                      <Space>
                        <span>{t('solarPanelMenu.Orientation', lang)} : </span>
                        <span>{(c as SolarPanelModel).orientation}</span>
                      </Space>
                    ),
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
                  sensorChildren.push(...getCoordinates(c));
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
                  lightChildren.push(...getCoordinates(c));
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
                  <InputNumber value={(s as RoofModel).rValue ?? DEFAULT_ROOF_R_VALUE} precision={2} />
                </Space>
              ),
              key: s.id + ' R-value',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('word.VolumetricHeatCapacity', lang)} : </span>
                  <InputNumber value={(s as RoofModel).volumetricHeatCapacity ?? 0.5} precision={2} />
                </Space>
              ),
              key: s.id + ' Heat Capacity',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('word.Thickness', lang)} : </span>
                  <InputNumber value={(s as RoofModel).thickness} precision={2} />
                </Space>
              ),
              key: s.id + ' Thickness',
            });
            grandChildren.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('roofMenu.Rise', lang)} : </span>
                  <InputNumber value={(s as RoofModel).rise} precision={2} />
                </Space>
              ),
              key: s.id + ' Rise',
            });
          }
          grandChildren.push(...getCoordinates(s));
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
                <InputNumber value={f.rValue ?? 2} precision={2} />
              </Space>
            ),
            key: f.id + ' R-value',
          });
        }
        children.push({
          checkable: false,
          title: (
            <Space>
              <span>{t('word.Azimuth', lang)} : </span>
              <InputNumber value={Util.toDegrees(f.rotation[2])} precision={2} />
            </Space>
          ),
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
            const n = treeModel.name;
            properties.push({
              checkable: false,
              title: (
                <span>
                  {t('word.Type', lang)} : {n}{' '}
                  <Image
                    style={{ paddingLeft: '6px' }}
                    height={'16px'}
                    src={TreeData.fetchTextureImage(n, 180, 42, 90, 300)}
                  />
                </span>
              ),
              key: e.id + ' Type',
            });
            properties.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('treeMenu.Spread', lang)} : </span>
                  <InputNumber value={treeModel.lx} precision={2} />
                </Space>
              ),
              key: e.id + ' Spread',
            });
            properties.push({
              checkable: false,
              title: (
                <Space>
                  <span>{t('word.Height', lang)} : </span>
                  <InputNumber value={treeModel.lz} precision={2} />
                </Space>
              ),
              key: e.id + ' Height',
            });
            break;
          }
          case ObjectType.Flower: {
            const n = (e as FlowerModel).name;
            properties.push({
              checkable: false,
              title: (
                <span>
                  {t('word.Type', lang)} : {n}{' '}
                  <Image style={{ paddingLeft: '6px' }} height={'16px'} src={FlowerData.fetchTextureImage(n, false)} />
                </span>
              ),
              key: e.id + ' Type',
            });
            break;
          }
          case ObjectType.Human: {
            const n = (e as HumanModel).name;
            properties.push({
              checkable: false,
              title: (
                <span>
                  {t('word.Name', lang)} : {n}{' '}
                  <Image style={{ paddingLeft: '6px' }} height={'16px'} src={HumanData.fetchTextureImage(n)} />
                </span>
              ),
              key: e.id + ' Name',
            });
            break;
          }
        }
        properties.push(...getCoordinates(e));
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
