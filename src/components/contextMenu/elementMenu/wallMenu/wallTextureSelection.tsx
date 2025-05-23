/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, Row, Space } from 'antd';
import { CommonStoreState, useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope, WallTexture } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { WallModel } from 'src/models/WallModel';
import { Util } from '../../../../Util';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';
import WallTextureSelect from './wallTextureSelect';

const WallTextureSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.wallActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const getElementById = useStore(Selector.getElementById);

  const lang = useLanguage();

  const wall = useSelectedElement(ObjectType.Wall) as WallModel | undefined;

  const [selectedTexture, setSelectedTexture] = useState<WallTexture>(wall?.textureType ?? WallTexture.Default);

  const updateById = (id: string, texture: WallTexture) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && e.id === id && !e.locked) {
          (e as WallModel).textureType = texture;
          break;
        }
      }
    });
  };

  const updateConnectedWalls = (texture: WallTexture) => {
    if (!wall) return;
    const connectedWalls = Util.getAllConnectedWalls(wall);
    if (connectedWalls.length === 0) return;
    setCommonStore((state) => {
      for (const w of connectedWalls) {
        if (!w.locked) {
          for (const e of state.elements) {
            if (e.id === w.id && e.type === ObjectType.Wall) {
              (e as WallModel).textureType = texture;
            }
          }
        }
      }
    });
  };

  const updateAboveFoundation = (foundationId: string, texture: WallTexture) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && e.foundationId === foundationId && !e.locked) {
          (e as WallModel).textureType = texture;
        }
      }
    });
  };

  const updateForAll = (texture: WallTexture) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && !e.locked) {
          (e as WallModel).textureType = texture;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, WallTexture>, texture: WallTexture) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && !e.locked && map.has(e.id)) {
          (e as WallModel).textureType = texture;
        }
      }
    });
  };

  const needChange = (value: WallTexture) => {
    if (!wall) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        for (const e of elements) {
          if (
            e.type === ObjectType.Wall &&
            value !== (e as WallModel).textureType &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            return true;
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisType: {
        for (const e of elements) {
          if (e.type === ObjectType.Wall && value !== (e as WallModel).textureType && !e.locked) {
            return true;
          }
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        for (const e of elements) {
          if (
            e.type === ObjectType.Wall &&
            e.foundationId === wall.foundationId &&
            value !== (e as WallModel).textureType &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      }
      case Scope.AllConnectedObjects: {
        const connectedWalls = Util.getAllConnectedWalls(wall);
        for (const e of connectedWalls) {
          if (value !== e.textureType && !e.locked) {
            return true;
          }
        }
        break;
      }
      default: {
        if (value !== wall?.textureType) {
          return true;
        }
        break;
      }
    }
    return false;
  };

  const setTexture = (value: WallTexture) => {
    if (!wall) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldTexturesSelected = new Map<string, WallTexture>();
        for (const e of elements) {
          if (e.type === ObjectType.Wall && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            oldTexturesSelected.set(e.id, (e as WallModel).textureType ?? WallTexture.Default);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Texture for Selected Walls',
          timestamp: Date.now(),
          oldValues: oldTexturesSelected,
          newValue: value,
          undo: () => {
            for (const [id, texture] of undoableChangeSelected.oldValues.entries()) {
              updateById(id, texture as WallTexture);
            }
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, WallTexture>,
              undoableChangeSelected.newValue as WallTexture,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldTexturesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldTexturesAll = new Map<string, WallTexture>();
        for (const e of elements) {
          if (e.type === ObjectType.Wall && !e.locked) {
            oldTexturesAll.set(e.id, (e as WallModel).textureType ?? WallTexture.Default);
          }
        }
        const undoableChangeAll = {
          name: 'Set Texture for All Walls',
          timestamp: Date.now(),
          oldValues: oldTexturesAll,
          newValue: value,
          undo: () => {
            for (const [id, texture] of undoableChangeAll.oldValues.entries()) {
              updateById(id, texture as WallTexture);
            }
          },
          redo: () => {
            updateForAll(undoableChangeAll.newValue as WallTexture);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (wall.foundationId) {
          const oldTexturesAboveFoundation = new Map<string, WallTexture>();
          for (const e of elements) {
            if (e.type === ObjectType.Wall && e.foundationId === wall.foundationId && !e.locked) {
              oldTexturesAboveFoundation.set(e.id, (e as WallModel).textureType);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Texture for All Walls Above Foundation',
            timestamp: Date.now(),
            oldValues: oldTexturesAboveFoundation,
            newValue: value,
            groupId: wall.foundationId,
            undo: () => {
              for (const [id, wt] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, wt as WallTexture);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as WallTexture,
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
        if (wall) {
          const connectedWalls = Util.getAllConnectedWalls(wall);
          const oldValuesConnectedWalls = new Map<string, WallTexture>();
          for (const e of connectedWalls) {
            oldValuesConnectedWalls.set(e.id, e.textureType);
          }
          const undoableChangeConnectedWalls = {
            name: `Set Texture for All Connected Walls`,
            timestamp: Date.now(),
            oldValues: oldValuesConnectedWalls,
            newValue: value,
            undo: () => {
              for (const [id, wh] of undoableChangeConnectedWalls.oldValues.entries()) {
                updateById(id, wh as WallTexture);
              }
            },
            redo: () => {
              updateConnectedWalls(undoableChangeConnectedWalls.newValue as WallTexture);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeConnectedWalls);
          updateConnectedWalls(value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (wall) {
          const updatedWall = getElementById(wall.id) as WallModel;
          const oldTexture = updatedWall?.textureType ?? wall.textureType;
          const undoableChange = {
            name: 'Set Texture of Selected Wall',
            timestamp: Date.now(),
            oldValue: oldTexture,
            newValue: value,
            changedElementId: wall.id,
            changedElementType: wall.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as WallTexture);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as WallTexture);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(wall.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.wallTexture = value;
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
          <WallTextureSelect texture={selectedTexture} setTexture={setSelectedTexture} />
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={15}
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

export default WallTextureSelection;
