/*
 * @Copyright 2023-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, Row, Select, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { WindowModel } from 'src/models/WindowModel';
import { WindowDataType } from './windowMenu';
import { useLanguage } from 'src/hooks';
import Dialog from '../../dialog';

interface WindowOptionSelectionProps {
  window: WindowModel;
  dataType: string;
  attributeKey: keyof WindowModel;
  options: string[];
  optionsText: string[];
  setDialogVisible: () => void;
}

const { Option } = Select;

const WindowOptionSelection = ({
  window,
  dataType,
  attributeKey,
  options,
  optionsText,
  setDialogVisible,
}: WindowOptionSelectionProps) => {
  const elements = useStore(Selector.elements);
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.windowActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const [selectedOption, setSelectedOption] = useState<string>(window[attributeKey] as string);

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
    if (!window) return;
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
            e.foundationId === window.foundationId &&
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
            e.parentId === window.parentId &&
            value !== (e as WindowModel)[attributeKey] &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      default:
        if (value !== window[attributeKey]) {
          return true;
        }
        break;
    }
    return false;
  };

  const updateValue = (value: string) => {
    if (!window) return;
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
        if (window.foundationId) {
          const oldValuesAboveFoundation = new Map<string, string>();
          for (const e of elements) {
            if (e.type === ObjectType.Window && e.foundationId === window.foundationId && !window.locked) {
              oldValuesAboveFoundation.set(e.id, (e as WindowModel)[attributeKey] as string);
            }
          }
          const undoableChangeAboveFoundation = {
            name: `Set ${dataType} for All Windows Above Foundation`,
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: window.foundationId,
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
          updateAboveFoundation(window.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.OnlyThisSide: {
        if (window.parentId) {
          const oldValues = new Map<string, string>();
          for (const e of elements) {
            if (e.type === ObjectType.Window && e.parentId === window.parentId && !e.locked) {
              oldValues.set(e.id, (e as WindowModel)[attributeKey] as string);
            }
          }
          const undoableChangeOnSameWall = {
            name: `Set ${dataType} for All Windows On the Same Wall`,
            timestamp: Date.now(),
            oldValues: oldValues,
            newValue: value,
            groupId: window.parentId,
            undo: () => {
              undoInMap(undoableChangeOnSameWall.oldValues as Map<string, string>);
            },
            redo: () => {
              updateOnSameWall(window.parentId, undoableChangeOnSameWall.newValue as string);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSameWall);
          updateOnSameWall(window.parentId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      default: {
        if (window) {
          const oldValue = window[attributeKey] as string;
          const undoableChange = {
            name: `Set ${dataType} of Selected window`,
            timestamp: Date.now(),
            oldValue: oldValue,
            newValue: value,
            changedElementId: window.id,
            changedElementType: window.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as string);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as string);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(window.id, value);
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
    updateValue(selectedOption);
  };

  return (
    <Dialog width={560} title={i18n.t(`windowMenu.${dataType}`, lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={8}>
          <Select style={{ width: '150px' }} value={selectedOption} onChange={(value) => setSelectedOption(value)}>
            {options.map((e, index) => {
              return (
                <Option key={e} value={e}>
                  {optionsText[index]}
                </Option>
              );
            })}
          </Select>
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={16}
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

export default WindowOptionSelection;
