/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
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

export const createWindowFrameSubmenu = (window: WindowModel) => {
  const items: MenuProps['items'] = [];
  const lang = { lng: useStore.getState().language };

  items.push({
    key: 'window-frame-boolean',
    label: <WindowBooleanDialogItem noPadding dataType={WindowBooleanData.Frame} />,
  });

  if (window.frame) {
    items.push(
      {
        type: 'divider',
      },
      {
        key: 'window-frame-width',
        label: <WindowNumberDialogItem noPadding dataType={WindowNumberData.FrameWidth} />,
      },
      {
        key: 'window-sill-width',
        label: <WindowNumberDialogItem noPadding dataType={WindowNumberData.SillWidth} />,
      },
      {
        key: 'window-frame-color',
        label: <WindowColorDialogItem noPadding dataType={WindowColorData.Color} />,
      },
    );
  }
  return items;
};
