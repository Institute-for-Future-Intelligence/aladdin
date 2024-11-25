/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, InputNumber, Radio, Row, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { DoorModel } from '../../../../models/DoorModel';
import { Util } from '../../../../Util';
import { DEFAULT_DOOR_U_VALUE } from '../../../../constants';
import { useSelectedElement } from '../menuHooks';
import { useLanguage } from 'src/hooks';
import Dialog from '../../dialog';

const DoorUValueInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.doorActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);

  const door = useSelectedElement(ObjectType.Door) as DoorModel | undefined;

  const [inputValue, setInputValue] = useState<number>(door?.uValue ?? DEFAULT_DOOR_U_VALUE);
  const [inputValueUS, setInputValueUS] = useState<number>(Util.toUValueInUS(inputValue));

  const lang = useLanguage();

  const updateById = (id: string, value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          (e as DoorModel).uValue = value;
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
          if (
            e.type === ObjectType.Door &&
            value !== (e as DoorModel).uValue &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Door && value !== (e as DoorModel).uValue && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.Door &&
            e.foundationId === door.foundationId &&
            value !== (e as DoorModel).uValue &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      case Scope.OnlyThisSide:
        for (const e of elements) {
          if (
            e.type === ObjectType.Door &&
            e.parentId === door.parentId &&
            value !== (e as DoorModel).uValue &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      default:
        if (value !== door?.uValue) {
          return true;
        }
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
            if (e.type === ObjectType.Door && !e.locked) {
              const door = e as DoorModel;
              oldValuesSelected.set(e.id, door.uValue ?? DEFAULT_DOOR_U_VALUE);
              door.uValue = value;
            }
          }
        });
        const undoableChangeSelected = {
          name: 'Set U-Value for Selected Doors',
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
              const door = e as DoorModel;
              oldValuesAll.set(e.id, door.uValue ?? DEFAULT_DOOR_U_VALUE);
              door.uValue = value;
            }
          }
        });
        const undoableChangeAll = {
          name: 'Set U-Value for All Doors',
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
                const door = e as DoorModel;
                oldValuesAboveFoundation.set(e.id, door.uValue ?? DEFAULT_DOOR_U_VALUE);
                door.uValue = value;
              }
            }
          });
          const undoableChangeAboveFoundation = {
            name: 'Set U-Value for All Doors Above Foundation',
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
                const door = e as DoorModel;
                oldValues.set(e.id, door.uValue ?? DEFAULT_DOOR_U_VALUE);
                door.uValue = value;
              }
            }
          });
          const undoableChangeOnSameWall = {
            name: 'Set U-Value for All Doors On the Same Wall',
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
          const oldValue = updatedDoor.uValue ?? door.uValue ?? DEFAULT_DOOR_U_VALUE;
          const undoableChange = {
            name: 'Set Door U-Value',
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
    setCommonStore((state) => {
      state.actionState.doorUValue = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setValue(inputValue);
  };

  return (
    <Dialog
      width={550}
      title={`${i18n.t('word.UValue', lang) + ' '}(${i18n.t('word.ThermalTransmittance', lang)})`}
      onApply={apply}
      onClose={close}
    >
      <Row gutter={6}>
        <Col span={7}>
          <InputNumber
            min={0.01}
            max={100}
            style={{ width: 120 }}
            step={0.05}
            precision={2}
            value={inputValue}
            formatter={(a) => Number(a).toFixed(2)}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
              setInputValueUS(Util.toUValueInUS(value));
            }}
          />
          <div style={{ paddingTop: '4px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0.01, 100]
            <br />
            {i18n.t('word.SIUnit', lang)}: W/(m²·℃)
          </div>
          <br />
          <InputNumber
            min={Util.toUValueInUS(0.01)}
            max={Util.toUValueInUS(100)}
            style={{ width: 120 }}
            step={0.01}
            precision={2}
            value={inputValueUS}
            formatter={(a) => Number(a).toFixed(2)}
            onChange={(value) => {
              if (value === null) return;
              setInputValueUS(value);
              setInputValue(Util.toUValueInSI(value));
            }}
          />
          <div style={{ paddingTop: '4px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [{Util.toUValueInUS(0.01).toFixed(3)}, {Util.toUValueInUS(100).toFixed(1)}]
            <br />
            {i18n.t('word.USUnit', lang)}: Btu/(h·ft²·℉)
          </div>
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
        >
          <Radio.Group onChange={(e) => useStore.getState().setDoorActionScope(e.target.value)} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('doorMenu.OnlyThisDoor', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisSide}>
                {i18n.t('doorMenu.AllDoorsOnWall', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('doorMenu.AllDoorsAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('doorMenu.AllSelectedDoors', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('doorMenu.AllDoors', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default DoorUValueInput;
