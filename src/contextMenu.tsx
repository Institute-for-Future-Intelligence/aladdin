/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useState} from 'react';
import styled from "styled-components";
import 'antd/dist/antd.css';
import {useStore} from "./stores/common";
import {useWorker} from "@koale/useworker";
import {Menu, Checkbox, Radio} from 'antd';
import {ObjectType, Theme} from "./types";
import ReshapeElementMenu from "./components/reshapeElementMenu";
import {TreeModel} from "./models/treeModel";
import HumanMenu from "./components/humanMenu";
import {HumanModel} from "./models/humanModel";
import TreeMenu from "./components/treeMenu";

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
    collectDailyLightSensorData: () => void;
    collectYearlyLightSensorData: () => void;

    [key: string]: any;

}

const ContextMenu = ({
                         city,
                         collectDailyLightSensorData,
                         collectYearlyLightSensorData,
                         ...rest
                     }: ContextMenuProps) => {

    const setCommonStore = useStore(state => state.set);
    const updateElementById = useStore(state => state.updateElementById);
    const axes = useStore(state => state.axes);
    const grid = useStore(state => state.grid);
    const theme = useStore(state => state.theme);
    const showHeliodonPanel = useStore(state => state.showHeliodonPanel);
    const showGroundPanel = useStore(state => state.showGroundPanel);
    const showWeatherPanel = useStore(state => state.showWeatherPanel);
    const clickObjectType = useStore(state => state.clickObjectType);
    const getSelectedElement = useStore(state => state.getSelectedElement);
    const cutElementById = useStore(state => state.cutElementById);
    const copyElementById = useStore(state => state.copyElementById);
    const pasteElement = useStore(state => state.pasteElement);
    const selectedElement = getSelectedElement();

    const copyElement = () => {
        if (selectedElement) {
            copyElementById(selectedElement.id);
        }
    };

    const cutElement = () => {
        if (selectedElement) {
            cutElementById(selectedElement.id);
        }
    };

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
                    <Menu.Item key={'foundation-copy'} onClick={copyElement}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'foundation-cut'} onClick={cutElement}>
                        Cut
                    </Menu.Item>
                    <Menu.Item key={'foundation-paste'} onClick={pasteElement}>
                        Paste
                    </Menu.Item>
                    {selectedElement && <ReshapeElementMenu elementId={selectedElement.id} name={'foundation'}/>}
                </StyledMenu>
            );
        case ObjectType.Sensor:
            return (
                <StyledMenu>
                    <Menu.Item key={'sensor-copy'} onClick={copyElement}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'sensor-cut'} onClick={cutElement}>
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
                        <Menu.Item key={'sensor-collect-daily-data'} onClick={collectDailyLightSensorData}>
                            Collect Daily Data
                        </Menu.Item>
                        <Menu.Item key={'sensor-collect-yearly-data'} onClick={collectYearlyLightSensorData}>
                            Collect Yearly Data
                        </Menu.Item>
                    </SubMenu>
                </StyledMenu>
            );
        case ObjectType.Cuboid:
            return (
                <StyledMenu>
                    <Menu.Item key={'cuboid-copy'} onClick={copyElement}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'cuboid-cut'} onClick={cutElement}>
                        Cut
                    </Menu.Item>
                    <Menu.Item key={'cuboid-paste'} onClick={pasteElement}>
                        Paste
                    </Menu.Item>
                    {selectedElement && <ReshapeElementMenu elementId={selectedElement.id} name={'foundation'}/>}
                </StyledMenu>
            );
        case ObjectType.Human:
            return (
                <StyledMenu>
                    <Menu.Item key={'human-copy'} onClick={copyElement}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'human-cut'} onClick={cutElement}>
                        Cut
                    </Menu.Item>
                    {selectedElement && <HumanMenu human={selectedElement as HumanModel}/>}
                </StyledMenu>
            );
        case ObjectType.Tree:
            return (
                <StyledMenu style={{padding: 0, margin: 0}}>
                    <Menu.Item key={'tree-copy'} onClick={copyElement}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'tree-cut'} onClick={cutElement}>
                        Cut
                    </Menu.Item>
                    {selectedElement &&
                    <ReshapeElementMenu elementId={selectedElement.id}
                                        name={'tree'}
                                        widthName={'Spread'}
                                        length={false}
                                        angle={false}/>
                    }
                    {selectedElement && <TreeMenu tree={selectedElement as TreeModel}/>}
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
                    <Menu.Item key={'ground-paste'} onClick={pasteElement}>
                        Paste
                    </Menu.Item>
                </StyledMenu>
            );
    }

};

export default ContextMenu;
