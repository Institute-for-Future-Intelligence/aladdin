/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Menu } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Lock, Paste } from '../menuItems';
import i18n from '../../../i18n/i18n';
import WallColorSelection from './wallColorSelection';
import { WallModel } from 'src/models/WallModel';
import { ObjectType, WallTexture } from 'src/types';
import RoofTextureSelection from './roofTextureSelection';

export const RoofMenu = () => {
  const roof = useStore(Selector.selectedElement) as WallModel;
  const elementsToPaste = useStore(Selector.elementsToPaste);
  const language = useStore(Selector.language);
  const setApplyCount = useStore(Selector.setApplyCount);

  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [colorDialogVisible, setColorDialogVisible] = useState(false);

  const lang = { lng: language };
  const paddingLeft = '36px';

  return (
    roof && (
      <>
        <Lock keyName={'roof-lock'} />

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

        {colorDialogVisible && <WallColorSelection setDialogVisible={setColorDialogVisible} />}
        {(roof.textureType === WallTexture.NoTexture || roof.textureType === WallTexture.Default) && (
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
    )
  );
};
