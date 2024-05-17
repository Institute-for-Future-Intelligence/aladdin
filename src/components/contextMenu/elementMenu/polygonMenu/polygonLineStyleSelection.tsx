/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import { CommonStoreState, useStore } from '../../../../stores/common';
import * as Selector from '../../../../stores/selector';
import { LineStyle, ObjectType, Scope } from '../../../../types';
import i18n from '../../../../i18n/i18n';
import { UndoableChange } from '../../../../undo/UndoableChange';
import { PolygonModel } from '../../../../models/PolygonModel';
import { Util } from '../../../../Util';
import { UndoableChangeGroup } from '../../../../undo/UndoableChangeGroup';
import { useSelectedElement } from '../menuHooks';
import Dialog from '../../dialog';
import { useLanguage } from 'src/hooks';

const PolygonLineStyleSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
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

  const [selectedLineStyle, setSelectedLineStyle] = useState<LineStyle>(polygon?.lineStyle ?? LineStyle.Solid);

  const lang = useLanguage();
  const { Option } = Select;

  const updatePolygonLineStyleById = (id: string, style: LineStyle) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && e.id === id) {
          (e as PolygonModel).lineStyle = style;
          break;
        }
      }
    });
  };

  const updatePolygonLineStyleOnSurface = (parentId: string, normal: number[] | undefined, style: LineStyle) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (
          e.type === ObjectType.Polygon &&
          e.parentId === parentId &&
          Util.isIdentical(e.normal, normal) &&
          !e.locked
        ) {
          (e as PolygonModel).lineStyle = style;
        }
      }
    });
  };

  const updatePolygonLineStyleAboveFoundation = (foundationId: string, style: LineStyle) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && e.foundationId === foundationId && !e.locked) {
          (e as PolygonModel).lineStyle = style;
        }
      }
    });
  };

  const updatePolygonLineStyleForAll = (style: LineStyle) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && !e.locked) {
          (e as PolygonModel).lineStyle = style;
        }
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const needChange = (style: LineStyle) => {
    if (!polygon) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Polygon && !e.locked && useStore.getState().selectedElementIdSet.has(e.id)) {
            if (style !== (e as PolygonModel).lineStyle) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Polygon && !e.locked) {
            if (style !== (e as PolygonModel).lineStyle) {
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
            if (style !== (e as PolygonModel).lineStyle) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.Polygon && e.foundationId === polygon?.foundationId && !e.locked) {
            if (style !== (e as PolygonModel).lineStyle) {
              return true;
            }
          }
        }
        break;
      default:
        if (style !== polygon?.lineStyle) {
          return true;
        }
    }
    return false;
  };

  const updateInMap = (map: Map<string, LineStyle>, value: LineStyle) => {
    useStore.getState().set((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Polygon && !e.locked && map.has(e.id)) {
          (e as PolygonModel).lineStyle = value;
        }
      }
    });
  };

  const setLineStyle = (value: LineStyle) => {
    if (!polygon) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllSelectedObjectsOfThisType: {
        const oldLineStylesSelected = new Map<string, LineStyle>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Polygon && useStore.getState().selectedElementIdSet.has(elem.id)) {
            oldLineStylesSelected.set(elem.id, (elem as PolygonModel).lineStyle ?? LineStyle.Solid);
          }
        }
        const undoableChangeSelected = {
          name: 'Set Line Style for Selected Polygons',
          timestamp: Date.now(),
          oldValues: oldLineStylesSelected,
          newValue: value,
          undo: () => {
            for (const [id, style] of undoableChangeSelected.oldValues.entries()) {
              updatePolygonLineStyleById(id, style as LineStyle);
            }
          },
          redo: () => {
            updateInMap(
              undoableChangeSelected.oldValues as Map<string, LineStyle>,
              undoableChangeSelected.newValue as LineStyle,
            );
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeSelected);
        updateInMap(oldLineStylesSelected, value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisType: {
        const oldLineStylesAll = new Map<string, LineStyle>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Polygon) {
            oldLineStylesAll.set(elem.id, (elem as PolygonModel).lineStyle ?? LineStyle.Solid);
          }
        }
        const undoableChangeAll = {
          name: 'Set Line Style for All Polygons',
          timestamp: Date.now(),
          oldValues: oldLineStylesAll,
          newValue: value,
          undo: () => {
            for (const [id, style] of undoableChangeAll.oldValues.entries()) {
              updatePolygonLineStyleById(id, style as LineStyle);
            }
          },
          redo: () => {
            updatePolygonLineStyleForAll(undoableChangeAll.newValue as LineStyle);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updatePolygonLineStyleForAll(value);
        setApplyCount(applyCount + 1);
        break;
      }
      case Scope.AllObjectsOfThisTypeOnSurface: {
        const parent = getParent(polygon);
        if (parent) {
          const oldLineStylesOnSurface = new Map<string, LineStyle>();
          for (const elem of elements) {
            if (
              elem.type === ObjectType.Polygon &&
              elem.parentId === polygon.parentId &&
              Util.isIdentical(elem.normal, polygon.normal)
            ) {
              oldLineStylesOnSurface.set(elem.id, (elem as PolygonModel).lineStyle ?? LineStyle.Solid);
            }
          }
          const undoableChangeOnSurface = {
            name: 'Set Line Style for All Polygons on Same Surface',
            timestamp: Date.now(),
            oldValues: oldLineStylesOnSurface,
            newValue: value,
            groupId: polygon.parentId,
            normal: polygon.normal,
            undo: () => {
              for (const [id, style] of undoableChangeOnSurface.oldValues.entries()) {
                updatePolygonLineStyleById(id, style as LineStyle);
              }
            },
            redo: () => {
              if (undoableChangeOnSurface.groupId) {
                updatePolygonLineStyleOnSurface(
                  undoableChangeOnSurface.groupId,
                  undoableChangeOnSurface.normal,
                  undoableChangeOnSurface.newValue as LineStyle,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSurface);
          updatePolygonLineStyleOnSurface(polygon.parentId, polygon.normal, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      case Scope.AllObjectsOfThisTypeAboveFoundation: {
        if (polygon.foundationId) {
          const oldLineStylesAboveFoundation = new Map<string, LineStyle>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Polygon && elem.foundationId === polygon.foundationId) {
              oldLineStylesAboveFoundation.set(elem.id, (elem as PolygonModel).lineStyle ?? LineStyle.Solid);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Line Style for All Polygons Above Foundation',
            timestamp: Date.now(),
            oldValues: oldLineStylesAboveFoundation,
            newValue: value,
            groupId: polygon.foundationId,
            undo: () => {
              for (const [id, style] of undoableChangeAboveFoundation.oldValues.entries()) {
                updatePolygonLineStyleById(id, style as LineStyle);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updatePolygonLineStyleAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as LineStyle,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updatePolygonLineStyleAboveFoundation(polygon.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      }
      default: {
        const p = getElementById(polygon.id) as PolygonModel;
        const oldStyle = p ? p.lineStyle : polygon.lineStyle;
        const undoableChange = {
          name: 'Set Line Style of Selected Polygon',
          timestamp: Date.now(),
          oldValue: oldStyle,
          newValue: value,
          changedElementId: polygon.id,
          changedElementType: polygon.type,
          undo: () => {
            updatePolygonLineStyleById(undoableChange.changedElementId, undoableChange.oldValue as LineStyle);
          },
          redo: () => {
            updatePolygonLineStyleById(undoableChange.changedElementId, undoableChange.newValue as LineStyle);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updatePolygonLineStyleById(polygon.id, value);
        setApplyCount(applyCount + 1);
        break;
      }
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setLineStyle(selectedLineStyle);
  };

  return (
    <Dialog width={600} title={i18n.t('polygonMenu.LineStyle', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={10}>
          <Select
            style={{ width: '200px' }}
            value={selectedLineStyle}
            onChange={(value) => setSelectedLineStyle(value)}
          >
            <Option key={LineStyle.Solid} value={LineStyle.Solid}>
              <div
                style={{
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  marginRight: '12px',
                  width: '48px',
                  height: '1px',
                  border: '1px solid dimGray',
                }}
              >
                {' '}
              </div>
              {i18n.t('polygonMenu.SolidLine', lang)}
            </Option>

            <Option key={LineStyle.Dashed} value={LineStyle.Dashed}>
              <div
                style={{
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  marginRight: '12px',
                  width: '48px',
                  height: '1px',
                  border: '1px dashed dimGray',
                }}
              >
                {' '}
              </div>
              {i18n.t('polygonMenu.DashedLine', lang)}
            </Option>

            <Option key={LineStyle.Dotted} value={LineStyle.Dotted}>
              <div
                style={{
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  marginRight: '12px',
                  width: '48px',
                  height: '1px',
                  border: '1px dotted dimGray',
                }}
              >
                {' '}
              </div>
              {i18n.t('polygonMenu.DottedLine', lang)}
            </Option>
          </Select>
        </Col>
        <Col
          className="gutter-row"
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

export default PolygonLineStyleSelection;
