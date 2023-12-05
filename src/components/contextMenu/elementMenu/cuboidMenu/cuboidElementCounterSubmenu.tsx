import { ElementCounter } from 'src/stores/ElementCounter';
import { ObjectType } from 'src/types';
import type { MenuProps } from 'antd';
import { useStore } from 'src/stores/common';
import { CuboidModel } from 'src/models/CuboidModel';
import i18n from 'src/i18n/i18n';
import { RemoveCuboidElementsItem } from './cuboidMenuItems';

type CuboidCounterItem = {
  key: keyof ElementCounter;
  objectType: ObjectType;
};

const counterItems: CuboidCounterItem[] = [
  {
    key: 'sensorCount',
    objectType: ObjectType.Sensor,
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
  {
    key: 'outsideLightCount',
    objectType: ObjectType.Light,
  },
];

const getItemText = (type: ObjectType, count: number) => {
  const lang = { lng: useStore.getState().language };

  let itemLabel = '';
  let modalTitle = '';

  switch (type) {
    case ObjectType.Light: {
      itemLabel = `${i18n.t('cuboidMenu.RemoveAllUnlockedLights', lang)} (${count})`;
      modalTitle = `${i18n.t('cuboidMenu.DoYouReallyWantToRemoveAllLightsOnCuboid', lang)} (${count} ${i18n.t(
        'cuboidMenu.Lights',
        lang,
      )})`;
      break;
    }
    case ObjectType.Sensor: {
      itemLabel = `${i18n.t('cuboidMenu.RemoveAllUnlockedSensors', lang)} (${count})`;
      modalTitle = `${i18n.t('cuboidMenu.DoYouReallyWantToRemoveAllSensorsOnCuboid', lang)} (${count} ${i18n.t(
        'cuboidMenu.Sensors',
        lang,
      )})`;
      break;
    }
    case ObjectType.Polygon: {
      itemLabel = `${i18n.t('cuboidMenu.RemoveAllUnlockedPolygons', lang)} (${count})`;
      modalTitle = `${i18n.t('cuboidMenu.DoYouReallyWantToRemoveAllPolygonsOnCuboid', lang)} (${count} ${i18n.t(
        'cuboidMenu.Polygons',
        lang,
      )})`;
      break;
    }
    case ObjectType.Human: {
      itemLabel = `${i18n.t('cuboidMenu.RemoveAllUnlockedHumans', lang)} (${count})`;
      modalTitle = `${i18n.t('cuboidMenu.DoYouReallyWantToRemoveAllHumansOnCuboid', lang)} (${count} ${i18n.t(
        'cuboidMenu.Humans',
        lang,
      )})`;
      break;
    }
    case ObjectType.Tree: {
      itemLabel = `${i18n.t('cuboidMenu.RemoveAllUnlockedTrees', lang)} (${count})`;
      modalTitle = `${i18n.t('cuboidMenu.DoYouReallyWantToRemoveAllTreesOnCuboid', lang)} (${count} ${i18n.t(
        'cuboidMenu.Trees',
        lang,
      )})`;
      break;
    }
    case ObjectType.Flower: {
      itemLabel = `${i18n.t('cuboidMenu.RemoveAllUnlockedFlowers', lang)} (${count})`;
      modalTitle = `${i18n.t('cuboidMenu.DoYouReallyWantToRemoveAllFlowersOnCuboid', lang)} (${count} ${i18n.t(
        'cuboidMenu.Flowers',
        lang,
      )})`;
      break;
    }
  }

  return { itemLabel, modalTitle };
};

export const createCuboidElementCounterSubmenu = (cuboid: CuboidModel, counterUnlocked: ElementCounter) => {
  const items: MenuProps['items'] = [];
  const lang = { lng: useStore.getState().language };

  // remove-all-solar-panels-on-cuboid
  if (counterUnlocked.solarPanelCount > 0) {
    const modalTitle =
      i18n.t('cuboidMenu.DoYouReallyWantToRemoveAllSolarPanelsOnCuboid', lang) +
      ' (' +
      counterUnlocked.solarPanelModuleCount +
      ' ' +
      i18n.t('cuboidMenu.SolarPanels', lang) +
      ', ' +
      counterUnlocked.solarPanelCount +
      ' ' +
      i18n.t('cuboidMenu.Racks', lang) +
      ')?';

    items.push({
      key: `remove-all-solar-panels-on-cuboid`,
      label: (
        <RemoveCuboidElementsItem cuboid={cuboid} objectType={ObjectType.SolarPanel} modalTitle={modalTitle}>
          {i18n.t('cuboidMenu.RemoveAllUnlockedSolarPanels', lang)}&nbsp; ({counterUnlocked.solarPanelModuleCount}{' '}
          {i18n.t('cuboidMenu.SolarPanels', lang)},{counterUnlocked.solarPanelCount} {i18n.t('cuboidMenu.Racks', lang)})
        </RemoveCuboidElementsItem>
      ),
    });
  }

  // remove-all-others-on-cuboid
  counterItems.forEach(({ key, objectType }) => {
    const count = counterUnlocked[key];

    if (typeof count === 'number' && count > 0) {
      const { itemLabel, modalTitle } = getItemText(objectType, count);
      const typeKeyName = objectType.replaceAll(' ', '');

      items.push({
        key: `remove-all-${typeKeyName}s-on-cuboid`,
        label: (
          <RemoveCuboidElementsItem cuboid={cuboid} objectType={objectType} modalTitle={modalTitle}>
            {itemLabel}
          </RemoveCuboidElementsItem>
        ),
      });
    }
  });

  return items;
};
