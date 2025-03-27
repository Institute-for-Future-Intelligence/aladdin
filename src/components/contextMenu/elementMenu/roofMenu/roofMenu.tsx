/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */
import type { MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { RoofModel, RoofStructure, RoofType } from 'src/models/RoofModel';
import { useStore } from 'src/stores/common';
import { ObjectType, RoofTexture } from 'src/types';
import { DialogItem, Lock, MenuItem, Paste } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import { createRoofElementCounterSubmenu } from './roofElementCounterSubmenu';
import RoofThicknessInput from './roofThicknessInput';
import RoofRiseInput from './roofRiseInput';
import RoofRValueInput from './roofRValueInput';
import RoofHeatCapacityInput from './roofHeatCapacityInput';
import RoofTextureSelection from './roofTextureSelection';
import RoofColorSelection from './roofColorSelection';
import RoofSideColorSelection from './roofSideColorSelection';
import { createRoofCeilingSubmenu } from './roofCeilingSubmenu';
import { createRoofStructureSubmenu } from './roofSturctureSubmenu';
import RoofOpacityInput from './roofOpacityInput';

const legalToPaste = () => {
  const elementsToPaste = useStore.getState().elementsToPaste;
  if (elementsToPaste && elementsToPaste.length > 0) {
    const e = elementsToPaste[0];
    switch (e.type) {
      case ObjectType.Window:
      case ObjectType.SolarPanel:
      case ObjectType.SolarWaterHeater:
      case ObjectType.Sensor:
      case ObjectType.Light:
        return true;
    }
  }
  return false;
};

export const createRoofMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.Roof) return { items } as MenuProps;

  const roof = selectedElement as RoofModel;

  const editable = !roof.locked;
  const lang = { lng: useStore.getState().language };

  const countAllOffspringsByType = useStore.getState().countAllOffspringsByTypeAtOnce;

  const counterAll = countAllOffspringsByType(roof.id, true);
  const counterUnlocked = countAllOffspringsByType(roof.id, false);

  const isRoofVisible = roof.roofStructure !== RoofStructure.Rafter || roof.opacity === undefined || roof.opacity > 0;

  // roof-paste
  if (legalToPaste()) {
    items.push({
      key: 'roof-paste',
      label: <Paste />,
    });
  }

  // lock
  items.push({
    key: 'roof-lock',
    label: <Lock selectedElement={roof} />,
  });

  if (editable) {
    // roof-thickness
    items.push({
      key: 'roof-thickness',
      label: (
        <DialogItem Dialog={RoofThicknessInput}>
          {i18n.t(roof.roofStructure === RoofStructure.Rafter ? 'roofMenu.RafterThickness' : 'word.Thickness', lang)}{' '}
          ...
        </DialogItem>
      ),
    });

    // roof-rise
    items.push({
      key: 'roof-rise',
      label: <DialogItem Dialog={RoofRiseInput}>{i18n.t('roofMenu.Rise', lang)} ...</DialogItem>,
    });

    if (isRoofVisible) {
      items.push(
        {
          key: 'roof-r-value',
          label: <DialogItem Dialog={RoofRValueInput}>{i18n.t('roofMenu.RoofRValue', lang)} ...</DialogItem>,
        },
        {
          key: 'roof-heat-capacity',
          label: (
            <DialogItem Dialog={RoofHeatCapacityInput}>{i18n.t('word.VolumetricHeatCapacity', lang)} ...</DialogItem>
          ),
        },
        {
          key: 'roof-texture',
          label: <DialogItem Dialog={RoofTextureSelection}>{i18n.t('word.Texture', lang)} ...</DialogItem>,
        },
      );

      // roof-color
      if (roof.textureType === RoofTexture.NoTexture || roof.textureType === RoofTexture.Default) {
        items.push({
          key: 'roof-color',
          label: <DialogItem Dialog={RoofColorSelection}>{i18n.t('roofMenu.RoofColor', lang)} ...</DialogItem>,
        });
      }

      // roof-side-color
      items.push({
        key: 'roof-side-color',
        label: <DialogItem Dialog={RoofSideColorSelection}>{i18n.t('roofMenu.RoofSideColor', lang)} ...</DialogItem>,
      });
    }

    // roof-structure-submenu and opacity
    if (roof.roofType === RoofType.Gable) {
      // opacity
      if (roof.roofStructure === RoofStructure.Rafter || roof.roofStructure === RoofStructure.Glass) {
        items.push({
          key: 'opacity',
          label: <DialogItem Dialog={RoofOpacityInput}>{i18n.t('roofMenu.Opacity', lang)} ...</DialogItem>,
        });
      }

      items.push({
        key: 'roof-structure-submenu',
        label: <MenuItem>{i18n.t('roofMenu.RoofStructure', lang)}</MenuItem>,
        children: createRoofStructureSubmenu(roof),
      });
    }

    // roof-ceiling
    if (roof.rise > 0) {
      items.push({
        key: 'roof-ceiling-submenu',
        label: <MenuItem>{i18n.t('roofMenu.Ceiling', lang)}</MenuItem>,
        children: createRoofCeilingSubmenu(roof),
      });
    }

    if (counterAll.gotSome()) {
      // element-counter
      items.push({
        key: 'lock-unlock-clear-on-roof',
        label: <MenuItem>{i18n.t('word.Elements', lang)}</MenuItem>,
        children: createRoofElementCounterSubmenu(roof, counterAll, counterUnlocked),
      });
    }
  }

  return { items } as MenuProps;
};
