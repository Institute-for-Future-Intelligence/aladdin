/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import type { MenuProps } from 'antd';
import { BuildingCompletionStatus, FoundationTexture, ObjectType, SolarStructure } from 'src/types';
import { Copy, Cut, DialogItem, GroupMasterCheckbox, Lock, MenuItem, Paste } from '../../menuItems';
import { FoundationModel } from 'src/models/FoundationModel';
import { ElementModel } from 'src/models/ElementModel';
import {
  AddPolygonItem,
  BuildingCheckbox,
  HvacSystemIdInput,
  SolarStructureRadioGroup,
  ThermostatTemperatureInput,
  ToleranceThresholdInput,
} from './foundationMenuItems';
import i18n from 'src/i18n/i18n';
import FoundationTextureSelection from './foundationTextureSelection';
import FoundationColorSelection from './foundationColorSelection';
import FoundationLengthInput from './foundationLengthInput';
import FoundationWidthInput from './foundationWidthInput';
import FoundationHeightInput from './foundationHeightInput';
import FoundationAzimuthInput from './foundationAzimuthInput';
import { Util } from 'src/Util';
import GroundFloorRValueInput from '../groundFloorRValueInput';
import SolarAbsorberPipeHeightInput from '../solarAbsorberPipeHeightInput';
import SolarAbsorberPipeApertureWidthInput from '../solarAbsorberPipeApertureWidthInput';
import SolarAbsorberPipePoleNumberInput from '../solarAbsorberPipePoleNumberInput';
import SolarAbsorberPipeAbsorptanceInput from '../solarAbsorberPipeAbsorptanceInput';
import SolarAbsorberPipeOpticalEfficiencyInput from '../solarAbsorberPipeOpticalEfficiencyInput';
import SolarAbsorberPipeThermalEfficiencyInput from '../solarAbsorberPipeThermalEfficiencyInput';
import SolarPowerTowerHeightInput from '../solarPowerTowerHeightInput';
import SolarPowerTowerRadiusInput from '../solarPowerTowerRadiusInput';
import SolarPowerTowerReceiverAbsorptanceInput from '../solarPowerTowerReceiverAbsorptanceInput';
import SolarPowerTowerReceiverThermalEfficiencyInput from '../solarPowerTowerReceiverThermalEfficiencyInput';
import SolarPowerTowerReceiverOpticalEfficiencyInput from '../solarPowerTowerReceiverOpticalEfficiencyInput';
import SolarUpdraftTowerChimneyHeightInput from '../solarUpdraftTowerChimneyHeightInput';
import SolarUpdraftTowerChimneyRadiusInput from '../solarUpdraftTowerChimneyRadiusInput';
import SolarUpdraftTowerCollectorHeightInput from '../solarUpdraftTowerCollectorHeightInput';
import SolarUpdraftTowerCollectorRadiusInput from '../solarUpdraftTowerCollectorRadiusInput';
import SolarUpdraftTowerCollectorTransmissivityInput from '../solarUpdraftTowerCollectorTransmissivityInput';
import SolarUpdraftTowerCollectorEmissivityInput from '../solarUpdraftTowerCollectorEmissivityInput';
import SolarUpdraftTowerDischargeCoefficientInput from '../solarUpdraftTowerDischargeCoefficientInput';
import SolarUpdraftTowerTurbineEfficiencyInput from '../solarUpdraftTowerTurbineEfficiencyInput';
import SolarPanelTiltAngleGaWizard from '../solarPanelTiltAngleGaWizard';
import SolarPanelTiltAnglePsoWizard from '../solarPanelTiltAnglePsoWizard';
import { createLabelSubmenu } from '../../labelSubmenuItems';
import { createFoundationElementCounterSubmenu } from './foundationElementCounterSubmenu';

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
      e.type === ObjectType.WaterHeater ||
      e.type === ObjectType.ParabolicDish ||
      e.type === ObjectType.Heliostat ||
      e.type === ObjectType.FresnelReflector ||
      e.type === ObjectType.ParabolicTrough ||
      e.type === ObjectType.WindTurbine ||
      e.type === ObjectType.Wall
    ) {
      return true;
    }
  }
  return false;
};

