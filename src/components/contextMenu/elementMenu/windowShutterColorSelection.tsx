/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
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
import { useColorPicker, useSelectedElement } from './menuHooks';
import Dialog from '../dialog';
import { useLanguage } from 'src/views/hooks';

const WindowShutterColorSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.windowActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const getElementById = useStore(Selector.getElementById);

  const windowModel = useSelectedElement(ObjectType.Window) as WindowModel | undefined;

  const [selectedColor, onColorChange] = useColorPicker(windowModel?.shutter?.color ?? '#808080');

  const lang = useLanguage();

  const updateById = (id: string, color: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked) {
            const w = e as WindowModel;
            if (w.shutter) {
              w.shutter.color = color;
            }
          }
          break;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, string>, color: string) => {
    for (const id of map.keys()) {
      updateById(id, color);
    }
  };

  const undoInMap = (map: Map<string, string>) => {
    for (const [id, color] of map.entries()) {
      updateById(id, color);
    }
  };

  const needChange = (value: string) => {
    if (!windowModel) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Window && value !== (e as WindowModel).shutter.color && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.Window &&
            e.foundationId === windowModel.foundationId &&
            value !== (e as WindowModel).shutter.color &&
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
            value !== (e as WindowModel).shutter.color &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      default:
        if (value !== windowModel?.shutter.color) {
          return true;
        }
        break;
    }
    return false;
  };

  const updateColor = (value: string) => {
    if (!windowModel) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldValuesAll = new Map<string, string>();
        for (const e of elements) {
          if (e.type === ObjectType.Window && !e.locked) {
            oldValuesAll.set(e.id, (e as WindowModel).shutter?.color ?? '#808080');
          }
        }
        const undoableChangeAll = {
          name: 'Set Shutter Color for All Windows',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            undoInMap(undoableChangeAll.oldValues as Map<string, string>);
          },
          redo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, string>, undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateInMap(oldValuesAll, value);
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (windowModel.foundationId) {
          const oldValuesAboveFoundation = new Map<string, string>();
          for (const e of elements) {
            if (e.type === ObjectType.Window && e.foundationId === windowModel.foundationId && !windowModel.locked) {
              oldValuesAboveFoundation.set(e.id, (e as WindowModel).shutter?.color ?? '#808080');
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Shutter Color for All Windows Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: windowModel.foundationId,
            undo: () => {
              undoInMap(undoableChangeAboveFoundation.oldValues as Map<string, string>);
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateInMap(
                  undoableChangeAboveFoundation.oldValues as Map<string, string>,
                  undoableChangeAboveFoundation.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateInMap(oldValuesAboveFoundation, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.OnlyThisSide:
        if (windowModel.parentId) {
          const oldValues = new Map<string, string>();
          for (const e of elements) {
            if (e.type === ObjectType.Window && e.parentId === windowModel.parentId && !e.locked) {
              const w = e as WindowModel;
              if (w.shutter) {
                oldValues.set(e.id, w.shutter.color);
              }
            }
          }
          const undoableChangeOnSameWall = {
            name: 'Set Shutter Color for All Windows On the Same Wall',
            timestamp: Date.now(),
            oldValues: oldValues,
            newValue: value,
            groupId: windowModel.parentId,
            undo: () => {
              undoInMap(undoableChangeOnSameWall.oldValues as Map<string, string>);
            },
            redo: () => {
              updateInMap(
                undoableChangeOnSameWall.oldValues as Map<string, string>,
                undoableChangeOnSameWall.newValue as string,
              );
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSameWall);
          updateInMap(oldValues, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (windowModel) {
          const updatedWindow = getElementById(windowModel.id) as WindowModel;
          const oldColor = (updatedWindow ? updatedWindow.tint : windowModel.tint) ?? '#808080';
          const undoableChange = {
            name: 'Set Shutter Color of Selected window',
            timestamp: Date.now(),
            oldValue: oldColor,
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
    }
    setCommonStore((state) => {
      state.actionState.windowShutterColor = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    updateColor(selectedColor);
  };

  return (
    <Dialog width={640} title={i18n.t('windowMenu.ShutterColor', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={11}>
          <CompactPicker color={selectedColor} onChangeComplete={onColorChange} />
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={13}
        >
          <Radio.Group onChange={(e) => useStore.getState().setWindowActionScope(e.target.value)} value={actionScope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('windowMenu.OnlyThisWindow', lang)}</Radio>
              <Radio value={Scope.OnlyThisSide}>{i18n.t('windowMenu.AllWindowsOnSurface', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('windowMenu.AllWindowsAboveFoundation', lang)}
              </Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('windowMenu.AllWindows', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default WindowShutterColorSelection;
