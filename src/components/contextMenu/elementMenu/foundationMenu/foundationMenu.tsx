/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import { BuildingCompletionStatus, FoundationTexture, ObjectType, SolarStructure } from 'src/types';
import { ContextSubMenu, Copy, Cut, DialogItem, GroupMasterCheckbox, Lock, Paste } from '../../menuItems';
import { FoundationModel } from 'src/models/FoundationModel';
import {
  AddPolygonItem,
  BuildingCheckbox,
  SlopeCheckbox,
  SolarStructureSubmenu,
  VisibilityCheckbox,
} from './foundationMenuItems';
import i18n from 'src/i18n/i18n';
import FoundationTextureSelection from './foundationTextureSelection';
import FoundationColorSelection from './foundationColorSelection';
import FoundationLengthInput from './foundationLengthInput';
import FoundationWidthInput from './foundationWidthInput';
import FoundationHeightInput from './foundationHeightInput';
import FoundationAzimuthInput from './foundationAzimuthInput';
import { Util } from 'src/Util';
import GroundFloorRValueInput from './groundFloorRValueInput';
import SolarAbsorberPipeHeightInput from '../solarStructureMenus/solarAbsorberPipeHeightInput';
import SolarAbsorberPipeApertureWidthInput from '../solarStructureMenus/solarAbsorberPipeApertureWidthInput';
import SolarAbsorberPipePoleNumberInput from '../solarStructureMenus/solarAbsorberPipePoleNumberInput';
import SolarAbsorberPipeAbsorptanceInput from '../solarStructureMenus/solarAbsorberPipeAbsorptanceInput';
import SolarAbsorberPipeOpticalEfficiencyInput from '../solarStructureMenus/solarAbsorberPipeOpticalEfficiencyInput';
import SolarAbsorberPipeThermalEfficiencyInput from '../solarStructureMenus/solarAbsorberPipeThermalEfficiencyInput';
import SolarPowerTowerHeightInput from '../solarStructureMenus/solarPowerTowerHeightInput';
import SolarPowerTowerRadiusInput from '../solarStructureMenus/solarPowerTowerRadiusInput';
import SolarPowerTowerReceiverAbsorptanceInput from '../solarStructureMenus/solarPowerTowerReceiverAbsorptanceInput';
import SolarPowerTowerReceiverThermalEfficiencyInput from '../solarStructureMenus/solarPowerTowerReceiverThermalEfficiencyInput';
import SolarPowerTowerReceiverOpticalEfficiencyInput from '../solarStructureMenus/solarPowerTowerReceiverOpticalEfficiencyInput';
import SolarUpdraftTowerChimneyHeightInput from '../solarStructureMenus/solarUpdraftTowerChimneyHeightInput';
import SolarUpdraftTowerChimneyRadiusInput from '../solarStructureMenus/solarUpdraftTowerChimneyRadiusInput';
import SolarUpdraftTowerCollectorHeightInput from '../solarStructureMenus/solarUpdraftTowerCollectorHeightInput';
import SolarUpdraftTowerCollectorRadiusInput from '../solarStructureMenus/solarUpdraftTowerCollectorRadiusInput';
import SolarUpdraftTowerCollectorTransmissivityInput from '../solarStructureMenus/solarUpdraftTowerCollectorTransmissivityInput';
import SolarUpdraftTowerCollectorEmissivityInput from '../solarStructureMenus/solarUpdraftTowerCollectorEmissivityInput';
import SolarUpdraftTowerDischargeCoefficientInput from '../solarStructureMenus/solarUpdraftTowerDischargeCoefficientInput';
import SolarUpdraftTowerTurbineEfficiencyInput from '../solarStructureMenus/solarUpdraftTowerTurbineEfficiencyInput';
import SolarPanelTiltAngleGaWizard from '../solarPanelTiltAngleGaWizard';
import SolarPanelTiltAnglePsoWizard from '../solarPanelTiltAnglePsoWizard';
import LabelSubmenu from '../../labelSubmenuItems';
import FoundationElementCounterSubmenu from './foundationElementCounterSubmenu';
import BuildingHVACSystem from './buildingHVACSystem';
import FoundationSlopeInput from './foundationSlopeInput';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

