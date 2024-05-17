/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ParabolicDishModel } from '../../../../models/ParabolicDishModel';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { ZERO_TOLERANCE } from '../../../../constants';
import { useSelectedElement } from '../menuHooks';
import { useLanguage } from 'src/hooks';
import Dialog from '../../dialog';

const ParabolicDishOpticalEfficiencyInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateById = useStore(Selector.updateParabolicCollectorOpticalEfficiencyById);
  const updateAboveFoundation = useStore(Selector.updateParabolicCollectorOpticalEfficiencyAboveFoundation);
  const updateForAll = useStore(Selector.updateParabolicCollectorOpticalEfficiencyForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.parabolicDishActionScope);
  const setActionScope = useStore(Selector.setParabolicDishActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const parabolicDish = useSelectedElement(ObjectType.ParabolicDish) as ParabolicDishModel | undefined;

  const [inputValue, setInputValue] = useState(parabolicDish?.opticalEfficiency ?? 0.7);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (opticalEfficiency: number) => {
    if (!parabolicDish) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const pt = e as ParabolicDishModel;
            if (Math.abs(pt.opticalEfficiency - opticalEfficiency) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && !e.locked) {
            const pt = e as ParabolicDishModel;
            if (Math.abs(pt.opticalEfficiency - opticalEfficiency) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && e.foundationId === parabolicDish?.foundationId && !e.locked) {
            const pt = e as ParabolicDishModel;
            if (Math.abs(pt.opticalEfficiency - opticalEfficiency) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(parabolicDish?.opticalEfficiency - opticalEfficiency) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.ParabolicDish && !e.locked && map.has(e.id)) {
          (e as ParabolicDishModel).opticalEfficiency = value;
        }
      }
    });
  };

  const setOpticalEfficiency = (value: number) => {
    if (!parabolicDish) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldOpticalEfficienciesSelected = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicDish && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldOpticalEfficienciesSelected.set(elem.id, (elem as ParabolicDishModel).opticalEfficiency);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Optical Efficiency for Selected Parabolic Dishes',
          timestamp: Date.now(),
          oldValues: oldOpticalEfficienciesSelected,
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
        updateInMap(oldOpticalEfficienciesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldOpticalEfficienciesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicDish) {
            oldOpticalEfficienciesAll.set(elem.id, (elem as ParabolicDishModel).opticalEfficiency);
          }
        }
        const undoableChangeAll = {
          name: 'Set Optical Efficiency for All Parabolic Dishes',
          timestamp: Date.now(),
          oldValues: oldOpticalEfficienciesAll,
          newValue: value,
          undo: () => {
            for (const [id, ab] of undoableChangeAll.oldValues.entries()) {
              updateById(id, ab as number);
            }
          },
          redo: () => {
            updateForAll(ObjectType.ParabolicDish, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(ObjectType.ParabolicDish, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (parabolicDish.foundationId) {
          const oldOpticalEfficienciesAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicDish && elem.foundationId === parabolicDish.foundationId) {
              oldOpticalEfficienciesAboveFoundation.set(elem.id, (elem as ParabolicDishModel).opticalEfficiency);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Optical Efficiency for All Parabolic Dishes Above Foundation',
            timestamp: Date.now(),
            oldValues: oldOpticalEfficienciesAboveFoundation,
            newValue: value,
            groupId: parabolicDish.foundationId,
            undo: () => {
              for (const [id, ab] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, ab as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  ObjectType.ParabolicDish,
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(ObjectType.ParabolicDish, parabolicDish.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        const p = getElementById(parabolicDish.id) as ParabolicDishModel;
        const oldOpticalEfficiency = p ? p.opticalEfficiency : parabolicDish.opticalEfficiency;
        const undoableChange = {
          name: 'Set Parabolic Dish Optical Efficiency',
          timestamp: Date.now(),
          oldValue: oldOpticalEfficiency,
          newValue: value,
          changedElementId: parabolicDish.id,
          changedElementType: parabolicDish.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(parabolicDish.id, value);
        setApplyCount(applyCount + 1);
    }
    setCommonStore((state) => {
      state.actionState.parabolicDishOpticalEfficiency = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setOpticalEfficiency(inputValue);
    setDialogVisible(false);
    setApplyCount(0);
  };

  if (parabolicDish?.type !== ObjectType.ParabolicDish) return null;

  return (
    <Dialog
      width={600}
      title={i18n.t('concentratedSolarPowerCollectorMenu.ReflectorOpticalEfficiency', lang)}
      onApply={apply}
      onClose={close}
    >
      <Row gutter={6}>
        <Col className="gutter-row" span={7}>
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
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('parabolicDishMenu.OnlyThisParabolicDish', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('parabolicDishMenu.AllParabolicDishesAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('parabolicDishMenu.AllSelectedParabolicDishes', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('parabolicDishMenu.AllParabolicDishes', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default ParabolicDishOpticalEfficiencyInput;
