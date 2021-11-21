/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, InputNumber, Menu, Space } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType } from '../../../types';
import TreeSelection from './treeSelection';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { UndoableChange } from '../../../undo/UndoableChange';
import { TreeModel } from '../../../models/TreeModel';

export const TreeMenu = () => {
  const language = useStore(Selector.language);
  const updateElementLxById = useStore(Selector.updateElementLxById);
  const updateElementLzById = useStore(Selector.updateElementLzById);
  const updateTreeShowModelById = useStore(Selector.updateTreeShowModelById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);

  const lang = { lng: language };
  const tree = getSelectedElement() as TreeModel;

  const showTreeModel = (on: boolean) => {
    const undoableCheck = {
      name: 'Show Tree Model',
      timestamp: Date.now(),
      checked: on,
      undo: () => {
        updateTreeShowModelById(tree.id, !undoableCheck.checked);
      },
      redo: () => {
        updateTreeShowModelById(tree.id, undoableCheck.checked);
      },
    } as UndoableCheck;
    addUndoable(undoableCheck);
    updateTreeShowModelById(tree.id, on);
  };

  const setSpread = (value: number) => {
    if (!value || value === tree.lx) return;
    const oldSpread = tree.lx;
    const undoableChange = {
      name: 'Set Tree Spread',
      timestamp: Date.now(),
      oldValue: oldSpread,
      newValue: value,
      undo: () => {
        updateElementLxById(tree.id, undoableChange.oldValue as number);
      },
      redo: () => {
        updateElementLxById(tree.id, undoableChange.newValue as number);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    updateElementLxById(tree.id, value);
    setUpdateFlag(!updateFlag);
  };

  const setHeight = (value: number) => {
    if (!value || value === tree.lz) return;
    const oldHeight = tree.lz;
    const undoableChange = {
      name: 'Set Tree Height',
      timestamp: Date.now(),
      oldValue: oldHeight,
      newValue: value,
      undo: () => {
        updateElementLzById(tree.id, undoableChange.oldValue as number);
      },
      redo: () => {
        updateElementLzById(tree.id, undoableChange.newValue as number);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    updateElementLzById(tree.id, value);
    setUpdateFlag(!updateFlag);
  };

  return (
    <>
      <Copy />
      <Cut />
      <Lock />
      <Menu.Item key={'tree-show-model'}>
        <Checkbox
          checked={tree?.showModel && tree.type === ObjectType.Tree}
          onChange={(e) => showTreeModel(e.target.checked)}
        >
          {i18n.t('treeMenu.ShowModel', lang)}
        </Checkbox>
      </Menu.Item>

      {/* have to wrap the text field with a Menu so that it can stay open when the user types in it */}
      <Menu>
        <Menu.Item key={'tree-change-type'} style={{ paddingLeft: '36px' }}>
          <Space style={{ width: '100px' }}>{i18n.t('treeMenu.Type', lang)}: </Space>
          <TreeSelection key={'trees'} />
        </Menu.Item>

        <Menu.Item key={'tree-spread'} style={{ paddingLeft: '36px' }}>
          <Space style={{ width: '100px' }}>
            {i18n.t('treeMenu.Spread', lang) + ' (' + i18n.t('word.MeterAbbreviation', lang) + ')'}:
          </Space>
          <InputNumber
            style={{ width: '160px' }}
            min={1}
            max={50}
            step={1}
            precision={1}
            value={tree.lx ?? 1}
            formatter={(x) => Number(x).toFixed(1)}
            onChange={(value) => setSpread(value)}
          />
        </Menu.Item>

        <Menu.Item key={'tree-height'} style={{ paddingLeft: '36px' }}>
          <Space style={{ width: '100px' }}>
            {i18n.t('word.Height', lang) + ' (' + i18n.t('word.MeterAbbreviation', lang) + ')'}:
          </Space>
          <InputNumber
            style={{ width: '160px' }}
            min={1}
            max={30}
            step={1}
            precision={1}
            value={tree.lz ?? 1}
            formatter={(x) => Number(x).toFixed(1)}
            onChange={(value) => setHeight(value)}
          />
        </Menu.Item>
      </Menu>
    </>
  );
};
