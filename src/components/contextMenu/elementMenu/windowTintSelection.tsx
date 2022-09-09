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

const WindowTintSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const windowElement = useStore(Selector.selectedElement) as WindowModel;
  const addUndoable = useStore(Selector.addUndoable);
  const windowActionScope = useStore(Selector.windowActionScope);
  const setWindowActionScope = useStore(Selector.setWindowActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);
  const getElementById = useStore(Selector.getElementById);

  const [selectedTint, setSelectedTint] = useState<string>(windowElement?.tint ?? '#73D8FF');
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
      setSelectedTint(windowElement?.tint ?? '#73D8FF');
    }
  }, [windowElement]);

  const updateTintById = (id: string, tint: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked) {
            (e as WindowModel).tint = tint;
          }
          break;
        }
      }
    });
  };

  const updateTintInMap = (map: Map<string, string>, tint: string) => {
    for (const id of map.keys()) {
      updateTintById(id, tint as string);
    }
  };

  const undoTintInMap = (map: Map<string, string>) => {
    for (const [id, tint] of map.entries()) {
      updateTintById(id, tint as string);
    }
  };

  const setTint = (value: string) => {
    if (!windowElement) return;
    switch (windowActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldTintsAll = new Map<string, string>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.Window && !elem.locked) {
            oldTintsAll.set(elem.id, (elem as WindowModel).tint ?? '#73D8FF');
          }
        }
        const undoableChangeAll = {
          name: 'Set Tint for All Windows',
          timestamp: Date.now(),
          oldValues: oldTintsAll,
          newValue: value,
          undo: () => {
            undoTintInMap(undoableChangeAll.oldValues as Map<string, string>);
          },
          redo: () => {
            updateTintInMap(undoableChangeAll.oldValues as Map<string, string>, undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateTintInMap(oldTintsAll, value);
        setApplyCount(applyCount + 1);
        break;
      case Scope.OnlyThisSide:
        if (windowElement.parentId) {
          const oldValues = new Map<string, string>();
          setCommonStore((state) => {
            for (const elem of state.elements) {
              if (elem.type === ObjectType.Window && elem.parentId === windowElement.parentId && !elem.locked) {
                oldValues.set(elem.id, (elem as WindowModel).tint);
                (elem as WindowModel).tint = value;
              }
            }
          });
          const undoableChangeOnSameWall = {
            name: 'Set Opacity for All Windows On the Same Wall',
            timestamp: Date.now(),
            oldValues: oldValues,
            newValue: value,
            groupId: windowElement.parentId,
            undo: () => {
              undoTintInMap(undoableChangeOnSameWall.oldValues as Map<string, string>);
            },
            redo: () => {
              updateTintInMap(
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
          const oldTintsAboveFoundation = new Map<string, string>();
          for (const elem of useStore.getState().elements) {
            if (
              elem.type === ObjectType.Window &&
              elem.foundationId === windowElement.foundationId &&
              !windowElement.locked
            ) {
              oldTintsAboveFoundation.set(elem.id, (elem as WindowModel).tint ?? '#73D8FF');
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Tint for All Windows Above Foundation',
            timestamp: Date.now(),
            oldValues: oldTintsAboveFoundation,
            newValue: value,
            groupId: windowElement.foundationId,
            undo: () => {
              undoTintInMap(undoableChangeAboveFoundation.oldValues as Map<string, string>);
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateTintInMap(
                  undoableChangeAboveFoundation.oldValues as Map<string, string>,
                  undoableChangeAboveFoundation.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateTintInMap(oldTintsAboveFoundation, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (windowElement) {
          const updatedWindow = getElementById(windowElement.id) as WindowModel;
          const oldTint = (updatedWindow ? updatedWindow.tint : windowElement.tint) ?? '#73D8FF';
          const undoableChange = {
            name: 'Set Tint of Selected window',
            timestamp: Date.now(),
            oldValue: oldTint,
            newValue: value,
            changedElementId: windowElement.id,
            changedElementType: windowElement.type,
            undo: () => {
              updateTintById(undoableChange.changedElementId, undoableChange.oldValue as string);
            },
            redo: () => {
              updateTintById(undoableChange.changedElementId, undoableChange.newValue as string);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateTintById(windowElement.id, value);
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
      setSelectedTint(windowElement.tint);
    }
    setDialogVisible(false);
  };

  const handleCancel = () => {
    close();
    revertApply();
  };

  const handleOk = () => {
    const updatedRoof = getElementById(windowElement.id) as WindowModel;
    if (updatedRoof && updatedRoof.tint !== selectedTint) {
      setTint(selectedTint);
    }
    setDialogVisible(false);
    setApplyCount(0);
  };

  const handleApply = () => {
    setTint(selectedTint);
  };

  console.log('tintttt');
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
            {i18n.t('roofMenu.tint', lang)}
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
              color={selectedTint ?? windowElement?.tint ?? '#73D8FF'}
              onChangeComplete={(colorResult) => {
                setSelectedTint(colorResult.hex);
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

export default WindowTintSelection;
