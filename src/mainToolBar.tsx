/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import {useStore} from "./stores/common";
import {Button, Space, Switch} from 'antd';
import 'antd/dist/antd.css';
import styled from "styled-components";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

const Container = styled.div`
  position: fixed;
  top: 4px;
  left: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 9;
`;

export interface MainToolBarProps {
    orbitControls?: OrbitControls;
}

const MainToolBar = ({orbitControls}: MainToolBarProps) => {

    const setCommonStore = useStore(state => state.set);
    const autoRotate = useStore(state => state.autoRotate);
    const heliodon = useStore(state => state.showHeliodonPanel);

    return (
        <Container>
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
        </Container>
    );
};

export default MainToolBar;
