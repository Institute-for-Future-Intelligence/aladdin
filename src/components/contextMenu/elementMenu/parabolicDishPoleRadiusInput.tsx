/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ParabolicDishModel } from '../../../models/ParabolicDishModel';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { ZERO_TOLERANCE } from '../../../constants';
import { useSelectedElement } from './menuHooks';
import { useLanguage } from 'src/views/hooks';
import Dialog from '../dialog';

const ParabolicDishPoleRadiusInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updatePoleRadiusById = useStore(Selector.updateSolarCollectorPoleRadiusById);
  const updatePoleRadiusAboveFoundation = useStore(Selector.updateSolarCollectorPoleRadiusAboveFoundation);
  const updatePoleRadiusForAll = useStore(Selector.updateSolarCollectorPoleRadiusForAll);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.parabolicDishActionScope);
  const setActionScope = useStore(Selector.setParabolicDishActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const parabolicDish = useSelectedElement(ObjectType.ParabolicDish) as ParabolicDishModel | undefined;

  const [inputValue, setInputValue] = useState(parabolicDish?.poleRadius ?? 0.1);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (poleRadius: number) => {
    if (!parabolicDish) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const pt = e as ParabolicDishModel;
            if (Math.abs(pt.poleRadius - poleRadius) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && !e.locked) {
            const pt = e as ParabolicDishModel;
            if (Math.abs(pt.poleRadius - poleRadius) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && e.foundationId === parabolicDish?.foundationId && !e.locked) {
            const pt = e as ParabolicDishModel;
            if (Math.abs(pt.poleRadius - poleRadius) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        const parent = getParent(parabolicDish);
        if (parent) {
          for (const e of elements) {
            if (e.type === ObjectType.ParabolicDish && e.parentId === parabolicDish.parentId && !e.locked) {
              const pt = e as ParabolicDishModel;
              if (Math.abs(pt.poleRadius - poleRadius) > ZERO_TOLERANCE) {
                return true;
              }
            }
          }
        }
        break;
      default:
        if (Math.abs(parabolicDish?.poleRadius - poleRadius) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.ParabolicDish && !e.locked && map.has(e.id)) {
          (e as ParabolicDishModel).poleRadius = value;
        }
      }
    });
  };

  const setPoleRadius = (value: number) => {
    if (!parabolicDish) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicDish && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldValuesSelected.set(elem.id, (elem as ParabolicDishModel).poleRadius);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Pole Radius for Selected Parabolic Dishes',
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: value,
          undo: () => {
            for (const [id, ph] of undoableChangeSelected.oldValues.entries()) {
              updatePoleRadiusById(id, ph as number);
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
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicDish) {
            oldValuesAll.set(elem.id, (elem as ParabolicDishModel).poleRadius);
          }
        }
        const undoableChangeAll = {
          name: 'Set Pole Radius for All Parabolic Dishes',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, ph] of undoableChangeAll.oldValues.entries()) {
              updatePoleRadiusById(id, ph as number);
            }
          },
          redo: () => {
            updatePoleRadiusForAll(ObjectType.ParabolicDish, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updatePoleRadiusForAll(ObjectType.ParabolicDish, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (parabolicDish.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicDish && elem.foundationId === parabolicDish.foundationId) {
              oldValuesAboveFoundation.set(elem.id, (elem as ParabolicDishModel).poleRadius);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Pole Radius for All Parabolic Dishes Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: parabolicDish.foundationId,
            undo: () => {
              for (const [id, ph] of undoableChangeAboveFoundation.oldValues.entries()) {
                updatePoleRadiusById(id, ph as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updatePoleRadiusAboveFoundation(
                  ObjectType.ParabolicDish,
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updatePoleRadiusAboveFoundation(ObjectType.ParabolicDish, parabolicDish.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        const p = getElementById(parabolicDish.id) as ParabolicDishModel;
        const oldValue = p ? p.poleRadius : parabolicDish.poleRadius;
        const undoableChange = {
          name: 'Set Parabolic Dish Pole Radius',
          timestamp: Date.now(),
          oldValue: oldValue,
          newValue: value,
          changedElementId: parabolicDish.id,
          changedElementType: parabolicDish.type,
          undo: () => {
            updatePoleRadiusById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updatePoleRadiusById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updatePoleRadiusById(parabolicDish.id, value);
        setApplyCount(applyCount + 1);
    }
    setCommonStore((state) => {
      state.actionState.parabolicDishPoleRadius = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setPoleRadius(inputValue);
  };

  if (parabolicDish?.type !== ObjectType.ParabolicDish) return null;

  return (
    <Dialog width={600} title={i18n.t('solarCollectorMenu.PoleRadius', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={0.1}
            max={0.5}
            style={{ width: 120 }}
            step={0.01}
            precision={2}
            value={inputValue}
            onChange={setInputValue}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0.1, 0.5] {i18n.t('word.MeterAbbreviation', lang)}
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
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('parabolicDishMenu.OnlyThisParabolicDish', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('parabolicDishMenu.AllParabolicDishesAboveFoundation', lang)}
              </Radio>
              <Radio value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('parabolicDishMenu.AllSelectedParabolicDishes', lang)}
              </Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('parabolicDishMenu.AllParabolicDishes', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default ParabolicDishPoleRadiusInput;
