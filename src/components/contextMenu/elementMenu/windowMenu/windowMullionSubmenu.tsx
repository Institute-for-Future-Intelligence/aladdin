/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import type { MenuProps } from 'antd';
import { WindowBooleanDialogItem, WindowColorDialogItem, WindowNumberDialogItem } from './windowMenuItems';
import { WindowModel } from 'src/models/WindowModel';
import { WindowBooleanData, WindowColorData, WindowNumberData } from './WindowPropertyTypes';

export const createWindowMullionSubmenu = (window: WindowModel) => {
  const items: MenuProps['items'] = [];

  items.push(
    {
      key: 'window-horizontal-mullion',
      label: <WindowBooleanDialogItem noPadding dataType={WindowBooleanData.HorizontalMullion} />,
    },
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
      {
        key: 'window-mullion-width',
        label: <WindowNumberDialogItem noPadding dataType={WindowNumberData.MullionWidth} />,
      },
      {
        key: 'window-mullion-color',
        label: <WindowColorDialogItem noPadding dataType={WindowColorData.MullionColor} />,
      },
    );

    if (window.horizontalMullion) {
      items.push({
        key: 'window-horizontal-mullion-spacing',
        label: <WindowNumberDialogItem noPadding dataType={WindowNumberData.HorizontalMullionSpacing} />,
      });
    }

    if (window.verticalMullion) {
      items.push({
        key: 'window-vertical-mullion-spacing',
        label: <WindowNumberDialogItem noPadding dataType={WindowNumberData.VerticalMullionSpacing} />,
      });
    }
  }

  return items;
};
