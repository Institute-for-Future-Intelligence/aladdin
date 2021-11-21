/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
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
import { FoundationModel } from '../../../models/FoundationModel';

const FoundationHeightInput = ({
  heightDialogVisible,
  setHeightDialogVisible,
}: {
  heightDialogVisible: boolean;
  setHeightDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateElementLzById = useStore(Selector.updateElementLzById);
  const updateElementLzForAll = useStore(Selector.updateElementLzForAll);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);
  const foundationActionScope = useStore(Selector.foundationActionScope);
  const setFoundationActionScope = useStore(Selector.setFoundationActionScope);

  const foundation = getSelectedElement() as FoundationModel;
  const [inputLz, setInputLz] = useState<number>(foundation?.lz ?? 0);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

  useEffect(() => {
    if (foundation) {
      setInputLz(foundation.lz);
    }
  }, [foundation]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setFoundationActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const setLz = (value: number) => {
    switch (foundationActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldLzsAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation) {
            oldLzsAll.set(elem.id, elem.lz);
          }
        }
        const undoableChangeAll = {
          name: 'Set Height for All Foundations',
          timestamp: Date.now(),
          oldValues: oldLzsAll,
          newValue: value,
          undo: () => {
            for (const [id, lz] of undoableChangeAll.oldValues.entries()) {
              updateElementLzById(id, lz as number);
            }
          },
          redo: () => {
            updateElementLzForAll(ObjectType.Foundation, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateElementLzForAll(ObjectType.Foundation, value);
        break;
      default:
        if (foundation) {
          const oldLz = foundation.lz;
          const undoableChange = {
            name: 'Set Foundation Width',
            timestamp: Date.now(),
            oldValue: oldLz,
            newValue: value,
            undo: () => {
              updateElementLzById(foundation.id, undoableChange.oldValue as number);
            },
            redo: () => {
              updateElementLzById(foundation.id, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateElementLzById(foundation.id, value);
          setUpdateFlag(!updateFlag);
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
        width={550}
        visible={heightDialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('word.Height', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setLz(inputLz);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button
            key="Cancel"
            onClick={() => {
              setInputLz(foundation?.lz);
              setHeightDialogVisible(false);
            }}
          >
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button
            key="OK"
            type="primary"
            onClick={() => {
              setLz(inputLz);
              setHeightDialogVisible(false);
            }}
          >
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button at the upper-right corner to work
        onCancel={() => {
          setInputLz(foundation?.lz);
          setHeightDialogVisible(false);
        }}
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
              max={10}
              style={{ width: 120 }}
              step={0.1}
              precision={1}
              value={inputLz}
              formatter={(a) => Number(a).toFixed(1)}
              onChange={(value) => setInputLz(value)}
              onPressEnter={(event) => {
                setLz(inputLz);
                setHeightDialogVisible(false);
              }}
            />
          </Col>
          <Col className="gutter-row" span={1} style={{ verticalAlign: 'middle', paddingTop: '6px' }}>
            {i18n.t('word.MeterAbbreviation', lang)}
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={16}
          >
            <Radio.Group onChange={onScopeChange} value={foundationActionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('foundationMenu.OnlyThisFoundation', lang)}</Radio>
                <Radio value={Scope.AllConnectedObjects}>
                  {i18n.t('foundationMenu.AllConnectedFoundations', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('foundationMenu.AllFoundations', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default FoundationHeightInput;
