/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Checkbox, Menu, Space } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType } from '../../../types';
import TreeSelection from './treeSelection';
import ReshapeElementMenu from '../../reshapeElementMenu';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';

export const TreeMenu = () => {
  const language = useStore(Selector.language);
  const updateElementById = useStore(Selector.updateElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const selectedElement = getSelectedElement();
  const addUndoable = useStore(Selector.addUndoable);
  const lang = { lng: language };

  const showTreeModel = (on: boolean) => {
    if (selectedElement && selectedElement.type === ObjectType.Tree) {
      const undoableCheck = {
        name: 'Show Tree Model',
        timestamp: Date.now(),
        checked: on,
        undo: () => {
          updateElementById(selectedElement.id, { showModel: !undoableCheck.checked });
        },
        redo: () => {
          updateElementById(selectedElement.id, { showModel: undoableCheck.checked });
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
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
