/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Modal, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { LineStyle, LineWidth, ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { PolygonModel } from '../../../models/PolygonModel';
import { Util } from '../../../Util';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';

const PolygonLineWidthSelection = ({
  dialogVisible,
  setDialogVisible,
}: {
  dialogVisible: boolean;
  setDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getParent = useStore(Selector.getParent);
  const updateElementLineWidthById = useStore(Selector.updateElementLineWidthById);
  const updateElementLineWidthOnSurface = useStore(Selector.updateElementLineWidthOnSurface);
  const updateElementLineWidthAboveFoundation = useStore(Selector.updateElementLineWidthAboveFoundation);
  const updateElementLineWidthForAll = useStore(Selector.updateElementLineWidthForAll);
  const polygon = useStore(Selector.selectedElement) as PolygonModel;
  const addUndoable = useStore(Selector.addUndoable);
  const polygonActionScope = useStore(Selector.polygonActionScope);
  const setPolygonActionScope = useStore(Selector.setPolygonActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const [selectedLineWidth, setSelectedLineWidth] = useState<LineStyle>(polygon?.lineWidth ?? 1);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    okButtonRef.current?.focus();
  });

  const lang = { lng: language };
  const { Option } = Select;

  useEffect(() => {
    if (polygon) {
      setSelectedLineWidth(polygon?.lineWidth ?? 1);
    }
  }, [polygon]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setPolygonActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (width: number) => {
    switch (polygonActionScope) {
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

  const setLineWidth = (value: number) => {
    if (!polygon) return;
    if (!needChange(value)) return;
    switch (polygonActionScope) {
      case Scope.AllObjectsOfThisType:
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
      case Scope.AllObjectsOfThisTypeOnSurface:
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
      case Scope.AllObjectsOfThisTypeAboveFoundation:
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
      default:
        const oldWidth = polygon.lineWidth;
        const undoableChange = {
          name: 'Set Line Width of Selected Polygon',
          timestamp: Date.now(),
          oldValue: oldWidth,
          newValue: value,
          changedElementId: polygon.id,
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
    if (polygon?.lineWidth) {
      setSelectedLineWidth(polygon.lineWidth);
    }
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setLineWidth(selectedLineWidth);
    setDialogVisible(false);
    setApplyCount(0);
  };

  return (
    <>
      <Modal
        width={560}
        visible={dialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('polygonMenu.LineWidth', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setLineWidth(selectedLineWidth);
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
          <Col className="gutter-row" span={10}>
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
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={14}
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

export default PolygonLineWidthSelection;
