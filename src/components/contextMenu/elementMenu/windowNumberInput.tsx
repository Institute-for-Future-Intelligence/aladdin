/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { WindowModel } from 'src/models/WindowModel';
import { WindowDataType } from './windowMenu';

interface WindowNumberInputProps {
  windowElement: WindowModel;
  dataType: string;
  attributeKey: keyof WindowModel;
  range: [min: number, max: number];
  step: number;
  setDialogVisible: () => void;
  unit?: string;
  note?: string;
  digit?: number;
}

const WindowNumberInput = ({
  windowElement,
  dataType,
  attributeKey,
  range,
  step,
  unit,
  note,
  digit,
  setDialogVisible,
}: WindowNumberInputProps) => {
  const language = useStore(Selector.language);
  const addUndoable = useStore(Selector.addUndoable);
  const windowActionScope = useStore(Selector.windowActionScope);
  const setWindowActionScope = useStore(Selector.setWindowActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);
  const setCommonStore = useStore(Selector.set);
  const getParent = useStore(Selector.getParent);

  const parent = getParent(windowElement);
  const currentValue = useMemo(() => {
    const v = windowElement[attributeKey] as number;
    if (parent) {
      if (attributeKey === 'lx') return v * parent.lx;
      if (attributeKey === 'lz') return v * parent.lz;
    }
    return v;
  }, [attributeKey, windowElement, parent?.lx, parent?.lz]);

  const [inputValue, setInputValue] = useState<number>(currentValue);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

  const setAttribute = (window: WindowModel, attributeKey: keyof WindowModel, value: number) => {
    if (parent && (attributeKey === 'lx' || attributeKey === 'lz')) {
      // width and height are relative to the parent
      (window[attributeKey] as number) = value / parent[attributeKey];
    } else {
      (window[attributeKey] as number) = value;
    }
  };

  const updateById = (id: string, value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked && e.type === ObjectType.Window) {
            setAttribute(e as WindowModel, attributeKey, value);
          }
          break;
        }
      }
    });
  };

  const updateOnSameWall = (wallId: string | undefined, value: number) => {
    if (!wallId) return;
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!e.locked && e.type === ObjectType.Window && e.parentId === wallId) {
          setAttribute(e as WindowModel, attributeKey, value);
        }
      }
    });
  };

  const updateAboveFoundation = (foundationId: string | undefined, value: number) => {
    if (!foundationId) return;
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!e.locked && e.type === ObjectType.Window && e.foundationId === foundationId) {
          setAttribute(e as WindowModel, attributeKey, value);
        }
      }
    });
  };

  const updateForAll = (value: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (!e.locked && e.type === ObjectType.Window) {
          setAttribute(e as WindowModel, attributeKey, value);
        }
      }
    });
  };

  const undoInMap = (map: Map<string, number>) => {
    for (const [id, val] of map.entries()) {
      updateById(id, val);
    }
  };

  const setValue = (value: number) => {
    if (!windowElement) return;
    switch (windowActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldValuesAll = new Map<string, number>();
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.type === ObjectType.Window && !e.locked) {
              const window = e as WindowModel;
              let oldValue = window[attributeKey] as number;
              if (parent) {
                if (attributeKey === 'lx') {
                  oldValue *= parent.lx;
                } else if (attributeKey === 'lz') {
                  oldValue *= parent.lz;
                }
              }
              oldValuesAll.set(e.id, oldValue);
              setAttribute(window, attributeKey, value);
            }
          }
        });
        const undoableChangeAll = {
          name: `Set ${dataType} for All Windows`,
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            undoInMap(undoableChangeAll.oldValues as Map<string, number>);
          },
          redo: () => {
            updateForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        setApplyCount(applyCount + 1);
        break;
      case Scope.OnlyThisSide:
        if (windowElement.parentId) {
          const oldValuesOnSameWall = new Map<string, number>();
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.type === ObjectType.Window && e.parentId === windowElement.parentId && !e.locked) {
                const window = e as WindowModel;
                let oldValue = window[attributeKey] as number;
                if (parent) {
                  if (attributeKey === 'lx') {
                    oldValue *= parent.lx;
                  } else if (attributeKey === 'lz') {
                    oldValue *= parent.lz;
                  }
                }
                oldValuesOnSameWall.set(e.id, oldValue);
                setAttribute(window, attributeKey, value);
              }
            }
          });
          const undoableChangeOnSameWall = {
            name: `Set ${dataType} for All Windows On the Same Wall`,
            timestamp: Date.now(),
            oldValues: oldValuesOnSameWall,
            newValue: value,
            groupId: windowElement.parentId,
            undo: () => {
              undoInMap(undoableChangeOnSameWall.oldValues as Map<string, number>);
            },
            redo: () => {
              updateOnSameWall(windowElement.parentId, undoableChangeOnSameWall.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSameWall);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (windowElement.foundationId) {
          const oldValuesAboveFoundation = new Map<string, number>();
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.type === ObjectType.Window && e.foundationId === windowElement.foundationId && !e.locked) {
                const window = e as WindowModel;
                let oldValue = window[attributeKey] as number;
                if (parent) {
                  if (attributeKey === 'lx') {
                    oldValue *= parent.lx;
                  } else if (attributeKey === 'lz') {
                    oldValue *= parent.lz;
                  }
                }
                oldValuesAboveFoundation.set(e.id, oldValue);
                setAttribute(window, attributeKey, value);
              }
            }
          });
          const undoableChangeAboveFoundation = {
            name: `Set ${dataType} for All Windows Above Foundation`,
            timestamp: Date.now(),
            oldValues: oldValuesAboveFoundation,
            newValue: value,
            groupId: windowElement.foundationId,
            undo: () => {
              undoInMap(undoableChangeAboveFoundation.oldValues as Map<string, number>);
            },
            redo: () => {
              updateAboveFoundation(windowElement.foundationId, undoableChangeAboveFoundation.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (windowElement) {
          let oldValue = windowElement[attributeKey] as number;
          if (parent) {
            if (attributeKey === 'lx') {
              oldValue *= parent.lx;
            } else if (attributeKey === 'lz') {
              oldValue *= parent.lz;
            }
          }
          const undoableChange = {
            name: `Set Window ${dataType}`,
            timestamp: Date.now(),
            oldValue: oldValue,
            newValue: value,
            changedElementId: windowElement.id,
            changedElementType: windowElement.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(windowElement.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      switch (dataType) {
        case WindowDataType.Width:
          state.actionState.windowWidth = value;
          break;
        case WindowDataType.Height:
          state.actionState.windowHeight = value;
          break;
        case WindowDataType.Opacity:
          state.actionState.windowOpacity = value;
          break;
        case WindowDataType.FrameWidth:
          state.actionState.windowFrameWidth = value;
          break;
        case WindowDataType.MullionSpacing:
          state.actionState.windowMullionSpacing = value;
          break;
        case WindowDataType.MullionWidth:
          state.actionState.windowMullionWidth = value;
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
    setInputValue(currentValue);
    setDialogVisible();
  };

  const handleCancel = () => {
    close();
    revertApply();
  };

  const handleOk = () => {
    setValue(inputValue);
    setDialogVisible();
    setApplyCount(0);
  };

  const handleApply = () => {
    setValue(inputValue);
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
              min={range[0]}
              max={range[1]}
              style={{ width: 120 }}
              step={step}
              precision={2}
              value={inputValue}
              formatter={(a) => Number(a).toFixed(2)}
              onChange={(value) => setInputValue(value)}
              onPressEnter={handleOk}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [{range[0].toFixed(range[0] === 0 ? 0 : digit ?? 0)},{' '}
              {range[1].toFixed(digit ?? 0)}] {unit} <br />
              <br /> {note}
            </div>
          </Col>
          <Col className="gutter-row" span={1} style={{ verticalAlign: 'middle', paddingTop: '6px' }}>
            {unit}
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={17}
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

export default WindowNumberInput;
