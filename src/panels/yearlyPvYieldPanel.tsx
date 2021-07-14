/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect, useRef, useState} from 'react';
import LineGraph from '../components/lineGraph';
import styled from "styled-components";
import {useStore} from "../stores/common";
import {GraphDataType} from "../types";
import {MONTHS} from "../constants";
import {Util} from "../Util";
import ReactDraggable, {DraggableEventHandler} from "react-draggable";
import {Button, Space, Switch} from "antd";

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

export interface YearlyPvYieldPanelProps {

    city: string | null;
    requestUpdate: () => void;
    individualOutputs: boolean;
    setIndividualOutputs: (b: boolean) => void;
    analyzeYearlyPvYield: () => void;

    [key: string]: any;

}

const YearlyPvYieldPanel = ({
                                city,
                                requestUpdate,
                                individualOutputs = false,
                                setIndividualOutputs,
                                analyzeYearlyPvYield,
                                ...rest
                            }: YearlyPvYieldPanelProps) => {

    const setCommonStore = useStore(state => state.set);
    const viewState = useStore(state => state.viewState);
    const yearlyYield = useStore(state => state.yearlyPvYield);
    const solarPanelLabels = useStore(state => state.solarPanelLabels);
    const now = useStore(state => state.world.date);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 640;
    const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 500;
    const [curPosition, setCurPosition] = useState({
        x: isNaN(viewState.yearlyPvYieldPanelX) ? 0 : Math.max(viewState.yearlyPvYieldPanelX, wOffset - window.innerWidth),
        y: isNaN(viewState.yearlyPvYieldPanelY) ? 0 : Math.min(viewState.yearlyPvYieldPanelY, window.innerHeight - hOffset)
    });

    const responsiveHeight = 100;
    const referenceX = MONTHS[Math.floor(Util.daysIntoYear(now) / 365 * 12)];

    // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
    useEffect(() => {
        const handleResize = () => {
            setCurPosition({
                x: Math.max(viewState.yearlyPvYieldPanelX, wOffset - window.innerWidth),
                y: Math.min(viewState.yearlyPvYieldPanelY, window.innerHeight - hOffset)
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
            state.viewState.yearlyPvYieldPanelX = Math.max(ui.x, wOffset - window.innerWidth);
            state.viewState.yearlyPvYieldPanelY = Math.min(ui.y, window.innerHeight - hOffset);
        });
    };

    const closePanel = () => {
        setCommonStore((state) => {
            state.viewState.showYearlyPvYieldPanel = false;
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
                        <span>Solar Panel Yearly Yield: Weather Data from {city}</span>
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
                        type={GraphDataType.YearlyPvYeild}
                        dataSource={yearlyYield.map(({Daylight, Clearness, ...item}) => item)}
                        labels={solarPanelLabels}
                        height={responsiveHeight}
                        labelX={'Month'}
                        labelY={'Yield'}
                        unitY={'kWh'}
                        yMin={0}
                        curveType={'natural'}
                        fractionDigits={2}
                        referenceX={referenceX}
                        {...rest}
                    />
                    <Space style={{alignSelf: 'center'}}>
                        <Switch title={'Show outputs of individual solar panels'}
                                checked={individualOutputs}
                                onChange={(checked) => {
                                    setIndividualOutputs(checked);
                                    analyzeYearlyPvYield();
                                }}
                        />Individual Outputs
                        <Button type="primary" onClick={analyzeYearlyPvYield}>
                            Update
                        </Button>
                    </Space>
                </ColumnWrapper>
            </Container>
        </ReactDraggable>
    );

};

export default React.memo(YearlyPvYieldPanel);
