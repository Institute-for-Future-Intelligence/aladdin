/*
 * @Copyright 2023-2025. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Row } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import i18n from '../i18n/i18n';
import { UndoableChange } from '../undo/UndoableChange';
import { useLanguage } from '../hooks';

const EditorPanel = React.memo(({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const moveStep = useStore(Selector.moveStep);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  const moveStepRef = useRef<number>(moveStep);

  const lang = useLanguage();

  useEffect(() => {
    okButtonRef.current?.focus();
  }, []);

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

  const setMoveStep = (value: number) => {
    setCommonStore((state) => {
      state.moveStep = value;
    });
  };

  const apply = () => {
    const oldValue = moveStep;
    const newValue = moveStepRef.current;
    if (oldValue !== newValue) {
      const undoableChange = {
        name: 'Arrow Key Move Step',
        timestamp: Date.now(),
        oldValue,
        newValue,
        undo: () => {
          setMoveStep(undoableChange.oldValue as number);
        },
        redo: () => {
          setMoveStep(undoableChange.newValue as number);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      setMoveStep(newValue);
    }
  };

  const onCancelClick = () => {
    setDialogVisible(false);
  };

  const onOkClick = () => {
    apply();
    setDialogVisible(false);
  };

  return (
    <Modal
      width={500}
      open={true}
      title={
        <div
          style={{ width: '100%', cursor: 'move' }}
          onMouseOver={() => setDragEnabled(true)}
          onMouseOut={() => setDragEnabled(false)}
        >
          {`${i18n.t('editorPanel.EditorParameters', lang)}`}
        </div>
      }
      footer={[
        <Button key="Cancel" onClick={onCancelClick}>
          {`${i18n.t('word.Cancel', lang)}`}
        </Button>,
        <Button key="OK" type="primary" ref={okButtonRef} onClick={onOkClick}>
          {`${i18n.t('word.OK', lang)}`}
        </Button>,
      ]}
      // this must be specified for the x button in the upper-right corner to work
      onCancel={() => {
        setDialogVisible(false);
      }}
      maskClosable={false}
      destroyOnClose={false}
      modalRender={(modal) => (
        <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
          <div ref={dragRef}>{modal}</div>
        </Draggable>
      )}
    >
      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col span={16}>{i18n.t('editorPanel.ArrowKeyMoveStep', lang) + ' ([0.01, 1]): '}</Col>
        <Col span={8}>
          <InputNumber
            addonAfter={i18n.t('word.MeterAbbreviation', lang)}
            min={0.01}
            max={1}
            style={{ width: '100%' }}
            precision={2}
            value={moveStepRef.current}
            step={0.01}
            onChange={(value) => {
              moveStepRef.current = Number(value);
              setUpdateFlag(!updateFlag);
            }}
            onBlur={(e) => {
              const value = (e.target as HTMLInputElement).value;
              const v = parseFloat(value);
              moveStepRef.current = Number.isNaN(v) ? 0.1 : v;
              setUpdateFlag(!updateFlag);
            }}
            onPressEnter={(e) => {
              const value = (e.target as HTMLInputElement).value;
              const v = parseFloat(value);
              moveStepRef.current = Number.isNaN(v) ? 0.1 : v;
              setUpdateFlag(!updateFlag);
            }}
          />
        </Col>
      </Row>
    </Modal>
  );
});

export default EditorPanel;
