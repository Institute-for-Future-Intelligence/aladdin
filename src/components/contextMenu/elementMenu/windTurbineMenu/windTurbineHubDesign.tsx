/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Divider, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { ZERO_TOLERANCE } from '../../../../constants';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/views/hooks';
import { WindTurbineModel } from '../../../../models/WindTurbineModel';

const WindTurbineHubDesign = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
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
  const [inputRadiusValue, setInputRadiusValue] = useState(windTurbine?.hubRadius ?? 0);
  const [inputLengthValue, setInputLengthValue] = useState(windTurbine?.hubLength ?? 0);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (hubRadius: number, hubLength: number) => {
    if (!windTurbine) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const wt = e as WindTurbineModel;
            if (
              Math.abs(wt.hubRadius - hubRadius) > ZERO_TOLERANCE ||
              Math.abs(wt.hubLength - hubLength) > ZERO_TOLERANCE
            ) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && e.foundationId === windTurbine?.foundationId && !e.locked) {
            const wt = e as WindTurbineModel;
            if (
              Math.abs(wt.hubRadius - hubRadius) > ZERO_TOLERANCE ||
              Math.abs(wt.hubLength - hubLength) > ZERO_TOLERANCE
            ) {
              return true;
            }
          }
        }
        break;
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const wt = e as WindTurbineModel;
            if (
              Math.abs(wt.hubRadius - hubRadius) > ZERO_TOLERANCE ||
              Math.abs(wt.hubLength - hubLength) > ZERO_TOLERANCE
            ) {
              return true;
            }
          }
        }
        break;
      default:
        if (
          Math.abs(windTurbine?.hubRadius - hubRadius) > ZERO_TOLERANCE ||
          Math.abs(windTurbine?.hubLength - hubLength) > ZERO_TOLERANCE
        ) {
          return true;
        }
    }
    return false;
  };

  const updateById = (id: string, values: number[]) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && e.id === id && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.hubRadius = values[0];
          wt.hubLength = values[1];
          break;
        }
      }
    });
  };

  const updateAboveFoundation = (foundationId: string, values: number[]) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && e.foundationId === foundationId && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.hubRadius = values[0];
          wt.hubLength = values[1];
        }
      }
    });
  };

  const updateForAll = (values: number[]) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.hubRadius = values[0];
          wt.hubLength = values[1];
        }
      }
    });
  };

  const updateInMap = (map: Map<string, number[]>, values: number[]) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && !e.locked && map.has(e.id)) {
          const wt = e as WindTurbineModel;
          wt.hubRadius = values[0];
          wt.hubLength = values[1];
        }
      }
    });
  };

  const setValues = (values: number[]) => {
    if (!windTurbine) return;
    if (!needChange(values[0], values[1])) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, number[]>();
        for (const elem of elements) {
          if (elem.type === ObjectType.WindTurbine && useStore.getState().selectedElementIdSet.has(elem.id)) {
            const wt = elem as WindTurbineModel;
            oldValuesSelected.set(elem.id, [wt.hubRadius, wt.hubLength]);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Hub Parameters for Selected Wind Turbines',
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: values,
          undo: () => {
            for (const [id, v] of undoableChangeSelected.oldValues.entries()) {
              updateById(id, v as number[]);
            }
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, number[]>,
              undoableChangeSelected.newValue as number[],
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldValuesSelected, values);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldValuesAll = new Map<string, number[]>();
        for (const elem of elements) {
          if (elem.type === ObjectType.WindTurbine) {
            const wt = elem as WindTurbineModel;
            oldValuesAll.set(elem.id, [wt.hubRadius, wt.hubLength]);
          }
        }
        const undoableChangeAll = {
          name: 'Set Hub Parameters for All Wind Turbines',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: values,
          undo: () => {
            for (const [id, v] of undoableChangeAll.oldValues.entries()) {
              updateById(id, v as number[]);
            }
          },
          redo: () => {
            updateForAll(undoableChangeAll.newValue as number[]);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(values);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (windTurbine.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number[]>();
          for (const elem of elements) {
            if (elem.type === ObjectType.WindTurbine && elem.foundationId === windTurbine.foundationId) {
              const wt = elem as WindTurbineModel;
              oldValuesAboveFoundation.set(elem.id, [wt.hubRadius, wt.hubLength]);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Hub Parameters for All Wind Turbines Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: values,
            groupId: windTurbine.foundationId,
            undo: () => {
              for (const [id, v] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, v as number[]);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number[],
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(windTurbine.foundationId, values);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        // selected element may be outdated, make sure that we get the latest
        const wt = getElementById(windTurbine.id) as WindTurbineModel;
        const oldHubRadius = wt ? wt.hubRadius : windTurbine.hubRadius;
        const oldHubLength = wt ? wt.hubLength : windTurbine.hubLength;
        const undoableChange = {
          name: 'Set Wind Turbine Hub Parameters',
          timestamp: Date.now(),
          oldValue: [oldHubRadius, oldHubLength],
          newValue: values,
          changedElementId: windTurbine.id,
          changedElementType: windTurbine.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as number[]);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as number[]);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(windTurbine.id, values);
        setApplyCount(applyCount + 1);
    }
    setCommonStore((state) => {
      state.actionState.windTurbineHubRadius = values[0];
      state.actionState.windTurbineHubLength = values[1];
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
    setValues([inputRadiusValue, inputLengthValue]);
    setDialogVisible(false);
    setApplyCount(0);
  };

  const apply = () => {
    setValues([inputRadiusValue, inputLengthValue]);
  };

  return (
    <Dialog
      width={550}
      title={i18n.t('windTurbineMenu.HubDesign', lang)}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row gutter={6}>
        <Col className="gutter-row" span={7}>
          <div style={{ marginTop: '-20px', textAlign: 'left', fontSize: '12px' }}>
            {i18n.t('windTurbineMenu.HubRadius', lang)}
          </div>
          <InputNumber
            min={0.5}
            max={5}
            style={{ width: 120 }}
            step={0.01}
            precision={2}
            value={inputRadiusValue}
            onChange={(value) => {
              if (value === null) return;
              setInputRadiusValue(value);
            }}
          />
          <div style={{ paddingTop: '4px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0.5, 5] {i18n.t('word.MeterAbbreviation', lang)}
          </div>

          <div style={{ paddingTop: '10px', textAlign: 'left', fontSize: '12px' }}>
            {i18n.t('windTurbineMenu.HubLength', lang)}
          </div>
          <InputNumber
            min={1}
            max={10}
            style={{ width: 120 }}
            step={0.01}
            precision={2}
            value={inputLengthValue}
            onChange={(value) => {
              if (value === null) return;
              setInputLengthValue(value);
            }}
          />
          <div style={{ paddingTop: '4px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [1, 10] {i18n.t('word.MeterAbbreviation', lang)}
          </div>
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('windTurbineMenu.OnlyThisWindTurbine', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('windTurbineMenu.AllWindTurbinesAboveFoundation', lang)}
              </Radio>
              <Radio value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('windTurbineMenu.AllSelectedWindTurbines', lang)}
              </Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('windTurbineMenu.AllWindTurbines', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default WindTurbineHubDesign;
