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
  height: 300px;
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

export interface DailyLightSensorPanelProps {

    city: string | null;
    requestUpdate: () => void;

    [key: string]: any;

}

const DailyLightSensorPanel = ({
                                   city,
                                   requestUpdate,
                                   ...rest
                               }: DailyLightSensorPanelProps) => {

    const setCommonStore = useStore(state => state.set);
    const viewState = useStore(state => state.viewState);
    const sensorLabels = useStore(state => state.sensorLabels);
    const sensorData = useStore(state => state.dailyLightSensorData);
    const now = new Date(useStore(state => state.world.date));
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 640;
    const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 400;
    const [curPosition, setCurPosition] = useState({
        x: isNaN(viewState.dailyLightSensorPanelX) ? 0 : Math.max(viewState.dailyLightSensorPanelX, wOffset - window.innerWidth),
        y: isNaN(viewState.dailyLightSensorPanelY) ? 0 : Math.min(viewState.dailyLightSensorPanelY, window.innerHeight - hOffset)
    });

    const responsiveHeight = 100;

    // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
    useEffect(() => {
        const handleResize = () => {
            setCurPosition({
                x: Math.max(viewState.dailyLightSensorPanelX, wOffset - window.innerWidth),
                y: Math.min(viewState.dailyLightSensorPanelY, window.innerHeight - hOffset)
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
            state.viewState.dailyLightSensorPanelX = Math.max(ui.x, wOffset - window.innerWidth);
            state.viewState.dailyLightSensorPanelY = Math.min(ui.y, window.innerHeight - hOffset);
        });
    };

    const closePanel = () => {
        setCommonStore((state) => {
            state.viewState.showDailyLightSensorPanel = false;
        });
        requestUpdate();
    };

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
                        <span>Light Sensor: {city} | {moment(now).format('MM/DD')}</span>
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
                        type={GraphDataType.DailyRadiationSensorData}
                        dataSource={sensorData}
                        labels={sensorLabels}
                        height={responsiveHeight}
                        labelX={'Hour'}
                        labelY={'Radiation'}
                        unitY={'kWh/m²/day'}
                        yMin={0}
                        curveType={'linear'}
                        fractionDigits={2}
                        symbolCount={24}
                        referenceX={now.getHours()}
                        {...rest}
                    />
                </ColumnWrapper>
            </Container>
        </ReactDraggable>
    );

};

export default React.memo(DailyLightSensorPanel);
