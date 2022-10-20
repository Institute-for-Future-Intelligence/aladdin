/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Checkbox, Menu, Space } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { FlowerModel } from '../../../models/FlowerModel';
import FlowerSelection from './flowerSelection';
import { ObjectType } from '../../../types';
import { UndoableCheck } from '../../../undo/UndoableCheck';

export const FlowerMenu = () => {
  const language = useStore(Selector.language);
  const flower = useStore(Selector.selectedElement) as FlowerModel;
  const updateFlowerFlipById = useStore(Selector.updateFlowerFlipById);
  const addUndoable = useStore(Selector.addUndoable);

  const lang = { lng: language };
  const editable = !flower?.locked;

  return (
    flower && (
      <>
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
            <Menu.Item key={'flower-change-type'} style={{ paddingLeft: '36px' }}>
              <Space style={{ width: '100px' }}>{i18n.t('flowerMenu.Type', lang)}: </Space>
              <FlowerSelection key={'flowers'} />
            </Menu.Item>
          </Menu>
        )}
      </>
    )
  );
};
