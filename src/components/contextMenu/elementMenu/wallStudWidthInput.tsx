/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { WallModel } from '../../../models/WallModel';

const WallStudWidthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const wall = useStore(Selector.selectedElement) as WallModel;
  const addUndoable = useStore(Selector.addUndoable);
  const wallActionScope = useStore(Selector.wallActionScope);
  const setWallActionScope = useStore(Selector.setWallActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);
  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<number>(wall?.studWidth ?? 0.1);

  const lang = { lng: language };

  const updateById = (id: string, val: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Wall && !e.locked) {
          (e as WallModel).studWidth = val;
          break;
        }
      }
    });
  };

  const updateAboveFoundation = (fId: string, val: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.parentId === fId && e.type === ObjectType.Wall && !e.locked) {
          (e as WallModel).studWidth = val;
        }
      }
    });
  };

  const updateForAll = (val: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && !e.locked) {
          (e as WallModel).studWidth = val;
        }
      }
    });
  };

  useEffect(() => {
    if (wall) {
      inputRef.current = wall.studWidth ?? 0.1;
    }
  }, [wall]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setWallActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const setVal = (value: number) => {
    if (!wall) return;
    switch (wallActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldValsAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Wall) {
            oldValsAll.set(elem.id, (elem as WallModel).studWidth ?? 0.1);
          }
        }
        const undoableChangeAll = {
          name: 'Set Stud Width for All Walls',
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
          for (const elem of elements) {
            if (elem.type === ObjectType.Wall && elem.foundationId === wall.foundationId) {
              oldValsAboveFoundation.set(elem.id, (elem as WallModel).studWidth ?? 0.1);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Stud Width for All Walls Above Foundation',
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
        if (wall) {
          const updatedWall = getElementById(wall.id) as WallModel;
          const oldVal = updatedWall.studWidth ?? wall.studWidth ?? 0.1;
          const undoableChange = {
            name: 'Set Wall Stud Width',
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
    inputRef.current = wall.studWidth ?? 0.1;
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setVal(inputRef.current);
    setDialogVisible(false);
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
            {i18n.t('wallMenu.StudWidth', lang)}
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
              min={0.01}
              max={1}
              style={{ width: 120 }}
              step={0.01}
              precision={2}
              value={inputRef.current}
              onChange={(value) => {
                inputRef.current = value;
                setUpdateFlag(!updateFlag);
              }}
              onPressEnter={ok}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [0.05, 1] {i18n.t('word.MeterAbbreviation', lang)}
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

export default WallStudWidthInput;
