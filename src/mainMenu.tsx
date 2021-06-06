/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import {useStore} from "./stores/common";
import styled from 'styled-components';
import {Menu, Dropdown, Space, Checkbox} from 'antd';
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
    const showSceneSettings = useStore(state => state.showSceneSettings);
    const showSolarSettings = useStore(state => state.showSolarSettings);

    // @ts-ignore
    const onChangeShowSceneSettings = (e) => {
        set((state) => {
            state.showSceneSettings = e.target.checked;
        });
    };

    // @ts-ignore
    const onChangeShowSolarSettings = (e) => {
        set((state) => {
            state.showSolarSettings = e.target.checked;
        });
    };

    const menu = (
        <Menu>
            <Menu.Item key={'scene-settings-switch'}>
                <Space>
                    <Checkbox checked={showSceneSettings} onChange={onChangeShowSceneSettings}>
                        Scene Settings
                    </Checkbox>
                </Space>
            </Menu.Item>
            <Menu.Item key={'solar-settings-switch'}>
                <Space>
                    <Checkbox checked={showSolarSettings} onChange={onChangeShowSolarSettings}>
                        Solar Settings
                    </Checkbox>
                </Space>
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
