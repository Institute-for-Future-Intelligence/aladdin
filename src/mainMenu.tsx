/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import {useStore} from "./stores/common";
import styled from 'styled-components';
import {Menu, Dropdown, Checkbox} from 'antd';
import {ReactComponent as MenuSVG} from './assets/menu.svg';
import 'antd/dist/antd.css';

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

const MainMenu = () => {

    const setCommonStore = useStore(state => state.set);
    const showGroundPanel = useStore(state => state.showGroundPanel);
    const showWeatherPanel = useStore(state => state.showWeatherPanel);
    const showHeliodonPanel = useStore(state => state.showHeliodonPanel);

    // @ts-ignore
    const onChangeShowGroundPanel = (e) => {
        setCommonStore((state) => {
            state.showGroundPanel = e.target.checked;
        });
    };

    // @ts-ignore
    const onChangeShowWeatherPanel = (e) => {
        setCommonStore((state) => {
            state.showWeatherPanel = e.target.checked;
        });
    };

    // @ts-ignore
    const onChangeShowHeliodonPanel = (e) => {
        setCommonStore((state) => {
            state.showHeliodonPanel = e.target.checked;
        });
    };

    const menu = (
        <Menu>
            <Menu.Item key={'ground-panel-check-box'}>
                <Checkbox checked={showGroundPanel} onChange={onChangeShowGroundPanel}>
                    Ground Settings
                </Checkbox>
            </Menu.Item>
            <Menu.Item key={'heliodon-panel-check-box'}>
                <Checkbox checked={showHeliodonPanel} onChange={onChangeShowHeliodonPanel}>
                    Heliodon Settings
                </Checkbox>
            </Menu.Item>
            <Menu.Item key={'weather-panel-check-box'}>
                <Checkbox checked={showWeatherPanel} onChange={onChangeShowWeatherPanel}>
                    Weather Data
                </Checkbox>
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
