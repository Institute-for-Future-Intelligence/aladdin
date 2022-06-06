/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
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
  const tree = useStore(Selector.selectedElement) as TreeModel;
  const addUndoable = useStore(Selector.addUndoable);

  const [inputSpread, setInputSpread] = useState<number>(tree?.lx ?? 1);
  const [inputHeight, setInputHeight] = useState<number>(tree?.lz ?? 1);

  const lang = { lng: language };

  const showTreeModel = (on: boolean) => {
    if (!tree) return;
    const undoableCheck = {
      name: 'Show Tree Model',
      timestamp: Date.now(),
      checked: on,
      selectedElementId: tree.id,
      selectedElementType: ObjectType.Tree,
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
    if (!tree) return;
    if (!value || value === inputSpread) return;
    const undoableChange = {
      name: 'Set Tree Spread',
      timestamp: Date.now(),
      oldValue: inputSpread,
      newValue: value,
      changedElementId: tree.id,
      changedElementType: tree.type,
      undo: () => {
        updateElementLxById(undoableChange.changedElementId, undoableChange.oldValue as number);
      },
      redo: () => {
        updateElementLxById(undoableChange.changedElementId, undoableChange.newValue as number);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    updateElementLxById(tree.id, value);
    setInputSpread(value);
  };

  const setHeight = (value: number) => {
    if (!tree) return;
    if (!value || value === inputHeight) return;
    const undoableChange = {
      name: 'Set Tree Height',
      timestamp: Date.now(),
      oldValue: inputHeight,
      newValue: value,
      changedElementId: tree.id,
      changedElementType: tree.type,
      undo: () => {
        updateElementLzById(undoableChange.changedElementId, undoableChange.oldValue as number);
      },
      redo: () => {
        updateElementLzById(undoableChange.changedElementId, undoableChange.newValue as number);
      },
    } as UndoableChange;
    addUndoable(undoableChange);
    updateElementLzById(tree.id, value);
    setInputHeight(value);
  };

  const editable = !tree?.locked;

  return (
    tree && (
      <>
        <Copy keyName={'tree-copy'} />
        {editable && <Cut keyName={'tree-cut'} />}
        <Lock keyName={'tree-lock'} />
        <Menu.Item key={'tree-show-model'}>
          <Checkbox
            checked={tree?.showModel && tree?.type === ObjectType.Tree}
            onChange={(e) => showTreeModel(e.target.checked)}
          >
            {i18n.t('treeMenu.ShowModel', lang)}
          </Checkbox>
        </Menu.Item>

        {/* have to wrap the text field with a Menu so that it can stay open when the user types in it */}
        {editable && (
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
                value={inputSpread}
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
                value={inputHeight}
                onChange={(value) => setHeight(value)}
              />
            </Menu.Item>
          </Menu>
        )}
      </>
    )
  );
};