/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Space, type MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import { Copy, Cut, Lock, MenuItem } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import { BillboardFlipCheckbox, TreeHeightInput, TreeShowModelCheckbox, TreeSpreadInput } from './billboardMenuItems';
import { TreeModel } from 'src/models/TreeModel';
import { createLabelSubmenu } from '../../labelSubmenuItems';
import TreeSelection from './treeSelection';

export const createTreeMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.Tree) return { items };

  const tree = selectedElement as TreeModel;

  const editable = !tree.locked;
  const lang = { lng: useStore.getState().language };

  items.push({
    key: 'tree-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push({
      key: 'tree-cut',
      label: <Cut />,
    });
  }

  items.push({
    key: 'tree-lock',
    label: <Lock selectedElement={tree} />,
  });

  if (editable) {
    items.push(
      {
        key: 'tree-show-model',
        label: <TreeShowModelCheckbox tree={tree} />,
      },

      {
        key: 'tree-flip',
        label: <BillboardFlipCheckbox billboardModel={tree} />,
      },
    );

    items.push(
      {
        key: 'tree-change-type',
        label: (
          <MenuItem stayAfterClick>
            <Space style={{ width: '100px' }}>{i18n.t('treeMenu.Type', lang)}: </Space>
            <TreeSelection tree={tree} />
          </MenuItem>
        ),
      },
      {
        key: 'tree-spread',
        label: <TreeSpreadInput tree={tree} />,
      },
      {
        key: 'tree-height',
        label: <TreeHeightInput tree={tree} />,
      },
      {
        key: 'tree-label-submenu',
        label: <MenuItem>{i18n.t('labelSubMenu.Label', lang)}</MenuItem>,
        children: createLabelSubmenu(tree),
      },
    );
  }

  return { items } as MenuProps;
};
