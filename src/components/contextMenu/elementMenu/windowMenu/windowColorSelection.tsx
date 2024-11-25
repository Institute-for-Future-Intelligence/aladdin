/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Col, Radio, Row, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { CompactPicker } from 'react-color';
import { WindowModel } from 'src/models/WindowModel';
import { WindowDataType } from './windowMenu';

import { useColorPicker } from '../menuHooks';
import { useLanguage } from 'src/hooks';
import Dialog from '../../dialog';

interface WindowColorSelectionProps {
  window: WindowModel;
  dataType: string;
  attributeKey: keyof WindowModel;
  setDialogVisible: () => void;
}

const WindowColorSelection = ({
  window: windowModel,
  dataType,
  attributeKey,
  setDialogVisible,
}: WindowColorSelectionProps) => {
  const elements = useStore(Selector.elements);
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.windowActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const [selectedItem, onItemChange] = useColorPicker((windowModel[attributeKey] as string) ?? '#ffffff');

  const lang = useLanguage();

  const updateById = (id: string, val: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Window) {
            ((e as WindowModel)[attributeKey] as string) = val;
          }
          break;
        }
      }
    });
  };

  const updateOnSameWall = (wallId: string, val: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!e.locked && e.type === ObjectType.Window && e.parentId === wallId) {
          ((e as WindowModel)[attributeKey] as string) = val;
        }
      }
    });
  };

  const updateAboveFoundation = (foundationId: string, val: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!e.locked && e.type === ObjectType.Window && e.foundationId === foundationId) {
          ((e as WindowModel)[attributeKey] as string) = val;
        }
      }
    });
  };

  const updateForAll = (val: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!e.locked && e.type === ObjectType.Window) {
          ((e as WindowModel)[attributeKey] as string) = val;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, string>, val: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!e.locked && e.type === ObjectType.Window && map.has(e.id)) {
          ((e as WindowModel)[attributeKey] as string) = val;
        }
      }
    });
  };

  const undoInMap = (map: Map<string, string>) => {
    for (const [id, val] of map.entries()) {
      updateById(id, val);
    }
  };

  const needChange = (value: string) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (
            e.type === ObjectType.Window &&
            value !== (e as WindowModel)[attributeKey] &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Window && value !== (e as WindowModel)[attributeKey] && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.Window &&
            e.foundationId === windowModel.foundationId &&
            value !== (e as WindowModel)[attributeKey] &&
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
            value !== (e as WindowModel)[attributeKey] &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      default:
        if (value !== windowModel[attributeKey]) {
          return true;
        }
        break;
    }
    return false;
  };

  const updateValue = (value: string) => {
    if (!windowModel) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, string>();
        for (const e of elements) {
          if (e.type === ObjectType.Window && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            oldValuesSelected.set(e.id, (e as WindowModel)[attributeKey] as string);
          }
        }
        const undoableChangeSelected = {
          name: `Set ${dataType} for Selected Windows`,
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: value,
          undo: () => {
            undoInMap(undoableChangeSelected.oldValues as Map<string, string>);
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, string>,
              undoableChangeSelected.newValue as string,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldValuesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldValuesAll = new Map<string, string>();
        for (const e of elements) {
          if (e.type === ObjectType.Window && !e.locked) {
            oldValuesAll.set(e.id, (e as WindowModel)[attributeKey] as string);
          }
        }
        const undoableChangeAll = {
          name: `Set ${dataType} for All Windows`,
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            undoInMap(undoableChangeAll.oldValues as Map<string, string>);
          },
          redo: () => {
            updateForAll(undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (windowModel.foundationId) {
          const oldValuesAboveFoundation = new Map<string, string>();
          for (const e of elements) {
            if (e.type === ObjectType.Window && e.foundationId === windowModel.foundationId && !windowModel.locked) {
              oldValuesAboveFoundation.set(e.id, (e as WindowModel)[attributeKey] as string);
            }
          }
          const undoableChangeAboveFoundation = {
            name: `Set ${dataType} for All Windows Above Foundation`,
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: windowModel.foundationId,
            undo: () => {
              undoInMap(undoableChangeAboveFoundation.oldValues as Map<string, string>);
            },
            redo: () => {
              updateAboveFoundation(
                undoableChangeAboveFoundation.groupId,
                undoableChangeAboveFoundation.newValue as string,
              );
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(windowModel.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.OnlyThisSide: {
        if (windowModel.parentId) {
          const oldValues = new Map<string, string>();
          for (const e of elements) {
            if (e.type === ObjectType.Window && e.parentId === windowModel.parentId && !e.locked) {
              oldValues.set(e.id, (e as WindowModel)[attributeKey] as string);
            }
          }
          const undoableChangeOnSameWall = {
            name: `Set ${dataType} for All Windows On the Same Wall`,
            timestamp: Date.now(),
            oldValues: oldValues,
            newValue: value,
            groupId: windowModel.parentId,
            undo: () => {
              undoInMap(undoableChangeOnSameWall.oldValues as Map<string, string>);
            },
            redo: () => {
              updateOnSameWall(windowModel.parentId, undoableChangeOnSameWall.newValue as string);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSameWall);
          updateOnSameWall(windowModel.parentId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      default: {
        if (windowModel) {
          const oldValue = windowModel[attributeKey] as string;
          const undoableChange = {
            name: `Set ${dataType} of Selected window`,
            timestamp: Date.now(),
            oldValue: oldValue,
            newValue: value,
            changedElementId: windowModel.id,
            changedElementType: windowModel.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as string);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as string);
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
      switch (dataType) {
        case WindowDataType.Tint:
          state.actionState.windowTint = value;
          break;
        case WindowDataType.MullionColor:
          state.actionState.windowMullionColor = value;
          break;
        case WindowDataType.Color:
          state.actionState.windowColor = value;
          break;
      }
    });
  };

  const close = () => {
    setDialogVisible();
  };

  const apply = () => {
    if (windowModel[attributeKey] !== selectedItem) {
      updateValue(selectedItem);
    }
  };

  return (
    <Dialog width={640} title={i18n.t(`windowMenu.${dataType}`, lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={11}>
          <CompactPicker color={selectedItem ?? '#73D8FF'} onChangeComplete={onItemChange} />
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={13}
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

export default WindowColorSelection;
