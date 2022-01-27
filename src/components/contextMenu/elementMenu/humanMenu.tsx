/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Checkbox, Menu, Space } from 'antd';
import HumanSelection from './humanSelection';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { HumanModel } from '../../../models/HumanModel';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { useStoreRef } from '../../../stores/commonRef';
import { Easing, Tween, update } from '@tweenjs/tween.js';
import { Util } from '../../../Util';

export const HumanMenu = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const addUndoable = useStore(Selector.addUndoable);
  const cameraDirection = useStore(Selector.cameraDirection);
  const cameraPosition = useStore(Selector.viewState.cameraPosition);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const getParent = useStore(Selector.getParent);
  const updateHumanObserverById = useStore(Selector.updateHumanObserverById);
  const selectNone = useStore(Selector.selectNone);

  const human = getSelectedElement() as HumanModel;
  const editable = !human?.locked;
  const requestRef = useRef<number>(0);
  const previousFrameTime = useRef<number>(-1);
  const firstCall = useRef<boolean>(true);
  const animateMove = useRef<boolean>(false);
  const [animationFlag, setAnimationFlag] = useState(false);

  useEffect(() => {
    if (animateMove.current) {
      if (firstCall.current) {
        requestRef.current = requestAnimationFrame(animate);
        tween();
        return () => {
          cancelAnimationFrame(requestRef.current);
        };
      } else {
        firstCall.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationFlag]);

  const moveCamera = (x: number, y: number, z: number) => {
    const orbitControlsRef = useStoreRef.getState().orbitControlsRef;
    if (orbitControlsRef?.current) {
      orbitControlsRef.current.object.position.set(x, y, z);
      orbitControlsRef.current.update();
      setCommonStore((state) => {
        const v = state.viewState;
        v.cameraPosition = [x, y, z];
      });
    }
  };

  const animate = () => {
    requestAnimationFrame(animate);
    const currentFrameTime = Date.now();
    if (currentFrameTime - previousFrameTime.current > 100) {
      update();
      previousFrameTime.current = currentFrameTime;
    }
  };

  const tween = () => {
    if (!human) return;
    let x = human.cx;
    let y = human.cy;
    let z = human.cz + human.lz;
    const parent = getParent(human);
    if (parent) {
      const v = Util.absoluteHumanOrTreeCoordinates(x, y, z, parent);
      x = v.x;
      y = v.y;
      z = v.z;
    }
    const cam = cameraDirection.clone().normalize().multiplyScalar(0.5);
    x += cam.x;
    y += cam.y;
    const originalPosition = [...cameraPosition];
    new Tween(originalPosition)
      .to([x, y, z], 1000)
      .easing(Easing.Quadratic.In)
      .onUpdate((d) => {
        moveCamera(d[0], d[1], d[2]);
      })
      .onComplete(() => {
        selectNone();
      })
      .start();
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
              }}
            >
              {i18n.t('peopleMenu.Observer', { lng: language })}
            </Checkbox>
          </Menu.Item>
        )}
        {!orthographic && (
          <Menu.Item
            key={'human-move-view'}
            onClick={() => {
              setAnimationFlag(!animationFlag);
              animateMove.current = true;
            }}
            style={{ paddingLeft: '36px' }}
          >
            {i18n.t('peopleMenu.ViewFromThisPerson', { lng: language })}
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
