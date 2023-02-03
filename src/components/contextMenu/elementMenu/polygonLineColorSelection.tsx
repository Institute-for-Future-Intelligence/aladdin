/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
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

const PolygonLineColorSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const getParent = useStore(Selector.getParent);
  const updateElementLineColorById = useStore(Selector.updateElementLineColorById);
  const updateElementLineColorOnSurface = useStore(Selector.updateElementLineColorOnSurface);
  const updateElementLineColorAboveFoundation = useStore(Selector.updateElementLineColorAboveFoundation);
  const updateElementLineColorForAll = useStore(Selector.updateElementLineColorForAll);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.polygonActionScope);
  const setActionScope = useStore(Selector.setPolygonActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const polygon = useStore((state) =>
    state.elements.find((e) => e.selected && e.type === ObjectType.Polygon),
  ) as PolygonModel;

  const [selectedColor, setSelectedColor] = useState<string>(polygon?.lineColor ?? 'black');
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    okButtonRef.current?.focus();
  });

  const lang = { lng: language };

  useEffect(() => {
    if (polygon) {
      setSelectedColor(polygon?.lineColor ?? 'black');
    }
  }, [polygon]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (color: string) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Polygon && !e.locked) {
            if (color !== e.lineColor) {
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
            if (e.lineColor !== color) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.Polygon && e.foundationId === polygon?.foundationId && !e.locked) {
            if (e.lineColor !== color) {
              return true;
            }
          }
        }
        break;
      default:
        if (color !== polygon?.lineColor) {
          return true;
        }
    }
    return false;
  };

  const setColor = (value: string) => {
    if (!polygon) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldColorsAll = new Map<string, string>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Polygon) {
            oldColorsAll.set(elem.id, elem.lineColor ?? 'black');
          }
        }
        const undoableChangeAll = {
          name: 'Set Line Color for All Polygons',
          timestamp: Date.now(),
          oldValues: oldColorsAll,
          newValue: value,
          undo: () => {
            for (const [id, color] of undoableChangeAll.oldValues.entries()) {
              updateElementLineColorById(id, color as string);
            }
          },
          redo: () => {
            updateElementLineColorForAll(ObjectType.Polygon, undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateElementLineColorForAll(ObjectType.Polygon, value);
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        const parent = getParent(polygon);
        if (parent) {
          const oldLineColorsOnSurface = new Map<string, string>();
          for (const elem of elements) {
            if (
              elem.type === ObjectType.Polygon &&
              elem.parentId === polygon.parentId &&
              Util.isIdentical(elem.normal, polygon.normal)
            ) {
              oldLineColorsOnSurface.set(elem.id, elem.lineColor ?? 'gray');
            }
          }
          const undoableChangeOnSurface = {
            name: 'Set Line Color for All Polygons on Same Surface',
            timestamp: Date.now(),
            oldValues: oldLineColorsOnSurface,
            newValue: value,
            groupId: polygon.parentId,
            normal: polygon.normal,
            undo: () => {
              for (const [id, lc] of undoableChangeOnSurface.oldValues.entries()) {
                updateElementLineColorById(id, lc as string);
              }
            },
            redo: () => {
              if (undoableChangeOnSurface.groupId) {
                updateElementLineColorOnSurface(
                  ObjectType.Polygon,
                  undoableChangeOnSurface.groupId,
                  undoableChangeOnSurface.normal,
                  undoableChangeOnSurface.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSurface);
          updateElementLineColorOnSurface(ObjectType.Polygon, polygon.parentId, polygon.normal, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (polygon.foundationId) {
          const oldLineColorsAboveFoundation = new Map<string, string>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Polygon && elem.foundationId === polygon.foundationId) {
              oldLineColorsAboveFoundation.set(elem.id, elem.lineColor ?? 'black');
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Line Color for All Polygons Above Foundation',
            timestamp: Date.now(),
            oldValues: oldLineColorsAboveFoundation,
            newValue: value,
            groupId: polygon.foundationId,
            undo: () => {
              for (const [id, lc] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateElementLineColorById(id, lc as string);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateElementLineColorAboveFoundation(
                  ObjectType.Polygon,
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateElementLineColorAboveFoundation(ObjectType.Polygon, polygon.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        const p = getElementById(polygon.id) as PolygonModel;
        const oldColor = p ? p.lineColor : polygon.lineColor;
        const undoableChange = {
          name: 'Set Line Color of Selected Polygon',
          timestamp: Date.now(),
          oldValue: oldColor,
          newValue: value,
          changedElementId: polygon.id,
          changedElementType: polygon.type,
          undo: () => {
            updateElementLineColorById(undoableChange.changedElementId, undoableChange.oldValue as string);
          },
          redo: () => {
            updateElementLineColorById(undoableChange.changedElementId, undoableChange.newValue as string);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateElementLineColorById(polygon.id, value);
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

  const close = () => {
    if (polygon?.lineColor) {
      setSelectedColor(polygon.lineColor);
    }
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
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
        visible={true}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('polygonMenu.LineColor', lang)}
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
          <Button key="OK" type="primary" onClick={ok} ref={okButtonRef}>
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button in the upper-right corner to work
        onCancel={close}
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
              color={selectedColor ?? polygon?.lineColor ?? 'black'}
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
            <Radio.Group onChange={onScopeChange} value={actionScope}>
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

export default PolygonLineColorSelection;
