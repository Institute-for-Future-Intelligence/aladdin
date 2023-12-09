/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import type { MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock, MenuItem, SolarCollectorSunBeamCheckbox } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import { createLabelSubmenu } from '../../labelSubmenuItems';
import { ParabolicDishModel } from 'src/models/ParabolicDishModel';
import ParabolicDishDiameterInput from './parabolicDishDiameterInput';
import ParabolicDishLatusRectumInput from './parabolicDishLatusRectumInput';
import ParabolicDishStructureTypeInput from './parabolicDishStructureTypeInput';
import ParabolicDishPoleHeightInput from './parabolicDishPoleHeightInput';
import ParabolicDishPoleRadiusInput from './parabolicDishPoleRadiusInput';
import ParabolicDishReflectanceInput from './parabolicDishReflectanceInput';
import ParabolicDishAbsorptanceInput from './parabolicDishAbsorptanceInput';
import ParabolicDishOpticalEfficiencyInput from './parabolicDishOpticalEfficiencyInput';
import ParabolicDishThermalEfficiencyInput from './parabolicDishThermalEfficiencyInput';

export const createParabolicDishMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.ParabolicDish) return { items };

  const parabolicDish = selectedElement as ParabolicDishModel;

  const lang = { lng: useStore.getState().language };
  const editable = !parabolicDish.locked;

  // lock
  items.push({
    key: 'parabolic-dish-lock',
    label: <Lock selectedElement={parabolicDish} />,
  });

  if (editable) {
    items.push(
      // draw-sun-beam
      {
        key: 'parabolic-dish-draw-sun-beam',
        label: <SolarCollectorSunBeamCheckbox solarCollector={parabolicDish} />,
      },
      // cut
      {
        key: 'parabolic-dish-cut',
        label: <Cut />,
      },
    );
  }

  // copy
  items.push({
    key: 'parabolic-dish-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push(
      // parabolic-dish-radius
      {
        key: 'parabolic-dish-radius',
        label: (
          <DialogItem Dialog={ParabolicDishDiameterInput}>
            {i18n.t('parabolicDishMenu.RimDiameter', lang)} ...
          </DialogItem>
        ),
      },
      // parabolic-dish-latus-rectum
      {
        key: 'parabolic-dish-latus-rectum',
        label: (
          <DialogItem Dialog={ParabolicDishLatusRectumInput}>
            {i18n.t('parabolicDishMenu.LatusRectum', lang)} ...
          </DialogItem>
        ),
      },
      // parabolic-dish-structure-type
      {
        key: 'parabolic-dish-structure-type',
        label: (
          <DialogItem Dialog={ParabolicDishStructureTypeInput}>
            {i18n.t('parabolicDishMenu.ReceiverStructure', lang)} ...
          </DialogItem>
        ),
      },
      // parabolic-dish-pole-height
      {
        key: 'parabolic-dish-pole-height',
        label: (
          <DialogItem Dialog={ParabolicDishPoleHeightInput}>
            {i18n.t('solarCollectorMenu.ExtraPoleHeight', lang)} ...
          </DialogItem>
        ),
      },
      // parabolic-dish-pole-radius
      {
        key: 'parabolic-dish-pole-radius',
        label: (
          <DialogItem Dialog={ParabolicDishPoleRadiusInput}>
            {i18n.t('solarCollectorMenu.PoleRadius', lang)} ...
          </DialogItem>
        ),
      },
      // parabolic-dish-reflectance
      {
        key: 'parabolic-dish-reflectance',
        label: (
          <DialogItem Dialog={ParabolicDishReflectanceInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorReflectance', lang)} ...
          </DialogItem>
        ),
      },
      // parabolic-dish-absorptance
      {
        key: 'parabolic-dish-absorptance',
        label: (
          <DialogItem Dialog={ParabolicDishAbsorptanceInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReceiverAbsorptance', lang)} ...
          </DialogItem>
        ),
      },
      // parabolic-dish-optical-efficiency
      {
        key: 'parabolic-dish-optical-efficiency',
        label: (
          <DialogItem Dialog={ParabolicDishOpticalEfficiencyInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorOpticalEfficiency', lang)} ...
          </DialogItem>
        ),
      },
      // parabolic-dish-thermal-efficiency
      {
        key: 'parabolic-dish-thermal-efficiency',
        label: (
          <DialogItem Dialog={ParabolicDishThermalEfficiencyInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReceiverThermalEfficiency', lang)} ...
          </DialogItem>
        ),
      },
      // parabolic-dish-label-submenu
      {
        key: 'parabolic-dish-label-submenu',
        label: <MenuItem>{i18n.t('labelSubMenu.Label', lang)}</MenuItem>,
        children: createLabelSubmenu(parabolicDish),
      },
    );
  }

  return { items } as MenuProps;
};
