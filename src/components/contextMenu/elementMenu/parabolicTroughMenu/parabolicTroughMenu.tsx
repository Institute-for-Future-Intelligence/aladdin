/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import type { MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock, MenuItem, SolarCollectorSunBeamCheckbox } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import { createLabelSubmenu } from '../../labelSubmenuItems';
import { ParabolicTroughModel } from 'src/models/ParabolicTroughModel';
import ParabolicTroughLengthInput from './parabolicTroughLengthInput';
import ParabolicTroughWidthInput from './parabolicTroughWidthInput';
import ParabolicTroughModuleLengthInput from './parabolicTroughModuleLengthInput';
import ParabolicTroughLatusRectumInput from './parabolicTroughLatusRectumInput';
import ParabolicTroughPoleHeightInput from './parabolicTroughPoleHeightInput';
import ParabolicTroughReflectanceInput from './parabolicTroughReflectanceInput';
import ParabolicTroughAbsorptanceInput from './parabolicTroughAbsorptanceInput';
import ParabolicTroughOpticalEfficiencyInput from './parabolicTroughOpticalEfficiencyInput';
import ParabolicTroughThermalEfficiencyInput from './parabolicTroughThermalEfficiencyInput';

export const createParabolicTroughMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.ParabolicTrough) return { items };

  const parabolicTrough = selectedElement as ParabolicTroughModel;

  const lang = { lng: useStore.getState().language };
  const editable = !parabolicTrough.locked;

  items.push({
    key: 'parabolic-trough-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push({
      key: 'parabolic-trough-cut',
      label: <Cut />,
    });
  }

  items.push({
    key: 'parabolic-trough-lock',
    label: <Lock selectedElement={parabolicTrough} />,
  });

  if (editable) {
    items.push(
      {
        key: 'parabolic-trough-length',
        label: <DialogItem Dialog={ParabolicTroughLengthInput}>{i18n.t('word.Length', lang)} ...</DialogItem>,
      },
      {
        key: 'parabolic-trough-width',
        label: <DialogItem Dialog={ParabolicTroughWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>,
      },
      {
        key: 'parabolic-trough-module-length',
        label: (
          <DialogItem Dialog={ParabolicTroughModuleLengthInput}>
            {i18n.t('parabolicTroughMenu.ModuleLength', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'parabolic-trough-latus-rectum',
        label: (
          <DialogItem Dialog={ParabolicTroughLatusRectumInput}>
            {i18n.t('parabolicTroughMenu.LatusRectum', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'parabolic-trough-pole-height',
        label: (
          <DialogItem Dialog={ParabolicTroughPoleHeightInput}>
            {i18n.t('solarCollectorMenu.ExtraPoleHeight', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'parabolic-trough-reflectance',
        label: (
          <DialogItem Dialog={ParabolicTroughReflectanceInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorReflectance', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'parabolic-trough-absorptance',
        label: (
          <DialogItem Dialog={ParabolicTroughAbsorptanceInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReceiverAbsorptance', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'parabolic-trough-optical-efficiency',
        label: (
          <DialogItem Dialog={ParabolicTroughOpticalEfficiencyInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorOpticalEfficiency', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'parabolic-trough-thermal-efficiency',
        label: (
          <DialogItem Dialog={ParabolicTroughThermalEfficiencyInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReceiverThermalEfficiency', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'parabolic-dish-draw-sun-beam',
        label: <SolarCollectorSunBeamCheckbox solarCollector={parabolicTrough} />,
      },
      {
        key: 'parabolic-trough-label-submenu',
        label: <MenuItem>{i18n.t('labelSubMenu.Label', lang)}</MenuItem>,
        children: createLabelSubmenu(parabolicTrough),
      },
    );
  }

  return { items } as MenuProps;
};
