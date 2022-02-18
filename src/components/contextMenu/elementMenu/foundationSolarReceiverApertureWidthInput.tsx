/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { FoundationModel } from 'src/models/FoundationModel';
import { ZERO_TOLERANCE } from 'src/constants';

const FoundationSolarReceiverApertureWidthInput = ({
  dialogVisible,
  setDialogVisible,
}: {
  dialogVisible: boolean;
  setDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateReceiverApertureById = useStore(Selector.updateFoundationSolarReceiverApertureWidthById);
  const updateReceiverApertureForAll = useStore(Selector.updateFoundationSolarReceiverApertureWidthForAll);
  const foundation = useStore(Selector.selectedElement) as FoundationModel;
  const addUndoable = useStore(Selector.addUndoable);
  const foundationActionScope = useStore(Selector.foundationActionScope);
  const setFoundationActionScope = useStore(Selector.setFoundationActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const [inputReceiverAperture, setInputReceiverAperture] = useState<number>(
    foundation?.solarReceiverApertureWidth ?? 0.6,
  );
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

  useEffect(() => {
    if (foundation) {
      setInputReceiverAperture(foundation.solarReceiverApertureWidth ?? 0.6);
    }
  }, [foundation]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setFoundationActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (receiverAperture: number) => {
    switch (foundationActionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked) {
            const f = e as FoundationModel;
            if (f.solarReceiver) {
              if (
                f.solarReceiverApertureWidth === undefined ||
                Math.abs(f.solarReceiverApertureWidth - receiverAperture) > ZERO_TOLERANCE
              ) {
                return true;
              }
            }
          }
        }
        break;
      default:
        if (
          foundation?.solarReceiverApertureWidth === undefined ||
          Math.abs(foundation?.solarReceiverApertureWidth - receiverAperture) > ZERO_TOLERANCE
        ) {
          return true;
        }
    }
    return false;
  };

  const setReceiverAperture = (value: number) => {
    if (!foundation) return;
    if (!needChange(value)) return;
    switch (foundationActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldReceiverAperturesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation) {
            oldReceiverAperturesAll.set(elem.id, (elem as FoundationModel).solarReceiverApertureWidth ?? 0.6);
          }
        }
        const undoableChangeAll = {
          name: 'Set Solar Receiver Aperture for All Foundations',
          timestamp: Date.now(),
          oldValues: oldReceiverAperturesAll,
          newValue: value,
          undo: () => {
            for (const [id, rh] of undoableChangeAll.oldValues.entries()) {
              updateReceiverApertureById(id, rh as number);
            }
          },
          redo: () => {
            updateReceiverApertureForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateReceiverApertureForAll(value);
        setApplyCount(applyCount + 1);
        break;
      default:
        if (foundation) {
          const oldReceiverAperture = foundation.solarReceiverApertureWidth ?? 0.6;
          updateReceiverApertureById(foundation.id, value);
          const undoableChange = {
            name: 'Set Solar Receiver Aperture on Foundation',
            timestamp: Date.now(),
            oldValue: oldReceiverAperture,
            newValue: value,
            changedElementId: foundation.id,
            undo: () => {
              updateReceiverApertureById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateReceiverApertureById(undoableChange.changedElementId, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
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
    setInputReceiverAperture(foundation?.solarReceiverApertureWidth ?? 0.6);
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setReceiverAperture(inputReceiverAperture);
    setDialogVisible(false);
    setApplyCount(0);
  };

  return (
    <>
      <Modal
        width={550}
        visible={dialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('foundationMenu.SolarReceiverApertureWidth', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setReceiverAperture(inputReceiverAperture);
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
              min={0.1}
              max={2}
              style={{ width: 120 }}
              step={0.01}
              precision={2}
              value={inputReceiverAperture}
              formatter={(a) => Number(a).toFixed(2)}
              onChange={(value) => setInputReceiverAperture(value)}
              onPressEnter={ok}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [0.1, 2] {i18n.t('word.MeterAbbreviation', lang)}
            </div>
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
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('foundationMenu.AllFoundations', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default FoundationSolarReceiverApertureWidthInput;
