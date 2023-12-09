/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import i18n from 'src/i18n/i18n';
import { useStore } from 'src/stores/common';
import type { MenuProps } from 'antd';
import { WallFill, WallModel } from 'src/models/WallModel';
import { WallOpenToOutsideCheckbox, WallFillRadioGroup } from './wallMenuItems';

export const createWallFillSubmenu = (wall: WallModel) => {
  const items: MenuProps['items'] = [];

  // wall-fill-radio-group
  items.push({
    key: 'wall-fill-radio-group',
    label: <WallFillRadioGroup wall={wall} />,
    style: { backgroundColor: 'white' },
  });

  if (wall.fill !== WallFill.Full) {
    items.push(
      {
        type: 'divider',
      },
      {
        key: 'wall-open-to-outside-checkbox',
        label: <WallOpenToOutsideCheckbox wall={wall} />,
      },
    );
  }

  return items;
};
