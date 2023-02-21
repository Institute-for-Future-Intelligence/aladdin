/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Input, Modal, Row, Select } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { usePrimitiveStore } from '../../../stores/commonPrimitive';
import { ModelType } from '../../../types';

const { Option } = Select;

const ModelAnnotationDialog = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const loggable = useStore(Selector.loggable);
  const language = useStore(Selector.language);

  const [modelType, setModelType] = useState<ModelType>(usePrimitiveStore.getState().modelType);
  const [modelLabel, setModelLabel] = useState<string | undefined>(useStore.getState().cloudFile);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLElement | null>(null);
  const okButtonClickedRef = useRef<boolean>(false);

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

  const onCancelClick = () => {
    setDialogVisible(false);
    okButtonClickedRef.current = false;
  };

  const onOkClick = () => {
    usePrimitiveStore.setState((state) => {
      state.publishOnModelsMapFlag = !state.publishOnModelsMapFlag;
      state.modelType = modelType;
      state.modelLabel = modelLabel;
    });
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Publish on Map of Models',
          timestamp: new Date().getTime(),
        };
      });
    }
    setDialogVisible(false);
  };

  return (
    <Modal
      width={560}
      visible={true}
      title={
        <div
          style={{ width: '100%', cursor: 'move' }}
          onMouseOver={() => setDragEnabled(true)}
          onMouseOut={() => setDragEnabled(false)}
        >
          {i18n.t('menu.file.PublishOnModelsMap', lang)}
        </div>
      }
      footer={[
        <Button key="Cancel" onClick={onCancelClick}>
          {i18n.t('word.Cancel', lang)}
        </Button>,
        <Button key="OK" type="primary" ref={okButtonRef} onClick={onOkClick}>
          {i18n.t('word.OK', lang)}
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
        <Col className="gutter-row" span={14}>
          {i18n.t('shared.ModelType', lang) + ':'}
        </Col>
        <Col className="gutter-row" span={10}>
          <Select
            style={{ width: '100%' }}
            value={modelType}
            onChange={(value) => {
              setModelType(value);
            }}
          >
            <Option key={ModelType.UNKNOWN} value={ModelType.UNKNOWN}>
              {i18n.t('word.Unknown', lang)}
            </Option>
            <Option key={ModelType.BUILDING} value={ModelType.BUILDING}>
              {i18n.t('word.Building', lang)}
            </Option>
            <Option key={ModelType.PHOTOVOLTAIC} value={ModelType.PHOTOVOLTAIC}>
              {i18n.t('word.Photovoltaic', lang)}
            </Option>
            <Option key={ModelType.PARABOLIC_DISH} value={ModelType.PARABOLIC_DISH}>
              {i18n.t('shared.ParabolicDishElement', lang)}
            </Option>
            <Option key={ModelType.PARABOLIC_TROUGH} value={ModelType.PARABOLIC_TROUGH}>
              {i18n.t('shared.ParabolicTroughElement', lang)}
            </Option>
            <Option key={ModelType.FRESNEL_REFLECTOR} value={ModelType.FRESNEL_REFLECTOR}>
              {i18n.t('shared.FresnelReflectorElement', lang)}
            </Option>
            <Option key={ModelType.SOLAR_POWER_TOWER} value={ModelType.SOLAR_POWER_TOWER}>
              {i18n.t('shared.HeliostatElement', lang)}
            </Option>
          </Select>
        </Col>
      </Row>

      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={14}>
          {i18n.t('word.Label', lang)}:
        </Col>
        <Col className="gutter-row" span={10}>
          <Input
            style={{ width: '100%' }}
            value={modelLabel ?? ''}
            onChange={(e) => {
              setModelLabel(e.target.value);
            }}
          />
        </Col>
      </Row>
    </Modal>
  );
};

export default React.memo(ModelAnnotationDialog);
