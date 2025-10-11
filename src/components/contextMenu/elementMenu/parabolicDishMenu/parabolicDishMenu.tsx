/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock, SolarCollectorSunBeamCheckbox } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import LabelSubmenu from '../../labelSubmenuItems';
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
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

const ParabolicDishMenu = () => {
  const lang = useLanguage();
  const parabolicDish = useContextMenuElement(ObjectType.ParabolicDish) as ParabolicDishModel;
  if (!parabolicDish) return null;

  const editable = !parabolicDish.locked;

  return (
    <>
      {/* parabolic-dish-copy */}
      <Copy />

      {/* parabolic-dish-cut */}
      {editable && <Cut />}

      {/* parabolic-dish-lock */}
      <Lock selectedElement={parabolicDish} />

      {editable && (
        <>
          {/* parabolic-dish-radius */}
          <DialogItem Dialog={ParabolicDishDiameterInput}>
            {i18n.t('parabolicDishMenu.RimDiameter', lang)} ...
          </DialogItem>

          {/* parabolic-dish-latus-rectum */}
          <DialogItem Dialog={ParabolicDishLatusRectumInput}>
            {i18n.t('parabolicDishMenu.LatusRectum', lang)} ...
          </DialogItem>

          {/* parabolic-dish-structure-type */}
          <DialogItem Dialog={ParabolicDishStructureTypeInput}>
            {i18n.t('parabolicDishMenu.ReceiverStructure', lang)} ...
          </DialogItem>

          {/* parabolic-dish-pole-height */}
          <DialogItem Dialog={ParabolicDishPoleHeightInput}>
            {i18n.t('solarCollectorMenu.ExtraPoleHeight', lang)} ...
          </DialogItem>

          {/* parabolic-dish-pole-radius */}
          <DialogItem Dialog={ParabolicDishPoleRadiusInput}>
            {i18n.t('solarCollectorMenu.PoleRadius', lang)} ...
          </DialogItem>

          {/* parabolic-dish-reflectance */}
          <DialogItem Dialog={ParabolicDishReflectanceInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorReflectance', lang)} ...
          </DialogItem>

          {/* parabolic-dish-absorptance */}
          <DialogItem Dialog={ParabolicDishAbsorptanceInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReceiverAbsorptance', lang)} ...
          </DialogItem>

          {/* parabolic-dish-optical-efficiency */}
          <DialogItem Dialog={ParabolicDishOpticalEfficiencyInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReflectorOpticalEfficiency', lang)} ...
          </DialogItem>

          {/* parabolic-dish-thermal-efficiency */}
          <DialogItem Dialog={ParabolicDishThermalEfficiencyInput}>
            {i18n.t('concentratedSolarPowerCollectorMenu.ReceiverThermalEfficiency', lang)} ...
          </DialogItem>

          {/* parabolic-dish-draw-sun-beam */}
          <SolarCollectorSunBeamCheckbox solarCollector={parabolicDish} />

          {/* parabolic-dish-label-submenu */}
          <LabelSubmenu element={parabolicDish} />
        </>
      )}
    </>
  );
};

export default ParabolicDishMenu;
