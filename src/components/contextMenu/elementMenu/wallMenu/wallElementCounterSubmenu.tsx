/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import i18n from 'src/i18n/i18n';
import { ElementCounter } from 'src/stores/ElementCounter';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import type { MenuProps } from 'antd';
import { WallModel } from 'src/models/WallModel';
import { LightSideItem, LockWallElementsItem, RemoveWallElementsItem } from './wallMenuItems';

type WallCounterItem = {
  key: keyof ElementCounter;
  lockedKey: keyof ElementCounter;
  objectType: ObjectType;
};

const counterItems: WallCounterItem[] = [
  {
    key: 'solarPanelCount',
    lockedKey: 'lockedSolarPanelCount',
    objectType: ObjectType.SolarPanel,
  },
  {
    key: 'windowCount',
    lockedKey: 'lockedWindowCount',
    objectType: ObjectType.Window,
  },
  {
    key: 'doorCount',
    lockedKey: 'lockedDoorCount',
    objectType: ObjectType.Door,
  },
  {
    key: 'sensorCount',
    lockedKey: 'lockedSensorCount',
    objectType: ObjectType.Sensor,
  },
  {
    key: 'polygonCount',
    lockedKey: 'lockedPolygonCount',
    objectType: ObjectType.Polygon,
  },
  {
    key: 'outsideLightCount',
    lockedKey: 'lockedLightCount',
    objectType: ObjectType.Light,
  },
];

const getItemText = (type: ObjectType, count: number) => {
  const lang = { lng: useStore.getState().language };

  let itemLabel = '';
  let modalTitle = '';

  switch (type) {
    case ObjectType.SolarPanel: {
      itemLabel = `${i18n.t('wallMenu.RemoveAllUnlockedSolarPanels', lang)} (${count})`;
      modalTitle = `${i18n.t('wallMenu.DoYouReallyWantToRemoveAllSolarPanelsOnThisWall', lang)} (${count} ${i18n.t(
        'wallMenu.SolarPanels',
        lang,
      )})`;
      break;
    }
    case ObjectType.Window: {
      itemLabel = `${i18n.t('wallMenu.RemoveAllUnlockedWindows', lang)} (${count})`;
      modalTitle = `${i18n.t('wallMenu.DoYouReallyWantToRemoveAllWindowsOnThisWall', lang)} (${count} ${i18n.t(
        'wallMenu.Windows',
        lang,
      )})`;
      break;
    }
    case ObjectType.Door: {
      itemLabel = `${i18n.t('wallMenu.RemoveAllUnlockedDoors', lang)} (${count})`;
      modalTitle = `${i18n.t('wallMenu.DoYouReallyWantToRemoveAllDoorsOnThisWall', lang)} (${count} ${i18n.t(
        'wallMenu.Doors',
        lang,
      )})`;
      break;
    }
    case ObjectType.Sensor: {
      itemLabel = `${i18n.t('wallMenu.RemoveAllUnlockedSensors', lang)} (${count})`;
      modalTitle = `${i18n.t('wallMenu.DoYouReallyWantToRemoveAllSensorsOnThisWall', lang)} (${count} ${i18n.t(
        'wallMenu.Sensors',
        lang,
      )})`;
      break;
    }
    case ObjectType.Light: {
      itemLabel = `${i18n.t('wallMenu.RemoveAllUnlockedLights', lang)} (${count})`;
      modalTitle = `${i18n.t('wallMenu.DoYouReallyWantToRemoveAllLightsOnThisWall', lang)} (${count} ${i18n.t(
        'wallMenu.Lights',
        lang,
      )})`;
      break;
    }
    case ObjectType.Polygon: {
      itemLabel = `${i18n.t('wallMenu.RemoveAllUnlockedPolygons', lang)} (${count})`;
      modalTitle = `${i18n.t('wallMenu.DoYouReallyWantToRemoveAllPolygonsOnThisWall', lang)} (${count} ${i18n.t(
        'wallMenu.Polygons',
        lang,
      )})`;
      break;
    }
  }

  return { itemLabel, modalTitle };
};

const getCount = (counter: ElementCounter, key: keyof ElementCounter, objectType: ObjectType, locked?: boolean) => {
  if (objectType === ObjectType.Light) {
    if (locked) return counter.lockedLightCount;
    return counter.insideLightCount + counter.outsideLightCount;
  } else {
    return counter[key];
  }
};

export const createWallElementCounterSubmenu = (
  wall: WallModel,
  counterAll: ElementCounter,
  counterUnlocked: ElementCounter,
) => {
  const items: MenuProps['items'] = [];
  const lang = { lng: useStore.getState().language };

  // remove-elements
  counterItems.forEach(({ key, objectType }) => {
    const count = getCount(counterUnlocked, key, objectType);

    if (typeof count === 'number' && count > 0) {
      const { itemLabel, modalTitle } = getItemText(objectType, count);
      const typeKeyName = objectType.replaceAll(' ', '');

      items.push({
        key: `remove-all-${typeKeyName}s-on-wall`,
        label: (
          <RemoveWallElementsItem wall={wall} objectType={objectType} modalTitle={modalTitle}>
            {itemLabel}
          </RemoveWallElementsItem>
        ),
      });
    }
  });

  // lock-elements
  counterItems.forEach(({ key, objectType }) => {
    const count = getCount(counterUnlocked, key, objectType);
    if (typeof count === 'number' && count > 0) {
      const objectTypeText = objectType.replaceAll(' ', '');
      items.push({
        key: `lock-all-${objectTypeText}s-on-wall`,
        label: (
          <LockWallElementsItem wall={wall} objectType={objectType} lock={true}>
            {i18n.t(`wallMenu.LockAllUnlocked${objectTypeText}s`, lang)} ({count})
          </LockWallElementsItem>
        ),
      });
    }
  });

  // unlock-elements
  counterItems.forEach(({ lockedKey, objectType }) => {
    const count = getCount(counterAll, lockedKey, objectType, true);
    if (typeof count === 'number' && count > 0) {
      const objectTypeText = objectType.replaceAll(' ', '');
      items.push({
        key: `unlock-all-${objectTypeText}s-on-wall`,
        label: (
          <LockWallElementsItem wall={wall} objectType={objectType} lock={false}>
            {i18n.t(`wallMenu.UnlockAllLocked${objectTypeText}s`, lang)} ({count})
          </LockWallElementsItem>
        ),
      });
    }
  });

  // lights-inside
  if (counterAll.outsideLightCount > 0) {
    items.push({
      key: 'inside-lights-on-wall',
      label: (
        <LightSideItem wall={wall} inside={true}>
          {i18n.t(`wallMenu.AllLightsOnWallInside`, lang)} ({counterAll.outsideLightCount})
        </LightSideItem>
      ),
    });
  }

  // lights-outside
  if (counterAll.insideLightCount > 0) {
    items.push({
      key: 'outside-lights-on-wall',
      label: (
        <LightSideItem wall={wall} inside={false}>
          {i18n.t(`wallMenu.AllLightsOnWallOutside`, lang)} ({counterAll.insideLightCount})
        </LightSideItem>
      ),
    });
  }

  return items;
};
