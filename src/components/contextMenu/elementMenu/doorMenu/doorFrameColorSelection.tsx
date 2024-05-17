/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, Row, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { CompactPicker } from 'react-color';
import { DoorModel } from 'src/models/DoorModel';
import { useSelectedElement } from '../menuHooks';
import { useLanguage } from 'src/hooks';
import Dialog from '../../dialog';

const DoorFrameColorSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.doorActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const getElementById = useStore(Selector.getElementById);

  const door = useSelectedElement(ObjectType.Door) as DoorModel | undefined;

  const [selectedColor, setSelectedColor] = useState<string>(door?.frameColor ?? '#ffffff');

  const lang = useLanguage();

  const updateColorById = (id: string, color: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Door) {
            (e as DoorModel).frameColor = color;
          }
          break;
        }
      }
    });
  };

  const updateColorInMap = (map: Map<string, string>, color: string) => {
    for (const id of map.keys()) {
      updateColorById(id, color as string);
    }
  };

  const undoColorInMap = (map: Map<string, string>) => {
    for (const [id, color] of map.entries()) {
      updateColorById(id, color as string);
    }
  };

  const needChange = (color: string) => {
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Door && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            if (color !== (e as DoorModel).frameColor) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Door && !e.locked) {
            if (color !== (e as DoorModel).frameColor) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.Door && e.foundationId === door?.foundationId && !e.locked) {
            if (color !== (e as DoorModel).frameColor) {
              return true;
            }
          }
        }
        break;
      case Scope.OnlyThisSide:
        for (const e of elements) {
          if (e.type === ObjectType.Door && e.parentId === door?.parentId && !e.locked) {
            if (color !== (e as DoorModel).frameColor) {
              return true;
            }
          }
        }
        break;
      default:
        if (color !== door?.frameColor) {
          return true;
        }
        break;
    }
    return false;
  };

  const setColor = (value: string) => {
    if (!door) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldColorsSelected = new Map<string, string>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.Door && !elem.locked && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldColorsSelected.set(elem.id, (elem as DoorModel).frameColor ?? '#ffffff');
          }
        }
        const undoableChangeSelected = {
          name: 'Set Color for Selected Doors',
          timestamp: Date.now(),
          oldValues: oldColorsSelected,
          newValue: value,
          undo: () => {
            undoColorInMap(undoableChangeSelected.oldValues as Map<string, string>);
          },
          redo: () => {
            updateColorInMap(
              undoableChangeSelected.oldValues as Map<string, string>,
              undoableChangeSelected.newValue as string,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateColorInMap(oldColorsSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldColorsAll = new Map<string, string>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.Door && !elem.locked) {
            oldColorsAll.set(elem.id, (elem as DoorModel).frameColor ?? '#ffffff');
          }
        }
        const undoableChangeAll = {
          name: 'Set Color for All Doors',
          timestamp: Date.now(),
          oldValues: oldColorsAll,
          newValue: value,
          undo: () => {
            undoColorInMap(undoableChangeAll.oldValues as Map<string, string>);
          },
          redo: () => {
            updateColorInMap(undoableChangeAll.oldValues as Map<string, string>, undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateColorInMap(oldColorsAll, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (door.foundationId) {
          const oldColorsAboveFoundation = new Map<string, string>();
          for (const elem of useStore.getState().elements) {
            if (elem.type === ObjectType.Door && elem.foundationId === door.foundationId && !door.locked) {
              oldColorsAboveFoundation.set(elem.id, (elem as DoorModel).frameColor ?? '#ffffff');
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Color for All Doors Above Foundation',
            timestamp: Date.now(),
            oldValues: oldColorsAboveFoundation,
            newValue: value,
            groupId: door.foundationId,
            undo: () => {
              undoColorInMap(undoableChangeAboveFoundation.oldValues as Map<string, string>);
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateColorInMap(
                  undoableChangeAboveFoundation.oldValues as Map<string, string>,
                  undoableChangeAboveFoundation.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateColorInMap(oldColorsAboveFoundation, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.OnlyThisSide:
        if (door.parentId) {
          const oldColorsOnSameWall = new Map<string, string>();
          for (const elem of useStore.getState().elements) {
            if (elem.type === ObjectType.Door && elem.parentId === door.parentId && !door.locked) {
              oldColorsOnSameWall.set(elem.id, (elem as DoorModel).frameColor ?? '#ffffff');
            }
          }
          const undoableChangeOnSameWall = {
            name: 'Set Color for All Doors On the Same Wall',
            timestamp: Date.now(),
            oldValues: oldColorsOnSameWall,
            newValue: value,
            groupId: door.parentId,
            undo: () => {
              undoColorInMap(undoableChangeOnSameWall.oldValues as Map<string, string>);
            },
            redo: () => {
              if (undoableChangeOnSameWall.groupId) {
                updateColorInMap(
                  undoableChangeOnSameWall.oldValues as Map<string, string>,
                  undoableChangeOnSameWall.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSameWall);
          updateColorInMap(oldColorsOnSameWall, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (door) {
          const updatedDoor = getElementById(door.id) as DoorModel;
          const oldColor = (updatedDoor ? updatedDoor.frameColor : door.frameColor) ?? '#ffffff';
          const undoableChange = {
            name: 'Set Color of Selected Door',
            timestamp: Date.now(),
            oldValue: oldColor,
            newValue: value,
            changedElementId: door.id,
            changedElementType: door.type,
            undo: () => {
              updateColorById(undoableChange.changedElementId, undoableChange.oldValue as string);
            },
            redo: () => {
              updateColorById(undoableChange.changedElementId, undoableChange.newValue as string);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateColorById(door.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.doorColor = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setColor(selectedColor);
  };

  return (
    <Dialog width={640} title={i18n.t('doorMenu.FrameColor', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={11}>
          <CompactPicker
            color={selectedColor ?? door?.frameColor ?? '#ffffff'}
            onChangeComplete={(colorResult) => {
              setSelectedColor(colorResult.hex);
            }}
          />
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={13}
        >
          <Radio.Group onChange={(e) => useStore.getState().setDoorActionScope(e.target.value)} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('doorMenu.OnlyThisDoor', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisSide}>
                {i18n.t('doorMenu.AllDoorsOnWall', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('doorMenu.AllDoorsAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('doorMenu.AllSelectedDoors', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('doorMenu.AllDoors', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default DoorFrameColorSelection;
