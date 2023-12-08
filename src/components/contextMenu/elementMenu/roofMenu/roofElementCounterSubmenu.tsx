/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import i18n from 'src/i18n/i18n';
import { ElementCounter } from 'src/stores/ElementCounter';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import type { MenuProps } from 'antd';
import { RoofModel } from 'src/models/RoofModel';
import { LockRoofElementsItem, RemoveRoofElementsItem } from './roofMenuItems';
import { LightSideItem } from '../../menuItems';

type RoofCounterItem = {
  key: keyof ElementCounter;
  lockedKey: keyof ElementCounter;
  objectType: ObjectType;
};

const counterItems: RoofCounterItem[] = [
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
    key: 'sensorCount',
    lockedKey: 'lockedSensorCount',
    objectType: ObjectType.Sensor,
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
      itemLabel = `${i18n.t('roofMenu.RemoveAllUnlockedSolarPanels', lang)} (${count})`;
      modalTitle = `${i18n.t('roofMenu.DoYouReallyWantToRemoveAllSolarPanelsOnThisRoof', lang)} (${count} ${i18n.t(
        'roofMenu.SolarPanels',
        lang,
      )})`;
      break;
    }
    case ObjectType.Window: {
      itemLabel = `${i18n.t('roofMenu.RemoveAllUnlockedWindows', lang)} (${count})`;
      modalTitle = `${i18n.t('roofMenu.DoYouReallyWantToRemoveAllWindowsOnThisRoof', lang)} (${count} ${i18n.t(
        'roofMenu.Windows',
        lang,
      )})`;
      break;
    }
    case ObjectType.Sensor: {
      itemLabel = `${i18n.t('roofMenu.RemoveAllUnlockedSensors', lang)} (${count})`;
      modalTitle = `${i18n.t('roofMenu.DoYouReallyWantToRemoveAllSensorsOnThisRoof', lang)} (${count} ${i18n.t(
        'roofMenu.Sensors',
        lang,
      )})`;
      break;
    }
    case ObjectType.Light: {
      itemLabel = `${i18n.t('roofMenu.RemoveAllUnlockedLights', lang)} (${count})`;
      modalTitle = `${i18n.t('roofMenu.DoYouReallyWantToRemoveAllLightsOnThisRoof', lang)} (${count} ${i18n.t(
        'roofMenu.Lights',
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

export const createRoofElementCounterSubmenu = (
  roof: RoofModel,
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
        key: `remove-all-${typeKeyName}s-on-roof`,
        label: (
          <RemoveRoofElementsItem roof={roof} objectType={objectType} modalTitle={modalTitle}>
            {itemLabel}
          </RemoveRoofElementsItem>
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
        key: `lock-all-${objectTypeText}s-on-roof`,
        label: (
          <LockRoofElementsItem roof={roof} objectType={objectType} lock={true}>
            {i18n.t(`wallMenu.LockAllUnlocked${objectTypeText}s`, lang)} ({count})
          </LockRoofElementsItem>
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
          <LockRoofElementsItem roof={roof} objectType={objectType} lock={false}>
            {i18n.t(`wallMenu.UnlockAllLocked${objectTypeText}s`, lang)} ({count})
          </LockRoofElementsItem>
        ),
      });
    }
  });

  // lights-inside
  if (counterAll.outsideLightCount > 0) {
    items.push({
      key: 'inside-lights-on-wall',
      label: (
        <LightSideItem element={roof} inside={true}>
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
        <LightSideItem element={roof} inside={false}>
          {i18n.t(`wallMenu.AllLightsOnWallOutside`, lang)} ({counterAll.insideLightCount})
        </LightSideItem>
      ),
    });
  }

  return items;
};
