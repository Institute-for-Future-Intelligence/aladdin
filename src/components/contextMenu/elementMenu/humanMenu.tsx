/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Checkbox, Menu, Space } from 'antd';
import HumanSelection from './humanSelection';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { HumanModel } from '../../../models/HumanModel';
import { UndoableCheck } from '../../../undo/UndoableCheck';

export const HumanMenu = () => {
  const language = useStore(Selector.language);
  const addUndoable = useStore(Selector.addUndoable);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const updateHumanObserverById = useStore(Selector.updateHumanObserverById);

  const human = getSelectedElement() as HumanModel;
  const editable = !human?.locked;

  return (
    human && (
      <>
        <Copy keyName={'human-copy'} />
        {editable && <Cut keyName={'human-cut'} />}
        <Lock keyName={'human-lock'} />
        {editable && (
          <Menu.Item key={'human-observer'}>
            <Checkbox
              checked={human.observer}
              onChange={(e) => {
                const checked = e.target.checked;
                const undoableCheck = {
                  name: 'Set Observer',
                  timestamp: Date.now(),
                  checked: checked,
                  undo: () => {
                    updateHumanObserverById(human.id, !undoableCheck.checked);
                  },
                  redo: () => {
                    updateHumanObserverById(human.id, undoableCheck.checked);
                  },
                } as UndoableCheck;
                addUndoable(undoableCheck);
                updateHumanObserverById(human.id, checked);
              }}
            >
              {i18n.t('peopleMenu.Observer', { lng: language })}
            </Checkbox>
          </Menu.Item>
        )}
        {editable && (
          <Menu>
            <Menu.Item key={'human-change-person'} style={{ paddingLeft: '36px' }}>
              <Space style={{ width: '120px' }}>{i18n.t('peopleMenu.ChangePerson', { lng: language })}: </Space>
              <HumanSelection key={'humans'} />
            </Menu.Item>
          </Menu>
        )}
      </>
    )
  );
};
