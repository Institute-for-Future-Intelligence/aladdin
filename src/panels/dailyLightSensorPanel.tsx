/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { GraphDataType } from '../types';
import moment from 'moment';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space } from 'antd';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { screenshot } from '../helpers';
import i18n from '../i18n/i18n';

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
  height: 360px;
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
  collectDailyLightSensorData: () => void;
}

const DailyLightSensorPanel = ({ city, collectDailyLightSensorData }: DailyLightSensorPanelProps) => {
  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);
  const sensorLabels = useStore(Selector.sensorLabels);
  const sensorData = useStore(Selector.dailyLightSensorData);
  const now = new Date(useStore(Selector.world.date));
  const viewState = useStore((state) => state.viewState);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 460;
  const [curPosition, setCurPosition] = useState({
    x: isNaN(viewState.dailyLightSensorPanelX)
      ? 0
      : Math.max(viewState.dailyLightSensorPanelX, wOffset - window.innerWidth),
    y: isNaN(viewState.dailyLightSensorPanelY)
      ? 0
      : Math.min(viewState.dailyLightSensorPanelY, window.innerHeight - hOffset),
  });

  const lang = { lng: language };
  const responsiveHeight = 100;

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleResize = () => {
      setCurPosition({
        x: Math.max(viewState.dailyLightSensorPanelX, wOffset - window.innerWidth),
        y: Math.min(viewState.dailyLightSensorPanelY, window.innerHeight - hOffset),
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
      state.viewState.dailyLightSensorPanelX = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.dailyLightSensorPanelY = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showDailyLightSensorPanel = false;
    });
  };

  const labelX = 'Hour';
  const labelY = i18n.t('word.Radiation', lang);

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
            <span>
              {i18n.t('sensorPanel.LightSensor', lang)}:{i18n.t('sensorPanel.WeatherDataFrom', lang)}
              {city} | {moment(now).format('MM/DD')}
            </span>
            <span
              style={{ cursor: 'pointer' }}
              onTouchStart={() => {
                closePanel();
              }}
              onMouseDown={() => {
                closePanel();
              }}
            >
              {i18n.t('word.Close', lang)}
            </span>
          </Header>
          <LineGraph
            type={GraphDataType.DailyRadiationSensorData}
            dataSource={sensorData}
            labels={sensorLabels}
            height={responsiveHeight}
            labelX={labelX}
            labelY={labelY}
            unitY={'kWh/m²/' + i18n.t('word.Day', lang)}
            yMin={0}
            curveType={'linear'}
            fractionDigits={2}
            symbolCount={24}
            referenceX={now.getHours()}
          />
          <Space style={{ alignSelf: 'center' }}>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              title={i18n.t('word.Update', lang)}
              onClick={collectDailyLightSensorData}
            />
            <Button
              type="default"
              icon={<SaveOutlined />}
              title={i18n.t('word.SaveAsImage', lang)}
              onClick={() => {
                screenshot('line-graph-' + labelX + '-' + labelY, 'daily-light-sensor', {});
              }}
            />
          </Space>
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default React.memo(DailyLightSensorPanel);
