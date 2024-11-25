/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ParabolicTroughModel } from '../../../../models/ParabolicTroughModel';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { ZERO_TOLERANCE } from '../../../../constants';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';

const ParabolicTroughThermalEfficiencyInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateById = useStore(Selector.updateParabolicCollectorThermalEfficiencyById);
  const updateAboveFoundation = useStore(Selector.updateParabolicCollectorThermalEfficiencyAboveFoundation);
  const updateForAll = useStore(Selector.updateParabolicCollectorThermalEfficiencyForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.parabolicTroughActionScope);
  const setActionScope = useStore(Selector.setParabolicTroughActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const parabolicTrough = useSelectedElement(ObjectType.ParabolicTrough) as ParabolicTroughModel | undefined;
  const [inputValue, setInputValue] = useState(parabolicTrough?.thermalEfficiency ?? 0.3);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (thermalEfficiency: number) => {
    if (!parabolicTrough) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (
            e.type === ObjectType.ParabolicTrough &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            const pt = e as ParabolicTroughModel;
            if (Math.abs(pt.thermalEfficiency - thermalEfficiency) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicTrough && !e.locked) {
            const pt = e as ParabolicTroughModel;
            if (Math.abs(pt.thermalEfficiency - thermalEfficiency) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicTrough && e.foundationId === parabolicTrough?.foundationId && !e.locked) {
            const pt = e as ParabolicTroughModel;
            if (Math.abs(pt.thermalEfficiency - thermalEfficiency) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(parabolicTrough?.thermalEfficiency - thermalEfficiency) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.ParabolicTrough && !e.locked && map.has(e.id)) {
          (e as ParabolicTroughModel).thermalEfficiency = value;
        }
      }
    });
  };

  const setThermalEfficiency = (value: number) => {
    if (!parabolicTrough) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldThermalEfficienciesSelected = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicTrough && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldThermalEfficienciesSelected.set(elem.id, (elem as ParabolicTroughModel).thermalEfficiency);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Thermal Efficiency for Selected Parabolic Troughs',
          timestamp: Date.now(),
          oldValues: oldThermalEfficienciesSelected,
          newValue: value,
          undo: () => {
            for (const [id, ab] of undoableChangeSelected.oldValues.entries()) {
              updateById(id, ab as number);
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
        updateInMap(oldThermalEfficienciesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldThermalEfficienciesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicTrough) {
            oldThermalEfficienciesAll.set(elem.id, (elem as ParabolicTroughModel).thermalEfficiency);
          }
        }
        const undoableChangeAll = {
          name: 'Set Thermal Efficiency for All Parabolic Troughs',
          timestamp: Date.now(),
          oldValues: oldThermalEfficienciesAll,
          newValue: value,
          undo: () => {
            for (const [id, ab] of undoableChangeAll.oldValues.entries()) {
              updateById(id, ab as number);
            }
          },
          redo: () => {
            updateForAll(ObjectType.ParabolicTrough, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(ObjectType.ParabolicTrough, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (parabolicTrough.foundationId) {
          const oldThermalEfficienciesAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicTrough && elem.foundationId === parabolicTrough.foundationId) {
              oldThermalEfficienciesAboveFoundation.set(elem.id, (elem as ParabolicTroughModel).thermalEfficiency);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Thermal Efficiency for All Parabolic Troughs Above Foundation',
            timestamp: Date.now(),
            oldValues: oldThermalEfficienciesAboveFoundation,
            newValue: value,
            groupId: parabolicTrough.foundationId,
            undo: () => {
              for (const [id, ab] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, ab as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  ObjectType.ParabolicTrough,
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(ObjectType.ParabolicTrough, parabolicTrough.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      default: {
        const p = getElementById(parabolicTrough.id) as ParabolicTroughModel;
        const oldThermalEfficiency = p ? p.thermalEfficiency : parabolicTrough.thermalEfficiency;
        const undoableChange = {
          name: 'Set Parabolic Trough Thermal Efficiency',
          timestamp: Date.now(),
          oldValue: oldThermalEfficiency,
          newValue: value,
          changedElementId: parabolicTrough.id,
          changedElementType: parabolicTrough.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(parabolicTrough.id, value);
        setApplyCount(applyCount + 1);
        break;
      }
    }
    setCommonStore((state) => {
      state.actionState.parabolicTroughThermalEfficiency = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setThermalEfficiency(inputValue);
  };

  if (parabolicTrough?.type !== ObjectType.ParabolicTrough) return null;

  return (
    <Dialog
      width={600}
      title={i18n.t('concentratedSolarPowerCollectorMenu.ReceiverThermalEfficiency', lang)}
      onApply={apply}
      onClose={close}
    >
      <Row gutter={6}>
        <Col span={7}>
          <InputNumber
            min={0}
            max={1}
            style={{ width: 120 }}
            precision={2}
            step={0.01}
            value={inputValue}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0, 1]
          </div>
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('parabolicTroughMenu.OnlyThisParabolicTrough', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('parabolicTroughMenu.AllParabolicTroughsAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('parabolicTroughMenu.AllSelectedParabolicTroughs', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('parabolicTroughMenu.AllParabolicTroughs', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default ParabolicTroughThermalEfficiencyInput;
