/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import type { MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { CuboidTexture, ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, GroupMasterCheckbox, Lock, MenuItem, Paste } from '../../menuItems';
import { CuboidModel } from 'src/models/CuboidModel';
import { AddPolygonItem, StackableCheckbox, TransparentCheckbox } from './cuboidMenuItems';
import i18n from 'src/i18n/i18n';
import CuboidColorSelection from './cuboidColorSelection';
import CuboidTextureSelection from './cuboidTextureSelection';
import CuboidLengthInput from './cuboidLengthInput';
import CuboidWidthInput from './cuboidWidthInput';
import CuboidHeightInput from './cuboidHeightInput';
import CuboidAzimuthInput from './cuboidAzimuthInput';
import { createLabelSubmenu } from '../../labelSubmenuItems';
import { createCuboidElementCounterSubmenu } from './cuboidElementCounterSubmenu';

const legalToPaste = () => {
  const elementsToPaste = useStore.getState().elementsToPaste;

  if (elementsToPaste && elementsToPaste.length > 0) {
    const e = elementsToPaste[0];
    if (
      e.type === ObjectType.Human ||
      e.type === ObjectType.Tree ||
      e.type === ObjectType.Flower ||
      e.type === ObjectType.Polygon ||
      e.type === ObjectType.Sensor ||
      e.type === ObjectType.SolarPanel ||
      e.type === ObjectType.Cuboid
    ) {
      return true;
    }
  }
  return false;
};

export const createCuboidMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.Cuboid) return { items };

  const cuboid = selectedElement as CuboidModel;

  const selectedSideIndex = useStore.getState().selectedSideIndex;
  const lang = { lng: useStore.getState().language };

  const counterUnlocked = useStore.getState().countAllOffspringsByTypeAtOnce(cuboid.id, false);
  const editable = !cuboid?.locked;
  const showColorSelection =
    !cuboid.textureTypes ||
    (selectedSideIndex >= 0 && cuboid.textureTypes[selectedSideIndex] === CuboidTexture.NoTexture);

  if (legalToPaste()) {
    items.push({
      key: 'cuboid-paste',
      label: <Paste />,
    });
  }

  items.push({
    key: 'cuboid-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push({
      key: 'cuboid-cut',
      label: <Cut />,
    });
  }

  items.push({
    key: 'cuboid-lock',
    label: <Lock selectedElement={cuboid} />,
  });

  items.push({
    key: 'cuboid-group-master',
    label: <GroupMasterCheckbox groupableElement={cuboid} />,
  });

  items.push({
    key: 'cuboid-stackable',
    label: <StackableCheckbox cuboid={cuboid} />,
  });

  items.push({
    key: 'cuboid-transparent',
    label: <TransparentCheckbox cuboid={cuboid} />,
  });

  if (counterUnlocked.gotSome()) {
    items.push({
      key: 'cuboid-clear',
      label: <MenuItem>{i18n.t('word.Clear', lang)}</MenuItem>,
      children: createCuboidElementCounterSubmenu(cuboid, counterUnlocked),
    });
  }

  if (editable) {
    if (showColorSelection) {
      items.push({
        key: 'cuboid-color',
        label: <DialogItem Dialog={CuboidColorSelection}>{i18n.t('word.Color', lang)} ...</DialogItem>,
      });
    }

    items.push({
      key: 'cuboid-texture',
      label: <DialogItem Dialog={CuboidTextureSelection}>{i18n.t('word.Texture', lang)} ...</DialogItem>,
    });

    items.push({
      key: 'cuboid-length',
      label: <DialogItem Dialog={CuboidLengthInput}>{i18n.t('word.Length', lang)} ...</DialogItem>,
    });

    items.push({
      key: 'cuboid-width',
      label: <DialogItem Dialog={CuboidWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>,
    });

    items.push({
      key: 'cuboid-height',
      label: <DialogItem Dialog={CuboidHeightInput}>{i18n.t('word.Height', lang)} ...</DialogItem>,
    });

    items.push({
      key: 'cuboid-azimuth',
      label: <DialogItem Dialog={CuboidAzimuthInput}>{i18n.t('word.Azimuth', lang)} ...</DialogItem>,
    });
  }

  items.push({
    key: 'add-polygon-on-cuboid',
    label: <AddPolygonItem cuboid={cuboid} selectedSideIndex={selectedSideIndex} />,
  });

  if (editable) {
    items.push({
      key: 'cuboid-label',
      label: <MenuItem>{i18n.t('labelSubMenu.Label', lang)}</MenuItem>,
      children: createLabelSubmenu(cuboid),
    });
  }

  return { items } as MenuProps;
};
