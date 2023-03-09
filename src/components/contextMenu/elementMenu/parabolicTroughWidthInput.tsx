/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
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
import { ZERO_TOLERANCE } from '../../../constants';
import { Util } from '../../../Util';

// for parabolic troughs, since the default alignment is north-south, ly is always much larger than lx.
// to agree with the convention, we call ly length and lx width, reversed from most other elements in Aladdin.

const ParabolicTroughWidthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateLxById = useStore(Selector.updateElementLxById);
  const updateLxAboveFoundation = useStore(Selector.updateElementLxAboveFoundation);
  const updateLxForAll = useStore(Selector.updateElementLxForAll);
  const getParent = useStore(Selector.getParent);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.parabolicTroughActionScope);
  const setActionScope = useStore(Selector.setParabolicTroughActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const parabolicTrough = useStore((state) =>
    state.elements.find((e) => e.selected && e.type === ObjectType.ParabolicTrough),
  ) as ParabolicTroughModel;

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();
  const inputWidthRef = useRef<number>(parabolicTrough?.lx ?? 2);

  const lang = { lng: language };

  useEffect(() => {
    if (parabolicTrough) {
      inputWidthRef.current = parabolicTrough.lx;
    }
  }, [parabolicTrough]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const withinParent = (trough: ParabolicTroughModel, lx: number) => {
    const parent = getParent(trough);
    if (parent) {
      const clone = JSON.parse(JSON.stringify(trough)) as ParabolicTroughModel;
      clone.lx = lx;
      return Util.isSolarCollectorWithinHorizontalSurface(clone, parent);
    }
    return false;
  };

  const rejectChange = (trough: ParabolicTroughModel, lx: number) => {
    // check if the new width will cause the parabolic trough to be out of the bound
    if (!withinParent(trough, lx)) {
      return true;
    }
    // other check?
    return false;
  };

  const needChange = (lx: number) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicTrough && !e.locked) {
            const trough = e as ParabolicTroughModel;
            if (Math.abs(trough.lx - lx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicTrough && e.foundationId === parabolicTrough?.foundationId && !e.locked) {
            const trough = e as ParabolicTroughModel;
            if (Math.abs(trough.lx - lx) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(parabolicTrough?.lx - lx) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setWidth = (value: number) => {
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
          inputWidthRef.current = parabolicTrough.lx;
        } else {
          const oldWidthsAll = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicTrough) {
              oldWidthsAll.set(elem.id, elem.lx);
            }
          }
          const undoableChangeAll = {
            name: 'Set Width for All Parabolic Troughs',
            timestamp: Date.now(),
            oldValues: oldWidthsAll,
            newValue: value,
            undo: () => {
              for (const [id, lx] of undoableChangeAll.oldValues.entries()) {
                updateLxById(id, lx as number);
              }
            },
            redo: () => {
              updateLxForAll(ObjectType.ParabolicTrough, undoableChangeAll.newValue as number);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAll);
          updateLxForAll(ObjectType.ParabolicTrough, value);
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
            inputWidthRef.current = parabolicTrough.lx;
          } else {
            const oldWidthsAboveFoundation = new Map<string, number>();
            for (const elem of elements) {
              if (elem.type === ObjectType.ParabolicTrough && elem.foundationId === parabolicTrough.foundationId) {
                oldWidthsAboveFoundation.set(elem.id, elem.lx);
              }
            }
            const undoableChangeAboveFoundation = {
              name: 'Set Width for All Parabolic Troughs Above Foundation',
              timestamp: Date.now(),
              oldValues: oldWidthsAboveFoundation,
              newValue: value,
              groupId: parabolicTrough.foundationId,
              undo: () => {
                for (const [id, lx] of undoableChangeAboveFoundation.oldValues.entries()) {
                  updateLxById(id, lx as number);
                }
              },
              redo: () => {
                if (undoableChangeAboveFoundation.groupId) {
                  updateLxAboveFoundation(
                    ObjectType.ParabolicTrough,
                    undoableChangeAboveFoundation.groupId,
                    undoableChangeAboveFoundation.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeAboveFoundation);
            updateLxAboveFoundation(ObjectType.ParabolicTrough, parabolicTrough.foundationId, value);
            setApplyCount(applyCount + 1);
          }
        }
        break;
      default:
        const p = getElementById(parabolicTrough.id) as ParabolicTroughModel;
        const oldWidth = p ? p.lx : parabolicTrough.lx;
        rejectRef.current = rejectChange(parabolicTrough, value);
        if (rejectRef.current) {
          rejectedValue.current = value;
          inputWidthRef.current = oldWidth;
        } else {
          const undoableChange = {
            name: 'Set Parabolic Trough Width',
            timestamp: Date.now(),
            oldValue: oldWidth,
            newValue: value,
            changedElementId: parabolicTrough.id,
            changedElementType: parabolicTrough.type,
            undo: () => {
              updateLxById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateLxById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateLxById(parabolicTrough.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.parabolicTroughWidth = value;
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
    inputWidthRef.current = parabolicTrough.lx;
    rejectRef.current = false;
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setWidth(inputWidthRef.current);
    if (!rejectRef.current) {
      setDialogVisible(false);
      setApplyCount(0);
    }
  };

  // for some reason, we have to confirm the type first. otherwise, other popup menus may invoke this
  return parabolicTrough?.type === ObjectType.ParabolicTrough ? (
    <>
      <Modal
        width={600}
        visible={true}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('word.Width', lang)}
            <span style={{ color: 'red', fontWeight: 'bold' }}>
              {rejectRef.current
                ? ': ' +
                  i18n.t('message.NotApplicableToSelectedAction', lang) +
                  (rejectedValue.current !== undefined ? ' (' + rejectedValue.current.toFixed(2) + ')' : '')
                : ''}
            </span>
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setWidth(inputWidthRef.current);
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
              min={1}
              max={10}
              step={0.5}
              precision={2}
              style={{ width: 120 }}
              value={inputWidthRef.current}
              onChange={(value) => {
                inputWidthRef.current = value;
                setUpdateFlag(!updateFlag);
              }}
              onPressEnter={ok}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.MinimumValue', lang)}: 1 {i18n.t('word.MeterAbbreviation', lang)}
              <br />
              {i18n.t('word.MaximumValue', lang)}: 10 {i18n.t('word.MeterAbbreviation', lang)}
            </div>
          </Col>
          <Col className="gutter-row" span={1} style={{ verticalAlign: 'middle', paddingTop: '6px' }}>
            {i18n.t('word.MeterAbbreviation', lang)}
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

export default ParabolicTroughWidthInput;
