/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import {useStore} from "./stores/common";
import {Button, Space, Switch} from 'antd';
import 'antd/dist/antd.css';
import styled from "styled-components";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faUndoAlt} from '@fortawesome/free-solid-svg-icons';
import {faRedoAlt} from '@fortawesome/free-solid-svg-icons';
import {faSave} from '@fortawesome/free-solid-svg-icons';

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
}

const MainToolBar = ({orbitControls}: MainToolBarProps) => {

    const setCommonStore = useStore(state => state.set);
    const autoRotate = useStore(state => state.autoRotate);
    const heliodon = useStore(state => state.showHeliodonPanel);

    const signIn = () => {

    };

    const undo = () => {

    };

    const redo = () => {

    };

    const save = () => {

    };

    return (
        <>
            <LeftContainer>
                <Space direction='horizontal'>
                    <div>
                        <span style={{paddingRight: '10px'}}>Spin</span>
                        <Switch title={'Spin view'} checked={autoRotate} onChange={(checked) => {
                            setCommonStore((state) => {
                                state.autoRotate = checked;
                            });
                        }}/>
                    </div>
                    <div>
                        <span style={{paddingRight: '10px', paddingLeft: '10px'}}>Heliodon</span>
                        <Switch title={'Show heliodon'} checked={heliodon} onChange={(checked) => {
                            setCommonStore((state) => {
                                state.showHeliodonPanel = checked;
                            });
                        }}/>
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
                                         color={'#1E90FF'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={undo}/>
                        <FontAwesomeIcon title={'Redo'}
                                         icon={faRedoAlt}
                                         size={'3x'}
                                         color={'#1E90FF'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={redo}/>
                        <FontAwesomeIcon title={'Save'}
                                         icon={faSave}
                                         size={'3x'}
                                         color={'#1E90FF'}
                                         style={{paddingRight: '12px', cursor: 'pointer'}}
                                         onClick={save}/>
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
