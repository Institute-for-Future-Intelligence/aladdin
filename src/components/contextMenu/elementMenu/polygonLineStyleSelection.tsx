/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Modal, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { LineStyle, ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { PolygonModel } from '../../../models/PolygonModel';
import { Util } from '../../../Util';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';

const PolygonLineStyleSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const getParent = useStore(Selector.getParent);
  const updatePolygonLineStyleById = useStore(Selector.updatePolygonLineStyleById);
  const updatePolygonLineStyleOnSurface = useStore(Selector.updatePolygonLineStyleOnSurface);
  const updatePolygonLineStyleAboveFoundation = useStore(Selector.updatePolygonLineStyleAboveFoundation);
  const updatePolygonLineStyleForAll = useStore(Selector.updatePolygonLineStyleForAll);
  const polygon = useStore(Selector.selectedElement) as PolygonModel;
  const addUndoable = useStore(Selector.addUndoable);
  const polygonActionScope = useStore(Selector.polygonActionScope);
  const setPolygonActionScope = useStore(Selector.setPolygonActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const [selectedLineStyle, setSelectedLineStyle] = useState<LineStyle>(polygon?.lineStyle ?? LineStyle.Solid);
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
      setSelectedLineStyle(polygon?.lineStyle ?? LineStyle.Solid);
    }
  }, [polygon]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setPolygonActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (style: LineStyle) => {
    switch (polygonActionScope) {
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

  const setLineStyle = (value: LineStyle) => {
    if (!polygon) return;
    if (!needChange(value)) return;
    switch (polygonActionScope) {
      case Scope.AllObjectsOfThisType:
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
      case Scope.AllObjectsOfThisTypeOnSurface:
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
      case Scope.AllObjectsOfThisTypeAboveFoundation:
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
      default:
        const p = getElementById(polygon.id) as PolygonModel;
        const oldStyle = p ? p.lineStyle : polygon.lineStyle;
        const undoableChange = {
          name: 'Set Line Style of Selected Polygon',
          timestamp: Date.now(),
          oldValue: oldStyle,
          newValue: value,
          changedElementId: polygon.id,
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
    if (polygon?.lineStyle) {
      setSelectedLineStyle(polygon.lineStyle);
    }
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setLineStyle(selectedLineStyle);
    setDialogVisible(false);
    setApplyCount(0);
  };

  return (
    <>
      <Modal
        width={500}
        visible={true}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('polygonMenu.LineStyle', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setLineStyle(selectedLineStyle);
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
            <Select
              style={{ width: '180px' }}
              value={selectedLineStyle}
              onChange={(value) => setSelectedLineStyle(value)}
            >
              <Option key={LineStyle.Solid} value={LineStyle.Solid}>
                <div
                  style={{
                    display: 'inline-block',
                    verticalAlign: 'middle',
                    marginRight: '12px',
                    width: '32px',
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
                    width: '32px',
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
                    width: '32px',
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

export default PolygonLineStyleSelection;
