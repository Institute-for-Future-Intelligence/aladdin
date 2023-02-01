/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { WallModel } from '../../../models/WallModel';

interface WallNumberInputProps {
  wall: WallModel;
  dataType: string;
  attributeKey: keyof WallModel;
  range: [min: number, max: number];
  step: number;
  setDialogVisible: () => void;
  unit?: string;
}

const WallNumberInput = ({
  wall,
  dataType,
  attributeKey,
  range,
  step,
  unit,
  setDialogVisible,
}: WallNumberInputProps) => {
  const language = useStore(Selector.language);
  const addUndoable = useStore(Selector.addUndoable);
  const wallActionScope = useStore(Selector.wallActionScope);
  const setWallActionScope = useStore(Selector.setWallActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);
  const setCommonStore = useStore(Selector.set);

  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<number>(wall[attributeKey] as number);

  const lang = { lng: language };

  const updateActionState = (val: number) => {
    setCommonStore((state) => {
      switch (attributeKey) {
        case 'ly':
          state.actionState.wallThickness = val;
          break;
        case 'lz':
          state.actionState.wallHeight = val;
          break;
        case 'opacity':
          state.actionState.wallOpacity = val;
          break;
        case 'structureSpacing':
          state.actionState.wallStructureSpacing = val;
          break;
        case 'structureWidth':
          state.actionState.wallStructureWidth = val;
          break;
        case 'eaveLength':
          state.actionState.wallEaveLength = val;
          break;
      }
    });
  };

  const updateById = (id: string, val: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Wall && !e.locked) {
          ((e as WallModel)[attributeKey] as number) = val;
          break;
        }
      }
    });
    updateActionState(val);
  };

  const updateAboveFoundation = (fId: string, val: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.parentId === fId && e.type === ObjectType.Wall && !e.locked) {
          ((e as WallModel)[attributeKey] as number) = val;
        }
      }
    });
    updateActionState(val);
  };

  const updateForAll = (val: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && !e.locked) {
          ((e as WallModel)[attributeKey] as number) = val;
        }
      }
    });
    updateActionState(val);
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setWallActionScope(e.target.value);
  };

  const setVal = (value: number) => {
    if (!wall) return;
    switch (wallActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldValsAll = new Map<string, number>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.Wall) {
            oldValsAll.set(elem.id, (elem as WallModel)[attributeKey] as number);
          }
        }
        const undoableChangeAll = {
          name: `Set ${dataType} for All Walls`,
          timestamp: Date.now(),
          oldValues: oldValsAll,
          newValue: value,
          undo: () => {
            for (const [id, wh] of undoableChangeAll.oldValues.entries()) {
              updateById(id, wh as number);
            }
          },
          redo: () => {
            updateForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(value);
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (wall.foundationId) {
          const oldValsAboveFoundation = new Map<string, number>();
          for (const elem of useStore.getState().elements) {
            if (elem.type === ObjectType.Wall && elem.foundationId === wall.foundationId) {
              oldValsAboveFoundation.set(elem.id, (elem as WallModel)[attributeKey] as number);
            }
          }
          const undoableChangeAboveFoundation = {
            name: `Set ${dataType} for All Walls Above Foundation`,
            timestamp: Date.now(),
            oldValues: oldValsAboveFoundation,
            newValue: value,
            groupId: wall.foundationId,
            undo: () => {
              for (const [id, wh] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, wh as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(wall.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        const oldVal = wall[attributeKey] as number;
        const undoableChange = {
          name: `Set Wall ${dataType}`,
          timestamp: Date.now(),
          oldValue: oldVal,
          newValue: value,
          changedElementId: wall.id,
          changedElementType: wall.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(wall.id, value);
        setApplyCount(applyCount + 1);
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
    inputRef.current = wall[attributeKey] as number;
    setDialogVisible();
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setVal(inputRef.current);
    setDialogVisible();
    setApplyCount(0);
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
            {i18n.t(`wallMenu.${dataType}`, lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setVal(inputRef.current);
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
          <Col className="gutter-row" span={6}>
            <InputNumber
              min={range[0]}
              max={range[1]}
              style={{ width: 120 }}
              step={step}
              precision={2}
              defaultValue={wall[attributeKey] as number}
              onChange={(val) => (inputRef.current = val)}
              onPressEnter={ok}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [{range.toString()}] {unit}
            </div>
          </Col>
          <Col className="gutter-row" span={1} style={{ verticalAlign: 'middle', paddingTop: '6px' }}>
            {unit ?? ' '}
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={17}
          >
            <Radio.Group onChange={onScopeChange} value={wallActionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('wallMenu.OnlyThisWall', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                  {i18n.t('wallMenu.AllWallsAboveFoundation', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('wallMenu.AllWalls', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default WallNumberInput;
