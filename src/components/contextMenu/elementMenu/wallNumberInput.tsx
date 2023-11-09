/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Col, InputNumber, Radio, Row, Space } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { WallModel } from '../../../models/WallModel';
import { Util } from '../../../Util';
import Dialog from '../dialog';
import { useLanguage } from 'src/views/hooks';

interface WallNumberInputProps {
  wall: WallModel;
  dataType: string;
  attributeKey: keyof WallModel;
  range: [min: number, max: number];
  step: number;
  setDialogVisible: () => void;
  unit?: string;
}

const WallNumberInput = ({
  wall,
  dataType,
  attributeKey,
  range,
  step,
  unit,
  setDialogVisible,
}: WallNumberInputProps) => {
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.wallActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const setCommonStore = useStore(Selector.set);

  const inputRef = useRef<number>(wall[attributeKey] as number);

  const lang = useLanguage();

  const updateActionState = (value: number) => {
    setCommonStore((state) => {
      switch (attributeKey) {
        case 'ly':
          state.actionState.wallThickness = value;
          break;
        case 'lz':
          state.actionState.wallHeight = value;
          break;
        case 'opacity':
          state.actionState.wallOpacity = value;
          break;
        case 'structureSpacing':
          state.actionState.wallStructureSpacing = value;
          break;
        case 'structureWidth':
          state.actionState.wallStructureWidth = value;
          break;
        case 'eavesLength':
          state.actionState.wallEavesLength = value;
          break;
      }
    });
  };

  const updateById = (id: string, val: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Wall && !e.locked) {
          ((e as WallModel)[attributeKey] as number) = val;
          break;
        }
      }
    });
    updateActionState(val);
  };

  const updateConnectedWalls = (val: number) => {
    const connectedWalls = Util.getAllConnectedWalls(wall);
    if (connectedWalls.length === 0) return;
    setCommonStore((state) => {
      for (const w of connectedWalls) {
        if (!w.locked) {
          for (const e of state.elements) {
            if (e.id === w.id && e.type === ObjectType.Wall) {
              ((e as WallModel)[attributeKey] as number) = val;
            }
          }
        }
      }
    });
    updateActionState(val);
  };

  const updateAboveFoundation = (fId: string, val: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.parentId === fId && e.type === ObjectType.Wall && !e.locked) {
          ((e as WallModel)[attributeKey] as number) = val;
        }
      }
    });
    updateActionState(val);
  };

  const updateForAll = (val: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && !e.locked) {
          ((e as WallModel)[attributeKey] as number) = val;
        }
      }
    });
    updateActionState(val);
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && !e.locked && map.has(e.id)) {
          ((e as WallModel)[attributeKey] as number) = value;
        }
      }
    });
    updateActionState(value);
  };

  const needChange = (value: number) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (
            e.type === ObjectType.Wall &&
            value !== (e as WallModel)[attributeKey] &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Wall && value !== (e as WallModel)[attributeKey] && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.Wall &&
            e.foundationId === wall.foundationId &&
            value !== (e as WallModel)[attributeKey] &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      case Scope.AllConnectedObjects:
        const connectedWalls = Util.getAllConnectedWalls(wall);
        for (const e of connectedWalls) {
          if (value !== e[attributeKey] && !e.locked) {
            return true;
          }
        }
        break;
      default:
        if (value !== wall[attributeKey]) {
          return true;
        }
        break;
    }
    return false;
  };

  const updateValue = (value: number) => {
    if (!wall) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, number>();
        for (const e of elements) {
          if (e.type === ObjectType.Wall && useStore.getState().selectedElementIdSet.has(e.id)) {
            oldValuesSelected.set(e.id, (e as WallModel)[attributeKey] as number);
          }
        }
        const undoableChangeSelected = {
          name: `Set ${dataType} for Selected Walls`,
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: value,
          undo: () => {
            for (const [id, wh] of undoableChangeSelected.oldValues.entries()) {
              updateById(id, wh as number);
            }
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, number>,
              undoableChangeSelected.newValue as number,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldValuesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldValuesAll = new Map<string, number>();
        for (const e of elements) {
          if (e.type === ObjectType.Wall) {
            oldValuesAll.set(e.id, (e as WallModel)[attributeKey] as number);
          }
        }
        const undoableChangeAll = {
          name: `Set ${dataType} for All Walls`,
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, wh] of undoableChangeAll.oldValues.entries()) {
              updateById(id, wh as number);
            }
          },
          redo: () => {
            updateForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (wall.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number>();
          for (const e of elements) {
            if (e.type === ObjectType.Wall && e.foundationId === wall.foundationId) {
              oldValuesAboveFoundation.set(e.id, (e as WallModel)[attributeKey] as number);
            }
          }
          const undoableChangeAboveFoundation = {
            name: `Set ${dataType} for All Walls Above Foundation`,
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: wall.foundationId,
            undo: () => {
              for (const [id, wh] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, wh as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(wall.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.AllConnectedObjects:
        if (wall) {
          const connectedWalls = Util.getAllConnectedWalls(wall);
          const oldValuesConnectedWalls = new Map<string, number>();
          for (const e of connectedWalls) {
            oldValuesConnectedWalls.set(e.id, e[attributeKey] as number);
          }
          const undoableChangeConnectedWalls = {
            name: `Set ${dataType} for All Connected Walls`,
            timestamp: Date.now(),
            oldValues: oldValuesConnectedWalls,
            newValue: value,
            undo: () => {
              for (const [id, wh] of undoableChangeConnectedWalls.oldValues.entries()) {
                updateById(id, wh as number);
              }
            },
            redo: () => {
              updateConnectedWalls(undoableChangeConnectedWalls.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeConnectedWalls);
          updateConnectedWalls(value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (wall) {
          const oldValue = wall[attributeKey] as number;
          const undoableChange = {
            name: `Set Wall ${dataType}`,
            timestamp: Date.now(),
            oldValue: oldValue,
            newValue: value,
            changedElementId: wall.id,
            changedElementType: wall.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(wall.id, value);
          setApplyCount(applyCount + 1);
        }
    }
  };

  const close = () => {
    inputRef.current = wall[attributeKey] as number;
    setDialogVisible();
  };

  const apply = () => {
    updateValue(inputRef.current);
  };

  return (
    <Dialog width={550} title={i18n.t(`wallMenu.${dataType}`, lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={range[0]}
            max={range[1]}
            style={{ width: 120 }}
            step={step}
            precision={2}
            defaultValue={wall[attributeKey] as number}
            onChange={(val) => (inputRef.current = val!)}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [{range.toString()}] {unit}
          </div>
        </Col>
        <Col className="gutter-row" span={1} style={{ verticalAlign: 'middle', paddingTop: '6px' }}>
          {unit ?? ' '}
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
        >
          <Radio.Group onChange={(e) => useStore.getState().setWallActionScope(e.target.value)} value={actionScope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('wallMenu.OnlyThisWall', lang)}</Radio>
              <Radio value={Scope.AllConnectedObjects}>{i18n.t('wallMenu.AllConnectedWalls', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('wallMenu.AllWallsAboveFoundation', lang)}
              </Radio>
              <Radio value={Scope.AllSelectedObjectsOfThisType}>{i18n.t('wallMenu.AllSelectedWalls', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('wallMenu.AllWalls', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default WallNumberInput;
