/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import {useStore} from "./stores/common";
import styled from 'styled-components';
import {Space, Switch} from "antd";
import 'antd/dist/antd.css';

const Container = styled.div`
  position: fixed;
  top: 10px;
  left: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 9;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  left: 0;
  top: 0;
  width: 640px;
  padding: 0;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  border-radius: 10px 10px 0 0;
  width: 100%;
  height: 24px;
  padding: 10px;
  background-color: #e8e8e8;
  color: #888;
  display: flex;
  justify-content: space-between;
  align-items: center;

  svg.icon {
    height: 16px;
    width: 16px;
    padding: 8px;
    fill: #666;
  }
`;

export interface SceneSettingsPanelProps {
    grid: boolean;
    toggleGrid?: (on: boolean) => void;
}

const SceneSettingsPanel = ({
                                grid,
                                toggleGrid,
                            }: SceneSettingsPanelProps) => {

    const set = useStore(state => state.set);

    return (
        <Container>
            <ColumnWrapper>
                <Header>
                    <span>Scene Settings</span>
                    <span style={{cursor: 'pointer'}} onClick={() => {
                        set((state) => {
                            state.showSceneSettings = false;
                        });
                    }}>Close</span>
                </Header>
                <Space style={{padding: '20px'}} align={'baseline'} size={20}>
                    <div>
                        Grid<br/>
                        <Switch checked={grid} onChange={(checked) => {
                            toggleGrid?.(checked);
                        }}/>
                    </div>
                </Space>
            </ColumnWrapper>
        </Container>
    );
};

export default SceneSettingsPanel;
