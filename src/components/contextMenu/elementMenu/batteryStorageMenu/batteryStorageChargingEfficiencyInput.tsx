/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { BatteryStorageModel } from 'src/models/BatteryStorageModel';
import { ZERO_TOLERANCE } from 'src/constants';
import { useSelectedElement } from '../menuHooks';
import { useLanguage } from 'src/hooks';
import Dialog from '../../dialog';

const BatteryStorageChargingEfficiencyInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.batteryStorageActionScope);
  const setActionScope = useStore(Selector.setBatteryStorageActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const batteryStorage = useSelectedElement(ObjectType.BatteryStorage) as BatteryStorageModel | undefined;

  const [inputValue, setInputValue] = useState<number>(batteryStorage?.chargingEfficiency ?? 95);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (chargingEfficiency: number) => {
    if (!batteryStorage) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.BatteryStorage && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const battery = e as BatteryStorageModel;
            if (Math.abs(battery.chargingEfficiency - chargingEfficiency) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.BatteryStorage && !e.locked) {
            const battery = e as BatteryStorageModel;
            if (Math.abs(battery.chargingEfficiency - chargingEfficiency) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.BatteryStorage && e.parentId === batteryStorage.parentId && !e.locked) {
            const battery = e as BatteryStorageModel;
            if (Math.abs(battery.chargingEfficiency - chargingEfficiency) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      }
      default: {
        if (Math.abs(batteryStorage?.chargingEfficiency - chargingEfficiency) > ZERO_TOLERANCE) {
          return true;
        }
        break;
      }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value?: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.BatteryStorage && map.has(e.id)) {
          const battery = e as BatteryStorageModel;
          if (value !== undefined) {
            battery.chargingEfficiency = value;
          } else {
            const val = map.get(e.id);
            if (val !== undefined) {
              battery.chargingEfficiency = val;
            }
          }
        }
      }
    });
  };

  const updateOnFoundation = (fId: string, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.BatteryStorage && !e.locked && e.parentId === fId) {
          const battery = e as BatteryStorageModel;
          battery.chargingEfficiency = value;
        }
      }
    });
  };

  const updateById = (id: string, val: number) => {
    useStore.getState().set((state) => {
      const bs = state.elements.find((e) => e.id === id);
      if (bs && bs.type === ObjectType.BatteryStorage) {
        const battery = bs as BatteryStorageModel;
        battery.chargingEfficiency = val;
      }
    });
  };

  const setChargingEfficiency = (value: number) => {
    if (!batteryStorage) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldLzSelected = new Map<string, number>();
        for (const elem of useStore.getState().elements) {
          if (
            elem.type === ObjectType.BatteryStorage &&
            !elem.locked &&
            useStore.getState().selectedElementIdSet.has(elem.id)
          ) {
            const battery = elem as BatteryStorageModel;
            oldLzSelected.set(elem.id, battery.chargingEfficiency);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Charging Efficiency for Selected Battery Storages',
          timestamp: Date.now(),
          oldValues: oldLzSelected,
          newValue: value,
          undo: () => {
            updateInMap(undoableChangeSelected.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, number>,
              undoableChangeSelected.newValue as number,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldLzSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldValAll = new Map<string, number>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.BatteryStorage && !elem.locked) {
            const battery = elem as BatteryStorageModel;
            oldValAll.set(elem.id, battery.chargingEfficiency);
          }
        }
        const undoableChangeAll = {
          name: 'Set Charging Efficiency for All Battery Storages',
          timestamp: Date.now(),
          oldValues: oldValAll,
          newValue: value,
          undo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, number>, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateInMap(oldValAll, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        const oldValAll = new Map<string, number>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.BatteryStorage && elem.parentId === batteryStorage.parentId && !elem.locked) {
            const battery = elem as BatteryStorageModel;
            oldValAll.set(elem.id, battery.chargingEfficiency);
          }
        }
        const undoableChangeAll = {
          name: 'Set Charging Efficiency for All Battery Storage on Same Foundation',
          timestamp: Date.now(),
          oldValues: oldValAll,
          newValue: value,
          groupId: batteryStorage.parentId,
          undo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, number>);
          },
          redo: () => {
            updateOnFoundation(undoableChangeAll.groupId, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateOnFoundation(batteryStorage.parentId, value);
        setApplyCount(applyCount + 1);
        break;
      }
      default: {
        const undoableChange = {
          name: 'Set Battery Storage Charging Efficiency',
          timestamp: Date.now(),
          oldValue: batteryStorage.chargingEfficiency,
          newValue: value,
          changedElementId: batteryStorage.id,
          changedElementType: batteryStorage.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(batteryStorage.id, value);
        setApplyCount(applyCount + 1);
        break;
      }
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setChargingEfficiency(inputValue);
  };

  return (
    <Dialog width={550} title={i18n.t('batteryStorageMenu.ChargingEfficiency', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={6}>
          <InputNumber
            min={30}
            max={99}
            style={{ width: 120 }}
            step={1}
            precision={0}
            value={inputValue}
            formatter={(value) => `${value}%`}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [30, 99]
          </div>
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={18}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('batteryStorageMenu.OnlyThisBatteryStorage', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('batteryStorageMenu.AllBatteryStoragesAboveSameFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('batteryStorageMenu.AllSelectedBatteryStorages', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('batteryStorageMenu.AllBatteryStorages', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default BatteryStorageChargingEfficiencyInput;
