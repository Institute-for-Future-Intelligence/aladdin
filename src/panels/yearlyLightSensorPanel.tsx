/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import LineGraph from '../components/lineGraph';
import styled from "styled-components";
import {useStore} from "../stores/common";
import {GraphDataType} from "../types";
import {MONTHS} from "../constants";
import {Util} from "../util";
import BarGraph from "../components/barGraph";

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

  svg.icon {
    height: 16px;
    width: 16px;
    padding: 8px;
    fill: #666;
  }
`;

export interface YearlyLightSensorPanelProps {

    city: string | null;

    [key: string]: any;

}

const YearlyLightSensorPanel = ({
                                    city,
                                    ...rest
                                }: YearlyLightSensorPanelProps) => {

    const setCommonStore = useStore(state => state.set);
    const sensorData = useStore(state => state.yearlyLightSensorData);
    const now = useStore(state => state.date);

    const responsiveHeight = 100;
    const referenceX = MONTHS[Math.floor(Util.daysIntoYear(now) / 365 * 12)];

    return (
        <Container>
            <ColumnWrapper>
                <Header>
                    <span>Light Sensor: {city}</span>
                    <span style={{cursor: 'pointer'}} onClick={() => {
                        setCommonStore((state) => {
                            state.showYearlyLightSensorPanel = false;
                        });
                    }}>Close</span>
                </Header>
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
                <LineGraph
                    type={GraphDataType.YearlyRadiationSensorData}
                    dataSource={sensorData.map(e => ({Month: e.Month, Radiation: e.Radiation}))}
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
            </ColumnWrapper>
        </Container>
    );

};

export default YearlyLightSensorPanel;
