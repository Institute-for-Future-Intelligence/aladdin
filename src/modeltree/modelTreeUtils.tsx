/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from '../models/ElementModel';
import { ObjectType } from '../types';
import { GROUND_ID } from '../constants';
import { InputNumber, Space, Tooltip } from 'antd';
import React from 'react';
import { useStore } from '../stores/common';
import i18n from '../i18n/i18n';
import { FoundationModel } from 'src/models/FoundationModel';
import { Util } from 'src/Util';

const handleCoordinateChange = (element: ElementModel, prop: 'cx' | 'cy' | 'cz', value: number) => {
  if (element.parentId === GROUND_ID && prop === 'cz') return;
  useStore.getState().set((state) => {
    const el = state.elements.find((e) => e.id === element.id);
    if (el) {
      el[prop] = value;
    }
  });
};

export const getCoordinates = (e: ElementModel, relative?: boolean) => {
  const lang = { lng: useStore.getState().language };
  // hardcode the rules for allowing and disallowing coordinate changes from the model tree
  const parent = useStore.getState().getParent(e);
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
    (parent?.type === ObjectType.Roof && e.type === ObjectType.Window) ||
    e.type === ObjectType.Door ||
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
          {i18n.t(relative ? 'word.Relative' : 'word.MeterAbbreviation', lang)}
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
          {i18n.t(relative ? 'word.Relative' : 'word.MeterAbbreviation', lang)}
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
          {i18n.t(relative ? 'word.Relative' : 'word.MeterAbbreviation', lang)}
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
    if (prop !== 'ly' && el?.type === ObjectType.Foundation && (el as FoundationModel).enableSlope) {
      const foundation = el as FoundationModel;
      for (const child of state.elements) {
        if (
          child.parentId === foundation.id &&
          (child.type === ObjectType.SolarPanel || child.type === ObjectType.BatteryStorage)
        ) {
          child.cz = foundation.lz / 2 + Util.getZOnSlope(foundation.lx, foundation.slope, child.cx);
        }
      }
    }
  });
};

export const getDimension = (e: ElementModel, relative?: boolean) => {
  const lang = { lng: useStore.getState().language };
  const parent = useStore.getState().getParent(e);
  const disableAll = e.locked;
  const disableY = e.type == ObjectType.SolarWaterHeater || e.type === ObjectType.Window || e.type === ObjectType.Door;
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
          {i18n.t('word.MeterAbbreviation', lang)}
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
          {i18n.t('word.MeterAbbreviation', lang)}
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
          {i18n.t('word.MeterAbbreviation', lang)}
        </Space>
      ),
      key: e.id + ' lz',
    },
  ];
};

export const createTooltip = (id: string | null, text: string) => {
  return (
    <Tooltip
      placement={'right'}
      title={id ? 'ID: ' + id : undefined}
      color={'white'}
      styles={{ body: { color: 'gray', fontSize: '12px' } }}
    >
      <span>{text}</span>
    </Tooltip>
  );
};

export const i18nType = (e: ElementModel) => {
  const lang = { lng: useStore.getState().language };
  switch (e.type) {
    case ObjectType.Human: {
      return i18n.t('shared.HumanElement', lang);
    }
    case ObjectType.Flower: {
      return i18n.t('shared.FlowerElement', lang);
    }
    case ObjectType.Tree: {
      return i18n.t('shared.TreeElement', lang);
    }
    case ObjectType.Polygon: {
      return i18n.t('shared.PolygonElement', lang);
    }
    case ObjectType.Foundation: {
      return i18n.t('shared.FoundationElement', lang);
    }
    case ObjectType.Cuboid: {
      return i18n.t('shared.CuboidElement', lang);
    }
    case ObjectType.Wall: {
      return i18n.t('shared.WallElement', lang);
    }
    case ObjectType.Roof: {
      return i18n.t('shared.RoofElement', lang);
    }
    case ObjectType.Window: {
      return i18n.t('shared.WindowElement', lang);
    }
    case ObjectType.Door: {
      return i18n.t('shared.DoorElement', lang);
    }
    case ObjectType.SolarWaterHeater: {
      return i18n.t('shared.SolarWaterHeaterElement', lang);
    }
    case ObjectType.Sensor: {
      return i18n.t('shared.SensorElement', lang);
    }
    case ObjectType.Light: {
      return i18n.t('shared.LightElement', lang);
    }
    case ObjectType.SolarPanel: {
      const parent = useStore.getState().getElementById(e.parentId);
      return i18n.t(
        parent?.type === ObjectType.Foundation ? 'modelTree.GroundMountedSolarPanels' : 'shared.SolarPanelElement',
        lang,
      );
    }
    case ObjectType.ParabolicDish: {
      return i18n.t('shared.ParabolicDishElement', lang);
    }
    case ObjectType.ParabolicTrough: {
      return i18n.t('shared.ParabolicTroughElement', lang);
    }
    case ObjectType.FresnelReflector: {
      return i18n.t('shared.FresnelReflectorElement', lang);
    }
    case ObjectType.Heliostat: {
      return i18n.t('shared.HeliostatElement', lang);
    }
    case ObjectType.WindTurbine: {
      return i18n.t('shared.WindTurbineElement', lang);
    }
    case ObjectType.BatteryStorage: {
      return i18n.t('shared.BatteryStorageElement', lang);
    }
  }
  return 'Unknown';
};
