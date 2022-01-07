/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Row, Select } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { Orientation, RowAxis } from '../../../types';
import { Util } from '../../../Util';

const { Option } = Select;

const SolarPanelLayoutManager = ({
  dialogVisible,
  setDialogVisible,
}: {
  dialogVisible: boolean;
  setDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const pvModules = useStore(Selector.pvModules);
  const getPvModule = useStore(Selector.getPvModule);
  const addUndoable = useStore(Selector.addUndoable);

  const [selectedPvModel, setSelectedPvModel] = useState<string>('SPR-X21-335-BLK');
  const [selectedRowAxis, setSelectedRowAxis] = useState<RowAxis>(RowAxis.zonal);
  const [selectedOrientation, setSelectedOrientation] = useState<Orientation>(Orientation.portrait);
  const [tiltAngle, setTiltAngle] = useState<number>(0);
  const [panelWidth, setPanelWidth] = useState<number>(1.05); // the width of the default model
  const [rowWidth, setRowWidth] = useState<number>(panelWidth);
  const [interRowSpacing, setInterRowSpacing] = useState<number>(5);
  const [poleHeight, setPoleHeight] = useState<number>(1);
  const [poleSpacing, setPoleSpacing] = useState<number>(3);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };
  const pvModel = getPvModule(selectedPvModel);
  const parent = getSelectedElement();

  useEffect(() => {
    const pvModel = getPvModule(selectedPvModel) ?? getPvModule('SPR-X21-335-BLK');
    setPanelWidth(selectedOrientation === Orientation.portrait ? pvModel.width : pvModel.length);
  }, [selectedPvModel]);

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

  const panelize = (value: number) => {
    let l = value ?? 1;
    const n = Math.max(1, Math.ceil((l - panelWidth / 2) / panelWidth));
    l = n * panelWidth;
    return l;
  };

  const layout = () => {};

  return (
    <>
      <Modal
        width={560}
        visible={dialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('polygonMenu.SolarPanelArrayLayout', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              layout();
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button
            key="Cancel"
            onClick={() => {
              setDialogVisible(false);
            }}
          >
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button
            key="OK"
            type="primary"
            onClick={() => {
              layout();
              setDialogVisible(false);
            }}
          >
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button in the upper-right corner to work
        onCancel={() => {
          setDialogVisible(false);
        }}
        destroyOnClose={false}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('polygonMenu.SolarPanelArrayModel', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={10}>
            <Select
              defaultValue="Custom"
              style={{ width: '100%' }}
              value={selectedPvModel}
              onChange={(value) => {
                setSelectedPvModel(value);
                setUpdateFlag(!updateFlag);
              }}
            >
              {Object.keys(pvModules).map((key) => (
                <Option key={key} value={key}>
                  {key}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('polygonMenu.SolarPanelArrayRowAxis', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={10}>
            <Select
              style={{ width: '100%' }}
              value={selectedRowAxis}
              onChange={(value) => {
                setSelectedRowAxis(value);
                setUpdateFlag(!updateFlag);
              }}
            >
              <Option key={RowAxis.zonal} value={RowAxis.zonal}>
                {i18n.t('polygonMenu.SolarPanelArrayZonalRowAxis', lang)}
              </Option>
              <Option key={RowAxis.meridional} value={RowAxis.meridional}>
                {i18n.t('polygonMenu.SolarPanelArrayMeridionalRowAxis', lang)}
              </Option>
            </Select>
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('polygonMenu.SolarPanelArrayOrientation', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={10}>
            <Select
              style={{ width: '100%' }}
              value={selectedOrientation}
              onChange={(value) => {
                setSelectedOrientation(value);
                setUpdateFlag(!updateFlag);
              }}
            >
              <Option key={Orientation.portrait} value={Orientation.portrait}>
                {i18n.t('solarPanelMenu.Portrait', lang)}
              </Option>
              <Option key={Orientation.landscape} value={Orientation.landscape}>
                {i18n.t('solarPanelMenu.Landscape', lang)}
              </Option>
            </Select>
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('polygonMenu.SolarPanelArrayTiltAngle', lang) + ' ([-90°, 90°]): '}
          </Col>
          <Col className="gutter-row" span={10}>
            <InputNumber
              min={-90}
              max={90}
              style={{ width: '100%' }}
              precision={1}
              value={Util.toDegrees(tiltAngle)}
              step={1}
              formatter={(a) => Number(a).toFixed(1) + '°'}
              onChange={(value) => setTiltAngle(Util.toRadians(value))}
            />
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('polygonMenu.SolarPanelArrayRowWidth', lang) +
              ' ([' +
              panelWidth.toFixed(2) +
              ', ' +
              (100 * panelWidth).toFixed(1) +
              '] ' +
              i18n.t('word.MeterAbbreviation', lang) +
              '): '}
          </Col>
          <Col className="gutter-row" span={10}>
            <InputNumber
              min={panelWidth}
              max={100 * panelWidth}
              step={panelWidth}
              style={{ width: '100%' }}
              precision={2}
              value={rowWidth}
              formatter={(a) => Number(a).toFixed(2)}
              onChange={(value) => setRowWidth(panelize(value))}
            />
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('polygonMenu.SolarPanelArrayInterRowSpacing', lang) +
              ' ([1, 20] ' +
              i18n.t('word.MeterAbbreviation', lang) +
              '): '}
          </Col>
          <Col className="gutter-row" span={10}>
            <InputNumber
              min={1}
              max={20}
              style={{ width: '100%' }}
              precision={1}
              value={interRowSpacing}
              step={0.5}
              formatter={(a) => Number(a).toFixed(1)}
              onChange={(value) => setInterRowSpacing(value)}
            />
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('polygonMenu.SolarPanelArrayPoleHeight', lang) +
              ' ([0, 10] ' +
              i18n.t('word.MeterAbbreviation', lang) +
              '): '}
          </Col>
          <Col className="gutter-row" span={10}>
            <InputNumber
              min={0}
              max={10}
              style={{ width: '100%' }}
              precision={1}
              value={poleHeight}
              step={0.1}
              formatter={(a) => Number(a).toFixed(1)}
              onChange={(value) => setPoleHeight(value)}
            />
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('polygonMenu.SolarPanelArrayPoleSpacing', lang) +
              ' ([1, 10] ' +
              i18n.t('word.MeterAbbreviation', lang) +
              '): '}
          </Col>
          <Col className="gutter-row" span={10}>
            <InputNumber
              min={1}
              max={10}
              style={{ width: '100%' }}
              precision={1}
              value={poleSpacing}
              step={0.5}
              formatter={(a) => Number(a).toFixed(1)}
              onChange={(value) => setPoleSpacing(value)}
            />
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default SolarPanelLayoutManager;
