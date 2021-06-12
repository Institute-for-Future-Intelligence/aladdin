/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import {useStore} from "./stores/common";
import {Menu, Checkbox, Radio} from 'antd';
import {ClickObjectType, Theme} from "./types";
import 'antd/dist/antd.css';

const {SubMenu} = Menu;

const radioStyle = {
    display: 'block',
    height: '30px',
    paddingLeft: '10px',
    lineHeight: '30px',
};

const ContextMenu = () => {

    const setCommonStore = useStore(state => state.set);
    const heliodon = useStore(state => state.heliodon);
    const axes = useStore(state => state.axes);
    const grid = useStore(state => state.grid);
    const theme = useStore(state => state.theme);
    const showHeliodonPanel = useStore(state => state.showHeliodonPanel);
    const showGroundPanel = useStore(state => state.showGroundPanel);
    const showWeatherPanel = useStore(state => state.showWeatherPanel);
    const clickObjectType = useStore(state => state.clickObjectType);

    //@ts-ignore
    const selectTheme = (e) => {
        setCommonStore(state => {
            state.theme = e.target.value;
        });
    };

    //@ts-ignore
    const changeAxes = (e) => {
        setCommonStore(state => {
            state.axes = e.target.checked;
        });
    };

    //@ts-ignore
    const changeShowWeatherPanel = (e) => {
        setCommonStore(state => {
            state.showWeatherPanel = e.target.checked;
        });
    };

    //@ts-ignore
    const changeShowHeliodonPanel = (e) => {
        setCommonStore(state => {
            state.showHeliodonPanel = e.target.checked;
        });
    };

    //@ts-ignore
    const changeGrid = (e) => {
        setCommonStore(state => {
            state.grid = e.target.checked;
        });
    };

    //@ts-ignore
    const changeShowGroundPanel = (e) => {
        setCommonStore(state => {
            state.showGroundPanel = e.target.checked;
        });
    };

    switch (clickObjectType) {
        case ClickObjectType.Sky:
            return (
                <Menu>
                    <Menu.Item key={'axes'}>
                        <Checkbox checked={axes} onChange={changeAxes}>
                            Axes
                        </Checkbox>
                    </Menu.Item>
                    <Menu.Item key={'heliodon-settings'}>
                        <Checkbox checked={showHeliodonPanel} onChange={changeShowHeliodonPanel}>
                            Heliodon Settings
                        </Checkbox>
                    </Menu.Item>
                    <Menu.Item key={'weather-data'}>
                        <Checkbox checked={showWeatherPanel} onChange={changeShowWeatherPanel}>
                            Weather Data
                        </Checkbox>
                    </Menu.Item>
                    {<SubMenu key={'theme'} title={'Theme'}>
                        <Radio.Group onChange={selectTheme} value={theme} style={{height: '105px'}}>
                            <Radio style={radioStyle} value={Theme.Default}>Default</Radio>
                            <Radio style={radioStyle} value={Theme.Desert}>Desert</Radio>
                            <Radio style={radioStyle} value={Theme.Grassland}>Grassland</Radio>
                        </Radio.Group>
                    </SubMenu>}
                </Menu>);
        default:
            return (
                <Menu>
                    <Menu.Item key={'ground-grid'}>
                        <Checkbox checked={grid} onChange={changeGrid}>
                            Grid
                        </Checkbox>
                    </Menu.Item>
                    <Menu.Item key={'ground-settings'}>
                        <Checkbox checked={showGroundPanel} onChange={changeShowGroundPanel}>
                            Ground Settings
                        </Checkbox>
                    </Menu.Item>
                </Menu>
            );
    }

};

export default ContextMenu;
