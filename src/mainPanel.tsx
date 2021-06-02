/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useState} from 'react';
import styled from 'styled-components';
import {ReactComponent as MenuIcon} from './assets/menu.svg';
import {Switch, Slider} from "antd";
import 'antd/dist/antd.css';

const Container = styled.div`
  position: fixed;
  top: 10px;
  left: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 9999;

  svg.icon {
    height: 36px;
    width: 36px;
    fill: #fff;
    cursor: pointer;
  }
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  left: 0;
  top: 0;
  width: 600px;
  height: 200px;
  padding: 0px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
`;

const RowWrapper = styled.div`
  background-color: #f8f8f8;
  position: relative;
  padding: 10px;
  display: flex;
  flex-direction: row;
`;

const Header = styled.div`
  border-radius: 10px 10px 0 0;
  width: 100%;
  height: 24px;
  padding: 10px;
  background-color: #e8e8e8;
  color: #fff;
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

export interface MainPanelProps {
    heliodon: boolean;
    latitude: number;
    date: Date;
    toggleHeliodon?: (on: boolean) => void;
    changeLatitude?: (latitude: number) => void;
    changeDate?: (date: Date) => void;
}

const MainPanel = ({
                       heliodon,
                       latitude,
                       date,
                       toggleHeliodon,
                       changeLatitude,
                       changeDate,
                   }: MainPanelProps) => {

    const [shown, setShown] = useState<boolean>(false);

    return (
        <Container
            onClick={e => {
                e.stopPropagation();
                if (!shown) setShown(true);
            }}
        >
            <MenuIcon/>
            {shown && (
                <ColumnWrapper>
                    <Header>
                        <span>&nbsp;</span>
                        <span style={{cursor: 'pointer'}} onClick={() => {
                            setShown(false);
                        }}>Close</span>
                    </Header>
                    <RowWrapper>
                        <div>
                            Heliodon:<br/><Switch checked={heliodon} onChange={(selected) => {
                            toggleHeliodon?.(selected);
                        }}/>
                        </div>
                        <div>
                            Latitude: <Slider
                            style={{width: '150px'}}
                            min={-90}
                            max={90}
                            tooltipVisible={false}
                            defaultValue={latitude}
                            onChange={(value: number) => {
                                changeLatitude?.(value);
                            }}
                        />
                        </div>
                    </RowWrapper>
                </ColumnWrapper>
            )}
        </Container>
    );
};

export default MainPanel;
