/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ChartType, GraphDataType, ObjectType } from '../types';
import { FLOATING_WINDOW_OPACITY, MONTHS } from '../constants';
import BarGraph from '../components/barGraph';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space, Switch } from 'antd';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { screenshot, showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { Rectangle } from '../models/Rectangle';

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
  min-width: 400px;
  max-width: 800px;
  min-height: 200px;
  max-height: 600px;
  padding-bottom: 10px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  overflow-y: auto;
  resize: both;
  direction: rtl;
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
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const now = new Date(useStore(Selector.world.date));
  const sensorData = useStore(Selector.yearlyLightSensorData);
  const sensorLabels = useStore(Selector.sensorLabels);
  const panelRect = useStore(Selector.viewState.yearlyLightSensorPanelRect);
  const countElementsByType = useStore(Selector.countElementsByType);
  const daylightGraph = useStore(Selector.viewState.yearlyLightSensorPanelShowDaylight);
  const clearnessGraph = useStore(Selector.viewState.yearlyLightSensorPanelShowClearness);

  const [radiationGraph, setRadiationGraph] = useState(true);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : panelRect ? panelRect.width + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : panelRect ? panelRect.height + 100 : 600;
  const [curPosition, setCurPosition] = useState({
    x: panelRect ? Math.max(panelRect.x, wOffset - window.innerWidth) : 0,
    y: panelRect ? Math.min(panelRect.y, window.innerHeight - hOffset) : 0,
  });

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const lang = { lng: language };
  const referenceX = MONTHS[now.getMonth()];

  useEffect(() => {
    setCurPosition({
      x: Math.max(panelRect?.x, wOffset - window.innerWidth),
      y: Math.min(panelRect?.y, window.innerHeight - hOffset),
    });
  }, [panelRect, wOffset, hOffset]);

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleWindowResize = () => {
      setCurPosition({
        x: Math.max(panelRect?.x, wOffset - window.innerWidth),
        y: Math.min(panelRect?.y, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleWindowResize);
    if (wrapperRef.current) {
      if (!resizeObserverRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => {
          setCommonStore((state) => {
            if (wrapperRef.current) {
              if (!state.viewState.yearlyLightSensorPanelRect) {
                state.viewState.yearlyLightSensorPanelRect = new Rectangle(0, 0, 600, 500);
              }
              state.viewState.yearlyLightSensorPanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.yearlyLightSensorPanelRect.height = wrapperRef.current.offsetHeight;
            }
          });
        });
      }
      resizeObserverRef.current.observe(wrapperRef.current);
    }
    return () => {
      window.removeEventListener('resize', handleWindowResize);
      resizeObserverRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelRect, wOffset, hOffset]);

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.max(ui.x, wOffset - window.innerWidth),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    setCommonStore((state) => {
      if (!state.viewState.yearlyLightSensorPanelRect) {
        state.viewState.yearlyLightSensorPanelRect = new Rectangle(0, 0, 600, 500);
      }
      state.viewState.yearlyLightSensorPanelRect.x = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.yearlyLightSensorPanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
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
        <ColumnWrapper
          ref={wrapperRef}
          style={{
            opacity: opacity,
            width: (panelRect ? panelRect.width : 600) + 'px',
            height: (panelRect ? panelRect.height : 500) + 'px',
          }}
        >
          <Header className="handle" style={{ direction: 'ltr' }}>
            <span>
              {i18n.t('sensorPanel.LightSensor', lang) + ': '}
              <label style={{ fontSize: '10px' }}>
                {i18n.t('sensorPanel.WeatherDataFrom', lang) + ' ' + city + ' | ' + now.getFullYear()}
              </label>
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
              height={100}
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
              height={100}
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
              height={100}
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
          <Space style={{ alignSelf: 'center', padding: '10px', direction: 'ltr' }}>
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
