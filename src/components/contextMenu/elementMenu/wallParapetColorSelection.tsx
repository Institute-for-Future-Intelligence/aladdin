/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { WallModel } from '../../../models/WallModel';
import { CompactPicker } from 'react-color';
import { Util } from '../../../Util';

const WallParapetColorSelection = ({ setDialogVisible }: { setDialogVisible: () => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.wallActionScope);
  const setActionScope = useStore(Selector.setWallActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);
  const getElementById = useStore(Selector.getElementById);

  const wall = useStore((state) => state.elements.find((e) => e.selected && e.type === ObjectType.Wall)) as WallModel;

  const [selectedColor, setSelectedColor] = useState<string>(wall?.parapet.color ?? '#ffffff');
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    okButtonRef.current?.focus();
  });

  const lang = { lng: language };

  useEffect(() => {
    if (wall) {
      setSelectedColor(wall?.parapet.color ?? '#ffffff');
    }
  }, [wall]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const updateById = (id: string, color: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Wall && !e.locked) {
          (e as WallModel).parapet.color = color;
          break;
        }
      }
    });
  };

  const updateConnectedWalls = (color: string) => {
    const connectedWalls = Util.getAllConnectedWalls(wall);
    if (connectedWalls.length === 0) return;
    setCommonStore((state) => {
      for (const w of connectedWalls) {
        if (!w.locked) {
          for (const e of state.elements) {
            if (e.id === w.id && e.type === ObjectType.Wall) {
              (e as WallModel).parapet.color = color;
            }
          }
        }
      }
    });
  };

  const updateAboveFoundation = (fId: string, color: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.parentId === fId && e.type === ObjectType.Wall && !e.locked) {
          (e as WallModel).parapet.color = color;
        }
      }
    });
  };

  const updateForAll = (color: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.Wall && !e.locked) {
          (e as WallModel).parapet.color = color;
        }
      }
    });
  };

  const needChange = (value: string) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Wall && value !== (e as WallModel).parapet.color && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (
            e.type === ObjectType.Wall &&
            e.foundationId === wall.foundationId &&
            value !== (e as WallModel).parapet.color &&
            !e.locked
          ) {
            return true;
          }
        }
        break;
      case Scope.AllConnectedObjects:
        const connectedWalls = Util.getAllConnectedWalls(wall);
        for (const e of connectedWalls) {
          if (value !== e.parapet.color && !e.locked) {
            return true;
          }
        }
        break;
      default:
        if (value !== wall?.parapet.color) {
          return true;
        }
        break;
    }
    return false;
  };

  const setColor = (value: string) => {
    if (!wall) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldColorsAll = new Map<string, string>();
        for (const e of elements) {
          if (e.type === ObjectType.Wall) {
            oldColorsAll.set(e.id, (e as WallModel).parapet.color ?? '#ffffff');
          }
        }
        const undoableChangeAll = {
          name: 'Set Parapet Color for All Walls',
          timestamp: Date.now(),
          oldValues: oldColorsAll,
          newValue: value,
          undo: () => {
            for (const [id, studColor] of undoableChangeAll.oldValues.entries()) {
              updateById(id, studColor as string);
            }
          },
          redo: () => {
            updateForAll(undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(value);
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (wall.foundationId) {
          const oldColorsAboveFoundation = new Map<string, string>();
          for (const e of elements) {
            if (e.type === ObjectType.Wall && e.foundationId === wall.foundationId) {
              oldColorsAboveFoundation.set(e.id, (e as WallModel).parapet.color ?? '#ffffff');
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Parapet Color for All Walls Above Foundation',
            timestamp: Date.now(),
            oldValues: oldColorsAboveFoundation,
            newValue: value,
            groupId: wall.foundationId,
            undo: () => {
              for (const [id, studColor] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, studColor as string);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(wall.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.AllConnectedObjects:
        if (wall) {
          const connectedWalls = Util.getAllConnectedWalls(wall);
          const oldValuesConnectedWalls = new Map<string, string>();
          for (const e of connectedWalls) {
            oldValuesConnectedWalls.set(e.id, e.color ?? '#ffffff');
          }
          const undoableChangeConnectedWalls = {
            name: `Set Parapet Color for All Connected Walls`,
            timestamp: Date.now(),
            oldValues: oldValuesConnectedWalls,
            newValue: value,
            undo: () => {
              for (const [id, wh] of undoableChangeConnectedWalls.oldValues.entries()) {
                updateById(id, wh as string);
              }
            },
            redo: () => {
              updateConnectedWalls(undoableChangeConnectedWalls.newValue as string);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeConnectedWalls);
          updateConnectedWalls(value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (wall) {
          const updatedWall = getElementById(wall.id) as WallModel;
          const oldColor = updatedWall?.parapet.color ?? wall.parapet.color ?? '#ffffff';
          const undoableChange = {
            name: 'Set Parapet Color of Selected Wall',
            timestamp: Date.now(),
            oldValue: oldColor,
            newValue: value,
            changedElementId: wall.id,
            changedElementType: wall.type,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as string);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as string);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(wall.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.wallParapet.color = value;
    });
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
    if (wall?.parapet.color) {
      setSelectedColor(wall.parapet.color);
    }
    setDialogVisible();
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setColor(selectedColor);
    setDialogVisible();
    setApplyCount(0);
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
            {i18n.t('wallMenu.ParapetColor', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setColor(selectedColor);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button key="Cancel" onClick={cancel}>
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button key="OK" type="primary" onClick={ok} ref={okButtonRef}>
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
              color={selectedColor ?? wall?.parapet.color ?? '#ffffff'}
              onChangeComplete={(colorResult) => {
                setSelectedColor(colorResult.hex);
                setUpdateFlag(!updateFlag);
              }}
            />
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={13}
          >
            <Radio.Group onChange={onScopeChange} value={actionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('wallMenu.OnlyThisWall', lang)}</Radio>
                <Radio value={Scope.AllConnectedObjects}>{i18n.t('wallMenu.AllConnectedWalls', lang)}</Radio>
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

export default WallParapetColorSelection;
