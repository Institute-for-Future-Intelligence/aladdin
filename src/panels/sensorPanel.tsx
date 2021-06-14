/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import LineGraph from '../components/lineGraph';
import styled from "styled-components";
import {useStore} from "../stores/common";
import {GraphDataType, GraphDatumEntry} from "../types";
import {MONTHS} from "../constants";

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
  height: 600px;
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

  svg.icon {
    height: 16px;
    width: 16px;
    padding: 8px;
    fill: #666;
  }
`;

export interface SensorPanelProps {

    city: string | null;

    [key: string]: any;

}

const SensorPanel = ({
                         city,
                         ...rest
                     }: SensorPanelProps) => {

    const setCommonStore = useStore(state => state.set);
    const sensorData = useStore(state => state.sensorData);
    const responsiveHeight = 100;

    const daylight = sensorData.map(value => value.Daylight);
    const daylightData = [];
    for (let i = 0; i < 12; i++) {
        daylightData.push({Month: MONTHS[i], Daylight: daylight[i]});
    }
    const clearness = sensorData.map(value => value.Clearness);
    const clearnessData = [];
    for (let i = 0; i < 12; i++) {
        clearnessData.push({Month: MONTHS[i], Clearness: clearness[i]});
    }
    const radiation = sensorData.map(value => value.Radiation);
    const radiationData = [];
    for (let i = 0; i < 12; i++) {
        radiationData.push({Month: MONTHS[i], Radiation: radiation[i]});
    }

    return (
        <Container>
            <ColumnWrapper>
                <Header>
                    <span>Sensor</span>
                    <span style={{cursor: 'pointer'}} onClick={() => {
                        setCommonStore((state) => {
                            state.showSensorPanel = false;
                        });
                    }}>Close</span>
                </Header>
                <LineGraph
                    type={GraphDataType.DaylightData}
                    dataSource={daylightData}
                    height={responsiveHeight}
                    labelX={'Month'}
                    labelY={'Daylight'}
                    unitY={'Hours'}
                    fractionDigits={1}
                    {...rest}
                />
                <LineGraph
                    type={GraphDataType.ClearnessData}
                    dataSource={clearnessData}
                    height={responsiveHeight}
                    labelX={'Month'}
                    labelY={'Clearness'}
                    unitY={'%'}
                    fractionDigits={1}
                    {...rest}
                />
                <LineGraph
                    type={GraphDataType.RadiationSensorData}
                    dataSource={radiationData}
                    height={responsiveHeight}
                    labelX={'Month'}
                    labelY={'Radiation'}
                    unitY={'kWh/m²/day'}
                    fractionDigits={1}
                    {...rest}
                />
                <div>
                    <span>{city}</span>
                </div>
            </ColumnWrapper>
        </Container>
    );

};

export default SensorPanel;
