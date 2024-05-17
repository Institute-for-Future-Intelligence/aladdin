/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, Row, Space, Switch } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { WindowModel } from 'src/models/WindowModel';

import { useLanguage } from 'src/hooks';
import Dialog from '../../dialog';

interface WindowBooleanSelectionProps {
  window: WindowModel;
  dataType: string;
  attributeKey: keyof WindowModel;
  setDialogVisible: () => void;
}

const WindowBooleanSelection = ({
  window: windowModel,
  dataType,
  attributeKey,
  setDialogVisible,
}: WindowBooleanSelectionProps) => {
  const elements = useStore(Selector.elements);
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.windowActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const [selected, setSelected] = useState<boolean>(windowModel[attributeKey] as boolean);

  const lang = useLanguage();

  const updateById = (id: string, value: boolean) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id && !e.locked && e.type === ObjectType.Window) {
          ((e as WindowModel)[attributeKey] as boolean) = value;
          break;
        }
      }
    });
  };

  const updateOnSameWall = (wallId: string, value: boolean) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!e.locked && e.type === ObjectType.Window && e.parentId === wallId) {
          ((e as WindowModel)[attributeKey] as boolean) = value;
        }
      }
    });
  };

  const updateAboveFoundation = (foundationId: string, value: boolean) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!e.locked && e.type === ObjectType.Window && e.foundationId === foundationId) {
          ((e as WindowModel)[attributeKey] as boolean) = value;
        }
      }
    });
  };

  const updateForAll = (value: boolean) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!e.locked && e.type === ObjectType.Window) {
          ((e as WindowModel)[attributeKey] as boolean) = value;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, boolean>, value: boolean) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!e.locked && e.type === ObjectType.Window && map.has(e.id)) {
          ((e as WindowModel)[attributeKey] as boolean) = value;
        }
      }
    });
  };

  const undoInMap = (map: Map<string, boolean>) => {
    for (const [id, v] of map.entries()) {
      updateById(id, v);
    }
  };

  const needChange = (value: boolean) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Window && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            if ((e as WindowModel)[attributeKey] !== value) return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Window && !e.locked) {
            if ((e as WindowModel)[attributeKey] !== value) return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.Window && e.foundationId === windowModel.foundationId && !e.locked) {
            if ((e as WindowModel)[attributeKey] !== value) return true;
          }
        }
        break;
      case Scope.OnlyThisSide:
        for (const e of elements) {
          if (e.type === ObjectType.Window && e.parentId === windowModel.parentId && !e.locked) {
            if ((e as WindowModel)[attributeKey] !== value) return true;
          }
        }
        break;
      default:
        if (windowModel[attributeKey] !== value) return true;
        break;
    }
    return false;
  };

  const updateValue = (value: boolean) => {
    if (!windowModel) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldValuesSelected = new Map<string, boolean>();
        for (const e of elements) {
          if (e.type === ObjectType.Window && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            oldValuesSelected.set(e.id, (e as WindowModel)[attributeKey] as boolean);
          }
        }
        const undoableChangeSelected = {
          name: `Set ${dataType} for Selected Windows`,
          timestamp: Date.now(),
          oldValues: oldValuesSelected,
          newValue: value,
          undo: () => {
            undoInMap(undoableChangeSelected.oldValues as Map<string, boolean>);
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, boolean>,
              undoableChangeSelected.newValue as boolean,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldValuesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldValuesAll = new Map<string, boolean>();
        for (const e of elements) {
          if (e.type === ObjectType.Window && !e.locked) {
            oldValuesAll.set(e.id, (e as WindowModel)[attributeKey] as boolean);
          }
        }
        const undoableChangeAll = {
          name: `Set ${dataType} for All Windows`,
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            undoInMap(undoableChangeAll.oldValues as Map<string, boolean>);
          },
          redo: () => {
            updateForAll(undoableChangeAll.newValue as boolean);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (windowModel.foundationId) {
          const oldValuesAboveFoundation = new Map<string, boolean>();
          for (const e of elements) {
            if (e.type === ObjectType.Window && e.foundationId === windowModel.foundationId && !windowModel.locked) {
              oldValuesAboveFoundation.set(e.id, (e as WindowModel)[attributeKey] as boolean);
            }
          }
          const undoableChangeAboveFoundation = {
            name: `Set ${dataType} for All Windows Above Foundation`,
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: windowModel.foundationId,
            undo: () => {
              undoInMap(undoableChangeAboveFoundation.oldValues as Map<string, boolean>);
            },
            redo: () => {
              updateAboveFoundation(
                undoableChangeAboveFoundation.groupId,
                undoableChangeAboveFoundation.newValue as boolean,
              );
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(windowModel.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.OnlyThisSide:
        if (windowModel.parentId) {
          const oldValues = new Map<string, boolean>();
          for (const e of elements) {
            if (e.type === ObjectType.Window && e.parentId === windowModel.parentId && !e.locked) {
              oldValues.set(e.id, (e as WindowModel)[attributeKey] as boolean);
            }
          }
          const undoableChangeOnSameWall = {
            name: `Set ${dataType} for All Windows On the Same Wall`,
            timestamp: Date.now(),
            oldValues: oldValues,
            newValue: value,
            groupId: windowModel.parentId,
            undo: () => {
              undoInMap(undoableChangeOnSameWall.oldValues as Map<string, boolean>);
            },
            redo: () => {
              updateOnSameWall(windowModel.parentId, undoableChangeOnSameWall.newValue as boolean);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSameWall);
          updateOnSameWall(windowModel.parentId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (windowModel) {
          const oldValue = windowModel[attributeKey] as boolean;
          const undoableChange = {
            name: `Set ${dataType} of Selected window`,
            timestamp: Date.now(),
            oldValue: oldValue,
            newValue: value,
            changedElementId: windowModel.id,
            changedElementType: windowModel.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as boolean);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as boolean);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(windowModel.id, value);
          setApplyCount(applyCount + 1);
        }
    }
  };

  const close = () => {
    setDialogVisible();
  };

  const apply = () => {
    if (windowModel[attributeKey] !== selected) {
      updateValue(selected);
    }
  };

  return (
    <Dialog width={500} title={i18n.t(`windowMenu.${dataType}`, lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={4}>
          <Switch
            checked={selected}
            onChange={(checked) => {
              setSelected(checked);
            }}
          />
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={20}
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

export default WindowBooleanSelection;
