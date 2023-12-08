/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import type { MenuProps } from 'antd';
import { WallModel, WallStructure } from 'src/models/WallModel';
import { WallStructureRadioGroup } from './wallMenuItems';
import WallNumberInput from './wallNumberInput';
import { WallNumberDataType, WallNumberDialogItem } from './wallNumberDialogItem';
import { DialogItem } from '../../menuItems';
import WallStructureColorSelection from './wallStructureColorSelection';

export const createWallStructureSubmenu = (wall: WallModel) => {
  const items: MenuProps['items'] = [];
  const lang = { lng: useStore.getState().language };

  // structure-radio-group
  items.push({
    key: 'wall-structure-submenu-radio-group',
    label: <WallStructureRadioGroup wall={wall} />,
  });

  if (wall.wallStructure !== WallStructure.Default) {
    items.push(
      {
        type: 'divider',
      },
      {
        key: 'wall-structure-spacing',
        label: (
          <WallNumberDialogItem dataType={WallNumberDataType.StructureSpacing} Dialog={WallNumberInput}>
            {i18n.t(`wallMenu.${WallNumberDataType.StructureSpacing}`, lang)} ...
          </WallNumberDialogItem>
        ),
      },
      {
        key: 'wall-structure-width',
        label: (
          <WallNumberDialogItem dataType={WallNumberDataType.StructureWidth} Dialog={WallNumberInput}>
            {i18n.t(`wallMenu.${WallNumberDataType.StructureWidth}`, lang)} ...
          </WallNumberDialogItem>
        ),
      },
      {
        key: 'wall-structure-color',
        label: (
          <DialogItem Dialog={WallStructureColorSelection}>{i18n.t(`wallMenu.StructureColor`, lang)} ...</DialogItem>
        ),
      },
    );
  }

  return items;
};
