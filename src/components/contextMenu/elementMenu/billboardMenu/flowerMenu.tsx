/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { Space, type MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Copy, Cut, Lock, MenuItem } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import { BillboardFlipCheckbox } from './billboardMenuItems';
import { FlowerModel } from 'src/models/FlowerModel';
import FlowerSelection from './flowerSelection';

export const createFlowerMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.Flower) return { items };

  const flower = selectedElement as FlowerModel;

  const editable = !flower.locked;
  const lang = { lng: useStore.getState().language };

  // lock
  items.push({
    key: 'flower-lock',
    label: <Lock selectedElement={flower} />,
  });

  if (editable) {
    items.push(
      // flip
      {
        key: 'flower-flip',
        label: <BillboardFlipCheckbox billboardModel={flower} />,
      },
      // cut
      {
        key: 'flower-cut',
        label: <Cut />,
      },
    );
  }

  // copy
  items.push({
    key: 'flower-copy',
    label: <Copy />,
  });

  // flower-change-type
  if (editable) {
    items.push({
      key: 'flower-change-type',
      label: (
        <MenuItem stayAfterClick>
          <Space style={{ width: '60px' }}>{i18n.t('flowerMenu.Type', lang)}: </Space>
          <FlowerSelection flower={flower} />
        </MenuItem>
      ),
    });
  }

  return { items } as MenuProps;
};
