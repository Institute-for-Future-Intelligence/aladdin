/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect, useRef, useState} from 'react';
import LineGraph from '../components/lineGraph';
import styled from "styled-components";
import {useStore} from "../stores/common";
import {GraphDataType} from "../types";
import moment from "moment";
import ReactDraggable, {DraggableEventHandler} from 'react-draggable';
import {Button, Space, Switch} from "antd";
import {screenshot} from "../helpers";
import {ReloadOutlined, SaveOutlined} from '@ant-design/icons';

const Container = styled.div`
  position: fixed;
  top: 80px;
  right: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 9;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  right: 0;
  top: 0;
  width: 600px;
  height: 400px;
  padding-bottom: 10px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
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
  cursor: move;

  svg.icon {
    height: 16px;
    width: 16px;
    padding: 8px;
    fill: #666;
  }
`;

export interface DailyPvYieldPanelProps {

    city: string | null;
    requestUpdate: () => void;
    individualOutputs: boolean;
    setIndividualOutputs: (b: boolean) => void;
    analyzeDailyPvYield: () => void;

    [key: string]: any;

}

const DailyPvYieldPanel = ({
                               city,
                               requestUpdate,
                               individualOutputs = false,
                               setIndividualOutputs,
                               analyzeDailyPvYield,
                               ...rest
                           }: DailyPvYieldPanelProps) => {

    const setCommonStore = useStore(state => state.set);
    const viewState = useStore(state => state.viewState);
    const dailyYield = useStore(state => state.dailyPvYield);
    const solarPanelLabels = useStore(state => state.solarPanelLabels);
    const now = new Date(useStore(state => state.world.date));
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 640;
    const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 500;
    const [curPosition, setCurPosition] = useState({
        x: isNaN(viewState.dailyPvYieldPanelX) ? 0 : Math.max(viewState.dailyPvYieldPanelX, wOffset - window.innerWidth),
        y: isNaN(viewState.dailyPvYieldPanelY) ? 0 : Math.min(viewState.dailyPvYieldPanelY, window.innerHeight - hOffset)
    });
    const [sum, setSum] = useState(0);

    const responsiveHeight = 100;

    useEffect(() => {
        let s = 0;
        for (const datum of dailyYield) {
            s += datum['Total'] as number;
        }
        setSum(s);
    }, [dailyYield]);

    // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
    useEffect(() => {
        const handleResize = () => {
            setCurPosition({
                x: Math.max(viewState.dailyPvYieldPanelX, wOffset - window.innerWidth),
                y: Math.min(viewState.dailyPvYieldPanelY, window.innerHeight - hOffset)
            });
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        }
    }, []);

    const onDrag: DraggableEventHandler = (e, ui) => {
        setCurPosition({
            x: Math.max(ui.x, wOffset - window.innerWidth),
            y: Math.min(ui.y, window.innerHeight - hOffset)
        });
    };

    const onDragEnd: DraggableEventHandler = (e, ui) => {
        setCommonStore(state => {
            state.viewState.dailyPvYieldPanelX = Math.max(ui.x, wOffset - window.innerWidth);
            state.viewState.dailyPvYieldPanelY = Math.min(ui.y, window.innerHeight - hOffset);
        });
    };

    const closePanel = () => {
        setCommonStore((state) => {
            state.viewState.showDailyPvYieldPanel = false;
        });
        requestUpdate();
    };

    const labelX = 'Hour';
    const labelY = 'Yield per Hour';

    return (
        <ReactDraggable
            handle={'.handle'}
            bounds={'parent'}
            axis='both'
            position={curPosition}
            onDrag={onDrag}
            onStop={onDragEnd}
        >
            <Container>
                <ColumnWrapper ref={wrapperRef}>
                    <Header className='handle'>
                        <span>Solar Panel Daily Yield: Weather Data from {city} | {moment(now).format('MM/DD')}</span>
                        <span style={{cursor: 'pointer'}}
                              onTouchStart={() => {
                                  closePanel();
                              }}
                              onMouseDown={() => {
                                  closePanel();
                              }}>
                            Close
                        </span>
                    </Header>
                    <LineGraph
                        type={GraphDataType.DailyPvYield}
                        dataSource={dailyYield}
                        labels={solarPanelLabels}
                        height={responsiveHeight}
                        labelX={labelX}
                        labelY={labelY}
                        unitY={'kWh'}
                        yMin={0}
                        curveType={'linear'}
                        fractionDigits={2}
                        symbolCount={24}
                        referenceX={now.getHours()}
                        {...rest}
                    />
                    <Space style={{alignSelf: 'center'}}>
                        <Space>Daily Total: {sum.toFixed(2)} kWh</Space>
                        <Switch title={'Show outputs of individual solar panels'}
                                checked={individualOutputs}
                                onChange={(checked) => {
                                    setIndividualOutputs(checked);
                                    analyzeDailyPvYield();
                                }}
                        />Details
                        <Button type="default"
                                icon={<ReloadOutlined/>}
                                title={'Update'}
                                onClick={analyzeDailyPvYield}
                        />
                        <Button type="default"
                                icon={<SaveOutlined/>}
                                title={'Save as image'}
                                onClick={() => {
                                    screenshot('line-graph-' + labelX + '-' + labelY, 'daily-pv-yield', {});
                                }}
                        />
                    </Space>
                </ColumnWrapper>
            </Container>
        </ReactDraggable>
    );

};

export default React.memo(DailyPvYieldPanel);
