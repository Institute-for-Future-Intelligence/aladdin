/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
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
import { useSelectedElement } from '../menuHooks';
import { useLanguage } from 'src/views/hooks';
import Dialog from '../../dialog';

const ParabolicDishPoleHeightInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updatePoleHeightById = useStore(Selector.updateSolarCollectorPoleHeightById);
  const updatePoleHeightAboveFoundation = useStore(Selector.updateSolarCollectorPoleHeightAboveFoundation);
  const updatePoleHeightForAll = useStore(Selector.updateSolarCollectorPoleHeightForAll);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.parabolicDishActionScope);
  const setActionScope = useStore(Selector.setParabolicDishActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const parabolicDish = useSelectedElement(ObjectType.ParabolicDish) as ParabolicDishModel | undefined;

  const [inputValue, setInputValue] = useState(parabolicDish?.poleHeight ?? 1);

  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (poleHeight: number) => {
    if (!parabolicDish) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const pt = e as ParabolicDishModel;
            if (Math.abs(pt.poleHeight - poleHeight) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && !e.locked) {
            const pt = e as ParabolicDishModel;
            if (Math.abs(pt.poleHeight - poleHeight) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && e.foundationId === parabolicDish?.foundationId && !e.locked) {
            const pt = e as ParabolicDishModel;
            if (Math.abs(pt.poleHeight - poleHeight) > ZERO_TOLERANCE) {
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
              if (Math.abs(pt.poleHeight - poleHeight) > ZERO_TOLERANCE) {
                return true;
              }
            }
          }
        }
        break;
      default:
        if (Math.abs(parabolicDish?.poleHeight - poleHeight) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.ParabolicDish && !e.locked && map.has(e.id)) {
          (e as ParabolicDishModel).tiltAngle = value;
        }
      }
    });
  };

  const setPoleHeight = (value: number) => {
    if (!parabolicDish) return;
    if (!needChange(value)) return;
    rejectedValue.current = undefined;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicDish && useStore.getState().selectedElementIdSet.has(elem.id)) {
            if (0.5 * elem.ly * Math.abs(Math.sin((elem as ParabolicDishModel).tiltAngle)) > value) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(parabolicDish.poleHeight);
        } else {
          const oldPoleHeightsSelected = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicDish && useStore.getState().selectedElementIdSet.has(elem.id)) {
              oldPoleHeightsSelected.set(elem.id, (elem as ParabolicDishModel).poleHeight);
            }
          }
          const undoableChangeSelected = {
            name: 'Set Pole Height for Selected Parabolic Dishes',
            timestamp: Date.now(),
            oldValues: oldPoleHeightsSelected,
            newValue: value,
            undo: () => {
              for (const [id, ph] of undoableChangeSelected.oldValues.entries()) {
                updatePoleHeightById(id, ph as number);
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
          updateInMap(oldPoleHeightsSelected, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicDish) {
            if (0.5 * elem.ly * Math.abs(Math.sin((elem as ParabolicDishModel).tiltAngle)) > value) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(parabolicDish.poleHeight);
        } else {
          const oldPoleHeightsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicDish) {
              oldPoleHeightsAll.set(elem.id, (elem as ParabolicDishModel).poleHeight);
            }
          }
          const undoableChangeAll = {
            name: 'Set Pole Height for All Parabolic Dishes',
            timestamp: Date.now(),
            oldValues: oldPoleHeightsAll,
            newValue: value,
            undo: () => {
              for (const [id, ph] of undoableChangeAll.oldValues.entries()) {
                updatePoleHeightById(id, ph as number);
              }
            },
            redo: () => {
              updatePoleHeightForAll(ObjectType.ParabolicDish, undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updatePoleHeightForAll(ObjectType.ParabolicDish, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (parabolicDish.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicDish && elem.foundationId === parabolicDish.foundationId) {
              if (0.5 * elem.ly * Math.abs(Math.sin((elem as ParabolicDishModel).tiltAngle)) > value) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputValue(parabolicDish.poleHeight);
          } else {
            const oldPoleHeightsAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.ParabolicDish && elem.foundationId === parabolicDish.foundationId) {
                oldPoleHeightsAboveFoundation.set(elem.id, (elem as ParabolicDishModel).poleHeight);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Pole Height for All Parabolic Dishes Above Foundation',
              timestamp: Date.now(),
              oldValues: oldPoleHeightsAboveFoundation,
              newValue: value,
              groupId: parabolicDish.foundationId,
              undo: () => {
                for (const [id, ph] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updatePoleHeightById(id, ph as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updatePoleHeightAboveFoundation(
                    ObjectType.ParabolicDish,
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updatePoleHeightAboveFoundation(ObjectType.ParabolicDish, parabolicDish.foundationId, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      default:
        const p = getElementById(parabolicDish.id) as ParabolicDishModel;
        const oldPoleHeight = p ? p.poleHeight : parabolicDish.poleHeight;
        rejectRef.current = 0.5 * parabolicDish.lx * Math.abs(Math.sin(parabolicDish.tiltAngle)) > value;
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(oldPoleHeight);
        } else {
          const undoableChange = {
            name: 'Set Parabolic Dish Pole Height',
            timestamp: Date.now(),
            oldValue: oldPoleHeight,
            newValue: value,
            changedElementId: parabolicDish.id,
            changedElementType: parabolicDish.type,
            undo: () => {
              updatePoleHeightById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updatePoleHeightById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updatePoleHeightById(parabolicDish.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.parabolicDishPoleHeight = value;
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
    setPoleHeight(inputValue);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  const apply = () => {
    setPoleHeight(inputValue);
  };

  if (parabolicDish?.type !== ObjectType.ParabolicDish) return null;

  const rejectedMessage = rejectRef.current
    ? ': ' +
      i18n.t('message.NotApplicableToSelectedAction', lang) +
      (rejectedValue.current !== undefined ? ' (' + rejectedValue.current.toFixed(2) + ')' : '')
    : null;

  return (
    <Dialog
      width={600}
      title={i18n.t('parabolicDishMenu.ExtraPoleHeightInAdditionToRadius', lang)}
      rejectedMessage={rejectedMessage}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={0}
            max={5}
            style={{ width: 120 }}
            step={0.1}
            precision={2}
            value={inputValue}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0, 5] {i18n.t('word.MeterAbbreviation', lang)}
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

export default ParabolicDishPoleHeightInput;
