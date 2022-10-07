/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Modal, Radio, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { CompactPicker } from 'react-color';
import { WindowModel } from 'src/models/WindowModel';

const WindowShutterColorSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const selectedElement = useStore(Selector.selectedElement) as WindowModel;
  const addUndoable = useStore(Selector.addUndoable);
  const windowActionScope = useStore(Selector.windowActionScope);
  const setWindowActionScope = useStore(Selector.setWindowActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);
  const getElementById = useStore(Selector.getElementById);

  const windowElement = useStore((state) => {
    for (const e of state.elements) {
      if (e.id === selectedElement.id) {
        return e as WindowModel;
      }
    }
    return null;
  });

  const [selectedColor, setSelectedColor] = useState<string>(windowElement?.shutter.color ?? 'grey');
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    okButtonRef.current?.focus();
  });

  const lang = { lng: language };

  useEffect(() => {
    if (windowElement) {
      setSelectedColor(windowElement?.shutter.color ?? 'grey');
    }
  }, [windowElement]);

  const updateById = (id: string, color: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked) {
            (e as WindowModel).shutter.color = color;
          }
          break;
        }
      }
      state.updateWallFlag = !state.updateWallFlag;
    });
  };

  const updateInMap = (map: Map<string, string>, color: string) => {
    for (const id of map.keys()) {
      updateById(id, color);
    }
  };

  const undoInMap = (map: Map<string, string>) => {
    for (const [id, color] of map.entries()) {
      updateById(id, color);
    }
  };

  const setColor = (value: string) => {
    if (!windowElement) return;
    switch (windowActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldValsAll = new Map<string, string>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.Window && !elem.locked) {
            oldValsAll.set(elem.id, (elem as WindowModel).shutter.color ?? 'grey');
          }
        }
        const undoableChangeAll = {
          name: 'Set Shutter Color for All Windows',
          timestamp: Date.now(),
          oldValues: oldValsAll,
          newValue: value,
          undo: () => {
            undoInMap(undoableChangeAll.oldValues as Map<string, string>);
          },
          redo: () => {
            updateInMap(undoableChangeAll.oldValues as Map<string, string>, undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateInMap(oldValsAll, value);
        setApplyCount(applyCount + 1);
        break;
      case Scope.OnlyThisSide:
        if (windowElement.parentId) {
          const oldValues = new Map<string, string>();
          setCommonStore((state) => {
            for (const elem of state.elements) {
              if (elem.type === ObjectType.Window && elem.parentId === windowElement.parentId && !elem.locked) {
                oldValues.set(elem.id, (elem as WindowModel).shutter.color);
                (elem as WindowModel).shutter.color = value;
              }
            }
          });
          const undoableChangeOnSameWall = {
            name: 'Set Shutter Color for All Windows On the Same Wall',
            timestamp: Date.now(),
            oldValues: oldValues,
            newValue: value,
            groupId: windowElement.parentId,
            undo: () => {
              undoInMap(undoableChangeOnSameWall.oldValues as Map<string, string>);
            },
            redo: () => {
              updateInMap(
                undoableChangeOnSameWall.oldValues as Map<string, string>,
                undoableChangeOnSameWall.newValue as string,
              );
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSameWall);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (windowElement.foundationId) {
          const oldValsAboveFoundation = new Map<string, string>();
          for (const elem of useStore.getState().elements) {
            if (
              elem.type === ObjectType.Window &&
              elem.foundationId === windowElement.foundationId &&
              !windowElement.locked
            ) {
              oldValsAboveFoundation.set(elem.id, (elem as WindowModel).shutter.color ?? 'grey');
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Shutter Color for All Windows Above Foundation',
            timestamp: Date.now(),
            oldValues: oldValsAboveFoundation,
            newValue: value,
            groupId: windowElement.foundationId,
            undo: () => {
              undoInMap(undoableChangeAboveFoundation.oldValues as Map<string, string>);
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateInMap(
                  undoableChangeAboveFoundation.oldValues as Map<string, string>,
                  undoableChangeAboveFoundation.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateInMap(oldValsAboveFoundation, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (windowElement) {
          const updatedWindow = getElementById(windowElement.id) as WindowModel;
          const oldColor = (updatedWindow ? updatedWindow.tint : windowElement.tint) ?? 'grey';
          const undoableChange = {
            name: 'Set Shutter Color of Selected window',
            timestamp: Date.now(),
            oldValue: oldColor,
            newValue: value,
            changedElementId: windowElement.id,
            changedElementType: windowElement.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as string);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as string);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(windowElement.id, value);
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
    if (windowElement?.tint) {
      setSelectedColor(windowElement.tint);
    }
    setDialogVisible(false);
  };

  const handleCancel = () => {
    close();
    revertApply();
  };

  const handleOk = () => {
    if (!windowElement) return;
    const updatedRoof = getElementById(windowElement.id) as WindowModel;
    if (updatedRoof && updatedRoof.tint !== selectedColor) {
      setColor(selectedColor);
    }
    setDialogVisible(false);
    setApplyCount(0);
  };

  const handleApply = () => {
    setColor(selectedColor);
  };

  return (
    <>
      <Modal
        width={640}
        visible={true}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('windowMenu.ShutterColor', lang)}
          </div>
        }
        footer={[
          <Button key="Apply" onClick={handleApply}>
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button key="Cancel" onClick={handleCancel}>
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button key="OK" type="primary" ref={okButtonRef} onClick={handleOk}>
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
          <Col className="gutter-row" span={11}>
            <CompactPicker
              color={selectedColor ?? windowElement?.tint ?? 'grey'}
              onChangeComplete={(colorResult) => {
                setSelectedColor(colorResult.hex);
              }}
            />
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={13}
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

export default WindowShutterColorSelection;
