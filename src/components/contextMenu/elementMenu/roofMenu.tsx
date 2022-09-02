/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Menu } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { Lock, Paste, Translucent } from '../menuItems';
import i18n from 'src/i18n/i18n';
import { ObjectType, RoofTexture } from 'src/types';
import RoofTextureSelection from './roofTextureSelection';
import RoofColorSelection from './roofColorSelection';
import { RoofModel, RoofType } from 'src/models/RoofModel';
import RoofOverhangInput from './roofOverhangInput';
import RoofThicknessInput from './roofThicknessInput';
import RoofRafterSpacingInput from './roofRafterSpacingInput';

export const RoofMenu = () => {
  const roof = useStore(Selector.selectedElement) as RoofModel;
  const language = useStore(Selector.language);
  const setApplyCount = useStore(Selector.setApplyCount);

  const [rafterSpacingDialogVisible, setRafterSpacingDialogVisible] = useState(false);
  const [overhangDialogVisible, setOverhangDialogVisible] = useState(false);
  const [thicknessDialogVisible, setThicknessDialogVisible] = useState(false);
  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [colorDialogVisible, setColorDialogVisible] = useState(false);

  const lang = { lng: language };
  const paddingLeft = '36px';

  const legalToPaste = () => {
    const elementsToPaste = useStore.getState().elementsToPaste;
    if (elementsToPaste && elementsToPaste.length > 0) {
      const e = elementsToPaste[0];
      if (e.type === ObjectType.SolarPanel) {
        return true;
      }
    }
    return false;
  };

  return (
    roof && (
      <>
        {legalToPaste() && <Paste keyName={'roof-paste'} />}
        <Lock keyName={'roof-lock'} />

        {!roof.locked && (
          <>
            <Translucent keyName={'roof-translucent'} />
            {roof.roofType === RoofType.Gable && (
              <>
                {rafterSpacingDialogVisible && (
                  <RoofRafterSpacingInput setDialogVisible={setRafterSpacingDialogVisible} />
                )}
                {roof.translucent && (
                  <Menu.Item
                    key={'roof-rafterSpacing'}
                    style={{ paddingLeft: paddingLeft }}
                    onClick={() => {
                      setApplyCount(0);
                      setRafterSpacingDialogVisible(true);
                    }}
                  >
                    {i18n.t('roofMenu.RafterSpacing', lang)} ...
                  </Menu.Item>
                )}
              </>
            )}

            {overhangDialogVisible && <RoofOverhangInput setDialogVisible={setOverhangDialogVisible} />}
            <Menu.Item
              key={'roof-overhang'}
              style={{ paddingLeft: paddingLeft }}
              onClick={() => {
                setApplyCount(0);
                setOverhangDialogVisible(true);
              }}
            >
              {i18n.t('roofMenu.OverhangLength', lang)} ...
            </Menu.Item>

            {thicknessDialogVisible && <RoofThicknessInput setDialogVisible={setThicknessDialogVisible} />}
            <Menu.Item
              key={'roof-thickness'}
              style={{ paddingLeft: paddingLeft }}
              onClick={() => {
                setApplyCount(0);
                setThicknessDialogVisible(true);
              }}
            >
              {i18n.t('word.Thickness', lang)} ...
            </Menu.Item>

            {textureDialogVisible && <RoofTextureSelection setDialogVisible={setTextureDialogVisible} />}
            <Menu.Item
              key={'roof-texture'}
              style={{ paddingLeft: paddingLeft }}
              onClick={() => {
                setApplyCount(0);
                setTextureDialogVisible(true);
              }}
            >
              {i18n.t('word.Texture', lang)} ...
            </Menu.Item>

            {colorDialogVisible && <RoofColorSelection setDialogVisible={setColorDialogVisible} />}
            {(roof.textureType === RoofTexture.NoTexture || roof.textureType === RoofTexture.Default) && (
              <Menu.Item
                key={'roof-color'}
                style={{ paddingLeft: paddingLeft }}
                onClick={() => {
                  setApplyCount(0);
                  setColorDialogVisible(true);
                }}
              >
                {i18n.t('word.Color', lang)} ...
              </Menu.Item>
            )}
          </>
        )}
      </>
    )
  );
};
