/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useMemo} from 'react';
import BarGraph from "../components/barGraph";
import LineGraph from '../components/lineGraph';
import {GraphDataType} from "../types";
import styled from "styled-components";
import {useStore} from "../stores/common";
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
  height: 500px;
  padding-bottom: 10px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
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

export interface WeatherPanelProps {

    city: string | null;
    graphs: GraphDataType[];

    [key: string]: any;

}

const WeatherPanel = ({
                          city,
                          graphs,
                          ...rest
                      }: WeatherPanelProps) => {

    const setCommonStore = useStore(state => state.set);
    const getWeather = useStore(state => state.getWeather);

    const responsiveHeight = useMemo(() => {
        return graphs ? Math.floor(100 / graphs.length) : 100;
    }, [graphs]);

    const getData = useMemo(() => {
        if (!graphs) {
            return;
        }
        const result: any = {};
        if (city) {
            const weather = getWeather(city);
            if (weather) {
                graphs.forEach(g => {
                    result[g] = [];
                    switch (g) {
                        case GraphDataType.MonthlyTemperatures:
                            for (let i = 0; i < 12; i++) {
                                result[g].push(
                                    {
                                        Month: MONTHS[i],
                                        Low: weather.lowestTemperatures[i],
                                        High: weather.highestTemperatures[i]
                                    }
                                );
                            }
                            break;
                        case GraphDataType.SunshineHours:
                            for (let i = 0; i < 12; i++) {
                                result[g].push(
                                    {
                                        Month: MONTHS[i],
                                        Sunshine: weather.sunshineHours[i]
                                    }
                                );
                            }
                            break;
                    }
                });
            }
        }
        return result;
    }, [graphs, city]);

    const yNames = ['Temperature', 'Temperature', 'Sunshine'];
    const yUnits = ['°C', '°C', 'Hours'];

    return (
        <Container>
            <ColumnWrapper>
                <Header>
                    <span>Weather</span>
                    <span style={{cursor: 'pointer'}} onClick={() => {
                        setCommonStore((state) => {
                            state.showWeatherPanel = false;
                        });
                    }}>Close</span>
                </Header>
                <>
                    {graphs.map(g => {
                        if (g === GraphDataType.SunshineHours) {
                            return (
                                <BarGraph
                                    key={g}
                                    type={g}
                                    dataSource={getData[g]}
                                    height={responsiveHeight}
                                    labelX={'Month'}
                                    labelY={yNames[g]}
                                    unitY={yUnits[g]}
                                    fractionDigits={0}
                                    color={'#FFD700'}
                                    {...rest}
                                />
                            );
                        }
                        return (
                            <LineGraph
                                key={g}
                                type={g}
                                dataSource={getData[g]}
                                height={responsiveHeight}
                                labelX={'Month'}
                                labelY={yNames[g]}
                                unitY={yUnits[g]}
                                fractionDigits={0}
                                {...rest}
                            />
                        );
                    })}
                    <div>
                        <span>{city}</span>
                    </div>
                </>
            </ColumnWrapper>
        </Container>
    );

};

export default WeatherPanel;
