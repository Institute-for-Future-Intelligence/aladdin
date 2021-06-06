/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect, useRef} from 'react';
import {useStore} from "./stores/common";
import styled from 'styled-components';
import {Space, Switch, Slider, DatePicker, TimePicker} from "antd";
import moment from 'moment';
import 'antd/dist/antd.css';

const Container = styled.div`
  position: fixed;
  top: 10px;
  left: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 9;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  left: 0;
  top: 0;
  width: 640px;
  padding: 0;
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

export interface SolarSettingsPanelProps {
    heliodon: boolean;
    latitude: number;
    date: Date;
    animateSun?: boolean;
    setHeliodon?: (on: boolean) => void;
    setSunAnimation?: (on: boolean) => void;
    changeLatitude?: (latitude: number) => void;
    changeDate?: (date: Date) => void;
    changeTime?: (date: Date) => void;
}

const SolarSettingsPanel = ({
                                heliodon,
                                latitude,
                                date,
                                animateSun,
                                setHeliodon,
                                setSunAnimation,
                                changeLatitude,
                                changeDate,
                                changeTime,
                            }: SolarSettingsPanelProps) => {

    const set = useStore(state => state.set);
    const requestRef = useRef<number>(0);
    const previousFrameTime = useRef<number>(-1);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            cancelAnimationFrame(requestRef.current);
        }
    }, [animateSun]);

    const animate = () => {
        if (animateSun) {
            requestRef.current = requestAnimationFrame(animate);
            const currentFrameTime = Date.now();
            if (currentFrameTime - previousFrameTime.current > 100) {
                const day = date.getDate();
                date.setHours(date.getHours(), date.getMinutes() + 15);
                date.setDate(day)
                changeTime?.(date);
                previousFrameTime.current = currentFrameTime;
            }
        }
    };

    return (
        <Container>
            <ColumnWrapper>
                <Header>
                    <span>Solar Settings</span>
                    <span style={{cursor: 'pointer'}} onClick={() => {
                        set((state) => {
                            state.showSolarSettings = false;
                        });
                    }}>Close</span>
                </Header>
                <Space style={{padding: '20px'}} align={'baseline'} size={20}>
                    <div>
                        Heliodon<br/>
                        <Switch checked={heliodon} onChange={(checked) => {
                            setHeliodon?.(checked);
                        }}/>
                    </div>
                    <div>
                        Animate<br/>
                        <Switch checked={animateSun} onChange={(checked) => {
                            setSunAnimation?.(checked);
                        }}/>
                    </div>
                    <div>
                        Date<br/>
                        <DatePicker value={moment(date)}
                                    onChange={(moment) => {
                                        if (moment) changeDate?.(moment.toDate());
                                    }}
                        />
                    </div>
                    <div>
                        Time<br/>
                        <TimePicker value={moment(date, 'HH:mm')}
                                    format={'HH:mm'}
                                    onChange={(moment) => {
                                        if (moment) changeTime?.(moment.toDate());
                                    }}
                        />
                    </div>
                    <div>
                        Latitude: {latitude}°
                        <Slider
                            style={{width: '150px'}}
                            marks={{'-90': '-90°', 0: '0°', 90: '90°'}}
                            min={-90}
                            max={90}
                            tooltipVisible={false}
                            defaultValue={latitude}
                            onChange={(value: number) => {
                                changeLatitude?.(value);
                            }}
                        />
                    </div>
                </Space>
            </ColumnWrapper>
        </Container>
    );
};

export default SolarSettingsPanel;
