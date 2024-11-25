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
import { Util } from '../../../../Util';
import { ZERO_TOLERANCE } from '../../../../constants';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';
import { WindTurbineModel } from '../../../../models/WindTurbineModel';

const WindTurbineYawInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
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
  const [inputValue, setInputValue] = useState(windTurbine?.relativeYawAngle ?? 0);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (value: number) => {
    if (!windTurbine) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const wt = e as WindTurbineModel;
            if (Math.abs((wt.relativeYawAngle ?? 0) - value) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && e.foundationId === windTurbine?.foundationId && !e.locked) {
            const wt = e as WindTurbineModel;
            if (Math.abs((wt.relativeYawAngle ?? 0) - value) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const wt = e as WindTurbineModel;
            if (Math.abs((wt.relativeYawAngle ?? 0) - value) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs((windTurbine?.relativeYawAngle ?? 0) - value) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateRelativeYawAngleById = (id: string, value: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && e.id === id && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.relativeYawAngle = value;
          break;
        }
      }
    });
  };

  const updateRelativeYawAngleAboveFoundation = (foundationId: string, value: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && e.foundationId === foundationId && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.relativeYawAngle = value;
        }
      }
    });
  };

  const updateRelativeYawAngleForAll = (value: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.relativeYawAngle = value;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && !e.locked && map.has(e.id)) {
          const wt = e as WindTurbineModel;
          wt.relativeYawAngle = value;
        }
      }
    });
  };

  const setRelativeYawAngle = (value: number) => {
    if (!windTurbine) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.WindTurbine && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldValuesSelected.set(elem.id, (elem as WindTurbineModel).relativeYawAngle);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Relative Yaw Angle for Selected Wind Turbines',
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: value,
          undo: () => {
            for (const [id, br] of undoableChangeSelected.oldValues.entries()) {
              updateRelativeYawAngleById(id, br as number);
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
        updateInMap(oldValuesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldValuesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.WindTurbine) {
            oldValuesAll.set(elem.id, (elem as WindTurbineModel).relativeYawAngle);
          }
        }
        const undoableChangeAll = {
          name: 'Set Relative Yaw Angle for All Wind Turbines',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, br] of undoableChangeAll.oldValues.entries()) {
              updateRelativeYawAngleById(id, br as number);
            }
          },
          redo: () => {
            updateRelativeYawAngleForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateRelativeYawAngleForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (windTurbine.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.WindTurbine && elem.foundationId === windTurbine.foundationId) {
              oldValuesAboveFoundation.set(elem.id, (elem as WindTurbineModel).relativeYawAngle);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Relative Yaw Angle for All Wind Turbines Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: windTurbine.foundationId,
            undo: () => {
              for (const [id, br] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateRelativeYawAngleById(id, br as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateRelativeYawAngleAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateRelativeYawAngleAboveFoundation(windTurbine.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      default: {
        // selected element may be outdated, make sure that we get the latest
        const wt = getElementById(windTurbine.id) as WindTurbineModel;
        const oldValue = wt ? wt.relativeYawAngle : windTurbine.relativeYawAngle;
        const undoableChange = {
          name: 'Set Wind Turbine Relative Yaw Angle',
          timestamp: Date.now(),
          oldValue: oldValue,
          newValue: value,
          changedElementId: windTurbine.id,
          changedElementType: windTurbine.type,
          undo: () => {
            updateRelativeYawAngleById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateRelativeYawAngleById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateRelativeYawAngleById(windTurbine.id, value);
        setApplyCount(applyCount + 1);
        break;
      }
    }
    setCommonStore((state) => {
      state.actionState.windTurbineRelativeYawAngle = value;
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
    setRelativeYawAngle(inputValue);
    setDialogVisible(false);
    setApplyCount(0);
  };

  const apply = () => {
    setRelativeYawAngle(inputValue);
  };

  return (
    <Dialog
      width={550}
      title={i18n.t('windTurbineMenu.RelativeYawAngle', lang)}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row gutter={6}>
        <Col span={6}>
          <InputNumber
            min={-180}
            max={180}
            style={{ width: 120 }}
            precision={2}
            step={1}
            // make sure that we round up the number as toDegrees may cause things like .999999999
            value={parseFloat(Util.toDegrees(inputValue).toFixed(2))}
            formatter={(value) => `${value}°`}
            onChange={(value) => {
              if (value !== null) setInputValue(Util.toRadians(value));
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [-180°, 180°]
            <br />
            {i18n.t('message.SouthFacingIsZero', lang)}
            <br />
            {i18n.t('message.CounterclockwiseAzimuthIsPositive', lang)}
          </div>
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

export default WindTurbineYawInput;
