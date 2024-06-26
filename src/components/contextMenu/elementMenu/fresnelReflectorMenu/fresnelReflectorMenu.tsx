/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import type { MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { FresnelReflectorModel } from 'src/models/FresnelReflectorModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock, MenuItem } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import FresnelReflectorDrawSunBeamSelection from './fresnelReflectorDrawSunBeamSelection';
import { createLabelSubmenu } from '../../labelSubmenuItems';
import FresnelReflectorAbsorberSelection from './fresnelReflectorAbsorberSelection';
import FresnelReflectorLengthInput from './fresnelReflectorLengthInput';
import FresnelReflectorWidthInput from './fresnelReflectorWidthInput';
import FresnelReflectorModuleLengthInput from './fresnelReflectorModuleLengthInput';
import FresnelReflectorPoleHeightInput from './fresnelReflectorPoleHeightInput';
import FresnelReflectorReflectanceInput from './fresnelReflectorReflectanceInput';

export const createFresnelReflectorMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.FresnelReflector) return { items };

  const fresnelReflector = selectedElement as FresnelReflectorModel;

  const lang = { lng: useStore.getState().language };
  const editable = !fresnelReflector.locked;

  items.push({
    key: 'fresnel-reflector-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push({
      key: 'fresnel-reflector-cut',
      label: <Cut />,
    });
  }

  items.push({
    key: 'fresnel-reflector-lock',
    label: <Lock selectedElement={fresnelReflector} />,
  });

  if (editable) {
    items.push(
      {
        key: 'fresnel-reflector-receiver',
        label: (
          <DialogItem Dialog={FresnelReflectorAbsorberSelection}>
            {i18n.t('fresnelReflectorMenu.SelectAbsorberToReflectSunlightTo', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'fresnel-reflector-length',
        label: <DialogItem Dialog={FresnelReflectorLengthInput}>{i18n.t('word.Length', lang)} ...</DialogItem>,
      },
      {
        key: 'fresnel-reflector-width',
        label: <DialogItem Dialog={FresnelReflectorWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>,
      },
      {
        key: 'fresnel-reflector-module-length',
        label: (
          <DialogItem Dialog={FresnelReflectorModuleLengthInput}>
            {i18n.t('fresnelReflectorMenu.ModuleLength', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'fresnel-reflector-pole-height',
        label: (
          <DialogItem Dialog={FresnelReflectorPoleHeightInput}>
            {i18n.t('solarCollectorMenu.ExtraPoleHeight', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'fresnel-reflector-reflectance',
        label: (
          <DialogItem Dialog={FresnelReflectorReflectanceInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorReflectance', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'fresnel-reflector-draw-sun-beam',
        label: (
          <DialogItem Dialog={FresnelReflectorDrawSunBeamSelection}>
            {i18n.t('solarCollectorMenu.DrawSunBeam', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'fresnel-reflector-label-submenu',
        label: <MenuItem>{i18n.t('labelSubMenu.Label', lang)}</MenuItem>,
        children: createLabelSubmenu(fresnelReflector),
      },
    );
  }

  return { items } as MenuProps;
};
