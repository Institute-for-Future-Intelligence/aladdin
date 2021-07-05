/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useState} from 'react';
import LineGraph from '../components/lineGraph';
import styled from "styled-components";
import {useStore} from "../stores/common";
import {GraphDataType} from "../types";
import {MONTHS} from "../constants";
import {Util} from "../Util";
import BarGraph from "../components/barGraph";
import ReactDraggable, {DraggableEventHandler} from "react-draggable";
import {Space, Switch} from "antd";

const Container = styled.div`
  position: fixed;
  top: 80px;
  right: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 9;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  right: 0;
  top: 0;
  width: 500px;
  height: 650px;
  padding-bottom: 10px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const Header = styled.div`
  border-radius: 10px 10px 0 0;
  width: 100%;
  height: 24px;
  padding: 10px;
  background-color: #e8e8e8;
  color: #888;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;

  svg.icon {
    height: 16px;
    width: 16px;
    padding: 8px;
    fill: #666;
  }
`;

export interface YearlyLightSensorPanelProps {

    city: string | null;
    requestUpdate: () => void;

    [key: string]: any;

}

const YearlyLightSensorPanel = ({
                                    city,
                                    requestUpdate,
                                    ...rest
                                }: YearlyLightSensorPanelProps) => {

    const setCommonStore = useStore(state => state.set);
    const viewState = useStore(state => state.viewState);
    const sensorData = useStore(state => state.yearlyLightSensorData);
    const sensorLabels = useStore(state => state.sensorLabels);
    const now = useStore(state => state.world.date);
    const [daylightGraph, setDaylightGraph] = useState(true);
    const [clearnessGraph, setClearnessGraph] = useState(true);
    const [radiationGraph, setRadiationGraph] = useState(true);
    const [curPosition, setCurPosition] = useState({
        x: isNaN(viewState.yearlyLightSensorPanelX) ? 0 : viewState.yearlyLightSensorPanelX,
        y: isNaN(viewState.yearlyLightSensorPanelY) ? 0 : viewState.yearlyLightSensorPanelY
    });

    const responsiveHeight = 100;
    const referenceX = MONTHS[Math.floor(Util.daysIntoYear(now) / 365 * 12)];

    const onDrag: DraggableEventHandler = (e, ui) => {
        setCurPosition({x: ui.x, y: ui.y});
    };

    const onDragEnd: DraggableEventHandler = (e, ui) => {
        setCommonStore(state => {
            state.viewState.yearlyLightSensorPanelX = ui.x;
            state.viewState.yearlyLightSensorPanelY = ui.y;
        });
    };

    const closePanel = () => {
        setCommonStore((state) => {
            state.viewState.showYearlyLightSensorPanel = false;
        });
        requestUpdate();
    };

    return (
        <ReactDraggable
            handle={'.handle'}
            bounds={'parent'}
            axis='both'
            position={curPosition}
            onDrag={onDrag}
            onStop={onDragEnd}
        >
            <Container>
                <ColumnWrapper>
                    <Header className='handle'>
                        <span>Light Sensor: {city}</span>
                        <span style={{cursor: 'pointer'}}
                              onTouchStart={() => {
                                  closePanel();
                              }}
                              onMouseDown={() => {
                                  closePanel();
                              }}>
                            Close
                        </span>
                    </Header>
                    <Space style={{alignSelf: 'center', padding: '10px'}}>
                        <Space>
                            <Switch title={'Show daylight results'}
                                    checked={daylightGraph}
                                    onChange={(checked) => {
                                        setDaylightGraph(checked);
                                        requestUpdate();
                                    }}
                            />Daylight
                        </Space>
                        <Space>
                            <Switch title={'Show sky clearness results'}
                                    checked={clearnessGraph}
                                    onChange={(checked) => {
                                        setClearnessGraph(checked);
                                        requestUpdate();
                                    }}
                            />Clearness
                        </Space>
                        <Space>
                            <Switch title={'Show average daily solar radiation'}
                                    checked={radiationGraph}
                                    onChange={(checked) => {
                                        setRadiationGraph(checked);
                                        requestUpdate();
                                    }}
                            />Radiation
                        </Space>
                    </Space>
                    {daylightGraph &&
                    <LineGraph
                        type={GraphDataType.DaylightData}
                        dataSource={sensorData.map(e => ({Month: e.Month, Daylight: e.Daylight}))}
                        height={responsiveHeight}
                        labelX={'Month'}
                        labelY={'Daylight'}
                        unitY={'Hours'}
                        yMin={0}
                        curveType={'natural'}
                        fractionDigits={1}
                        referenceX={referenceX}
                        {...rest}
                    />
                    }
                    {clearnessGraph &&
                    <BarGraph
                        type={GraphDataType.ClearnessData}
                        dataSource={sensorData.map(e => ({Month: e.Month, Clearness: e.Clearness}))}
                        height={responsiveHeight}
                        labelX={'Month'}
                        labelY={'Clearness'}
                        unitY={'%'}
                        yMin={0}
                        yMax={100}
                        fractionDigits={1}
                        referenceX={referenceX}
                        color={'#66CDAA'}
                        {...rest}
                    />
                    }
                    {radiationGraph &&
                    <LineGraph
                        type={GraphDataType.YearlyRadiationSensorData}
                        dataSource={sensorData.map(({Daylight, Clearness, ...item}) => item)}
                        labels={sensorLabels}
                        height={responsiveHeight}
                        labelX={'Month'}
                        labelY={'Radiation'}
                        unitY={'kWh/m²/day'}
                        yMin={0}
                        curveType={'natural'}
                        fractionDigits={2}
                        referenceX={referenceX}
                        {...rest}
                    />
                    }
                </ColumnWrapper>
            </Container>
        </ReactDraggable>
    );

};

export default YearlyLightSensorPanel;
