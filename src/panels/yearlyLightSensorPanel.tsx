/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import { GraphDataType } from '../types';
import { MONTHS } from '../constants';
import { Util } from '../Util';
import BarGraph from '../components/barGraph';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space, Switch } from 'antd';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { screenshot } from '../helpers';

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
  width: 500px;
  height: 650px;
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

export interface YearlyLightSensorPanelProps {
  city: string | null;
  collectYearlyLightSensorData: () => void;

  [key: string]: any;
}

const YearlyLightSensorPanel = ({
  city,
  collectYearlyLightSensorData,
  ...rest
}: YearlyLightSensorPanelProps) => {
  const setCommonStore = useStore((state) => state.set);
  const viewState = useStore((state) => state.viewState);
  const sensorData = useStore((state) => state.yearlyLightSensorData);
  const sensorLabels = useStore((state) => state.sensorLabels);
  const now = useStore((state) => state.world.date);
  const [daylightGraph, setDaylightGraph] = useState(true);
  const [clearnessGraph, setClearnessGraph] = useState(true);
  const [radiationGraph, setRadiationGraph] = useState(true);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 540;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 600;
  const [curPosition, setCurPosition] = useState({
    x: isNaN(viewState.yearlyLightSensorPanelX)
      ? 0
      : Math.max(viewState.yearlyLightSensorPanelX, wOffset - window.innerWidth),
    y: isNaN(viewState.yearlyLightSensorPanelY)
      ? 0
      : Math.min(viewState.yearlyLightSensorPanelY, window.innerHeight - hOffset),
  });

  const responsiveHeight = 100;
  const referenceX = MONTHS[Math.floor((Util.daysIntoYear(now) / 365) * 12)];

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleResize = () => {
      setCurPosition({
        x: Math.max(viewState.yearlyLightSensorPanelX, wOffset - window.innerWidth),
        y: Math.min(viewState.yearlyLightSensorPanelY, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.max(ui.x, wOffset - window.innerWidth),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    setCommonStore((state) => {
      state.viewState.yearlyLightSensorPanelX = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.yearlyLightSensorPanelY = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showYearlyLightSensorPanel = false;
    });
  };

  const labelX = 'Month';
  const labelY = 'Radiation';

  return (
    <ReactDraggable
      handle={'.handle'}
      bounds={'parent'}
      axis="both"
      position={curPosition}
      onDrag={onDrag}
      onStop={onDragEnd}
    >
      <Container>
        <ColumnWrapper ref={wrapperRef}>
          <Header className="handle">
            <span>Light Sensor: Weather Data from {city}</span>
            <span
              style={{ cursor: 'pointer' }}
              onTouchStart={() => {
                closePanel();
              }}
              onMouseDown={() => {
                closePanel();
              }}
            >
              Close
            </span>
          </Header>
          <Space style={{ alignSelf: 'center', padding: '10px' }}>
            <Space>
              <Switch
                title={'Show daylight results'}
                checked={daylightGraph}
                onChange={(checked) => {
                  setDaylightGraph(checked);
                }}
              />
              Daylight
            </Space>
            <Space>
              <Switch
                title={'Show sky clearness results'}
                checked={clearnessGraph}
                onChange={(checked) => {
                  setClearnessGraph(checked);
                }}
              />
              Clearness
            </Space>
            <Space>
              <Switch
                title={'Show average daily solar radiation'}
                checked={radiationGraph}
                onChange={(checked) => {
                  setRadiationGraph(checked);
                }}
              />
              Radiation
            </Space>
            <Space>
              <Button
                type="default"
                icon={<ReloadOutlined />}
                title={'Update'}
                onClick={collectYearlyLightSensorData}
              />
              <Button
                type="default"
                icon={<SaveOutlined />}
                title={'Save as image'}
                onClick={() => {
                  screenshot('line-graph-' + labelX + '-' + labelY, 'yearly-light-sensor', {});
                }}
              />
            </Space>
          </Space>
          {daylightGraph && (
            <LineGraph
              type={GraphDataType.DaylightData}
              dataSource={sensorData.map((e) => ({ Month: e.Month, Daylight: e.Daylight }))}
              height={responsiveHeight}
              labelX={'Month'}
              labelY={'Daylight'}
              unitY={'Hours'}
              yMin={0}
              curveType={'natural'}
              fractionDigits={1}
              referenceX={referenceX}
              {...rest}
            />
          )}
          {clearnessGraph && (
            <BarGraph
              type={GraphDataType.ClearnessData}
              dataSource={sensorData.map((e) => ({ Month: e.Month, Clearness: e.Clearness }))}
              height={responsiveHeight}
              labelX={'Month'}
              labelY={'Clearness'}
              unitY={'%'}
              yMin={0}
              yMax={100}
              fractionDigits={1}
              referenceX={referenceX}
              color={'#66CDAA'}
              {...rest}
            />
          )}
          {radiationGraph && (
            <LineGraph
              type={GraphDataType.YearlyRadiationSensorData}
              dataSource={sensorData.map(({ Daylight, Clearness, ...item }) => item)}
              labels={sensorLabels}
              height={responsiveHeight}
              labelX={labelX}
              labelY={labelY}
              unitY={'kWh/m²/day'}
              yMin={0}
              curveType={'natural'}
              fractionDigits={2}
              referenceX={referenceX}
              {...rest}
            />
          )}
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default React.memo(YearlyLightSensorPanel);
