/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
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
import { Util } from '../../../Util';
import { CuboidModel } from '../../../models/CuboidModel';
import { ZERO_TOLERANCE } from '../../../constants';

const CuboidAzimuthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateElementRotationById = useStore(Selector.updateElementRotationById);
  const updateElementRotationForAll = useStore(Selector.updateElementRotationForAll);
  const cuboid = useStore(Selector.selectedElement) as CuboidModel;
  const addUndoable = useStore(Selector.addUndoable);
  const cuboidActionScope = useStore(Selector.cuboidActionScope);
  const setCuboidActionScope = useStore(Selector.setCuboidActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  // reverse the sign because rotation angle is positive counterclockwise whereas azimuth is positive clockwise
  const inputAzimuthRef = useRef<number>(-cuboid?.rotation[2] ?? 0);

  const lang = { lng: language };

  useEffect(() => {
    if (cuboid) {
      inputAzimuthRef.current = -cuboid.rotation[2];
    }
  }, [cuboid]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setCuboidActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (azimuth: number) => {
    switch (cuboidActionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Cuboid && !e.locked) {
            const c = e as CuboidModel;
            if (Math.abs(-c.rotation[2] - azimuth) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(-cuboid?.rotation[2] - azimuth) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setAzimuth = (value: number) => {
    if (!cuboid) return;
    if (!needChange(value)) return;
    switch (cuboidActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldAzimuthsAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Cuboid) {
            oldAzimuthsAll.set(elem.id, -elem.rotation[2]);
          }
        }
        const undoableChangeAll = {
          name: 'Set Azimuth for All Cuboids',
          timestamp: Date.now(),
          oldValues: oldAzimuthsAll,
          newValue: value,
          undo: () => {
            for (const [id, az] of undoableChangeAll.oldValues.entries()) {
              updateElementRotationById(id, 0, 0, -(az as number));
            }
          },
          redo: () => {
            updateElementRotationForAll(ObjectType.Cuboid, 0, 0, -(undoableChangeAll.newValue as number));
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateElementRotationForAll(ObjectType.Cuboid, 0, 0, -value);
        setApplyCount(applyCount + 1);
        break;
      default:
        // cuboid via selected element may be outdated, make sure that we get the latest
        const c = getElementById(cuboid.id);
        const oldAzimuth = c ? -c.rotation[2] : -cuboid.rotation[2];
        const undoableChange = {
          name: 'Set Cuboid Azimuth',
          timestamp: Date.now(),
          oldValue: oldAzimuth,
          newValue: value,
          changedElementId: cuboid.id,
          changedElementType: cuboid.type,
          undo: () => {
            updateElementRotationById(undoableChange.changedElementId, 0, 0, -(undoableChange.oldValue as number));
          },
          redo: () => {
            updateElementRotationById(undoableChange.changedElementId, 0, 0, -(undoableChange.newValue as number));
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateElementRotationById(cuboid.id, 0, 0, -value);
        setApplyCount(applyCount + 1);
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

  const close = () => {
    inputAzimuthRef.current = -cuboid?.rotation[2];
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setAzimuth(inputAzimuthRef.current);
    setDialogVisible(false);
    setApplyCount(0);
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
            {i18n.t('word.Azimuth', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setAzimuth(inputAzimuthRef.current);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button key="Cancel" onClick={cancel}>
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button key="OK" type="primary" onClick={ok}>
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
              min={-180}
              max={180}
              style={{ width: 120 }}
              step={0.5}
              precision={2}
              // make sure that we round up the number as toDegrees may cause things like .999999999
              value={parseFloat(Util.toDegrees(inputAzimuthRef.current).toFixed(2))}
              formatter={(value) => `${value}°`}
              onChange={(value) => {
                inputAzimuthRef.current = Util.toRadians(value);
                setUpdateFlag(!updateFlag);
              }}
              onPressEnter={ok}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [-180°, 180°]
              <br />
              {i18n.t('message.AzimuthOfNorthIsZero', lang)}
              <br />
              {i18n.t('message.CounterclockwiseAzimuthIsPositive', lang)}
            </div>
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={16}
          >
            <Radio.Group onChange={onScopeChange} value={cuboidActionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('cuboidMenu.OnlyThisCuboid', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('cuboidMenu.AllCuboids', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default CuboidAzimuthInput;