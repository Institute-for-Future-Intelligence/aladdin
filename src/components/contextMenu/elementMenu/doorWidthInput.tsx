/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { DoorModel } from '../../../models/DoorModel';

const DoorWidthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const language = useStore(Selector.language);
  const selectedElement = useStore(Selector.selectedElement) as DoorModel;
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.doorActionScope);
  const setActionScope = useStore(Selector.setDoorActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);
  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);
  const getParent = useStore(Selector.getParent);

  const doorModel = useStore((state) => {
    if (selectedElement) {
      for (const e of state.elements) {
        if (e.id === selectedElement.id) {
          return e as DoorModel;
        }
      }
    }
    return null;
  });
  const parent = doorModel ? getParent(doorModel) : null;
  const currentValue = useMemo(() => {
    const v = doorModel ? doorModel.lx : 1;
    if (parent) return v * parent.lx;
    return v;
  }, [doorModel?.lx, parent?.lx]);

  const [inputValue, setInputValue] = useState<number>(currentValue);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

  useEffect(() => {
    if (doorModel) {
      setInputValue(doorModel?.lx * (parent ? parent.lx : 1) ?? 1);
    }
  }, [doorModel?.lx]);

  const updateById = (id: string, value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          (e as DoorModel).lx = parent ? value / parent.lx : value;
          break;
        }
      }
    });
  };

  const undoInMap = (map: Map<string, number>) => {
    for (const [id, val] of map.entries()) {
      updateById(id, val);
    }
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    for (const id of map.keys()) {
      updateById(id, value);
    }
  };

  const setValue = (value: number) => {
    if (!doorModel) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldValuesAll = new Map<string, number | undefined>();
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.type === ObjectType.Door && !e.locked) {
              const door = e as DoorModel;
              oldValuesAll.set(e.id, door.lx * (parent ? parent.lx : 1));
              door.lx = parent ? value / parent.lx : value;
            }
          }
        });
        const undoableChangeAll = {
          name: 'Set Width for All Doors',
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
      case Scope.OnlyThisSide:
        if (doorModel.parentId) {
          const oldValues = new Map<string, number>();
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.type === ObjectType.Door && e.parentId === doorModel.parentId && !e.locked) {
                const door = e as DoorModel;
                oldValues.set(e.id, door.lx * (parent ? parent.lx : 1));
                door.lx = parent ? value / parent.lx : value;
              }
            }
          });
          const undoableChangeOnSameWall = {
            name: 'Set Width for All Doors On the Same Wall',
            timestamp: Date.now(),
            oldValues: oldValues,
            newValue: value,
            groupId: doorModel.parentId,
            undo: () => {
              undoInMap(undoableChangeOnSameWall.oldValues as Map<string, number>);
            },
            redo: () => {
              updateInMap(
                undoableChangeOnSameWall.oldValues as Map<string, number>,
                undoableChangeOnSameWall.newValue as number,
              );
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSameWall);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (doorModel.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number | undefined>();
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.type === ObjectType.Door && e.foundationId === doorModel.foundationId && !e.locked) {
                const door = e as DoorModel;
                oldValuesAboveFoundation.set(e.id, door.lx * (parent ? parent.lx : 1));
                door.lx = parent ? value / parent.lx : value;
              }
            }
          });
          const undoableChangeAboveFoundation = {
            name: 'Set Width for All Doors Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: doorModel.foundationId,
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
        if (doorModel) {
          const updatedDoor = getElementById(doorModel.id) as DoorModel;
          const oldValue = (updatedDoor.lx ?? doorModel.lx ?? 0.1) * (parent ? parent.lx : 1);
          const undoableChange = {
            name: 'Set Door Width',
            timestamp: Date.now(),
            oldValue: oldValue,
            newValue: value,
            changedElementId: doorModel.id,
            changedElementType: doorModel.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(doorModel.id, value);
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
    setInputValue(currentValue);
    setDialogVisible(false);
  };

  const handleCancel = () => {
    close();
    revertApply();
  };

  const handleOk = () => {
    setValue(inputValue);
    setDialogVisible(false);
    setApplyCount(0);
  };

  const handleApply = () => {
    setValue(inputValue);
  };

  const max =
    parent && doorModel ? 2 * parent.lx * Math.min(Math.abs(0.5 - doorModel.cx), Math.abs(-0.5 - doorModel.cx)) : 100;

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
            {i18n.t('word.Width', lang)}
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
          <Col className="gutter-row" span={6}>
            <InputNumber
              min={0.1}
              max={max}
              style={{ width: 120 }}
              step={0.1}
              precision={2}
              value={inputValue}
              formatter={(a) => Number(a).toFixed(2)}
              onChange={(value) => setInputValue(value)}
              onPressEnter={handleOk}
            />
            <div style={{ paddingTop: '4px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [0.1, {max.toFixed(1)}]{i18n.t('word.MeterAbbreviation', lang)}
            </div>
          </Col>
          <Col className="gutter-row" span={1} style={{ verticalAlign: 'middle', paddingTop: '6px' }}>
            {i18n.t('word.MeterAbbreviation', lang)}
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={17}
          >
            <Radio.Group onChange={(e) => setActionScope(e.target.value)} value={actionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('doorMenu.OnlyThisDoor', lang)}</Radio>
                <Radio value={Scope.OnlyThisSide}>{i18n.t('doorMenu.AllDoorsOnWall', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                  {i18n.t('doorMenu.AllDoorsAboveFoundation', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('doorMenu.AllDoors', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default DoorWidthInput;
