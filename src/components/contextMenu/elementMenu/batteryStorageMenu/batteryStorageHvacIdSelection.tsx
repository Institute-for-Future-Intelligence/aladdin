/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef } from 'react';
import { Col, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';
import { FoundationModel } from 'src/models/FoundationModel';
import { BatteryStorageModel } from 'src/models/BatteryStorageModel';

const BatteryStorageHvacIdSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.solarPanelActionScope);
  const setActionScope = useStore(Selector.setSolarPanelActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const battery = useSelectedElement() as BatteryStorageModel | undefined;

  const hvacIdsetRef = useRef(new Set<string>());

  const options = useMemo(() => {
    const arr: { value: string; label: string }[] = [];
    hvacIdsetRef.current.clear();
    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.Foundation) {
        const f = e as FoundationModel;
        if (f.hvacSystem && f.hvacSystem.id && !hvacIdsetRef.current.has(f.hvacSystem.id)) {
          const id = f.hvacSystem.id;
          arr.push({ value: id, label: id });
          hvacIdsetRef.current.add(id);
        }
      }
    }
    return arr;
  }, []);

  const initSelections = () => {
    const arr: string[] = [];
    if (!battery || !battery.connectedHvacIds) return arr;
    return battery.connectedHvacIds.filter((id) => hvacIdsetRef.current.has(id));
  };

  const selectinosRef = useRef(initSelections());

  const lang = useLanguage();

  const updateById = (id: string, selections: string[] | undefined) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.BatteryStorage && e.id === id && !e.locked) {
          const b = e as BatteryStorageModel;
          if (selections) {
            b.connectedHvacIds = [...selections];
          } else {
            delete b.connectedHvacIds;
          }
          break;
        }
      }
    });
  };

  const updateInMapByNewValues = (map: Map<string, string[] | undefined>, value: string[]) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.BatteryStorage && map.has(e.id)) {
          const b = e as BatteryStorageModel;
          if (value.length > 0) {
            b.connectedHvacIds = [...value];
          } else {
            delete b.connectedHvacIds;
          }
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const updateInMap = (map: Map<string, string[]>) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.BatteryStorage && map.has(e.id)) {
          const val = map.get(e.id);
          const b = e as BatteryStorageModel;
          if (val) {
            b.connectedHvacIds = val;
          } else {
            delete b.connectedHvacIds;
          }
        }
      }
    });
  };

  const isDifferent = (str1: string[] | undefined, str2: string[]) => {
    if (str1 === undefined) {
      return str2.length > 0;
    }
    if (str1.length !== str2.length) return true;
    const set1 = new Set(str1);
    for (const str of str2) {
      if (!set1.has(str)) {
        return true;
      }
    }
    return false;
  };

  const needChange = () => {
    const selections = selectinosRef.current;
    if (!battery) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.BatteryStorage && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const b = e as BatteryStorageModel;
            if (isDifferent(b.connectedHvacIds, selections)) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.BatteryStorage && !e.locked) {
            const b = e as BatteryStorageModel;
            if (isDifferent(b.connectedHvacIds, selections)) {
              return true;
            }
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        for (const e of elements) {
          if (e.type === ObjectType.BatteryStorage && e.foundationId === battery?.foundationId && !e.locked) {
            const b = e as BatteryStorageModel;
            if (isDifferent(b.connectedHvacIds, selections)) {
              return true;
            }
          }
        }
        break;
      }
      default: {
        if (isDifferent(battery.connectedHvacIds, selections)) {
          return true;
        }
        break;
      }
    }
    return false;
  };

  const setSelections = () => {
    if (!battery) return;
    if (!needChange()) return;
    const selections = selectinosRef.current;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldSelections = new Map<string, string[] | undefined>();
        for (const elem of elements) {
          if (elem.type === ObjectType.BatteryStorage && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldSelections.set(elem.id, (elem as BatteryStorageModel).connectedHvacIds);
          }
        }
        const undoable = {
          name: 'Set Connected HVAC ID For All Selected Battery Storages',
          timestamp: Date.now(),
          oldValues: oldSelections,
          newValue: [...selections],
          undo: () => {
            updateInMap(undoable.oldValues as Map<string, string[]>);
          },
          redo: () => {
            updateInMapByNewValues(
              undoable.oldValues as Map<string, string[] | undefined>,
              undoable.newValue as string[],
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoable);
        updateInMapByNewValues(oldSelections, selections);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldSelections = new Map<string, string[] | undefined>();
        for (const elem of elements) {
          if (elem.type === ObjectType.BatteryStorage) {
            oldSelections.set(elem.id, (elem as BatteryStorageModel).connectedHvacIds);
          }
        }
        const undoable = {
          name: 'Set Connected HVAC ID For All Battery Storages',
          timestamp: Date.now(),
          oldValues: oldSelections,
          newValue: [...selections],
          undo: () => {
            updateInMap(undoable.oldValues as Map<string, string[]>);
          },
          redo: () => {
            updateInMapByNewValues(
              undoable.oldValues as Map<string, string[] | undefined>,
              undoable.newValue as string[],
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoable);
        updateInMapByNewValues(oldSelections, selections);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (battery.foundationId) {
          const oldSelections = new Map<string, string[] | undefined>();
          for (const elem of elements) {
            if (elem.type === ObjectType.BatteryStorage && elem.foundationId === battery.foundationId) {
              oldSelections.set(elem.id, (elem as BatteryStorageModel).connectedHvacIds);
            }
          }
          const undoable = {
            name: 'Set Connected HVAC ID for Battery Storages Above Foundation',
            timestamp: Date.now(),
            oldValues: oldSelections,
            newValue: [...selections],
            undo: () => {
              updateInMap(undoable.oldValues as Map<string, string[]>);
            },
            redo: () => {
              updateInMapByNewValues(
                undoable.oldValues as Map<string, string[] | undefined>,
                undoable.newValue as string[],
              );
            },
          } as UndoableChangeGroup;
          addUndoable(undoable);
          updateInMapByNewValues(oldSelections, selections);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      default: {
        const undoableChange = {
          name: 'Set Connected HVAC ID for Battery Storage',
          timestamp: Date.now(),
          oldValue: battery.connectedHvacIds,
          newValue: [...selections],
          changedElementId: battery.id,
          changedElementType: battery.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as string[]);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as string[]);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(battery.id, selections);
        setApplyCount(applyCount + 1);
        break;
      }
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setSelections();
    setDialogVisible(false);
    setApplyCount(0);
  };

  const apply = () => {
    setSelections();
  };

  const handleChange = (value: string[]) => {
    selectinosRef.current = [...value];
  };

  return (
    <Dialog
      width={600}
      title={i18n.t('batteryStorageMenu.HvacIdSelection', lang)}
      onApply={apply}
      onClose={close}
      onClickCancel={cancel}
      onClickOk={ok}
    >
      <Row gutter={6}>
        <Col span={8}>
          <Select
            style={{ width: '150px' }}
            mode={'multiple'}
            defaultValue={selectinosRef.current}
            onChange={handleChange}
            options={options}
          />
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={16}
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

export default BatteryStorageHvacIdSelection;
