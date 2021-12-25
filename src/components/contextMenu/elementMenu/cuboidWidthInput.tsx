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
import { CuboidModel } from '../../../models/CuboidModel';
import { ZERO_TOLERANCE } from '../../../constants';
import { Util } from '../../../Util';
import { UndoableSizeGroupChange } from '../../../undo/UndoableSizeGroupChange';
import { UndoableSizeChange } from '../../../undo/UndoableSizeChange';

const CuboidWidthInput = ({
  widthDialogVisible,
  setWidthDialogVisible,
}: {
  widthDialogVisible: boolean;
  setWidthDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getChildren = useStore(Selector.getChildren);
  const updateElementLxById = useStore(Selector.updateElementLxById);
  const updateElementLxForAll = useStore(Selector.updateElementLxForAll);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);
  const cuboidActionScope = useStore(Selector.cuboidActionScope);
  const setCuboidActionScope = useStore(Selector.setCuboidActionScope);

  const cuboid = getSelectedElement() as CuboidModel;
  const [inputLx, setInputLx] = useState<number>(cuboid?.lx ?? 0);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);

  const dragRef = useRef<HTMLDivElement | null>(null);
  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = { lng: language };

  useEffect(() => {
    if (cuboid) {
      setInputLx(cuboid.lx);
    }
  }, [cuboid]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setCuboidActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const containsAllChildren = (lx: number) => {
    switch (cuboidActionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Cuboid) {
            const c = e as CuboidModel;
            const children = getChildren(c.id);
            if (children.length > 0) {
              if (!Util.doesNewSizeContainAllChildren(c, children, lx, c.ly)) {
                return false;
              }
            }
          }
        }
        break;
      default:
        const children = getChildren(cuboid.id);
        if (children.length > 0) {
          return Util.doesNewSizeContainAllChildren(cuboid, children, lx, cuboid.ly);
        }
    }
    return true;
  };

  const rejectChange = (lx: number) => {
    // check if the new width will still contain all children of the cuboids in the selected scope
    if (!containsAllChildren(lx)) {
      return true;
    }
    // other check?
    return false;
  };

  const needChange = (lx: number) => {
    switch (cuboidActionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Cuboid && !e.locked) {
            const c = e as CuboidModel;
            if (Math.abs(c.lx - lx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(cuboid?.lx - lx) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setLx = (value: number) => {
    if (!cuboid) return;
    if (!needChange(value)) return;
    const oldLx = cuboid.lx;
    rejectedValue.current = undefined;
    rejectRef.current = rejectChange(value);
    if (rejectRef.current) {
      rejectedValue.current = value;
      setInputLx(oldLx);
    } else {
      switch (cuboidActionScope) {
        case Scope.AllObjectsOfThisType:
          const oldLxsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Cuboid) {
              oldLxsAll.set(elem.id, elem.lx);
            }
          }
          for (const elem of elements) {
            if (elem.type === ObjectType.Cuboid) {
              updateElementLxById(elem.id, value);
            }
          }
          const undoableChangeAll = {
            name: 'Set Width for All Cuboids',
            timestamp: Date.now(),
            oldSizes: oldLxsAll,
            newSize: value,
            undo: () => {
              for (const [id, lx] of undoableChangeAll.oldSizes.entries()) {
                updateElementLxById(id, lx as number);
              }
            },
            redo: () => {
              updateElementLxForAll(ObjectType.Cuboid, undoableChangeAll.newSize as number);
            },
          } as UndoableSizeGroupChange;
          addUndoable(undoableChangeAll);
          break;
        default:
          updateElementLxById(cuboid.id, value);
          const undoableChange = {
            name: 'Set Cuboid Width',
            timestamp: Date.now(),
            oldSize: oldLx,
            newSize: value,
            resizedElementId: cuboid.id,
            undo: () => {
              updateElementLxById(cuboid.id, undoableChange.oldSize as number);
            },
            redo: () => {
              updateElementLxById(cuboid.id, undoableChange.newSize as number);
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
              setInputLx(cuboid?.lx);
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
        // this must be specified for the x button in the upper-right corner to work
        onCancel={() => {
          setInputLx(cuboid?.lx);
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
              max={500}
              style={{ width: 120 }}
              step={0.5}
              precision={1}
              value={inputLx}
              formatter={(a) => Number(a).toFixed(1)}
              onChange={(value) => setInputLx(value)}
              onPressEnter={() => {
                setLx(inputLx);
                if (!rejectRef.current) {
                  setWidthDialogVisible(false);
                }
              }}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [1, 500] {i18n.t('word.MeterAbbreviation', lang)}
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
            <Radio.Group onChange={onScopeChange} value={cuboidActionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('cuboidMenu.OnlyThisCuboid', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('cuboidMenu.AllCuboids', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default CuboidWidthInput;
