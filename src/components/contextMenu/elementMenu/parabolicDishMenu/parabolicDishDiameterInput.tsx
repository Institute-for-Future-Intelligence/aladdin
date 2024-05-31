/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ParabolicDishModel } from '../../../../models/ParabolicDishModel';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { ZERO_TOLERANCE } from '../../../../constants';
import { Util } from '../../../../Util';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';

const ParabolicDishDiameterInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateLxById = useStore(Selector.updateElementLxById);
  const updateLyById = useStore(Selector.updateElementLyById);
  const updateLxAboveFoundation = useStore(Selector.updateElementLxAboveFoundation);
  const updateLyAboveFoundation = useStore(Selector.updateElementLyAboveFoundation);
  const updateLxForAll = useStore(Selector.updateElementLxForAll);
  const updateLyForAll = useStore(Selector.updateElementLyForAll);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.parabolicDishActionScope);
  const setActionScope = useStore(Selector.setParabolicDishActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const parabolicDish = useSelectedElement(ObjectType.ParabolicDish) as ParabolicDishModel | undefined;

  const [inputValue, setInputValue] = useState(parabolicDish?.lx ?? 2);

  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const withinParent = (dish: ParabolicDishModel, lx: number) => {
    const parent = getParent(dish);
    if (parent) {
      const clone = JSON.parse(JSON.stringify(dish)) as ParabolicDishModel;
      clone.lx = lx;
      return Util.isSolarCollectorWithinHorizontalSurface(clone, parent);
    }
    return false;
  };

  const rejectChange = (dish: ParabolicDishModel, lx: number) => {
    // check if the new diameter will cause the parabolic dish to be out of the bound
    if (!withinParent(dish, lx)) {
      return true;
    }
    // other check?
    return false;
  };

  const needChange = (lx: number) => {
    if (!parabolicDish) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const dish = e as ParabolicDishModel;
            if (Math.abs(dish.lx - lx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && !e.locked) {
            const dish = e as ParabolicDishModel;
            if (Math.abs(dish.lx - lx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && e.foundationId === parabolicDish?.foundationId && !e.locked) {
            const dish = e as ParabolicDishModel;
            if (Math.abs(dish.lx - lx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(parabolicDish?.lx - lx) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.ParabolicDish && !e.locked && map.has(e.id)) {
          (e as ParabolicDishModel).lx = value;
          (e as ParabolicDishModel).ly = value;
        }
      }
    });
  };

  const setDiameter = (value: number) => {
    if (!parabolicDish) return;
    if (!needChange(value)) return;
    rejectedValue.current = undefined;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicDish && useStore.getState().selectedElementIdSet.has(elem.id)) {
            if (rejectChange(elem as ParabolicDishModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(parabolicDish.lx);
        } else {
          const oldDiametersSelected = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicDish && useStore.getState().selectedElementIdSet.has(elem.id)) {
              oldDiametersSelected.set(elem.id, elem.lx);
            }
          }
          const undoableChangeSelected = {
            name: 'Set Diameter for Selected Parabolic Dishes',
            timestamp: Date.now(),
            oldValues: oldDiametersSelected,
            newValue: value,
            undo: () => {
              for (const [id, di] of undoableChangeSelected.oldValues.entries()) {
                // both lx and ly can represent the diameter
                updateLxById(id, di as number);
                updateLyById(id, di as number);
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
          updateInMap(oldDiametersSelected, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicDish) {
            if (rejectChange(elem as ParabolicDishModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(parabolicDish.lx);
        } else {
          const oldDiametersAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicDish) {
              oldDiametersAll.set(elem.id, elem.lx);
            }
          }
          const undoableChangeAll = {
            name: 'Set Diameter for All Parabolic Dishes',
            timestamp: Date.now(),
            oldValues: oldDiametersAll,
            newValue: value,
            undo: () => {
              for (const [id, di] of undoableChangeAll.oldValues.entries()) {
                // both lx and ly can represent the diameter
                updateLxById(id, di as number);
                updateLyById(id, di as number);
              }
            },
            redo: () => {
              updateLxForAll(ObjectType.ParabolicDish, undoableChangeAll.newValue as number);
              updateLyForAll(ObjectType.ParabolicDish, undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateLxForAll(ObjectType.ParabolicDish, value);
          updateLyForAll(ObjectType.ParabolicDish, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (parabolicDish.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicDish && elem.foundationId === parabolicDish.foundationId) {
              if (rejectChange(elem as ParabolicDishModel, value)) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputValue(parabolicDish.lx);
          } else {
            const oldDiametersAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.ParabolicDish && elem.foundationId === parabolicDish.foundationId) {
                oldDiametersAboveFoundation.set(elem.id, elem.lx);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Diameter for All Parabolic Dishes Above Foundation',
              timestamp: Date.now(),
              oldValues: oldDiametersAboveFoundation,
              newValue: value,
              groupId: parabolicDish.foundationId,
              undo: () => {
                for (const [id, di] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateLxById(id, di as number);
                  updateLyById(id, di as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateLxAboveFoundation(
                    ObjectType.ParabolicDish,
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                  updateLyAboveFoundation(
                    ObjectType.ParabolicDish,
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateLxAboveFoundation(ObjectType.ParabolicDish, parabolicDish.foundationId, value);
            updateLyAboveFoundation(ObjectType.ParabolicDish, parabolicDish.foundationId, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      }
      default: {
        const p = getElementById(parabolicDish.id) as ParabolicDishModel;
        const oldDiameter = p ? p.lx : parabolicDish.lx;
        rejectRef.current = rejectChange(parabolicDish, value);
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(oldDiameter);
        } else {
          const undoableChange = {
            name: 'Set Parabolic Dish Diameter',
            timestamp: Date.now(),
            oldValue: oldDiameter,
            newValue: value,
            changedElementId: parabolicDish.id,
            changedElementType: parabolicDish.type,
            undo: () => {
              updateLxById(undoableChange.changedElementId, undoableChange.oldValue as number);
              updateLyById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateLxById(undoableChange.changedElementId, undoableChange.newValue as number);
              updateLyById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateLxById(parabolicDish.id, value);
          updateLyById(parabolicDish.id, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
    }
    setCommonStore((state) => {
      state.actionState.parabolicDishRimDiameter = value;
    });
  };

  const close = () => {
    rejectRef.current = false;
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setDiameter(inputValue);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  const apply = () => {
    setDiameter(inputValue);
  };

  if (parabolicDish?.type !== ObjectType.ParabolicDish) return null;

  const rejectedMessage = rejectRef.current
    ? ': ' +
      i18n.t('message.NotApplicableToSelectedAction', lang) +
      (rejectedValue.current !== undefined ? ' (' + rejectedValue.current.toFixed(2) + ')' : '')
    : null;

  // for some reason, we have to confirm the type first. otherwise, other popup menus may invoke this
  return (
    <Dialog
      width={600}
      title={i18n.t('parabolicDishMenu.RimDiameter', lang)}
      rejectedMessage={rejectedMessage}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row gutter={6}>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={1}
            max={10}
            step={0.5}
            precision={2}
            style={{ width: 120 }}
            value={inputValue}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.MinimumValue', lang)}: 1 {i18n.t('word.MeterAbbreviation', lang)}
            <br />
            {i18n.t('word.MaximumValue', lang)}: 10 {i18n.t('word.MeterAbbreviation', lang)}
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

export default ParabolicDishDiameterInput;
