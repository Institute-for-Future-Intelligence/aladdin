/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import i18n from 'src/i18n/i18n';
import { FoundationModel } from 'src/models/FoundationModel';
import { ElementCounter } from 'src/stores/ElementCounter';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { UndoableRemoveAllChildren } from 'src/undo/UndoableRemoveAllChildren';
import type { MenuProps } from 'antd';
import { LockOffspringsItem, RemoveFoundationElementsItem } from './foundationMenuItems';

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
    key: 'outsideLightCount',
    objectType: ObjectType.Light,
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
    case ObjectType.Light: {
      itemLabel = `${i18n.t('foundationMenu.RemoveAllUnlockedLights', lang)} (${count})`;
      modalTitle = `${i18n.t('foundationMenu.DoYouReallyWantToRemoveAllLightsOnFoundation', lang)} (${count} ${i18n.t(
        'foundationMenu.Lights',
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

const getCount = (counter: ElementCounter, key: keyof ElementCounter, objectType: ObjectType) => {
  if (objectType === ObjectType.Light) {
    return counter.insideLightCount + counter.outsideLightCount;
  } else {
    return counter[key];
  }
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

export const createFoundationElementCounterSubmenu = (
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

  // elements-counter-others
  counterItems.forEach(({ key, objectType }) => {
    const count = getCount(counterUnlocked, key, objectType);

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
