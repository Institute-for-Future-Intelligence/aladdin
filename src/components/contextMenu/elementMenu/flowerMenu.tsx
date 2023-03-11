/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Checkbox, Menu, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { FlowerModel } from '../../../models/FlowerModel';
import FlowerSelection from './flowerSelection';
import { ObjectType } from '../../../types';
import { UndoableCheck } from '../../../undo/UndoableCheck';

export const FlowerMenu = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const flower = useStore((state) =>
    state.elements.find((e) => e.selected && e.type === ObjectType.Flower),
  ) as FlowerModel;
  const addUndoable = useStore(Selector.addUndoable);

  if (!flower) return null;

  const lang = { lng: language };
  const editable = !flower?.locked;

  const updateFlowerFlipById = (id: string, flip: boolean) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Flower && e.id === id) {
          (e as FlowerModel).flip = flip;
          break;
        }
      }
    });
  };

  return (
    <Menu.ItemGroup>
      <Copy keyName={'flower-copy'} />
      {editable && <Cut keyName={'flower-cut'} />}
      <Lock keyName={'flower-lock'} />

      {editable && (
        <Menu.Item key={'flower-flip'}>
          <Checkbox
            checked={flower.flip}
            onChange={(e) => {
              const checked = e.target.checked;
              const undoableCheck = {
                name: 'Flip Flower',
                timestamp: Date.now(),
                checked: checked,
                selectedElementId: flower.id,
                selectedElementType: ObjectType.Flower,
                undo: () => {
                  updateFlowerFlipById(flower.id, !undoableCheck.checked);
                },
                redo: () => {
                  updateFlowerFlipById(flower.id, undoableCheck.checked);
                },
              } as UndoableCheck;
              addUndoable(undoableCheck);
              updateFlowerFlipById(flower.id, checked);
            }}
          >
            {i18n.t('flowerMenu.Flip', { lng: language })}
          </Checkbox>
        </Menu.Item>
      )}

      {/* have to wrap the text field with a Menu so that it can stay open when the user types in it */}
      {editable && (
        <Menu>
          <Menu.Item key={'flower-change-type'} style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}>
            <Space style={{ width: '100px' }}>{i18n.t('flowerMenu.Type', lang)}: </Space>
            <FlowerSelection key={'flowers'} />
          </Menu.Item>
        </Menu>
      )}
    </Menu.ItemGroup>
  );
};
