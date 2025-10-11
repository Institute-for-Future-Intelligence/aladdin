/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { useStore } from '../../../../stores/common';
import { ObjectType } from '../../../../types';
import { ContextSubMenu, Paste } from '../../menuItems';
import i18n from '../../../../i18n/i18n';
import { ElementCounter } from '../../../../stores/ElementCounter';
import {
  AlbedoInput,
  GroundColorSubmenu,
  GroundImageCheckbox,
  LeafOutDayInput,
  LeafShedDayInput,
  LockElementsItem,
  MonthlyIrradianceLossSubmenu,
  RemoveGroundElementsItem,
  SurfaceTypeSubmenu,
} from './groundMenuItems';
import { useLanguage } from 'src/hooks';
import * as Selector from 'src/stores/selector';

type GroundCounterItem = { key: keyof ElementCounter; type: ObjectType; itemLabel: string; modalTitle: string };

const counterItems: GroundCounterItem[] = [
  {
    key: 'humanCount',
    type: ObjectType.Human,
    itemLabel: 'groundMenu.RemoveAllUnlockedPeople',
    modalTitle: 'groundMenu.DoYouReallyWantToRemoveAllPeople',
  },
  {
    key: 'treeCount',
    type: ObjectType.Tree,
    itemLabel: 'groundMenu.RemoveAllUnlockedTrees',
    modalTitle: 'groundMenu.DoYouReallyWantToRemoveAllTrees',
  },
  {
    key: 'flowerCount',
    type: ObjectType.Flower,
    itemLabel: 'groundMenu.RemoveAllUnlockedFlowers',
    modalTitle: 'groundMenu.DoYouReallyWantToRemoveAllFlowers',
  },
  {
    key: 'solarPanelCount',
    type: ObjectType.SolarPanel,
    itemLabel: 'groundMenu.RemoveAllUnlockedSolarPanels',
    modalTitle: 'groundMenu.DoYouReallyWantToRemoveAllSolarPanels',
  },
  {
    key: 'foundationCount',
    type: ObjectType.Foundation,
    itemLabel: 'groundMenu.RemoveAllUnlockedFoundations',
    modalTitle: 'groundMenu.DoYouReallyWantToRemoveAllFoundations',
  },
  {
    key: 'cuboidCount',
    type: ObjectType.Cuboid,
    itemLabel: 'groundMenu.RemoveAllUnlockedCuboids',
    modalTitle: 'groundMenu.DoYouReallyWantToRemoveAllCuboids',
  },
];

const GroundMenu = () => {
  const lang = useLanguage();
  const elementCounter: ElementCounter = useStore.getState().countAllElementsByType(true);
  const waterSurface = useStore(Selector.viewState.waterSurface);

  const legalToPaste = () => {
    const elementsToPaste = useStore.getState().elementsToPaste;

    if (!elementsToPaste || elementsToPaste.length === 0) return false;

    const e = elementsToPaste[0];
    return (
      e.type === ObjectType.Human ||
      e.type === ObjectType.Tree ||
      e.type === ObjectType.Flower ||
      e.type === ObjectType.Cuboid ||
      e.type === ObjectType.Ruler ||
      e.type === ObjectType.Protractor ||
      e.type === ObjectType.Foundation
    );
  };

  const removeGroundElementItems = () =>
    counterItems.map(({ key, type, itemLabel, modalTitle }) => {
      const count = elementCounter[key];
      if (typeof count === 'number' && count > 0) {
        return (
          <RemoveGroundElementsItem
            key={key}
            objectType={type}
            itemLabel={`${i18n.t(itemLabel, lang)} (${count})`}
            modalTitle={`${i18n.t(modalTitle, lang)} (${count})?`}
          />
        );
      } else {
        return null;
      }
    });

  return (
    <>
      {/* paste */}
      {legalToPaste() && <Paste />}

      {/* remove elements */}
      {removeGroundElementItems()}

      {/* lock-all-elements */}
      {elementCounter.unlockedCount > 0 && (
        <LockElementsItem
          lock={true}
          count={elementCounter.unlockedCount}
          label={i18n.t('groundMenu.LockAllUnlockedElements', lang)}
        />
      )}

      {/* unlock-all-elements */}
      {elementCounter.lockedCount > 0 && useStore.getState().elements.length > 0 && (
        <LockElementsItem
          lock={false}
          count={elementCounter.lockedCount}
          label={i18n.t('groundMenu.UnlockAllLockedElements', lang)}
        />
      )}

      {/* image-on-ground */}
      <GroundImageCheckbox />

      {/* surface-type-submenu */}
      <SurfaceTypeSubmenu />

      {/* ground-color-submenu */}
      {!waterSurface && <GroundColorSubmenu />}

      {/* vegetation-submenu */}
      <ContextSubMenu label={i18n.t('groundMenu.Vegetation', lang)}>
        <LeafOutDayInput />
        <LeafShedDayInput />
      </ContextSubMenu>

      {/* monthly-irradiance-loss-submenu */}
      <MonthlyIrradianceLossSubmenu />

      {/* ground-albedo */}
      <AlbedoInput />
    </>
  );
};

export default GroundMenu;
