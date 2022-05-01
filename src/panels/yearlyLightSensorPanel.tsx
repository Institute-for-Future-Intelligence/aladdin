/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ChartType, GraphDataType, ObjectType } from '../types';
import { MONTHS } from '../constants';
import BarGraph from '../components/barGraph';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space, Switch } from 'antd';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { screenshot, showInfo } from '../helpers';
import i18n from '../i18n/i18n';

const Container = styled.div`
  position: fixed;
  top: 80px;
  right: 24px;
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
  height: 500px;
  padding-bottom: 10px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  resize: vertical;
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
}

const YearlyLightSensorPanel = ({ city }: YearlyLightSensorPanelProps) => {
  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);
  const now = new Date(useStore(Selector.world.date));
  const sensorData = useStore(Selector.yearlyLightSensorData);
  const sensorLabels = useStore(Selector.sensorLabels);
  const panelX = useStore(Selector.viewState.yearlyLightSensorPanelX);
  const panelY = useStore(Selector.viewState.yearlyLightSensorPanelY);
  const countElementsByType = useStore(Selector.countElementsByType);
  const daylightGraph = useStore(Selector.viewState.yearlyLightSensorPanelShowDaylight);
  const clearnessGraph = useStore(Selector.viewState.yearlyLightSensorPanelShowClearness);

  const [radiationGraph, setRadiationGraph] = useState(true);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 540;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 600;
  const [curPosition, setCurPosition] = useState({
    x: isNaN(panelX) ? 0 : Math.max(panelX, wOffset - window.innerWidth),
    y: isNaN(panelY) ? 0 : Math.min(panelY, window.innerHeight - hOffset),
  });

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const lang = { lng: language };
  const responsiveHeight = 100;
  const referenceX = MONTHS[now.getMonth()];

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleResize = () => {
      setCurPosition({
        x: Math.max(panelX, wOffset - window.innerWidth),
        y: Math.min(panelY, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const labelX = i18n.t('word.Month', lang);
  const labelY = i18n.t('word.Radiation', lang);

  return (
    <ReactDraggable
      nodeRef={nodeRef}
      handle={'.handle'}
      bounds={'parent'}
      axis="both"
      position={curPosition}
      onDrag={onDrag}
      onStop={onDragEnd}
    >
      <Container ref={nodeRef}>
        <ColumnWrapper ref={wrapperRef}>
          <Header className="handle">
            <span>
              {i18n.t('sensorPanel.LightSensor', lang)}: {i18n.t('sensorPanel.WeatherDataFrom', lang)} {city}
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
          {daylightGraph && (
            <LineGraph
              type={GraphDataType.DaylightData}
              chartType={ChartType.Area}
              dataSource={sensorData.map((e) => ({ Month: e.Month, Daylight: e.Daylight }))}
              height={responsiveHeight}
              dataKeyAxisX={'Month'}
              labelX={labelX}
              labelY={i18n.t('word.Daylight', lang)}
              unitY={i18n.t('word.Hour', lang)}
              yMin={0}
              curveType={'linear'}
              fractionDigits={1}
              referenceX={referenceX}
            />
          )}
          {clearnessGraph && (
            <BarGraph
              type={GraphDataType.ClearnessData}
              dataSource={sensorData.map((e) => ({ Month: e.Month, Clearness: e.Clearness }))}
              height={responsiveHeight}
              dataKeyAxisX={'Month'}
              labelX={labelX}
              labelY={i18n.t('yearlyLightSensorPanel.SkyClearness', lang)}
              unitY={'%'}
              yMin={0}
              yMax={100}
              fractionDigits={1}
              referenceX={referenceX}
              color={'#66CDAA'}
            />
          )}
          {radiationGraph && (
            <LineGraph
              type={GraphDataType.YearlyRadiationSensorData}
              chartType={ChartType.Line}
              dataSource={sensorData.map(({ Daylight, Clearness, ...item }) => item)}
              labels={sensorLabels}
              height={responsiveHeight}
              dataKeyAxisX={'Month'}
              labelX={labelX}
              labelY={labelY}
              unitY={'kWh/m²/' + i18n.t('word.Day', lang)}
              yMin={0}
              curveType={'linear'}
              fractionDigits={2}
              referenceX={referenceX}
            />
          )}
          <Space style={{ alignSelf: 'center', padding: '10px' }}>
            <Space>
              <Switch
                title={i18n.t('yearlyLightSensorPanel.ShowDaylightResults', lang)}
                checked={daylightGraph}
                onChange={(checked) => {
                  setCommonStore((state) => {
                    state.viewState.yearlyLightSensorPanelShowDaylight = checked;
                  });
                }}
              />
              {i18n.t('word.Daylight', lang)}
            </Space>
            <Space>
              <Switch
                title={i18n.t('yearlyLightSensorPanel.ShowSkyClearnessResults', lang)}
                checked={clearnessGraph}
                onChange={(checked) => {
                  setCommonStore((state) => {
                    state.viewState.yearlyLightSensorPanelShowClearness = checked;
                  });
                }}
              />
              {i18n.t('yearlyLightSensorPanel.SkyClearness', lang)}
            </Space>
            <Space>
              <Switch
                title={i18n.t('yearlyLightSensorPanel.ShowAverageDailySolarRadiation', lang)}
                checked={radiationGraph}
                onChange={(checked) => {
                  setRadiationGraph(checked);
                }}
              />
              {i18n.t('word.Radiation', lang)}
            </Space>
            <Space>
              <Button
                type="default"
                icon={<ReloadOutlined />}
                title={i18n.t('word.Update', lang)}
                onClick={() => {
                  const sensorCount = countElementsByType(ObjectType.Sensor);
                  if (sensorCount === 0) {
                    showInfo(i18n.t('analysisManager.NoSensorForCollectingData', lang));
                    return;
                  }
                  showInfo(i18n.t('message.SimulationStarted', lang));
                  // give it 0.1 second for the info to show up
                  setTimeout(() => {
                    setCommonStore((state) => {
                      state.runYearlyLightSensor = true;
                      state.pauseYearlyLightSensor = false;
                      state.simulationInProgress = true;
                    });
                  }, 100);
                }}
              />
              <Button
                type="default"
                icon={<SaveOutlined />}
                title={i18n.t('word.SaveAsImage', lang)}
                onClick={() => {
                  screenshot('line-graph-' + labelX + '-' + labelY, 'yearly-light-sensor', {}).then(() => {
                    showInfo(i18n.t('message.ScreenshotSaved', lang));
                  });
                }}
              />
            </Space>
          </Space>
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default React.memo(YearlyLightSensorPanel);
