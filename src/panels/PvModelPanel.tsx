/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from "react";
import {useStore} from "../stores/common";
import {SolarPanelModel} from "../models/SolarPanelModel";
import {Row, Select, Col, Input} from "antd";
import {SolarPanelNominalSize} from "../models/SolarPanelNominalSize";

export interface PvModelPanelProps {
    requestUpdate: () => void;
}

const PvModelPanel = ({
                          requestUpdate
                      }: PvModelPanelProps) => {

    const updateElementById = useStore(state => state.updateElementById);
    const getSelectedElement = useStore(state => state.getSelectedElement);
    const pvModules = useStore(state => state.pvModules);

    const solarPanel = getSelectedElement() as SolarPanelModel;

    const {Option} = Select;

    const panelSizeString =
        solarPanel.pvModel.nominalWidth.toFixed(2) + "m × " +
        solarPanel.pvModel.nominalLength.toFixed(2) + "m (" +
        solarPanel.pvModel.n + " × " +
        solarPanel.pvModel.m + " cells)";

    return (
        <>
            <Row gutter={16} style={{paddingBottom: '10px'}}>
                <Col className="gutter-row" span={14}>
                    Model:
                </Col>
                <Col className="gutter-row" span={10}>
                    <Select defaultValue='Custom'
                            style={{width: '100%'}}
                            value={solarPanel.pvModel.name}
                            onChange={(value) => {
                                if (solarPanel) {
                                    updateElementById(solarPanel.id, {pvModel: pvModules[value]});
                                    requestUpdate();
                                }
                            }}
                    >
                        {Object.keys(pvModules).map(key => <Option key={key} value={key}>{key}</Option>)}
                    </Select>
                </Col>
            </Row>
            <Row gutter={16} style={{paddingBottom: '10px'}}>
                <Col className="gutter-row" span={14}>
                    Panel Size:
                </Col>
                <Col className="gutter-row" span={10}>
                    <Select disabled={true}
                            style={{width: '100%'}}
                            value={panelSizeString}
                            onChange={(value) => {
                                if (solarPanel) {
                                    // TODO
                                }
                            }}
                    >
                        {SolarPanelNominalSize.instance.nominalStrings
                            .map(key => <Option key={key} value={key}>{key}</Option>)}
                    </Select>
                </Col>
            </Row>
            <Row gutter={16} style={{paddingBottom: '10px'}}>
                <Col className="gutter-row" span={14}>
                    Cell Type:
                </Col>
                <Col className="gutter-row" span={10}>
                    <Select disabled={true}
                            style={{width: '100%'}}
                            value={solarPanel.pvModel.cellType}
                            onChange={(value) => {
                                if (solarPanel) {
                                    // TODO
                                }
                            }}
                    >
                        <Option key={'Monocrystalline'} value={'Monocrystalline'}>Monocrystalline</Option>)
                        <Option key={'Polycrystalline'} value={'Polycrystalline'}>Polycrystalline</Option>)
                        <Option key={'Thin Film'} value={'Thin Film'}>Thin Film</Option>)
                    </Select>
                </Col>
            </Row>
            <Row gutter={16} style={{paddingBottom: '10px'}}>
                <Col className="gutter-row" span={14}>
                    Color:
                </Col>
                <Col className="gutter-row" span={10}>
                    <Select disabled={true}
                            style={{width: '100%'}}
                            value={solarPanel.pvModel.color}
                            onChange={(value) => {
                                if (solarPanel) {
                                    // TODO
                                }
                            }}
                    >
                        <Option key={'Black'} value={'Black'}>Black</Option>)
                        <Option key={'Blue'} value={'Blue'}>Blue</Option>)
                    </Select>
                </Col>
            </Row>
            <Row gutter={16} style={{paddingBottom: '10px'}}>
                <Col className="gutter-row" span={14}>
                    Orientation:
                </Col>
                <Col className="gutter-row" span={10}>
                    <Select disabled={true}
                            style={{width: '100%'}}
                            value={solarPanel.orientation}
                            onChange={(value) => {
                                if (solarPanel) {
                                    // TODO
                                }
                            }}
                    >
                        <Option key={'Portrait'} value={'Portrait'}>Portrait</Option>)
                        <Option key={'Landscape'} value={'Landscape'}>Landscape</Option>)
                    </Select>
                </Col>
            </Row>
            <Row gutter={16} style={{paddingBottom: '10px'}}>
                <Col className="gutter-row" span={14}>
                    Solar Cell Efficiency (%):
                </Col>
                <Col className="gutter-row" span={10}>
                    <Input disabled={true}
                           style={{width: '100%'}}
                           value={solarPanel.pvModel.efficiency}
                           onChange={(value) => {
                               if (solarPanel) {
                                   // TODO
                               }
                           }}
                    />
                </Col>
            </Row>
            <Row gutter={16} style={{paddingBottom: '10px'}}>
                <Col className="gutter-row" span={14}>
                    Nominal Operating Cell Temperature (°C)::
                </Col>
                <Col className="gutter-row" span={10}>
                    <Input disabled={true}
                           style={{width: '100%'}}
                           value={solarPanel.pvModel.noct}
                           onChange={(value) => {
                               if (solarPanel) {
                                   // TODO
                               }
                           }}
                    />
                </Col>
            </Row>
            <Row gutter={16} style={{paddingBottom: '10px'}}>
                <Col className="gutter-row" span={14}>
                    Temperature Coefficient of Pmax (%/(°C)::
                </Col>
                <Col className="gutter-row" span={10}>
                    <Input disabled={true}
                           style={{width: '100%'}}
                           value={solarPanel.pvModel.pmaxTC}
                           onChange={(value) => {
                               if (solarPanel) {
                                   // TODO
                               }
                           }}
                    />
                </Col>
            </Row>
            <Row gutter={16} style={{paddingBottom: '10px'}}>
                <Col className="gutter-row" span={14}>
                    Shade Tolerance:
                </Col>
                <Col className="gutter-row" span={10}>
                    <Select disabled={true}
                            style={{width: '100%'}}
                            value={solarPanel.pvModel.shadeTolerance}
                            onChange={(value) => {
                                if (solarPanel) {
                                    // TODO
                                }
                            }}
                    >
                        <Option key={'High'} value={'High'}>High</Option>)
                        <Option key={'None'} value={'None'}>None</Option>)
                        <Option key={'Partial'} value={'Partial'}>Partial</Option>)
                    </Select>
                </Col>
            </Row>
        </>
    )
};

export default React.memo(PvModelPanel);
