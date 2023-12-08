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

export const createWindowFrameSubmenu = (window: WindowModel) => {
  const items: MenuProps['items'] = [];
  const lang = { lng: useStore.getState().language };

  items.push(
    // window-frame-boolean
    {
      key: 'window-frame-boolean',
      label: <WindowBooleanDialogItem dataType={WindowBooleanData.Frame} />,
    },
  );

  if (window.frame) {
    items.push(
      // divider
      {
        type: 'divider',
      },
      // window-frame-width
      {
        key: 'window-frame-width',
        label: <WindowNumberDialogItem dataType={WindowNumberData.FrameWidth} />,
      },
      // window-sill-width
      {
        key: 'window-sill-width',
        label: <WindowNumberDialogItem dataType={WindowNumberData.SillWidth} />,
      },
      // window-frame-color
      {
        key: 'window-frame-color',
        label: <WindowColorDialogItem dataType={WindowColorData.Color} />,
      },
    );
  }
  return items;
};
