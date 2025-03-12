/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, Row, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope, DoorTexture } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { DoorModel } from 'src/models/DoorModel';
import { useSelectedElement } from '../menuHooks';
import { useLanguage } from 'src/hooks';
import Dialog from '../../dialog';
import DoorTextureSelect from './doorTextureSelect';

const DoorTextureSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.doorActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const setCommonStore = useStore(Selector.set);
  const getElementById = useStore(Selector.getElementById);

  const door = useSelectedElement(ObjectType.Door) as DoorModel | undefined;

  const [selectedTexture, setSelectedTexture] = useState<DoorTexture>(door?.textureType ?? DoorTexture.Default);

  const lang = useLanguage();

  const updateTextureById = (id: string, textureType: DoorTexture) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked) {
            (e as DoorModel).textureType = textureType;
          }
          break;
        }
      }
    });
  };

  const updateTextureInMap = (map: Map<string, DoorTexture>, textureType: DoorTexture) => {
    for (const id of map.keys()) {
      updateTextureById(id, textureType);
    }
  };

  const undoTextureInMap = (map: Map<string, DoorTexture>) => {
    for (const [id, texture] of map.entries()) {
      updateTextureById(id, texture);
    }
  };

  const needChange = (value: DoorTexture) => {
    if (!door) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (
            e.type === ObjectType.Door &&
            value !== (e as DoorModel).textureType &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Door && value !== (e as DoorModel).textureType && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.Door &&
            e.foundationId === door.foundationId &&
            value !== (e as DoorModel).textureType &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      case Scope.OnlyThisSide:
        for (const e of elements) {
          if (
            e.type === ObjectType.Door &&
            e.parentId === door.parentId &&
            value !== (e as DoorModel).textureType &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      default:
        if (value !== door?.textureType) {
          return true;
        }
        break;
    }
    return false;
  };

  const setTexture = (value: DoorTexture) => {
    if (!door) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldTexturesSelected = new Map<string, DoorTexture>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.Door && !elem.locked && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldTexturesSelected.set(elem.id, (elem as DoorModel).textureType ?? DoorTexture.Default);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Texture for Selected Doors',
          timestamp: Date.now(),
          oldValues: oldTexturesSelected,
          newValue: value,
          undo: () => {
            undoTextureInMap(undoableChangeSelected.oldValues as Map<string, DoorTexture>);
          },
          redo: () => {
            updateTextureInMap(
              undoableChangeSelected.oldValues as Map<string, DoorTexture>,
              undoableChangeSelected.newValue as DoorTexture,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateTextureInMap(oldTexturesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldTexturesAll = new Map<string, DoorTexture>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.Door && !elem.locked) {
            oldTexturesAll.set(elem.id, (elem as DoorModel).textureType ?? DoorTexture.Default);
          }
        }
        const undoableChangeAll = {
          name: 'Set Texture for All Doors',
          timestamp: Date.now(),
          oldValues: oldTexturesAll,
          newValue: value,
          undo: () => {
            undoTextureInMap(undoableChangeAll.oldValues as Map<string, DoorTexture>);
          },
          redo: () => {
            updateTextureInMap(
              undoableChangeAll.oldValues as Map<string, DoorTexture>,
              undoableChangeAll.newValue as DoorTexture,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateTextureInMap(oldTexturesAll, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (door.foundationId) {
          const oldTexturesAboveFoundation = new Map<string, DoorTexture>();
          for (const elem of useStore.getState().elements) {
            if (elem.type === ObjectType.Door && elem.foundationId === door.foundationId && !elem.locked) {
              oldTexturesAboveFoundation.set(elem.id, (elem as DoorModel).textureType);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Texture for All Doors Above Foundation',
            timestamp: Date.now(),
            oldValues: oldTexturesAboveFoundation,
            newValue: value,
            groupId: door.foundationId,
            undo: () => {
              undoTextureInMap(undoableChangeAboveFoundation.oldValues as Map<string, DoorTexture>);
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateTextureInMap(
                  undoableChangeAboveFoundation.oldValues as Map<string, DoorTexture>,
                  undoableChangeAboveFoundation.newValue as DoorTexture,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateTextureInMap(oldTexturesAboveFoundation, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.OnlyThisSide:
        if (door.parentId) {
          const oldTexturesOnSameWall = new Map<string, DoorTexture>();
          for (const elem of useStore.getState().elements) {
            if (elem.type === ObjectType.Door && elem.parentId === door.parentId && !elem.locked) {
              oldTexturesOnSameWall.set(elem.id, (elem as DoorModel).textureType);
            }
          }
          const undoableChangeOnSameWall = {
            name: 'Set Texture for All Doors On the Same Wall',
            timestamp: Date.now(),
            oldValues: oldTexturesOnSameWall,
            newValue: value,
            groupId: door.parentId,
            undo: () => {
              undoTextureInMap(undoableChangeOnSameWall.oldValues as Map<string, DoorTexture>);
            },
            redo: () => {
              if (undoableChangeOnSameWall.groupId) {
                updateTextureInMap(
                  undoableChangeOnSameWall.oldValues as Map<string, DoorTexture>,
                  undoableChangeOnSameWall.newValue as DoorTexture,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSameWall);
          updateTextureInMap(oldTexturesOnSameWall, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (door) {
          const updatedDoor = getElementById(door.id) as DoorModel;
          const oldTexture = updatedDoor ? updatedDoor.textureType : door.textureType;
          const undoableChange = {
            name: 'Set Texture of Selected Door',
            timestamp: Date.now(),
            oldValue: oldTexture,
            newValue: value,
            changedElementId: door.id,
            changedElementType: door.type,
            undo: () => {
              updateTextureById(undoableChange.changedElementId, undoableChange.oldValue as DoorTexture);
            },
            redo: () => {
              updateTextureById(undoableChange.changedElementId, undoableChange.newValue as DoorTexture);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateTextureById(door.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.doorTexture = value;
    });
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setTexture(selectedTexture);
  };

  return (
    <Dialog width={550} title={i18n.t('word.Texture', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={9}>
          <DoorTextureSelect texture={selectedTexture} setTexture={setSelectedTexture} />
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={15}
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

export default DoorTextureSelection;
