/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useState } from 'react';
import { Col, InputNumber, Radio, Row, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { DoorModel } from '../../../models/DoorModel';
import { useSelectedElement } from './menuHooks';
import { useLanguage } from 'src/views/hooks';
import Dialog from '../dialog';

const DoorWidthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.doorActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);
  const getParent = useStore(Selector.getParent);

  const door = useSelectedElement(ObjectType.Door) as DoorModel | undefined;

  const currentValue = useMemo(() => {
    const v = door ? door.lx : 1;
    const parent = door ? getParent(door) : null;
    if (parent) return v * parent.lx;
    return v;
  }, [door?.lx]);

  const [inputValue, setInputValue] = useState<number>(currentValue);

  const lang = useLanguage();

  const updateById = (id: string, value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Door) {
          const d = e as DoorModel;
          const parent = getParent(d);
          d.lx = parent ? value / parent.lx : value;
          break;
        }
      }
    });
  };

  const undoInMap = (map: Map<string, number>) => {
    for (const [id, val] of map.entries()) {
      updateById(id, val);
    }
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    for (const id of map.keys()) {
      updateById(id, value);
    }
  };

  const needChange = (value: number) => {
    if (!door) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Door && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const parent = getParent(e);
            if (parent && value !== e.lx * parent.lx) return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Door && !e.locked) {
            const parent = getParent(e);
            if (parent && value !== e.lx * parent.lx) return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.Door && e.foundationId === door.foundationId && !e.locked) {
            const parent = getParent(e);
            if (parent && value !== e.lx * parent.lx) return true;
          }
        }
        break;
      case Scope.OnlyThisSide:
        for (const e of elements) {
          if (e.type === ObjectType.Door && e.parentId === door.parentId && !e.locked) {
            const parent = getParent(e);
            if (parent && value !== e.lx * parent.lx) return true;
          }
        }
        break;
      default:
        const parent = getParent(door);
        if (parent && value !== door.lx * parent.lx) return true;
        break;
    }
    return false;
  };

  const setValue = (value: number) => {
    if (!door) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, number | undefined>();
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.type === ObjectType.Door && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
              const d = e as DoorModel;
              const parent = d ? getParent(d) : null;
              oldValuesSelected.set(e.id, d.lx * (parent ? parent.lx : 1));
              d.lx = parent ? value / parent.lx : value;
            }
          }
        });
        const undoableChangeSelected = {
          name: 'Set Width for Selected Doors',
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: value,
          undo: () => {
            undoInMap(undoableChangeSelected.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, number>,
              undoableChangeSelected.newValue as number,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldValuesAll = new Map<string, number | undefined>();
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.type === ObjectType.Door && !e.locked) {
              const d = e as DoorModel;
              const parent = d ? getParent(d) : null;
              oldValuesAll.set(e.id, d.lx * (parent ? parent.lx : 1));
              d.lx = parent ? value / parent.lx : value;
            }
          }
        });
        const undoableChangeAll = {
          name: 'Set Width for All Doors',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            undoInMap(undoableChangeAll.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, number>, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (door.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number | undefined>();
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.type === ObjectType.Door && e.foundationId === door.foundationId && !e.locked) {
                const d = e as DoorModel;
                const parent = d ? getParent(d) : null;
                oldValuesAboveFoundation.set(e.id, d.lx * (parent ? parent.lx : 1));
                d.lx = parent ? value / parent.lx : value;
              }
            }
          });
          const undoableChangeAboveFoundation = {
            name: 'Set Width for All Doors Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: door.foundationId,
            undo: () => {
              undoInMap(undoableChangeAboveFoundation.oldValues as Map<string, number>);
            },
            redo: () => {
              updateInMap(
                undoableChangeAboveFoundation.oldValues as Map<string, number>,
                undoableChangeAboveFoundation.newValue as number,
              );
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.OnlyThisSide:
        if (door.parentId) {
          const oldValues = new Map<string, number>();
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.type === ObjectType.Door && e.parentId === door.parentId && !e.locked) {
                const d = e as DoorModel;
                const parent = d ? getParent(d) : null;
                oldValues.set(e.id, d.lx * (parent ? parent.lx : 1));
                d.lx = parent ? value / parent.lx : value;
              }
            }
          });
          const undoableChangeOnSameWall = {
            name: 'Set Width for All Doors On the Same Wall',
            timestamp: Date.now(),
            oldValues: oldValues,
            newValue: value,
            groupId: door.parentId,
            undo: () => {
              undoInMap(undoableChangeOnSameWall.oldValues as Map<string, number>);
            },
            redo: () => {
              updateInMap(
                undoableChangeOnSameWall.oldValues as Map<string, number>,
                undoableChangeOnSameWall.newValue as number,
              );
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSameWall);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (door) {
          const updatedDoor = getElementById(door.id) as DoorModel;
          const parent = door ? getParent(updatedDoor) : null;
          const oldValue = (updatedDoor.lx ?? door.lx ?? 0.1) * (parent ? parent.lx : 1);
          const undoableChange = {
            name: 'Set Door Width',
            timestamp: Date.now(),
            oldValue: oldValue,
            newValue: value,
            changedElementId: door.id,
            changedElementType: door.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(door.id, value);
          setApplyCount(applyCount + 1);
        }
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setValue(inputValue);
  };

  const parent = door ? getParent(door) : null;
  const max = parent && door ? 2 * parent.lx * Math.min(Math.abs(0.5 - door.cx), Math.abs(-0.5 - door.cx)) : 100;

  return (
    <Dialog width={550} title={i18n.t('word.Width', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={0.1}
            max={max}
            style={{ width: 120 }}
            step={0.1}
            precision={2}
            value={inputValue}
            formatter={(a) => Number(a).toFixed(2)}
            onChange={(value) => setInputValue(value)}
          />
          <div style={{ paddingTop: '4px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0.1, {max.toFixed(1)}]{i18n.t('word.MeterAbbreviation', lang)}
          </div>
        </Col>
        <Col className="gutter-row" span={1} style={{ verticalAlign: 'middle', paddingTop: '6px' }}>
          {i18n.t('word.MeterAbbreviation', lang)}
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
        >
          <Radio.Group onChange={(e) => useStore.getState().setDoorActionScope(e.target.value)} value={actionScope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('doorMenu.OnlyThisDoor', lang)}</Radio>
              <Radio value={Scope.OnlyThisSide}>{i18n.t('doorMenu.AllDoorsOnWall', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('doorMenu.AllDoorsAboveFoundation', lang)}
              </Radio>
              <Radio value={Scope.AllSelectedObjectsOfThisType}>{i18n.t('doorMenu.AllSelectedDoors', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('doorMenu.AllDoors', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default DoorWidthInput;
