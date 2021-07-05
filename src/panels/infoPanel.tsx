/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect, useState} from "react";
import {useStore} from "../stores/common";
import styled from "styled-components";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCalendarDay, faCloudSunRain, faMapMarkerAlt} from "@fortawesome/free-solid-svg-icons";
import {Space} from "antd";
import {computeOutsideTemperature, getOutsideTemperatureAtMinute} from "../analysis/heatTools";
import dayjs from "dayjs";
import {Util} from "../Util";

const Container = styled.div`
  position: absolute;
  top: 80px;
  left: 0;
  margin: auto;
  display: flex;
  justify-content: center;
  align-self: center;
  alignment: center;
  align-content: center;
  align-items: center;
  padding: 16px;
  opacity: 100%;
  user-select: none;
  z-index: 8; // must be less than other panels
`;

const ColumnWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  align-self: center;
  alignment: center;
  align-content: center;
  align-items: center;
  margin: auto;
  width: calc(100vw - 20px);
  padding-bottom: 10px;
  display: flex;
  font-size: 12px;
  flex-direction: column;
  opacity: 100%;
`;

export interface InfoPanelProps {
    city: string | null;
    daytime: boolean;
}

const InfoPanel = ({city, daytime}: InfoPanelProps) => {

    const world = useStore(state => state.world);
    const weatherData = useStore(state => state.weatherData);
    const now = new Date(world.date);
    const [dailyTemperatures, setDailyTemperatures] = useState({low: 0, high: 20});
    const [currentTemperature, setCurrentTemperature] = useState<number>(10);

    useEffect(() => {
        if (city) {
            const weather = weatherData[city];
            if (weather) {
                const t = computeOutsideTemperature(now, weather.lowestTemperatures, weather.highestTemperatures);
                setDailyTemperatures(t);
                const c = getOutsideTemperatureAtMinute(t.high, t.low, Util.minutesIntoDay(now));
                setCurrentTemperature(c);
            }
        }
    }, [city, world.date]);

    const color = daytime ? 'gray' : 'antiquewhite';

    return (
        <Container>
            <ColumnWrapper>
                <Space direction={'horizontal'} style={{color: color}}>
                    <FontAwesomeIcon title={'Geo'}
                                     icon={faMapMarkerAlt}
                                     size={'3x'}
                                     color={color}
                                     style={{paddingLeft: '10px'}}
                    />
                    {
                        (world.address ? world.address : '') + ' (' +
                        Math.abs(world.latitude).toFixed(2) + '° ' + (world.latitude > 0 ? 'N' : 'S') + ', ' +
                        Math.abs(world.longitude).toFixed(2) + '° ' + (world.longitude > 0 ? 'E' : 'W') + ')'
                    }
                    <FontAwesomeIcon title={'Date'}
                                     icon={faCalendarDay}
                                     size={'3x'}
                                     color={color}
                                     style={{paddingLeft: '10px'}}
                    />
                    {dayjs(now).format('MM/DD hh:mm a')}
                    <FontAwesomeIcon title={'Weather'}
                                     icon={faCloudSunRain}
                                     size={'3x'}
                                     color={color}
                                     style={{paddingLeft: '10px'}}
                    />
                    {dailyTemperatures ?
                        'Low: ' + dailyTemperatures.low.toFixed(1) + '°C, ' +
                        'High: ' + dailyTemperatures.high.toFixed(1) + '°C, ' +
                        'Now: ' + currentTemperature.toFixed(1) + '°C'
                        :
                        ''
                    }
                </Space>
            </ColumnWrapper>
        </Container>
    )
};

export default InfoPanel;
