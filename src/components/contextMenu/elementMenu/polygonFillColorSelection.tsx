/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { CompactPicker } from 'react-color';
import { Button, Col, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { PolygonModel } from '../../../models/PolygonModel';
import { Util } from '../../../Util';

const PolygonFillColorSelection = ({
  dialogVisible,
  setDialogVisible,
}: {
  dialogVisible: boolean;
  setDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateElementFillColorById = useStore(Selector.updateElementColorById);
  const updateElementFillColorOnSurface = useStore(Selector.updateElementColorOnSurface);
  const updateElementFillColorAboveFoundation = useStore(Selector.updateElementColorAboveFoundation);
  const updateElementFillColorForAll = useStore(Selector.updateElementColorForAll);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);
  const polygonActionScope = useStore(Selector.polygonActionScope);
  const setPolygonActionScope = useStore(Selector.setPolygonActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const polygon = getSelectedElement() as PolygonModel;
  const [selectedColor, setSelectedColor] = useState<string>(polygon?.color ?? 'gray');
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

  useEffect(() => {
    if (polygon) {
      setSelectedColor(polygon?.color ?? 'gray');
    }
  }, [polygon]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setPolygonActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (color: string) => {
    switch (polygonActionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Polygon && !e.locked) {
            if (color !== e.color) {
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
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.Polygon && e.foundationId === polygon.foundationId && !e.locked) {
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

  const setColor = (value: string) => {
    if (!polygon) return;
    if (!needChange(value)) return;
    switch (polygonActionScope) {
      case Scope.AllObjectsOfThisType:
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
      case Scope.AllObjectsOfThisTypeOnSurface:
        if (polygon.parentId) {
          const parent = getElementById(polygon.parentId);
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
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
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
      default:
        const oldColor = polygon.color;
        const undoableChange = {
          name: 'Set Fill Color of Selected Polygon',
          timestamp: Date.now(),
          oldValue: oldColor,
          newValue: value,
          changedElementId: polygon.id,
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
    }
    setUpdateFlag(!updateFlag);
  };

  const onStart = (event: DraggableEvent, uiData: DraggableData) => {
    if (dragRef.current) {
      const { clientWidth, clientHeight } = window.document.documentElement;
      const targetRect = dragRef.current.getBoundingClientRect();
      setBounds({
        left: -targetRect.left + uiData.x,
        right: clientWidth - (targetRect.right - uiData.x),
        top: -targetRect.top + uiData.y,
        bottom: clientHeight - (targetRect?.bottom - uiData.y),
      });
    }
  };

  const cancel = () => {
    if (polygon?.color) {
      setSelectedColor(polygon.color);
    }
    setDialogVisible(false);
    revertApply();
  };

  const ok = () => {
    setColor(selectedColor);
    setDialogVisible(false);
    setApplyCount(0);
  };

  return (
    <>
      <Modal
        width={600}
        visible={dialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('polygonMenu.FillColor', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setColor(selectedColor);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button key="Cancel" onClick={cancel}>
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button key="OK" type="primary" onClick={ok}>
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button in the upper-right corner to work
        onCancel={cancel}
        maskClosable={false}
        destroyOnClose={false}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
        <Row gutter={6}>
          <Col className="gutter-row" span={12}>
            <CompactPicker
              color={selectedColor ?? polygon?.color ?? 'gray'}
              onChangeComplete={(colorResult) => {
                setSelectedColor(colorResult.hex);
                setUpdateFlag(!updateFlag);
              }}
            />
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={12}
          >
            <Radio.Group onChange={onScopeChange} value={polygonActionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('polygonMenu.OnlyThisPolygon', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisTypeOnSurface}>
                  {i18n.t('polygonMenu.AllPolygonsOnSurface', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                  {i18n.t('polygonMenu.AllPolygonsAboveFoundation', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('polygonMenu.AllPolygons', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default PolygonFillColorSelection;
