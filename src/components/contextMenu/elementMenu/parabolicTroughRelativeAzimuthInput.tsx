/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ParabolicTroughModel } from '../../../models/ParabolicTroughModel';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { Util } from '../../../Util';
import { ZERO_TOLERANCE } from '../../../constants';

const ParabolicTroughRelativeAzimuthInput = ({
  dialogVisible,
  setDialogVisible,
}: {
  dialogVisible: boolean;
  setDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateRelativeAzimuthById = useStore(Selector.updateSolarCollectorRelativeAzimuthById);
  const updateRelativeAzimuthAboveFoundation = useStore(Selector.updateSolarCollectorRelativeAzimuthAboveFoundation);
  const updateRelativeAzimuthForAll = useStore(Selector.updateSolarCollectorRelativeAzimuthForAll);
  const getParent = useStore(Selector.getParent);
  const parabolicTrough = useStore(Selector.selectedElement) as ParabolicTroughModel;
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.parabolicTroughActionScope);
  const setActionScope = useStore(Selector.setParabolicTroughActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const [inputRelativeAzimuth, setInputRelativeAzimuth] = useState<number>(parabolicTrough?.relativeAzimuth ?? 0);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();
  const okButtonRef = useRef<HTMLElement | null>(null);
  okButtonRef.current?.focus();

  const lang = { lng: language };

  useEffect(() => {
    if (parabolicTrough) {
      setInputRelativeAzimuth(parabolicTrough.relativeAzimuth);
    }
  }, [parabolicTrough]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const withinParent = (trough: ParabolicTroughModel, azimuth: number) => {
    const parent = getParent(trough);
    if (parent) {
      const clone = JSON.parse(JSON.stringify(trough)) as ParabolicTroughModel;
      clone.relativeAzimuth = azimuth;
      return Util.isSolarCollectorWithinHorizontalSurface(clone, parent);
    }
    return false;
  };

  const rejectChange = (trough: ParabolicTroughModel, azimuth: number) => {
    // check if the new relative azimuth will cause the solar panel to be out of the bound
    if (!withinParent(trough, azimuth)) {
      return true;
    }
    // other check?
    return false;
  };

  const needChange = (azimuth: number) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicTrough && !e.locked) {
            const pt = e as ParabolicTroughModel;
            if (Math.abs(pt.relativeAzimuth - azimuth) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicTrough && e.foundationId === parabolicTrough?.foundationId && !e.locked) {
            const pt = e as ParabolicTroughModel;
            if (Math.abs(pt.relativeAzimuth - azimuth) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(parabolicTrough?.relativeAzimuth - azimuth) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setRelativeAzimuth = (value: number) => {
    if (!parabolicTrough) return;
    if (!needChange(value)) return;
    rejectedValue.current = undefined;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        rejectRef.current = false;
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicTrough) {
            if (rejectChange(elem as ParabolicTroughModel, value)) {
              rejectRef.current = true;
              break;
            }
          }
        }
        if (rejectRef.current) {
          rejectedValue.current = value;
          setInputRelativeAzimuth(parabolicTrough.relativeAzimuth);
        } else {
          const oldRelativeAzimuthsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicTrough) {
              oldRelativeAzimuthsAll.set(elem.id, (elem as ParabolicTroughModel).relativeAzimuth);
            }
          }
          const undoableChangeAll = {
            name: 'Set Relative Azimuth for All Parabolic Troughs',
            timestamp: Date.now(),
            oldValues: oldRelativeAzimuthsAll,
            newValue: value,
            undo: () => {
              for (const [id, ta] of undoableChangeAll.oldValues.entries()) {
                updateRelativeAzimuthById(id, ta as number);
              }
            },
            redo: () => {
              updateRelativeAzimuthForAll(ObjectType.ParabolicTrough, undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateRelativeAzimuthForAll(ObjectType.ParabolicTrough, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (parabolicTrough.foundationId) {
          rejectRef.current = false;
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicTrough && elem.foundationId === parabolicTrough.foundationId) {
              if (rejectChange(elem as ParabolicTroughModel, value)) {
                rejectRef.current = true;
                break;
              }
            }
          }
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputRelativeAzimuth(parabolicTrough.relativeAzimuth);
          } else {
            const oldRelativeAzimuthsAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.ParabolicTrough && elem.foundationId === parabolicTrough.foundationId) {
                oldRelativeAzimuthsAboveFoundation.set(elem.id, (elem as ParabolicTroughModel).relativeAzimuth);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Relative Azimuth for All Parabolic Troughs Above Foundation',
              timestamp: Date.now(),
              oldValues: oldRelativeAzimuthsAboveFoundation,
              newValue: value,
              groupId: parabolicTrough.foundationId,
              undo: () => {
                for (const [id, ta] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateRelativeAzimuthById(id, ta as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateRelativeAzimuthAboveFoundation(
                    ObjectType.ParabolicTrough,
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateRelativeAzimuthAboveFoundation(ObjectType.ParabolicTrough, parabolicTrough.foundationId, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      default:
        if (parabolicTrough) {
          const oldRelativeAzimuth = parabolicTrough.relativeAzimuth;
          rejectRef.current = rejectChange(parabolicTrough, value);
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputRelativeAzimuth(oldRelativeAzimuth);
          } else {
            const undoableChange = {
              name: 'Set Parabolic Trough Relative Azimuth',
              timestamp: Date.now(),
              oldValue: oldRelativeAzimuth,
              newValue: value,
              changedElementId: parabolicTrough.id,
              undo: () => {
                updateRelativeAzimuthById(undoableChange.changedElementId, undoableChange.oldValue as number);
              },
              redo: () => {
                updateRelativeAzimuthById(undoableChange.changedElementId, undoableChange.newValue as number);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            updateRelativeAzimuthById(parabolicTrough.id, value);
            setApplyCount(applyCount + 1);
          }
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

  const close = () => {
    setInputRelativeAzimuth(parabolicTrough.relativeAzimuth);
    rejectRef.current = false;
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setRelativeAzimuth(inputRelativeAzimuth);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  return parabolicTrough?.type === ObjectType.ParabolicTrough ? (
    <>
      <Modal
        width={600}
        visible={dialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('solarCollectorMenu.RelativeAzimuth', lang)}
            <label style={{ color: 'red', fontWeight: 'bold' }}>
              {rejectRef.current
                ? ': ' +
                  i18n.t('message.NotApplicableToSelectedAction', lang) +
                  (rejectedValue.current !== undefined
                    ? ' (' + Util.toDegrees(rejectedValue.current).toFixed(1) + '°)'
                    : '')
                : ''}
            </label>
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setRelativeAzimuth(inputRelativeAzimuth);
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
          <Col className="gutter-row" span={6}>
            <InputNumber
              min={-180}
              max={180}
              style={{ width: 120 }}
              precision={1}
              value={Util.toDegrees(inputRelativeAzimuth)}
              step={1}
              formatter={(a) => Number(a).toFixed(1) + '°'}
              onChange={(value) => setInputRelativeAzimuth(Util.toRadians(value))}
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
            span={17}
          >
            <Radio.Group onChange={onScopeChange} value={actionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>
                  {i18n.t('parabolicTroughMenu.OnlyThisParabolicTrough', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                  {i18n.t('parabolicTroughMenu.AllParabolicTroughsAboveFoundation', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisType}>
                  {i18n.t('parabolicTroughMenu.AllParabolicTroughs', lang)}
                </Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  ) : (
    <></>
  );
};

export default ParabolicTroughRelativeAzimuthInput;
