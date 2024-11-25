/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ParabolicTroughModel } from '../../../../models/ParabolicTroughModel';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { ZERO_TOLERANCE } from '../../../../constants';
import { Util } from '../../../../Util';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';

const ParabolicTroughLatusRectumInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateLatusRectumById = useStore(Selector.updateParabolaLatusRectumById);
  const updateLatusRectumAboveFoundation = useStore(Selector.updateParabolaLatusRectumAboveFoundation);
  const updateLatusRectumForAll = useStore(Selector.updateParabolaLatusRectumForAll);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.parabolicTroughActionScope);
  const setActionScope = useStore(Selector.setParabolicTroughActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const parabolicTrough = useSelectedElement(ObjectType.ParabolicTrough) as ParabolicTroughModel | undefined;

  const [inputValue, setInputValue] = useState(parabolicTrough?.latusRectum ?? 2);
  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const withinParent = (trough: ParabolicTroughModel, latusRectum: number) => {
    const parent = getParent(trough);
    if (parent) {
      const clone = JSON.parse(JSON.stringify(trough)) as ParabolicTroughModel;
      clone.latusRectum = latusRectum;
      return Util.isSolarCollectorWithinHorizontalSurface(clone, parent);
    }
    return false;
  };

  const rejectChange = (trough: ParabolicTroughModel, latusRectum: number) => {
    // check if the new latus rectum will cause the parabolic trough to be out of the bound
    if (!withinParent(trough, latusRectum)) {
      return true;
    }
    // other check?
    return false;
  };

  const needChange = (latusRectum: number) => {
    if (!parabolicTrough) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (
            e.type === ObjectType.ParabolicTrough &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            const trough = e as ParabolicTroughModel;
            if (Math.abs(trough.latusRectum - latusRectum) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicTrough && !e.locked) {
            const trough = e as ParabolicTroughModel;
            if (Math.abs(trough.latusRectum - latusRectum) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicTrough && e.foundationId === parabolicTrough?.foundationId && !e.locked) {
            const trough = e as ParabolicTroughModel;
            if (Math.abs(trough.latusRectum - latusRectum) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(parabolicTrough?.latusRectum - latusRectum) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.ParabolicTrough && !e.locked && map.has(e.id)) {
          (e as ParabolicTroughModel).latusRectum = value;
        }
      }
    });
  };

  const setLatusRectum = (value: number) => {
    if (!parabolicTrough) return;
    if (!needChange(value)) return;
    rejectedValue.current = undefined;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicTrough && useStore.getState().selectedElementIdSet.has(elem.id)) {
            if (rejectChange(elem as ParabolicTroughModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(parabolicTrough.latusRectum);
        } else {
          const oldLatusRectumsSelected = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicTrough && useStore.getState().selectedElementIdSet.has(elem.id)) {
              oldLatusRectumsSelected.set(elem.id, (elem as ParabolicTroughModel).latusRectum);
            }
          }
          const undoableChangeSelected = {
            name: 'Set Latus Rectum for Selected Parabolic Troughs',
            timestamp: Date.now(),
            oldValues: oldLatusRectumsSelected,
            newValue: value,
            undo: () => {
              for (const [id, lr] of undoableChangeSelected.oldValues.entries()) {
                updateLatusRectumById(id, lr as number);
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
          updateInMap(oldLatusRectumsSelected, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicTrough) {
            if (rejectChange(elem as ParabolicTroughModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(parabolicTrough.latusRectum);
        } else {
          const oldLatusRectumsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicTrough) {
              oldLatusRectumsAll.set(elem.id, (elem as ParabolicTroughModel).latusRectum);
            }
          }
          const undoableChangeAll = {
            name: 'Set Latus Rectum for All Parabolic Troughs',
            timestamp: Date.now(),
            oldValues: oldLatusRectumsAll,
            newValue: value,
            undo: () => {
              for (const [id, lr] of undoableChangeAll.oldValues.entries()) {
                updateLatusRectumById(id, lr as number);
              }
            },
            redo: () => {
              updateLatusRectumForAll(ObjectType.ParabolicTrough, undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateLatusRectumForAll(ObjectType.ParabolicTrough, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (parabolicTrough.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicTrough && elem.foundationId === parabolicTrough.foundationId) {
              if (rejectChange(elem as ParabolicTroughModel, value)) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputValue(parabolicTrough.latusRectum);
          } else {
            const oldLatusRectumsAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.ParabolicTrough && elem.foundationId === parabolicTrough.foundationId) {
                oldLatusRectumsAboveFoundation.set(elem.id, (elem as ParabolicTroughModel).latusRectum);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Latus Rectum for All Parabolic Troughs Above Foundation',
              timestamp: Date.now(),
              oldValues: oldLatusRectumsAboveFoundation,
              newValue: value,
              groupId: parabolicTrough.foundationId,
              undo: () => {
                for (const [id, lr] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateLatusRectumById(id, lr as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateLatusRectumAboveFoundation(
                    ObjectType.ParabolicTrough,
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateLatusRectumAboveFoundation(ObjectType.ParabolicTrough, parabolicTrough.foundationId, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      }
      default: {
        const p = getElementById(parabolicTrough.id) as ParabolicTroughModel;
        const oldLatusRectum = p ? p.latusRectum : parabolicTrough.latusRectum;
        rejectRef.current = rejectChange(parabolicTrough, value);
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(oldLatusRectum);
        } else {
          const undoableChange = {
            name: 'Set Parabolic Trough Latus Rectum',
            timestamp: Date.now(),
            oldValue: oldLatusRectum,
            newValue: value,
            changedElementId: parabolicTrough.id,
            changedElementType: parabolicTrough.type,
            undo: () => {
              updateLatusRectumById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateLatusRectumById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateLatusRectumById(parabolicTrough.id, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
    }
    setCommonStore((state) => {
      state.actionState.parabolicTroughLatusRectum = value;
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
    setLatusRectum(inputValue);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  const apply = () => {
    setLatusRectum(inputValue);
  };

  if (parabolicTrough?.type !== ObjectType.ParabolicTrough) return null;

  const rejectedMessage = rejectRef.current
    ? ': ' +
      i18n.t('message.NotApplicableToSelectedAction', lang) +
      (rejectedValue.current !== undefined ? ' (' + rejectedValue.current.toFixed(2) + ')' : '')
    : null;

  return (
    <Dialog
      width={600}
      title={i18n.t('parabolicTroughMenu.LatusRectum', lang)}
      rejectedMessage={rejectedMessage}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row gutter={6}>
        <Col span={6}>
          <InputNumber
            min={1}
            max={20}
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
            {i18n.t('word.MaximumValue', lang)}: 20 {i18n.t('word.MeterAbbreviation', lang)}
          </div>
        </Col>
        <Col span={1} style={{ verticalAlign: 'middle', paddingTop: '6px' }}>
          {i18n.t('word.MeterAbbreviation', lang)}
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

export default ParabolicTroughLatusRectumInput;
