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
import { useStoreRef } from '../../../stores/commonRef';

export const HumanMenu = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const addUndoable = useStore(Selector.addUndoable);
  const cameraDirection = useStore(Selector.cameraDirection);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const getParent = useStore(Selector.getParent);
  const updateHumanObserverById = useStore(Selector.updateHumanObserverById);

  const human = getSelectedElement() as HumanModel;
  const editable = !human?.locked;

  const setView = () => {
    const orbitControlsRef = useStoreRef.getState().orbitControlsRef;
    if (orbitControlsRef?.current) {
      const cam = cameraDirection.clone().normalize().multiplyScalar(0.5);
      let x = human.cx + cam.x;
      let y = human.cy + cam.y;
      let z = human.cz + human.lz + cam.z;
      const parent = getParent(human);
      if (parent) {
        x += parent.cx;
        y += parent.cy;
        z += parent.cz;
      }
      orbitControlsRef.current.object.position.set(x, y, z);
      orbitControlsRef.current.update();
      setCommonStore((state) => {
        const v = state.viewState;
        v.cameraPosition = [x, y, z];
      });
    }
  };

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
                //if(checked) setView();
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
