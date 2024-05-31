/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import type { MenuProps } from 'antd';
import { WindowBooleanDialogItem, WindowColorDialogItem, WindowNumberDialogItem } from './windowMenuItems';
import { WindowModel } from 'src/models/WindowModel';
import { WindowBooleanData, WindowColorData, WindowNumberData } from './WindowPropertyTypes';

export const createWindowShutterSubmenu = (window: WindowModel) => {
  const items: MenuProps['items'] = [];

  items.push(
    {
      key: 'window-left-shutter',
      label: <WindowBooleanDialogItem noPadding dataType={WindowBooleanData.LeftShutter} />,
    },
    {
      key: 'window-right-shutter',
      label: <WindowBooleanDialogItem noPadding dataType={WindowBooleanData.RightShutter} />,
    },
  );

  if (window.leftShutter || window.rightShutter) {
    items.push(
      {
        type: 'divider',
      },
      {
        key: 'window-shutter-color',
        label: <WindowColorDialogItem noPadding dataType={WindowColorData.ShutterColor} />,
      },
      {
        key: 'window-shutter-width',
        label: <WindowNumberDialogItem noPadding dataType={WindowNumberData.ShutterWidth} />,
      },
    );
  }

  return items;
};
