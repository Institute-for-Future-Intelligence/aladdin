/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { useStore } from '../stores/common';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { Row, Select, Col, Input } from 'antd';
import { SolarPanelNominalSize } from '../models/SolarPanelNominalSize';
import { Orientation, ShadeTolerance } from '../types';

const { Option } = Select;

export interface PvModelPanelProps {}

const PvModelPanel = ({}: PvModelPanelProps) => {
  const updateElementById = useStore((state) => state.updateElementById);
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const setElementSize = useStore((state) => state.setElementSize);
  const pvModules = useStore((state) => state.pvModules);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);

  const solarPanel = getSelectedElement() as SolarPanelModel;

  const panelSizeString =
    solarPanel.pvModel.nominalWidth.toFixed(2) +
    'm × ' +
    solarPanel.pvModel.nominalLength.toFixed(2) +
    'm (' +
    solarPanel.pvModel.n +
    ' × ' +
    solarPanel.pvModel.m +
    ' cells)';

  return (
    <>
      <Row gutter={16} style={{ paddingBottom: '10px' }}>
        <Col className="gutter-row" span={14}>
          Model:
        </Col>
        <Col className="gutter-row" span={10}>
          <Select
            defaultValue="Custom"
            style={{ width: '100%' }}
            value={solarPanel.pvModel.name}
            onChange={(value) => {
              if (solarPanel) {
                if (solarPanel.orientation === Orientation.portrait) {
                  // calculate the current x-y layout
                  const nx = Math.max(1, Math.round(solarPanel.lx / solarPanel.pvModel.width));
                  const ny = Math.max(1, Math.round(solarPanel.ly / solarPanel.pvModel.length));
                  setElementSize(solarPanel.id, nx * pvModules[value].width, ny * pvModules[value].length);
                } else {
                  // calculate the current x-y layout
                  const nx = Math.max(1, Math.round(solarPanel.lx / solarPanel.pvModel.length));
                  const ny = Math.max(1, Math.round(solarPanel.ly / solarPanel.pvModel.width));
                  setElementSize(solarPanel.id, nx * pvModules[value].length, ny * pvModules[value].width);
                }
                updateElementById(solarPanel.id, { pvModel: pvModules[value] });
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
          Panel Size:
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
          Cell Type:
        </Col>
        <Col className="gutter-row" span={10}>
          <Select
            disabled={true}
            style={{ width: '100%' }}
            value={solarPanel.pvModel.cellType}
            onChange={(value) => {
              if (solarPanel) {
                // TODO
              }
            }}
          >
            <Option key={'Monocrystalline'} value={'Monocrystalline'}>
              Monocrystalline
            </Option>
            )
            <Option key={'Polycrystalline'} value={'Polycrystalline'}>
              Polycrystalline
            </Option>
            )
            <Option key={'Thin Film'} value={'Thin Film'}>
              Thin Film
            </Option>
            )
          </Select>
        </Col>
      </Row>
      <Row gutter={16} style={{ paddingBottom: '10px' }}>
        <Col className="gutter-row" span={14}>
          Color:
        </Col>
        <Col className="gutter-row" span={10}>
          <Select
            disabled={true}
            style={{ width: '100%' }}
            value={solarPanel.pvModel.color}
            onChange={(value) => {
              if (solarPanel) {
                // TODO
              }
            }}
          >
            <Option key={'Black'} value={'Black'}>
              Black
            </Option>
            )
            <Option key={'Blue'} value={'Blue'}>
              Blue
            </Option>
            )
          </Select>
        </Col>
      </Row>
      <Row gutter={16} style={{ paddingBottom: '10px' }}>
        <Col className="gutter-row" span={14}>
          Solar Cell Efficiency (%):
        </Col>
        <Col className="gutter-row" span={10}>
          <Input
            disabled={true}
            style={{ width: '100%' }}
            value={100 * solarPanel.pvModel.efficiency}
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
          Nominal Operating Cell Temperature (°C)::
        </Col>
        <Col className="gutter-row" span={10}>
          <Input
            disabled={true}
            style={{ width: '100%' }}
            value={solarPanel.pvModel.noct}
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
          Temperature Coefficient of Pmax (%/(°C)::
        </Col>
        <Col className="gutter-row" span={10}>
          <Input
            disabled={true}
            style={{ width: '100%' }}
            value={solarPanel.pvModel.pmaxTC}
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
          Shade Tolerance:
        </Col>
        <Col className="gutter-row" span={10}>
          <Select
            disabled={true}
            style={{ width: '100%' }}
            value={solarPanel.pvModel.shadeTolerance}
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
