/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useState} from 'react';
import {useStore} from "./stores/common";
import styled from 'styled-components';
import {Checkbox, Dropdown, Input, InputNumber, Menu, Modal, Select, Space} from 'antd';
import logo from './assets/magic-lamp.png';
import 'antd/dist/antd.css';
import {saveAs} from "file-saver";
import About from "./about";
import {saveImage} from "./helpers";
import {Discretization} from "./types";

const {SubMenu} = Menu;
const {Option} = Select;

const StyledImage = styled.img`
  position: absolute;
  top: 10px;
  left: 10px;
  height: 40px;
  transition: 0.5s;
  opacity: 1;
  cursor: pointer;

  &:hover {
    opacity: 0.5;
  }
`;

export interface MainMenuProps {

    collectDailyLightSensorData: () => void;
    collectYearlyLightSensorData: () => void;
    setPvDailyIndividualOutputs: (b: boolean) => void;
    analyzePvDailyYield: () => void;
    setPvYearlyIndividualOutputs: (b: boolean) => void;
    analyzePvYearlyYield: () => void;
    canvas?: HTMLCanvasElement;

    [key: string]: any;

}

const MainMenu = ({
                      collectDailyLightSensorData,
                      collectYearlyLightSensorData,
                      setPvDailyIndividualOutputs,
                      analyzePvDailyYield,
                      setPvYearlyIndividualOutputs,
                      analyzePvYearlyYield,
                      canvas,
                      ...rest
                  }: MainMenuProps) => {

    const setCommonStore = useStore(state => state.set);
    const timesPerHour = useStore(state => state.world.timesPerHour);
    const discretization = useStore(state => state.world.discretization);
    const solarPanelGridCellSize = useStore(state => state.world.solarPanelGridCellSize);
    const showInfoPanel = useStore(state => state.viewState.showInfoPanel);
    const showMapPanel = useStore(state => state.viewState.showMapPanel);
    const showWeatherPanel = useStore(state => state.viewState.showWeatherPanel);
    const showStickyNotePanel = useStore(state => state.viewState.showStickyNotePanel);
    const exportContent = useStore(state => state.exportContent);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [fileName, setFileName] = useState<string>('aladdin.json');
    const [downloadDialogVisible, setDownloadDialogVisible] = useState(false);
    const [aboutUs, setAboutUs] = useState(false);

    const openAboutUs = (on: boolean) => {
        setAboutUs(on);
    };

    const gotoAboutPage = () => {
        openAboutUs(true);
    };

    const takeScreenshot = () => {
        if (canvas) { // TODO
            saveImage("screenshot.png", canvas.toDataURL("image/png"));
        }
    };

    const showDownloadDialog = () => {
        setDownloadDialogVisible(true);
    };

    const writeLocalFile = () => {
        setConfirmLoading(true);
        const blob = new Blob([JSON.stringify(exportContent())], {type: "application/json"});
        saveAs(blob, fileName);
        setConfirmLoading(false);
        setDownloadDialogVisible(false);
    };

    const readLocalFile = () => {
        const fileDialog = document.getElementById('file-dialog') as HTMLInputElement;
        fileDialog.onchange = (e) => {
            if (fileDialog.files && fileDialog.files.length > 0) {
                let reader = new FileReader();
                reader.readAsText(fileDialog.files[0]);
                setFileName(fileDialog.files[0].name);
                reader.onload = (e) => {
                    if (reader.result) {
                        const input = JSON.parse(reader.result.toString());
                        setCommonStore((state) => {
                            state.world = input.world;
                            state.viewState = input.view;
                            state.elements = input.elements;
                            state.notes = input.notes ?? [];
                        });
                    }
                    fileDialog.value = '';
                };
            }
        }
        fileDialog.click();
    };

    const menu = (
        <Menu>
            <SubMenu key={'file'} title={'File'}>
                <Menu.Item key="open-local-file" onClick={readLocalFile}>
                    Open Local File
                </Menu.Item>
                <Menu.Item key="save-local-file" onClick={showDownloadDialog}>
                    Save to Download Folder
                </Menu.Item>
                <Menu.Item key="screenshot" onClick={takeScreenshot}>
                    Take Screenshot
                </Menu.Item>
            </SubMenu>
            <SubMenu key={'view'} title={'View'}>
                <Menu.Item key={'info-panel-check-box'}>
                    <Checkbox checked={showInfoPanel} onChange={(e) => {
                        setCommonStore((state) => {
                            state.viewState.showInfoPanel = e.target.checked;
                        });
                    }}>
                        Site Information
                    </Checkbox>
                </Menu.Item>
                <Menu.Item key={'map-panel-check-box'}>
                    <Checkbox checked={showMapPanel} onChange={(e) => {
                        setCommonStore((state) => {
                            state.viewState.showMapPanel = e.target.checked;
                        });
                    }}>
                        Map
                    </Checkbox>
                </Menu.Item>
                <Menu.Item key={'weather-panel-check-box'}>
                    <Checkbox checked={showWeatherPanel} onChange={(e) => {
                        setCommonStore((state) => {
                            state.viewState.showWeatherPanel = e.target.checked;
                        });
                    }}>
                        Weather Data
                    </Checkbox>
                </Menu.Item>
                <Menu.Item key={'sticky-note-panel-check-box'}>
                    <Checkbox checked={showStickyNotePanel} onChange={(e) => {
                        setCommonStore((state) => {
                            state.viewState.showStickyNotePanel = e.target.checked;
                        });
                    }}>
                        Sticky Note
                    </Checkbox>
                </Menu.Item>
            </SubMenu>
            <SubMenu key={'sensors'} title={'Sensors'}>
                <Menu.Item key={'sensor-collect-daily-data'} onClick={collectDailyLightSensorData}>
                    Collect Daily Data
                </Menu.Item>
                <Menu.Item key={'sensor-collect-yearly-data'} onClick={collectYearlyLightSensorData}>
                    Collect Yearly Data
                </Menu.Item>
                <SubMenu key={'sensor-simulation-options'} title={'Options'}>
                    <Menu>
                        <Menu.Item key={'sensor-simulation-sampling-frequency'}>
                            <Space style={{width: '150px'}}>Sampling Frequency: </Space>
                            <InputNumber min={1}
                                         max={60}
                                         step={1}
                                         style={{width: 60}}
                                         precision={0}
                                         value={timesPerHour}
                                         formatter={(a) => Number(a).toFixed(0)}
                                         onChange={(value) => {
                                             setCommonStore((state) => {
                                                 state.world.timesPerHour = value;
                                             });
                                         }}
                            />
                            <Space style={{paddingLeft: '10px'}}>Times per Hour</Space>
                        </Menu.Item>
                    </Menu>
                </SubMenu>
            </SubMenu>
            <SubMenu key={'solar-panels'} title={'Solar Panels'}>
                <Menu.Item key={'solar-panel-daily-yield'} onClick={() => {
                    setPvDailyIndividualOutputs(false);
                    analyzePvDailyYield();
                }}>
                    Analyze Daily Yield
                </Menu.Item>
                <Menu.Item key={'solar-panel-yearly-yield'} onClick={() => {
                    setPvYearlyIndividualOutputs(false);
                    analyzePvYearlyYield();
                }}>
                    Analyze Yearly Yield
                </Menu.Item>
                <SubMenu key={'solar-panel-simulation-options'} title={'Options'}>
                    <Menu>
                        <Menu.Item key={'solar-panel-simulation-sampling-frequency'}>
                            <Space style={{width: '150px'}}>Sampling Frequency: </Space>
                            <InputNumber min={1}
                                         max={60}
                                         step={1}
                                         style={{width: 60}}
                                         precision={0}
                                         value={timesPerHour}
                                         formatter={(a) => Number(a).toFixed(0)}
                                         onChange={(value) => {
                                             setCommonStore((state) => {
                                                 state.world.timesPerHour = value;
                                             });
                                         }}
                            />
                            <Space style={{paddingLeft: '10px'}}>Times per Hour</Space>
                        </Menu.Item>
                        <Menu.Item key={'solar-panel-discretization'}>
                            <Space style={{width: '150px'}}>Panel Discretization: </Space>
                            <Select style={{width: '165px'}}
                                    value={discretization ?? Discretization.EXACT}
                                    onChange={(value) => {
                                        setCommonStore(state => {
                                            state.world.discretization = value;
                                        });
                                    }}
                            >
                                <Option key={Discretization.EXACT} value={Discretization.EXACT}>
                                    {Discretization.EXACT}
                                </Option>)
                                <Option key={Discretization.APPROXIMATE} value={Discretization.APPROXIMATE}>
                                    {Discretization.APPROXIMATE}
                                </Option>)
                            </Select>
                        </Menu.Item>
                        {discretization === Discretization.APPROXIMATE &&
                        <Menu.Item key={'solar-panel-simulation-grid-cell-size'}>
                            <Space style={{width: '150px'}}>Grid Cell Size: </Space>
                            <InputNumber min={0.1}
                                         max={5}
                                         step={0.1}
                                         style={{width: 60}}
                                         precision={1}
                                         value={solarPanelGridCellSize ?? 0.5}
                                         formatter={(a) => Number(a).toFixed(1)}
                                         onChange={(value) => {
                                             setCommonStore((state) => {
                                                 state.world.solarPanelGridCellSize = value;
                                             });
                                         }}
                            />
                            <Space style={{paddingLeft: '10px'}}>m</Space>
                        </Menu.Item>
                        }
                    </Menu>
                </SubMenu>
            </SubMenu>
            <Menu.Item key="about" onClick={gotoAboutPage}>
                About Us
            </Menu.Item>
        </Menu>
    );

    return (
        <>
            <Modal
                title="Download as"
                visible={downloadDialogVisible}
                onOk={writeLocalFile}
                confirmLoading={confirmLoading}
                onCancel={() => {
                    setDownloadDialogVisible(false);
                }}
            >
                <Input
                    placeholder="File name"
                    value={fileName}
                    onPressEnter={writeLocalFile}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setFileName(e.target.value);
                    }}/>
            </Modal>
            <Dropdown overlay={menu} trigger={['click']}>
                <StyledImage src={logo} title={'Click to open menu'}/>
            </Dropdown>
            {aboutUs && <About openAboutUs={openAboutUs}/>}
        </>
    );
};

export default React.memo(MainMenu);
