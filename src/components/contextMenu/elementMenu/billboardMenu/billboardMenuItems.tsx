/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Checkbox, Space, InputNumber } from 'antd';
import { MenuItem } from '../../menuItems';
import { useLanguage } from 'src/hooks';
import i18n from 'src/i18n/i18n';
import { ObjectType } from 'src/types';
import { useStore } from 'src/stores/common';
import { HumanModel } from 'src/models/HumanModel';
import { TreeModel } from 'src/models/TreeModel';
import { FlowerModel } from 'src/models/FlowerModel';
import { UndoableCheck } from 'src/undo/UndoableCheck';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import React, { useEffect, useRef, useState } from 'react';
import { Easing, Tween, update } from '@tweenjs/tween.js';
import { Util } from 'src/Util';
import { useRefStore } from 'src/stores/commonRef';
import { UndoableChange } from 'src/undo/UndoableChange';

type BillBoardModel = HumanModel | TreeModel | FlowerModel;

export const BillboardFlipCheckbox = React.memo(({ billboardModel }: { billboardModel: BillBoardModel }) => {
  const lang = useLanguage();

  const updateBillboardFlipById = (id: string, yes: boolean) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (
          e.id === id &&
          (e.type === ObjectType.Human || e.type === ObjectType.Tree || e.type === ObjectType.Flower)
        ) {
          const billboard = e as BillBoardModel;
          billboard.flip = yes;
          break;
        }
      }
    });
  };

  const handleChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    const undoableCheck = {
      name: `Flip ${billboardModel.type}`,
      timestamp: Date.now(),
      checked: checked,
      selectedElementId: billboardModel.id,
      selectedElementType: ObjectType.Human,
      undo: () => {
        updateBillboardFlipById(billboardModel.id, !undoableCheck.checked);
      },
      redo: () => {
        updateBillboardFlipById(billboardModel.id, undoableCheck.checked);
      },
    } as UndoableCheck;
    useStore.getState().addUndoable(undoableCheck);
    updateBillboardFlipById(billboardModel.id, checked);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={billboardModel.flip} onChange={handleChange}>
        {i18n.t('peopleMenu.Flip', lang)}
      </Checkbox>
    </MenuItem>
  );
});

export const HumanObserverCheckbox = React.memo(({ human }: { human: HumanModel }) => {
  const lang = useLanguage();

  const updateHumanObserverById = (id: string, yes: boolean) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Human && e.id === id) {
          (e as HumanModel).observer = yes;
          break;
        }
      }
    });
  };

  const handleChange = (e: CheckboxChangeEvent) => {
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
    useStore.getState().addUndoable(undoableCheck);
    updateHumanObserverById(human.id, checked);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={human.observer} onChange={handleChange}>
        {i18n.t('peopleMenu.Observer', lang)}
      </Checkbox>
    </MenuItem>
  );
});

export const HumanMoveViewItem = React.memo(({ human }: { human: HumanModel }) => {
  const lang = useLanguage();

  const [animationFlag, setAnimationFlag] = useState(false);

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

  const moveCamera = (x: number, y: number, z: number) => {
    const orbitControlsRef = useRefStore.getState().orbitControlsRef;
    if (orbitControlsRef?.current) {
      orbitControlsRef.current.object.position.set(x, y, z);
      orbitControlsRef.current.update();
      useStore.getState().set((state) => {
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
    const parent = useStore.getState().getParent(human);
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
        useStore.getState().selectNone();
      })
      .start();
  };

  const handleClick = () => {
    setAnimationFlag(!animationFlag);
    animateMove.current = true;
  };

  return <MenuItem onClick={handleClick}>{i18n.t('peopleMenu.ViewFromThisPerson', lang)}</MenuItem>;
});

export const TreeShowModelCheckbox = React.memo(({ tree }: { tree: TreeModel }) => {
  const lang = useLanguage();

  const updateTreeShowModelById = (id: string, showModel: boolean) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Tree && e.id === id) {
          (e as TreeModel).showModel = showModel;
          break;
        }
      }
    });
  };

  const showTreeModel = (on: boolean) => {
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
    useStore.getState().addUndoable(undoableCheck);
    updateTreeShowModelById(tree.id, on);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Checkbox
        style={{ width: '100%' }}
        checked={tree?.showModel && tree?.type === ObjectType.Tree}
        onChange={(e) => showTreeModel(e.target.checked)}
      >
        {i18n.t('treeMenu.ShowModel', lang)}
      </Checkbox>
    </MenuItem>
  );
});

export const TreeSpreadInput = React.memo(({ tree }: { tree: TreeModel }) => {
  const updateElementLxById = useStore.getState().updateElementLxById;

  const lang = useLanguage();
  const inputSpread = tree.lx ?? 1;

  const setSpread = (value: number | null) => {
    if (value === null || value === inputSpread) return;

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
    useStore.getState().addUndoable(undoableChange);
    updateElementLxById(tree.id, value);
    useStore.getState().set((state) => {
      state.actionState.treeSpread = value;
    });
  };

  return (
    <MenuItem stayAfterClick>
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
        onChange={setSpread}
      />
    </MenuItem>
  );
});

export const TreeHeightInput = React.memo(({ tree }: { tree: TreeModel }) => {
  const updateElementLzById = useStore.getState().updateElementLzById;

  const lang = useLanguage();
  const inputHeight = tree.lz ?? 1;

  const setHeight = (value: number | null) => {
    if (value === null || value === inputHeight) return;

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
    useStore.getState().addUndoable(undoableChange);
    updateElementLzById(tree.id, value);
    useStore.getState().set((state) => {
      state.actionState.treeHeight = value;
    });
  };

  return (
    <MenuItem stayAfterClick>
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
        onChange={setHeight}
      />
    </MenuItem>
  );
});
