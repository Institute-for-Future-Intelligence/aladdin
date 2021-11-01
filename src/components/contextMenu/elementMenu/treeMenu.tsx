/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Checkbox, Menu, Space } from 'antd';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import TreeSelection from 'src/components/treeSelection';
import ReshapeElementMenu from 'src/components/reshapeElementMenu';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';

export const TreeMenu = () => {
  const language = useStore((state) => state.language);
  const updateElementById = useStore((state) => state.updateElementById);
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const selectedElement = getSelectedElement();
  const lang = { lng: language };

  const showTreeModel = (on: boolean) => {
    if (selectedElement && selectedElement.type === ObjectType.Tree) {
      updateElementById(selectedElement.id, { showModel: on });
    }
  };

  return (
    <>
      <Copy />
      <Cut />
      <Lock />
      <Menu.Item key={'tree-show-model'}>
        <Checkbox
          checked={selectedElement?.showModel && selectedElement.type === ObjectType.Tree}
          onChange={(e) => {
            showTreeModel(e.target.checked);
          }}
        >
          {i18n.t('treeMenu.ShowModel', lang)}
        </Checkbox>
      </Menu.Item>
      <Menu>
        <Menu.Item key={'tree-change-type'} style={{ paddingLeft: '36px' }}>
          <Space style={{ width: '60px' }}>{i18n.t('treeMenu.Type', lang)}: </Space>
          <TreeSelection key={'trees'} />
        </Menu.Item>
      </Menu>
      {selectedElement && (
        <ReshapeElementMenu
          elementId={selectedElement.id}
          name={'tree'}
          maxWidth={40}
          maxHeight={20}
          widthName={i18n.t('treeMenu.Spread', lang)}
          adjustLength={false}
          adjustAngle={false}
          style={{ paddingLeft: '20px' }}
        />
      )}
    </>
  );
};
