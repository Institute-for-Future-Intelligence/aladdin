/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope, SolarStructure } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { FoundationModel } from 'src/models/FoundationModel';
import { ZERO_TOLERANCE } from 'src/constants';

const FoundationSolarReceiverOpticalEfficiencyInput = ({
  dialogVisible,
  setDialogVisible,
}: {
  dialogVisible: boolean;
  setDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateReceiverOpticalEfficiencyById = useStore(Selector.updateFoundationSolarReceiverOpticalEfficiencyById);
  const updateReceiverOpticalEfficiencyForAll = useStore(Selector.updateFoundationSolarReceiverOpticalEfficiencyForAll);
  const foundation = useStore(Selector.selectedElement) as FoundationModel;
  const addUndoable = useStore(Selector.addUndoable);
  const foundationActionScope = useStore(Selector.foundationActionScope);
  const setFoundationActionScope = useStore(Selector.setFoundationActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const [inputReceiverOpticalEfficiency, setInputReceiverOpticalEfficiency] = useState<number>(
    foundation?.solarReceiverOpticalEfficiency ?? 0.7,
  );
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

  useEffect(() => {
    if (foundation) {
      setInputReceiverOpticalEfficiency(foundation.solarReceiverOpticalEfficiency ?? 0.7);
    }
  }, [foundation]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setFoundationActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (efficiency: number) => {
    switch (foundationActionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Foundation && !e.locked) {
            const f = e as FoundationModel;
            if (f.solarStructure === SolarStructure.FocusPipe || f.solarStructure === SolarStructure.FocusTower) {
              if (
                f.solarReceiverOpticalEfficiency === undefined ||
                Math.abs(f.solarReceiverOpticalEfficiency - efficiency) > ZERO_TOLERANCE
              ) {
                return true;
              }
            }
          }
        }
        break;
      default:
        if (
          foundation?.solarReceiverOpticalEfficiency === undefined ||
          Math.abs(foundation?.solarReceiverOpticalEfficiency - efficiency) > ZERO_TOLERANCE
        ) {
          return true;
        }
    }
    return false;
  };

  const setReceiverOpticalEfficiency = (value: number) => {
    if (!foundation) return;
    if (!needChange(value)) return;
    switch (foundationActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldValuesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation) {
            oldValuesAll.set(elem.id, (elem as FoundationModel).solarReceiverOpticalEfficiency ?? 0.7);
          }
        }
        const undoableChangeAll = {
          name: 'Set Solar Receiver Optical Efficiency for All Foundations',
          timestamp: Date.now(),
          oldValues: oldValuesAll,
          newValue: value,
          undo: () => {
            for (const [id, ab] of undoableChangeAll.oldValues.entries()) {
              updateReceiverOpticalEfficiencyById(id, ab as number);
            }
          },
          redo: () => {
            updateReceiverOpticalEfficiencyForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateReceiverOpticalEfficiencyForAll(value);
        setApplyCount(applyCount + 1);
        break;
      default:
        if (foundation) {
          const oldReceiverOpticalEfficiency = foundation.solarReceiverOpticalEfficiency ?? 0.7;
          updateReceiverOpticalEfficiencyById(foundation.id, value);
          const undoableChange = {
            name: 'Set Solar Receiver Optical Efficiency on Foundation',
            timestamp: Date.now(),
            oldValue: oldReceiverOpticalEfficiency,
            newValue: value,
            changedElementId: foundation.id,
            undo: () => {
              updateReceiverOpticalEfficiencyById(undoableChange.changedElementId, undoableChange.oldValue as number);
            },
            redo: () => {
              updateReceiverOpticalEfficiencyById(undoableChange.changedElementId, undoableChange.newValue as number);
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
    setInputReceiverOpticalEfficiency(foundation?.solarReceiverOpticalEfficiency ?? 0.7);
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setReceiverOpticalEfficiency(inputReceiverOpticalEfficiency);
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
            {i18n.t('foundationMenu.SolarReceiverOpticalEfficiency', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setReceiverOpticalEfficiency(inputReceiverOpticalEfficiency);
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
              value={inputReceiverOpticalEfficiency}
              formatter={(a) => Number(a).toFixed(2)}
              onChange={(value) => setInputReceiverOpticalEfficiency(value)}
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

export default FoundationSolarReceiverOpticalEfficiencyInput;
