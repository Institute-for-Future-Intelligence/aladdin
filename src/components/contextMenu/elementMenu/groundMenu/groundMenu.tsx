/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { useStore } from '../../../../stores/common';
import { ObjectType } from '../../../../types';
import { MenuItem, Paste } from '../../menuItems';
import i18n from '../../../../i18n/i18n';
import { ElementCounter } from '../../../../stores/ElementCounter';
import { Flex, MenuProps, Space } from 'antd';
import {
  AlbedoInput,
  GroundColorPicker,
  GroundImageCheckbox,
  IrradianceLossInput,
  LeafOutDayInput,
  LeafShedDayInput,
  LockElementsItem,
  RemoveGroundElementsItem,
  SurfaceTypeRadioGroup,
} from './groundMenuItems';
import { MONTHS_ABBV } from 'src/constants';
import { Surface } from 'recharts';

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

const legalToPaste = () => {
  const elementsToPaste = useStore.getState().elementsToPaste;

  if (!elementsToPaste || elementsToPaste.length === 0) return false;

  const e = elementsToPaste[0];
  return (
    e.type === ObjectType.Human ||
    e.type === ObjectType.Tree ||
    e.type === ObjectType.Flower ||
    e.type === ObjectType.Cuboid ||
    e.type === ObjectType.Foundation
  );
};

const createMonthlyIrradianceLossSubmenu = () => {
  const lang = { lng: useStore.getState().language };
  const c = MONTHS_ABBV.slice().reduce((acc, curr, idx, arr) => {
    if (acc && idx % 2 !== 0) {
      acc.push({
        key: `${arr[idx - 1]}-${arr[idx]}`,
        label: (
          <MenuItem stayAfterClick noPadding>
            <IrradianceLossInput monthIndex={idx - 1} />
            <IrradianceLossInput monthIndex={idx} />
          </MenuItem>
        ),
      });
    }
    return acc;
  }, [] as MenuProps['items']);
  c?.push({
    key: `title`,
    label: (
      <>
        <hr style={{ marginTop: '6px' }} />
        <Flex style={{ width: '240px' }}>
          <span style={{ fontSize: '32px', marginTop: '-6px', paddingRight: '8px', verticalAlign: 'top' }}>🎓</span>
          <span style={{ fontSize: '12px' }}>{i18n.t('groundMenu.MonthlyIrradianceLossExplanation', lang)}</span>
        </Flex>
      </>
    ),
  });
  return c;
};

export const createGroundMenu = () => {
  const lang = { lng: useStore.getState().language };

  const elementCounter: ElementCounter = useStore.getState().countAllElementsByType(true);

  const items: MenuProps['items'] = [];

  if (legalToPaste()) {
    items.push({
      key: 'ground-paste',
      label: <Paste />,
    });
  }

  counterItems.forEach(({ key, type, itemLabel, modalTitle }) => {
    const count = elementCounter[key];
    if (typeof count === 'number' && count > 0) {
      items.push({
        key: `ground-remove-all-${type}s`,
        label: (
          <RemoveGroundElementsItem
            objectType={type}
            itemLabel={`${i18n.t(itemLabel, lang)} (${count})`}
            modalTitle={`${i18n.t(modalTitle, lang)} (${count})?`}
          />
        ),
      });
    }
  });

  if (elementCounter.unlockedCount > 0) {
    items.push({
      key: 'lock-all-elements',
      label: (
        <LockElementsItem
          lock={true}
          count={elementCounter.unlockedCount}
          label={i18n.t('groundMenu.LockAllUnlockedElements', lang)}
        />
      ),
    });
  }

  if (elementCounter.lockedCount > 0 && useStore.getState().elements.length > 0) {
    items.push({
      key: 'unlock-all-elements',
      label: (
        <LockElementsItem
          lock={false}
          count={elementCounter.lockedCount}
          label={i18n.t('groundMenu.UnlockAllLockedElements', lang)}
        />
      ),
    });
  }

  items.push({
    key: 'image-on-ground',
    label: <GroundImageCheckbox />,
  });

  items.push({
    key: 'surface-type-submenu',
    label: <MenuItem>{i18n.t('groundMenu.SurfaceType', lang)}</MenuItem>,
    children: [
      {
        key: 'surface-type',
        label: <SurfaceTypeRadioGroup />,
      },
    ],
  });

  if (!useStore.getState().viewState.waterSurface) {
    items.push({
      key: 'ground-color-submenu',
      label: <MenuItem>{i18n.t('word.Color', lang)}</MenuItem>,
      children: [
        {
          key: 'ground-color-picker',
          label: <GroundColorPicker />,
          style: { backgroundColor: 'white' },
        },
      ],
    });
  }

  items.push({
    key: 'vegetation-submenu',
    label: <MenuItem>{i18n.t('groundMenu.Vegetation', lang)}</MenuItem>,
    children: [
      {
        key: 'leaf-out-day',
        label: <LeafOutDayInput />,
      },
      {
        key: 'leaf-shed-day',
        label: <LeafShedDayInput />,
      },
    ],
  });

  items.push({
    key: 'monthly-irradiance-loss-submenu',
    label: <MenuItem>{i18n.t('groundMenu.MonthlyIrradianceLoss', lang)}</MenuItem>,
    children: createMonthlyIrradianceLossSubmenu(),
  });

  items.push({
    key: 'ground-albedo',
    label: <AlbedoInput />,
  });

  return { items } as MenuProps;
};
