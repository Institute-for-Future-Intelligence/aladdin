/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import type { MenuProps } from 'antd';
import { RoofModel, RoofStructure } from 'src/models/RoofModel';
import { RoofStructureRadioGroup } from './roofMenuItems';
import { DialogItem } from '../../menuItems';
import RoofRafterColorSelection from './roofRafterColorSelection';
import RoofRafterSpacingInput from './roofRafterSpacingInput';
import RoofRafterWidthInput from './roofRafterWidthInput';
import GlassTintSelection from './glassTintSelection';

export const createRoofStructureSubmenu = (roof: RoofModel) => {
  const lang = { lng: useStore.getState().language };

  const items: MenuProps['items'] = [];

  items.push({
    key: 'roof-structure-radio-group',
    label: <RoofStructureRadioGroup roof={roof} />,
    style: { backgroundColor: 'white' },
  });

  if (roof.roofStructure === RoofStructure.Rafter) {
    items.push(
      {
        type: 'divider',
      },
      {
        key: 'roof-rafter-spacing',
        label: (
          <DialogItem noPadding Dialog={RoofRafterSpacingInput}>
            {i18n.t('roofMenu.RafterSpacing', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'roof-rafter-width',
        label: (
          <DialogItem noPadding Dialog={RoofRafterWidthInput}>
            {i18n.t('roofMenu.RafterWidth', lang)} ...
          </DialogItem>
        ),
      },
      {
        key: 'roof-rafter-color',
        label: (
          <DialogItem noPadding Dialog={RoofRafterColorSelection}>
            {i18n.t('roofMenu.RafterColor', lang)} ...
          </DialogItem>
        ),
      },
    );
  }

  if (roof.roofStructure === RoofStructure.Glass) {
    items.push(
      {
        type: 'divider',
      },
      {
        key: 'roof-glass-tint-selection',
        label: (
          <DialogItem noPadding Dialog={GlassTintSelection}>
            {i18n.t('roofMenu.GlassTint', lang)} ...
          </DialogItem>
        ),
      },
    );
  }

  return items;
};
