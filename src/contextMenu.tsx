/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import styled from "styled-components";
import 'antd/dist/antd.css';
import {useStore} from "./stores/common";
import {useWorker} from "@koale/useworker";
import {Menu, Checkbox, Radio, Space} from 'antd';
import {ObjectType, Theme} from "./types";
import ReshapeElementMenu from "./components/reshapeElementMenu";
import HumanMenu from "./components/humanMenu";
import TreeMenu from "./components/treeMenu";
import NumericInput from "react-numeric-input";

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
    requestUpdate: () => void;

    [key: string]: any;

}

const ContextMenu = ({
                         city,
                         collectDailyLightSensorData,
                         collectYearlyLightSensorData,
                         requestUpdate,
                         ...rest
                     }: ContextMenuProps) => {

    const setCommonStore = useStore(state => state.set);
    const world = useStore(state => state.world);
    const viewState = useStore(state => state.viewState);
    const updateElementById = useStore(state => state.updateElementById);
    const grid = useStore(state => state.grid);
    const clickObjectType = useStore(state => state.clickObjectType);
    const cutElementById = useStore(state => state.cutElementById);
    const copyElementById = useStore(state => state.copyElementById);
    const pasteElement = useStore(state => state.pasteElement);
    const getSelectedElement = useStore(state => state.getSelectedElement);
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
                        <Checkbox checked={viewState.axes} onChange={(e) => {
                            setCommonStore(state => {
                                state.viewState.axes = e.target.checked;
                            });
                            requestUpdate();
                        }}>
                            Axes
                        </Checkbox>
                    </Menu.Item>
                    <Menu.Item key={'heliodon-settings'}>
                        <Checkbox checked={viewState.showHeliodonPanel} onChange={(e) => {
                            setCommonStore(state => {
                                state.viewState.showHeliodonPanel = e.target.checked;
                            });
                            requestUpdate();
                        }}>
                            Heliodon Settings
                        </Checkbox>
                    </Menu.Item>
                    <Menu.Item key={'weather-data'}>
                        <Checkbox checked={viewState.showWeatherPanel} onChange={(e) => {
                            setCommonStore(state => {
                                state.viewState.showWeatherPanel = e.target.checked;
                            });
                            requestUpdate();
                        }}>
                            Weather Data
                        </Checkbox>
                    </Menu.Item>
                    <SubMenu key={'theme'} title={'Theme'}>
                        <Radio.Group value={viewState.theme} style={{height: '135px'}} onChange={(e) => {
                            setCommonStore(state => {
                                state.viewState.theme = e.target.value;
                            });
                            requestUpdate();
                        }}>
                            <Radio style={radioStyle} value={Theme.Default}>{Theme.Default}</Radio>
                            <Radio style={radioStyle} value={Theme.Desert}>{Theme.Desert}</Radio>
                            <Radio style={radioStyle} value={Theme.Forest}>{Theme.Forest}</Radio>
                            <Radio style={radioStyle} value={Theme.Grassland}>{Theme.Grassland}</Radio>
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
                    {selectedElement &&
                    <ReshapeElementMenu
                        elementId={selectedElement.id}
                        name={'foundation'}
                        requestUpdate={requestUpdate}/>
                    }
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
                    {selectedElement &&
                    <ReshapeElementMenu
                        elementId={selectedElement.id}
                        name={'cuboid'}
                        requestUpdate={requestUpdate}/>
                    }
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
                    {selectedElement && <HumanMenu requestUpdate={requestUpdate}/>}
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
                                        maxWidth={40}
                                        maxHeight={20}
                                        widthName={'Spread'}
                                        adjustLength={false}
                                        adjustAngle={false}
                                        requestUpdate={requestUpdate}/>
                    }
                    {selectedElement && <TreeMenu requestUpdate={requestUpdate}/>}
                </StyledMenu>
            );
        default:
            return (
                <StyledMenu>
                    <Menu.Item key={'ground-paste'} onClick={pasteElement}>
                        Paste
                    </Menu.Item>
                    <Menu.Item key={'ground-grid'}>
                        <Checkbox checked={grid} onChange={(e) => {
                            setCommonStore(state => {
                                state.grid = e.target.checked;
                            });
                            requestUpdate();
                        }}>
                            Grid
                        </Checkbox>
                    </Menu.Item>
                    <Menu.Item key={'ground-settings'}>
                        <Checkbox checked={viewState.showGroundPanel} onChange={(e) => {
                            setCommonStore(state => {
                                state.viewState.showGroundPanel = e.target.checked;
                            });
                            requestUpdate();
                        }}>
                            Ground Settings
                        </Checkbox>
                    </Menu.Item>
                    <Menu.Item key={'ground-albedo'}>
                        <Space style={{width: '60px'}}>Albedo:</Space>
                        <NumericInput min={0.05}
                                      max={1}
                                      precision={2}
                                      value={world.ground.albedo}
                                      step={0.01}
                                      size={5}
                                      onChange={(e) => {
                                          if (e) {
                                              setCommonStore(state => {
                                                  state.world.ground.albedo = e;
                                              });
                                              //setUpdateFlag(!updateFlag);
                                          }
                                      }}
                        />
                    </Menu.Item>
                </StyledMenu>
            );
    }

};

export default ContextMenu;
