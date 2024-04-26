/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
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
import { useLanguage } from 'src/views/hooks';

const ParabolicTroughReflectanceInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateById = useStore(Selector.updateCspReflectanceById);
  const updateAboveFoundation = useStore(Selector.updateCspReflectanceAboveFoundation);
  const updateForAll = useStore(Selector.updateCspReflectanceForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.parabolicTroughActionScope);
  const setActionScope = useStore(Selector.setParabolicTroughActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const parabolicTrough = useSelectedElement(ObjectType.ParabolicTrough) as ParabolicTroughModel | undefined;

  const [inputValue, setInputValue] = useState(parabolicTrough?.reflectance ?? 0.9);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (reflectance: number) => {
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
            if (Math.abs(pt.reflectance - reflectance) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicTrough && !e.locked) {
            const pt = e as ParabolicTroughModel;
            if (Math.abs(pt.reflectance - reflectance) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicTrough && e.foundationId === parabolicTrough?.foundationId && !e.locked) {
            const pt = e as ParabolicTroughModel;
            if (Math.abs(pt.reflectance - reflectance) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(parabolicTrough?.reflectance - reflectance) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.ParabolicTrough && !e.locked && map.has(e.id)) {
          (e as ParabolicTroughModel).reflectance = value;
        }
      }
    });
  };

  const setReflectance = (value: number) => {
    if (!parabolicTrough) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldReflectancesSelected = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicTrough && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldReflectancesSelected.set(elem.id, (elem as ParabolicTroughModel).reflectance);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Reflectance for Selected Parabolic Troughs',
          timestamp: Date.now(),
          oldValues: oldReflectancesSelected,
          newValue: value,
          undo: () => {
            for (const [id, rf] of undoableChangeSelected.oldValues.entries()) {
              updateById(id, rf as number);
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
        updateInMap(oldReflectancesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldReflectancesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicTrough) {
            oldReflectancesAll.set(elem.id, (elem as ParabolicTroughModel).reflectance);
          }
        }
        const undoableChangeAll = {
          name: 'Set Reflectance for All Parabolic Troughs',
          timestamp: Date.now(),
          oldValues: oldReflectancesAll,
          newValue: value,
          undo: () => {
            for (const [id, rf] of undoableChangeAll.oldValues.entries()) {
              updateById(id, rf as number);
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
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (parabolicTrough.foundationId) {
          const oldReflectancesAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicTrough && elem.foundationId === parabolicTrough.foundationId) {
              oldReflectancesAboveFoundation.set(elem.id, (elem as ParabolicTroughModel).reflectance);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Reflectance for All Parabolic Troughs Above Foundation',
            timestamp: Date.now(),
            oldValues: oldReflectancesAboveFoundation,
            newValue: value,
            groupId: parabolicTrough.foundationId,
            undo: () => {
              for (const [id, rf] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, rf as number);
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
      default:
        const p = getElementById(parabolicTrough.id) as ParabolicTroughModel;
        const oldReflectance = p ? p.reflectance : parabolicTrough.reflectance;
        const undoableChange = {
          name: 'Set Parabolic Trough Reflectance',
          timestamp: Date.now(),
          oldValue: oldReflectance,
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
    }
    setCommonStore((state) => {
      state.actionState.parabolicTroughReflectance = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setReflectance(inputValue);
  };

  if (parabolicTrough?.type !== ObjectType.ParabolicTrough) return null;

  return (
    <Dialog
      width={600}
      title={i18n.t('concentratedSolarPowerCollectorMenu.ReflectorReflectance', lang)}
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

export default ParabolicTroughReflectanceInput;
