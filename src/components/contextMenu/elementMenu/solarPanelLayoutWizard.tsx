/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Row, Select } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { ObjectType, Orientation, RowAxis } from '../../../types';
import { Util } from '../../../Util';
import { PolygonModel } from '../../../models/PolygonModel';
import { FoundationModel } from '../../../models/FoundationModel';
import { ElementModelFactory } from '../../../models/ElementModelFactory';
import { UNIT_VECTOR_POS_Z } from '../../../constants';
import { Point2 } from '../../../models/Point2';

const { Option } = Select;

const SolarPanelLayoutWizard = ({
  dialogVisible,
  setDialogVisible,
}: {
  dialogVisible: boolean;
  setDialogVisible: (b: boolean) => void;
}) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const getElementById = useStore(Selector.getElementById);
  const pvModules = useStore(Selector.pvModules);
  const getPvModule = useStore(Selector.getPvModule);
  const countElementsByReferenceId = useStore(Selector.countElementsByReferenceId);
  const removeElementsByReferenceId = useStore(Selector.removeElementsByReferenceId);
  const addUndoable = useStore(Selector.addUndoable);

  const [warningDialogVisible, setWarningDialogVisible] = useState(false);
  const [pvModelName, setPvModelName] = useState<string>('SPR-X21-335-BLK');
  const [rowAxis, setRowAxis] = useState<RowAxis>(RowAxis.zonal);
  const [orientation, setOrientation] = useState<Orientation>(Orientation.portrait);
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
  const pvModel = getPvModule(pvModelName);
  const reference = getSelectedElement();

  useEffect(() => {
    const pvModel = getPvModule(pvModelName) ?? getPvModule('SPR-X21-335-BLK');
    setPanelWidth(orientation === Orientation.portrait ? pvModel.width : pvModel.length);
  }, [pvModelName]);

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

  const layout = () => {
    if (reference?.type === ObjectType.Polygon) {
      const area = reference as PolygonModel;
      const bounds = Util.calculatePolygonBounds(area.vertices);
      const base = getElementById(area.parentId);
      if (base?.type === ObjectType.Foundation) {
        const foundation = base as FoundationModel;
        let n: number;
        let start: number;
        let delta: number;
        if (rowAxis === RowAxis.meridional) {
          // north-south axis, so the array is laid in x direction
          n = Math.floor(((bounds.maxX - bounds.minX) * foundation.lx - rowWidth) / interRowSpacing);
          start = bounds.minX + rowWidth / 2;
        } else {
          // east-west axis, so the array is laid in y direction
          n = Math.floor(((bounds.maxY - bounds.minY) * foundation.ly - rowWidth) / interRowSpacing);
          start = bounds.minY + rowWidth / (2 * foundation.ly);
          delta = interRowSpacing / foundation.ly;
          let a: Point2 = {} as Point2;
          let b: Point2 = {} as Point2;
          for (let i = 0; i <= n; i++) {
            a.x = -0.5;
            b.x = 0.5;
            a.y = b.y = start + i * delta;
            const p = Util.polygonIntersections(a, b, area.vertices);
            if (p.length > 1) {
              const x1 = p[0].x;
              const x2 = p[1].x;
              const cx = (x1 + x2) / 2;
              const lx = Math.abs(x1 - x2) * foundation.lx;
              const solarPanel = ElementModelFactory.makeSolarPanel(
                foundation,
                pvModel,
                cx,
                a.y,
                foundation.lz,
                orientation,
                UNIT_VECTOR_POS_Z,
                'rotation' in foundation ? foundation.rotation : undefined,
                lx,
                rowWidth,
              );
              solarPanel.tiltAngle = tiltAngle;
              solarPanel.referenceId = area.id;
              setCommonStore((state) => {
                state.elements.push(solarPanel);
              });
            }
          }
        }
      }
    }
  };

  return (
    <>
      {warningDialogVisible && (
        <Modal
          width={400}
          visible={warningDialogVisible}
          title={
            <div
              style={{ width: '100%', cursor: 'move' }}
              onMouseOver={() => setDragEnabled(true)}
              onMouseOut={() => setDragEnabled(false)}
            >
              {i18n.t('word.Warning', lang)}
            </div>
          }
          onOk={() => {
            if (reference) {
              removeElementsByReferenceId(reference.id);
              layout();
            }
            setWarningDialogVisible(false);
          }}
          onCancel={() => {
            setWarningDialogVisible(false);
          }}
          modalRender={(modal) => (
            <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
              <div ref={dragRef}>{modal}</div>
            </Draggable>
          )}
        >
          {i18n.t('message.ExistingSolarPanelsWillBeRemovedBeforeApplyingNewLayout', lang)}
          {i18n.t('message.DoYouWantToContinue', lang)}
        </Modal>
      )}
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
              if (reference) {
                if (countElementsByReferenceId(reference.id) > 0) {
                  setWarningDialogVisible(true);
                } else {
                  layout();
                }
              }
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
              if (reference) {
                if (countElementsByReferenceId(reference.id) > 0) {
                  setWarningDialogVisible(true);
                } else {
                  layout();
                }
              }
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
              value={pvModelName}
              onChange={(value) => {
                setPvModelName(value);
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
              value={rowAxis}
              onChange={(value) => {
                setRowAxis(value);
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
              value={orientation}
              onChange={(value) => {
                setOrientation(value);
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

export default React.memo(SolarPanelLayoutWizard);
