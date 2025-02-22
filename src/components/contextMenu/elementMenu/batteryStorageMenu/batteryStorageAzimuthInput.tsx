/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from '../../../../stores/common';
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
import { BatteryStorageModel } from 'src/models/BatteryStorageModel';

const BatteryStorageAzimuthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const getElementById = useStore(Selector.getElementById);
  const updateElementRotationById = useStore(Selector.updateElementRotationById);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.batteryStorageActionScope);
  const setActionScope = useStore(Selector.setBatteryStorageActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const batteryStorage = useSelectedElement(ObjectType.BatteryStorage) as BatteryStorageModel | undefined;

  // reverse the sign because rotation angle is positive counterclockwise whereas azimuth is positive clockwise
  const [inputValue, setInputValue] = useState<number>(batteryStorage ? -batteryStorage.rotation[2] : 0);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const updateOnFoundation = (fId: string, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.BatteryStorage && !e.locked && e.parentId === fId) {
          e.rotation[2] = -value;
        }
      }
    });
  };

  const needChange = (azimuth: number) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.BatteryStorage && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const c = e as BatteryStorageModel;
            if (Math.abs(-c.rotation[2] - azimuth) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType: {
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.BatteryStorage && !e.locked) {
            const c = e as BatteryStorageModel;
            if (Math.abs(-c.rotation[2] - azimuth) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.BatteryStorage && e.parentId === batteryStorage?.parentId && !e.locked) {
            const c = e as BatteryStorageModel;
            if (Math.abs(-c.rotation[2] - azimuth) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs((batteryStorage ? -batteryStorage.rotation[2] : 0) - azimuth) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value?: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (map.has(e.id)) {
          if (value !== undefined) {
            e.rotation[2] = value;
          } else {
            const rot = map.get(e.id);
            if (rot !== undefined) {
              e.rotation[2] = -rot;
            }
          }
        }
      }
    });
  };

  const setAzimuth = (value: number) => {
    if (!batteryStorage) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldAzimuthsSelected = new Map<string, number>();
        for (const elem of useStore.getState().elements) {
          if (
            elem.type === ObjectType.BatteryStorage &&
            !elem.locked &&
            useStore.getState().selectedElementIdSet.has(elem.id)
          ) {
            oldAzimuthsSelected.set(elem.id, -elem.rotation[2]);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Azimuth for Selected Battery Storages',
          timestamp: Date.now(),
          oldValues: oldAzimuthsSelected,
          newValue: value,
          undo: () => {
            updateInMap(undoableChangeSelected.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, number>,
              -undoableChangeSelected.newValue as number,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldAzimuthsSelected, -value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldAzimuthsAll = new Map<string, number>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.BatteryStorage && !elem.locked) {
            oldAzimuthsAll.set(elem.id, -elem.rotation[2]);
          }
        }
        const undoableChangeAll = {
          name: 'Set Azimuth for All Battery Storages',
          timestamp: Date.now(),
          oldValues: oldAzimuthsAll,
          newValue: value,
          undo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, number>, -undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateInMap(oldAzimuthsAll, -value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        const oldAzimuthsAll = new Map<string, number>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.BatteryStorage && elem.parentId === batteryStorage.parentId && !elem.locked) {
            oldAzimuthsAll.set(elem.id, -elem.rotation[2]);
          }
        }
        const undoableChangeAll = {
          name: 'Set Azimuth for All Battery Storage on Same Foundation',
          timestamp: Date.now(),
          oldValues: oldAzimuthsAll,
          newValue: value,
          groupId: batteryStorage.parentId,
          undo: () => {
            for (const [id, az] of undoableChangeAll.oldValues.entries()) {
              updateElementRotationById(id, 0, 0, -(az as number));
            }
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
        // element via selected element may be outdated, make sure that we get the latest
        const c = getElementById(batteryStorage.id);
        const oldAzimuth = c ? -c.rotation[2] : -batteryStorage.rotation[2];
        const undoableChange = {
          name: 'Set Battery Storage Azimuth',
          timestamp: Date.now(),
          oldValue: oldAzimuth,
          newValue: value,
          changedElementId: batteryStorage.id,
          changedElementType: batteryStorage.type,
          undo: () => {
            updateElementRotationById(undoableChange.changedElementId, 0, 0, -(undoableChange.oldValue as number));
          },
          redo: () => {
            updateElementRotationById(undoableChange.changedElementId, 0, 0, -(undoableChange.newValue as number));
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateElementRotationById(batteryStorage.id, 0, 0, -value);
        setApplyCount(applyCount + 1);
        break;
      }
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setAzimuth(inputValue);
  };

  return (
    <Dialog width={550} title={i18n.t('word.Azimuth', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={7}>
          <InputNumber
            min={-180}
            max={180}
            style={{ width: 120 }}
            step={0.5}
            precision={2}
            // make sure that we round up the number because toDegrees may cause things like .999999999
            value={parseFloat(Util.toDegrees(inputValue).toFixed(2))}
            formatter={(value) => `${value}°`}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(Util.toRadians(value));
            }}
          />
          <div style={{ paddingTop: '20px', paddingRight: '6px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [-180°, 180°]
            <br />
            {i18n.t('message.AzimuthOfNorthIsZero', lang)}
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

export default BatteryStorageAzimuthInput;
