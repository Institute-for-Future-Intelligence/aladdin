/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Col, Radio, Row, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { WallModel } from '../../../../models/WallModel';
import { Util } from '../../../../Util';
import { useColorPicker, useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/views/hooks';
import { CompactPicker } from 'react-color';

const WallColorSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.wallActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const getElementById = useStore(Selector.getElementById);

  const wall = useSelectedElement(ObjectType.Wall) as WallModel | undefined;

  const lang = useLanguage();

  const [selectedColor, onColorChange] = useColorPicker(wall?.color ?? '#ffffff');

  const updateById = (id: string, color: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && e.id === id && !e.locked) {
          e.color = color;
          break;
        }
      }
    });
  };

  const updateConnectedWalls = (color: string) => {
    if (!wall) return;
    const connectedWalls = Util.getAllConnectedWalls(wall);
    if (connectedWalls.length === 0) return;
    setCommonStore((state) => {
      for (const w of connectedWalls) {
        if (!w.locked) {
          for (const e of state.elements) {
            if (e.id === w.id && e.type === ObjectType.Wall) {
              e.color = color;
            }
          }
        }
      }
    });
  };

  const updateAboveFoundation = (foundationId: string, color: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && e.foundationId === foundationId && !e.locked) {
          e.color = color;
        }
      }
    });
  };

  const updateForAll = (color: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && !e.locked) {
          e.color = color;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, string>, value: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && !e.locked && map.has(e.id)) {
          e.color = value;
        }
      }
    });
  };

  const needChange = (value: string) => {
    if (!wall) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (
            e.type === ObjectType.Wall &&
            value !== e.color &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Wall && value !== e.color && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.Wall && e.foundationId === wall.foundationId && value !== e.color && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllConnectedObjects:
        const connectedWalls = Util.getAllConnectedWalls(wall);
        for (const e of connectedWalls) {
          if (value !== e.color && !e.locked) {
            return true;
          }
        }
        break;
      default:
        if (value !== wall?.color) {
          return true;
        }
        break;
    }
    return false;
  };

  const updateColor = (value: string) => {
    if (!wall) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldColorsSelected = new Map<string, string>();
        for (const e of elements) {
          if (e.type === ObjectType.Wall && useStore.getState().selectedElementIdSet.has(e.id)) {
            oldColorsSelected.set(e.id, e.color ?? '#ffffff');
          }
        }
        const undoableChangeSelected = {
          name: 'Set Color for Selected Walls',
          timestamp: Date.now(),
          oldValues: oldColorsSelected,
          newValue: value,
          undo: () => {
            for (const [id, color] of undoableChangeSelected.oldValues.entries()) {
              updateById(id, color as string);
            }
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
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldColorsAll = new Map<string, string>();
        for (const e of elements) {
          if (e.type === ObjectType.Wall) {
            oldColorsAll.set(e.id, e.color ?? '#ffffff');
          }
        }
        const undoableChangeAll = {
          name: 'Set Color for All Walls',
          timestamp: Date.now(),
          oldValues: oldColorsAll,
          newValue: value,
          undo: () => {
            for (const [id, color] of undoableChangeAll.oldValues.entries()) {
              updateById(id, color as string);
            }
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
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (wall.foundationId) {
          const oldColorsAboveFoundation = new Map<string, string>();
          for (const e of elements) {
            if (e.type === ObjectType.Wall && e.foundationId === wall.foundationId) {
              oldColorsAboveFoundation.set(e.id, e.color ?? '#ffffff');
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Color for All Walls Above Foundation',
            timestamp: Date.now(),
            oldValues: oldColorsAboveFoundation,
            newValue: value,
            groupId: wall.foundationId,
            undo: () => {
              for (const [id, color] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, color as string);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(wall.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.AllConnectedObjects:
        const connectedWalls = Util.getAllConnectedWalls(wall);
        const oldValuesConnectedWalls = new Map<string, string>();
        for (const e of connectedWalls) {
          oldValuesConnectedWalls.set(e.id, e.color ?? '#ffffff');
        }
        const undoableChangeConnectedWalls = {
          name: `Set Color for All Connected Walls`,
          timestamp: Date.now(),
          oldValues: oldValuesConnectedWalls,
          newValue: value,
          undo: () => {
            for (const [id, wh] of undoableChangeConnectedWalls.oldValues.entries()) {
              updateById(id, wh as string);
            }
          },
          redo: () => {
            updateConnectedWalls(undoableChangeConnectedWalls.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeConnectedWalls);
        updateConnectedWalls(value);
        setApplyCount(applyCount + 1);

        break;
      default:
        if (wall) {
          const updatedWall = getElementById(wall.id) as WallModel;
          const oldColor = updatedWall?.color ?? wall.color ?? '#ffffff';
          const undoableChange = {
            name: 'Set Color of Selected Wall',
            timestamp: Date.now(),
            oldValue: oldColor,
            newValue: value,
            changedElementId: wall.id,
            changedElementType: wall.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as string);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as string);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(wall.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.wallColor = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    updateColor(selectedColor);
  };

  return (
    <Dialog width={640} title={i18n.t('wallMenu.Color', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={11}>
          <CompactPicker color={selectedColor} onChangeComplete={onColorChange} />
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={13}
        >
          <Radio.Group onChange={(e) => useStore.getState().setWallActionScope(e.target.value)} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('wallMenu.OnlyThisWall', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllConnectedObjects}>
                {i18n.t('wallMenu.AllConnectedWalls', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('wallMenu.AllWallsAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('wallMenu.AllSelectedWalls', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('wallMenu.AllWalls', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default WallColorSelection;
