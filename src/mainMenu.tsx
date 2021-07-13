/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useState} from 'react';
import {useStore} from "./stores/common";
import styled from 'styled-components';
import {Menu, Dropdown, Checkbox, Modal, Input} from 'antd';
import logo from './assets/magic-lamp.png';
import 'antd/dist/antd.css';
import {saveAs} from "file-saver";
import About from "./about";
import {saveImage} from "./helpers";

const {SubMenu} = Menu;

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
    analyzePvDailyYield: () => void;
    analyzePvYearlyYield: () => void;

    canvas?: HTMLCanvasElement;
    requestUpdate: () => void;

    [key: string]: any;

}

const MainMenu = ({
                      collectDailyLightSensorData,
                      collectYearlyLightSensorData,
                      analyzePvDailyYield,
                      analyzePvYearlyYield,
                      canvas,
                      requestUpdate,
                      ...rest
                  }: MainMenuProps) => {

    const setCommonStore = useStore(state => state.set);
    const viewState = useStore(state => state.viewState);
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
                        requestUpdate();
                    }
                    fileDialog.value = '';
                };
            }
        }
        fileDialog.click();
    };

    const menu = (
        <Menu>
            <Menu.Item key="open-local-file" onClick={readLocalFile} style={{paddingLeft: '36px'}}>
                Open Local File
            </Menu.Item>
            <Menu.Item key="save-local-file" onClick={showDownloadDialog} style={{paddingLeft: '36px'}}>
                Save to Download Folder
            </Menu.Item>
            <Menu.Item key={'info-panel-check-box'}>
                <Checkbox checked={viewState.showInfoPanel} onChange={(e) => {
                    setCommonStore((state) => {
                        state.viewState.showInfoPanel = e.target.checked;
                    });
                    requestUpdate();
                }}>
                    Information Panel
                </Checkbox>
            </Menu.Item>
            <Menu.Item key={'ground-panel-check-box'}>
                <Checkbox checked={viewState.showGroundPanel} onChange={(e) => {
                    setCommonStore((state) => {
                        state.viewState.showGroundPanel = e.target.checked;
                    });
                    requestUpdate();
                }}>
                    Ground Settings
                </Checkbox>
            </Menu.Item>
            <Menu.Item key={'weather-panel-check-box'}>
                <Checkbox checked={viewState.showWeatherPanel} onChange={(e) => {
                    setCommonStore((state) => {
                        state.viewState.showWeatherPanel = e.target.checked;
                    });
                    requestUpdate();
                }}>
                    Weather Data
                </Checkbox>
            </Menu.Item>
            <Menu.Item key={'sticky-note-panel-check-box'}>
                <Checkbox checked={viewState.showStickyNotePanel} onChange={(e) => {
                    setCommonStore((state) => {
                        state.viewState.showStickyNotePanel = e.target.checked;
                    });
                    requestUpdate();
                }}>
                    Sticky Note
                </Checkbox>
            </Menu.Item>
            <SubMenu key={'sensors'} title={'Sensors'} style={{paddingLeft: '24px'}}>
                <Menu.Item key={'sensor-collect-daily-data'} onClick={collectDailyLightSensorData}>
                    Collect Daily Data
                </Menu.Item>
                <Menu.Item key={'sensor-collect-yearly-data'} onClick={collectYearlyLightSensorData}>
                    Collect Yearly Data
                </Menu.Item>
            </SubMenu>
            <SubMenu key={'solar-panels'} title={'Solar Panels'} style={{paddingLeft: '24px'}}>
                <Menu.Item key={'solar-panel-daily-yield'} onClick={analyzePvDailyYield}>
                    Analyze Daily Yield
                </Menu.Item>
                <Menu.Item key={'solar-panel-yearly-yield'} onClick={analyzePvYearlyYield}>
                    Analyze Yearly Yield
                </Menu.Item>
            </SubMenu>
            <Menu.Item key="screenshot" onClick={takeScreenshot} style={{paddingLeft: '36px'}}>
                Take Screenshot
            </Menu.Item>
            <Menu.Item key="about" onClick={gotoAboutPage} style={{paddingLeft: '36px'}}>
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
