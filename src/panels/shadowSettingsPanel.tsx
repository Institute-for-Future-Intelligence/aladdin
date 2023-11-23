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

const ShadowSettingsPanel = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const addUndoable = useStore(Selector.addUndoable);
  const shadowCameraFar = useStore(Selector.viewState.shadowCameraFar);
  const shadowMapSize = useStore(Selector.viewState.shadowMapSize);

  const SHADOW_MAP_SIZE_STEP = 4096;
  const SHADOW_CAMERA_FAR_STEP = 10000;

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLElement | null>(null);
  const shadowCameraFarRef = useRef<number>(shadowCameraFar ? Math.round(shadowCameraFar) / SHADOW_CAMERA_FAR_STEP : 1);
  const shadowMapSizeRef = useRef<number>(shadowMapSize ? Math.round(shadowMapSize / SHADOW_MAP_SIZE_STEP) : 1);

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

  const setShadowCameraFar = (value: number) => {
    setCommonStore((state) => {
      state.viewState.shadowCameraFar = value;
    });
  };

  const setShadowMapSize = (value: number) => {
    setCommonStore((state) => {
      state.viewState.shadowMapSize = value;
    });
  };

  const apply = () => {
    const oldCameraFar = shadowCameraFar;
    const newCameraFar = shadowCameraFarRef.current * SHADOW_CAMERA_FAR_STEP;
    if (oldCameraFar !== newCameraFar) {
      const undoableChange = {
        name: 'Shadow Camera Far Distance',
        timestamp: Date.now(),
        oldValue: oldCameraFar,
        newValue: newCameraFar,
        undo: () => {
          setShadowCameraFar(undoableChange.oldValue as number);
        },
        redo: () => {
          setShadowCameraFar(undoableChange.newValue as number);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      setShadowCameraFar(newCameraFar);
    }

    const oldMapSize = shadowMapSize;
    const newMapSize = shadowMapSizeRef.current * SHADOW_MAP_SIZE_STEP;
    if (oldMapSize !== newMapSize) {
      const undoableChange = {
        name: 'Shadow Map Size',
        timestamp: Date.now(),
        oldValue: oldMapSize,
        newValue: newMapSize,
        undo: () => {
          setShadowMapSize(undoableChange.oldValue as number);
        },
        redo: () => {
          setShadowMapSize(undoableChange.newValue as number);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      setShadowMapSize(newMapSize);
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
          {`${i18n.t('shadowSettingsPanel.ShadowSettings', lang)}`}
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
        <Col className="gutter-row" span={18}>
          {i18n.t('shadowSettingsPanel.ShadowCameraFarDistance', lang) + ' ([1, 100]×' + SHADOW_CAMERA_FAR_STEP + '): '}
        </Col>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={1}
            max={100}
            style={{ width: '100%' }}
            precision={0}
            value={shadowCameraFarRef.current}
            step={1}
            onChange={(value) => {
              shadowCameraFarRef.current = Number(value);
              setUpdateFlag(!updateFlag);
            }}
            onBlur={(e) => {
              const value = (e.target as HTMLInputElement).value;
              const v = parseFloat(value);
              shadowCameraFarRef.current = Number.isNaN(v) ? 1 : v;
              setUpdateFlag(!updateFlag);
            }}
            onPressEnter={(e) => {
              const value = (e.target as HTMLInputElement).value;
              const v = parseFloat(value);
              shadowCameraFarRef.current = Number.isNaN(v) ? 1 : v;
              setUpdateFlag(!updateFlag);
            }}
          />
        </Col>
      </Row>
      <Row gutter={6} style={{ paddingBottom: '10px' }}>
        <Col className="gutter-row" span={18}>
          {i18n.t('shadowSettingsPanel.ShadowMapSize', lang) + ' ([1, 4]×' + SHADOW_MAP_SIZE_STEP + '): '}
        </Col>
        <Col className="gutter-row" span={6}>
          <InputNumber
            min={1}
            max={4}
            style={{ width: '100%' }}
            precision={0}
            value={shadowMapSizeRef.current}
            step={1}
            onChange={(value) => {
              shadowMapSizeRef.current = Number(value);
              setUpdateFlag(!updateFlag);
            }}
            onBlur={(e) => {
              const value = (e.target as HTMLInputElement).value;
              const v = parseFloat(value);
              shadowMapSizeRef.current = Number.isNaN(v) ? 1 : v;
              setUpdateFlag(!updateFlag);
            }}
            onPressEnter={(e) => {
              const value = (e.target as HTMLInputElement).value;
              const v = parseFloat(value);
              shadowMapSizeRef.current = Number.isNaN(v) ? 1 : v;
              setUpdateFlag(!updateFlag);
            }}
          />
        </Col>
      </Row>
      <Row style={{ fontSize: '10px' }}>
        <Col span={24}>
          {i18n.t('shadowSettingsPanel.Notes', lang)}:
          <br />
          <ul>
            <li>{i18n.t('shadowSettingsPanel.RefreshPageNote', lang)}</li>
            <li>{i18n.t('shadowSettingsPanel.MapSizeWarning', lang)}</li>
          </ul>
        </Col>
      </Row>
    </Modal>
  );
};

export default React.memo(ShadowSettingsPanel);
