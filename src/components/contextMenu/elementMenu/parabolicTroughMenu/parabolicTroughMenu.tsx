/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock, SolarCollectorSunBeamCheckbox } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import LabelSubmenu from '../../labelSubmenuItems';
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
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

const ParabolicTroughMenu = () => {
  const lang = useLanguage();
  const parabolicTrough = useContextMenuElement(ObjectType.ParabolicTrough) as ParabolicTroughModel;
  if (!parabolicTrough) return null;

  const editable = !parabolicTrough.locked;

  return (
    <>
      {/* parabolic-trough-copy */}
      <Copy />

      {/* parabolic-trough-cut */}
      {editable && <Cut />}

      {/* parabolic-trough-lock */}
      <Lock selectedElement={parabolicTrough} />

      {editable && (
        <>
          {/* parabolic-trough-length */}
          <DialogItem Dialog={ParabolicTroughLengthInput}>{i18n.t('word.Length', lang)} ...</DialogItem>

          {/* parabolic-trough-width */}
          <DialogItem Dialog={ParabolicTroughWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>

          {/* parabolic-trough-module-length */}
          <DialogItem Dialog={ParabolicTroughModuleLengthInput}>
            {i18n.t('parabolicTroughMenu.ModuleLength', lang)} ...
          </DialogItem>

          {/* parabolic-trough-latus-rectum */}
          <DialogItem Dialog={ParabolicTroughLatusRectumInput}>
            {i18n.t('parabolicTroughMenu.LatusRectum', lang)} ...
          </DialogItem>

          {/* parabolic-trough-pole-height */}
          <DialogItem Dialog={ParabolicTroughPoleHeightInput}>
            {i18n.t('solarCollectorMenu.ExtraPoleHeight', lang)} ...
          </DialogItem>

          {/* parabolic-trough-reflectance */}
          <DialogItem Dialog={ParabolicTroughReflectanceInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorReflectance', lang)} ...
          </DialogItem>

          {/* parabolic-trough-absorptance */}
          <DialogItem Dialog={ParabolicTroughAbsorptanceInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReceiverAbsorptance', lang)} ...
          </DialogItem>

          {/* parabolic-trough-optical-efficiency */}
          <DialogItem Dialog={ParabolicTroughOpticalEfficiencyInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorOpticalEfficiency', lang)} ...
          </DialogItem>

          {/* parabolic-trough-thermal-efficiency */}
          <DialogItem Dialog={ParabolicTroughThermalEfficiencyInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReceiverThermalEfficiency', lang)} ...
          </DialogItem>

          {/* parabolic-dish-draw-sun-beam */}
          <SolarCollectorSunBeamCheckbox solarCollector={parabolicTrough} />

          {/* parabolic-trough-label-submenu */}
          <LabelSubmenu element={parabolicTrough} />
        </>
      )}
    </>
  );
};

export default ParabolicTroughMenu;
