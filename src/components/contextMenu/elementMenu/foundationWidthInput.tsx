/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { FoundationModel } from '../../../models/FoundationModel';
import { Vector2 } from 'three';
import { Util } from '../../../Util';
import { UndoableSizeGroupChange } from '../../../undo/UndoableSizeGroupChange';
import { UndoableSizeChange } from '../../../undo/UndoableSizeChange';
import { ZERO_TOLERANCE } from '../../../constants';

const FoundationWidthInput = ({
  widthDialogVisible,
  setWidthDialogVisible,
}: {
  widthDialogVisible: boolean;
  setWidthDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateElementCxById = useStore(Selector.updateElementCxById);
  const updateElementLxById = useStore(Selector.updateElementLxById);
  const updateElementLxForAll = useStore(Selector.updateElementLxForAll);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const getChildren = useStore(Selector.getChildren);
  const setElementPosition = useStore(Selector.setElementPosition);
  const addUndoable = useStore(Selector.addUndoable);
  const foundationActionScope = useStore(Selector.foundationActionScope);
  const setFoundationActionScope = useStore(Selector.setFoundationActionScope);

  const foundation = getSelectedElement() as FoundationModel;
  const [inputLx, setInputLx] = useState<number>(foundation?.lx ?? 0);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);

  const oldChildrenPositionsMapRef = useRef<Map<string, Vector2>>(new Map<string, Vector2>());
  const newChildrenPositionsMapRef = useRef<Map<string, Vector2>>(new Map<string, Vector2>());
  const unnormalizedPosMapRef = useRef<Map<string, Vector2>>(new Map());
  const dragRef = useRef<HTMLDivElement | null>(null);
  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = { lng: language };

  useEffect(() => {
    if (foundation) {
      setInputLx(foundation.lx);
    }
  }, [foundation]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setFoundationActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const containsAllChildren = (lx: number) => {
    switch (foundationActionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation) {
            const f = e as FoundationModel;
            const children = getChildren(f.id);
            if (children.length > 0) {
              if (!Util.doesNewSizeContainAllChildren(f, children, lx, f.ly)) {
                return false;
              }
            }
          }
        }
        break;
      default:
        const children = getChildren(foundation.id);
        if (children.length > 0) {
          return Util.doesNewSizeContainAllChildren(foundation, children, lx, foundation.ly);
        }
    }
    return true;
  };

  const rejectChange = (lx: number) => {
    // check if the new width will still contain all children of the foundations in the selected scope
    if (!containsAllChildren(lx)) {
      return true;
    }
    // other check?
    return false;
  };

  const updateLxWithChildren = (parent: FoundationModel, value: number) => {
    // store children's relative positions
    const children = getChildren(parent.id);
    const origin = new Vector2(0, 0);
    const azimuth = parent.rotation[2];
    unnormalizedPosMapRef.current.clear(); // this map is for one-time use with each foundation
    if (children.length > 0) {
      for (const c of children) {
        switch (c.type) {
          case ObjectType.Wall:
            break;
          case ObjectType.SolarPanel:
          case ObjectType.Sensor:
            const p = new Vector2(c.cx * parent.lx, c.cy * parent.ly).rotateAround(origin, azimuth);
            unnormalizedPosMapRef.current.set(c.id, p);
            oldChildrenPositionsMapRef.current.set(c.id, new Vector2(c.cx, c.cy));
            break;
        }
      }
    }
    // update foundation's length
    updateElementLxById(parent.id, value);
    // update children's relative positions
    if (children.length > 0) {
      for (const c of children) {
        const p = unnormalizedPosMapRef.current.get(c.id);
        if (p) {
          const relativePos = new Vector2(p.x, p.y).rotateAround(origin, -azimuth);
          const newCx = relativePos.x / value;
          updateElementCxById(c.id, newCx);
          newChildrenPositionsMapRef.current.set(c.id, new Vector2(newCx, c.cy));
        }
      }
    }
  };

  const needChange = (lx: number) => {
    switch (foundationActionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked) {
            const f = e as FoundationModel;
            if (Math.abs(f.lx - lx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(foundation?.lx - lx) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setLx = (value: number) => {
    if (!foundation) return;
    if (!needChange(value)) return;
    const oldLx = foundation.lx;
    rejectedValue.current = undefined;
    rejectRef.current = rejectChange(value);
    if (rejectRef.current) {
      rejectedValue.current = value;
      setInputLx(oldLx);
    } else {
      oldChildrenPositionsMapRef.current.clear();
      newChildrenPositionsMapRef.current.clear();
      switch (foundationActionScope) {
        case Scope.AllObjectsOfThisType:
          const oldLxsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Foundation) {
              oldLxsAll.set(elem.id, elem.lx);
            }
          }
          // the following also populates the above two maps in ref
          for (const elem of elements) {
            if (elem.type === ObjectType.Foundation) {
              updateLxWithChildren(elem as FoundationModel, value);
            }
          }
          const undoableChangeAll = {
            name: 'Set Width for All Foundations',
            timestamp: Date.now(),
            oldSizes: oldLxsAll,
            newSize: value,
            oldChildrenPositionsMap: new Map(oldChildrenPositionsMapRef.current),
            newChildrenPositionsMap: new Map(newChildrenPositionsMapRef.current),
            undo: () => {
              for (const [id, lx] of undoableChangeAll.oldSizes.entries()) {
                updateElementLxById(id, lx as number);
              }
              if (undoableChangeAll.oldChildrenPositionsMap.size > 0) {
                for (const [id, p] of undoableChangeAll.oldChildrenPositionsMap.entries()) {
                  setElementPosition(id, p.x, p.y);
                }
              }
            },
            redo: () => {
              updateElementLxForAll(ObjectType.Foundation, undoableChangeAll.newSize as number);
              if (undoableChangeAll.newChildrenPositionsMap.size > 0) {
                for (const [id, p] of undoableChangeAll.newChildrenPositionsMap.entries()) {
                  setElementPosition(id, p.x, p.y);
                }
              }
            },
          } as UndoableSizeGroupChange;
          addUndoable(undoableChangeAll);
          break;
        default:
          updateLxWithChildren(foundation, value);
          const undoableChange = {
            name: 'Set Foundation Width',
            timestamp: Date.now(),
            oldSize: oldLx,
            newSize: value,
            resizedElementId: foundation.id,
            oldChildrenPositionsMap: new Map(oldChildrenPositionsMapRef.current),
            newChildrenPositionsMap: new Map(newChildrenPositionsMapRef.current),
            undo: () => {
              updateElementLxById(foundation.id, undoableChange.oldSize as number);
              if (undoableChange.oldChildrenPositionsMap.size > 0) {
                for (const [id, p] of undoableChange.oldChildrenPositionsMap.entries()) {
                  setElementPosition(id, p.x, p.y);
                }
              }
            },
            redo: () => {
              updateElementLxById(foundation.id, undoableChange.newSize as number);
              if (undoableChange.newChildrenPositionsMap.size > 0) {
                for (const [id, p] of undoableChange.newChildrenPositionsMap.entries()) {
                  setElementPosition(id, p.x, p.y);
                }
              }
            },
          } as UndoableSizeChange;
          addUndoable(undoableChange);
      }
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

  return (
    <>
      <Modal
        width={550}
        visible={widthDialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('word.Width', lang)}
            <label style={{ color: 'red', fontWeight: 'bold' }}>
              {rejectRef.current
                ? ': ' +
                  i18n.t('shared.NotApplicableToSelectedAction', lang) +
                  (rejectedValue.current !== undefined ? ' (' + rejectedValue.current.toFixed(2) + ')' : '')
                : ''}
            </label>
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setLx(inputLx);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button
            key="Cancel"
            onClick={() => {
              setInputLx(foundation?.lx);
              rejectRef.current = false;
              setWidthDialogVisible(false);
            }}
          >
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button
            key="OK"
            type="primary"
            onClick={() => {
              setLx(inputLx);
              if (!rejectRef.current) {
                setWidthDialogVisible(false);
              }
            }}
          >
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button at the upper-right corner to work
        onCancel={() => {
          setInputLx(foundation?.lx);
          rejectRef.current = false;
          setWidthDialogVisible(false);
        }}
        destroyOnClose={false}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
        <Row gutter={6}>
          <Col className="gutter-row" span={6}>
            <InputNumber
              min={1}
              max={1000}
              style={{ width: 120 }}
              step={0.5}
              precision={1}
              value={inputLx}
              formatter={(a) => Number(a).toFixed(1)}
              onChange={(value) => setInputLx(value)}
              onPressEnter={(event) => {
                setLx(inputLx);
                if (!rejectRef.current) {
                  setWidthDialogVisible(false);
                }
              }}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [1, 1000] {i18n.t('word.MeterAbbreviation', lang)}
            </div>
          </Col>
          <Col className="gutter-row" span={1} style={{ verticalAlign: 'middle', paddingTop: '6px' }}>
            {i18n.t('word.MeterAbbreviation', lang)}
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={16}
          >
            <Radio.Group onChange={onScopeChange} value={foundationActionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('foundationMenu.OnlyThisFoundation', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('foundationMenu.AllFoundations', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default FoundationWidthInput;
