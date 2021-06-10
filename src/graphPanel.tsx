/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useMemo, useRef} from 'react';
import LinePlot from './components/linePlot';
import {GraphType} from "./types";
import styled from "styled-components";
import {useStore} from "./stores/common";
import {MONTHS} from "./constants";

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

export interface GraphPanelProps {

    city: string | null;
    graphs: GraphType[];

    [key: string]: any;

}

const GraphPanel = ({
                        city,
                        graphs,
                        ...rest
                    }: GraphPanelProps) => {

    const getWeather = useStore(state => state.getWeather);
    const selectedDataKey = useRef<string | null>(null);

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
                        case GraphType.monthlyTemperatures:
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
                        case GraphType.sunshineHours:
                            for (let i = 0; i < 12; i++) {
                                result[g].push({i: weather.sunshineHours[i]});
                            }
                            break;
                    }
                });
            }
        }
        return result;
    }, [graphs, city]);

    return (
        <Container>
            <ColumnWrapper>
                <Header>
                    <span>Temperature</span>
                    <span style={{cursor: 'pointer'}} onClick={() => {
                    }}>Close</span>
                </Header>
                <>
                    {graphs.map(g => {
                        return (
                            <LinePlot
                                dataSource={getData[g]}
                                height={responsiveHeight}
                                labelX={'Month'}
                                labelY={'Temperature'}
                                unitY={'°C'}
                                selectedDataKey={selectedDataKey.current}
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

export default GraphPanel;
