/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import styled from 'styled-components';
import {Menu, Dropdown, Checkbox, Slider} from 'antd';
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

export interface menuProps {
    heliodon: boolean;
    latitude: number;
    date: Date;
    toggleHeliodon?: (on: boolean) => void;
    changeLatitude?: (latitude: number) => void;
    changeDate?: (date: Date) => void;
}

const MainMenu = ({
                      heliodon,
                      latitude,
                      date,
                      toggleHeliodon,
                      changeLatitude,
                      changeDate,
                  }: menuProps) => {

    const onToggleHeliodon = () => {
        toggleHeliodon?.(!heliodon);
    };

    const onChangeLatitude = (value: number) => {
        changeLatitude?.(value);
    };

    const onChangeDate = (date: Date) => {
        changeDate?.(date);
    };

    const menu = (
        <Menu>
            <Menu.Item key={'heliodon-checkbox'}>
                <Checkbox checked={heliodon} onClick={onToggleHeliodon}>
                    Heliodon
                </Checkbox>
            </Menu.Item>
            <Menu.Item key={'latitude-slider'}>
                Latitude:
                <Slider
                    min={-90}
                    max={90}
                    tooltipVisible={false}
                    defaultValue={latitude}
                    onChange={onChangeLatitude}/>
            </Menu.Item>
        </Menu>
    );

    return (
        <Dropdown overlay={menu}>
            <StyledMenuSVG/>
        </Dropdown>
    );
};

export default MainMenu;
