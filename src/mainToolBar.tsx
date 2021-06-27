/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useState} from 'react';
import {useStore} from "./stores/common";
import {Button, Input, Modal, Space, Switch} from 'antd';
import 'antd/dist/antd.css';
import styled from "styled-components";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faUndoAlt, faRedoAlt, faSave, faDownload, faFolderOpen} from '@fortawesome/free-solid-svg-icons';
import {saveAs} from 'file-saver';

const LeftContainer = styled.div`
  position: fixed;
  top: 4px;
  left: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 9;
`;

const RightContainer = styled.div`
  position: absolute;
  top: 4px;
  right: 10px;
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9;
`;

export interface MainToolBarProps {
    orbitControls?: OrbitControls;
    requestUpdate: () => void;
}

const MainToolBar = ({orbitControls, requestUpdate}: MainToolBarProps) => {

    const setCommonStore = useStore(state => state.set);
    const viewState = useStore(state => state.viewState);
    const world = useStore(state => state.world);
    const elements = useStore(state => state.elements);

    const [downloadDialogVisible, setDownloadDialogVisible] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [fileName, setFileName] = useState<string>('aladdin.json');

    const signIn = () => {

    };

    const undo = () => {

    };

    const redo = () => {

    };

    const save = () => {

    };

    const writeLocalFile = () => {
        setConfirmLoading(true);
        const content = {world: world, elements: elements, view: viewState};
        const blob = new Blob([JSON.stringify(content)], {type: "application/json"});
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
                        });
                        requestUpdate();
                    }
                    fileDialog.value = '';
                };
            }
        }
        fileDialog.click();
    };

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
            <LeftContainer>
                <Space direction='horizontal'>
                    <div>
                        <span style={{paddingRight: '10px'}}>Spin</span>
                        <Switch title={'Spin view'}
                                checked={viewState.autoRotate}
                                onChange={(checked) => {
                                    setCommonStore((state) => {
                                        state.viewState.autoRotate = checked;
                                    });
                                    requestUpdate();
                                }}
                        />
                    </div>
                    <div>
                        <span style={{paddingRight: '10px', paddingLeft: '10px'}}>Heliodon</span>
                        <Switch title={'Show heliodon'}
                                checked={viewState.showHeliodonPanel}
                                onChange={(checked) => {
                                    setCommonStore((state) => {
                                        state.viewState.showHeliodonPanel = checked;
                                    });
                                    requestUpdate();
                                }}
                        />
                    </div>
                    <div>
                        <Button type="primary" title={'Reset view'} onClick={() => {
                            if (orbitControls) {
                                orbitControls.reset();
                            }
                        }}> Reset </Button>
                    </div>
                </Space>
            </LeftContainer>
            <RightContainer>
                <Space direction='horizontal'>
                    <div>
                        <FontAwesomeIcon title={'Undo'}
                                         icon={faUndoAlt}
                                         size={'3x'}
                                         color={'#666666'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={undo}/>
                        <FontAwesomeIcon title={'Redo'}
                                         icon={faRedoAlt}
                                         size={'3x'}
                                         color={'#666666'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={redo}/>
                        <FontAwesomeIcon title={'Save'}
                                         icon={faSave}
                                         size={'3x'}
                                         color={'#666666'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={save}/>
                        <FontAwesomeIcon title={'Download'}
                                         icon={faDownload}
                                         size={'3x'}
                                         color={'#666666'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={() => {
                                             setDownloadDialogVisible(true);
                                         }}/>
                        <FontAwesomeIcon title={'Open local file'}
                                         icon={faFolderOpen}
                                         size={'3x'}
                                         color={'#666666'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={readLocalFile}/>
                    </div>
                    <div>
                        <Button type="primary" title={'Sign In'} onClick={signIn}>Sign in</Button>
                    </div>
                </Space>
            </RightContainer>
        </>
    );
};

export default MainToolBar;
