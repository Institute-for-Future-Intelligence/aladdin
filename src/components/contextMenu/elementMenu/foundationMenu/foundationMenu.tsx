/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import type { MenuProps } from 'antd';
import { BuildingCompletionStatus, FoundationTexture, ObjectType, SolarStructure } from 'src/types';
import { Copy, Cut, Lock, MenuItem, Paste } from '../../menuItems';
import { FoundationModel } from 'src/models/FoundationModel';
import { ElementModel } from 'src/models/ElementModel';
import {
  AddPolygonItem,
  BuildingCheckbox,
  DialogItem,
  GroupMasterCheckbox,
  HvacSystemIdInput,
  LabelColorInput,
  LabelFontSizeInput,
  LabelHeightInput,
  LabelSizeInput,
  LabelTextInput,
  LockOffspringsItem,
  RemoveFoundationElementsItem,
  ShowLabelCheckbox,
  SolarStructureRadioGroup,
  ThermostatTemperatureInput,
  ToleranceThresholdInput,
} from './foundationMenuItems';
import i18n from 'src/i18n/i18n';
import { ElementCounter } from 'src/stores/ElementCounter';
import { UndoableRemoveAllChildren } from 'src/undo/UndoableRemoveAllChildren';
import FoundationTextureSelection from '../foundationTextureSelection';
import FoundationColorSelection from '../foundationColorSelection';
import FoundationLengthInput from '../foundationLengthInput';
import FoundationWidthInput from '../foundationWidthInput';
import FoundationHeightInput from '../foundationHeightInput';
import FoundationAzimuthInput from '../foundationAzimuthInput';
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

type FoundationCounterItem = {
  key: keyof ElementCounter;
  objectType: ObjectType;
};

const counterItems: FoundationCounterItem[] = [
  {
    key: 'windowCount',
    objectType: ObjectType.Window,
  },
  {
    key: 'doorCount',
    objectType: ObjectType.Door,
  },
  {
    key: 'sensorCount',
    objectType: ObjectType.Sensor,
  },
  {
    key: 'parabolicTroughCount',
    objectType: ObjectType.ParabolicTrough,
  },
  {
    key: 'parabolicDishCount',
    objectType: ObjectType.ParabolicDish,
  },
  {
    key: 'fresnelReflectorCount',
    objectType: ObjectType.FresnelReflector,
  },
  {
    key: 'heliostatCount',
    objectType: ObjectType.Heliostat,
  },
  {
    key: 'windTurbineCount',
    objectType: ObjectType.WindTurbine,
  },
  {
    key: 'polygonCount',
    objectType: ObjectType.Polygon,
  },
  {
    key: 'humanCount',
    objectType: ObjectType.Human,
  },
  {
    key: 'treeCount',
    objectType: ObjectType.Tree,
  },
  {
    key: 'flowerCount',
    objectType: ObjectType.Flower,
  },
];

