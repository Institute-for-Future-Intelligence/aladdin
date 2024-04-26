/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { FresnelReflectorModel } from '../../../../models/FresnelReflectorModel';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { ZERO_TOLERANCE } from '../../../../constants';
import { Util } from '../../../../Util';
import { useSelectedElement } from '../menuHooks';
import { useLanguage } from 'src/views/hooks';
import Dialog from '../../dialog';

// for Fresnel reflectors, since the default alignment is north-south, ly is always much larger than lx.
// to agree with the convention, we call ly length and lx width, reversed from most other elements in Aladdin.

const FresnelReflectorLengthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateLyById = useStore(Selector.updateElementLyById);
  const updateLyAboveFoundation = useStore(Selector.updateElementLyAboveFoundation);
  const updateLyForAll = useStore(Selector.updateElementLyForAll);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.fresnelReflectorActionScope);
  const setActionScope = useStore(Selector.setFresnelReflectorActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const fresnelReflector = useSelectedElement(ObjectType.FresnelReflector) as FresnelReflectorModel | undefined;

  const [inputValue, setInputValue] = useState(fresnelReflector?.ly ?? 9);
  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const withinParent = (reflector: FresnelReflectorModel, ly: number) => {
    const parent = getParent(reflector);
    if (parent) {
      const clone = JSON.parse(JSON.stringify(reflector)) as FresnelReflectorModel;
      clone.ly = ly;
      return Util.isSolarCollectorWithinHorizontalSurface(clone, parent);
    }
    return false;
  };

  const rejectChange = (reflector: FresnelReflectorModel, ly: number) => {
    // check if the new length will cause the Fresnel reflector to be out of the bound
    if (!withinParent(reflector, ly)) {
      return true;
    }
    // other check?
    return false;
  };

  const needChange = (ly: number) => {
    if (!fresnelReflector) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (
            e.type === ObjectType.FresnelReflector &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            const reflector = e as FresnelReflectorModel;
            if (Math.abs(reflector.ly - ly) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.FresnelReflector && !e.locked) {
            const reflector = e as FresnelReflectorModel;
            if (Math.abs(reflector.ly - ly) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.FresnelReflector &&
            e.foundationId === fresnelReflector?.foundationId &&
            !e.locked
          ) {
            const reflector = e as FresnelReflectorModel;
            if (Math.abs(reflector.ly - ly) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(fresnelReflector?.ly - ly) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.FresnelReflector && !e.locked && map.has(e.id)) {
          e.ly = value;
        }
      }
    });
  };

  const setLength = (value: number) => {
    if (!fresnelReflector) return;
    if (!needChange(value)) return;
    rejectedValue.current = undefined;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.FresnelReflector && useStore.getState().selectedElementIdSet.has(elem.id)) {
            if (rejectChange(elem as FresnelReflectorModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(fresnelReflector.ly);
        } else {
          const oldLengthsSelected = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.FresnelReflector && useStore.getState().selectedElementIdSet.has(elem.id)) {
              oldLengthsSelected.set(elem.id, elem.ly);
            }
          }
          const undoableChangeSelected = {
            name: 'Set Length for Selected Fresnel Reflectors',
            timestamp: Date.now(),
            oldValues: oldLengthsSelected,
            newValue: value,
            undo: () => {
              for (const [id, ly] of undoableChangeSelected.oldValues.entries()) {
                updateLyById(id, ly as number);
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
          updateInMap(oldLengthsSelected, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.FresnelReflector) {
            if (rejectChange(elem as FresnelReflectorModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(fresnelReflector.ly);
        } else {
          const oldLengthsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.FresnelReflector) {
              oldLengthsAll.set(elem.id, elem.ly);
            }
          }
          const undoableChangeAll = {
            name: 'Set Length for All Fresnel Reflectors',
            timestamp: Date.now(),
            oldValues: oldLengthsAll,
            newValue: value,
            undo: () => {
              for (const [id, ly] of undoableChangeAll.oldValues.entries()) {
                updateLyById(id, ly as number);
              }
            },
            redo: () => {
              updateLyForAll(ObjectType.FresnelReflector, undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateLyForAll(ObjectType.FresnelReflector, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (fresnelReflector.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (elem.type === ObjectType.FresnelReflector && elem.foundationId === fresnelReflector.foundationId) {
              if (rejectChange(elem as FresnelReflectorModel, value)) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputValue(fresnelReflector.ly);
          } else {
            const oldLengthsAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.FresnelReflector && elem.foundationId === fresnelReflector.foundationId) {
                oldLengthsAboveFoundation.set(elem.id, elem.ly);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Length for All Fresnel Reflectors Above Foundation',
              timestamp: Date.now(),
              oldValues: oldLengthsAboveFoundation,
              newValue: value,
              groupId: fresnelReflector.foundationId,
              undo: () => {
                for (const [id, ly] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateLyById(id, ly as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateLyAboveFoundation(
                    ObjectType.FresnelReflector,
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateLyAboveFoundation(ObjectType.FresnelReflector, fresnelReflector.foundationId, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      default:
        // selected element may be outdated, make sure that we get the latest
        const f = getElementById(fresnelReflector.id) as FresnelReflectorModel;
        const oldLength = f ? f.ly : fresnelReflector.ly;
        rejectRef.current = rejectChange(fresnelReflector, value);
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(oldLength);
        } else {
          const undoableChange = {
            name: 'Set Fresnel Reflector Length',
            timestamp: Date.now(),
            oldValue: oldLength,
            newValue: value,
            changedElementId: fresnelReflector.id,
            changedElementType: fresnelReflector.type,
            undo: () => {
              updateLyById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateLyById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateLyById(fresnelReflector.id, value);
          setApplyCount(applyCount + 1);
        }
    }
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
    setLength(inputValue);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  const modularize = (value: number) => {
    if (!fresnelReflector) return 1;
    let length = value ?? 1;
    const n = Math.max(1, Math.ceil((length - fresnelReflector.moduleLength / 2) / fresnelReflector.moduleLength));
    length = n * fresnelReflector.moduleLength;
    return length;
  };

  const apply = () => {
    setLength(inputValue);
  };

  if (fresnelReflector?.type !== ObjectType.FresnelReflector) return null;

  const rejectedMessage = rejectRef.current
    ? ': ' +
      i18n.t('message.NotApplicableToSelectedAction', lang) +
      (rejectedValue.current !== undefined ? ' (' + rejectedValue.current.toFixed(2) + ')' : '')
    : null;

  return (
    <Dialog
      width={600}
      title={i18n.t('word.Length', lang)}
      rejectedMessage={rejectedMessage}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row gutter={6}>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={fresnelReflector.moduleLength}
            max={200 * fresnelReflector.moduleLength}
            step={fresnelReflector.moduleLength}
            style={{ width: 120 }}
            precision={2}
            value={inputValue}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(modularize(value));
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('fresnelReflectorMenu.ModuleLength', lang) +
              ': ' +
              fresnelReflector.moduleLength.toFixed(1) +
              ' ' +
              i18n.t('word.MeterAbbreviation', lang)}
            <br />
            {Math.round(inputValue / fresnelReflector.moduleLength) +
              ' ' +
              i18n.t('fresnelReflectorMenu.ModulesLong', lang)}
            <br />
            {i18n.t('word.Maximum', lang)}: 200 {i18n.t('fresnelReflectorMenu.Modules', lang)}
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
                {i18n.t('fresnelReflectorMenu.OnlyThisFresnelReflector', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('fresnelReflectorMenu.AllFresnelReflectorsAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('fresnelReflectorMenu.AllSelectedFresnelReflectors', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('fresnelReflectorMenu.AllFresnelReflectors', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default FresnelReflectorLengthInput;
