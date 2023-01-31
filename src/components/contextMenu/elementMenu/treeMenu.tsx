/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Input, InputNumber, Menu, Space } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType } from '../../../types';
import TreeSelection from './treeSelection';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { UndoableChange } from '../../../undo/UndoableChange';
import { TreeModel } from '../../../models/TreeModel';
import { useLabel } from './menuHooks';

export const TreeMenu = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const updateElementLxById = useStore(Selector.updateElementLxById);
  const updateElementLzById = useStore(Selector.updateElementLzById);
  const updateElementLabelById = useStore(Selector.updateElementLabelById);
  const updateElementShowLabelById = useStore(Selector.updateElementShowLabelById);
  const updateTreeShowModelById = useStore(Selector.updateTreeShowModelById);
  const updateTreeFlipById = useStore(Selector.updateTreeFlipById);
  const tree = useStore((state) => state.elements.find((e) => e.selected && e.type === ObjectType.Tree)) as TreeModel;
  const addUndoable = useStore(Selector.addUndoable);

  const [inputSpread, setInputSpread] = useState<number>(tree?.lx ?? 1);
  const [inputHeight, setInputHeight] = useState<number>(tree?.lz ?? 1);

  const { labelText, setLabelText } = useLabel(tree);

  if (!tree) return null;

  const lang = { lng: language };
  const editable = !tree?.locked;

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

  const showLabel = (checked: boolean) => {
    if (tree) {
      const undoableCheck = {
        name: 'Show Tree Label',
        timestamp: Date.now(),
        checked: !tree.showLabel,
        selectedElementId: tree.id,
        selectedElementType: ObjectType.Tree,
        undo: () => {
          updateElementShowLabelById(tree.id, !undoableCheck.checked);
        },
        redo: () => {
          updateElementShowLabelById(tree.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateElementShowLabelById(tree.id, checked);
    }
  };

  const updateLabelText = () => {
    if (tree) {
      const oldLabel = tree.label;
      const undoableChange = {
        name: 'Set Tree Label',
        timestamp: Date.now(),
        oldValue: oldLabel,
        newValue: labelText,
        changedElementId: tree.id,
        changedElementType: ObjectType.Tree,
        undo: () => {
          updateElementLabelById(undoableChange.changedElementId, undoableChange.oldValue as string);
        },
        redo: () => {
          updateElementLabelById(undoableChange.changedElementId, undoableChange.newValue as string);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateElementLabelById(tree.id, labelText);
    }
  };

  return (
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
              onChange={(value) => setSpread(value)}
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
              onChange={(value) => setHeight(value)}
            />
          </Menu.Item>
        </Menu>
      )}

      {/* show label or not */}
      {editable && (
        <Menu.Item key={'tree-show-label'}>
          <Checkbox checked={!!tree?.showLabel} onChange={(e) => showLabel(e.target.checked)}>
            {i18n.t('treeMenu.KeepShowingLabel', lang)}
          </Checkbox>
        </Menu.Item>
      )}

      {/*have to wrap the text field with a Menu so that it can stay open when the user types in it */}
      {editable && (
        <Menu>
          {/* label text */}
          <Menu.Item key={'tree-label-text'} style={{ paddingLeft: '36px' }}>
            <Input
              addonBefore={i18n.t('treeMenu.Label', lang) + ':'}
              value={labelText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
              onPressEnter={updateLabelText}
              onBlur={updateLabelText}
            />
          </Menu.Item>
        </Menu>
      )}
    </>
  );
});
