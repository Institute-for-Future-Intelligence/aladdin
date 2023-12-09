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

export const createWindowMullionSubmenu = (window: WindowModel) => {
  const items: MenuProps['items'] = [];

  items.push(
    // window-horizontal-mullion
    {
      key: 'window-horizontal-mullion',
      label: <WindowBooleanDialogItem noPadding dataType={WindowBooleanData.HorizontalMullion} />,
    },
    // window-vertical-mullion
    {
      key: 'window-vertical-mullion',
      label: <WindowBooleanDialogItem noPadding dataType={WindowBooleanData.VerticalMullion} />,
    },
  );

  if (window.horizontalMullion || window.verticalMullion) {
    items.push(
      {
        type: 'divider',
      },
      // window-mullion-width
      {
        key: 'window-mullion-width',
        label: <WindowNumberDialogItem noPadding dataType={WindowNumberData.MullionWidth} />,
      },
      // window-mullion-color
      {
        key: 'window-mullion-color',
        label: <WindowColorDialogItem noPadding dataType={WindowColorData.MullionColor} />,
      },
    );

    // window-horizontal-mullion-spacing
    if (window.horizontalMullion) {
      items.push({
        key: 'window-horizontal-mullion-spacing',
        label: <WindowNumberDialogItem noPadding dataType={WindowNumberData.HorizontalMullionSpacing} />,
      });
    }

    // window-vertical-mullion-spacing
    if (window.verticalMullion) {
      items.push({
        key: 'window-vertical-mullion-spacing',
        label: <WindowNumberDialogItem noPadding dataType={WindowNumberData.VerticalMullionSpacing} />,
      });
    }
  }

  return items;
};
