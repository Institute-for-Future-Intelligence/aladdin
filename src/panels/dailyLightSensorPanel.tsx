/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import LineGraph from '../components/lineGraph';
import styled from "styled-components";
import {useStore} from "../stores/common";
import {GraphDataType} from "../types";
import moment from "moment";

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
  width: 600px;
  height: 300px;
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

export interface DailyLightSensorPanelProps {

    city: string | null;

    [key: string]: any;

}

const DailyLightSensorPanel = ({
                                   city,
                                   ...rest
                               }: DailyLightSensorPanelProps) => {

    const setCommonStore = useStore(state => state.set);
    const sensorData = useStore(state => state.dailyLightSensorData);
    const now = new Date(useStore(state => state.date));

    const responsiveHeight = 100;

    return (
        <Container>
            <ColumnWrapper>
                <Header>
                    <span>Light Sensor: {city} | {moment(now).format('MM/DD')}</span>
                    <span style={{cursor: 'pointer'}} onClick={() => {
                        setCommonStore((state) => {
                            state.showDailyLightSensorPanel = false;
                        });
                    }}>Close</span>
                </Header>
                <LineGraph
                    type={GraphDataType.DailyRadiationSensorData}
                    dataSource={sensorData}
                    height={responsiveHeight}
                    labelX={'Hour'}
                    labelY={'Radiation'}
                    unitY={'kWh/m²/day'}
                    yMin={0}
                    curveType={'natural'}
                    fractionDigits={2}
                    referenceX={now.getHours()}
                    {...rest}
                />
            </ColumnWrapper>
        </Container>
    );

};

export default DailyLightSensorPanel;
