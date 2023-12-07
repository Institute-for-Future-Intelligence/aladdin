/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Checkbox, Menu, Space } from 'antd';
import HumanSelection from './humanSelection';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { HumanModel } from '../../../models/HumanModel';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { useRefStore } from '../../../stores/commonRef';
import { Easing, Tween, update } from '@tweenjs/tween.js';
import { Util } from '../../../Util';
import { ObjectType } from '../../../types';
import { useSelectedElement } from './menuHooks';

export const HumanMenu = React.memo(() => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const getParent = useStore(Selector.getParent);
  const selectNone = useStore(Selector.selectNone);
  const language = useStore(Selector.language);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const human = useSelectedElement(ObjectType.Human) as HumanModel | undefined;

  const [animationFlag, setAnimationFlag] = useState(false);

  const editable = !human?.locked;
  const requestRef = useRef<number>(0);
  const previousFrameTime = useRef<number>(-1);
  const firstCall = useRef<boolean>(true);
  const animateMove = useRef<boolean>(false);

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

  const updateHumanFlipById = (id: string, yes: boolean) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Human && e.id === id) {
          const human = e as HumanModel;
          human.flip = yes;
          break;
        }
      }
    });
  };

  const updateHumanObserverById = (id: string, yes: boolean) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Human && e.id === id) {
          (e as HumanModel).observer = yes;
          break;
        }
      }
    });
  };

  const moveCamera = (x: number, y: number, z: number) => {
    const orbitControlsRef = useRefStore.getState().orbitControlsRef;
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
    const cam = useStore.getState().cameraDirection.clone().normalize().multiplyScalar(0.5);
    x += cam.x;
    y += cam.y;
    const originalPosition = [...useStore.getState().viewState.cameraPosition];
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

  if (!human) return null;

  return (
    <Menu.ItemGroup>
      {/* <Copy keyName={'human-copy'} />
      {editable && <Cut keyName={'human-cut'} />}
      <Lock keyName={'human-lock'} /> */}
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
                selectedElementId: human.id,
                selectedElementType: ObjectType.Human,
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
        <Menu.Item key={'human-flip'}>
          <Checkbox
            checked={human.flip}
            onChange={(e) => {
              const checked = e.target.checked;
              const undoableCheck = {
                name: 'Flip Human',
                timestamp: Date.now(),
                checked: checked,
                selectedElementId: human.id,
                selectedElementType: ObjectType.Human,
                undo: () => {
                  updateHumanFlipById(human.id, !undoableCheck.checked);
                },
                redo: () => {
                  updateHumanFlipById(human.id, undoableCheck.checked);
                },
              } as UndoableCheck;
              addUndoable(undoableCheck);
              updateHumanFlipById(human.id, checked);
            }}
          >
            {i18n.t('peopleMenu.Flip', { lng: language })}
          </Checkbox>
        </Menu.Item>
      )}
      {editable && (
        <Menu>
          <Menu.Item key={'human-change-person'} style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}>
            <Space style={{ width: '120px' }}>{i18n.t('peopleMenu.ChangePerson', { lng: language })}: </Space>
            <HumanSelection key={'humans'} />
          </Menu.Item>
        </Menu>
      )}
    </Menu.ItemGroup>
  );
});