const getItemText = (type: ObjectType, count: number) => {
  const lang = { lng: useStore.getState().language };

  let itemLabel = '';
  let modalTitle = '';

  switch (type) {
    case ObjectType.Wall: {
      itemLabel = `${i18n.t('foundationMenu.RemoveAllUnlockedWalls', lang)} (${count})`;
      modalTitle = `${i18n.t('foundationMenu.DoYouReallyWantToRemoveAllWallsOnFoundation', lang)} (${count} ${i18n.t(
        'foundationMenu.Walls',
        lang,
      )})`;
      break;
    }
    case ObjectType.Window: {
      itemLabel = `${i18n.t('foundationMenu.RemoveAllUnlockedWindows', lang)} (${count})`;
      modalTitle = `${i18n.t('foundationMenu.DoYouReallyWantToRemoveAllWindowsOnFoundation', lang)} (${count} ${i18n.t(
        'foundationMenu.Windows',
        lang,
      )})`;
      break;
    }
    case ObjectType.Door: {
      itemLabel = `${i18n.t('foundationMenu.RemoveAllUnlockedDoors', lang)} (${count})`;
      modalTitle = `${i18n.t('foundationMenu.DoYouReallyWantToRemoveAllDoorsOnFoundation', lang)} (${count} ${i18n.t(
        'foundationMenu.Doors',
        lang,
      )})`;
      break;
    }
    case ObjectType.Sensor: {
      itemLabel = `${i18n.t('foundationMenu.RemoveAllUnlockedSensors', lang)} (${count})`;
      modalTitle = `${i18n.t('foundationMenu.DoYouReallyWantToRemoveAllSensorsOnFoundation', lang)} (${count} ${i18n.t(
        'foundationMenu.Sensors',
        lang,
      )})`;
      break;
    }
    case ObjectType.ParabolicTrough: {
      itemLabel = `${i18n.t('foundationMenu.RemoveAllUnlockedParabolicTroughs', lang)} (${count})`;
      modalTitle = `${i18n.t(
        'foundationMenu.DoYouReallyWantToRemoveAllParabolicTroughsOnFoundation',
        lang,
      )} (${count} ${i18n.t('foundationMenu.ParabolicTroughs', lang)})`;
      break;
    }
    case ObjectType.ParabolicDish: {
      itemLabel = `${i18n.t('foundationMenu.RemoveAllUnlockedParabolicDishes', lang)} (${count})`;
      modalTitle = `${i18n.t(
        'foundationMenu.DoYouReallyWantToRemoveAllParabolicDishesOnFoundation',
        lang,
      )} (${count} ${i18n.t('foundationMenu.ParabolicDishes', lang)})`;
      break;
    }
    case ObjectType.FresnelReflector: {
      itemLabel = `${i18n.t('foundationMenu.RemoveAllUnlockedFresnelReflectors', lang)} (${count})`;
      modalTitle = `${i18n.t(
        'foundationMenu.DoYouReallyWantToRemoveAllFresnelReflectorsOnFoundation',
        lang,
      )} (${count} ${i18n.t('foundationMenu.FresnelReflectors', lang)})`;
      break;
    }
    case ObjectType.Heliostat: {
      itemLabel = `${i18n.t('foundationMenu.RemoveAllUnlockedHeliostats', lang)} (${count})`;
      modalTitle = `${i18n.t(
        'foundationMenu.DoYouReallyWantToRemoveAllHeliostatsOnFoundation',
        lang,
      )} (${count} ${i18n.t('foundationMenu.Heliostats', lang)})`;
      break;
    }
    case ObjectType.WindTurbine: {
      itemLabel = `${i18n.t('foundationMenu.RemoveAllUnlockedWindTurbines', lang)} (${count})`;
      modalTitle = `${i18n.t(
        'foundationMenu.DoYouReallyWantToRemoveAllWindTurbinesOnFoundation',
        lang,
      )} (${count} ${i18n.t('foundationMenu.WindTurbines', lang)})`;
      break;
    }
    case ObjectType.Polygon: {
      itemLabel = `${i18n.t('foundationMenu.RemoveAllUnlockedPolygons', lang)} (${count})`;
      modalTitle = `${i18n.t('foundationMenu.DoYouReallyWantToRemoveAllPolygonsOnFoundation', lang)} (${count} ${i18n.t(
        'foundationMenu.Polygons',
        lang,
      )})`;
      break;
    }
    case ObjectType.Human: {
      itemLabel = `${i18n.t('foundationMenu.RemoveAllUnlockedHumans', lang)} (${count})`;
      modalTitle = `${i18n.t('foundationMenu.DoYouReallyWantToRemoveAllHumansOnFoundation', lang)} (${count} ${i18n.t(
        'foundationMenu.Humans',
        lang,
      )})`;
      break;
    }
    case ObjectType.Tree: {
      itemLabel = `${i18n.t('foundationMenu.RemoveAllUnlockedTrees', lang)} (${count})`;
      modalTitle = `${i18n.t('foundationMenu.DoYouReallyWantToRemoveAllTreesOnFoundation', lang)} (${count} ${i18n.t(
        'foundationMenu.Trees',
        lang,
      )})`;
      break;
    }
    case ObjectType.Flower: {
      itemLabel = `${i18n.t('foundationMenu.RemoveAllUnlockedFlowers', lang)} (${count})`;
      modalTitle = `${i18n.t('foundationMenu.DoYouReallyWantToRemoveAllFlowersOnFoundation', lang)} (${count} ${i18n.t(
        'foundationMenu.Flowers',
        lang,
      )})`;
      break;
    }
  }

  return { itemLabel, modalTitle };
};

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

