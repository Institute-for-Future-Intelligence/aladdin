/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useState} from 'react';
import styled from "styled-components";
import 'antd/dist/antd.css';
import {useStore} from "./stores/common";
import {Checkbox, Input, Menu, Modal, Radio, Space} from 'antd';
import {ObjectType, Theme} from "./types";
import ReshapeElementMenu from "./components/reshapeElementMenu";
import HumanMenu from "./components/humanMenu";
import TreeMenu from "./components/treeMenu";
import NumericInput from "react-numeric-input";
import {ExclamationCircleOutlined} from "@ant-design/icons";
import {PhotoshopPicker} from 'react-color';
import {CheckboxChangeEvent} from "antd/es/checkbox";
import PvModelMenu from "./components/pvModelMenu";

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
    requestUpdate: () => void;
    canvas?: HTMLCanvasElement;

    [key: string]: any;

}

const ContextMenu = ({
                         city,
                         requestUpdate,
                         canvas,
                         ...rest
                     }: ContextMenuProps) => {

    const setCommonStore = useStore(state => state.set);
    const world = useStore(state => state.world);
    const viewState = useStore(state => state.viewState);
    const updateElementById = useStore(state => state.updateElementById);
    const getElementById = useStore(state => state.getElementById);
    const clickObjectType = useStore(state => state.clickObjectType);
    const cutElementById = useStore(state => state.cutElementById);
    const countElementsByType = useStore(state => state.countElementsByType);
    const removeElementsByType = useStore(state => state.removeElementsByType);
    const countAllChildElementsByType = useStore(state => state.countAllChildElementsByType);
    const removeAllChildElementsByType = useStore(state => state.removeAllChildElementsByType);
    const copyElementById = useStore(state => state.copyElementById);
    const pasteElement = useStore(state => state.pasteElement);
    const getSelectedElement = useStore(state => state.getSelectedElement);
    const selectedElement = getSelectedElement();
    const [colorPickerVisible, setColorPickerVisible] = useState(true);

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

    const lockElement = (on: boolean) => {
        if (selectedElement) {
            updateElementById(selectedElement.id, {locked: on});
        }
    };

    const changeElementLabelText = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedElement) {
            updateElementById(selectedElement.id, {label: e.target.value});
        }
    };

    const showElementLabel = (e: CheckboxChangeEvent) => {
        if (selectedElement) {
            updateElementById(selectedElement.id, {showLabel: e.target.checked});
        }
    };

    const showTreeModel = (on: boolean) => {
        if (selectedElement && selectedElement.type === ObjectType.Tree) {
            updateElementById(selectedElement.id, {showModel: on});
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
            const sensorCountFoundation = selectedElement ? countAllChildElementsByType(selectedElement.id, ObjectType.Sensor) : 0;
            return (
                <StyledMenu>
                    <Menu.Item key={'foundation-copy'} onClick={copyElement} style={{paddingLeft: '40px'}}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'foundation-cut'} onClick={cutElement} style={{paddingLeft: '40px'}}>
                        Cut
                    </Menu.Item>
                    <Menu.Item key={'foundation-paste'} onClick={pasteElement} style={{paddingLeft: '40px'}}>
                        Paste
                    </Menu.Item>
                    <Menu.Item key={'foundation-lock'}>
                        <Checkbox checked={selectedElement?.locked} onChange={(e) => {
                            lockElement(e.target.checked);
                            requestUpdate();
                        }}>
                            Lock
                        </Checkbox>
                    </Menu.Item>
                    {sensorCountFoundation > 0 &&
                    <SubMenu key={'clear'} title={'Clear'} style={{paddingLeft: '24px'}}>
                        {sensorCountFoundation > 0 &&
                        <Menu.Item key={'remove-all-sensors'} onClick={() => {
                            Modal.confirm({
                                title: 'Do you really want to remove all the ' + sensorCountFoundation + ' sensors on this foundation?',
                                icon: <ExclamationCircleOutlined/>,
                                okText: 'OK',
                                cancelText: 'Cancel',
                                onOk: () => {
                                    if (selectedElement) {
                                        removeAllChildElementsByType(selectedElement.id, ObjectType.Sensor);
                                    }
                                }
                            });
                        }}>
                            Remove All {sensorCountFoundation} Sensors
                        </Menu.Item>
                        }
                    </SubMenu>
                    }
                    {selectedElement &&
                    <ReshapeElementMenu
                        elementId={selectedElement.id}
                        name={'foundation'}
                        requestUpdate={requestUpdate}
                        style={{paddingLeft: '24px'}}/>
                    }
                </StyledMenu>
            );
        case ObjectType.Sensor:
            return (
                <StyledMenu>
                    <Menu.Item key={'sensor-copy'} onClick={copyElement} style={{paddingLeft: '40px'}}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'sensor-cut'} onClick={cutElement} style={{paddingLeft: '40px'}}>
                        Cut
                    </Menu.Item>
                    <Menu.Item key={'sensor-label-text'} style={{paddingLeft: '40px'}}>
                        <Input addonBefore='Label:'
                               value={selectedElement ? selectedElement.label : 'Sensor'}
                               onChange={changeElementLabelText}
                        />
                    </Menu.Item>
                    <Menu.Item key={'sensor-show-label'}>
                        <Checkbox checked={!!selectedElement?.showLabel} onChange={showElementLabel}>
                            Keep Showing Label
                        </Checkbox>
                    </Menu.Item>
                </StyledMenu>
            );
        case ObjectType.SolarPanel:
            return (
                <StyledMenu>
                    <Menu.Item key={'solar-panel-copy'} onClick={copyElement} style={{paddingLeft: '40px'}}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'solar-panel-cut'} onClick={cutElement} style={{paddingLeft: '40px'}}>
                        Cut
                    </Menu.Item>
                    {selectedElement &&
                    <PvModelMenu key={'solar-panel-modules'}
                                 requestUpdate={requestUpdate}
                                 style={{paddingLeft: '24px'}}/>}
                    <Menu.Item key={'solar-panel-label-text'} style={{paddingLeft: '40px'}}>
                        <Input addonBefore='Label:'
                               value={selectedElement ? selectedElement.label : 'Solar Panel'}
                               onChange={changeElementLabelText}
                        />
                    </Menu.Item>
                    <Menu.Item key={'solar-panel-show-label'}>
                        <Checkbox checked={!!selectedElement?.showLabel} onChange={showElementLabel}>
                            Keep Showing Label
                        </Checkbox>
                    </Menu.Item>
                </StyledMenu>
            );
        case ObjectType.Cuboid:
            const sensorCountCuboid = selectedElement ? countAllChildElementsByType(selectedElement.id, ObjectType.Sensor) : 0;
            return (
                <StyledMenu>
                    <Menu.Item key={'cuboid-copy'} onClick={copyElement} style={{paddingLeft: '40px'}}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'cuboid-cut'} onClick={cutElement} style={{paddingLeft: '40px'}}>
                        Cut
                    </Menu.Item>
                    <Menu.Item key={'cuboid-paste'} onClick={pasteElement} style={{paddingLeft: '40px'}}>
                        Paste
                    </Menu.Item>
                    <Menu.Item key={'cuboid-lock'}>
                        <Checkbox checked={selectedElement?.locked} onChange={(e) => {
                            lockElement(e.target.checked);
                            requestUpdate();
                        }}>
                            Lock
                        </Checkbox>
                    </Menu.Item>
                    <SubMenu key={'color'} title={'Color'} style={{paddingLeft: '24px'}}
                             onTitleMouseEnter={() => setColorPickerVisible(true)}>
                        {colorPickerVisible &&
                        <PhotoshopPicker color={selectedElement?.color}
                                         onAccept={() => setColorPickerVisible(false)}
                                         onCancel={() => setColorPickerVisible(false)}
                        />}
                    </SubMenu>
                    {sensorCountCuboid > 0 &&
                    <SubMenu key={'clear'} title={'Clear'} style={{paddingLeft: '24px'}}>
                        {sensorCountCuboid > 0 &&
                        <Menu.Item key={'remove-all-sensors'} onClick={() => {
                            Modal.confirm({
                                title: 'Do you really want to remove all the ' + sensorCountCuboid + ' sensors on this cuboid?',
                                icon: <ExclamationCircleOutlined/>,
                                okText: 'OK',
                                cancelText: 'Cancel',
                                onOk: () => {
                                    if (selectedElement) {
                                        removeAllChildElementsByType(selectedElement.id, ObjectType.Sensor);
                                    }
                                }
                            });
                        }}>
                            Remove All {sensorCountCuboid} Sensors
                        </Menu.Item>
                        }
                    </SubMenu>
                    }
                    {selectedElement &&
                    <ReshapeElementMenu
                        elementId={selectedElement.id}
                        name={'cuboid'}
                        requestUpdate={requestUpdate}
                        style={{paddingLeft: '24px'}}/>
                    }
                </StyledMenu>
            );
        case ObjectType.Human:
            return (
                <StyledMenu>
                    <Menu.Item key={'human-copy'} onClick={copyElement} style={{paddingLeft: '40px'}}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'human-cut'} onClick={cutElement} style={{paddingLeft: '40px'}}>
                        Cut
                    </Menu.Item>
                    <Menu.Item key={'human-lock'}>
                        <Checkbox checked={selectedElement?.locked} onChange={(e) => {
                            lockElement(e.target.checked);
                            requestUpdate();
                        }}>
                            Lock
                        </Checkbox>
                    </Menu.Item>
                    {selectedElement &&
                    <HumanMenu key={'humans'} requestUpdate={requestUpdate} style={{paddingLeft: '24px'}}/>}
                </StyledMenu>
            );
        case ObjectType.Tree:
            return (
                <StyledMenu style={{padding: 0, margin: 0}}>
                    <Menu.Item key={'tree-copy'} onClick={copyElement} style={{paddingLeft: '40px'}}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'tree-cut'} onClick={cutElement} style={{paddingLeft: '40px'}}>
                        Cut
                    </Menu.Item>
                    <Menu.Item key={'tree-lock'}>
                        <Checkbox checked={selectedElement?.locked} onChange={(e) => {
                            lockElement(e.target.checked);
                            requestUpdate();
                        }}>
                            Lock
                        </Checkbox>
                    </Menu.Item>
                    <Menu.Item key={'tree-show-model'}>
                        <Checkbox checked={selectedElement?.showModel && selectedElement.type === ObjectType.Tree}
                                  onChange={(e) => {
                                      showTreeModel(e.target.checked);
                                      requestUpdate();
                                  }}>
                            Show Model
                        </Checkbox>
                    </Menu.Item>
                    {selectedElement &&
                    <ReshapeElementMenu elementId={selectedElement.id}
                                        name={'tree'}
                                        maxWidth={40}
                                        maxHeight={20}
                                        widthName={'Spread'}
                                        adjustLength={false}
                                        adjustAngle={false}
                                        requestUpdate={requestUpdate}
                                        style={{paddingLeft: '24px'}}/>
                    }
                    {selectedElement &&
                    <TreeMenu key={'trees'} requestUpdate={requestUpdate} style={{paddingLeft: '24px'}}/>}
                </StyledMenu>
            );
        default:
            const treeCount = countElementsByType(ObjectType.Tree);
            const humanCount = countElementsByType(ObjectType.Human);
            return (
                <StyledMenu>
                    <Menu.Item key={'ground-paste'} onClick={pasteElement}>
                        Paste
                    </Menu.Item>
                    {humanCount > 0 && <Menu.Item key={'ground-remove-all-humans'} onClick={() => {
                        Modal.confirm({
                            title: 'Do you really want to remove all ' + humanCount + ' people?',
                            icon: <ExclamationCircleOutlined/>,
                            okText: 'OK',
                            cancelText: 'Cancel',
                            onOk: () => {
                                removeElementsByType(ObjectType.Human);
                            }
                        });
                    }}>
                        Remove All {humanCount} People
                    </Menu.Item>}
                    {treeCount > 0 && <Menu.Item key={'ground-remove-all-trees'} onClick={() => {
                        Modal.confirm({
                            title: 'Do you really want to remove all ' + treeCount + ' trees?',
                            icon: <ExclamationCircleOutlined/>,
                            okText: 'OK',
                            cancelText: 'Cancel',
                            onOk: () => {
                                removeElementsByType(ObjectType.Tree);
                            }
                        });
                    }}>
                        Remove All {treeCount} Trees
                    </Menu.Item>}
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
                                          }
                                      }}
                        />
                    </Menu.Item>
                </StyledMenu>
            );
    }

};

export default React.memo(ContextMenu);
