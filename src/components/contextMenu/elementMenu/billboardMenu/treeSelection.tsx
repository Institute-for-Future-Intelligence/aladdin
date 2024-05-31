/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Select } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ObjectType, TreeType } from '../../../../types';
import AppleImage from 'src/resources/apple_summer.png';
import BirchImage from 'src/resources/birch_summer.png';
import CoconutImage from 'src/resources/coconut.png';
import DogwoodImage from 'src/resources/dogwood_summer.png';
import ElmImage from 'src/resources/elm_summer.png';
import LindenImage from 'src/resources/linden_summer.png';
import MagnoliaImage from 'src/resources/magnolia_summer.png';
import MapleImage from 'src/resources/maple_summer.png';
import OakImage from 'src/resources/oak_summer.png';
import FanPalmImage from 'src/resources/fan_palm.png';
import PineImage from 'src/resources/pine.png';
import SpruceImage from 'src/resources/spruce.png';
import { UndoableChange } from '../../../../undo/UndoableChange';
import i18n from '../../../../i18n/i18n';
import { TreeModel } from '../../../../models/TreeModel';
import { useLanguage } from '../../../../hooks';

const { Option } = Select;

const TreeSelection = React.memo(({ tree }: { tree: TreeModel }) => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);

  const [updateFlag, setUpdateFlag] = useState(false);
  const lang = useLanguage();

  const updateTreeTypeById = (id: string, type: TreeType) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Tree && e.id === id) {
          (e as TreeModel).name = type;
          break;
        }
      }
    });
  };

  return (
    <Select
      style={{ width: '160px' }}
      value={tree?.name ?? TreeType.Pine}
      onChange={(value) => {
        if (tree) {
          const oldTree = tree.name;
          if (oldTree !== value) {
            const undoableChange = {
              name: 'Change Tree',
              timestamp: Date.now(),
              oldValue: oldTree,
              newValue: value,
              changedElementId: tree.id,
              changedElementType: tree.type,
              undo: () => {
                updateTreeTypeById(undoableChange.changedElementId, undoableChange.oldValue as TreeType);
              },
              redo: () => {
                updateTreeTypeById(undoableChange.changedElementId, undoableChange.newValue as TreeType);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            updateTreeTypeById(tree.id, value);
            setCommonStore((state) => {
              state.actionState.treeType = value;
            });
            setUpdateFlag(!updateFlag);
          }
        }
      }}
    >
      <Option key={TreeType.Apple} value={TreeType.Apple}>
        <img alt={TreeType.Apple} src={AppleImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {i18n.t('tree.Apple', lang)}
      </Option>
      <Option key={TreeType.Birch} value={TreeType.Birch}>
        <img alt={TreeType.Birch} src={BirchImage} height={20} style={{ paddingRight: '20px' }} />{' '}
        {i18n.t('tree.Birch', lang)}
      </Option>
      <Option key={TreeType.Coconut} value={TreeType.Coconut}>
        <img alt={TreeType.Coconut} src={CoconutImage} height={20} style={{ paddingRight: '18px' }} />{' '}
        {i18n.t('tree.Coconut', lang)}
      </Option>
      <Option key={TreeType.Dogwood} value={TreeType.Dogwood}>
        <img alt={TreeType.Dogwood} src={DogwoodImage} height={20} style={{ paddingRight: '10px' }} />{' '}
        {i18n.t('tree.Dogwood', lang)}
      </Option>
      <Option key={TreeType.Elm} value={TreeType.Elm}>
        <img alt={TreeType.Elm} src={ElmImage} height={20} style={{ paddingRight: '20px' }} />
        {i18n.t('tree.Elm', lang)}
      </Option>
      <Option key={TreeType.FanPalm} value={TreeType.FanPalm}>
        <img alt={TreeType.FanPalm} src={FanPalmImage} height={20} style={{ paddingRight: '18px' }} />{' '}
        {i18n.t('tree.FanPalm', lang)}
      </Option>
      <Option key={TreeType.Linden} value={TreeType.Linden}>
        <img alt={TreeType.Linden} src={LindenImage} height={20} style={{ paddingRight: '10px' }} />{' '}
        {i18n.t('tree.Linden', lang)}
      </Option>
      <Option key={TreeType.Magnolia} value={TreeType.Magnolia}>
        <img alt={TreeType.Magnolia} src={MagnoliaImage} height={20} style={{ paddingRight: '10px' }} />{' '}
        {i18n.t('tree.Magnolia', lang)}
      </Option>
      <Option key={TreeType.Maple} value={TreeType.Maple}>
        <img alt={TreeType.Maple} src={MapleImage} height={20} style={{ paddingRight: '12px' }} />{' '}
        {i18n.t('tree.Maple', lang)}
      </Option>
      <Option key={TreeType.Oak} value={TreeType.Oak}>
        <img alt={TreeType.Oak} src={OakImage} height={20} style={{ paddingRight: '17px' }} />
        {i18n.t('tree.Oak', lang)}
      </Option>
      <Option key={TreeType.Pine} value={TreeType.Pine}>
        <img alt={TreeType.Pine} src={PineImage} height={20} style={{ paddingRight: '18px' }} />{' '}
        {i18n.t('tree.Pine', lang)}
      </Option>
      <Option key={TreeType.Spruce} value={TreeType.Spruce}>
        <img alt={TreeType.Spruce} src={SpruceImage} height={20} style={{ paddingRight: '20px' }} />{' '}
        {i18n.t('tree.Spruce', lang)}
      </Option>
    </Select>
  );
});

export default TreeSelection;