const handleClickRemoveAllWalls = (foundation: FoundationModel) => {
  const setCommonStore = useStore.getState().set;

  const wallsIdSet = new Set();
  useStore.getState().elements.forEach((e) => {
    if (!e.locked && e.type === ObjectType.Wall && (e.parentId === foundation.id || e.foundationId === foundation.id)) {
      wallsIdSet.add(e.id);
    }
  });
  const removed = useStore.getState().elements.filter((e) => wallsIdSet.has(e.id) || wallsIdSet.has(e.parentId));
  setCommonStore((state) => {
    state.elements = state.elements.filter((e) => !wallsIdSet.has(e.id) && !wallsIdSet.has(e.parentId));
  });
  const removedElements = JSON.parse(JSON.stringify(removed));
  const undoableRemoveAllWallChildren = {
    name: 'Remove All Walls on Foundation',
    timestamp: Date.now(),
    parentId: foundation.id,
    removedElements: removedElements,
    undo: () => {
      setCommonStore((state) => {
        state.elements.push(...undoableRemoveAllWallChildren.removedElements);
        state.updateWallMapOnFoundationFlag = !state.updateWallMapOnFoundationFlag;
      });
    },
    redo: () => {
      const wallsIdSet = new Set();
      useStore.getState().elements.forEach((e) => {
        if (!e.locked && e.type === ObjectType.Wall && e.parentId === undoableRemoveAllWallChildren.parentId) {
          wallsIdSet.add(e.id);
        }
      });
      setCommonStore((state) => {
        state.elements = state.elements.filter((e) => !wallsIdSet.has(e.id) && !wallsIdSet.has(e.parentId));
      });
    },
  } as UndoableRemoveAllChildren;
  useStore.getState().addUndoable(undoableRemoveAllWallChildren);
};

