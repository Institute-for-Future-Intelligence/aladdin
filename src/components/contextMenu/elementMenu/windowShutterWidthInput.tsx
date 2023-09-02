/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
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
import { useSelectedElement } from './menuHooks';
import Dialog from '../dialog';
import { useLanguage } from 'src/views/hooks';

const WindowShutterWidthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.windowActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);

  const windowModel = useSelectedElement(ObjectType.Window) as WindowModel | undefined;

  const [inputValue, setInputValue] = useState<number>(windowModel?.shutter?.width ?? 0.5);

  const lang = useLanguage();

  const updateById = (id: string, input: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          const w = e as WindowModel;
          if (w.shutter) {
            w.shutter.width = input;
          }
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
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Window && value !== (e as WindowModel).shutter.width && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.Window &&
            e.foundationId === windowModel.foundationId &&
            value !== (e as WindowModel).shutter.width &&
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
            value !== (e as WindowModel).shutter.width &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      default:
        if (value !== windowModel?.shutter.width) {
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
      case Scope.AllObjectsOfThisType:
        const oldValuesAll = new Map<string, number | undefined>();
        for (const e of elements) {
          if (e.type === ObjectType.Window && !e.locked) {
            const w = e as WindowModel;
            if (w.shutter) {
              oldValuesAll.set(e.id, w.shutter.width);
              updateById(w.id, value);
            }
          }
        }
        const undoableChangeAll = {
          name: 'Set Shutter Width for All Windows',
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
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (windowModel.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number | undefined>();
          for (const e of elements) {
            if (e.type === ObjectType.Window && e.foundationId === windowModel.foundationId && !e.locked) {
              const w = e as WindowModel;
              if (w.shutter) {
                oldValuesAboveFoundation.set(e.id, w.shutter.width);
                updateById(w.id, value);
              }
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Shutter Width for All Windows Above Foundation',
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
      case Scope.OnlyThisSide:
        if (windowModel.parentId) {
          const oldValues = new Map<string, number>();
          for (const e of elements) {
            if (e.type === ObjectType.Window && e.parentId === windowModel.parentId && !e.locked) {
              const w = e as WindowModel;
              if (w.shutter) {
                oldValues.set(e.id, w.shutter.width);
                updateById(w.id, value);
              }
            }
          }
          const undoableChangeOnSameWall = {
            name: 'Set Shutter Width for All Windows On the Same Wall',
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
      default:
        if (windowModel) {
          const updatedWindow = getElementById(windowModel.id) as WindowModel;
          const oldValue = updatedWindow.shutter?.width ?? windowModel.shutter?.width ?? 0.5;
          const undoableChange = {
            name: 'Set Window Shutter Width',
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
    }
    setCommonStore((state) => {
      state.actionState.windowShutterWidth = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    updateValue(inputValue);
  };

  return (
    <Dialog width={550} title={i18n.t('windowMenu.ShutterWidth', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={7}>
          <InputNumber
            min={0}
            max={0.5}
            style={{ width: 120 }}
            step={0.01}
            precision={2}
            value={inputValue}
            formatter={(a) => Number(a).toFixed(2)}
            onChange={setInputValue}
          />
          <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [0, 0.5]
          </div>
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
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

export default WindowShutterWidthInput;
