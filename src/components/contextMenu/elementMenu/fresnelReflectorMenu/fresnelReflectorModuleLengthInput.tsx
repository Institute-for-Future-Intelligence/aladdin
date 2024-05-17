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
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';

const FresnelReflectorModuleLengthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateModuleLengthById = useStore(Selector.updateModuleLengthById);
  const updateModuleLengthAboveFoundation = useStore(Selector.updateModuleLengthAboveFoundation);
  const updateModuleLengthForAll = useStore(Selector.updateModuleLengthForAll);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.fresnelReflectorActionScope);
  const setActionScope = useStore(Selector.setFresnelReflectorActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const fresnelReflector = useSelectedElement(ObjectType.FresnelReflector) as FresnelReflectorModel | undefined;

  const [inputValue, setInputValue] = useState(fresnelReflector?.moduleLength ?? 3);
  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const withinParent = (reflector: FresnelReflectorModel, moduleLength: number) => {
    const parent = getParent(reflector);
    if (parent) {
      const clone = JSON.parse(JSON.stringify(reflector)) as FresnelReflectorModel;
      clone.moduleLength = moduleLength;
      return Util.isSolarCollectorWithinHorizontalSurface(clone, parent);
    }
    return false;
  };

  const rejectChange = (reflector: FresnelReflectorModel, moduleLength: number) => {
    // check if the new module length will cause the Fresnel reflector to be out of the bound
    if (!withinParent(reflector, moduleLength)) {
      return true;
    }
    // other check?
    return false;
  };

  const needChange = (moduleLength: number) => {
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
            if (Math.abs(reflector.moduleLength - moduleLength) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.FresnelReflector && !e.locked) {
            const reflector = e as FresnelReflectorModel;
            if (Math.abs(reflector.moduleLength - moduleLength) > ZERO_TOLERANCE) {
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
            if (Math.abs(reflector.moduleLength - moduleLength) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(fresnelReflector?.moduleLength - moduleLength) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.FresnelReflector && !e.locked && map.has(e.id)) {
          (e as FresnelReflectorModel).moduleLength = value;
        }
      }
    });
  };

  const setModuleLength = (value: number) => {
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
          setInputValue(fresnelReflector.moduleLength);
        } else {
          const oldModuleLengthsSelected = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.FresnelReflector && useStore.getState().selectedElementIdSet.has(elem.id)) {
              oldModuleLengthsSelected.set(elem.id, (elem as FresnelReflectorModel).moduleLength);
            }
          }
          const undoableChangeSelected = {
            name: 'Set Module Length for Selected Fresnel Reflectors',
            timestamp: Date.now(),
            oldValues: oldModuleLengthsSelected,
            newValue: value,
            undo: () => {
              for (const [id, ml] of undoableChangeSelected.oldValues.entries()) {
                updateModuleLengthById(id, ml as number);
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
          updateInMap(oldModuleLengthsSelected, value);
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
          setInputValue(fresnelReflector.moduleLength);
        } else {
          const oldModuleLengthsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.FresnelReflector) {
              oldModuleLengthsAll.set(elem.id, (elem as FresnelReflectorModel).moduleLength);
            }
          }
          const undoableChangeAll = {
            name: 'Set Module Length for All Fresnel Reflectors',
            timestamp: Date.now(),
            oldValues: oldModuleLengthsAll,
            newValue: value,
            undo: () => {
              for (const [id, ml] of undoableChangeAll.oldValues.entries()) {
                updateModuleLengthById(id, ml as number);
              }
            },
            redo: () => {
              updateModuleLengthForAll(ObjectType.FresnelReflector, undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateModuleLengthForAll(ObjectType.FresnelReflector, value);
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
            setInputValue(fresnelReflector.moduleLength);
          } else {
            const oldModuleLengthsAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.FresnelReflector && elem.foundationId === fresnelReflector.foundationId) {
                oldModuleLengthsAboveFoundation.set(elem.id, (elem as FresnelReflectorModel).moduleLength);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Module Length for All Fresnel Reflectors Above Foundation',
              timestamp: Date.now(),
              oldValues: oldModuleLengthsAboveFoundation,
              newValue: value,
              groupId: fresnelReflector.foundationId,
              undo: () => {
                for (const [id, ml] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateModuleLengthById(id, ml as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateModuleLengthAboveFoundation(
                    ObjectType.FresnelReflector,
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateModuleLengthAboveFoundation(ObjectType.FresnelReflector, fresnelReflector.foundationId, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      default:
        // selected element may be outdated, make sure that we get the latest
        const f = getElementById(fresnelReflector.id) as FresnelReflectorModel;
        const oldModuleLength = f ? f.moduleLength : fresnelReflector.moduleLength;
        rejectRef.current = rejectChange(fresnelReflector, value);
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(oldModuleLength);
        } else {
          const undoableChange = {
            name: 'Set Fresnel Reflector Module Length',
            timestamp: Date.now(),
            oldValue: oldModuleLength,
            newValue: value,
            changedElementId: fresnelReflector.id,
            changedElementType: fresnelReflector.type,
            undo: () => {
              updateModuleLengthById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateModuleLengthById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateModuleLengthById(fresnelReflector.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.fresnelReflectorModuleLength = value;
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
    setModuleLength(inputValue);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  const apply = () => {
    setModuleLength(inputValue);
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
      title={i18n.t('fresnelReflectorMenu.ModuleLength', lang)}
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
            max={20}
            step={0.5}
            style={{ width: 120 }}
            precision={2}
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

export default FresnelReflectorModuleLengthInput;