const createElementCounterSubmenu = (
  foundation: FoundationModel,
  counterAll: ElementCounter,
  counterUnlocked: ElementCounter,
) => {
  const items: MenuProps['items'] = [];
  const lang = { lng: useStore.getState().language };

  // lock-all-offsprings
  if (counterAll.unlockedCount > 0) {
    items.push({
      key: 'lock-all-offsprings',
      label: <LockOffspringsItem foundation={foundation} lock={true} count={counterAll.unlockedCount} />,
    });
  }

  // unlock-all-offsprings
  if (counterAll.lockedCount > 0) {
    items.push({
      key: 'unlock-all-offsprings',
      label: <LockOffspringsItem foundation={foundation} lock={false} count={counterAll.lockedCount} />,
    });
  }

  // elements-counter-wall
  if (counterUnlocked.wallCount > 0) {
    const { itemLabel, modalTitle } = getItemText(ObjectType.Wall, counterUnlocked.wallCount);
    items.push({
      key: `remove-all-walls-on-foundation`,
      label: (
        <RemoveFoundationElementsItem
          foundation={foundation}
          objectType={ObjectType.Wall}
          modalTitle={modalTitle}
          onClickOk={() => handleClickRemoveAllWalls(foundation)}
        >
          {itemLabel}
        </RemoveFoundationElementsItem>
      ),
    });
  }

  // elements-counter-solar-panels
  if (counterUnlocked.solarPanelCount > 0) {
    const modalTitle =
      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllSolarPanelsOnFoundation', lang) +
      ' (' +
      counterUnlocked.solarPanelModuleCount +
      ' ' +
      i18n.t('foundationMenu.SolarPanels', lang) +
      ', ' +
      counterUnlocked.solarPanelCount +
      ' ' +
      i18n.t('foundationMenu.Racks', lang) +
      ')?';
    items.push({
      key: `remove-all-solar-panels-on-foundation`,
      label: (
        <RemoveFoundationElementsItem
          foundation={foundation}
          objectType={ObjectType.SolarPanel}
          modalTitle={modalTitle}
        >
          {i18n.t('foundationMenu.RemoveAllUnlockedSolarPanels', lang)}&nbsp; ({counterUnlocked.solarPanelModuleCount}{' '}
          {i18n.t('foundationMenu.SolarPanels', lang)}, {counterUnlocked.solarPanelCount}{' '}
          {i18n.t('foundationMenu.Racks', lang)})
        </RemoveFoundationElementsItem>
      ),
    });
  }

  // elements-counter-lights
  if (counterUnlocked.insideLightCount + counterUnlocked.outsideLightCount > 0) {
    const modalTitle =
      i18n.t('foundationMenu.DoYouReallyWantToRemoveAllLightsOnFoundation', lang) +
      ' (' +
      (counterUnlocked.insideLightCount + counterUnlocked.outsideLightCount) +
      ' ' +
      i18n.t('foundationMenu.Lights', lang) +
      ')?';
    items.push({
      key: `remove-all-lights-on-foundation`,
      label: (
        <RemoveFoundationElementsItem foundation={foundation} objectType={ObjectType.Light} modalTitle={modalTitle}>
          {i18n.t('foundationMenu.RemoveAllUnlockedLights', lang)} (
          {counterUnlocked.insideLightCount + counterUnlocked.outsideLightCount})
        </RemoveFoundationElementsItem>
      ),
    });
  }

  // elements-counter-others
  counterItems.forEach(({ key, objectType }) => {
    const count = counterUnlocked[key];

    if (typeof count === 'number' && count > 0) {
      const { itemLabel, modalTitle } = getItemText(objectType, count);
      const typeKeyName = objectType.replaceAll(' ', '');

      items.push({
        key: `remove-all-${typeKeyName}s-on-foundation`,
        label: (
          <RemoveFoundationElementsItem foundation={foundation} objectType={objectType} modalTitle={modalTitle}>
            {itemLabel}
          </RemoveFoundationElementsItem>
        ),
      });
    }
  });

  return items;
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

  const counterAll = foundation
    ? useStore.getState().countAllOffspringsByTypeAtOnce(foundation.id, true)
    : new ElementCounter();

  const counterUnlocked = foundation
    ? useStore.getState().countAllOffspringsByTypeAtOnce(foundation.id, false)
    : new ElementCounter();

  // lock
  items.push({
    key: 'foundation-lock',
    label: <Lock selectedElement={foundation} />,
  });

  // group-master
  items.push({
    key: 'foundation-group-master',
    label: <GroupMasterCheckbox foundation={foundation} />,
  });

  // building
  items.push({
    key: 'building',
    label: <BuildingCheckbox foundation={foundation} />,
  });

  // paste
  if (legalToPasteOnFoundation()) {
    items.push({
      key: 'foundation-paste',
      label: <Paste />,
    });
  }

  // copy
  items.push({
    key: 'foundation-copy',
    label: <Copy />,
  });

  // cut
  if (editable) {
    items.push({
      key: 'foundation-cut',
      label: <Cut />,
    });
  }

  // lock-unlock-clear-on-foundation
  if (counterAll.gotSome()) {
    items.push({
      key: 'lock-unlock-clear-on-foundation',
      label: <MenuItem>{i18n.t('word.Elements', lang)}</MenuItem>,
      children: createElementCounterSubmenu(foundation, counterAll, counterUnlocked),
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
      children: [
        {
          key: 'foundation-show-label',
          label: <ShowLabelCheckbox foundation={foundation} />,
        },
        {
          key: 'foundation-label-text',
          label: <LabelTextInput foundation={foundation} />,
        },
        {
          key: 'foundation-label-height',
          label: <LabelHeightInput foundation={foundation} />,
        },
        {
          key: 'foundation-label-font-size',
          label: <LabelFontSizeInput foundation={foundation} />,
        },
        {
          key: 'foundation-label-size',
          label: <LabelSizeInput foundation={foundation} />,
        },
        {
          key: 'foundation-label-color',
          label: <LabelColorInput foundation={foundation} />,
        },
      ],
    });
  }

  return { items } as MenuProps;
};