export const createFoundationMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.Foundation) return { items };

  const foundation = selectedElement as FoundationModel;

  const lang = { lng: useStore.getState().language };
  const editable = !foundation.locked;

  const isBuilding =
    !foundation.notBuilding &&
    Util.getBuildingCompletionStatus(foundation, useStore.getState().elements) === BuildingCompletionStatus.COMPLETE;

  const counterAll = useStore.getState().countAllOffspringsByTypeAtOnce(foundation.id, true);

  const counterUnlocked = useStore.getState().countAllOffspringsByTypeAtOnce(foundation.id, false);

  // lock
  items.push({
    key: 'foundation-lock',
    label: <Lock selectedElement={foundation} />,
  });

  // group-master
  items.push({
    key: 'foundation-group-master',
    label: <GroupMasterCheckbox groupableElement={foundation} />,
  });

  // building
  items.push({
    key: 'building',
    label: <BuildingCheckbox foundation={foundation} />,
  });

  // cut
  if (editable) {
    items.push({
      key: 'foundation-cut',
      label: <Cut />,
    });
  }

  // copy
  items.push({
    key: 'foundation-copy',
    label: <Copy />,
  });

  // paste
  if (legalToPasteOnFoundation()) {
    items.push({
      key: 'foundation-paste',
      label: <Paste />,
    });
  }

  // lock-unlock-clear-on-foundation
  if (counterAll.gotSome()) {
    items.push({
      key: 'lock-unlock-clear-on-foundation',
      label: <MenuItem>{i18n.t('word.Elements', lang)}</MenuItem>,
      children: createFoundationElementCounterSubmenu(foundation, counterAll, counterUnlocked),
    });
  }

  // building-hvac-system
  if (!foundation.notBuilding && counterAll.wallCount > 0) {
    items.push({
      key: 'building-hvac-system',
      label: i18n.t('word.BuildingHVACSystem', lang),
      children: [
        {
          key: 'hvac-system-id',
          label: <HvacSystemIdInput foundation={foundation} />,
        },
        {
          key: 'thermostat-temperature',
          label: <ThermostatTemperatureInput foundation={foundation} />,
        },
        {
          key: 'tolerance-threshold',
          label: <ToleranceThresholdInput foundation={foundation} />,
        },
      ],
    });
  }

  // add-polygon-on-foundation
  items.push({
    key: 'add-polygon-on-foundation',
    label: <AddPolygonItem foundation={foundation} />,
  });

  if (editable) {
    // foundation-color
    if (!foundation.textureType || foundation.textureType === FoundationTexture.NoTexture) {
      items.push({
        key: 'fountaion-color',
        label: <DialogItem Dialog={FoundationColorSelection}>{i18n.t('word.Color', lang)} ...</DialogItem>,
      });
    }

    // foundation-texture
    items.push({
      key: 'fountaion-texture',
      label: <DialogItem Dialog={FoundationTextureSelection}>{i18n.t('word.Texture', lang)} ...</DialogItem>,
    });

    // foundation-length
    items.push({
      key: 'fountaion-length',
      label: <DialogItem Dialog={FoundationLengthInput}>{i18n.t('word.Length', lang)} ...</DialogItem>,
    });

    // foundation-width
    items.push({
      key: 'fountaion-width',
      label: <DialogItem Dialog={FoundationWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>,
    });

    // foundation-height
    items.push({
      key: 'fountaion-height',
      label: <DialogItem Dialog={FoundationHeightInput}>{i18n.t('word.Height', lang)} ...</DialogItem>,
    });

    // foundation-azimuth
    items.push({
      key: 'fountaion-azimuth',
      label: <DialogItem Dialog={FoundationAzimuthInput}>{i18n.t('word.Azimuth', lang)} ...</DialogItem>,
    });

    // ground-floor-r-value
    if (isBuilding) {
      items.push({
        key: 'ground-floor-r-value',
        label: (
          <DialogItem Dialog={GroundFloorRValueInput}>
            {i18n.t('foundationMenu.GroundFloorRValue', lang)} ...
          </DialogItem>
        ),
      });
    }

    // select-solar-structure
    items.push({
      key: 'select-solar-structure',
      label: i18n.t('foundationMenu.SolarStructure', lang),
      children: [
        {
          key: 'select-solar-structure-submenu',
          label: <SolarStructureRadioGroup foundation={foundation} />,
        },
      ],
    });

    // solar-absorber-pipe-physical-properties
    if (foundation.solarStructure === SolarStructure.FocusPipe) {
      items.push({
        key: 'solar-absorber-pipe-physical-properties',
        label: i18n.t('solarAbsorberPipeMenu.AbsorberPipePhysicalProperties', lang),
        children: [
          {
            key: 'solar-absorber-pipe-height',
            label: (
              <DialogItem Dialog={SolarAbsorberPipeHeightInput}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberHeight', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-absorber-pipe-aperture-width',
            label: (
              <DialogItem Dialog={SolarAbsorberPipeApertureWidthInput}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberApertureWidth', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'foundation-solar-receiver-pipe-pole-number',
            label: (
              <DialogItem Dialog={SolarAbsorberPipePoleNumberInput}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberPipePoleNumber', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-absorber-pipe-absorptance',
            label: (
              <DialogItem Dialog={SolarAbsorberPipeAbsorptanceInput}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberAbsorptance', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-absorber-optical-efficiency',
            label: (
              <DialogItem Dialog={SolarAbsorberPipeOpticalEfficiencyInput}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberOpticalEfficiency', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-absorber-thermal-efficiency',
            label: (
              <DialogItem Dialog={SolarAbsorberPipeThermalEfficiencyInput}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberThermalEfficiency', lang)} ...
              </DialogItem>
            ),
          },
        ],
      });
    }

    // solar-power-tower-physical-properties
    if (foundation.solarStructure === SolarStructure.FocusTower) {
      items.push({
        key: 'solar-power-tower-physical-properties',
        label: i18n.t('solarPowerTowerMenu.ReceiverTowerPhysicalProperties', lang),
        children: [
          {
            key: 'solar-power-tower-height',
            label: (
              <DialogItem Dialog={SolarPowerTowerHeightInput}>
                {i18n.t('solarPowerTowerMenu.ReceiverTowerHeight', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-power-tower-radius',
            label: (
              <DialogItem Dialog={SolarPowerTowerRadiusInput}>
                {i18n.t('solarPowerTowerMenu.ReceiverTowerRadius', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-power-tower-receiver-absorptance',
            label: (
              <DialogItem Dialog={SolarPowerTowerReceiverAbsorptanceInput}>
                {i18n.t('solarPowerTowerMenu.ReceiverAbsorptance', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-power-tower-receiver-optical-efficiency',
            label: (
              <DialogItem Dialog={SolarPowerTowerReceiverOpticalEfficiencyInput}>
                {i18n.t('solarPowerTowerMenu.ReceiverOpticalEfficiency', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-power-tower-receiver-thermal-efficiency',
            label: (
              <DialogItem Dialog={SolarPowerTowerReceiverThermalEfficiencyInput}>
                {i18n.t('solarPowerTowerMenu.ReceiverThermalEfficiency', lang)} ...
              </DialogItem>
            ),
          },
        ],
      });
    }

    // solar-updraft-tower-physical-properties
    if (foundation.solarStructure === SolarStructure.UpdraftTower) {
      items.push({
        key: 'solar-updraft-tower-physical-properties',
        label: i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerPhysicalProperties', lang),
        children: [
          {
            key: 'solar-updraft-tower-chimney-height',
            label: (
              <DialogItem Dialog={SolarUpdraftTowerChimneyHeightInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerChimneyHeight', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-updraft-tower-chimney-radius',
            label: (
              <DialogItem Dialog={SolarUpdraftTowerChimneyRadiusInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerChimneyRadius', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-updraft-tower-collector-height',
            label: (
              <DialogItem Dialog={SolarUpdraftTowerCollectorHeightInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerCollectorHeight', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-updraft-tower-collector-radius',
            label: (
              <DialogItem Dialog={SolarUpdraftTowerCollectorRadiusInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerCollectorRadius', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-updraft-tower-collector-transmissivity',
            label: (
              <DialogItem Dialog={SolarUpdraftTowerCollectorTransmissivityInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerCollectorTransmissivity', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-updraft-tower-collector-emissivity',
            label: (
              <DialogItem Dialog={SolarUpdraftTowerCollectorEmissivityInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerCollectorEmissivity', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-updraft-tower-discharge-coefficient',
            label: (
              <DialogItem Dialog={SolarUpdraftTowerDischargeCoefficientInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerDischargeCoefficient', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-updraft-tower-turbine-efficiency',
            label: (
              <DialogItem Dialog={SolarUpdraftTowerTurbineEfficiencyInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerTurbineEfficiency', lang)} ...
              </DialogItem>
            ),
          },
        ],
      });
    }
  }

  // optimization
  items.push({
    key: 'optimization',
    label: i18n.t('optimizationMenu.Optimization', lang),
    children: [
      {
        key: 'genetic-algorithms',
        label: i18n.t('optimizationMenu.GeneticAlgorithm', lang),
        disabled: counterUnlocked.solarPanelCount === 0,
        children: [
          {
            key: 'solar-panel-tilt-angle-ga-optimizer',
            label: (
              <DialogItem Dialog={SolarPanelTiltAngleGaWizard}>
                {i18n.t('optimizationMenu.SolarPanelTiltAngleOptimization', lang)}...
              </DialogItem>
            ),
          },
        ],
      },
      {
        key: 'particle-swarm-optimization',
        label: i18n.t('optimizationMenu.ParticleSwarmOptimization', lang),
        disabled: counterUnlocked.solarPanelCount === 0,
        children: [
          {
            key: 'solar-panel-tilt-angle-pso-optimizer',
            label: (
              <DialogItem Dialog={SolarPanelTiltAnglePsoWizard}>
                {i18n.t('optimizationMenu.SolarPanelTiltAngleOptimization', lang)}...
              </DialogItem>
            ),
          },
        ],
      },
    ],
  });

  // foundation-label
  if (editable) {
    items.push({
      key: 'foundation-label',
      label: i18n.t('labelSubMenu.Label', lang),
      children: createLabelSubmenu(foundation),
    });
  }

  return { items } as MenuProps;
};
