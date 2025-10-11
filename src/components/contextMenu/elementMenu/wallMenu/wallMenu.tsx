/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { WallModel, WallStructure } from 'src/models/WallModel';
import { ObjectType } from 'src/types';
import { Copy, Cut, DialogItem, Lock, Paste } from '../../menuItems';
import { Util } from 'src/Util';
import { useStore } from 'src/stores/common';
import i18n from 'src/i18n/i18n';
import WallElementCounterSubmenu from './wallElementCounterSubmenu';
import ParapetSubmenu from './wallParapetSubmenu';
import WallStructureSubmenu from './wallStructureSubmenu';
import { WallNumberDialogItem } from './wallNumberDialogItem';
import WallNumberInput from './wallNumberInput';
import { AddPolygonOnWallItem } from './wallMenuItems';
import WallFillSubmenu from './wallFillSubmenu';
import WallRValueInput from './wallRValueInput';
import WallHeatCapacityInput from './wallHeatCapacityInput';
import WallTextureSelection from './wallTextureSelection';
import WallColorSelection from './wallColorSelection';
import { WallNumberDataType } from './WallNumberDataType';
import WallPermeabilityInput from './wallPermeabilityInput';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

export type WallNumberDialogSettingType = {
  attributeKey: keyof WallModel;
  range: [min: number, max: number];
  step: number;
  unit?: string;
};

export const WallNumberDialogSettings = {
  Height: { attributeKey: 'lz', range: [0.1, 1000], step: 0.1, unit: 'word.MeterAbbreviation' },
  Opacity: { attributeKey: 'opacity', range: [0, 1], step: 0.01 },
  StructureSpacing: { attributeKey: 'structureSpacing', range: [0.1, 1000], step: 0.1, unit: 'word.MeterAbbreviation' },
  StructureWidth: { attributeKey: 'structureWidth', range: [0.01, 1], step: 0.1, unit: 'word.MeterAbbreviation' },
  Thickness: { attributeKey: 'ly', range: [0.1, 1], step: 0.01, unit: 'word.MeterAbbreviation' },
  EavesLength: { attributeKey: 'eavesLength', range: [-0.1, 5], step: 0.01, unit: 'word.MeterAbbreviation' },
  ParapetHeight: { attributeKey: 'parapetHeight', range: [0, 5], step: 0.01, unit: 'word.MeterAbbreviation' },
  CopingsHeight: { attributeKey: 'copingsHeight', range: [0, 1], step: 0.01, unit: 'word.MeterAbbreviation' },
  CopingsWidth: { attributeKey: 'copingsWidth', range: [0, 3], step: 0.01, unit: 'word.MeterAbbreviation' },
};

const legalToPaste = () => {
  const elementsToPaste = useStore.getState().elementsToPaste;
  if (elementsToPaste && elementsToPaste.length > 0) {
    const e = elementsToPaste[0];
    if (Util.isLegalOnWall(e.type)) {
      return true;
    }
  }
  return false;
};

const WallMenu = () => {
  const lang = useLanguage();
  const wall = useContextMenuElement(ObjectType.Wall) as WallModel;
  if (!wall) return null;

  const countAllOffspringsByType = useStore.getState().countAllOffspringsByTypeAtOnce;

  const editable = !wall.locked;
  const counterAll = countAllOffspringsByType(wall.id, true);
  const counterUnlocked = countAllOffspringsByType(wall.id, false);

  return (
    <>
      {legalToPaste() && <Paste />}

      <Copy />

      {editable && <Cut />}

      <Lock selectedElement={wall} />

      {editable && (
        <>
          {wall.wallStructure !== WallStructure.Default && (
            <WallNumberDialogItem dataType={WallNumberDataType.Opacity} Dialog={WallNumberInput}>
              {i18n.t(`wallMenu.${WallNumberDataType.Opacity}`, lang)} ...
            </WallNumberDialogItem>
          )}

          {/* add-polygon-on-wall */}
          <AddPolygonOnWallItem wall={wall} />

          {/* wall-thickness */}
          <WallNumberDialogItem dataType={WallNumberDataType.Thickness} Dialog={WallNumberInput}>
            {i18n.t(`wallMenu.${WallNumberDataType.Thickness}`, lang)} ...
          </WallNumberDialogItem>

          {/* wall-height */}
          <WallNumberDialogItem dataType={WallNumberDataType.Height} Dialog={WallNumberInput}>
            {i18n.t(`wallMenu.${WallNumberDataType.Height}`, lang)} ...
          </WallNumberDialogItem>

          {/* wall-eaves-length */}
          <WallNumberDialogItem dataType={WallNumberDataType.EavesLength} Dialog={WallNumberInput}>
            {i18n.t(`wallMenu.${WallNumberDataType.EavesLength}`, lang)} ...
          </WallNumberDialogItem>

          {/* wall-r-value */}
          <DialogItem Dialog={WallRValueInput}>{i18n.t('word.RValue', lang)} ...</DialogItem>

          {/* wall-air-permeability */}
          <DialogItem Dialog={WallPermeabilityInput}>{i18n.t('word.AirPermeability', lang)} ...</DialogItem>

          {/* wall-heat-capacity */}
          <DialogItem Dialog={WallHeatCapacityInput}>{i18n.t('word.VolumetricHeatCapacity', lang)} ...</DialogItem>

          {/* wall-texture */}
          <DialogItem Dialog={WallTextureSelection}>{i18n.t('wallMenu.Texture', lang)} ...</DialogItem>

          {/* wall-color */}
          <DialogItem Dialog={WallColorSelection}>{i18n.t('wallMenu.Color', lang)} ...</DialogItem>

          {/* wall-fill */}
          <WallFillSubmenu wall={wall} />

          {/* wall-parapet */}
          <ParapetSubmenu wall={wall} />

          {/* wall-structure */}
          <WallStructureSubmenu wall={wall} />

          {counterAll.gotSome() && (
            <WallElementCounterSubmenu wall={wall} counterAll={counterAll} counterUnlocked={counterUnlocked} />
          )}
        </>
      )}
    </>
  );
};

export default WallMenu;
