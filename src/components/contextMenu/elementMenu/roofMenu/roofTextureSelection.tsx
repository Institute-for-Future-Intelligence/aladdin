/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, Row, Space } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope, RoofTexture } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { RoofModel } from 'src/models/RoofModel';
import { useSelectedElement } from '../menuHooks';
import { useLanguage } from 'src/hooks';
import Dialog from '../../dialog';
import RoofTextureSelect from './roofTextureSelect';

const RoofTextureSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.roofActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const setCommonStore = useStore(Selector.set);
  const getElementById = useStore(Selector.getElementById);

  const roof = useSelectedElement(ObjectType.Roof) as RoofModel | undefined;

  const [selectedTexture, setSelectedTexture] = useState<RoofTexture>(roof?.textureType ?? RoofTexture.Default);

  const lang = useLanguage();

  const updateTextureById = (id: string, textureType: RoofTexture) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked) {
            (e as RoofModel).textureType = textureType;
          }
          break;
        }
      }
    });
  };

  const updateTextureInMap = (map: Map<string, RoofTexture>, textureType: RoofTexture) => {
    for (const id of map.keys()) {
      updateTextureById(id, textureType);
    }
  };

  const undoTextureInMap = (map: Map<string, RoofTexture>) => {
    for (const [id, texture] of map.entries()) {
      updateTextureById(id, texture);
    }
  };

  const needChange = (value: RoofTexture) => {
    if (!roof) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (
            e.type === ObjectType.Roof &&
            value !== (e as RoofModel).textureType &&
            !e.locked &&
            useStore.getState().selectedElementIdSet.has(e.id)
          ) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Roof && value !== (e as RoofModel).textureType && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.Roof &&
            e.foundationId === roof.foundationId &&
            value !== (e as RoofModel).textureType &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      default:
        if (value !== roof?.textureType) {
          return true;
        }
        break;
    }
    return false;
  };

  const setTexture = (value: RoofTexture) => {
    if (!roof) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldTexturesSelected = new Map<string, RoofTexture>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Roof && !elem.locked && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldTexturesSelected.set(elem.id, (elem as RoofModel).textureType ?? RoofTexture.Default);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Texture for Selected Roofs',
          timestamp: Date.now(),
          oldValues: oldTexturesSelected,
          newValue: value,
          undo: () => {
            undoTextureInMap(undoableChangeSelected.oldValues as Map<string, RoofTexture>);
          },
          redo: () => {
            updateTextureInMap(
              undoableChangeSelected.oldValues as Map<string, RoofTexture>,
              undoableChangeSelected.newValue as RoofTexture,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateTextureInMap(oldTexturesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldTexturesAll = new Map<string, RoofTexture>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Roof && !elem.locked) {
            oldTexturesAll.set(elem.id, (elem as RoofModel).textureType ?? RoofTexture.Default);
          }
        }
        const undoableChangeAll = {
          name: 'Set Texture for All Roofs',
          timestamp: Date.now(),
          oldValues: oldTexturesAll,
          newValue: value,
          undo: () => {
            undoTextureInMap(undoableChangeAll.oldValues as Map<string, RoofTexture>);
          },
          redo: () => {
            updateTextureInMap(
              undoableChangeAll.oldValues as Map<string, RoofTexture>,
              undoableChangeAll.newValue as RoofTexture,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateTextureInMap(oldTexturesAll, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (roof.foundationId) {
          const oldTexturesAboveFoundation = new Map<string, RoofTexture>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Roof && elem.foundationId === roof.foundationId && !elem.locked) {
              oldTexturesAboveFoundation.set(elem.id, (elem as RoofModel).textureType);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Texture for All Roofs Above Foundation',
            timestamp: Date.now(),
            oldValues: oldTexturesAboveFoundation,
            newValue: value,
            groupId: roof.foundationId,
            undo: () => {
              undoTextureInMap(undoableChangeAboveFoundation.oldValues as Map<string, RoofTexture>);
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateTextureInMap(
                  undoableChangeAboveFoundation.oldValues as Map<string, RoofTexture>,
                  undoableChangeAboveFoundation.newValue as RoofTexture,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateTextureInMap(oldTexturesAboveFoundation, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (roof) {
          const updatedRoof = getElementById(roof.id) as RoofModel;
          const oldTexture = updatedRoof ? updatedRoof.textureType : roof.textureType;
          const undoableChange = {
            name: 'Set Texture of Selected Roof',
            timestamp: Date.now(),
            oldValue: oldTexture,
            newValue: value,
            changedElementId: roof.id,
            changedElementType: roof.type,
            undo: () => {
              updateTextureById(undoableChange.changedElementId, undoableChange.oldValue as RoofTexture);
            },
            redo: () => {
              updateTextureById(undoableChange.changedElementId, undoableChange.newValue as RoofTexture);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateTextureById(roof.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.roofTexture = value;
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
          <RoofTextureSelect texture={selectedTexture} setTexture={setSelectedTexture} />
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={15}
        >
          <Radio.Group onChange={(e) => useStore.getState().setRoofActionScope(e.target.value)} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('roofMenu.OnlyThisRoof', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('roofMenu.AllRoofsAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('roofMenu.AllSelectedRoofs', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('roofMenu.AllRoofs', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default RoofTextureSelection;
