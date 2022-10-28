/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Menu } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from 'src/i18n/i18n';
import { DoorModel } from 'src/models/DoorModel';
import DoorTextureSelection from './doorTextureSelection';
import { DoorTexture } from 'src/types';
import DoorColorSelection from './doorColorSelection';

export const DoorMenu = () => {
  const door = useStore(Selector.selectedElement) as DoorModel;
  const language = useStore(Selector.language);
  const setApplyCount = useStore(Selector.setApplyCount);

  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [colorDialogVisible, setColorDialogVisible] = useState(false);

  const lang = { lng: language };
  const paddingLeft = '36px';

  return (
    door && (
      <>
        <Copy keyName={'door-copy'} />
        <Cut keyName={'door-cut'} />
        <Lock keyName={'door-lock'} />

        {textureDialogVisible && <DoorTextureSelection setDialogVisible={setTextureDialogVisible} />}
        <Menu.Item
          key={'door-texture'}
          style={{ paddingLeft: paddingLeft }}
          onClick={() => {
            setApplyCount(0);
            setTextureDialogVisible(true);
          }}
        >
          {i18n.t('word.Texture', lang)} ...
        </Menu.Item>

        {colorDialogVisible && <DoorColorSelection setDialogVisible={setColorDialogVisible} />}

        <Menu.Item
          key={'door-color'}
          style={{ paddingLeft: paddingLeft }}
          onClick={() => {
            setApplyCount(0);
            setColorDialogVisible(true);
          }}
        >
          {i18n.t('word.Color', lang)} ...
        </Menu.Item>
      </>
    )
  );
};
