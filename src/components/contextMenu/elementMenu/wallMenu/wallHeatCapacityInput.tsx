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
import { WallModel } from '../../../../models/WallModel';
import { Util } from '../../../../Util';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';

const WallHeatCapacityInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.wallActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);

  const wall = useSelectedElement(ObjectType.Wall) as WallModel | undefined;

  const [inputValue, setInputValue] = useState<number>(wall?.volumetricHeatCapacity ?? 0.5);

  const lang = useLanguage();

  const updateById = (id: string, value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          (e as WallModel).volumetricHeatCapacity = value;
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
    if (!wall) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (
            e.type === ObjectType.Wall &&
            value !== (e as WallModel).volumetricHeatCapacity &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Wall && value !== (e as WallModel).volumetricHeatCapacity && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.Wall &&
            e.foundationId === wall.foundationId &&
            value !== (e as WallModel).volumetricHeatCapacity &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      case Scope.AllConnectedObjects:
        const connectedWalls = Util.getAllConnectedWalls(wall);
        for (const e of connectedWalls) {
          if (value !== e.volumetricHeatCapacity && !e.locked) {
            return true;
          }
        }
        break;
      default:
        if (value !== wall?.volumetricHeatCapacity) {
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
        const oldValuesSelected = new Map<string, number | undefined>();
        for (const e of elements) {
          if (e.type === ObjectType.Wall && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const w = e as WallModel;
            oldValuesSelected.set(e.id, w.volumetricHeatCapacity ?? 0.5);
            updateById(w.id, value);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Volumetric Heat Capacity for Selected Walls',
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
        for (const e of elements) {
          if (e.type === ObjectType.Wall && !e.locked) {
            const w = e as WallModel;
            oldValuesAll.set(e.id, w.volumetricHeatCapacity ?? 0.5);
            updateById(w.id, value);
          }
        }
        const undoableChangeAll = {
          name: 'Set Volumetric Heat Capacity for All Walls',
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
        if (wall?.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number | undefined>();
          for (const e of elements) {
            if (e.type === ObjectType.Wall && e.foundationId === wall.foundationId && !e.locked) {
              const w = e as WallModel;
              oldValuesAboveFoundation.set(e.id, w.volumetricHeatCapacity ?? 0.5);
              updateById(w.id, value);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Volumetric Heat Capacity for All Walls Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: wall.foundationId,
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
      case Scope.AllConnectedObjects:
        if (wall) {
          const connectedWalls = Util.getAllConnectedWalls(wall);
          const oldValuesConnectedWalls = new Map<string, number | undefined>();
          for (const e of connectedWalls) {
            if (!e.locked) {
              const w = e as WallModel;
              oldValuesConnectedWalls.set(e.id, w.volumetricHeatCapacity ?? 0.5);
              updateById(w.id, value);
            }
          }
          const undoableChangeConnectedWalls = {
            name: 'Set Volumetric Heat Capacity for All Connected Walls',
            timestamp: Date.now(),
            oldValues: oldValuesConnectedWalls,
            newValue: value,
            undo: () => {
              undoInMap(undoableChangeConnectedWalls.oldValues as Map<string, number>);
            },
            redo: () => {
              updateInMap(
                undoableChangeConnectedWalls.oldValues as Map<string, number>,
                undoableChangeConnectedWalls.newValue as number,
              );
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeConnectedWalls);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (wall) {
          const updatedWall = getElementById(wall.id) as WallModel;
          const oldValue = updatedWall.volumetricHeatCapacity ?? wall.volumetricHeatCapacity ?? 0.5;
          const undoableChange = {
            name: 'Set Volumetric Heat Capacity of Wall',
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
    setCommonStore((state) => {
      state.actionState.wallVolumetricHeatCapacity = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    updateValue(inputValue);
  };

  return (
    <Dialog width={550} title={i18n.t('word.VolumetricHeatCapacity', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={7}>
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
            }}
          />
          <div style={{ paddingTop: '4px', textAlign: 'left', fontSize: '11px' }}>
            kWh/(m³·℃)
            <br />
            <br />
            {i18n.t('word.Range', lang)}: [0.01, 100]
          </div>
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
        >
          <Radio.Group onChange={(e) => useStore.getState().setWallActionScope(e.target.value)} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('wallMenu.OnlyThisWall', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllConnectedObjects}>
                {i18n.t('wallMenu.AllConnectedWalls', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('wallMenu.AllWallsAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('wallMenu.AllSelectedWalls', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('wallMenu.AllWalls', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default WallHeatCapacityInput;
