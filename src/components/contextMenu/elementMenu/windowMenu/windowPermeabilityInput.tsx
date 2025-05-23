/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, InputNumber, Radio, Row, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { WindowModel } from 'src/models/WindowModel';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';

const WindowPermeabilityInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.windowActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);

  const windowModel = useSelectedElement(ObjectType.Window) as WindowModel | undefined;

  const [inputValue, setInputValue] = useState<number>(windowModel?.airPermeability ?? 0);

  const lang = useLanguage();

  const updateById = (id: string, value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          (e as WindowModel).airPermeability = value;
          break;
        }
      }
    });
  };

  const undoInMap = (map: Map<string, number>) => {
    for (const [id, val] of map.entries()) {
      updateById(id, val);
    }
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    for (const id of map.keys()) {
      updateById(id, value);
    }
  };

  const needChange = (value: number) => {
    if (!windowModel) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (
            e.type === ObjectType.Window &&
            value !== (e as WindowModel).airPermeability &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Window && value !== (e as WindowModel).airPermeability && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.Window &&
            e.foundationId === windowModel.foundationId &&
            value !== (e as WindowModel).airPermeability &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      case Scope.OnlyThisSide:
        for (const e of elements) {
          if (
            e.type === ObjectType.Window &&
            e.parentId === windowModel.parentId &&
            value !== (e as WindowModel).airPermeability &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      default:
        if (value !== windowModel?.airPermeability) {
          return true;
        }
        break;
    }
    return false;
  };

  const updateValue = (value: number) => {
    if (!windowModel) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, number | undefined>();
        for (const e of elements) {
          if (e.type === ObjectType.Window && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const window = e as WindowModel;
            oldValuesSelected.set(e.id, window.airPermeability ?? 0);
            updateById(window.id, value);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Air Permeability for Selected Windows',
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: value,
          undo: () => {
            undoInMap(undoableChangeSelected.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, number>,
              undoableChangeSelected.newValue as number,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldValuesAll = new Map<string, number | undefined>();
        for (const e of elements) {
          if (e.type === ObjectType.Window && !e.locked) {
            const window = e as WindowModel;
            oldValuesAll.set(e.id, window.airPermeability ?? 0);
            updateById(window.id, value);
          }
        }
        const undoableChangeAll = {
          name: 'Set Air Permeability for All Windows',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            undoInMap(undoableChangeAll.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, number>, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (windowModel.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number | undefined>();
          for (const e of elements) {
            if (e.type === ObjectType.Window && e.foundationId === windowModel.foundationId && !e.locked) {
              const window = e as WindowModel;
              oldValuesAboveFoundation.set(e.id, window.airPermeability ?? 0);
              updateById(window.id, value);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Air Permeability for All Windows Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: windowModel.foundationId,
            undo: () => {
              undoInMap(undoableChangeAboveFoundation.oldValues as Map<string, number>);
            },
            redo: () => {
              updateInMap(
                undoableChangeAboveFoundation.oldValues as Map<string, number>,
                undoableChangeAboveFoundation.newValue as number,
              );
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.OnlyThisSide: {
        if (windowModel.parentId) {
          const oldValues = new Map<string, number>();
          for (const e of elements) {
            if (e.type === ObjectType.Window && e.parentId === windowModel.parentId && !e.locked) {
              const window = e as WindowModel;
              oldValues.set(e.id, window.airPermeability ?? 0);
              updateById(window.id, value);
            }
          }
          const undoableChangeOnSameWall = {
            name: 'Set Air Permeability for All Windows On the Same Wall',
            timestamp: Date.now(),
            oldValues: oldValues,
            newValue: value,
            groupId: windowModel.parentId,
            undo: () => {
              undoInMap(undoableChangeOnSameWall.oldValues as Map<string, number>);
            },
            redo: () => {
              updateInMap(
                undoableChangeOnSameWall.oldValues as Map<string, number>,
                undoableChangeOnSameWall.newValue as number,
              );
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSameWall);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      default: {
        if (windowModel) {
          const updatedWindow = getElementById(windowModel.id) as WindowModel;
          const oldValue = updatedWindow.airPermeability ?? windowModel.airPermeability ?? 0;
          const undoableChange = {
            name: 'Set Window Air Permeability',
            timestamp: Date.now(),
            oldValue: oldValue,
            newValue: value,
            changedElementId: windowModel.id,
            changedElementType: windowModel.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(windowModel.id, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
    }
    setCommonStore((state) => {
      state.actionState.windowAirPermeability = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    updateValue(inputValue);
  };

  return (
    <Dialog width={550} title={i18n.t('word.AirPermeability', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={7}>
          <InputNumber
            min={0}
            max={100}
            style={{ width: 120 }}
            step={0.1}
            precision={1}
            value={inputValue}
            formatter={(a) => Number(a).toFixed(1)}
            onChange={(value) => {
              if (value === null) return;
              setInputValue(value);
            }}
          />
          <div style={{ paddingTop: '4px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0, 100]
            <br />
            {i18n.t('word.Unit', lang)}: m³/(h·m²)
            <br />
            <br />
            {i18n.t('shared.Class', lang)} 1: 50 m³/(h·m²)
            <br />
            {i18n.t('shared.Class', lang)} 2: 27 m³/(h·m²)
            <br />
            {i18n.t('shared.Class', lang)} 3: 9 m³/(h·m²)
            <br />
            {i18n.t('shared.Class', lang)} 4: 3 m³/(h·m²)
          </div>
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
        >
          <Radio.Group onChange={(e) => useStore.getState().setWindowActionScope(e.target.value)} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('windowMenu.OnlyThisWindow', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisSide}>
                {i18n.t('windowMenu.AllWindowsOnSurface', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('windowMenu.AllWindowsAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('windowMenu.AllSelectedWindows', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('windowMenu.AllWindows', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default WindowPermeabilityInput;
