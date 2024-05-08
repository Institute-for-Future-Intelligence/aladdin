/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Row } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import i18n from '../i18n/i18n';
import { UndoableChange } from '../undo/UndoableChange';
import { usePrimitiveStore } from '../stores/commonPrimitive';

const NavigationPanel = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const addUndoable = useStore(Selector.addUndoable);
  const minimumMoveSpeed = useStore(Selector.minimumNavigationMoveSpeed);
  const minimumTurnSpeed = useStore(Selector.minimumNavigationTurnSpeed);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  const minimumMoveSpeedRef = useRef<number>(minimumMoveSpeed);
  const minimumTurnSpeedRef = useRef<number>(minimumTurnSpeed);

  const lang = { lng: language };

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

  const setMinimumMoveSpeed = (value: number) => {
    setCommonStore((state) => {
      state.minimumNavigationMoveSpeed = value;
    });
    usePrimitiveStore.getState().set((state) => {
      state.navigationMoveSpeed = value;
    });
  };

  const setMinimumTurnSpeed = (value: number) => {
    setCommonStore((state) => {
      state.minimumNavigationTurnSpeed = value;
    });
    usePrimitiveStore.getState().set((state) => {
      state.navigationTurnSpeed = value;
    });
  };

  const apply = () => {
    const oldMoveSpeed = minimumMoveSpeed;
    const newMoveSpeed = minimumMoveSpeedRef.current;
    if (oldMoveSpeed !== newMoveSpeed) {
      const undoableChange = {
        name: 'Minimum Navigation Move Speed',
        timestamp: Date.now(),
        oldValue: oldMoveSpeed,
        newValue: newMoveSpeed,
        undo: () => {
          setMinimumMoveSpeed(undoableChange.oldValue as number);
        },
        redo: () => {
          setMinimumMoveSpeed(undoableChange.newValue as number);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      setMinimumMoveSpeed(newMoveSpeed);
    }

    const oldTurnSpeed = minimumTurnSpeed;
    const newTurnSpeed = minimumTurnSpeedRef.current;
    if (oldTurnSpeed !== newTurnSpeed) {
      const undoableChange = {
        name: 'Minimum Navigation Turn Speed',
        timestamp: Date.now(),
        oldValue: oldTurnSpeed,
        newValue: newTurnSpeed,
        undo: () => {
          setMinimumTurnSpeed(undoableChange.oldValue as number);
        },
        redo: () => {
          setMinimumTurnSpeed(undoableChange.newValue as number);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      setMinimumTurnSpeed(newTurnSpeed);
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
          {`${i18n.t('navigationPanel.NavigationParameters', lang)}`}
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
        <Col className="gutter-row" span={16}>
          {i18n.t('navigationPanel.MinimumMoveSpeed', lang) + ' ([1, 10]): '}
        </Col>
        <Col className="gutter-row" span={8}>
          <InputNumber
            min={1}
            max={10}
            style={{ width: '100%' }}
            precision={0}
            value={minimumMoveSpeedRef.current}
            step={1}
            onChange={(value) => {
              minimumMoveSpeedRef.current = Number(value);
              setUpdateFlag(!updateFlag);
            }}
            onBlur={(e) => {
              const value = (e.target as HTMLInputElement).value;
              const v = parseFloat(value);
              minimumMoveSpeedRef.current = Number.isNaN(v) ? 3 : v;
              setUpdateFlag(!updateFlag);
            }}
            onPressEnter={(e) => {
              const value = (e.target as HTMLInputElement).value;
              const v = parseFloat(value);
              minimumMoveSpeedRef.current = Number.isNaN(v) ? 3 : v;
              setUpdateFlag(!updateFlag);
            }}
          />
        </Col>
      </Row>
      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={16}>
          {i18n.t('navigationPanel.MinimumTurnSpeed', lang) + ' ([1, 5]): '}
        </Col>
        <Col className="gutter-row" span={8}>
          <InputNumber
            min={1}
            max={5}
            style={{ width: '100%' }}
            precision={0}
            value={minimumTurnSpeedRef.current}
            step={1}
            onChange={(value) => {
              minimumTurnSpeedRef.current = Number(value);
              setUpdateFlag(!updateFlag);
            }}
            onBlur={(e) => {
              const value = (e.target as HTMLInputElement).value;
              const v = parseFloat(value);
              minimumTurnSpeedRef.current = Number.isNaN(v) ? 3 : v;
              setUpdateFlag(!updateFlag);
            }}
            onPressEnter={(e) => {
              const value = (e.target as HTMLInputElement).value;
              const v = parseFloat(value);
              minimumTurnSpeedRef.current = Number.isNaN(v) ? 3 : v;
              setUpdateFlag(!updateFlag);
            }}
          />
        </Col>
      </Row>
    </Modal>
  );
};

export default React.memo(NavigationPanel);
