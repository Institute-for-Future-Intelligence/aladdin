/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { PolygonModel } from '../../../models/PolygonModel';
import { Util } from '../../../Util';
import { useSelectedElement } from './menuHooks';

const PolygonOpacityInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.polygonActionScope);
  const setActionScope = useStore(Selector.setPolygonActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);
  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);

  const polygon = useSelectedElement(ObjectType.Polygon) as PolygonModel | undefined;

  const [input, setInput] = useState<number>(polygon?.opacity !== undefined ? polygon.opacity : 1);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

  useEffect(() => {
    if (polygon) {
      setInput(polygon.opacity !== undefined ? polygon.opacity : 1);
    }
  }, [polygon]);

  const updateOpacityById = (id: string, value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          (e as PolygonModel).opacity = value;
          break;
        }
      }
    });
  };

  const undoInMap = (map: Map<string, number>) => {
    for (const [id, val] of map.entries()) {
      updateOpacityById(id, val);
    }
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    for (const id of map.keys()) {
      updateOpacityById(id, value);
    }
  };

  const needChange = (value: number) => {
    if (!polygon) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Polygon && value !== (e as PolygonModel).opacity && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.Polygon &&
            e.foundationId === polygon.foundationId &&
            value !== (e as PolygonModel).opacity &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        for (const e of elements) {
          if (
            e.type === ObjectType.Polygon &&
            e.parentId === polygon.parentId &&
            Util.isIdentical(e.normal, polygon.normal) &&
            value !== (e as PolygonModel).opacity &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      default:
        if (value !== polygon?.opacity) {
          return true;
        }
        break;
    }
    return false;
  };

  const setValue = (value: number) => {
    if (!polygon) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldValuesAll = new Map<string, number | undefined>();
        for (const e of elements) {
          if (e.type === ObjectType.Polygon && !e.locked) {
            const polygon = e as PolygonModel;
            oldValuesAll.set(e.id, polygon.opacity);
            updateOpacityById(polygon.id, value);
          }
        }
        const undoableChangeAll = {
          name: 'Set Opacity for All Polygons',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            undoInMap(undoableChangeAll.oldValues as Map<string, number>);
          },
          redo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, number>, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (polygon.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number | undefined>();
          for (const e of elements) {
            if (e.type === ObjectType.Polygon && e.foundationId === polygon.foundationId && !e.locked) {
              const polygon = e as PolygonModel;
              oldValuesAboveFoundation.set(e.id, polygon.opacity);
              updateOpacityById(polygon.id, value);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Opacity for All Polygons Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: polygon.foundationId,
            undo: () => {
              undoInMap(undoableChangeAboveFoundation.oldValues as Map<string, number>);
            },
            redo: () => {
              updateInMap(
                undoableChangeAboveFoundation.oldValues as Map<string, number>,
                undoableChangeAboveFoundation.newValue as number,
              );
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        if (polygon.parentId) {
          const oldValuesOnSurface = new Map<string, number | undefined>();
          for (const e of elements) {
            if (
              e.type === ObjectType.Polygon &&
              e.parentId === polygon.parentId &&
              Util.isIdentical(e.normal, polygon.normal) &&
              !e.locked
            ) {
              const polygon = e as PolygonModel;
              oldValuesOnSurface.set(e.id, polygon.opacity);
              updateOpacityById(polygon.id, value);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Opacity for All Polygons Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesOnSurface,
            newValue: value,
            groupId: polygon.foundationId,
            undo: () => {
              undoInMap(undoableChangeAboveFoundation.oldValues as Map<string, number>);
            },
            redo: () => {
              updateInMap(
                undoableChangeAboveFoundation.oldValues as Map<string, number>,
                undoableChangeAboveFoundation.newValue as number,
              );
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (polygon) {
          const updatedPolygon = getElementById(polygon.id) as PolygonModel;
          const oldOpacity =
            updatedPolygon.opacity !== undefined
              ? updatedPolygon.opacity
              : polygon.opacity !== undefined
              ? polygon.opacity
              : 1;
          const undoableChange = {
            name: 'Set Polygon Opacity',
            timestamp: Date.now(),
            oldValue: oldOpacity,
            newValue: value,
            changedElementId: polygon.id,
            changedElementType: polygon.type,
            undo: () => {
              updateOpacityById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateOpacityById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateOpacityById(polygon.id, value);
          setApplyCount(applyCount + 1);
        }
    }
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
    if (!polygon) return;
    setInput(polygon.opacity !== undefined ? polygon.opacity : 1);
    setDialogVisible(false);
  };

  const handleCancel = () => {
    close();
    revertApply();
  };

  const handleOk = () => {
    setValue(input);
    setDialogVisible(false);
    setApplyCount(0);
  };

  const handleApply = () => {
    setValue(input);
  };

  return (
    <>
      <Modal
        width={550}
        visible={true}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('polygonMenu.Opacity', lang)}
          </div>
        }
        footer={[
          <Button key="Apply" onClick={handleApply}>
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button key="Cancel" onClick={handleCancel}>
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button key="OK" type="primary" onClick={handleOk}>
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
          <Col className="gutter-row" span={7}>
            <InputNumber
              min={0}
              max={1}
              style={{ width: 120 }}
              step={0.1}
              precision={1}
              value={input}
              formatter={(a) => Number(a).toFixed(1)}
              onChange={(value) => setInput(value)}
              onPressEnter={handleOk}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [0, 1]
            </div>
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={17}
          >
            <Radio.Group onChange={(e) => setActionScope(e.target.value)} value={actionScope}>
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

export default PolygonOpacityInput;
