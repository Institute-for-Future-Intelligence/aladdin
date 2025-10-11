/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */
import { WindTurbineModel } from 'src/models/WindTurbineModel';
import { ObjectType } from 'src/types';
import { ContextSubMenu, Copy, Cut, DialogItem, Lock } from '../../menuItems';
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
import LabelSubmenu from '../../labelSubmenuItems';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

const WindTurbineMenu = () => {
  const lang = useLanguage();
  const windTurbine = useContextMenuElement(ObjectType.WindTurbine) as WindTurbineModel;
  if (!windTurbine) return null;

  const editable = !windTurbine.locked;

  return (
    <>
      {/* wind-turbine-copy */}
      <Copy />

      {/* wind-turbine-cut */}
      {editable && <Cut />}

      {/* wind-turbine-lock */}
      <Lock selectedElement={windTurbine} />

      {editable && (
        <>
          {/* wind-turbine-relative-yaw-angle */}
          <DialogItem Dialog={WindTurbineYawInput}>{i18n.t('windTurbineMenu.RelativeYawAngle', lang)} ...</DialogItem>

          {/* wind-turbine-rotor-submenu */}
          <ContextSubMenu label={i18n.t('windTurbineMenu.Rotor', lang)}>
            <DialogItem noPadding Dialog={WindTurbineBladeNumberSelection}>
              {i18n.t('windTurbineMenu.BladeNumber', lang)} ...
            </DialogItem>
            <DialogItem noPadding Dialog={WindTurbineRotorInitialAngleInput}>
              {i18n.t('windTurbineMenu.RotorInitialAngle', lang)} ...
            </DialogItem>
            <DialogItem noPadding Dialog={WindTurbineBladePitchInput}>
              {i18n.t('windTurbineMenu.RotorBladePitchAngle', lang)} ...
            </DialogItem>
            <DialogItem noPadding Dialog={WindTurbineBladeRadiusInput}>
              {i18n.t('windTurbineMenu.RotorBladeRadius', lang)} ...
            </DialogItem>
            <DialogItem noPadding Dialog={WindTurbineBladeDesign}>
              {i18n.t('windTurbineMenu.RotorBladeDesign', lang)} ...
            </DialogItem>
            <DialogItem noPadding Dialog={WindTurbineHubDesign}>
              {i18n.t('windTurbineMenu.HubDesign', lang)} ...
            </DialogItem>
            <DialogItem noPadding Dialog={WindTurbineBirdSafeSelection}>
              {i18n.t('windTurbineMenu.BirdSafeDesign', lang)} ...
            </DialogItem>
          </ContextSubMenu>

          {/* wind-turbine-tower-submenu */}
          <ContextSubMenu label={i18n.t('windTurbineMenu.Tower', lang)}>
            <DialogItem noPadding Dialog={WindTurbineTowerHeightInput}>
              {i18n.t('windTurbineMenu.TowerHeight', lang)} ...
            </DialogItem>
            <DialogItem noPadding Dialog={WindTurbineTowerRadiusInput}>
              {i18n.t('windTurbineMenu.TowerRadius', lang)} ...
            </DialogItem>
          </ContextSubMenu>

          {/* wind-turbine-label */}
          <LabelSubmenu element={windTurbine} />
        </>
      )}
    </>
  );
};

export default WindTurbineMenu;
