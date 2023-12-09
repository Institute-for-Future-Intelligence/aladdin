/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import type { MenuProps } from 'antd';
import { RoofModel } from 'src/models/RoofModel';
import { RoofCeilingCheckbox } from './roofMenuItems';
import { DialogItem } from '../../menuItems';
import CeilingRValueInput from './ceilingRValueInput';

export const createRoofCeilingSubmenu = (roof: RoofModel) => {
  const lang = { lng: useStore.getState().language };

  const items: MenuProps['items'] = [];

  items.push({
    key: 'roof-ceiling',
    label: <RoofCeilingCheckbox roof={roof} />,
  });

  if (roof.ceiling) {
    items.push(
      {
        type: 'divider',
      },
      {
        key: 'ceiling-r-value',
        label: <DialogItem Dialog={CeilingRValueInput}>{i18n.t('roofMenu.CeilingRValue', lang)} ...</DialogItem>,
      },
    );
  }

  return items;
};
