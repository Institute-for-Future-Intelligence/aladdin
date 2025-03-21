/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ParabolicDishModel } from '../../../../models/ParabolicDishModel';
import { ObjectType, ParabolicDishStructureType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';

const ParabolicDishStructureTypeInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.parabolicDishActionScope);
  const setActionScope = useStore(Selector.setParabolicDishActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const parabolicDish = useSelectedElement(ObjectType.ParabolicDish) as ParabolicDishModel | undefined;

  const [inputStructureType, setInputStructureType] = useState<number>(
    parabolicDish?.structureType ?? ParabolicDishStructureType.CentralPole,
  );

  const lang = useLanguage();
  const { Option } = Select;

  const updateById = (id: string, structureType: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.id === id && !e.locked) {
          if (e.type === ObjectType.ParabolicDish) {
            (e as ParabolicDishModel).structureType = structureType;
            break;
          }
        }
      }
    });
  };

  const updateAboveFoundation = (foundationId: string, structureType: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.foundationId === foundationId && !e.locked) {
          if (e.type === ObjectType.ParabolicDish) {
            (e as ParabolicDishModel).structureType = structureType;
          }
        }
      }
    });
  };

  const updateForAll = (structureType: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (!e.locked) {
          if (e.type === ObjectType.ParabolicDish) {
            (e as ParabolicDishModel).structureType = structureType;
          }
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (structureType: ParabolicDishStructureType) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const pd = e as ParabolicDishModel;
            if (pd.structureType !== structureType) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && !e.locked) {
            const pd = e as ParabolicDishModel;
            if (pd.structureType !== structureType) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && e.foundationId === parabolicDish?.foundationId && !e.locked) {
            const pd = e as ParabolicDishModel;
            if (pd.structureType !== structureType) {
              return true;
            }
          }
        }
        break;
      default:
        if (parabolicDish?.structureType !== structureType) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.ParabolicDish && !e.locked && map.has(e.id)) {
          (e as ParabolicDishModel).structureType = value;
        }
      }
    });
  };

  const setStructureType = (type: ParabolicDishStructureType) => {
    if (!parabolicDish) return;
    if (!needChange(type)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldStructureTypesSelected = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicDish && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldStructureTypesSelected.set(elem.id, (elem as ParabolicDishModel).structureType);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Structure Type for Selected Parabolic Dishes',
          timestamp: Date.now(),
          oldValues: oldStructureTypesSelected,
          newValue: type,
          undo: () => {
            for (const [id, st] of undoableChangeSelected.oldValues.entries()) {
              updateById(id, st as ParabolicDishStructureType);
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
        updateInMap(oldStructureTypesSelected, type);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldStructureTypesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicDish) {
            oldStructureTypesAll.set(elem.id, (elem as ParabolicDishModel).structureType);
          }
        }
        const undoableChangeAll = {
          name: 'Set Structure Type for All Parabolic Dishes',
          timestamp: Date.now(),
          oldValues: oldStructureTypesAll,
          newValue: type,
          undo: () => {
            for (const [id, st] of undoableChangeAll.oldValues.entries()) {
              updateById(id, st as ParabolicDishStructureType);
            }
          },
          redo: () => {
            updateForAll(undoableChangeAll.newValue as ParabolicDishStructureType);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(type);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (parabolicDish.foundationId) {
          const oldStructureTypesAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicDish && elem.foundationId === parabolicDish.foundationId) {
              oldStructureTypesAboveFoundation.set(elem.id, (elem as ParabolicDishModel).structureType);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Structure Type for All Parabolic Dishes Above Foundation',
            timestamp: Date.now(),
            oldValues: oldStructureTypesAboveFoundation,
            newValue: type,
            groupId: parabolicDish.foundationId,
            undo: () => {
              for (const [id, st] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, st as ParabolicDishStructureType);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as ParabolicDishStructureType,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(parabolicDish.foundationId, type);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      default: {
        const p = getElementById(parabolicDish.id) as ParabolicDishModel;
        const oldStructureType = p ? p.structureType : parabolicDish.structureType;
        const undoableChange = {
          name: 'Set Parabolic Dish Structure Type',
          timestamp: Date.now(),
          oldValue: oldStructureType,
          newValue: type,
          changedElementId: parabolicDish.id,
          changedElementType: parabolicDish.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as ParabolicDishStructureType);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as ParabolicDishStructureType);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(parabolicDish.id, type);
        setApplyCount(applyCount + 1);
        break;
      }
    }
    setCommonStore((state) => {
      state.actionState.parabolicDishReceiverStructure = type;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setStructureType(inputStructureType);
  };

  if (parabolicDish?.type !== ObjectType.ParabolicDish) return null;

  return (
    <Dialog width={640} title={i18n.t('parabolicDishMenu.ReceiverStructure', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={8}>
          <Select value={inputStructureType} onChange={(value) => setInputStructureType(value)}>
            <Option key={ParabolicDishStructureType.CentralPole} value={ParabolicDishStructureType.CentralPole}>
              {i18n.t('parabolicDishMenu.CentralPole', lang)}
            </Option>
            <Option
              key={ParabolicDishStructureType.CentralPoleWithTripod}
              value={ParabolicDishStructureType.CentralPoleWithTripod}
            >
              {i18n.t('parabolicDishMenu.CentralPoleWithTripod', lang)}
            </Option>
            <Option key={ParabolicDishStructureType.Quadrupod} value={ParabolicDishStructureType.Quadrupod}>
              {i18n.t('parabolicDishMenu.Quadrupod', lang)}
            </Option>
          </Select>
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={16}
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

export default ParabolicDishStructureTypeInput;
