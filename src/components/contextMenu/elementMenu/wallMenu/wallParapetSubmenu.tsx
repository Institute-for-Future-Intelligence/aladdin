/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import type { MenuProps } from 'antd';
import { WallModel } from 'src/models/WallModel';
import { ParapetCheckbox } from './wallMenuItems';
import { DialogItem } from '../../menuItems';
import WallParapetColorSelection from './wallParapetColorSelection';
import WallParapetTextureSelection from './wallParapetTextureSelection';
import React from 'react';
import ParapetNumberInput from './wallParapetNumberInput';
import { ParapetDataType } from './ParapetDataType';
import { ParapetNumberDialogItem } from './parapetNumberDialogItem';

export const createParapetSubmenu = (wall: WallModel) => {
  const lang = { lng: useStore.getState().language };

  const items: MenuProps['items'] = [];
  items.push({
    key: 'parapet-checkbox',
    label: <ParapetCheckbox wall={wall} />,
  });

  if (wall.parapet.display) {
    items.push(
      {
        type: 'divider',
      },
      {
        key: 'parapet-color',
        label: (
          <DialogItem noPadding Dialog={WallParapetColorSelection}>
            {i18n.t(`wallMenu.ParapetColor`, lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'parapet-texture',
        label: (
          <DialogItem noPadding Dialog={WallParapetTextureSelection}>
            {i18n.t(`wallMenu.ParapetTexture`, lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'parapet-height',
        label: (
          <ParapetNumberDialogItem wall={wall} dataType={ParapetDataType.ParapetHeight} Dialog={ParapetNumberInput}>
            {i18n.t(`wallMenu.ParapetHeight`, lang)} ...
          </ParapetNumberDialogItem>
        ),
      },
      {
        key: 'copings-height',
        label: (
          <ParapetNumberDialogItem wall={wall} dataType={ParapetDataType.CopingsHeight} Dialog={ParapetNumberInput}>
            {i18n.t(`wallMenu.CopingsHeight`, lang)} ...
          </ParapetNumberDialogItem>
        ),
      },
      {
        key: 'copings-width',
        label: (
          <ParapetNumberDialogItem wall={wall} dataType={ParapetDataType.CopingsWidth} Dialog={ParapetNumberInput}>
            {i18n.t(`wallMenu.CopingsWidth`, lang)} ...
          </ParapetNumberDialogItem>
        ),
      },
    );
  }

  return items;
};
