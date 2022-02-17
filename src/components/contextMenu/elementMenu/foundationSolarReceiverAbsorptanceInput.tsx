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

const FoundationSolarReceiverAbsorptanceInput = ({
  dialogVisible,
  setDialogVisible,
}: {
  dialogVisible: boolean;
  setDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateReceiverAbsorptanceById = useStore(Selector.updateFoundationSolarReceiverAbsorptanceById);
  const updateReceiverAbsorptanceForAll = useStore(Selector.updateFoundationSolarReceiverAbsorptanceForAll);
  const foundation = useStore(Selector.selectedElement) as FoundationModel;
  const addUndoable = useStore(Selector.addUndoable);
  const foundationActionScope = useStore(Selector.foundationActionScope);
  const setFoundationActionScope = useStore(Selector.setFoundationActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const [inputReceiverAbsorptance, setInputReceiverAbsorptance] = useState<number>(
    foundation?.solarReceiverAbsorptance ?? 0.95,
  );
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

  useEffect(() => {
    if (foundation) {
      setInputReceiverAbsorptance(foundation.solarReceiverAbsorptance ?? 0.95);
    }
  }, [foundation]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setFoundationActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (absorptance: number) => {
    switch (foundationActionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked) {
            const f = e as FoundationModel;
            if (f.solarReceiver) {
              if (
                f.solarReceiverAbsorptance === undefined ||
                Math.abs(f.solarReceiverAbsorptance - absorptance) > ZERO_TOLERANCE
              ) {
                return true;
              }
            }
          }
        }
        break;
      default:
        if (
          foundation?.solarReceiverAbsorptance === undefined ||
          Math.abs(foundation?.solarReceiverAbsorptance - absorptance) > ZERO_TOLERANCE
        ) {
          return true;
        }
    }
    return false;
  };

  const setReceiverAbsorptance = (value: number) => {
    if (!foundation) return;
    if (!needChange(value)) return;
    switch (foundationActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldValuesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation) {
            oldValuesAll.set(elem.id, (elem as FoundationModel).solarReceiverAbsorptance ?? 0.95);
          }
        }
        const undoableChangeAll = {
          name: 'Set Solar Receiver Absorptance for All Foundations',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, ab] of undoableChangeAll.oldValues.entries()) {
              updateReceiverAbsorptanceById(id, ab as number);
            }
          },
          redo: () => {
            updateReceiverAbsorptanceForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateReceiverAbsorptanceForAll(value);
        setApplyCount(applyCount + 1);
        break;
      default:
        if (foundation) {
          const oldReceiverAbsorptance = foundation.solarReceiverAbsorptance ?? 0.95;
          updateReceiverAbsorptanceById(foundation.id, value);
          const undoableChange = {
            name: 'Set Solar Receiver Absorptance on Foundation',
            timestamp: Date.now(),
            oldValue: oldReceiverAbsorptance,
            newValue: value,
            changedElementId: foundation.id,
            undo: () => {
              updateReceiverAbsorptanceById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateReceiverAbsorptanceById(undoableChange.changedElementId, undoableChange.newValue as number);
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
    setInputReceiverAbsorptance(foundation?.solarReceiverAbsorptance ?? 0.95);
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setReceiverAbsorptance(inputReceiverAbsorptance);
    setDialogVisible(false);
    setApplyCount(0);
  };

  return (
    <>
      <Modal
        width={500}
        visible={dialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('foundationMenu.SolarReceiverAbsorptance', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setReceiverAbsorptance(inputReceiverAbsorptance);
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
          <Col className="gutter-row" span={8}>
            <InputNumber
              min={0}
              max={1}
              style={{ width: 120 }}
              step={0.01}
              precision={2}
              value={inputReceiverAbsorptance}
              formatter={(a) => Number(a).toFixed(2)}
              onChange={(value) => setInputReceiverAbsorptance(value)}
              onPressEnter={ok}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [0, 1]
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

export default FoundationSolarReceiverAbsorptanceInput;
