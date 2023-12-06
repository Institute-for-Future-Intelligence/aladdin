/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { BirdSafeDesign, ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { useSelectedElement } from './menuHooks';
import Dialog from '../dialog';
import { useLanguage } from 'src/views/hooks';
import { WindTurbineModel } from '../../../models/WindTurbineModel';

const WindTurbineBirdSafeSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
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
  const [inputValue, setInputValue] = useState(windTurbine?.birdSafe ?? BirdSafeDesign.None);

  const lang = useLanguage();
  const { Option } = Select;

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (value: BirdSafeDesign) => {
    if (!windTurbine) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const wt = e as WindTurbineModel;
            if ((wt.birdSafe ?? BirdSafeDesign.None) !== value) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && e.foundationId === windTurbine?.foundationId && !e.locked) {
            const wt = e as WindTurbineModel;
            if ((wt.birdSafe ?? BirdSafeDesign.None) !== value) {
              return true;
            }
          }
        }
        break;
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.WindTurbine && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const wt = e as WindTurbineModel;
            if ((wt.birdSafe ?? BirdSafeDesign.None) !== value) {
              return true;
            }
          }
        }
        break;
      default:
        if ((windTurbine.birdSafe ?? BirdSafeDesign.None) !== value) {
          return true;
        }
    }
    return false;
  };

  const updateById = (id: string, value: BirdSafeDesign) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && e.id === id && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.birdSafe = value;
          break;
        }
      }
    });
  };

  const updateAboveFoundation = (foundationId: string, value: BirdSafeDesign) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && e.foundationId === foundationId && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.birdSafe = value;
        }
      }
    });
  };

  const updateForAll = (value: BirdSafeDesign) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && !e.locked) {
          const wt = e as WindTurbineModel;
          wt.birdSafe = value;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, number>, value: BirdSafeDesign) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.WindTurbine && !e.locked && map.has(e.id)) {
          const wt = e as WindTurbineModel;
          wt.birdSafe = value;
        }
      }
    });
  };

  const setValue = (value: BirdSafeDesign) => {
    if (!windTurbine) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.WindTurbine && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldValuesSelected.set(elem.id, (elem as WindTurbineModel).birdSafe ?? BirdSafeDesign.None);
          }
        }
        const undoableChangeSelected = {
          name: 'Select Bird-Safe Design for Selected Wind Turbines',
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: value,
          undo: () => {
            for (const [id, bn] of undoableChangeSelected.oldValues.entries()) {
              updateById(id, bn as number);
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
            oldValuesAll.set(elem.id, (elem as WindTurbineModel).birdSafe ?? BirdSafeDesign.None);
          }
        }
        const undoableChangeAll = {
          name: 'Select Bird-Safe Design for All Wind Turbines',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, bn] of undoableChangeAll.oldValues.entries()) {
              updateById(id, bn as number);
            }
          },
          redo: () => {
            updateForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (windTurbine.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.WindTurbine && elem.foundationId === windTurbine.foundationId) {
              oldValuesAboveFoundation.set(elem.id, (elem as WindTurbineModel).birdSafe ?? BirdSafeDesign.None);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Select Bird-Safe Design for All Wind Turbines Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: windTurbine.foundationId,
            undo: () => {
              for (const [id, bn] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, bn as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(windTurbine.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        // selected element may be outdated, make sure that we get the latest
        const wt = getElementById(windTurbine.id) as WindTurbineModel;
        const oldValue = wt ? wt.birdSafe ?? BirdSafeDesign.None : windTurbine.birdSafe ?? BirdSafeDesign.None;
        const undoableChange = {
          name: 'Select Bird-Safe Design for Wind Turbine',
          timestamp: Date.now(),
          oldValue: oldValue,
          newValue: value,
          changedElementId: windTurbine.id,
          changedElementType: windTurbine.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(windTurbine.id, value);
        setApplyCount(applyCount + 1);
    }
    setCommonStore((state) => {
      state.actionState.windTurbineBirdSafeDesign = value;
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
    setValue(inputValue);
    setDialogVisible(false);
    setApplyCount(0);
  };

  const apply = () => {
    setValue(inputValue);
  };

  return (
    <Dialog
      width={550}
      title={i18n.t('windTurbineMenu.BirdSafeDesign', lang)}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row gutter={6}>
        <Col className="gutter-row" span={6}>
          <Select
            style={{ width: '120px' }}
            value={inputValue}
            onChange={(value) => {
              if (value !== null) setInputValue(value);
            }}
          >
            <Option key={BirdSafeDesign.None} value={BirdSafeDesign.None}>
              {i18n.t('windTurbineMenu.BirdSafeNone', lang)}
            </Option>
            <Option key={BirdSafeDesign.TwoColors} value={BirdSafeDesign.TwoColors}>
              {i18n.t('windTurbineMenu.BirdSafeTwoColors', lang)}
            </Option>
          </Select>
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={18}
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

export default WindTurbineBirdSafeSelection;
