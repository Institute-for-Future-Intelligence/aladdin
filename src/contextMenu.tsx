/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useState} from 'react';
import styled from "styled-components";
import 'antd/dist/antd.css';
import {useStore} from "./stores/common";
import {Checkbox, Dropdown, Input, Menu, Modal, Radio, Select, Space} from 'antd';
import {ObjectType, Orientation, Theme, TrackerType} from "./types";
import ReshapeElementMenu from "./components/reshapeElementMenu";
import HumanSelection from "./components/humanSelection";
import TreeSelection from "./components/treeSelection";
import NumericInput from "react-numeric-input";
import {ExclamationCircleOutlined} from "@ant-design/icons";
import {PhotoshopPicker} from 'react-color';
import {CheckboxChangeEvent} from "antd/es/checkbox";
import {Util} from "./Util";
import {SolarPanelModel} from "./models/SolarPanelModel";

// TODO: Reduce the space between menu items
const StyledMenu = styled(Menu)`
  padding: 0;
  margin: 0;
  tab-index: 0;
`;

const {SubMenu} = StyledMenu;
const {Option} = Select;

const radioStyle = {
    display: 'block',
    height: '30px',
    paddingLeft: '10px',
    lineHeight: '30px',
};

export interface ContextMenuProps {

    city: string | null;
    canvas?: HTMLCanvasElement;
    setPvDialogVisible: (visible: boolean) => void;
    requestUpdate: () => void;

    [key: string]: any;

}

