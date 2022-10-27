/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
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
import { WindowDataType } from './windowMenu';

interface WindowItemSelectionProps {
  window: WindowModel;
  dataType: string;
  attributeKey: keyof WindowModel;
  setDialogVisible: () => void;
}

const WindowItemSelection = ({
  window: windowModel,
  dataType,
  attributeKey,
  setDialogVisible,
}: WindowItemSelectionProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const addUndoable = useStore(Selector.addUndoable);
  const windowActionScope = useStore(Selector.windowActionScope);
  const setWindowActionScope = useStore(Selector.setWindowActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const [selectedItem, setSelectedItem] = useState<string>(windowModel[attributeKey] as string);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    okButtonRef.current?.focus();
  });

  const lang = { lng: language };

  const updateById = (id: string, val: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Window) {
            ((e as WindowModel)[attributeKey] as string) = val;
          }
          break;
        }
      }
    });
  };

  const updateOnSameWall = (wId: string, val: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!e.locked && e.type === ObjectType.Window && e.parentId === wId) {
          ((e as WindowModel)[attributeKey] as string) = val;
        }
      }
    });
  };

  const updateAboveFoundation = (fId: string, val: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!e.locked && e.type === ObjectType.Window && e.foundationId === fId) {
          ((e as WindowModel)[attributeKey] as string) = val;
        }
      }
    });
  };

  const updateForAll = (val: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!e.locked && e.type === ObjectType.Window) {
          ((e as WindowModel)[attributeKey] as string) = val;
        }
      }
    });
  };

  const updateInMap = (map: Map<string, string>, val: string) => {
    for (const id of map.keys()) {
      updateById(id, val as string);
    }
  };

  const undoInMap = (map: Map<string, string>) => {
    for (const [id, val] of map.entries()) {
      updateById(id, val as string);
    }
  };

  const setValue = (value: string) => {
    if (!windowModel) return;
    switch (windowActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldValsAll = new Map<string, string>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.Window && !elem.locked) {
            oldValsAll.set(elem.id, (elem as WindowModel)[attributeKey] as string);
          }
        }
        const undoableChangeAll = {
          name: `Set ${dataType} for All Windows`,
          timestamp: Date.now(),
          oldValues: oldValsAll,
          newValue: value,
          undo: () => {
            undoInMap(undoableChangeAll.oldValues as Map<string, string>);
          },
          redo: () => {
            updateForAll(undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(value);
        setApplyCount(applyCount + 1);
        break;
      case Scope.OnlyThisSide:
        if (windowModel.parentId) {
          const oldValues = new Map<string, string>();
          setCommonStore((state) => {
            for (const elem of state.elements) {
              if (elem.type === ObjectType.Window && elem.parentId === windowModel.parentId && !elem.locked) {
                oldValues.set(elem.id, (elem as WindowModel)[attributeKey] as string);
                ((elem as WindowModel)[attributeKey] as string) = value;
              }
            }
          });
          const undoableChangeOnSameWall = {
            name: `Set ${dataType} for All Windows On the Same Wall`,
            timestamp: Date.now(),
            oldValues: oldValues,
            newValue: value,
            groupId: windowModel.parentId,
            undo: () => {
              undoInMap(undoableChangeOnSameWall.oldValues as Map<string, string>);
            },
            redo: () => {
              updateOnSameWall(windowModel.parentId, undoableChangeOnSameWall.newValue as string);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSameWall);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (windowModel.foundationId) {
          const oldValsAboveFoundation = new Map<string, string>();
          for (const elem of useStore.getState().elements) {
            if (
              elem.type === ObjectType.Window &&
              elem.foundationId === windowModel.foundationId &&
              !windowModel.locked
            ) {
              oldValsAboveFoundation.set(elem.id, (elem as WindowModel)[attributeKey] as string);
            }
          }
          const undoableChangeAboveFoundation = {
            name: `Set ${dataType} for All Windows Above Foundation`,
            timestamp: Date.now(),
            oldValues: oldValsAboveFoundation,
            newValue: value,
            groupId: windowModel.foundationId,
            undo: () => {
              undoInMap(undoableChangeAboveFoundation.oldValues as Map<string, string>);
            },
            redo: () => {
              updateAboveFoundation(
                undoableChangeAboveFoundation.groupId,
                undoableChangeAboveFoundation.newValue as string,
              );
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(windowModel.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (windowModel) {
          const oldVal = windowModel[attributeKey] as string;
          const undoableChange = {
            name: `Set ${dataType} of Selected window`,
            timestamp: Date.now(),
            oldValue: oldVal,
            newValue: value,
            changedElementId: windowModel.id,
            changedElementType: windowModel.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as string);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as string);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(windowModel.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      switch (dataType) {
        case WindowDataType.Tint:
          state.actionState.windowTint = value;
          break;
        case WindowDataType.MullionColor:
          state.actionState.windowMullionColor = value;
          break;
      }
    });
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
    setDialogVisible();
  };

  const handleCancel = () => {
    close();
    revertApply();
  };

  const handleOk = () => {
    if (windowModel[attributeKey] !== selectedItem) {
      setValue(selectedItem);
    }
    setDialogVisible();
    setApplyCount(0);
  };

  const handleApply = () => {
    if (windowModel[attributeKey] !== selectedItem) {
      setValue(selectedItem);
    }
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
            {i18n.t(`windowMenu.${dataType}`, lang)}
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
              color={selectedItem ?? '#73D8FF'}
              onChangeComplete={(colorResult) => {
                setSelectedItem(colorResult.hex);
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

export default WindowItemSelection;
