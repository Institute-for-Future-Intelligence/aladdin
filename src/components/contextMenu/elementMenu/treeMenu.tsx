/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Input, InputNumber, Menu, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType } from '../../../types';
import TreeSelection from './treeSelection';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { UndoableChange } from '../../../undo/UndoableChange';
import { TreeModel } from '../../../models/TreeModel';
import {
  useLabel,
  useLabelColor,
  useLabelFontSize,
  useLabelHeight,
  useLabelShow,
  useLabelSize,
  useLabelText,
  useSelectedElement,
} from './menuHooks';
import SubMenu from 'antd/lib/menu/SubMenu';

export const TreeMenu = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const updateElementLxById = useStore(Selector.updateElementLxById);
  const updateElementLzById = useStore(Selector.updateElementLzById);
  const tree = useSelectedElement(ObjectType.Tree) as TreeModel | undefined;
  const addUndoable = useStore(Selector.addUndoable);

  const [inputSpread, setInputSpread] = useState<number>(tree?.lx ?? 1);
  const [inputHeight, setInputHeight] = useState<number>(tree?.lz ?? 1);

  const { labelText, setLabelText } = useLabel(tree);
  const showLabel = useLabelShow(tree);
  const updateLabelText = useLabelText(tree, labelText);
  const setLabelSize = useLabelSize(tree);
  const setLabelFontSize = useLabelFontSize(tree);
  const setLabelColor = useLabelColor(tree);
  const setLabelHeight = useLabelHeight(tree);

  if (!tree) return null;

  const lang = { lng: language };
  const editable = !tree?.locked;

  const updateTreeShowModelById = (id: string, showModel: boolean) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Tree && e.id === id) {
          (e as TreeModel).showModel = showModel;
          break;
        }
      }
    });
  };

  const updateTreeFlipById = (id: string, flip: boolean) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Tree && e.id === id) {
          (e as TreeModel).flip = flip;
          break;
        }
      }
    });
  };

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
    setCommonStore((state) => {
      state.actionState.treeSpread = value;
    });
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
    setCommonStore((state) => {
      state.actionState.treeHeight = value;
    });
  };

  return (
    <Menu.ItemGroup>
      {/* <Copy keyName={'tree-copy'} />
      {editable && <Cut keyName={'tree-cut'} />}
      <Lock keyName={'tree-lock'} /> */}
      <Menu.Item key={'tree-show-model'}>
        <Checkbox
          checked={tree?.showModel && tree?.type === ObjectType.Tree}
          onChange={(e) => showTreeModel(e.target.checked)}
        >
          {i18n.t('treeMenu.ShowModel', lang)}
        </Checkbox>
      </Menu.Item>

      {editable && (
        <Menu.Item key={'tree-flip'}>
          <Checkbox
            checked={tree.flip}
            onChange={(e) => {
              const checked = e.target.checked;
              const undoableCheck = {
                name: 'Flip Tree',
                timestamp: Date.now(),
                checked: checked,
                selectedElementId: tree.id,
                selectedElementType: ObjectType.Tree,
                undo: () => {
                  updateTreeFlipById(tree.id, !undoableCheck.checked);
                },
                redo: () => {
                  updateTreeFlipById(tree.id, undoableCheck.checked);
                },
              } as UndoableCheck;
              addUndoable(undoableCheck);
              updateTreeFlipById(tree.id, checked);
            }}
          >
            {i18n.t('treeMenu.Flip', { lng: language })}
          </Checkbox>
        </Menu.Item>
      )}

      {/* have to wrap the text field with a Menu so that it can stay open when the user types in it */}
      {editable && (
        <Menu>
          <Menu.Item
            key={'tree-change-type'}
            style={{ height: '36px', paddingLeft: '36px', marginBottom: 0, marginTop: 0 }}
          >
            <Space style={{ width: '100px' }}>{i18n.t('treeMenu.Type', lang)}: </Space>
            <TreeSelection key={'trees'} />
          </Menu.Item>

          <Menu.Item key={'tree-spread'} style={{ height: '36px', paddingLeft: '36px', marginBottom: 0, marginTop: 0 }}>
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
              onChange={(value) => setSpread(value!)}
            />
          </Menu.Item>

          <Menu.Item key={'tree-height'} style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}>
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
              onChange={(value) => setHeight(value!)}
            />
          </Menu.Item>
        </Menu>
      )}

      {editable && (
        <SubMenu key={'tree-label'} title={i18n.t('labelSubMenu.Label', lang)} style={{ paddingLeft: '24px' }}>
          {/* show label or not */}
          <Menu.Item key={'tree-show-label'}>
            <Checkbox checked={!!tree?.showLabel} onChange={showLabel}>
              {i18n.t('labelSubMenu.KeepShowingLabel', lang)}
            </Checkbox>
          </Menu.Item>

          {/*have to wrap the text field with a Menu so that it can stay open when the user types in it */}
          <Menu>
            {/* label text */}
            <Menu.Item key={'tree-label-text'} style={{ height: '36px', paddingLeft: '36px' }}>
              <Input
                addonBefore={i18n.t('labelSubMenu.LabelText', lang) + ':'}
                value={labelText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
                onPressEnter={updateLabelText}
                onBlur={updateLabelText}
              />
            </Menu.Item>
            {/* the label's height relative to the tree top */}
            <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'tree-label-height'}>
              <InputNumber
                addonBefore={i18n.t('labelSubMenu.LabelHeight', lang) + ':'}
                min={0.2}
                max={5}
                step={0.1}
                precision={1}
                value={tree.labelHeight ?? 0.2}
                onChange={(value) => setLabelHeight(value!)}
              />
            </Menu.Item>
            {/* the label's font size */}
            <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'tree-label-font-size'}>
              <InputNumber
                addonBefore={i18n.t('labelSubMenu.LabelFontSize', lang) + ':'}
                min={10}
                max={100}
                step={1}
                precision={0}
                value={tree.labelFontSize ?? 20}
                onChange={(value) => setLabelFontSize(value!)}
              />
            </Menu.Item>
            {/* the label's size */}
            <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'tree-label-size'}>
              <InputNumber
                addonBefore={i18n.t('labelSubMenu.LabelSize', lang) + ':'}
                min={0.2}
                max={5}
                step={0.1}
                precision={1}
                value={tree.labelSize ?? 0.2}
                onChange={(value) => setLabelSize(value!)}
              />
            </Menu.Item>
            {/* the label's color */}
            <Menu.Item style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }} key={'tree-label-color'}>
              <Input
                addonBefore={i18n.t('labelSubMenu.LabelColor', lang) + ':'}
                value={tree.labelColor ?? '#ffffff'}
                onChange={(e) => setLabelColor(e.target.value)}
              />
            </Menu.Item>
          </Menu>
        </SubMenu>
      )}
    </Menu.ItemGroup>
  );
});
