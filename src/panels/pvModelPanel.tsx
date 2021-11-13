/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { Row, Select, Col, Input } from 'antd';
import { SolarPanelNominalSize } from '../models/SolarPanelNominalSize';
import { Orientation, ShadeTolerance } from '../types';
import i18n from '../i18n/i18n';

const { Option } = Select;

const PvModelPanel = () => {
  const language = useStore(Selector.language);
  const updateElementById = useStore(Selector.updateElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const setElementSize = useStore(Selector.setElementSize);
  const pvModules = useStore(Selector.pvModules);
  const getPvModule = useStore(Selector.getPvModule);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const lang = { lng: language };
  const solarPanel = getSelectedElement() as SolarPanelModel;
  const pvModel = getPvModule(solarPanel.pvModelName) ?? getPvModule('SPR-X21-335-BLK');

  const panelSizeString =
    pvModel.nominalWidth.toFixed(2) +
    'm × ' +
    pvModel.nominalLength.toFixed(2) +
    'm (' +
    pvModel.n +
    ' × ' +
    pvModel.m +
    ' cells)';

  return (
    <>
      <Row gutter={16} style={{ paddingBottom: '10px' }}>
        <Col className="gutter-row" span={14}>
          {i18n.t('pvModelPanel.Model', lang) + ':'}
        </Col>
        <Col className="gutter-row" span={10}>
          <Select
            defaultValue="Custom"
            style={{ width: '100%' }}
            value={pvModel.name}
            onChange={(value) => {
              if (solarPanel) {
                if (solarPanel.orientation === Orientation.portrait) {
                  // calculate the current x-y layout
                  const nx = Math.max(1, Math.round(solarPanel.lx / pvModel.width));
                  const ny = Math.max(1, Math.round(solarPanel.ly / pvModel.length));
                  setElementSize(solarPanel.id, nx * pvModules[value].width, ny * pvModules[value].length);
                } else {
                  // calculate the current x-y layout
                  const nx = Math.max(1, Math.round(solarPanel.lx / pvModel.length));
                  const ny = Math.max(1, Math.round(solarPanel.ly / pvModel.width));
                  setElementSize(solarPanel.id, nx * pvModules[value].length, ny * pvModules[value].width);
                }
                updateElementById(solarPanel.id, { pvModelName: pvModules[value].name });
                setUpdateFlag(!updateFlag);
              }
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
      <Row gutter={16} style={{ paddingBottom: '10px' }}>
        <Col className="gutter-row" span={14}>
          {i18n.t('pvModelPanel.PanelSize', lang) + ':'}
        </Col>
        <Col className="gutter-row" span={10}>
          <Select
            disabled={true}
            style={{ width: '100%' }}
            value={panelSizeString}
            onChange={(value) => {
              if (solarPanel) {
                // TODO
              }
            }}
          >
            {SolarPanelNominalSize.instance.nominalStrings.map((key) => (
              <Option key={key} value={key}>
                {key}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>
      <Row gutter={16} style={{ paddingBottom: '10px' }}>
        <Col className="gutter-row" span={14}>
          {i18n.t('pvModelPanel.CellType', lang) + ':'}
        </Col>
        <Col className="gutter-row" span={10}>
          <Select
            disabled={true}
            style={{ width: '100%' }}
            value={pvModel.cellType}
            onChange={(value) => {
              if (solarPanel) {
                // TODO
              }
            }}
          >
            <Option key={'Monocrystalline'} value={'Monocrystalline'}>
              {i18n.t('pvModelPanel.Monocrystalline', lang)}
            </Option>
            )
            <Option key={'Polycrystalline'} value={'Polycrystalline'}>
              {i18n.t('pvModelPanel.Polycrystalline', lang)}
            </Option>
            )
            <Option key={'Thin Film'} value={'Thin Film'}>
              {i18n.t('pvModelPanel.ThinFilm', lang)}
            </Option>
            )
          </Select>
        </Col>
      </Row>
      <Row gutter={16} style={{ paddingBottom: '10px' }}>
        <Col className="gutter-row" span={14}>
          {i18n.t('word.Color', lang) + ':'}
        </Col>
        <Col className="gutter-row" span={10}>
          <Select
            disabled={true}
            style={{ width: '100%' }}
            value={pvModel.color}
            onChange={(value) => {
              if (solarPanel) {
                // TODO
              }
            }}
          >
            <Option key={'Black'} value={'Black'}>
              {i18n.t('pvModelPanel.Black', lang)}
            </Option>
            )
            <Option key={'Blue'} value={'Blue'}>
              {i18n.t('pvModelPanel.Blue', lang)}
            </Option>
            )
          </Select>
        </Col>
      </Row>
      <Row gutter={16} style={{ paddingBottom: '10px' }}>
        <Col className="gutter-row" span={14}>
          {i18n.t('pvModelPanel.SolarCellEfficiency', lang) + ' (%):'}
        </Col>
        <Col className="gutter-row" span={10}>
          <Input
            disabled={true}
            style={{ width: '100%' }}
            value={100 * pvModel.efficiency}
            onChange={(value) => {
              if (solarPanel) {
                // TODO
              }
            }}
          />
        </Col>
      </Row>
      <Row gutter={16} style={{ paddingBottom: '10px' }}>
        <Col className="gutter-row" span={14}>
          {i18n.t('pvModelPanel.NominalOperatingCellTemperature', lang) + ' (°C):'}
        </Col>
        <Col className="gutter-row" span={10}>
          <Input
            disabled={true}
            style={{ width: '100%' }}
            value={pvModel.noct}
            onChange={(value) => {
              if (solarPanel) {
                // TODO
              }
            }}
          />
        </Col>
      </Row>
      <Row gutter={16} style={{ paddingBottom: '10px' }}>
        <Col className="gutter-row" span={14}>
          {i18n.t('pvModelPanel.TemperatureCoefficientOfPmax', lang) + ' (%/°C):'}
        </Col>
        <Col className="gutter-row" span={10}>
          <Input
            disabled={true}
            style={{ width: '100%' }}
            value={pvModel.pmaxTC}
            onChange={(value) => {
              if (solarPanel) {
                // TODO
              }
            }}
          />
        </Col>
      </Row>
      <Row gutter={16} style={{ paddingBottom: '10px' }}>
        <Col className="gutter-row" span={14}>
          {i18n.t('pvModelPanel.ShadeTolerance', lang) + ':'}
        </Col>
        <Col className="gutter-row" span={10}>
          <Select
            disabled={true}
            style={{ width: '100%' }}
            value={pvModel.shadeTolerance}
            onChange={(value) => {
              if (solarPanel) {
                // TODO
              }
            }}
          >
            <Option key={ShadeTolerance.HIGH} value={ShadeTolerance.HIGH}>
              {ShadeTolerance.HIGH}
            </Option>
            )
            <Option key={ShadeTolerance.NONE} value={ShadeTolerance.NONE}>
              {ShadeTolerance.NONE}
            </Option>
            )
            <Option key={ShadeTolerance.PARTIAL} value={ShadeTolerance.PARTIAL}>
              {ShadeTolerance.PARTIAL}
            </Option>
            )
          </Select>
        </Col>
      </Row>
    </>
  );
};

export default PvModelPanel;
