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
    const showHeliodonSettings = useStore(state => state.showHeliodonSettings);
    const showGroundSettings = useStore(state => state.showGroundSettings);
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
    const changeHeliodon = (e) => {
        setCommonStore(state => {
            state.heliodon = e.target.checked;
        });
    };

    //@ts-ignore
    const changeShowHeliodonSettings = (e) => {
        setCommonStore(state => {
            state.showHeliodonSettings = e.target.checked;
        });
    };

    //@ts-ignore
    const changeGrid = (e) => {
        setCommonStore(state => {
            state.grid = e.target.checked;
        });
    };

    //@ts-ignore
    const changeShowGroundSettings = (e) => {
        setCommonStore(state => {
            state.showGroundSettings = e.target.checked;
        });
    };

    switch (clickObjectType) {
        case ClickObjectType.sky:
            return (
                <Menu>
                    <Menu.Item key={'axes'}>
                        <Checkbox checked={axes} onChange={changeAxes}>
                            Axes
                        </Checkbox>
                    </Menu.Item>
                    <Menu.Item key={'heliodon'}>
                        <Checkbox checked={heliodon} onChange={changeHeliodon}>
                            Heliodon
                        </Checkbox>
                    </Menu.Item>
                    <Menu.Item key={'heliodon-settings'}>
                        <Checkbox checked={showHeliodonSettings} onChange={changeShowHeliodonSettings}>
                            Heliodon Settings
                        </Checkbox>
                    </Menu.Item>
                    {<SubMenu key={'theme'} title={'Theme'}>
                        <Radio.Group onChange={selectTheme} value={theme} style={{height: '105px'}}>
                            <Radio style={radioStyle} value={Theme.default}>Default</Radio>
                            <Radio style={radioStyle} value={Theme.desert}>Desert</Radio>
                            <Radio style={radioStyle} value={Theme.grassland}>Grassland</Radio>
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
                        <Checkbox checked={showGroundSettings} onChange={changeShowGroundSettings}>
                            Ground Settings
                        </Checkbox>
                    </Menu.Item>
                </Menu>
            );
    }

};

export default ContextMenu;
