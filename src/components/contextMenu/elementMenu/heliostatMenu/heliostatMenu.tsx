/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import type { MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock, MenuItem } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import { createLabelSubmenu } from '../../labelSubmenuItems';
import { HeliostatModel } from 'src/models/HeliostatModel';
import HeliostatDrawSunBeamSelection from './heliostatDrawSunBeamSelection';
import HeliostatTowerSelection from './heliostatTowerSelection';
import HeliostatLengthInput from './heliostatLengthInput';
import HeliostatWidthInput from './heliostatWidthInput';
import HeliostatPoleHeightInput from './heliostatPoleHeightInput';
import HeliostatPoleRadiusInput from './heliostatPoleRadiusInput';
import HeliostatReflectanceInput from './heliostatReflectorReflectanceInput';

export const createHeliostatMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.Heliostat) return { items };

  const heliostat = selectedElement as HeliostatModel;

  const lang = { lng: useStore.getState().language };
  const editable = !heliostat.locked;

  items.push({
    key: 'heliostat-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push({
      key: 'heliostat-cut',
      label: <Cut />,
    });
  }

  items.push({
    key: 'heliostat-lock',
    label: <Lock selectedElement={heliostat} />,
  });

  if (editable) {
    items.push(
      {
        key: 'heliostat-tower',
        label: (
          <DialogItem Dialog={HeliostatTowerSelection}>
            {i18n.t('heliostatMenu.SelectTowerToReflectSunlightTo', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'heliostat-length',
        label: <DialogItem Dialog={HeliostatLengthInput}>{i18n.t('word.Length', lang)} ...</DialogItem>,
      },
      {
        key: 'heliostat-width',
        label: <DialogItem Dialog={HeliostatWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>,
      },
      {
        key: 'heliostat-pole-height',
        label: (
          <DialogItem Dialog={HeliostatPoleHeightInput}>
            {i18n.t('solarCollectorMenu.ExtraPoleHeight', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'heliostat-pole-radius',
        label: (
          <DialogItem Dialog={HeliostatPoleRadiusInput}>{i18n.t('solarCollectorMenu.PoleRadius', lang)} ...</DialogItem>
        ),
      },
      {
        key: 'heliostat-reflectance',
        label: (
          <DialogItem Dialog={HeliostatReflectanceInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorReflectance', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'heliostat-draw-sun-beam',
        label: (
          <DialogItem Dialog={HeliostatDrawSunBeamSelection}>
            {i18n.t('solarCollectorMenu.DrawSunBeam', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'heliostat-label-submenu',
        label: <MenuItem>{i18n.t('labelSubMenu.Label', lang)}</MenuItem>,
        children: createLabelSubmenu(heliostat),
      },
    );
  }

  return { items } as MenuProps;
};
