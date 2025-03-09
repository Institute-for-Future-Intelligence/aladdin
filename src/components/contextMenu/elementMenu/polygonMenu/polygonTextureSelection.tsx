/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ObjectType, PolygonTexture, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { PolygonModel } from '../../../../models/PolygonModel';
import { Util } from '../../../../Util';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';
import PolygonTextureSelect from './polygonTextureSelect';

const PolygonTextureSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.polygonActionScope);
  const setActionScope = useStore(Selector.setPolygonActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const polygon = useSelectedElement(ObjectType.Polygon) as PolygonModel | undefined;

  const [selectedTexture, setSelectedTexture] = useState<PolygonTexture>(
    polygon?.textureType ?? PolygonTexture.NoTexture,
  );

  const lang = useLanguage();

  const updatePolygonTextureById = (id: string, texture: PolygonTexture) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Polygon && !e.locked) {
          (e as PolygonModel).textureType = texture;
          break;
        }
      }
    });
  };

  const updatePolygonTextureOnSurface = (parentId: string, normal: number[] | undefined, texture: PolygonTexture) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (
          e.type === ObjectType.Polygon &&
          e.parentId === parentId &&
          Util.isIdentical(e.normal, normal) &&
          !e.locked
        ) {
          (e as PolygonModel).textureType = texture;
        }
      }
    });
  };

  const updatePolygonTextureAboveFoundation = (foundationId: string, texture: PolygonTexture) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && e.foundationId === foundationId && !e.locked) {
          (e as PolygonModel).textureType = texture;
        }
      }
    });
  };

  const updatePolygonTextureForAll = (texture: PolygonTexture) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && !e.locked) {
          (e as PolygonModel).textureType = texture;
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (texture: PolygonTexture) => {
    if (!polygon) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Polygon && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            const polygon = e as PolygonModel;
            if (texture !== polygon.textureType) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Polygon && !e.locked) {
            const polygon = e as PolygonModel;
            if (texture !== polygon.textureType) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        for (const e of elements) {
          if (
            e.type === ObjectType.Polygon &&
            e.parentId === polygon.parentId &&
            Util.isIdentical(e.normal, polygon.normal) &&
            !e.locked
          ) {
            if ((e as PolygonModel).textureType !== texture) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.Polygon && e.foundationId === polygon.foundationId && !e.locked) {
            if ((e as PolygonModel).textureType !== texture) {
              return true;
            }
          }
        }
        break;
      default:
        if (texture !== polygon?.textureType) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, PolygonTexture>, value: PolygonTexture) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && !e.locked && map.has(e.id)) {
          (e as PolygonModel).textureType = value;
        }
      }
    });
  };

  const setTexture = (value: PolygonTexture) => {
    if (!polygon) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldTexturesSelected = new Map<string, PolygonTexture>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Polygon && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldTexturesSelected.set(elem.id, (elem as PolygonModel).textureType ?? PolygonTexture.NoTexture);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Texture for Selected Polygons',
          timestamp: Date.now(),
          oldValues: oldTexturesSelected,
          newValue: value,
          undo: () => {
            for (const [id, texture] of undoableChangeSelected.oldValues.entries()) {
              updatePolygonTextureById(id, texture as PolygonTexture);
            }
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, PolygonTexture>,
              undoableChangeSelected.newValue as PolygonTexture,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldTexturesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldTexturesAll = new Map<string, PolygonTexture>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Polygon) {
            oldTexturesAll.set(elem.id, (elem as PolygonModel).textureType ?? PolygonTexture.NoTexture);
          }
        }
        const undoableChangeAll = {
          name: 'Set Texture for All Polygons',
          timestamp: Date.now(),
          oldValues: oldTexturesAll,
          newValue: value,
          undo: () => {
            for (const [id, texture] of undoableChangeAll.oldValues.entries()) {
              updatePolygonTextureById(id, texture as PolygonTexture);
            }
          },
          redo: () => {
            updatePolygonTextureForAll(undoableChangeAll.newValue as PolygonTexture);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updatePolygonTextureForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        const parent = getParent(polygon);
        if (parent) {
          const oldTexturesOnSurface = new Map<string, PolygonTexture>();
          for (const elem of elements) {
            if (
              elem.type === ObjectType.Polygon &&
              elem.parentId === polygon.parentId &&
              Util.isIdentical(elem.normal, polygon.normal)
            ) {
              oldTexturesOnSurface.set(elem.id, (elem as PolygonModel).textureType ?? PolygonTexture.NoTexture);
            }
          }
          const undoableChangeOnSurface = {
            name: 'Set Texture for All Polygons on Same Surface',
            timestamp: Date.now(),
            oldValues: oldTexturesOnSurface,
            newValue: value,
            groupId: polygon.parentId,
            normal: polygon.normal,
            undo: () => {
              for (const [id, tx] of undoableChangeOnSurface.oldValues.entries()) {
                updatePolygonTextureById(id, tx as PolygonTexture);
              }
            },
            redo: () => {
              if (undoableChangeOnSurface.groupId) {
                updatePolygonTextureOnSurface(
                  undoableChangeOnSurface.groupId,
                  undoableChangeOnSurface.normal,
                  undoableChangeOnSurface.newValue as PolygonTexture,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSurface);
          updatePolygonTextureOnSurface(polygon.parentId, polygon.normal, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (polygon.foundationId) {
          const oldTexturesAboveFoundation = new Map<string, PolygonTexture>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Polygon && elem.foundationId === polygon.foundationId) {
              oldTexturesAboveFoundation.set(elem.id, (elem as PolygonModel).textureType ?? PolygonTexture.NoTexture);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Texture for All Polygons Above Foundation',
            timestamp: Date.now(),
            oldValues: oldTexturesAboveFoundation,
            newValue: value,
            groupId: polygon.foundationId,
            undo: () => {
              for (const [id, tx] of undoableChangeAboveFoundation.oldValues.entries()) {
                updatePolygonTextureById(id, tx as PolygonTexture);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updatePolygonTextureAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as PolygonTexture,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updatePolygonTextureAboveFoundation(polygon.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      default: {
        const p = getElementById(polygon.id) as PolygonModel;
        const oldTexture = p ? p.textureType : polygon.textureType;
        const undoableChange = {
          name: 'Set Texture of Selected Polygon',
          timestamp: Date.now(),
          oldValue: oldTexture,
          newValue: value,
          changedElementId: polygon.id,
          changedElementType: polygon.type,
          undo: () => {
            updatePolygonTextureById(undoableChange.changedElementId, undoableChange.oldValue as PolygonTexture);
          },
          redo: () => {
            updatePolygonTextureById(undoableChange.changedElementId, undoableChange.newValue as PolygonTexture);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updatePolygonTextureById(polygon.id, value);
        setApplyCount(applyCount + 1);
        break;
      }
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setTexture(selectedTexture);
  };

  return (
    <Dialog width={500} title={i18n.t('polygonMenu.FillTexture', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={10}>
          <PolygonTextureSelect texture={selectedTexture} setTexture={setSelectedTexture} />
        </Col>
        <Col
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={14}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio style={{ width: '100%' }} value={Scope.OnlyThisObject}>
                {i18n.t('polygonMenu.OnlyThisPolygon', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeOnSurface}>
                {i18n.t('polygonMenu.AllPolygonsOnSurface', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('polygonMenu.AllPolygonsAboveFoundation', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllSelectedObjectsOfThisType}>
                {i18n.t('polygonMenu.AllSelectedPolygons', lang)}
              </Radio>
              <Radio style={{ width: '100%' }} value={Scope.AllObjectsOfThisType}>
                {i18n.t('polygonMenu.AllPolygons', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default PolygonTextureSelection;
