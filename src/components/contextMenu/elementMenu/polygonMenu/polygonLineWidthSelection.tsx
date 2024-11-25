/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import { useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { LineStyle, LineWidth, ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { PolygonModel } from '../../../../models/PolygonModel';
import { Util } from '../../../../Util';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';

const PolygonLineWidthSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const getParent = useStore(Selector.getParent);
  const updateElementLineWidthById = useStore(Selector.updateElementLineWidthById);
  const updateElementLineWidthOnSurface = useStore(Selector.updateElementLineWidthOnSurface);
  const updateElementLineWidthAboveFoundation = useStore(Selector.updateElementLineWidthAboveFoundation);
  const updateElementLineWidthForAll = useStore(Selector.updateElementLineWidthForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.polygonActionScope);
  const setActionScope = useStore(Selector.setPolygonActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const polygon = useSelectedElement(ObjectType.Polygon) as PolygonModel | undefined;

  const [selectedLineWidth, setSelectedLineWidth] = useState<LineStyle>(polygon?.lineWidth ?? 1);

  const lang = useLanguage();
  const { Option } = Select;

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (width: number) => {
    if (!polygon) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Polygon && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            if (width !== e.lineWidth) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Polygon && !e.locked) {
            if (width !== e.lineWidth) {
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
            if (e.lineWidth !== width) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.Polygon && e.foundationId === polygon?.foundationId && !e.locked) {
            if (e.lineWidth !== width) {
              return true;
            }
          }
        }
        break;
      default:
        if (width !== polygon?.lineWidth) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && !e.locked && map.has(e.id)) {
          (e as PolygonModel).lineWidth = value;
        }
      }
    });
  };

  const setLineWidth = (value: number) => {
    if (!polygon) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldLineWidthsSelected = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Polygon && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldLineWidthsSelected.set(elem.id, elem.lineWidth ?? 1);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Line Width for Selected Polygons',
          timestamp: Date.now(),
          oldValues: oldLineWidthsSelected,
          newValue: value,
          undo: () => {
            for (const [id, width] of undoableChangeSelected.oldValues.entries()) {
              updateElementLineWidthById(id, width as number);
            }
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, number>,
              undoableChangeSelected.newValue as number,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldLineWidthsSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldLineWidthsAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Polygon) {
            oldLineWidthsAll.set(elem.id, elem.lineWidth ?? 1);
          }
        }
        const undoableChangeAll = {
          name: 'Set Line Width for All Polygons',
          timestamp: Date.now(),
          oldValues: oldLineWidthsAll,
          newValue: value,
          undo: () => {
            for (const [id, width] of undoableChangeAll.oldValues.entries()) {
              updateElementLineWidthById(id, width as number);
            }
          },
          redo: () => {
            updateElementLineWidthForAll(ObjectType.Polygon, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateElementLineWidthForAll(ObjectType.Polygon, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        const parent = getParent(polygon);
        if (parent) {
          const oldLineWidthsOnSurface = new Map<string, number>();
          for (const elem of elements) {
            if (
              elem.type === ObjectType.Polygon &&
              elem.parentId === polygon.parentId &&
              Util.isIdentical(elem.normal, polygon.normal)
            ) {
              oldLineWidthsOnSurface.set(elem.id, elem.lineWidth ?? 1);
            }
          }
          const undoableChangeOnSurface = {
            name: 'Set Line Width for All Polygons on Same Surface',
            timestamp: Date.now(),
            oldValues: oldLineWidthsOnSurface,
            newValue: value,
            groupId: polygon.parentId,
            normal: polygon.normal,
            undo: () => {
              for (const [id, width] of undoableChangeOnSurface.oldValues.entries()) {
                updateElementLineWidthById(id, width as number);
              }
            },
            redo: () => {
              if (undoableChangeOnSurface.groupId) {
                updateElementLineWidthOnSurface(
                  ObjectType.Polygon,
                  undoableChangeOnSurface.groupId,
                  undoableChangeOnSurface.normal,
                  undoableChangeOnSurface.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSurface);
          updateElementLineWidthOnSurface(ObjectType.Polygon, polygon.parentId, polygon.normal, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (polygon.foundationId) {
          const oldLineWidthsAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Polygon && elem.foundationId === polygon.foundationId) {
              oldLineWidthsAboveFoundation.set(elem.id, elem.lineWidth ?? 1);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Line Width for All Polygons Above Foundation',
            timestamp: Date.now(),
            oldValues: oldLineWidthsAboveFoundation,
            newValue: value,
            groupId: polygon.foundationId,
            undo: () => {
              for (const [id, width] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateElementLineWidthById(id, width as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateElementLineWidthAboveFoundation(
                  ObjectType.Polygon,
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateElementLineWidthAboveFoundation(ObjectType.Polygon, polygon.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      default: {
        const p = getElementById(polygon.id) as PolygonModel;
        const oldWidth = p ? p.lineWidth : polygon.lineWidth;
        const undoableChange = {
          name: 'Set Line Width of Selected Polygon',
          timestamp: Date.now(),
          oldValue: oldWidth,
          newValue: value,
          changedElementId: polygon.id,
          changedElementType: polygon.type,
          undo: () => {
            updateElementLineWidthById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateElementLineWidthById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateElementLineWidthById(polygon.id, value);
        setApplyCount(applyCount + 1);
        break;
      }
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setLineWidth(selectedLineWidth);
    setDialogVisible(false);
    setApplyCount(0);
  };

  return (
    <Dialog width={560} title={i18n.t('polygonMenu.LineWidth', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col span={10}>
          <Select
            style={{ width: '200px' }}
            value={selectedLineWidth}
            onChange={(value) => setSelectedLineWidth(value)}
          >
            <Option key={LineWidth.One} value={LineWidth.One}>
              <div
                style={{
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  marginRight: '24px',
                  width: '100%',
                  height: '1px',
                  border: '1px solid dimGray',
                }}
              />
            </Option>

            <Option key={LineWidth.Two} value={LineWidth.Two}>
              <div
                style={{
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  marginRight: '24px',
                  width: '100%',
                  height: '1px',
                  border: '2px solid dimGray',
                }}
              />
            </Option>

            <Option key={LineWidth.Three} value={LineWidth.Three}>
              <div
                style={{
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  marginRight: '24px',
                  width: '100%',
                  height: '1px',
                  border: '3px solid dimGray',
                }}
              />
            </Option>

            <Option key={LineWidth.Four} value={LineWidth.Four}>
              <div
                style={{
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  marginRight: '24px',
                  width: '100%',
                  height: '1px',
                  border: '4px solid dimGray',
                }}
              />
            </Option>

            <Option key={LineWidth.Five} value={LineWidth.Five}>
              <div
                style={{
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  marginRight: '24px',
                  width: '100%',
                  height: '1px',
                  border: '5px solid dimGray',
                }}
              />
            </Option>
          </Select>
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

export default PolygonLineWidthSelection;
