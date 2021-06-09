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

    const set = useStore(state => state.set);
    const showGroundSettings = useStore(state => state.showGroundSettings);
    const showHeliodonSettings = useStore(state => state.showHeliodonSettings);

    // @ts-ignore
    const onChangeShowGroundSettings = (e) => {
        set((state) => {
            state.showGroundSettings = e.target.checked;
        });
    };

    // @ts-ignore
    const onChangeShowHeliodonSettings = (e) => {
        set((state) => {
            state.showHeliodonSettings = e.target.checked;
        });
    };

    const menu = (
        <Menu>
            <Menu.Item key={'ground-settings-switch'}>
                <Checkbox checked={showGroundSettings} onChange={onChangeShowGroundSettings}>
                    Ground Settings
                </Checkbox>
            </Menu.Item>
            <Menu.Item key={'heliodon-settings-switch'}>
                <Checkbox checked={showHeliodonSettings} onChange={onChangeShowHeliodonSettings}>
                    Heliodon Settings
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
