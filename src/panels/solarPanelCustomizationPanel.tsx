/*
 * @Copyright 2024. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  DeleteOutlined,
  ExportOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  WarningOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Button, Col, Divider, Input, InputNumber, List, Modal, Row, Select, Space, Tabs, TabsProps } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import i18n from '../i18n/i18n';
import { useLanguage } from '../hooks';
import { PvModel } from '../models/PvModel';
import { ShadeTolerance } from '../types';

const { Option } = Select;

const SolarPanelCustomizationPanel = React.memo(({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const customPvModules = useStore(Selector.customPvModules);
  const addCustomPvModule = useStore(Selector.addCustomPvModule);
  const removeCustomPvModule = useStore(Selector.removeCustomPvModule);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const modelRef = useRef<string>('Unknown');
  const brandRef = useRef<string>('Unknown');
  const cellTypeRef = useRef<string>('Monocrystalline');
  const cellNxRef = useRef<number>(8);
  const cellNyRef = useRef<number>(12);
  const colorRef = useRef<string>('Black');
  const widthRef = useRef<number>(1);
  const lengthRef = useRef<number>(1.5);
  const bifacialityFactorRef = useRef<number>(0);
  const efficiencyRef = useRef<number>(0.2);
  const noctRef = useRef<number>(45);
  const pmaxRef = useRef<number>(300);
  const pmaxTCRef = useRef<number>(-0.002);
  const thicknessRef = useRef<number>(0.005);
  const weightRef = useRef<number>(30);
  const vmppRef = useRef<number>(30);
  const imppRef = useRef<number>(10);
  const vocRef = useRef<number>(40);
  const iscRef = useRef<number>(15);

  const lang = useLanguage();

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

  const addCustomSolarPanel = () => {
    const pv = {
      name: modelRef.current,
      brand: brandRef.current,
      cellType: cellTypeRef.current,
      efficiency: efficiencyRef.current,
      length: lengthRef.current,
      nominalLength: lengthRef.current,
      width: widthRef.current,
      nominalWidth: widthRef.current,
      thickness: thicknessRef.current,
      m: cellNxRef.current,
      n: cellNyRef.current,
      pmax: pmaxRef.current,
      vmpp: vmppRef.current,
      impp: imppRef.current,
      voc: vocRef.current,
      isc: iscRef.current,
      pmaxTC: pmaxTCRef.current,
      noct: noctRef.current,
      weight: weightRef.current,
      color: colorRef.current,
      shadeTolerance: ShadeTolerance.PARTIAL,
      bifacialityFactor: bifacialityFactorRef.current,
    } as PvModel;
    addCustomPvModule(pv);
  };

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: i18n.t('pvModelPanel.General', lang),
      children: (
        <>
          <Row gutter={6} style={{ paddingBottom: '4px' }}>
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
              {i18n.t('word.BrandName', lang) + ': '}
            </Col>
            <Col className="gutter-row" span={8}>
              <Input
                value={brandRef.current}
                onChange={(e) => {
                  brandRef.current = e.target.value;
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
              {i18n.t('word.Width', lang) + ' ([0.1, 3]' + i18n.t('word.MeterAbbreviation', lang) + '): '}
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
              {i18n.t('word.Length', lang) + ' ([0.1, 3]' + i18n.t('word.MeterAbbreviation', lang) + '): '}
            </Col>
            <Col className="gutter-row" span={8}>
              <InputNumber
                min={0.1}
                max={3}
                style={{ width: '100%' }}
                precision={2}
                value={lengthRef.current}
                step={0.01}
                onChange={(value) => {
                  if (value === null) return;
                  lengthRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
                onBlur={(e) => {
                  const v = parseFloat((e.target as HTMLInputElement).value);
                  lengthRef.current = Number.isNaN(v) ? 1 : v;
                  setUpdateFlag(!updateFlag);
                }}
                onPressEnter={(e) => {
                  const v = parseFloat((e.target as HTMLInputElement).value);
                  lengthRef.current = Number.isNaN(v) ? 1 : v;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col className="gutter-row" span={16}>
              {i18n.t('pvModelPanel.BifacialityFactor', lang) + ' ([0, 1]):'}
            </Col>
            <Col className="gutter-row" span={8}>
              <InputNumber
                style={{ width: '100%' }}
                precision={2}
                value={bifacialityFactorRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  bifacialityFactorRef.current = value;
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col className="gutter-row" span={16}>
              {i18n.t('pvModelPanel.Weight', lang) + ' (' + i18n.t('pvModelPanel.Kilogram', lang) + '):'}
            </Col>
            <Col className="gutter-row" span={8}>
              <InputNumber
                style={{ width: '100%' }}
                precision={1}
                value={weightRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  weightRef.current = value;
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col className="gutter-row" span={16}>
              {i18n.t('word.Thickness', lang) + ' (' + i18n.t('word.MeterAbbreviation', lang) + '):'}
            </Col>
            <Col className="gutter-row" span={8}>
              <InputNumber
                style={{ width: '100%' }}
                precision={1}
                value={thicknessRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  thicknessRef.current = value;
                }}
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
        </>
      ),
    },
    {
      key: '2',
      label: i18n.t('pvModelPanel.Electrical', lang),
      children: (
        <>
          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col className="gutter-row" span={16}>
              {i18n.t('pvModelPanel.SolarCellEfficiency', lang) + ' (%):'}
            </Col>
            <Col className="gutter-row" span={8}>
              <InputNumber
                style={{ width: '100%' }}
                precision={2}
                value={100 * efficiencyRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  efficiencyRef.current = value * 0.01;
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col className="gutter-row" span={16}>
              {i18n.t('pvModelPanel.CellCountInXDirection', lang) + ': '}
            </Col>
            <Col className="gutter-row" span={8}>
              <InputNumber
                min={1}
                max={36}
                style={{ width: '100%' }}
                precision={0}
                value={cellNxRef.current}
                step={1}
                onChange={(value) => {
                  if (value === null) return;
                  cellNxRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
                onBlur={(e) => {
                  const v = parseFloat((e.target as HTMLInputElement).value);
                  cellNxRef.current = Number.isNaN(v) ? 1 : v;
                  setUpdateFlag(!updateFlag);
                }}
                onPressEnter={(e) => {
                  const v = parseFloat((e.target as HTMLInputElement).value);
                  cellNxRef.current = Number.isNaN(v) ? 1 : v;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col className="gutter-row" span={16}>
              {i18n.t('pvModelPanel.CellCountInYDirection', lang) + ': '}
            </Col>
            <Col className="gutter-row" span={8}>
              <InputNumber
                min={1}
                max={36}
                style={{ width: '100%' }}
                precision={0}
                value={cellNyRef.current}
                step={1}
                onChange={(value) => {
                  if (value === null) return;
                  cellNyRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
                onBlur={(e) => {
                  const v = parseFloat((e.target as HTMLInputElement).value);
                  cellNyRef.current = Number.isNaN(v) ? 1 : v;
                  setUpdateFlag(!updateFlag);
                }}
                onPressEnter={(e) => {
                  const v = parseFloat((e.target as HTMLInputElement).value);
                  cellNyRef.current = Number.isNaN(v) ? 1 : v;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col className="gutter-row" span={16}>
              {i18n.t('pvModelPanel.MaximumRatedPower', lang) +
                ' Pmax (' +
                i18n.t('word.WattAbbreviation', lang) +
                '):'}
            </Col>
            <Col className="gutter-row" span={8}>
              <InputNumber
                style={{ width: '100%' }}
                value={pmaxRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  pmaxRef.current = value;
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col className="gutter-row" span={16}>
              {i18n.t('pvModelPanel.TemperatureCoefficientOfPmax', lang) + ' (%/°C):'}
            </Col>
            <Col className="gutter-row" span={8}>
              <InputNumber
                style={{ width: '100%' }}
                value={pmaxTCRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  pmaxTCRef.current = value;
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col className="gutter-row" span={16}>
              {i18n.t('pvModelPanel.NominalOperatingCellTemperature', lang) + ' (°C):'}
            </Col>
            <Col className="gutter-row" span={8}>
              <InputNumber
                style={{ width: '100%' }}
                precision={1}
                value={noctRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  noctRef.current = value;
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col className="gutter-row" span={16}>
              {i18n.t('pvModelPanel.RatedVoltage', lang) + ' Vmpp (' + i18n.t('word.VoltAbbreviation', lang) + '):'}
            </Col>
            <Col className="gutter-row" span={8}>
              <InputNumber
                style={{ width: '100%' }}
                precision={1}
                value={vmppRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  vmppRef.current = value;
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col className="gutter-row" span={16}>
              {i18n.t('pvModelPanel.RatedCurrent', lang) + ' Impp (' + i18n.t('word.AmpereAbbreviation', lang) + '):'}
            </Col>
            <Col className="gutter-row" span={8}>
              <InputNumber
                style={{ width: '100%' }}
                precision={1}
                value={imppRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  imppRef.current = value;
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col className="gutter-row" span={16}>
              {i18n.t('pvModelPanel.OpenCircuitVoltage', lang) +
                ' Voc (' +
                i18n.t('word.VoltAbbreviation', lang) +
                '):'}
            </Col>
            <Col className="gutter-row" span={8}>
              <InputNumber
                style={{ width: '100%' }}
                precision={1}
                value={vocRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  vocRef.current = value;
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col className="gutter-row" span={16}>
              {i18n.t('pvModelPanel.ShortCircuitCurrent', lang) +
                ' Isc (' +
                i18n.t('word.AmpereAbbreviation', lang) +
                '):'}
            </Col>
            <Col className="gutter-row" span={8}>
              <InputNumber
                style={{ width: '100%' }}
                precision={1}
                value={iscRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  iscRef.current = value;
                }}
              />
            </Col>
          </Row>
        </>
      ),
    },
  ];

  const names = useMemo(() => {
    const array: string[] = [];
    for (const key in customPvModules) {
      array.push(key);
    }
    return array;
  }, [customPvModules]);

  const confirmRemoveCustomSolarPanel = (name: string) => {
    Modal.confirm({
      title: i18n.t('pvModelPanel.DoYouReallyWantToRemoveCustomSolarPanel', lang) + ' "' + name + '"?',
      content: (
        <span style={{ color: 'red', fontWeight: 'bold' }}>
          <WarningOutlined style={{ marginRight: '6px' }} />
          {i18n.t('word.Warning', lang) + ': ' + i18n.t('pvModelPanel.MakeSureThisCustomSolarPanelIsNotUsed', lang)}
        </span>
      ),
      icon: <QuestionCircleOutlined />,
      onOk: () => {
        removeCustomPvModule(name);
      },
    });
  };

  return (
    <Modal
      width={720}
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
        <Button key="Close" type="primary" onClick={() => setDialogVisible(false)}>
          {i18n.t('word.Close', lang)}
        </Button>,
      ]}
      // this must be specified for the x button in the upper-right corner to work
      onCancel={() => setDialogVisible(false)}
      maskClosable={false}
      destroyOnClose={false}
      modalRender={(modal) => (
        <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
          <div ref={dragRef}>{modal}</div>
        </Draggable>
      )}
    >
      <Row>
        <Col>
          <Tabs defaultActiveKey="1" type="card" items={items} />
        </Col>
        <Col>
          <Space style={{ height: '100%', justifyContent: 'center', marginLeft: '8px' }} direction={'vertical'}>
            <ArrowRightOutlined
              title={i18n.t('word.Add', lang)}
              style={{ cursor: 'pointer', border: '2px solid lightgray', borderRadius: '5px', padding: '4px' }}
              onClick={() => addCustomSolarPanel()}
            />
            <Divider />
            <ArrowLeftOutlined
              title={i18n.t('pvModelPanel.CopySelectedCustomSolarPanel', lang)}
              style={{ cursor: 'pointer', border: '2px solid lightgray', borderRadius: '5px', padding: '4px' }}
              onClick={() => {}}
            />
          </Space>
        </Col>
        <Col>
          <List
            style={{ marginTop: '56px', marginLeft: '8px' }}
            size="small"
            header={<div style={{ fontWeight: 'bold' }}>{i18n.t('pvModelPanel.AddedCustomSolarPanels', lang)}</div>}
            bordered
            dataSource={names}
            renderItem={(item) => (
              <List.Item key={item}>
                <ExportOutlined
                  title={i18n.t('pvModelPanel.ExportCustomSolarPanel', lang)}
                  style={{ paddingRight: '4px', cursor: 'pointer' }}
                  onClick={() => {}}
                />
                <DeleteOutlined
                  title={i18n.t('word.Delete', lang)}
                  style={{ paddingRight: '6px', cursor: 'pointer' }}
                  onClick={() => confirmRemoveCustomSolarPanel(item)}
                />
                {item}
              </List.Item>
            )}
          />
        </Col>
      </Row>
    </Modal>
  );
});

export default SolarPanelCustomizationPanel;
