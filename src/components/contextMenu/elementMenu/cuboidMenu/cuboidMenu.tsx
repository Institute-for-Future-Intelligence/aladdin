/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import { CuboidTexture, ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, GroupMasterCheckbox, Lock, Paste } from '../../menuItems';
import { CuboidModel } from 'src/models/CuboidModel';
import { AddPolygonItem, StackableCheckbox } from './cuboidMenuItems';
import i18n from 'src/i18n/i18n';
import CuboidColorSelection from './cuboidColorSelection';
import CuboidTextureSelection from './cuboidTextureSelection';
import CuboidLengthInput from './cuboidLengthInput';
import CuboidWidthInput from './cuboidWidthInput';
import CuboidHeightInput from './cuboidHeightInput';
import CuboidAzimuthInput from './cuboidAzimuthInput';
import LabelSubmenu from '../../labelSubmenuItems';
import CuboidElementCounterSubmenu from './cuboidElementCounterSubmenu';
import CuboidTransparencyInput from './cuboidTransparencyInput';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

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

const CuboidMenu = () => {
  const lang = useLanguage();
  const cuboid = useContextMenuElement(ObjectType.Cuboid) as CuboidModel;

  if (!cuboid) return null;

  const editable = !cuboid.locked;
  const selectedSideIndex = useStore.getState().selectedSideIndex;
  const counterUnlocked = useStore.getState().countAllOffspringsByTypeAtOnce(cuboid.id, false);
  const showColorSelection =
    !cuboid.textureTypes ||
    (selectedSideIndex >= 0 && cuboid.textureTypes[selectedSideIndex] === CuboidTexture.NoTexture);

  return (
    <>
      {legalToPaste() && <Paste />}

      <Copy />

      {editable && <Cut />}

      <Lock selectedElement={cuboid} />

      <GroupMasterCheckbox groupableElement={cuboid} />

      <StackableCheckbox cuboid={cuboid} />

      {counterUnlocked.gotSome() && <CuboidElementCounterSubmenu cuboid={cuboid} counterUnlocked={counterUnlocked} />}

      {editable && (
        <>
          {showColorSelection && (
            <DialogItem Dialog={CuboidColorSelection}>{i18n.t('word.Color', lang)} ...</DialogItem>
          )}

          {/* cuboid-texture */}
          <DialogItem Dialog={CuboidTextureSelection}>{i18n.t('word.Texture', lang)} ...</DialogItem>

          {/* cuboid-length */}
          <DialogItem Dialog={CuboidLengthInput}>{i18n.t('word.Length', lang)} ...</DialogItem>

          {/* cuboid-width */}
          <DialogItem Dialog={CuboidWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>

          {/* cuboid-height */}
          <DialogItem Dialog={CuboidHeightInput}>{i18n.t('word.Height', lang)} ...</DialogItem>

          {/* cuboid-azimuth */}
          <DialogItem Dialog={CuboidAzimuthInput}>{i18n.t('word.Azimuth', lang)} ...</DialogItem>

          {/* cuboid-transparency */}
          <DialogItem Dialog={CuboidTransparencyInput}>{i18n.t('word.Transparency', lang)} ...</DialogItem>
        </>
      )}

      <AddPolygonItem cuboid={cuboid} selectedSideIndex={selectedSideIndex} />

      <LabelSubmenu element={cuboid} />
    </>
  );
};

export default CuboidMenu;