const legalToPasteOnFoundation = () => {
  const elementsToPaste = useStore.getState().elementsToPaste;

  if (elementsToPaste && elementsToPaste.length > 0) {
    // when there are multiple elements to paste, the first element is the parent
    // we check the legality of the parent here
    const e = elementsToPaste[0];
    if (
      e.type === ObjectType.Human ||
      e.type === ObjectType.Tree ||
      e.type === ObjectType.Flower ||
      e.type === ObjectType.Polygon ||
      e.type === ObjectType.Sensor ||
      e.type === ObjectType.Light ||
      e.type === ObjectType.SolarPanel ||
      e.type === ObjectType.SolarWaterHeater ||
      e.type === ObjectType.ParabolicDish ||
      e.type === ObjectType.Heliostat ||
      e.type === ObjectType.FresnelReflector ||
      e.type === ObjectType.ParabolicTrough ||
      e.type === ObjectType.WindTurbine ||
      e.type === ObjectType.BatteryStorage ||
      e.type === ObjectType.Wall
    ) {
      return true;
    }
  }
  return false;
};

const FoundationMenu = () => {
  const lang = useLanguage();
  const foundation = useContextMenuElement(ObjectType.Foundation) as FoundationModel;

  if (!foundation) return null;

  const editable = !foundation.locked;
  const isBuilding =
    !foundation.notBuilding &&
    Util.getBuildingCompletionStatus(foundation, useStore.getState().elements) === BuildingCompletionStatus.COMPLETE;

  const counterAll = useStore.getState().countAllOffspringsByTypeAtOnce(foundation.id, true);
  const counterUnlocked = useStore.getState().countAllOffspringsByTypeAtOnce(foundation.id, false);

  return (
    <>
      {/* paste */}
      {legalToPasteOnFoundation() && <Paste />}

      {/* copy */}
      <Copy />

      {/* cut */}
      {editable && <Cut />}

      {/* lock */}
      <Lock selectedElement={foundation} />

      {/* visible */}
      {editable && <VisibilityCheckbox foundation={foundation} />}

      {/* group master */}
      {editable && <GroupMasterCheckbox groupableElement={foundation} />}

      {/* building */}
      {!foundation.enableSlope && <BuildingCheckbox foundation={foundation} />}

      {/* slope */}
      {editable &&
        counterAll.wallCount === 0 &&
        (foundation.solarStructure === undefined || foundation.solarStructure === SolarStructure.None) && (
          <SlopeCheckbox foundation={foundation} />
        )}

      {editable && (
        <>
          {/* slope-angle-input */}
          {foundation.enableSlope && (
            <DialogItem Dialog={FoundationSlopeInput}>{i18n.t('foundationMenu.SlopeAngle', lang)} ...</DialogItem>
          )}

          {/* color */}
          {!foundation.textureType ||
            (foundation.textureType === FoundationTexture.NoTexture && (
              <DialogItem Dialog={FoundationColorSelection}>{i18n.t('word.Color', lang)} ...</DialogItem>
            ))}

          {/* texture */}
          <DialogItem Dialog={FoundationTextureSelection}>{i18n.t('word.Texture', lang)} ...</DialogItem>

          {/* azimuth */}
          <DialogItem Dialog={FoundationAzimuthInput}>{i18n.t('word.Azimuth', lang)} ...</DialogItem>

          {/* r-value */}
          {isBuilding && (
            <DialogItem Dialog={GroundFloorRValueInput}>
              {i18n.t('foundationMenu.GroundFloorRValue', lang)} ...
            </DialogItem>
          )}
        </>
      )}

      {/* add polygon */}
      <AddPolygonItem foundation={foundation} />

      {/* building-programmable-hvac */}
      {!foundation.notBuilding && counterAll.wallCount > 0 && (
        <DialogItem Dialog={BuildingHVACSystem}>{i18n.t('HVACMenu.BuildingHVACSystem', lang)} ...</DialogItem>
      )}

      {/* size submenu */}
      {editable && (
        <ContextSubMenu label={i18n.t('word.Size', lang)}>
          <DialogItem noPadding Dialog={FoundationLengthInput}>
            {i18n.t('word.Length', lang)} ...
          </DialogItem>
          <DialogItem noPadding Dialog={FoundationWidthInput}>
            {i18n.t('word.Width', lang)} ...
          </DialogItem>
          <DialogItem noPadding Dialog={FoundationHeightInput}>
            {i18n.t('word.Height', lang)} ...
          </DialogItem>
        </ContextSubMenu>
      )}

      {/* structures */}
      {editable && foundation.notBuilding && !foundation.enableSlope && (
        <>
          {/* solar-structure-submenu */}
          <SolarStructureSubmenu foundation={foundation} />

          {/* solar-absorber-pipe-physical-properties */}
          {foundation.solarStructure === SolarStructure.FocusPipe && (
            <ContextSubMenu label={i18n.t('solarAbsorberPipeMenu.AbsorberPipePhysicalProperties', lang)}>
              {/* solar-absorber-pipe-height */}
              <DialogItem noPadding Dialog={SolarAbsorberPipeHeightInput}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberHeight', lang)} ...
              </DialogItem>

              {/* solar-absorber-pipe-aperture-width */}
              <DialogItem noPadding Dialog={SolarAbsorberPipeApertureWidthInput}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberApertureWidth', lang)} ...
              </DialogItem>

              {/* foundation-solar-receiver-pipe-pole-number */}
              <DialogItem noPadding Dialog={SolarAbsorberPipePoleNumberInput}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberPipePoleNumber', lang)} ...
              </DialogItem>

              {/* solar-absorber-pipe-absorptance */}
              <DialogItem noPadding Dialog={SolarAbsorberPipeAbsorptanceInput}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberAbsorptance', lang)} ...
              </DialogItem>

              {/* solar-absorber-optical-efficiency */}
              <DialogItem noPadding Dialog={SolarAbsorberPipeOpticalEfficiencyInput}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberOpticalEfficiency', lang)} ...
              </DialogItem>

              {/* solar-absorber-thermal-efficiency */}
              <DialogItem noPadding Dialog={SolarAbsorberPipeThermalEfficiencyInput}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberThermalEfficiency', lang)} ...
              </DialogItem>
            </ContextSubMenu>
          )}

          {/* solar-power-tower-physical-properties */}
          {foundation.solarStructure === SolarStructure.FocusTower && (
            <ContextSubMenu label={i18n.t('solarPowerTowerMenu.ReceiverTowerPhysicalProperties', lang)}>
              {/* solar-power-tower-height */}
              <DialogItem noPadding Dialog={SolarPowerTowerHeightInput}>
                {i18n.t('solarPowerTowerMenu.ReceiverTowerHeight', lang)} ...
              </DialogItem>

              {/* solar-power-tower-radius */}
              <DialogItem noPadding Dialog={SolarPowerTowerRadiusInput}>
                {i18n.t('solarPowerTowerMenu.ReceiverTowerRadius', lang)} ...
              </DialogItem>

              {/* solar-power-tower-receiver-absorptance */}
              <DialogItem noPadding Dialog={SolarPowerTowerReceiverAbsorptanceInput}>
                {i18n.t('solarPowerTowerMenu.ReceiverAbsorptance', lang)} ...
              </DialogItem>

              {/* solar-power-tower-receiver-optical-efficiency */}
              <DialogItem noPadding Dialog={SolarPowerTowerReceiverOpticalEfficiencyInput}>
                {i18n.t('solarPowerTowerMenu.ReceiverOpticalEfficiency', lang)} ...
              </DialogItem>

              {/* solar-power-tower-receiver-thermal-efficiency */}
              <DialogItem noPadding Dialog={SolarPowerTowerReceiverThermalEfficiencyInput}>
                {i18n.t('solarPowerTowerMenu.ReceiverThermalEfficiency', lang)} ...
              </DialogItem>
            </ContextSubMenu>
          )}

          {/* solar-updraft-tower-physical-properties */}
          {foundation.solarStructure === SolarStructure.UpdraftTower && (
            <ContextSubMenu label={i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerPhysicalProperties', lang)}>
              {/* solar-updraft-tower-chimney-height */}
              <DialogItem noPadding Dialog={SolarUpdraftTowerChimneyHeightInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerChimneyHeight', lang)} ...
              </DialogItem>

              {/* solar-updraft-tower-chimney-radius */}
              <DialogItem noPadding Dialog={SolarUpdraftTowerChimneyRadiusInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerChimneyRadius', lang)} ...
              </DialogItem>

              {/* solar-updraft-tower-collector-height */}
              <DialogItem noPadding Dialog={SolarUpdraftTowerCollectorHeightInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerCollectorHeight', lang)} ...
              </DialogItem>

              {/* solar-updraft-tower-collector-radius */}
              <DialogItem noPadding Dialog={SolarUpdraftTowerCollectorRadiusInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerCollectorRadius', lang)} ...
              </DialogItem>

              {/* solar-updraft-tower-collector-transmissivity */}
              <DialogItem noPadding Dialog={SolarUpdraftTowerCollectorTransmissivityInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerCollectorTransmissivity', lang)} ...
              </DialogItem>

              {/* solar-updraft-tower-collector-emissivity */}
              <DialogItem noPadding Dialog={SolarUpdraftTowerCollectorEmissivityInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerCollectorEmissivity', lang)} ...
              </DialogItem>

              {/* solar-updraft-tower-discharge-coefficient */}
              <DialogItem noPadding Dialog={SolarUpdraftTowerDischargeCoefficientInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerDischargeCoefficient', lang)} ...
              </DialogItem>

              {/* solar-updraft-tower-turbine-efficiency */}
              <DialogItem noPadding Dialog={SolarUpdraftTowerTurbineEfficiencyInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerTurbineEfficiency', lang)} ...
              </DialogItem>
            </ContextSubMenu>
          )}
        </>
      )}

      {/* optimization */}
      <ContextSubMenu label={i18n.t('optimizationMenu.Optimization', lang)}>
        {/* genetic-algorithms */}
        <ContextSubMenu
          label={i18n.t('optimizationMenu.GeneticAlgorithm', lang)}
          disabled={counterUnlocked.solarPanelCount === 0}
          noPadding
        >
          <DialogItem noPadding Dialog={SolarPanelTiltAngleGaWizard}>
            {i18n.t('optimizationMenu.SolarPanelTiltAngleOptimization', lang)}...
          </DialogItem>
        </ContextSubMenu>

        {/* particle-swarm-optimization */}
        <ContextSubMenu
          label={i18n.t('optimizationMenu.ParticleSwarmOptimization', lang)}
          disabled={counterUnlocked.solarPanelCount === 0}
          noPadding
        >
          <DialogItem noPadding Dialog={SolarPanelTiltAnglePsoWizard}>
            {i18n.t('optimizationMenu.SolarPanelTiltAngleOptimization', lang)}...
          </DialogItem>
        </ContextSubMenu>
      </ContextSubMenu>

      {/* lock-unlock-clear-on-foundation */}
      {counterAll.gotSome() && <FoundationElementCounterSubmenu foundation={foundation} />}

      {/* label */}
      <LabelSubmenu element={foundation} />
    </>
  );
};

export default FoundationMenu;
