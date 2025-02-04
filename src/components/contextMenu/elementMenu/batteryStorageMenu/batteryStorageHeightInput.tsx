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

const BatteryStorageHeightInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.batteryStorageActionScope);
  const setActionScope = useStore(Selector.setBatteryStorageActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const batteryStorage = useSelectedElement(ObjectType.BatteryStorage) as BatteryStorageModel | undefined;

  const [inputValue, setInputValue] = useState<number>(batteryStorage?.lz ?? 0);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (lz: number) => {
    if (!batteryStorage) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.BatteryStorage && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            if (Math.abs(e.lz - lz) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.BatteryStorage && !e.locked) {
            if (Math.abs(e.lz - lz) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.BatteryStorage && e.parentId === batteryStorage.parentId && !e.locked) {
            if (Math.abs(e.lz - lz) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      }
      default: {
        if (Math.abs(batteryStorage?.lz - lz) > ZERO_TOLERANCE) {
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
          if (value !== undefined) {
            e.lz = value;
          } else {
            const val = map.get(e.id);
            if (val !== undefined) {
              e.lz = val;
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
          e.lz = value;
        }
      }
    });
  };

  const updateLzById = (id: string, val: number) => {
    useStore.getState().set((state) => {
      const bs = state.elements.find((e) => e.id === id);
      if (bs) {
        bs.lz = val;
      }
    });
  };

  const setLz = (value: number) => {
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
            oldLzSelected.set(elem.id, elem.lz);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Lz for Selected Battery Storages',
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
        const oldLzAll = new Map<string, number>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.BatteryStorage && !elem.locked) {
            oldLzAll.set(elem.id, elem.lz);
          }
        }
        const undoableChangeAll = {
          name: 'Set Lz for All Battery Storages',
          timestamp: Date.now(),
          oldValues: oldLzAll,
          newValue: value,
          undo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, number>, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateInMap(oldLzAll, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        const oldLzAll = new Map<string, number>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.BatteryStorage && elem.parentId === batteryStorage.parentId && !elem.locked) {
            oldLzAll.set(elem.id, elem.lz);
          }
        }
        const undoableChangeAll = {
          name: 'Set Lz for All Battery Storage on Same Foundation',
          timestamp: Date.now(),
          oldValues: oldLzAll,
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
          name: 'Set Battery Storage Lz',
          timestamp: Date.now(),
          oldValue: batteryStorage.lz,
          newValue: value,
          changedElementId: batteryStorage.id,
          changedElementType: batteryStorage.type,
          undo: () => {
            updateLzById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateLzById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateLzById(batteryStorage.id, value);
        setApplyCount(applyCount + 1);
        break;
      }
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setLz(inputValue);
  };

  return (
    <Dialog width={550} title={i18n.t('word.Height', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={6}>
          <InputNumber
            min={0.1}
            max={1000}
            style={{ width: 120 }}
            step={0.5}
            precision={2}
            value={inputValue}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
            }}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0.1, 1000] {i18n.t('word.MeterAbbreviation', lang)}
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
                {i18n.t('batteryStorageMenu.OnlyThisBatteryStorage', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('batteryStorageMenu.AllBatteryStoragesAboveSameBase', lang)}
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

export default BatteryStorageHeightInput;
