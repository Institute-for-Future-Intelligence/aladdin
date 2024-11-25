/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
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
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';

const FresnelReflectorPoleHeightInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updatePoleHeightById = useStore(Selector.updateSolarCollectorPoleHeightById);
  const updatePoleHeightAboveFoundation = useStore(Selector.updateSolarCollectorPoleHeightAboveFoundation);
  const updatePoleHeightForAll = useStore(Selector.updateSolarCollectorPoleHeightForAll);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.fresnelReflectorActionScope);
  const setActionScope = useStore(Selector.setFresnelReflectorActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const fresnelReflector = useSelectedElement(ObjectType.FresnelReflector) as FresnelReflectorModel | undefined;

  const [inputValue, setInputValue] = useState(fresnelReflector?.poleHeight ?? 1);

  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();
  const inputPoleHeightRef = useRef<number>(fresnelReflector?.poleHeight ?? 1);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (poleHeight: number) => {
    if (!fresnelReflector) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of elements) {
          if (
            e.type === ObjectType.FresnelReflector &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            const fr = e as FresnelReflectorModel;
            if (Math.abs(fr.poleHeight - poleHeight) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.FresnelReflector && !e.locked) {
            const fr = e as FresnelReflectorModel;
            if (Math.abs(fr.poleHeight - poleHeight) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        for (const e of elements) {
          if (
            e.type === ObjectType.FresnelReflector &&
            e.foundationId === fresnelReflector?.foundationId &&
            !e.locked
          ) {
            const fr = e as FresnelReflectorModel;
            if (Math.abs(fr.poleHeight - poleHeight) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        const parent = getParent(fresnelReflector);
        if (parent) {
          for (const e of elements) {
            if (e.type === ObjectType.FresnelReflector && e.parentId === fresnelReflector.parentId && !e.locked) {
              const fr = e as FresnelReflectorModel;
              if (Math.abs(fr.poleHeight - poleHeight) > ZERO_TOLERANCE) {
                return true;
              }
            }
          }
        }
        break;
      }
      default: {
        if (Math.abs(fresnelReflector?.poleHeight - poleHeight) > ZERO_TOLERANCE) {
          return true;
        }
        break;
      }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.FresnelReflector && !e.locked && map.has(e.id)) {
          (e as FresnelReflectorModel).poleHeight = value;
        }
      }
    });
  };

  const setPoleHeight = (value: number) => {
    if (!fresnelReflector) return;
    if (!needChange(value)) return;
    rejectedValue.current = undefined;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.FresnelReflector && useStore.getState().selectedElementIdSet.has(elem.id)) {
            if (0.5 * elem.ly * Math.abs(Math.sin((elem as FresnelReflectorModel).tiltAngle)) > value) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          inputPoleHeightRef.current = fresnelReflector.poleHeight;
        } else {
          const oldPoleHeightsSelected = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.FresnelReflector && useStore.getState().selectedElementIdSet.has(elem.id)) {
              oldPoleHeightsSelected.set(elem.id, (elem as FresnelReflectorModel).poleHeight);
            }
          }
          const undoableChangeSelected = {
            name: 'Set Pole Height for Selected Fresnel Reflectors',
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
          if (elem.type === ObjectType.FresnelReflector) {
            if (0.5 * elem.ly * Math.abs(Math.sin((elem as FresnelReflectorModel).tiltAngle)) > value) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          inputPoleHeightRef.current = fresnelReflector.poleHeight;
        } else {
          const oldPoleHeightsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.FresnelReflector) {
              oldPoleHeightsAll.set(elem.id, (elem as FresnelReflectorModel).poleHeight);
            }
          }
          const undoableChangeAll = {
            name: 'Set Pole Height for All Fresnel Reflectors',
            timestamp: Date.now(),
            oldValues: oldPoleHeightsAll,
            newValue: value,
            undo: () => {
              for (const [id, ph] of undoableChangeAll.oldValues.entries()) {
                updatePoleHeightById(id, ph as number);
              }
            },
            redo: () => {
              updatePoleHeightForAll(ObjectType.FresnelReflector, undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updatePoleHeightForAll(ObjectType.FresnelReflector, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (fresnelReflector.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (elem.type === ObjectType.FresnelReflector && elem.foundationId === fresnelReflector.foundationId) {
              if (0.5 * elem.ly * Math.abs(Math.sin((elem as FresnelReflectorModel).tiltAngle)) > value) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            inputPoleHeightRef.current = fresnelReflector.poleHeight;
          } else {
            const oldPoleHeightsAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.FresnelReflector && elem.foundationId === fresnelReflector.foundationId) {
                oldPoleHeightsAboveFoundation.set(elem.id, (elem as FresnelReflectorModel).poleHeight);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Pole Height for All Fresnel Reflectors Above Foundation',
              timestamp: Date.now(),
              oldValues: oldPoleHeightsAboveFoundation,
              newValue: value,
              groupId: fresnelReflector.foundationId,
              undo: () => {
                for (const [id, ph] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updatePoleHeightById(id, ph as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updatePoleHeightAboveFoundation(
                    ObjectType.FresnelReflector,
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updatePoleHeightAboveFoundation(ObjectType.FresnelReflector, fresnelReflector.foundationId, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      }
      default: {
        // selected element may be outdated, make sure that we get the latest
        const f = getElementById(fresnelReflector.id) as FresnelReflectorModel;
        const oldPoleHeight = f ? f.poleHeight : fresnelReflector.poleHeight;
        rejectRef.current = 0.5 * fresnelReflector.lx * Math.abs(Math.sin(fresnelReflector.tiltAngle)) > value;
        if (rejectRef.current) {
          rejectedValue.current = value;
          inputPoleHeightRef.current = oldPoleHeight;
        } else {
          const undoableChange = {
            name: 'Set Fresnel Reflector Pole Height',
            timestamp: Date.now(),
            oldValue: oldPoleHeight,
            newValue: value,
            changedElementId: fresnelReflector.id,
            changedElementType: fresnelReflector.type,
            undo: () => {
              updatePoleHeightById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updatePoleHeightById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updatePoleHeightById(fresnelReflector.id, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
    }
    setCommonStore((state) => {
      state.actionState.fresnelReflectorPoleHeight = value;
    });
  };

  const close = () => {
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

  if (fresnelReflector?.type !== ObjectType.FresnelReflector) return null;

  const rejectedMessage = rejectRef.current
    ? ': ' +
      i18n.t('message.NotApplicableToSelectedAction', lang) +
      (rejectedValue.current !== undefined ? ' (' + rejectedValue.current.toFixed(2) + ')' : '')
    : null;

  return (
    <Dialog
      width={600}
      title={i18n.t('solarCollectorMenu.ExtraPoleHeightInAdditionToHalfWidth', lang)}
      rejectedMessage={rejectedMessage}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row gutter={6}>
        <Col span={6}>
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

export default FresnelReflectorPoleHeightInput;
