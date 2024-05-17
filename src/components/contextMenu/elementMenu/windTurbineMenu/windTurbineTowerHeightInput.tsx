/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { ZERO_TOLERANCE } from '../../../../constants';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';
import { WindTurbineModel } from '../../../../models/WindTurbineModel';

const WindTurbineTowerHeightInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.windTurbineActionScope);
  const setActionScope = useStore(Selector.setWindTurbineActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const windTurbine = useSelectedElement(ObjectType.WindTurbine) as WindTurbineModel | undefined;
  const [inputValue, setInputValue] = useState(windTurbine?.towerHeight ?? 0);

  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (towerHeight: number) => {
    if (!windTurbine) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const wt = e as WindTurbineModel;
            if (Math.abs(wt.towerHeight - towerHeight) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && e.foundationId === windTurbine?.foundationId && !e.locked) {
            const wt = e as WindTurbineModel;
            if (Math.abs(wt.towerHeight - towerHeight) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const wt = e as WindTurbineModel;
            if (Math.abs(wt.towerHeight - towerHeight) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(windTurbine?.towerHeight - towerHeight) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateTowerHeightById = (id: string, h: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && e.id === id && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.towerHeight = h;
          wt.lz = h + wt.bladeRadius;
          break;
        }
      }
    });
  };

  const updateTowerHeightAboveFoundation = (foundationId: string, h: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && e.foundationId === foundationId && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.towerHeight = h;
          wt.lz = h + wt.bladeRadius;
        }
      }
    });
  };

  const updateTowerHeightForAll = (h: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.towerHeight = h;
          wt.lz = h + wt.bladeRadius;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && !e.locked && map.has(e.id)) {
          const wt = e as WindTurbineModel;
          wt.towerHeight = value;
          wt.lz = value + wt.bladeRadius;
        }
      }
    });
  };

  const setTowerHeight = (value: number) => {
    if (!windTurbine) return;
    if (!needChange(value)) return;
    rejectedValue.current = undefined;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.WindTurbine && useStore.getState().selectedElementIdSet.has(elem.id)) {
            const wt = elem as WindTurbineModel;
            if (wt.bladeRadius > value) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(windTurbine.towerHeight);
        } else {
          const oldHeightsSelected = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.WindTurbine && useStore.getState().selectedElementIdSet.has(elem.id)) {
              oldHeightsSelected.set(elem.id, (elem as WindTurbineModel).towerHeight);
            }
          }
          const undoableChangeSelected = {
            name: 'Set Tower Height for Selected Wind Turbines',
            timestamp: Date.now(),
            oldValues: oldHeightsSelected,
            newValue: value,
            undo: () => {
              for (const [id, th] of undoableChangeSelected.oldValues.entries()) {
                updateTowerHeightById(id, th as number);
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
          updateInMap(oldHeightsSelected, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.WindTurbine) {
            const wt = elem as WindTurbineModel;
            if (wt.bladeRadius > value) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(windTurbine.towerHeight);
        } else {
          const oldHeightsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.WindTurbine) {
              oldHeightsAll.set(elem.id, (elem as WindTurbineModel).towerHeight);
            }
          }
          const undoableChangeAll = {
            name: 'Set Tower Height for All Wind Turbines',
            timestamp: Date.now(),
            oldValues: oldHeightsAll,
            newValue: value,
            undo: () => {
              for (const [id, th] of undoableChangeAll.oldValues.entries()) {
                updateTowerHeightById(id, th as number);
              }
            },
            redo: () => {
              updateTowerHeightForAll(undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateTowerHeightForAll(value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (windTurbine.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (elem.type === ObjectType.WindTurbine && elem.foundationId === windTurbine.foundationId) {
              const wt = elem as WindTurbineModel;
              if (wt.bladeRadius > value) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputValue(windTurbine.towerHeight);
          } else {
            const oldHeightsAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.WindTurbine && elem.foundationId === windTurbine.foundationId) {
                oldHeightsAboveFoundation.set(elem.id, (elem as WindTurbineModel).towerHeight);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Tower Height for All Wind Turbines Above Foundation',
              timestamp: Date.now(),
              oldValues: oldHeightsAboveFoundation,
              newValue: value,
              groupId: windTurbine.foundationId,
              undo: () => {
                for (const [id, th] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateTowerHeightById(id, th as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateTowerHeightAboveFoundation(
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateTowerHeightAboveFoundation(windTurbine.foundationId, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      default:
        // selected element may be outdated, make sure that we get the latest
        const wt = getElementById(windTurbine.id) as WindTurbineModel;
        const oldHeight = wt ? wt.towerHeight : windTurbine.towerHeight;
        rejectRef.current = windTurbine.bladeRadius > value;
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputValue(oldHeight);
        } else {
          const undoableChange = {
            name: 'Set Wind Turbine Tower Height',
            timestamp: Date.now(),
            oldValue: oldHeight,
            newValue: value,
            changedElementId: windTurbine.id,
            changedElementType: windTurbine.type,
            undo: () => {
              updateTowerHeightById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateTowerHeightById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateTowerHeightById(windTurbine.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.windTurbineTowerHeight = value;
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
    setTowerHeight(inputValue);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  const apply = () => {
    setTowerHeight(inputValue);
  };

  const rejectedMessage = rejectRef.current
    ? ': ' +
      i18n.t('message.NotApplicableToSelectedAction', lang) +
      (rejectedValue.current !== undefined ? ' (' + rejectedValue.current.toFixed(2) + ')' : '')
    : null;

  return (
    <Dialog
      width={550}
      title={i18n.t('windTurbineMenu.TowerHeight', lang)}
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
            max={100}
            style={{ width: 120 }}
            step={0.1}
            precision={1}
            // formatter={(value) => `${value} ` + i18n.t('word.MeterAbbreviation', lang)}
            // parser={value => Number(value?.replace(i18n.t('word.MeterAbbreviation', lang), ''))}
            value={inputValue}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [1, 100] {i18n.t('word.MeterAbbreviation', lang)}
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
                {i18n.t('windTurbineMenu.OnlyThisWindTurbine', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('windTurbineMenu.AllWindTurbinesAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('windTurbineMenu.AllSelectedWindTurbines', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('windTurbineMenu.AllWindTurbines', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default WindTurbineTowerHeightInput;
