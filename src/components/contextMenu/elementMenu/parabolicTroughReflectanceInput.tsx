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
import { ZERO_TOLERANCE } from '../../../constants';

const ParabolicTroughReflectanceInput = ({
  dialogVisible,
  setDialogVisible,
}: {
  dialogVisible: boolean;
  setDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateById = useStore(Selector.updateCspReflectanceById);
  const updateAboveFoundation = useStore(Selector.updateCspReflectanceAboveFoundation);
  const updateForAll = useStore(Selector.updateCspReflectanceForAll);
  const parabolicTrough = useStore(Selector.selectedElement) as ParabolicTroughModel;
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.solarPanelActionScope);
  const setActionScope = useStore(Selector.setSolarPanelActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const [inputReflectance, setInputReflectance] = useState<number>(parabolicTrough?.reflectance ?? 0.9);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

  useEffect(() => {
    if (parabolicTrough) {
      setInputReflectance(parabolicTrough.reflectance);
    }
  }, [parabolicTrough]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (reflectance: number) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicTrough && !e.locked) {
            const pt = e as ParabolicTroughModel;
            if (Math.abs(pt.reflectance - reflectance) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicTrough && e.foundationId === parabolicTrough?.foundationId && !e.locked) {
            const pt = e as ParabolicTroughModel;
            if (Math.abs(pt.reflectance - reflectance) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(parabolicTrough?.reflectance - reflectance) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setReflectance = (value: number) => {
    if (!parabolicTrough) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldReflectancesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicTrough) {
            oldReflectancesAll.set(elem.id, (elem as ParabolicTroughModel).reflectance);
          }
        }
        const undoableChangeAll = {
          name: 'Set Reflectance for All Parabolic Troughs',
          timestamp: Date.now(),
          oldValues: oldReflectancesAll,
          newValue: value,
          undo: () => {
            for (const [id, rf] of undoableChangeAll.oldValues.entries()) {
              updateById(id, rf as number);
            }
          },
          redo: () => {
            updateForAll(ObjectType.ParabolicTrough, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(ObjectType.ParabolicTrough, value);
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (parabolicTrough.foundationId) {
          const oldReflectancesAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicTrough && elem.foundationId === parabolicTrough.foundationId) {
              oldReflectancesAboveFoundation.set(elem.id, (elem as ParabolicTroughModel).reflectance);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Reflectance for All Parabolic Troughs Above Foundation',
            timestamp: Date.now(),
            oldValues: oldReflectancesAboveFoundation,
            newValue: value,
            groupId: parabolicTrough.foundationId,
            undo: () => {
              for (const [id, rf] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, rf as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  ObjectType.ParabolicTrough,
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(ObjectType.ParabolicTrough, parabolicTrough.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (parabolicTrough) {
          const oldReflectance = parabolicTrough.reflectance;
          const undoableChange = {
            name: 'Set Parabolic Trough Reflectance',
            timestamp: Date.now(),
            oldValue: oldReflectance,
            newValue: value,
            changedElementId: parabolicTrough.id,
            undo: () => {
              updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateById(parabolicTrough.id, value);
          setApplyCount(applyCount + 1);
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
    setInputReflectance(parabolicTrough.reflectance);
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setReflectance(inputReflectance);
    setDialogVisible(false);
    setApplyCount(0);
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
            {i18n.t('concentratedSolarPowerCollectorMenu.Reflectance', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setReflectance(inputReflectance);
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
              min={0}
              max={1}
              style={{ width: 120 }}
              precision={2}
              value={inputReflectance}
              step={0.01}
              formatter={(a) => Number(a).toFixed(2)}
              onChange={(value) => setInputReflectance(value)}
              onPressEnter={ok}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [0, 1]
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

export default ParabolicTroughReflectanceInput;
