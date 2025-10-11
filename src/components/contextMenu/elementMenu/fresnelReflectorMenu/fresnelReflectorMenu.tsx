/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { FresnelReflectorModel } from 'src/models/FresnelReflectorModel';
import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import FresnelReflectorDrawSunBeamSelection from './fresnelReflectorDrawSunBeamSelection';
import LabelSubmenu from '../../labelSubmenuItems';
import FresnelReflectorAbsorberSelection from './fresnelReflectorAbsorberSelection';
import FresnelReflectorLengthInput from './fresnelReflectorLengthInput';
import FresnelReflectorWidthInput from './fresnelReflectorWidthInput';
import FresnelReflectorModuleLengthInput from './fresnelReflectorModuleLengthInput';
import FresnelReflectorPoleHeightInput from './fresnelReflectorPoleHeightInput';
import FresnelReflectorReflectanceInput from './fresnelReflectorReflectanceInput';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

const FresnelReflectorMenu = () => {
  const lang = useLanguage();
  const fresnelReflector = useContextMenuElement(ObjectType.FresnelReflector) as FresnelReflectorModel;
  if (!fresnelReflector) return null;

  const editable = !fresnelReflector.locked;

  return (
    <>
      {/* fresnel-reflector-copy */}
      <Copy />

      {/* fresnel-reflector-cut */}
      {editable && <Cut />}

      {/* fresnel-reflector-lock */}
      <Lock selectedElement={fresnelReflector} />

      {editable && (
        <>
          {/* fresnel-reflector-receiver */}
          <DialogItem Dialog={FresnelReflectorAbsorberSelection}>
            {i18n.t('fresnelReflectorMenu.SelectAbsorberToReflectSunlightTo', lang)} ...
          </DialogItem>

          {/* fresnel-reflector-length */}
          <DialogItem Dialog={FresnelReflectorLengthInput}>{i18n.t('word.Length', lang)} ...</DialogItem>

          {/* fresnel-reflector-width */}
          <DialogItem Dialog={FresnelReflectorWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>

          {/* fresnel-reflector-module-length */}
          <DialogItem Dialog={FresnelReflectorModuleLengthInput}>
            {i18n.t('fresnelReflectorMenu.ModuleLength', lang)} ...
          </DialogItem>

          {/* fresnel-reflector-pole-height */}
          <DialogItem Dialog={FresnelReflectorPoleHeightInput}>
            {i18n.t('solarCollectorMenu.ExtraPoleHeight', lang)} ...
          </DialogItem>

          {/* fresnel-reflector-reflectance */}
          <DialogItem Dialog={FresnelReflectorReflectanceInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorReflectance', lang)} ...
          </DialogItem>

          {/* fresnel-reflector-draw-sun-beam */}
          <DialogItem Dialog={FresnelReflectorDrawSunBeamSelection}>
            {i18n.t('solarCollectorMenu.DrawSunBeam', lang)} ...
          </DialogItem>

          {/* fresnel-reflector-label-submenu */}
          <LabelSubmenu element={fresnelReflector} />
        </>
      )}
    </>
  );
};

export default FresnelReflectorMenu;
