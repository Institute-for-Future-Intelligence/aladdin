/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import type { MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { WallModel, WallStructure } from 'src/models/WallModel';
import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock, MenuItem, Paste } from '../../menuItems';
import { Util } from 'src/Util';
import { useStore } from 'src/stores/common';
import i18n from 'src/i18n/i18n';
import { createWallElementCounterSubmenu } from './wallElementCounterSubmenu';
import { createParapetSubmenu } from './wallParapetSubmenu';
import { createWallStructureSubmenu } from './wallStructureSubmenu';
import { WallNumberDataType, WallNumberDialogItem } from './wallNumberDialogItem';
import WallNumberInput from './wallNumberInput';
import { AddPolygonOnWallItem } from './wallMenuItems';
import { createWallFillSubmenu } from './wallFillSubmenu';
import WallRValueInput from './wallRValueInput';
import WallHeatCapacityInput from './wallHeatCapacityInput';
import WallTextureSelection from './wallTextureSelection';
import WallColorSelection from './wallColorSelection';

export type WallNumberDialogSettingType = {
  attributeKey: keyof WallModel;
  range: [min: number, max: number];
  step: number;
  unit?: string;
};

export const WallNumberDialogSettings = {
  Height: { attributeKey: 'lz', range: [0.1, 100], step: 0.1, unit: 'word.MeterAbbreviation' },
  Opacity: { attributeKey: 'opacity', range: [0, 1], step: 0.01 },
  StructureSpacing: { attributeKey: 'structureSpacing', range: [0.1, 1000], step: 0.1, unit: 'word.MeterAbbreviation' },
  StructureWidth: { attributeKey: 'structureWidth', range: [0.01, 1], step: 0.1, unit: 'word.MeterAbbreviation' },
  Thickness: { attributeKey: 'ly', range: [0.1, 1], step: 0.01, unit: 'word.MeterAbbreviation' },
  EavesLength: { attributeKey: 'eavesLength', range: [-0.1, 5], step: 0.01, unit: 'word.MeterAbbreviation' },
  ParapetHeight: { attributeKey: 'parapetHeight', range: [0, 5], step: 0.01, unit: 'word.MeterAbbreviation' },
  CopingsHeight: { attributeKey: 'copingsHeight', range: [0, 1], step: 0.01, unit: 'word.MeterAbbreviation' },
  CopingsWidth: { attributeKey: 'copingsWidth', range: [0, 3], step: 0.01, unit: 'word.MeterAbbreviation' },
};

const legalToPaste = () => {
  const elementsToPaste = useStore.getState().elementsToPaste;
  if (elementsToPaste && elementsToPaste.length > 0) {
    const e = elementsToPaste[0];
    if (Util.isLegalOnWall(e.type)) {
      return true;
    }
  }
  return false;
};

export const createWallMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.Wall) return { items };

  const wall = selectedElement as WallModel;

  const editable = !wall.locked;
  const lang = { lng: useStore.getState().language };

  const countAllOffspringsByType = useStore.getState().countAllOffspringsByTypeAtOnce;

  const counterAll = countAllOffspringsByType(wall.id, true);
  const counterUnlocked = countAllOffspringsByType(wall.id, false);

  // lock
  items.push({
    key: 'wall-lock',
    label: <Lock selectedElement={wall} />,
  });

  // cut
  if (editable) {
    items.push({
      key: 'wall-cut',
      label: <Cut />,
    });
  }

  // copy
  items.push({
    key: 'wall-copy',
    label: <Copy />,
  });

  // paste
  if (legalToPaste()) {
    items.push({
      key: 'wall-paste',
      label: <Paste />,
    });
  }

  if (editable) {
    // element-counter
    if (counterAll.gotSome()) {
      items.push({
        key: 'lock-unlock-clear-on-wall',
        label: <MenuItem>{i18n.t('word.Elements', lang)}</MenuItem>,
        children: createWallElementCounterSubmenu(wall, counterAll, counterUnlocked),
      });
    }

    // parapet-submenu
    items.push({
      key: 'wall-parapet',
      label: <MenuItem>{i18n.t('wallMenu.Parapet', lang)}</MenuItem>,
      children: createParapetSubmenu(wall),
    });

    // structure-submenu
    items.push({
      key: 'wall-structure',
      label: <MenuItem>{i18n.t('wallMenu.WallStructure', lang)}</MenuItem>,
      children: createWallStructureSubmenu(wall),
    });

    // opacity
    if (wall.wallStructure !== WallStructure.Default) {
      items.push({
        key: 'wall-opacity',
        label: (
          <WallNumberDialogItem dataType={WallNumberDataType.Opacity} Dialog={WallNumberInput}>
            {i18n.t(`wallMenu.${WallNumberDataType.Opacity}`, lang)} ...
          </WallNumberDialogItem>
        ),
      });
    }

    items.push(
      {
        key: 'wall-fill',
        label: <MenuItem>{i18n.t('wallMenu.Fill', lang)}</MenuItem>,
        children: createWallFillSubmenu(wall),
      },
      {
        key: 'add-polygon-on-wall',
        label: <AddPolygonOnWallItem wall={wall} />,
      },
      {
        key: 'wall-thickness',
        label: (
          <WallNumberDialogItem dataType={WallNumberDataType.Thickness} Dialog={WallNumberInput}>
            {i18n.t(`wallMenu.${WallNumberDataType.Thickness}`, lang)} ...
          </WallNumberDialogItem>
        ),
      },
      {
        key: 'wall-height',
        label: (
          <WallNumberDialogItem dataType={WallNumberDataType.Height} Dialog={WallNumberInput}>
            {i18n.t(`wallMenu.${WallNumberDataType.Height}`, lang)} ...
          </WallNumberDialogItem>
        ),
      },
      {
        key: 'wall-eaves-length',
        label: (
          <WallNumberDialogItem dataType={WallNumberDataType.EavesLength} Dialog={WallNumberInput}>
            {i18n.t(`wallMenu.${WallNumberDataType.EavesLength}`, lang)} ...
          </WallNumberDialogItem>
        ),
      },
      {
        key: 'wall-r-value',
        label: <DialogItem Dialog={WallRValueInput}>{i18n.t('word.RValue', lang)} ...</DialogItem>,
      },
      {
        key: 'wall-heat-capacity',
        label: (
          <DialogItem Dialog={WallHeatCapacityInput}>{i18n.t('word.VolumetricHeatCapacity', lang)} ...</DialogItem>
        ),
      },
      {
        key: 'wall-texture',
        label: <DialogItem Dialog={WallTextureSelection}>{i18n.t('wallMenu.Texture', lang)} ...</DialogItem>,
      },
      {
        key: 'wall-color',
        label: <DialogItem Dialog={WallColorSelection}>{i18n.t('wallMenu.Color', lang)} ...</DialogItem>,
      },
    );
  }

  return { items } as MenuProps;
};
