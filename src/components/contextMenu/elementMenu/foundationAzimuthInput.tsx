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
import { Util } from '../../../Util';
import { ZERO_TOLERANCE } from '../../../constants';

const FoundationAzimuthInput = ({
  azimuthDialogVisible,
  setAzimuthDialogVisible,
}: {
  azimuthDialogVisible: boolean;
  setAzimuthDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateElementRotationById = useStore(Selector.updateElementRotationById);
  const updateElementRotationForAll = useStore(Selector.updateElementRotationForAll);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);
  const foundationActionScope = useStore(Selector.foundationActionScope);
  const setFoundationActionScope = useStore(Selector.setFoundationActionScope);

  const foundation = getSelectedElement() as FoundationModel;
  const [inputAzimuth, setInputAzimuth] = useState<number>(foundation?.rotation[2] ?? 0);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

  useEffect(() => {
    if (foundation) {
      setInputAzimuth(foundation.rotation[2]);
    }
  }, [foundation]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setFoundationActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (azimuth: number) => {
    switch (foundationActionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked) {
            const f = e as FoundationModel;
            if (Math.abs(f.rotation[2] - azimuth) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(foundation?.rotation[2] - azimuth) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setAzimuth = (value: number) => {
    if (!foundation) return;
    if (!needChange(value)) return;
    switch (foundationActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldAzimuthsAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation) {
            oldAzimuthsAll.set(elem.id, elem.rotation[2]);
          }
        }
        const undoableChangeAll = {
          name: 'Set Azimuth for All Foundations',
          timestamp: Date.now(),
          oldValues: oldAzimuthsAll,
          newValue: value,
          undo: () => {
            for (const [id, az] of undoableChangeAll.oldValues.entries()) {
              updateElementRotationById(id, 0, 0, az as number);
            }
          },
          redo: () => {
            updateElementRotationForAll(ObjectType.Foundation, 0, 0, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateElementRotationForAll(ObjectType.Foundation, 0, 0, value);
        break;
      default:
        if (foundation) {
          const oldAzimuth = foundation.rotation[2];
          const undoableChange = {
            name: 'Set Foundation Azimuth',
            timestamp: Date.now(),
            oldValue: oldAzimuth,
            newValue: value,
            undo: () => {
              updateElementRotationById(foundation.id, 0, 0, undoableChange.oldValue as number);
            },
            redo: () => {
              updateElementRotationById(foundation.id, 0, 0, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateElementRotationById(foundation.id, 0, 0, value);
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
        visible={azimuthDialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('word.Azimuth', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setAzimuth(inputAzimuth);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button
            key="Cancel"
            onClick={() => {
              setInputAzimuth(foundation?.rotation[2]);
              setAzimuthDialogVisible(false);
            }}
          >
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button
            key="OK"
            type="primary"
            onClick={() => {
              setAzimuth(inputAzimuth);
              setAzimuthDialogVisible(false);
            }}
          >
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button in the upper-right corner to work
        onCancel={() => {
          setInputAzimuth(foundation?.rotation[2]);
          setAzimuthDialogVisible(false);
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
              min={-180}
              max={180}
              style={{ width: 120 }}
              step={0.5}
              precision={1}
              value={Util.toDegrees(inputAzimuth)}
              formatter={(a) => Number(a).toFixed(1) + '°'}
              onChange={(value) => setInputAzimuth(Util.toRadians(value))}
              onPressEnter={() => {
                setAzimuth(inputAzimuth);
                setAzimuthDialogVisible(false);
              }}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [-180°, 180°]
              <br />
              {i18n.t('shared.AzimuthOfNorthIsZero', lang)}
              <br />
              {i18n.t('shared.CounterclockwiseAzimuthIsPositive', lang)}
            </div>
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={16}
          >
            <Radio.Group onChange={onScopeChange} value={foundationActionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('foundationMenu.OnlyThisFoundation', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('foundationMenu.AllFoundations', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default FoundationAzimuthInput;
