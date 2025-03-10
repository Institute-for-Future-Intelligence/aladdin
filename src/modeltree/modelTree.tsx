/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { GetRef, Tree, TreeDataNode } from 'antd';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useLanguage } from '../hooks';
import { useTranslation } from 'react-i18next';
import { GROUND_ID } from '../constants';
import { ObjectType } from '../types';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { FoundationModel } from '../models/FoundationModel';
import { RoofModel } from '../models/RoofModel';
import { WallModel } from '../models/WallModel';
import { ParabolicDishModel } from '../models/ParabolicDishModel';
import { ParabolicTroughModel } from '../models/ParabolicTroughModel';
import { FresnelReflectorModel } from '../models/FresnelReflectorModel';
import { WindTurbineModel } from '../models/WindTurbineModel';
import { TreeModel } from '../models/TreeModel';
import { FlowerModel } from '../models/FlowerModel';
import { HumanModel } from '../models/HumanModel';
import { PolygonModel } from '../models/PolygonModel';
import { HeliostatModel } from '../models/HeliostatModel';
import LabelInput from './labelInput';
import ColorInput from './colorInput';
import AzimuthInput from './azimuthInput';
import RValueInput from './rValueInput';
import { createTooltip, getCoordinates, getDimension, i18nType } from './modelTreeUtils';
import {
  createBatteryStorageNode,
  createFlowerNode,
  createFresnelReflectorNode,
  createHeliostatNode,
  createHumanNode,
  createLightNode,
  createParabolicDishNode,
  createParabolicTroughNode,
  createPolygonNode,
  createRoofNode,
  createSensorNode,
  createSolarPanelNode,
  createTreeNode,
  createWallNode,
  createWindTurbineNode,
} from './modelTreeFactory';
import { BatteryStorageModel } from '../models/BatteryStorageModel';
import { LightModel } from '../models/LightModel';
import { SensorModel } from '../models/SensorModel';
import FoundationTextureInput from './foundationTextureInput';
import TransparencyInput from './transparencyInput';
import { CuboidModel } from '../models/CuboidModel';

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

  const lang = useLanguage();
  const { t } = useTranslation();

  const modelTree = useMemo(() => {
    const array: TreeDataNode[] = [];
    for (const e of elements) {
      if (e.type === ObjectType.Foundation) {
        const foundationChildren = getChildren(e.id);
        const children: TreeDataNode[] = [];
        for (const s of foundationChildren) {
          const grandChildren: TreeDataNode[] = [];
          switch (s.type) {
            case ObjectType.BatteryStorage:
              grandChildren.push(...createBatteryStorageNode(s as BatteryStorageModel));
              break;
            case ObjectType.ParabolicDish:
              grandChildren.push(...createParabolicDishNode(s as ParabolicDishModel));
              break;
            case ObjectType.ParabolicTrough:
              grandChildren.push(...createParabolicTroughNode(s as ParabolicTroughModel));
              break;
            case ObjectType.Heliostat:
              grandChildren.push(...createHeliostatNode(s as HeliostatModel));
              break;
            case ObjectType.FresnelReflector:
              grandChildren.push(...createFresnelReflectorNode(s as FresnelReflectorModel));
              break;
            case ObjectType.WindTurbine:
              grandChildren.push(...createWindTurbineNode(s as WindTurbineModel));
              break;
            case ObjectType.Tree:
              grandChildren.push(...createTreeNode(s as TreeModel));
              break;
            case ObjectType.Flower:
              grandChildren.push(...createFlowerNode(s as FlowerModel));
              break;
            case ObjectType.Human:
              grandChildren.push(...createHumanNode(s as HumanModel));
              break;
            case ObjectType.Polygon:
              grandChildren.push(...createPolygonNode(s as PolygonModel));
              break;
            case ObjectType.SolarPanel:
              grandChildren.push(...createSolarPanelNode(s as SolarPanelModel));
              break;
            case ObjectType.Light:
              grandChildren.push(...createLightNode(s as LightModel));
              break;
            case ObjectType.Sensor:
              grandChildren.push(...createSensorNode(s as SensorModel));
              break;
            case ObjectType.Wall:
              grandChildren.push(...createWallNode(s as WallModel));
              break;
            case ObjectType.Roof:
              grandChildren.push(...createRoofNode(s as RoofModel));
              break;
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
          title: <ColorInput element={f} defaultColor={'#808080'} />,
          key: f.id + ' Color',
        });
        children.push({
          checkable: false,
          title: <FoundationTextureInput foundation={f} />,
          key: f.id + ' Texture',
        });
        children.push({
          checkable: false,
          title: <LabelInput element={f} />,
          key: f.id + ' Label',
        });
        children.push(...getDimension(f));
        children.push(...getCoordinates(f));
        array.push({
          title: createTooltip(
            f.id,
            (f.notBuilding ? i18nType(f) : t('word.Building', lang)) + (f.label ? ' (' + f.label + ')' : ''),
          ),
          key: f.id,
          children,
        });
      } else if (e.type === ObjectType.Cuboid) {
        const children: TreeDataNode[] = [];
        const cuboidElements = getChildren(e.id);
        for (const s of cuboidElements) {
          const grandChildren: TreeDataNode[] = [];
          switch (s.type) {
            case ObjectType.Tree:
              grandChildren.push(...createTreeNode(s as TreeModel));
              break;
            case ObjectType.Flower:
              grandChildren.push(...createFlowerNode(s as FlowerModel));
              break;
            case ObjectType.Human:
              grandChildren.push(...createHumanNode(s as HumanModel));
              break;
            case ObjectType.Polygon:
              grandChildren.push(...createPolygonNode(s as PolygonModel));
              break;
            case ObjectType.SolarPanel:
              grandChildren.push(...createSolarPanelNode(s as SolarPanelModel));
              break;
            case ObjectType.Sensor:
              grandChildren.push(...createSensorNode(s as SensorModel, true));
              break;
            case ObjectType.Light:
              grandChildren.push(...createLightNode(s as LightModel, true));
              break;
          }
          children.push({
            title: createTooltip(s.id, i18nType(s) + (s.label ? ' (' + s.label + ')' : '')),
            key: s.id,
            children: grandChildren,
          });
        }
        children.push({
          checkable: false,
          title: <AzimuthInput element={e} />,
          key: e.id + ' Azimuth',
        });
        children.push({
          checkable: false,
          title: <TransparencyInput cuboid={e as CuboidModel} />,
          key: e.id + ' Transparency',
        });
        children.push({
          checkable: false,
          title: <LabelInput element={e} />,
          key: e.id + ' Label',
        });
        children.push(...getDimension(e));
        children.push(...getCoordinates(e));
        array.push({
          title: createTooltip(e.id, i18nType(e) + (e.label ? ' (' + e.label + ')' : '')),
          key: e.id,
          children,
        });
      } else if (e.parentId === GROUND_ID) {
        const children: TreeDataNode[] = [];
        switch (e.type) {
          case ObjectType.Tree:
            children.push(...createTreeNode(e as TreeModel));
            break;
          case ObjectType.Flower:
            children.push(...createFlowerNode(e as FlowerModel));
            break;
          case ObjectType.Human:
            children.push(...createHumanNode(e as HumanModel));
            break;
        }
        array.push({
          title: createTooltip(e.id, i18nType(e) + (e.label ? ' (' + e.label + ')' : '')),
          key: e.id,
          children,
        });
      }
    }
    return array;
  }, [elements, lang]);

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
