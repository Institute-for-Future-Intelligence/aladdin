/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Row, InputNumber, Radio, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { RoofModel } from 'src/models/RoofModel';
import { useSelectedElement } from '../menuHooks';
import { useLanguage } from 'src/views/hooks';
import Dialog from '../../dialog';

const RoofRiseInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.roofActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const getElementById = useStore(Selector.getElementById);

  const roof = useSelectedElement(ObjectType.Roof) as RoofModel | undefined;

  const [inputValue, setInputValue] = useState<number>(roof?.rise ?? 0);

  const lang = useLanguage();

  const updateRoofRiseById = (id: string, val: number) => {
    useStore.getState().updateRoofRiseById(id, val);
    useStore.getState().set((state) => {
      state.updateElementOnRoofFlag = true;
    });
  };

  const undoInMap = (map: Map<string, number>) => {
    for (const [id, val] of map.entries()) {
      updateRoofRiseById(id, val);
    }
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    for (const id of map.keys()) {
      updateRoofRiseById(id, value);
    }
  };

  const needChange = (value: number) => {
    if (!roof) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (
            e.type === ObjectType.Roof &&
            value !== (e as RoofModel).rise &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Roof && value !== (e as RoofModel).rise && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.Roof &&
            e.foundationId === roof.foundationId &&
            value !== (e as RoofModel).rise &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      default:
        if (value !== roof?.rise) {
          return true;
        }
        break;
    }
    return false;
  };

  const setRise = (value: number) => {
    if (!roof) return;
    if (!needChange(value)) return;
    switch (useStore.getState().roofActionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, number>();
        for (const e of elements) {
          if (e.type === ObjectType.Roof && !e.locked) {
            oldValuesSelected.set(e.id, (e as RoofModel).rise);
            updateRoofRiseById(e.id, value);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Rise for Selected Roofs',
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
        const oldValuesAll = new Map<string, number>();
        for (const e of elements) {
          if (e.type === ObjectType.Roof && !e.locked) {
            oldValuesAll.set(e.id, (e as RoofModel).rise);
            updateRoofRiseById(e.id, value);
          }
        }
        const undoableChangeAll = {
          name: 'Set Rise for All Roofs',
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
        if (roof.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number>();
          for (const e of elements) {
            if (e.type === ObjectType.Roof && e.foundationId === roof.foundationId && !e.locked) {
              oldValuesAboveFoundation.set(e.id, (e as RoofModel).rise);
              updateRoofRiseById(e.id, value);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Rise for All Roofs Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: roof.foundationId,
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
      default:
        if (roof) {
          const updatedRoof = getElementById(roof.id) as RoofModel;
          const oldRise = updatedRoof?.rise ?? roof?.rise ?? 0;
          const undoableChange = {
            name: 'Set Roof Rise',
            timestamp: Date.now(),
            oldValue: oldRise,
            newValue: value,
            changedElementId: roof.id,
            changedElementType: roof.type,
            undo: () => {
              updateRoofRiseById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateRoofRiseById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateRoofRiseById(roof.id, value);
          setApplyCount(applyCount + 1);
        }
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setRise(inputValue);
  };

  return (
    <Dialog width={550} title={i18n.t('roofMenu.Rise', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={0}
            max={200}
            style={{ width: 120 }}
            step={0.1}
            precision={2}
            value={inputValue}
            formatter={(a) => Number(a).toFixed(2)}
            onChange={(value) => setInputValue(value!)}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0, 200] {i18n.t('word.MeterAbbreviation', lang)}
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
          <Radio.Group onChange={(e) => useStore.getState().setRoofActionScope(e.target.value)} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('roofMenu.OnlyThisRoof', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('roofMenu.AllRoofsAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('roofMenu.AllSelectedRoofs', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('roofMenu.AllRoofs', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default RoofRiseInput;
