/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, InputNumber, Radio, Row, Space } from 'antd';
import { CommonStoreState, useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope, SolarStructure } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { FoundationModel } from 'src/models/FoundationModel';
import { ZERO_TOLERANCE } from 'src/constants';
import { SolarPowerTowerModel } from '../../../../models/SolarPowerTowerModel';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';

const SolarPowerTowerReceiverThermalEfficiencyInput = ({
  setDialogVisible,
}: {
  setDialogVisible: (b: boolean) => void;
}) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.foundationActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const foundation = useSelectedElement(ObjectType.Foundation) as FoundationModel | undefined;
  const powerTower = foundation?.solarPowerTower;

  const [inputValue, setInputValue] = useState<number>(powerTower?.receiverThermalEfficiency ?? 0.3);

  const lang = useLanguage();

  const updateById = (id: string, efficiency: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Foundation && e.id === id && !e.locked) {
          const f = e as FoundationModel;
          if (f.solarStructure === SolarStructure.FocusTower) {
            if (!f.solarPowerTower) f.solarPowerTower = {} as SolarPowerTowerModel;
            f.solarPowerTower.receiverThermalEfficiency = efficiency;
          }
          break;
        }
      }
    });
  };

  const updateForAll = (efficiency: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Foundation && !e.locked) {
          const f = e as FoundationModel;
          if (f.solarStructure === SolarStructure.FocusTower) {
            if (!f.solarPowerTower) f.solarPowerTower = {} as SolarPowerTowerModel;
            f.solarPowerTower.receiverThermalEfficiency = efficiency;
          }
        }
      }
    });
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Foundation && !e.locked && map.has(e.id)) {
          const f = e as FoundationModel;
          if (f.solarStructure === SolarStructure.FocusTower) {
            if (!f.solarPowerTower) f.solarPowerTower = {} as SolarPowerTowerModel;
            f.solarPowerTower.receiverThermalEfficiency = value;
          }
        }
      }
    });
  };

  const needChange = (efficiency: number) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const f = e as FoundationModel;
            if (f.solarStructure === SolarStructure.FocusTower && f.solarPowerTower) {
              if (
                f.solarPowerTower.receiverThermalEfficiency === undefined ||
                Math.abs(f.solarPowerTower.receiverThermalEfficiency - efficiency) > ZERO_TOLERANCE
              ) {
                return true;
              }
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked) {
            const f = e as FoundationModel;
            if (f.solarStructure === SolarStructure.FocusTower && f.solarPowerTower) {
              if (
                f.solarPowerTower.receiverThermalEfficiency === undefined ||
                Math.abs(f.solarPowerTower.receiverThermalEfficiency - efficiency) > ZERO_TOLERANCE
              ) {
                return true;
              }
            }
          }
        }
        break;
      default:
        if (
          powerTower?.receiverThermalEfficiency === undefined ||
          Math.abs(powerTower?.receiverThermalEfficiency - efficiency) > ZERO_TOLERANCE
        ) {
          return true;
        }
    }
    return false;
  };

  const setThermalEfficiency = (value: number) => {
    if (!foundation || !powerTower) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation && useStore.getState().selectedElementIdSet.has(elem.id)) {
            const f = elem as FoundationModel;
            if (f.solarPowerTower) {
              oldValuesSelected.set(elem.id, f.solarPowerTower.receiverThermalEfficiency ?? 0.3);
            }
          }
        }
        const undoableChangeSelected = {
          name: 'Set Receiver Thermal Efficiency for Selected Foundations',
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: value,
          undo: () => {
            for (const [id, te] of undoableChangeSelected.oldValues.entries()) {
              updateById(id, te as number);
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
          if (elem.type === ObjectType.Foundation) {
            const f = elem as FoundationModel;
            if (f.solarPowerTower) {
              oldValuesAll.set(elem.id, f.solarPowerTower.receiverThermalEfficiency ?? 0.3);
            }
          }
        }
        const undoableChangeAll = {
          name: 'Set Receiver Thermal Efficiency for All Foundations',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, te] of undoableChangeAll.oldValues.entries()) {
              updateById(id, te as number);
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
      default: {
        // foundation selected element may be outdated, make sure that we get the latest
        const f = getElementById(foundation.id) as FoundationModel;
        const oldValue =
          f && f.solarPowerTower
            ? f.solarPowerTower.receiverThermalEfficiency ?? 0.3
            : powerTower.receiverThermalEfficiency ?? 0.3;
        updateById(foundation.id, value);
        const undoableChange = {
          name: 'Set Receiver Thermal Efficiency on Foundation',
          timestamp: Date.now(),
          oldValue: oldValue,
          newValue: value,
          changedElementId: foundation.id,
          changedElementType: foundation.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        setApplyCount(applyCount + 1);
        break;
      }
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setThermalEfficiency(inputValue);
  };

  return (
    <Dialog
      width={550}
      title={i18n.t('solarPowerTowerMenu.ReceiverThermalEfficiency', lang)}
      onApply={apply}
      onClose={close}
    >
      <Row gutter={6}>
        <Col span={8}>
          <InputNumber
            min={0}
            max={1}
            style={{ width: 120 }}
            step={0.01}
            precision={2}
            value={inputValue}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0, 1]
          </div>
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={16}
        >
          <Radio.Group
            onChange={(e) => useStore.getState().setFoundationActionScope(e.target.value)}
            value={actionScope}
          >
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('foundationMenu.OnlyThisFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('foundationMenu.AllSelectedFoundations', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('foundationMenu.AllFoundations', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default SolarPowerTowerReceiverThermalEfficiencyInput;
