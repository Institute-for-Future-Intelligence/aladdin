/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';
import { CompactPicker } from 'react-color';
import { BatteryStorageModel } from 'src/models/BatteryStorageModel';

const BatteryStorageColorSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const updateElementColorById = useStore(Selector.updateElementColorById);
  const getElementById = useStore(Selector.getElementById);
  const updateElementColorForAll = useStore(Selector.updateElementColorForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const setApplyCount = useStore(Selector.setApplyCount);
  const actionScope = useStore(Selector.batteryStorageActionScope);
  const setActionScope = useStore(Selector.setBatteryStorageActionScope);

  const batteryStorage = useSelectedElement(ObjectType.BatteryStorage) as BatteryStorageModel | undefined;

  const [selectedColor, setSelectedColor] = useState(batteryStorage?.color ?? '#808080');

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (color: string) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.BatteryStorage && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            if (color !== e.color) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType:
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.BatteryStorage && !e.locked) {
            if (color !== e.color) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of useStore.getState().elements) {
          if (e.type === ObjectType.BatteryStorage && e.parentId === batteryStorage?.parentId && !e.locked) {
            if (color !== e.color) {
              return true;
            }
          }
        }
        break;
      default:
        if (color !== batteryStorage?.color) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, string>, value?: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.BatteryStorage && map.has(e.id)) {
          if (value !== undefined) {
            e.color = value;
          } else {
            const color = map.get(e.id);
            if (color !== undefined) {
              e.color = color;
            }
          }
        }
      }
    });
  };

  const updateOnFoundation = (fId: string, color: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.BatteryStorage && !e.locked && e.parentId === fId) {
          e.color = color;
        }
      }
    });
  };

  const updateColor = (value: string) => {
    if (!batteryStorage) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldColorsSelected = new Map<string, string>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.BatteryStorage && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldColorsSelected.set(elem.id, elem.color ?? '#808080');
          }
        }
        const undoableChangeSelected = {
          name: 'Set Color for Selected BatteryStorages',
          timestamp: Date.now(),
          oldValues: oldColorsSelected,
          newValue: value,
          undo: () => {
            updateInMap(undoableChangeSelected.oldValues as Map<string, string>);
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, string>,
              undoableChangeSelected.newValue as string,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldColorsSelected, value);
        setApplyCount(useStore.getState().applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldColorsAll = new Map<string, string>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.BatteryStorage) {
            oldColorsAll.set(elem.id, elem.color ?? '#808080');
          }
        }
        const undoableChangeAll = {
          name: 'Set Color for All BatteryStorages',
          timestamp: Date.now(),
          oldValues: oldColorsAll,
          newValue: value,
          undo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, string>);
          },
          redo: () => {
            updateElementColorForAll(ObjectType.BatteryStorage, undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateElementColorForAll(ObjectType.BatteryStorage, value);
        setApplyCount(useStore.getState().applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        const oldColorsAll = new Map<string, string>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.BatteryStorage && elem.parentId === batteryStorage.parentId && !elem.locked) {
            oldColorsAll.set(elem.id, elem.color ?? '#808080');
          }
        }
        const undoableChangeAll = {
          name: 'Set Color for All Battery Storage on Same Foundation',
          timestamp: Date.now(),
          oldValues: oldColorsAll,
          newValue: value,
          groupId: batteryStorage.parentId,
          undo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, string>);
          },
          redo: () => {
            updateOnFoundation(undoableChangeAll.groupId, undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateOnFoundation(batteryStorage.parentId, value);
        setApplyCount(useStore.getState().applyCount + 1);
        break;
      }
      default: {
        // batteryStorage via selected element may be outdated, make sure that we get the latest
        const f = getElementById(batteryStorage.id);
        const oldColor = f ? f.color : batteryStorage.color;
        const undoableChange = {
          name: 'Set Color of Selected Battery Storage',
          timestamp: Date.now(),
          oldValue: oldColor,
          newValue: value,
          changedElementId: batteryStorage.id,
          changedElementType: batteryStorage.type,
          undo: () => {
            updateElementColorById(undoableChange.changedElementId, undoableChange.oldValue as string);
          },
          redo: () => {
            updateElementColorById(undoableChange.changedElementId, undoableChange.newValue as string);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateElementColorById(batteryStorage.id, value);
        setApplyCount(useStore.getState().applyCount + 1);
        break;
      }
    }
  };

  const apply = () => {
    updateColor(selectedColor);
  };

  const close = () => {
    setDialogVisible(false);
  };

  return (
    <Dialog width={650} title={i18n.t('word.Color', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={12}>
          <CompactPicker
            color={selectedColor}
            onChangeComplete={(colorResult) => {
              setSelectedColor(colorResult.hex);
            }}
          />
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={12}
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

export default BatteryStorageColorSelection;
