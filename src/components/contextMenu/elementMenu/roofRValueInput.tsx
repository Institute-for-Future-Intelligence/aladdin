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
import { RoofModel } from '../../../models/RoofModel';
import { Util } from '../../../Util';
import { DEFAULT_ROOF_R_VALUE } from '../../../constants';
import { useSelectedElement } from './menuHooks';
import { useLanguage } from 'src/views/hooks';
import Dialog from '../dialog';

const RoofRValueInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.roofActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);

  const roof = useSelectedElement(ObjectType.Roof) as RoofModel | undefined;

  const [inputValue, setInputValue] = useState<number>(roof?.rValue ?? DEFAULT_ROOF_R_VALUE);
  const [inputValueUS, setInputValueUS] = useState<number>(Util.toRValueInUS(inputValue));

  const lang = useLanguage();

  const updateById = (id: string, value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          (e as RoofModel).rValue = value;
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
    if (!roof) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (
            e.type === ObjectType.Roof &&
            value !== (e as RoofModel).rValue &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Roof && value !== (e as RoofModel).rValue && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.Roof &&
            e.foundationId === roof.foundationId &&
            value !== (e as RoofModel).rValue &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      default:
        if (value !== roof?.rValue) {
          return true;
        }
        break;
    }
    return false;
  };

  const setValue = (value: number) => {
    if (!roof) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, number | undefined>();
        for (const e of elements) {
          if (e.type === ObjectType.Roof && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const roof = e as RoofModel;
            oldValuesSelected.set(e.id, roof.rValue ?? DEFAULT_ROOF_R_VALUE);
            updateById(roof.id, value);
          }
        }
        const undoableChangeSelected = {
          name: 'Set R-Value for Selected Roofs',
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
          if (e.type === ObjectType.Roof && !e.locked) {
            const roof = e as RoofModel;
            oldValuesAll.set(e.id, roof.rValue ?? DEFAULT_ROOF_R_VALUE);
            updateById(roof.id, value);
          }
        }
        const undoableChangeAll = {
          name: 'Set R-Value for All Roofs',
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
          const oldValuesAboveFoundation = new Map<string, number | undefined>();
          for (const e of elements) {
            if (e.type === ObjectType.Roof && e.foundationId === roof.foundationId && !e.locked) {
              const roof = e as RoofModel;
              oldValuesAboveFoundation.set(e.id, roof.rValue ?? DEFAULT_ROOF_R_VALUE);
              updateById(roof.id, value);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set R-Value for All Roofs Above Foundation',
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
          const oldValue = updatedRoof.rValue ?? roof.rValue ?? DEFAULT_ROOF_R_VALUE;
          const undoableChange = {
            name: 'Set Roof R-Value',
            timestamp: Date.now(),
            oldValue: oldValue,
            newValue: value,
            changedElementId: roof.id,
            changedElementType: roof.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(roof.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.roofRValue = value;
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
      title={`${i18n.t('roofMenu.RoofRValue', lang) + ' '}(${i18n.t('word.ThermalResistance', lang)})`}
      onApply={apply}
      onClose={close}
    >
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
              setInputValue(value);
              setInputValueUS(Util.toRValueInUS(value));
            }}
          />
          <div style={{ paddingTop: '4px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0.01, 100]
            <br />
            {i18n.t('word.SIUnit', lang)}: m²·℃/W
          </div>
          <br />
          <InputNumber
            min={Util.toRValueInUS(0.01)}
            max={Util.toRValueInUS(100)}
            style={{ width: 120 }}
            step={0.01}
            precision={2}
            value={inputValueUS}
            formatter={(a) => Number(a).toFixed(2)}
            onChange={(value) => {
              setInputValueUS(value);
              setInputValue(Util.toRValueInSI(value));
            }}
          />
          <div style={{ paddingTop: '4px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [{Util.toRValueInUS(0.01).toFixed(3)}, {Util.toRValueInUS(100).toFixed(1)}]
            <br />
            {i18n.t('word.USUnit', lang)}: h·ft²·℉/Btu
          </div>
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
        >
          <Radio.Group onChange={(e) => useStore.getState().setRoofActionScope(e.target.value)} value={actionScope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('roofMenu.OnlyThisRoof', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('roofMenu.AllRoofsAboveFoundation', lang)}
              </Radio>
              <Radio value={Scope.AllSelectedObjectsOfThisType}>{i18n.t('roofMenu.AllSelectedRoofs', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('roofMenu.AllRoofs', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default RoofRValueInput;