const ContextMenu = ({
                         city,
                         canvas,
                         setPvDialogVisible,
                         requestUpdate,
                         ...rest
                     }: ContextMenuProps) => {

    const setCommonStore = useStore(state => state.set);
    const world = useStore(state => state.world);
    const viewState = useStore(state => state.viewState);
    const updateElementById = useStore(state => state.updateElementById);
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
            const solarPanelCountFoundation = selectedElement ? countAllChildElementsByType(selectedElement.id, ObjectType.SolarPanel) : 0;
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
                    {(sensorCountFoundation > 0 || solarPanelCountFoundation > 0) &&
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
                        {solarPanelCountFoundation > 0 &&
                        <Menu.Item key={'remove-all-solar-panels'} onClick={() => {
                            Modal.confirm({
                                title: 'Do you really want to remove all the ' + solarPanelCountFoundation + ' solar panels on this foundation?',
                                icon: <ExclamationCircleOutlined/>,
                                okText: 'OK',
                                cancelText: 'Cancel',
                                onOk: () => {
                                    if (selectedElement) {
                                        removeAllChildElementsByType(selectedElement.id, ObjectType.SolarPanel);
                                    }
                                }
                            });
                        }}>
                            Remove All {solarPanelCountFoundation} Solar Panels
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
                    <Menu>
                        <Menu.Item key={'sensor-label-text'} style={{paddingLeft: '40px'}}>
                            <Input addonBefore='Label:'
                                value={selectedElement ? selectedElement.label : 'Sensor'}
                                onChange={changeElementLabelText}
                            />
                        </Menu.Item>
                    </Menu>
                    <Menu.Item key={'sensor-show-label'}>
                        <Checkbox checked={!!selectedElement?.showLabel} onChange={showElementLabel}>
                            Keep Showing Label
                        </Checkbox>
                    </Menu.Item>
                </StyledMenu>
            );
        case ObjectType.SolarPanel:
            const solarPanel = selectedElement as SolarPanelModel;
            return (
                <StyledMenu>
                    <Menu.Item key={'solar-panel-copy'} onClick={copyElement} style={{paddingLeft: '40px'}}>
                        Copy
                    </Menu.Item>
                    <Menu.Item key={'solar-panel-cut'} onClick={cutElement} style={{paddingLeft: '40px'}}>
                        Cut
                    </Menu.Item>

                    <Menu.Item key={'solar-panel-change'}
                        onClick={() => {
                            setPvDialogVisible(true);
                            requestUpdate();
                        }}
                        style={{paddingLeft: '40px'}}>
                        Select a PV Model...
                    </Menu.Item>
                    <Menu>
                        <Menu.Item key={'solar-panel-orientation'} style={{paddingLeft: '40px'}}>
                            <Space style={{width: '150px'}}>Orientation: </Space>
                            <Select style={{width: '120px'}}
                                    value={solarPanel.orientation}
                                    onChange={(value) => {
                                        if (solarPanel) {
                                            updateElementById(solarPanel.id, {orientation: value});
                                            requestUpdate();
                                        }
                                    }}
                            >
                                <Option key={'Portrait'} value={Orientation.portrait}>Portrait</Option>)
                                <Option key={'Landscape'} value={Orientation.landscape}>Landscape</Option>)
                            </Select>
                        </Menu.Item>
                        <Menu.Item key={'solar-panel-tilt-angle'} style={{paddingLeft: '40px'}}>
                            <Space style={{width: '150px'}}>Tilt Angle: </Space>
                            <NumericInput min={-90}
                                        max={90}
                                        style={{
                                            input: {
                                                width: '120px'
                                            }
                                        }}
                                        precision={1}
                                        value={Util.toDegrees(solarPanel.tiltAngle)}
                                        size={5}
                                        format={(a) => a + '°'}
                                        onChange={(e) => {
                                            if (solarPanel) {
                                                updateElementById(solarPanel.id, {tiltAngle: Util.toRadians(e ?? 0)});
                                                requestUpdate();
                                            }
                                        }}
                            />
                        </Menu.Item>
                        <Menu.Item key={'solar-panel-relative-azimuth'} style={{paddingLeft: '40px'}}>
                            <Space style={{width: '150px'}}>Relative Azimuth: </Space>
                            <NumericInput min={0}
                                        max={360}
                                        style={{
                                            input: {
                                                width: '120px'
                                            }
                                        }}
                                        precision={1}
                                        value={Util.toDegrees(solarPanel.relativeAzimuth)}
                                        size={5}
                                        format={(a) => a + '°'}
                                        onChange={(e) => {
                                            if (solarPanel) {
                                                updateElementById(solarPanel.id, {relativeAzimuth: Util.toRadians(e ?? 0)});
                                                requestUpdate();
                                            }
                                        }}
                            />
                        </Menu.Item>
                        <Menu.Item key={'solar-panel-tracker'} style={{paddingLeft: '40px'}}>
                            <Space style={{width: '150px'}}>Tracker: </Space>
                            <Select style={{width: '120px'}}
                                    value={solarPanel.trackerType}
                                    onChange={(value) => {
                                        if (solarPanel) {
                                            updateElementById(solarPanel.id, {trackerType: value});
                                            requestUpdate();
                                        }
                                    }}
                            >
                                <Option key={'NONE'}
                                        value={TrackerType.NO_TRACKER}
                                        title={'No tracker'}>
                                    None
                                </Option>)
                                <Option key={'HSAT'}
                                        value={TrackerType.HORIZONTAL_SINGLE_AXIS_TRACKER}
                                        title={'Horizontal single axis tracker'}>
                                    HSAT
                                </Option>)
                                <Option key={'VSAT'}
                                        value={TrackerType.VERTICAL_SINGLE_AXIS_TRACKER}
                                        title={'Vertical single axis tracker'}>
                                    VSAT
                                </Option>)
                                <Option key={'TSAT'}
                                        value={TrackerType.TILTED_SINGLE_AXIS_TRACKER}
                                        title={'Tilted single axis tracker'}>
                                    TSAT
                                </Option>)
                                <Option key={'AADAT'}
                                        value={TrackerType.ALTAZIMUTH_DUAL_AXIS_TRACKER}
                                        title={'Altazimuth single axis tracker'}>
                                    AADAT
                                </Option>)
                            </Select>
                        </Menu.Item>
                        <Menu.Item key={'solar-panel-pole-height'} style={{paddingLeft: '40px'}}>
                            <Space style={{width: '150px'}}>Pole Height: </Space>
                            <NumericInput min={0}
                                        max={5}
                                        style={{
                                            input: {
                                                width: '120px'
                                            }
                                        }}
                                        step={0.1}
                                        precision={1}
                                        value={solarPanel.poleHeight}
                                        size={5}
                                        format={(a) => a + ' m'}
                                        onChange={(e) => {
                                            if (solarPanel) {
                                                updateElementById(solarPanel.id, {poleHeight: e});
                                                requestUpdate();
                                            }
                                        }}
                            />
                        </Menu.Item>
                        <Menu.Item key={'solar-panel-draw-sun-beam'}>
                            <Checkbox checked={!!solarPanel?.drawSunBeam}
                                    onChange={(e) => {
                                        if (solarPanel) {
                                            updateElementById(solarPanel.id, {drawSunBeam: e.target.checked});
                                            requestUpdate();
                                        }
                                    }}>
                                Draw Sun Beam
                            </Checkbox>
                        </Menu.Item>
                        <Menu.Item key={'solar-panel-show-label'}>
                            <Checkbox checked={!!selectedElement?.showLabel} onChange={showElementLabel}>
                                Keep Showing Label
                            </Checkbox>
                        </Menu.Item>
                        <Menu.Item key={'solar-panel-label-text'} style={{paddingLeft: '40px'}}>
                            <Input addonBefore='Label:'
                                value={selectedElement ? selectedElement.label : 'Solar Panel'}
                                onChange={changeElementLabelText}
                            />
                        </Menu.Item>
                    </Menu>
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
                    <Menu>
                        <Menu.Item key={'human-change-person'} style={{paddingLeft: '40px'}}>
                            <Space style={{width: '120px'}}>Change Person: </Space>
                            <HumanSelection key={'trees'} requestUpdate={requestUpdate}/>
                        </Menu.Item>
                    </Menu>
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
                    <Menu>
                        <Menu.Item key={'tree-change-type'} style={{paddingLeft: '40px'}}>
                            <Space style={{width: '60px'}}>Type: </Space>
                            <TreeSelection key={'trees'} requestUpdate={requestUpdate}/>
                        </Menu.Item>
                    </Menu>
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
                    <Menu>
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
                    </Menu>
                </StyledMenu>
            );
    }

};

const DropdownContextMenu: React.FC<ContextMenuProps> = ({
    children,
    city,
    canvas,
    setPvDialogVisible,
    requestUpdate,
    ...rest
}) => {

    return (
        <Dropdown key={'canvas-context-menu'}
            trigger={['contextMenu']}
            overlay={ContextMenu({city, canvas, setPvDialogVisible, requestUpdate})}>
                {children}
        </Dropdown>
    )
}

export default React.memo(DropdownContextMenu);
