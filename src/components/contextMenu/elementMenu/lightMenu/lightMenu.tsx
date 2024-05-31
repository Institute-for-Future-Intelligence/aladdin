/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import type { MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Copy, Cut, Lock, MenuItem } from '../../menuItems';
import { LightModel } from 'src/models/LightModel';
import { LightColorPicker, LightDistanceInput, LightInsideCheckbox, LightIntensityInput } from './lightMenuItems';
import i18n from 'src/i18n/i18n';

export const createLightMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.Light) return { items };

  const light = selectedElement as LightModel;

  const editable = !light.locked;
  const lang = { lng: useStore.getState().language };
  const parent = light.parentId ? useStore.getState().getParent(light) : undefined;

  items.push({
    key: 'light-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push({
      key: 'light-cut',
      label: <Cut />,
    });
  }

  items.push({
    key: 'light-lock',
    label: <Lock selectedElement={light} />,
  });

  if (editable) {
    if (parent && (parent.type === ObjectType.Roof || parent.type === ObjectType.Wall)) {
      items.push({
        key: 'light-inside',
        label: <LightInsideCheckbox light={light} />,
      });
    }
  }

  if (editable) {
    items.push(
      {
        key: 'light-intensity',
        label: <LightIntensityInput light={light} />,
      },
      {
        key: 'light-distance',
        label: <LightDistanceInput light={light} />,
      },
      {
        key: 'light-color',
        label: <MenuItem>{i18n.t('word.Color', lang)}</MenuItem>,
        children: [
          { key: 'light-color-picker', label: <LightColorPicker light={light} />, style: { backgroundColor: 'white' } },
        ],
      },
    );
  }

  return { items } as MenuProps;
};
