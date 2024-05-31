/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
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

  items.push({
    key: 'wind-turbine-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push({
      key: 'wind-turbine-cut',
      label: <Cut />,
    });
  }

  items.push({
    key: 'wind-turbine-lock',
    label: <Lock selectedElement={windTurbine} />,
  });

  if (editable) {
    items.push(
      {
        key: 'wind-turbine-relative-yaw-angle',
        label: (
          <DialogItem Dialog={WindTurbineYawInput}>{i18n.t('windTurbineMenu.RelativeYawAngle', lang)} ...</DialogItem>
        ),
      },
      {
        key: 'wind-turbine-rotor-submenu',
        label: <MenuItem>{i18n.t('windTurbineMenu.Rotor', lang)}</MenuItem>,
        children: [
          {
            key: 'wind-turbine-rotor-blade-number',
            label: (
              <DialogItem noPadding Dialog={WindTurbineBladeNumberSelection}>
                {i18n.t('windTurbineMenu.BladeNumber', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'wind-turbine-rotor-initial-angle',
            label: (
              <DialogItem noPadding Dialog={WindTurbineRotorInitialAngleInput}>
                {i18n.t('windTurbineMenu.RotorInitialAngle', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'wind-turbine-rotor-blade-pitch-angle',
            label: (
              <DialogItem noPadding Dialog={WindTurbineBladePitchInput}>
                {i18n.t('windTurbineMenu.RotorBladePitchAngle', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'wind-turbine-rotor-blade-radius',
            label: (
              <DialogItem noPadding Dialog={WindTurbineBladeRadiusInput}>
                {i18n.t('windTurbineMenu.RotorBladeRadius', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'wind-turbine-rotor-blade-design',
            label: (
              <DialogItem noPadding Dialog={WindTurbineBladeDesign}>
                {i18n.t('windTurbineMenu.RotorBladeDesign', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'wind-turbine-hub-design',
            label: (
              <DialogItem noPadding Dialog={WindTurbineHubDesign}>
                {i18n.t('windTurbineMenu.HubDesign', lang)} ...
              </DialogItem>
            ),
          },
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
      {
        key: 'wind-turbine-tower-submenu',
        label: <MenuItem>{i18n.t('windTurbineMenu.Tower', lang)}</MenuItem>,
        children: [
          {
            key: 'wind-turbine-tower-height',
            label: (
              <DialogItem noPadding Dialog={WindTurbineTowerHeightInput}>
                {i18n.t('windTurbineMenu.TowerHeight', lang)} ...
              </DialogItem>
            ),
          },
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
      {
        key: 'wind-turbine-label',
        label: <MenuItem>{i18n.t('labelSubMenu.Label', lang)}</MenuItem>,
        children: createLabelSubmenu(windTurbine),
      },
    );
  }

  return { items } as MenuProps;
};
