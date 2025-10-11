/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */
import { RoofModel, RoofStructure, RoofType } from 'src/models/RoofModel';
import { useStore } from 'src/stores/common';
import { ObjectType, RoofTexture } from 'src/types';
import { DialogItem, Lock, Paste } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import RoofThicknessInput from './roofThicknessInput';
import RoofRiseInput from './roofRiseInput';
import RoofRValueInput from './roofRValueInput';
import RoofHeatCapacityInput from './roofHeatCapacityInput';
import RoofTextureSelection from './roofTextureSelection';
import RoofColorSelection from './roofColorSelection';
import RoofSideColorSelection from './roofSideColorSelection';
import RoofCeilingSubmenu from './roofCeilingSubmenu';
import RoofStructureSubmenu from './roofSturctureSubmenu';
import RoofOpacityInput from './roofOpacityInput';
import RoofPermeabilityInput from './roofPermeabilityInput';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';
import RoofElementCounterSubmenu from './roofElementCounterSubmenu';

const legalToPaste = () => {
  const elementsToPaste = useStore.getState().elementsToPaste;
  if (elementsToPaste && elementsToPaste.length > 0) {
    const e = elementsToPaste[0];
    switch (e.type) {
      case ObjectType.Window:
      case ObjectType.SolarPanel:
      case ObjectType.SolarWaterHeater:
      case ObjectType.Sensor:
      case ObjectType.Light:
        return true;
    }
  }
  return false;
};

const RoofMenu = () => {
  const lang = useLanguage();
  const roof = useContextMenuElement(ObjectType.Roof) as RoofModel;
  if (!roof) return null;

  const countAllOffspringsByType = useStore.getState().countAllOffspringsByTypeAtOnce;

  const editable = !roof.locked;
  const counterAll = countAllOffspringsByType(roof.id, true);
  const counterUnlocked = countAllOffspringsByType(roof.id, false);
  const isRoofVisible = roof.roofStructure !== RoofStructure.Rafter || roof.opacity === undefined || roof.opacity > 0;

  return (
    <>
      {/* roof-paste */}
      {legalToPaste() && <Paste />}

      {/* roof-lock */}
      <Lock selectedElement={roof} />

      {editable && (
        <>
          {/* roof-thickness */}
          <DialogItem Dialog={RoofThicknessInput}>
            {i18n.t(roof.roofStructure === RoofStructure.Rafter ? 'roofMenu.RafterThickness' : 'word.Thickness', lang)}{' '}
            ...
          </DialogItem>

          {/* roof-rise */}
          <DialogItem Dialog={RoofRiseInput}>{i18n.t('roofMenu.Rise', lang)} ...</DialogItem>

          {isRoofVisible && (
            <>
              {/* roof-r-value */}
              <DialogItem Dialog={RoofRValueInput}>{i18n.t('roofMenu.RoofRValue', lang)} ...</DialogItem>

              {/* roof-air-permeability */}
              <DialogItem Dialog={RoofPermeabilityInput}>{i18n.t('word.AirPermeability', lang)} ...</DialogItem>

              {/* roof-heat-capacity */}
              <DialogItem Dialog={RoofHeatCapacityInput}>{i18n.t('word.VolumetricHeatCapacity', lang)} ...</DialogItem>

              {/* roof-texture */}
              <DialogItem Dialog={RoofTextureSelection}>{i18n.t('word.Texture', lang)} ...</DialogItem>

              {/* roof-color */}
              {(roof.textureType === RoofTexture.NoTexture || roof.textureType === RoofTexture.Default) && (
                <DialogItem Dialog={RoofColorSelection}>{i18n.t('roofMenu.RoofColor', lang)} ...</DialogItem>
              )}

              {/* roof-side-color */}
              <DialogItem Dialog={RoofSideColorSelection}>{i18n.t('roofMenu.RoofSideColor', lang)} ...</DialogItem>
            </>
          )}

          {roof.roofType === RoofType.Gable && (
            <>
              {/* opacity */}
              {(roof.roofStructure === RoofStructure.Rafter || roof.roofStructure === RoofStructure.Glass) && (
                <DialogItem Dialog={RoofOpacityInput}>{i18n.t('roofMenu.Opacity', lang)} ...</DialogItem>
              )}

              {/* roof-structure-submenu */}
              <RoofStructureSubmenu roof={roof} />
            </>
          )}

          {roof.rise > 0 && (
            <>
              {/* roof-ceiling-submenu */}
              <RoofCeilingSubmenu roof={roof} />
            </>
          )}

          {counterAll.gotSome() && (
            <>
              {/* lock-unlock-clear-on-roof */}
              <RoofElementCounterSubmenu roof={roof} counterAll={counterAll} counterUnlocked={counterUnlocked} />
            </>
          )}
        </>
      )}
    </>
  );
};

export default RoofMenu;
