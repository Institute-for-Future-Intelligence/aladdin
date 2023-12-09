/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */
import type { MenuProps } from 'antd';
import { useStore } from 'src/stores/common';
import {
  WindowBooleanData,
  WindowBooleanDialogItem,
  WindowColorData,
  WindowColorDialogItem,
  WindowNumberData,
  WindowNumberDialogItem,
} from './windowMenuItems';
import { WindowModel } from 'src/models/WindowModel';

export const createWindowShutterSubmenu = (window: WindowModel) => {
  const items: MenuProps['items'] = [];

  items.push(
    // window-left-shutter
    {
      key: 'window-left-shutter',
      label: <WindowBooleanDialogItem noPadding dataType={WindowBooleanData.LeftShutter} />,
    },
    // window-right-shutter
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
      // window-shutter-color
      {
        key: 'window-shutter-color',
        label: <WindowColorDialogItem noPadding dataType={WindowColorData.ShutterColor} />,
      },
      // window-shutter-width
      {
        key: 'window-shutter-width',
        label: <WindowNumberDialogItem noPadding dataType={WindowNumberData.ShutterWidth} />,
      },
    );
  }

  return items;
};
