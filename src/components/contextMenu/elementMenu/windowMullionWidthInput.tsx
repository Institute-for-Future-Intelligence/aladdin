/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
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
import { WindowModel } from 'src/models/WindowModel';

const MullinoWidthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const language = useStore(Selector.language);
  const windowElement = useStore(Selector.selectedElement) as WindowModel;
  const addUndoable = useStore(Selector.addUndoable);
  const windowActionScope = useStore(Selector.windowActionScope);
  const setWindowActionScope = useStore(Selector.setWindowActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);
  const getElementById = useStore(Selector.getElementById);
  const setCommonStore = useStore(Selector.set);

  const [inputWidth, setInputWidth] = useState<number>(windowElement?.mullionWidth ?? 0.06);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

  useEffect(() => {
    if (windowElement) {
      setInputWidth(windowElement?.mullionWidth ?? 0.06);
    }
  }, [windowElement]);

  const updateRoofMullionWidthById = (id: string, width: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          (e as WindowModel).mullionWidth = width;
          state.selectedElement = e;
          break;
        }
      }
      state.updateWallFlag = !state.updateWallFlag;
    });
  };

  const undoInMap = (map: Map<string, number>) => {
    for (const [id, val] of map.entries()) {
      updateRoofMullionWidthById(id, val);
    }
  };

  const updateInMap = (map: Map<string, number>, value: number) => {
    for (const id of map.keys()) {
      updateRoofMullionWidthById(id, value);
    }
  };

  const setMullionWidth = (value: number) => {
    if (!windowElement) return;
    switch (windowActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldMullionWidthAll = new Map<string, number>();
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.type === ObjectType.Window && !e.locked) {
              oldMullionWidthAll.set(e.id, (e as WindowModel).mullionWidth);
              (e as WindowModel).mullionWidth = value;
            }
          }
        });
        const undoableChangeAll = {
          name: 'Set Mullion Width for All Windows',
          timestamp: Date.now(),
          oldValues: oldMullionWidthAll,
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
        if (windowElement.parentId) {
          const oldMullionWidthOnSameWall = new Map<string, number>();
          setCommonStore((state) => {
            for (const elem of state.elements) {
              if (elem.type === ObjectType.Window && elem.parentId === windowElement.parentId && !elem.locked) {
                oldMullionWidthOnSameWall.set(elem.id, (elem as WindowModel).mullionWidth);
                (elem as WindowModel).mullionWidth = value;
              }
            }
          });
          const undoableChangeOnSameWall = {
            name: 'Set Mullion Width for All Windows On the Same Wall',
            timestamp: Date.now(),
            oldValues: oldMullionWidthOnSameWall,
            newValue: value,
            groupId: windowElement.parentId,
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
        if (windowElement.foundationId) {
          const oldMullionWidthAboveFoundation = new Map<string, number>();
          setCommonStore((state) => {
            for (const elem of state.elements) {
              if (elem.type === ObjectType.Window && elem.foundationId === windowElement.foundationId && !elem.locked) {
                oldMullionWidthAboveFoundation.set(elem.id, (elem as WindowModel).mullionWidth);
                (elem as WindowModel).mullionWidth = value;
              }
            }
          });
          const undoableChangeAboveFoundation = {
            name: 'Set Mullion Width for All Windows Above Foundation',
            timestamp: Date.now(),
            oldValues: oldMullionWidthAboveFoundation,
            newValue: value,
            groupId: windowElement.foundationId,
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
        if (windowElement) {
          const updatedWindow = getElementById(windowElement.id) as WindowModel;
          const oldWidth = updatedWindow.mullionWidth ?? windowElement.mullionWidth ?? 0.06;
          const undoableChange = {
            name: 'Set Window Mullion Width',
            timestamp: Date.now(),
            oldValue: oldWidth,
            newValue: value,
            changedElementId: windowElement.id,
            changedElementType: windowElement.type,
            undo: () => {
              updateRoofMullionWidthById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateRoofMullionWidthById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateRoofMullionWidthById(windowElement.id, value);
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
    setInputWidth(windowElement.mullionWidth ?? 0.4);
    setDialogVisible(false);
  };

  const handleCancel = () => {
    close();
    revertApply();
  };

  const handleOk = () => {
    setMullionWidth(inputWidth);
    setDialogVisible(false);
    setApplyCount(0);
  };

  const handleApply = () => {
    setMullionWidth(inputWidth);
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
            {i18n.t('windowMenu.MullionWidth', lang)}
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
              min={0}
              max={0.2}
              style={{ width: 120 }}
              step={0.01}
              precision={2}
              value={inputWidth}
              formatter={(a) => Number(a).toFixed(2)}
              onChange={(value) => setInputWidth(value)}
              onPressEnter={handleOk}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [0, 0.2] {i18n.t('word.MeterAbbreviation', lang)}
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
            <Radio.Group onChange={(e) => setWindowActionScope(e.target.value)} value={windowActionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('windowMenu.OnlyThisWindow', lang)}</Radio>
                <Radio value={Scope.OnlyThisSide}>{i18n.t('windowMenu.AllWindowsOnWall', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                  {i18n.t('windowMenu.AllWindowsAboveFoundation', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('windowMenu.AllWindows', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default MullinoWidthInput;
