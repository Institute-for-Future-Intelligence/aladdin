/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */
import type { MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { WindTurbineModel } from 'src/models/WindTurbineModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock, MenuItem } from '../../menuItems';
import WindTurbineYawInput from './windTurbineYawInput';
import i18n from 'src/i18n/i18n';
import WindTurbineBladeNumberSelection from './windTurbineBladeNumberSelection';
import WindTurbineRotorInitialAngleInput from './windTurbineRotorInitialAngleInput';
import WindTurbineBladePitchInput from './windTurbineBladePitchInput';
import WindTurbineBladeRadiusInput from './windTurbineBladeRadiusInput';
import WindTurbineBladeDesign from './windTurbineBladeDesign';
import WindTurbineHubDesign from './windTurbineHubDesign';
import WindTurbineBirdSafeSelection from './windTurbineBirdSafeSelection';
import WindTurbineTowerHeightInput from './windTurbineTowerHeightInput';
import WindTurbineTowerRadiusInput from './windTurbineTowerRadiusInput';
import { createLabelSubmenu } from '../../labelSubmenuItems';

export const createWindTurbineMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.WindTurbine) return { items };

  const windTurbine = selectedElement as WindTurbineModel;

  const lang = { lng: useStore.getState().language };
  const editable = !windTurbine.locked;

  // lock
  items.push({
    key: 'wind-turbine-lock',
    label: <Lock selectedElement={windTurbine} />,
  });

  // cut
  if (editable) {
    items.push({
      key: 'wind-turbine-cut',
      label: <Cut />,
    });
  }

  // copy
  items.push({
    key: 'wind-turbine-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push(
      // wind-turbine-relative-yaw-angle
      {
        key: 'wind-turbine-relative-yaw-angle',
        label: (
          <DialogItem Dialog={WindTurbineYawInput}>{i18n.t('windTurbineMenu.RelativeYawAngle', lang)} ...</DialogItem>
        ),
      },
      // wind-turbine-rotor-submenu
      {
        key: 'wind-turbine-rotor-submenu',
        label: <MenuItem>{i18n.t('windTurbineMenu.Rotor', lang)}</MenuItem>,
        children: [
          // wind-turbine-rotor-blade-number
          {
            key: 'wind-turbine-rotor-blade-number',
            label: (
              <DialogItem noPadding Dialog={WindTurbineBladeNumberSelection}>
                {i18n.t('windTurbineMenu.BladeNumber', lang)} ...
              </DialogItem>
            ),
          },
          // wind-turbine-rotor-initial-angle
          {
            key: 'wind-turbine-rotor-initial-angle',
            label: (
              <DialogItem noPadding Dialog={WindTurbineRotorInitialAngleInput}>
                {i18n.t('windTurbineMenu.RotorInitialAngle', lang)} ...
              </DialogItem>
            ),
          },
          // wind-turbine-rotor-blade-pitch-angle
          {
            key: 'wind-turbine-rotor-blade-pitch-angle',
            label: (
              <DialogItem noPadding Dialog={WindTurbineBladePitchInput}>
                {i18n.t('windTurbineMenu.RotorBladePitchAngle', lang)} ...
              </DialogItem>
            ),
          },
          // wind-turbine-rotor-blade-radius
          {
            key: 'wind-turbine-rotor-blade-radius',
            label: (
              <DialogItem noPadding Dialog={WindTurbineBladeRadiusInput}>
                {i18n.t('windTurbineMenu.RotorBladeRadius', lang)} ...
              </DialogItem>
            ),
          },
          // wind-turbine-rotor-blade-design
          {
            key: 'wind-turbine-rotor-blade-design',
            label: (
              <DialogItem noPadding Dialog={WindTurbineBladeDesign}>
                {i18n.t('windTurbineMenu.RotorBladeDesign', lang)} ...
              </DialogItem>
            ),
          },
          // wind-turbine-hub-design
          {
            key: 'wind-turbine-hub-design',
            label: (
              <DialogItem noPadding Dialog={WindTurbineHubDesign}>
                {i18n.t('windTurbineMenu.HubDesign', lang)} ...
              </DialogItem>
            ),
          },
          // wind-turbine-bird-safe-blade
          {
            key: 'wind-turbine-bird-safe-blade',
            label: (
              <DialogItem noPadding Dialog={WindTurbineBirdSafeSelection}>
                {i18n.t('windTurbineMenu.BirdSafeDesign', lang)} ...
              </DialogItem>
            ),
          },
        ],
      },
      // wind-turbine-tower-submenu
      {
        key: 'wind-turbine-tower-submenu',
        label: <MenuItem>{i18n.t('windTurbineMenu.Tower', lang)}</MenuItem>,
        children: [
          // wind-turbine-tower-height
          {
            key: 'wind-turbine-tower-height',
            label: (
              <DialogItem noPadding Dialog={WindTurbineTowerHeightInput}>
                {i18n.t('windTurbineMenu.TowerHeight', lang)} ...
              </DialogItem>
            ),
          },
          // wind-turbine-tower-radius
          {
            key: 'wind-turbine-tower-radius',
            label: (
              <DialogItem noPadding Dialog={WindTurbineTowerRadiusInput}>
                {i18n.t('windTurbineMenu.TowerRadius', lang)} ...
              </DialogItem>
            ),
          },
        ],
      },
      // wind-turbine-label
      {
        key: 'wind-turbine-label',
        label: <MenuItem>{i18n.t('labelSubMenu.Label', lang)}</MenuItem>,
        children: createLabelSubmenu(windTurbine),
      },
    );
  }

  return { items } as MenuProps;
};
