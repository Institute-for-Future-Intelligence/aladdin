/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { CompactPicker } from 'react-color';
import { Col, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { PolygonModel } from '../../../../models/PolygonModel';
import { Util } from '../../../../Util';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';

const PolygonFillColorSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const getParent = useStore(Selector.getParent);
  const updateElementFillColorById = useStore(Selector.updateElementColorById);
  const updateElementFillColorOnSurface = useStore(Selector.updateElementColorOnSurface);
  const updateElementFillColorAboveFoundation = useStore(Selector.updateElementColorAboveFoundation);
  const updateElementFillColorForAll = useStore(Selector.updateElementColorForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.polygonActionScope);
  const setActionScope = useStore(Selector.setPolygonActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const polygon = useSelectedElement(ObjectType.Polygon) as PolygonModel | undefined;

  const [selectedColor, setSelectedColor] = useState<string>(polygon?.color ?? 'gray');

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (color: string) => {
    if (!polygon) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Polygon && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            if (color !== e.color) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Polygon && !e.locked) {
            if (color !== e.color) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.Polygon && e.foundationId === polygon.foundationId && !e.locked) {
            if (e.color !== color) {
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
            if (e.color !== color) {
              return true;
            }
          }
        }
        break;
      default:
        if (color !== polygon.color) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, string>, value: string) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && !e.locked && map.has(e.id)) {
          (e as PolygonModel).color = value;
        }
      }
    });
  };

  const setColor = (value: string) => {
    if (!polygon) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldColorsSelected = new Map<string, string>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Polygon && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldColorsSelected.set(elem.id, elem.color ?? 'gray');
          }
        }
        const undoableChangeSelected = {
          name: 'Set Fill Color for Selected Polygons',
          timestamp: Date.now(),
          oldValues: oldColorsSelected,
          newValue: value,
          undo: () => {
            for (const [id, color] of undoableChangeSelected.oldValues.entries()) {
              updateElementFillColorById(id, color as string);
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
        for (const elem of elements) {
          if (elem.type === ObjectType.Polygon) {
            oldColorsAll.set(elem.id, elem.color ?? 'gray');
          }
        }
        const undoableChangeAll = {
          name: 'Set Fill Color for All Polygons',
          timestamp: Date.now(),
          oldValues: oldColorsAll,
          newValue: value,
          undo: () => {
            for (const [id, color] of undoableChangeAll.oldValues.entries()) {
              updateElementFillColorById(id, color as string);
            }
          },
          redo: () => {
            updateElementFillColorForAll(ObjectType.Polygon, undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateElementFillColorForAll(ObjectType.Polygon, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (polygon.foundationId) {
          const oldFillColorsAboveFoundation = new Map<string, string>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Polygon && elem.foundationId === polygon.foundationId) {
              oldFillColorsAboveFoundation.set(elem.id, elem.color ?? 'gray');
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Fill Color for All Polygons Above Foundation',
            timestamp: Date.now(),
            oldValues: oldFillColorsAboveFoundation,
            newValue: value,
            groupId: polygon.foundationId,
            undo: () => {
              for (const [id, lc] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateElementFillColorById(id, lc as string);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateElementFillColorAboveFoundation(
                  ObjectType.Polygon,
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateElementFillColorAboveFoundation(ObjectType.Polygon, polygon.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        const parent = getParent(polygon);
        if (parent) {
          const oldFillColorsOnSurface = new Map<string, string>();
          for (const elem of elements) {
            if (
              elem.type === ObjectType.Polygon &&
              elem.parentId === polygon.parentId &&
              Util.isIdentical(elem.normal, polygon.normal)
            ) {
              oldFillColorsOnSurface.set(elem.id, elem.color ?? 'gray');
            }
          }
          const undoableChangeOnSurface = {
            name: 'Set Fill Color for All Polygons on Same Surface',
            timestamp: Date.now(),
            oldValues: oldFillColorsOnSurface,
            newValue: value,
            groupId: polygon.parentId,
            normal: polygon.normal,
            undo: () => {
              for (const [id, lc] of undoableChangeOnSurface.oldValues.entries()) {
                updateElementFillColorById(id, lc as string);
              }
            },
            redo: () => {
              if (undoableChangeOnSurface.groupId) {
                updateElementFillColorOnSurface(
                  ObjectType.Polygon,
                  undoableChangeOnSurface.groupId,
                  undoableChangeOnSurface.normal,
                  undoableChangeOnSurface.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSurface);
          updateElementFillColorOnSurface(ObjectType.Polygon, polygon.parentId, polygon.normal, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      default: {
        const p = getElementById(polygon.id) as PolygonModel;
        const oldColor = p ? p.color : polygon.color;
        const undoableChange = {
          name: 'Set Fill Color of Selected Polygon',
          timestamp: Date.now(),
          oldValue: oldColor,
          newValue: value,
          changedElementId: polygon.id,
          changedElementType: polygon.type,
          undo: () => {
            updateElementFillColorById(undoableChange.changedElementId, undoableChange.oldValue as string);
          },
          redo: () => {
            updateElementFillColorById(undoableChange.changedElementId, undoableChange.newValue as string);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateElementFillColorById(polygon.id, value);
        setApplyCount(applyCount + 1);
        break;
      }
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setColor(selectedColor);
  };

  return (
    <Dialog width={600} title={i18n.t('polygonMenu.FillColor', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={12}>
          <CompactPicker
            color={selectedColor ?? polygon?.color ?? 'gray'}
            onChangeComplete={(colorResult) => {
              setSelectedColor(colorResult.hex);
            }}
          />
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={12}
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

export default PolygonFillColorSelection;
