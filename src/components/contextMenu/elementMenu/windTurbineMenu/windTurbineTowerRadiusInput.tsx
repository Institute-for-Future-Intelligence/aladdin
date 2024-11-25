/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
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

const WindTurbineTowerRadiusInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
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
  const [inputValue, setInputValue] = useState(windTurbine?.towerRadius ?? 0);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (towerRadius: number) => {
    if (!windTurbine) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const wt = e as WindTurbineModel;
            if (Math.abs(wt.towerRadius - towerRadius) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && e.foundationId === windTurbine?.foundationId && !e.locked) {
            const wt = e as WindTurbineModel;
            if (Math.abs(wt.towerRadius - towerRadius) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const wt = e as WindTurbineModel;
            if (Math.abs(wt.towerRadius - towerRadius) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(windTurbine?.towerRadius - towerRadius) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateTowerRadiusById = (id: string, r: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && e.id === id && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.towerRadius = r;
          break;
        }
      }
    });
  };

  const updateTowerRadiusAboveFoundation = (foundationId: string, r: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && e.foundationId === foundationId && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.towerRadius = r;
        }
      }
    });
  };

  const updateTowerRadiusForAll = (r: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.towerRadius = r;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && !e.locked && map.has(e.id)) {
          const wt = e as WindTurbineModel;
          wt.towerRadius = value;
        }
      }
    });
  };

  const setTowerRadius = (value: number) => {
    if (!windTurbine) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldRadiiSelected = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.WindTurbine && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldRadiiSelected.set(elem.id, (elem as WindTurbineModel).towerRadius);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Tower Radius for Selected Wind Turbines',
          timestamp: Date.now(),
          oldValues: oldRadiiSelected,
          newValue: value,
          undo: () => {
            for (const [id, th] of undoableChangeSelected.oldValues.entries()) {
              updateTowerRadiusById(id, th as number);
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
        updateInMap(oldRadiiSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldRadiiAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.WindTurbine) {
            oldRadiiAll.set(elem.id, (elem as WindTurbineModel).towerRadius);
          }
        }
        const undoableChangeAll = {
          name: 'Set Tower Radius for All Wind Turbines',
          timestamp: Date.now(),
          oldValues: oldRadiiAll,
          newValue: value,
          undo: () => {
            for (const [id, th] of undoableChangeAll.oldValues.entries()) {
              updateTowerRadiusById(id, th as number);
            }
          },
          redo: () => {
            updateTowerRadiusForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateTowerRadiusForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (windTurbine.foundationId) {
          const oldRadiiAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.WindTurbine && elem.foundationId === windTurbine.foundationId) {
              oldRadiiAboveFoundation.set(elem.id, (elem as WindTurbineModel).towerRadius);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Tower Radius for All Wind Turbines Above Foundation',
            timestamp: Date.now(),
            oldValues: oldRadiiAboveFoundation,
            newValue: value,
            groupId: windTurbine.foundationId,
            undo: () => {
              for (const [id, th] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateTowerRadiusById(id, th as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateTowerRadiusAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateTowerRadiusAboveFoundation(windTurbine.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      default: {
        // selected element may be outdated, make sure that we get the latest
        const wt = getElementById(windTurbine.id) as WindTurbineModel;
        const oldRadius = wt ? wt.towerRadius : windTurbine.towerRadius;
        const undoableChange = {
          name: 'Set Wind Turbine Tower Radius',
          timestamp: Date.now(),
          oldValue: oldRadius,
          newValue: value,
          changedElementId: windTurbine.id,
          changedElementType: windTurbine.type,
          undo: () => {
            updateTowerRadiusById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateTowerRadiusById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateTowerRadiusById(windTurbine.id, value);
        setApplyCount(applyCount + 1);
        break;
      }
    }
    setCommonStore((state) => {
      state.actionState.windTurbineTowerRadius = value;
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
    setTowerRadius(inputValue);
    setDialogVisible(false);
    setApplyCount(0);
  };

  const apply = () => {
    setTowerRadius(inputValue);
  };

  return (
    <Dialog
      width={550}
      title={i18n.t('windTurbineMenu.TowerRadius', lang)}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row gutter={6}>
        <Col span={6}>
          <InputNumber
            min={0.1}
            max={2}
            style={{ width: 120 }}
            step={0.01}
            precision={2}
            // formatter={(value) => `${value} ` + i18n.t('word.MeterAbbreviation', lang)}
            // parser={value => Number(value?.replace(i18n.t('word.MeterAbbreviation', lang), ''))}
            value={inputValue}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0.1, 2] {i18n.t('word.MeterAbbreviation', lang)}
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

export default WindTurbineTowerRadiusInput;
