/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Space } from 'antd';
import { ObjectType } from 'src/types';
import { ContextMenuItem, Copy, Cut, Lock } from '../../menuItems';
import i18n from 'src/i18n/i18n';
import { BillboardFlipCheckbox, TreeHeightInput, TreeShowModelCheckbox, TreeSpreadInput } from './billboardMenuItems';
import { TreeModel } from 'src/models/TreeModel';
import LabelSubmenu from '../../labelSubmenuItems';
import TreeSelection from './treeSelection';
import { useLanguage } from 'src/hooks';
import { useContextMenuElement } from '../menuHooks';

const TreeMenu = () => {
  const lang = useLanguage();
  const tree = useContextMenuElement(ObjectType.Tree) as TreeModel;

  if (!tree) return null;
  const editable = !tree.locked;

  return (
    <>
      <Copy />

      {editable && <Cut />}

      <Lock selectedElement={tree} />

      {editable && (
        <>
          <TreeShowModelCheckbox tree={tree} />
          <BillboardFlipCheckbox billboardModel={tree} />
          <ContextMenuItem stayAfterClick>
            <Space style={{ width: '100px' }}>{i18n.t('treeMenu.Type', lang)}: </Space>
            <TreeSelection tree={tree} />
          </ContextMenuItem>
          <TreeSpreadInput tree={tree} />
          <TreeHeightInput tree={tree} />
          <LabelSubmenu element={tree} />
        </>
      )}
    </>
  );
};

export default TreeMenu;
