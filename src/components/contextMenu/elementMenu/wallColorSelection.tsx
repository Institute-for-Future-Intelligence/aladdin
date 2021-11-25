/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
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

const WallColorSelection = ({
  colorDialogVisible,
  setColorDialogVisible,
}: {
  colorDialogVisible: boolean;
  setColorDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateWallColorById = useStore(Selector.updateWallColorById);
  const updateWallColorAboveFoundation = useStore(Selector.updateWallColorAboveFoundation);
  const updateWallColorForAll = useStore(Selector.updateWallColorForAll);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);
  const wallActionScope = useStore(Selector.wallActionScope);
  const setWallActionScope = useStore(Selector.setWallActionScope);

  const wall = getSelectedElement() as WallModel;
  const [selectedColor, setSelectedColor] = useState<string>(wall?.color ?? 'white');
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

  useEffect(() => {
    if (wall) {
      setSelectedColor(wall?.color ?? 'white');
    }
  }, [wall]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setWallActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const setColor = (value: string) => {
    switch (wallActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldColorsAll = new Map<string, string>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Wall) {
            oldColorsAll.set(elem.id, elem.color ?? 'white');
          }
        }
        const undoableChangeAll = {
          name: 'Set Color for All Walls',
          timestamp: Date.now(),
          oldValues: oldColorsAll,
          newValue: value,
          undo: () => {
            for (const [id, color] of undoableChangeAll.oldValues.entries()) {
              updateWallColorById(id, color as string);
            }
          },
          redo: () => {
            updateWallColorForAll(undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateWallColorForAll(value);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (wall.foundationId) {
          const oldColorsAboveFoundation = new Map<string, string>();
          for (const elem of elements) {
            if (elem.type === ObjectType.Wall && elem.foundationId === wall.foundationId) {
              oldColorsAboveFoundation.set(elem.id, elem.color ?? 'white');
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Color for All Walls Above Foundation',
            timestamp: Date.now(),
            oldValues: oldColorsAboveFoundation,
            newValue: value,
            groupId: wall.foundationId,
            undo: () => {
              for (const [id, color] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateWallColorById(id, color as string);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateWallColorAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateWallColorAboveFoundation(wall.foundationId, value);
        }
        break;
      default:
        if (wall) {
          const oldColor = wall.color ?? 'white';
          const undoableChange = {
            name: 'Set Color of Selected Wall',
            timestamp: Date.now(),
            oldValue: oldColor,
            newValue: value,
            undo: () => {
              updateWallColorById(wall.id, undoableChange.oldValue as string);
            },
            redo: () => {
              updateWallColorById(wall.id, undoableChange.newValue as string);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateWallColorById(wall.id, value);
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
        width={640}
        visible={colorDialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('word.Color', lang)}
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
          <Button
            key="Cancel"
            onClick={() => {
              if (wall?.color) {
                setSelectedColor(wall.color);
              }
              setColorDialogVisible(false);
            }}
          >
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button
            key="OK"
            type="primary"
            onClick={() => {
              setColor(selectedColor);
              setColorDialogVisible(false);
            }}
          >
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button at the upper-right corner to work
        onCancel={() => {
          if (wall?.color) {
            setSelectedColor(wall.color);
          }
          setColorDialogVisible(false);
        }}
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
              color={wall?.color ?? 'white'}
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

export default WallColorSelection;
