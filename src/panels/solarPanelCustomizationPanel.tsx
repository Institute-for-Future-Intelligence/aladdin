/*
 * @Copyright 2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Input, InputNumber, Modal, Row, Select } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import i18n from '../i18n/i18n';
import { useLanguage } from '../hooks';

const { Option } = Select;

const SolarPanelCustomizationPanel = React.memo(({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  const modelRef = useRef<string>('Unknown');
  const cellTypeRef = useRef<string>('Monocrystalline');
  const colorRef = useRef<string>('Black');
  const widthRef = useRef<number>(1);
  const heightRef = useRef<number>(1);
  const bifacialityFactorRef = useRef<number>(0);
  const efficiencyRef = useRef<number>(0.2);
  const noctRef = useRef<number>(45);
  const pmaxTCRef = useRef<number>(-0.002);

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

  const apply = () => {};

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
          {i18n.t('menu.settings.CustomizeSolarPanel', lang)}
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
      <Row gutter={6} style={{ paddingTop: '10px', paddingBottom: '4px' }}>
        <Col className="gutter-row" span={16}>
          {i18n.t('pvModelPanel.Model', lang) + ': '}
        </Col>
        <Col className="gutter-row" span={8}>
          <Input
            value={modelRef.current}
            onChange={(e) => {
              modelRef.current = e.target.value;
              setUpdateFlag(!updateFlag);
            }}
          />
        </Col>
      </Row>

      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={16}>
          {i18n.t('word.Width', lang) + ' ([0.1m, 3m]): '}
        </Col>
        <Col className="gutter-row" span={8}>
          <InputNumber
            min={0.1}
            max={3}
            style={{ width: '100%' }}
            precision={2}
            value={widthRef.current}
            step={0.01}
            onChange={(value) => {
              if (value === null) return;
              widthRef.current = value;
              setUpdateFlag(!updateFlag);
            }}
            onBlur={(e) => {
              const v = parseFloat((e.target as HTMLInputElement).value);
              widthRef.current = Number.isNaN(v) ? 1 : v;
              setUpdateFlag(!updateFlag);
            }}
            onPressEnter={(e) => {
              const v = parseFloat((e.target as HTMLInputElement).value);
              widthRef.current = Number.isNaN(v) ? 1 : v;
              setUpdateFlag(!updateFlag);
            }}
          />
        </Col>
      </Row>

      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={16}>
          {i18n.t('word.Height', lang) + ' ([0.1m, 3m]): '}
        </Col>
        <Col className="gutter-row" span={8}>
          <InputNumber
            min={0.1}
            max={3}
            style={{ width: '100%' }}
            precision={2}
            value={widthRef.current}
            step={0.01}
            onChange={(value) => {
              if (value === null) return;
              heightRef.current = value;
              setUpdateFlag(!updateFlag);
            }}
            onBlur={(e) => {
              const v = parseFloat((e.target as HTMLInputElement).value);
              heightRef.current = Number.isNaN(v) ? 1 : v;
              setUpdateFlag(!updateFlag);
            }}
            onPressEnter={(e) => {
              const v = parseFloat((e.target as HTMLInputElement).value);
              heightRef.current = Number.isNaN(v) ? 1 : v;
              setUpdateFlag(!updateFlag);
            }}
          />
        </Col>
      </Row>

      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={16}>
          {i18n.t('pvModelPanel.CellType', lang) + ':'}
        </Col>
        <Col className="gutter-row" span={8}>
          <Select style={{ width: '100%' }} value={cellTypeRef.current} onChange={(value) => {}}>
            <Option key={'Monocrystalline'} value={'Monocrystalline'}>
              {i18n.t('pvModelPanel.Monocrystalline', lang)}
            </Option>
            <Option key={'Polycrystalline'} value={'Polycrystalline'}>
              {i18n.t('pvModelPanel.Polycrystalline', lang)}
            </Option>
            <Option key={'Thin Film'} value={'Thin Film'}>
              {i18n.t('pvModelPanel.ThinFilm', lang)}
            </Option>
          </Select>
        </Col>
      </Row>

      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={16}>
          {i18n.t('pvModelPanel.BifacialityFactor', lang) + ':'}
        </Col>
        <Col className="gutter-row" span={8}>
          <InputNumber
            style={{ width: '100%' }}
            precision={2}
            value={bifacialityFactorRef.current}
            onChange={(value) => {}}
          />
        </Col>
      </Row>

      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={16}>
          {i18n.t('word.Color', lang) + ':'}
        </Col>
        <Col className="gutter-row" span={8}>
          <Select style={{ width: '100%' }} value={colorRef.current} onChange={(value) => {}}>
            <Option key={'Black'} value={'Black'}>
              {i18n.t('pvModelPanel.Black', lang)}
            </Option>
            <Option key={'Blue'} value={'Blue'}>
              {i18n.t('pvModelPanel.Blue', lang)}
            </Option>
          </Select>
        </Col>
      </Row>

      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={16}>
          {i18n.t('pvModelPanel.SolarCellEfficiency', lang) + ' (%):'}
        </Col>
        <Col className="gutter-row" span={8}>
          <InputNumber
            style={{ width: '100%' }}
            precision={2}
            value={100 * efficiencyRef.current}
            onChange={(value) => {}}
          />
        </Col>
      </Row>

      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={16}>
          {i18n.t('pvModelPanel.NominalOperatingCellTemperature', lang) + ' (°C):'}
        </Col>
        <Col className="gutter-row" span={8}>
          <InputNumber style={{ width: '100%' }} precision={1} value={noctRef.current} onChange={(value) => {}} />
        </Col>
      </Row>

      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={16}>
          {i18n.t('pvModelPanel.TemperatureCoefficientOfPmax', lang) + ' (%/°C):'}
        </Col>
        <Col className="gutter-row" span={8}>
          <Input style={{ width: '100%' }} value={pmaxTCRef.current} onChange={(value) => {}} />
        </Col>
      </Row>
    </Modal>
  );
});

export default SolarPanelCustomizationPanel;
