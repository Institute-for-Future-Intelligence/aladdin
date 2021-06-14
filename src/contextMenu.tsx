/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import styled from "styled-components";
import 'antd/dist/antd.css';
import {useStore} from "./stores/common";
import {useWorker} from "@koale/useworker";
import {Menu, Checkbox, Radio} from 'antd';
import {ObjectType, Theme} from "./types";
import {computeDailyData, computeHourlyData} from "./analysis/sensorAnalysis";
import {SensorModel} from "./models/sensorModel";

// TODO: Reduce the space between menu items
const StyledMenu = styled(Menu)`
  padding: 0;
  margin: 0;
`;

const {SubMenu} = StyledMenu;

const radioStyle = {
    display: 'block',
    height: '30px',
    paddingLeft: '10px',
    lineHeight: '30px',
};

export interface ContextMenuProps {

    city: string | null;

    [key: string]: any;

}

const ContextMenu = ({
                         city,
                         ...rest
                     }: ContextMenuProps) => {

    const setCommonStore = useStore(state => state.set);
    const latitude = useStore(state => state.latitude);
    const longitude = useStore(state => state.longitude);
    const today = new Date(useStore(state => state.date));
    const getWorld = useStore(state => state.getWorld);
    const getWeather = useStore(state => state.getWeather);
    const getSelectedElement = useStore(state => state.getSelectedElement);
    const updateElementById = useStore(state => state.updateElementById);
    const axes = useStore(state => state.axes);
    const grid = useStore(state => state.grid);
    const theme = useStore(state => state.theme);
    const showHeliodonPanel = useStore(state => state.showHeliodonPanel);
    const showGroundPanel = useStore(state => state.showGroundPanel);
    const showWeatherPanel = useStore(state => state.showWeatherPanel);
    const clickObjectType = useStore(state => state.clickObjectType);
    const setDailyLightSensorData = useStore(state => state.setDailyLightSensorData);
    const setYearlyLightSensorData = useStore(state => state.setYearlyLightSensorData);

    const weather = getWeather(city ?? 'Boston MA, USA');
    const ground = getWorld('default').ground;
    const selectedElement = getSelectedElement();
    switch (selectedElement ? selectedElement.type : clickObjectType) {
        case ObjectType.Sky:
            return (
                <StyledMenu style={{padding: 0, margin: 0}}>
                    <Menu.Item key={'axes'}>
                        <Checkbox checked={axes} onChange={(e) => {
                            setCommonStore(state => {
                                state.axes = e.target.checked;
                            });
                        }}>
                            Axes
                        </Checkbox>
                    </Menu.Item>
                    <Menu.Item key={'heliodon-settings'}>
                        <Checkbox checked={showHeliodonPanel} onChange={(e) => {
                            setCommonStore(state => {
                                state.showHeliodonPanel = e.target.checked;
                            });
                        }}>
                            Heliodon Settings
                        </Checkbox>
                    </Menu.Item>
                    <Menu.Item key={'weather-data'}>
                        <Checkbox checked={showWeatherPanel} onChange={(e) => {
                            setCommonStore(state => {
                                state.showWeatherPanel = e.target.checked;
                            });
                        }}>
                            Weather Data
                        </Checkbox>
                    </Menu.Item>
                    <SubMenu key={'theme'} title={'Theme'}>
                        <Radio.Group value={theme} style={{height: '105px'}} onChange={(e) => {
                            setCommonStore(state => {
                                state.theme = e.target.value;
                            });
                        }}>
                            <Radio style={radioStyle} value={Theme.Default}>Default</Radio>
                            <Radio style={radioStyle} value={Theme.Desert}>Desert</Radio>
                            <Radio style={radioStyle} value={Theme.Grassland}>Grassland</Radio>
                        </Radio.Group>
                    </SubMenu>
                </StyledMenu>);
        case ObjectType.Foundation:
            return (
                <StyledMenu>
                    <Menu.Item key={'foundation-copy'}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'foundation-cut'}>
                        Cut
                    </Menu.Item>
                </StyledMenu>
            );
        case ObjectType.Sensor:
            return (
                <StyledMenu>
                    <Menu.Item key={'sensor-copy'}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'sensor-cut'}>
                        Cut
                    </Menu.Item>
                    <Menu.Item key={'sensor-light'}>
                        <Checkbox checked={!!selectedElement?.showLabel} onChange={(e) => {
                            if (selectedElement) {
                                updateElementById(selectedElement.id, {showLabel: e.target.checked});
                            }
                        }}>
                            Show Label
                        </Checkbox>
                    </Menu.Item>
                    <SubMenu key={'analysis'} title={'Analysis'}>
                        <Menu.Item key={'sensor-collect-daily-data'} onClick={async () => {
                            const result = computeHourlyData(
                                selectedElement as SensorModel,
                                weather,
                                ground,
                                latitude,
                                longitude,
                                city ? getWeather(city).elevation : 0,
                                today);
                            setDailyLightSensorData(result);
                            setCommonStore(state => {
                                state.showDailyLightSensorPanel = true;
                            });
                        }}>
                            Collect Daily Data
                        </Menu.Item>
                        <Menu.Item key={'sensor-collect-yearly-data'} onClick={async () => {
                            const data = [];
                            for (let i = 0; i < 12; i++) {
                                const midMonth = new Date(today.getFullYear(), i, 15, 12);
                                const result = computeDailyData(
                                    selectedElement as SensorModel,
                                    weather,
                                    ground,
                                    latitude,
                                    longitude,
                                    city ? getWeather(city).elevation : 0,
                                    midMonth);
                                data.push(result);
                            }
                            setYearlyLightSensorData(data);
                            setCommonStore(state => {
                                state.showYearlyLightSensorPanel = true;
                            });
                        }}>
                            Collect Yearly Data
                        </Menu.Item>
                    </SubMenu>
                </StyledMenu>
            );
        case ObjectType.Cuboid:
            return (
                <StyledMenu>
                    <Menu.Item key={'cuboid-copy'}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'cuboid-cut'}>
                        Cut
                    </Menu.Item>
                </StyledMenu>
            );
        default:
            return (
                <StyledMenu>
                    <Menu.Item key={'ground-grid'}>
                        <Checkbox checked={grid} onChange={(e) => {
                            setCommonStore(state => {
                                state.grid = e.target.checked;
                            });
                        }}>
                            Grid
                        </Checkbox>
                    </Menu.Item>
                    <Menu.Item key={'ground-settings'}>
                        <Checkbox checked={showGroundPanel} onChange={(e) => {
                            setCommonStore(state => {
                                state.showGroundPanel = e.target.checked;
                            });
                        }}>
                            Ground Settings
                        </Checkbox>
                    </Menu.Item>
                    <Menu.Item key={'ground-paste'}>
                        Paste
                    </Menu.Item>
                </StyledMenu>
            );
    }

};

export default ContextMenu;
