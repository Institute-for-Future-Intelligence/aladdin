/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import {useStore} from "./stores/common";
import styled from 'styled-components';
import {Menu, Dropdown, Checkbox} from 'antd';
import {ReactComponent as MenuSVG} from './assets/menu.svg';
import 'antd/dist/antd.css';

const {SubMenu} = Menu;

const StyledMenuSVG = styled(MenuSVG)`
  position: absolute;
  top: 10px;
  left: 10px;
  height: 40px;
  width: 40px;
  transition: 0.5s;
  fill: brown;

  &:hover {
    fill: white;
  }
`;

export interface MainMenuProps {

    collectDailyLightSensorData: () => void;
    collectYearlyLightSensorData: () => void;
    openAboutUs: (on: boolean) => void;

    [key: string]: any;

}

const MainMenu = ({
                      collectDailyLightSensorData,
                      collectYearlyLightSensorData,
                      openAboutUs,
                      ...rest
                  }: MainMenuProps) => {

    const setCommonStore = useStore(state => state.set);
    const showGroundPanel = useStore(state => state.showGroundPanel);
    const showWeatherPanel = useStore(state => state.showWeatherPanel);
    const shadowEnabled = useStore(state => state.shadowEnabled);

    const menu = (
        <Menu>
            <Menu.Item key={'ground-panel-check-box'}>
                <Checkbox checked={showGroundPanel} onChange={(e) => {
                    setCommonStore((state) => {
                        state.showGroundPanel = e.target.checked;
                    });
                }}>
                    Ground Settings
                </Checkbox>
            </Menu.Item>
            <Menu.Item key={'weather-panel-check-box'}>
                <Checkbox checked={showWeatherPanel} onChange={(e) => {
                    setCommonStore((state) => {
                        state.showWeatherPanel = e.target.checked;
                    });
                }}>
                    Weather Data
                </Checkbox>
            </Menu.Item>
            <Menu.Item key={'shadow-check-box'}>
                <Checkbox checked={shadowEnabled} onChange={(e) => {
                    setCommonStore((state) => {
                        state.shadowEnabled = e.target.checked;
                    });
                }}>
                    Enable Shadow
                </Checkbox>
            </Menu.Item>
            <SubMenu key={'sensors'} title={'Sensors'}>
                <Menu.Item key={'sensor-collect-daily-data'} onClick={collectDailyLightSensorData}>
                    Collect Daily Data
                </Menu.Item>
                <Menu.Item key={'sensor-collect-yearly-data'} onClick={collectYearlyLightSensorData}>
                    Collect Yearly Data
                </Menu.Item>
            </SubMenu>
            <Menu.Item key={'about-us'} onClick={() => {
                openAboutUs(true);
            }}>
                About Us
            </Menu.Item>
        </Menu>
    );

    return (
        <Dropdown overlay={menu} trigger={['click']}>
            <StyledMenuSVG/>
        </Dropdown>
    );
};

export default MainMenu;
