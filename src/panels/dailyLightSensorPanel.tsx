/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ChartType, GraphDataType, ObjectType } from '../types';
import moment from 'moment';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space } from 'antd';
import { CameraOutlined, CaretRightOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { saveCsv, screenshot, showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { Rectangle } from '../models/Rectangle';
import { FLOATING_WINDOW_OPACITY, Z_INDEX_FRONT_PANEL } from '../constants';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';
import { useLanguage } from '../hooks';

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
`;

export interface DailyLightSensorPanelProps {
  city: string | null;
}

const DailyLightSensorPanel = React.memo(({ city }: DailyLightSensorPanelProps) => {
  const loggable = useStore(Selector.loggable);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const now = new Date(useStore(Selector.world.date));
  const sensorLabels = useDataStore(Selector.sensorLabels);
  const sensorData = useDataStore(Selector.dailyLightSensorData);
  const panelRect = useStore(Selector.viewState.dailyLightSensorPanelRect);
  const countElementsByType = useStore(Selector.countElementsByType);
  const selectedFloatingWindow = useStore(Selector.selectedFloatingWindow);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : panelRect ? panelRect.width + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : panelRect ? panelRect.height + 100 : 460;
  const [curPosition, setCurPosition] = useState({
    x: panelRect ? Math.max(panelRect.x, wOffset - window.innerWidth) : 0,
    y: panelRect ? Math.min(panelRect.y, window.innerHeight - hOffset) : 0,
  });

  const lang = useLanguage();

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
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelRect, wOffset, hOffset]);

  useEffect(() => {
    if (wrapperRef.current) {
      if (!resizeObserverRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => {
          setCommonStore((state) => {
            if (wrapperRef.current) {
              if (!state.viewState.dailyLightSensorPanelRect) {
                state.viewState.dailyLightSensorPanelRect = new Rectangle(0, 0, 600, 360);
              }
              state.viewState.dailyLightSensorPanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.dailyLightSensorPanelRect.height = wrapperRef.current.offsetHeight;
            }
          });
        });
      }
      resizeObserverRef.current.observe(wrapperRef.current);
    }
    return () => {
      resizeObserverRef.current?.disconnect();
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
      if (!state.viewState.dailyLightSensorPanelRect) {
        state.viewState.dailyLightSensorPanelRect = new Rectangle(0, 0, 600, 360);
      }
      state.viewState.dailyLightSensorPanelRect.x = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.dailyLightSensorPanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showDailyLightSensorPanel = false;
      if (loggable) {
        state.actionInfo = {
          name: 'Close Daily Light Sensor Graph',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const labelX = i18n.t('word.Hour', lang);
  const labelY = i18n.t('word.Radiation', lang);
  const emptyGraph = sensorData && sensorData[0] ? Object.keys(sensorData[0]).length === 0 : true;

  return (
    <ReactDraggable
      nodeRef={nodeRef}
      handle={'.handle'}
      bounds={'parent'}
      axis="both"
      position={curPosition}
      onDrag={onDrag}
      onStop={onDragEnd}
      onMouseDown={() => {
        setCommonStore((state) => {
          state.selectedFloatingWindow = 'dailyLightSensorPanel';
        });
      }}
    >
      <Container
        ref={nodeRef}
        style={{ zIndex: selectedFloatingWindow === 'dailyLightSensorPanel' ? Z_INDEX_FRONT_PANEL : 9 }}
      >
        <ColumnWrapper
          ref={wrapperRef}
          style={{
            opacity: opacity,
            width: (panelRect ? panelRect.width : 600) + 'px',
            height: (panelRect ? panelRect.height : 360) + 'px',
          }}
        >
          <Header className="handle" style={{ direction: 'ltr' }}>
            <span>
              {i18n.t('sensorPanel.LightSensor', lang) + ': '}
              <span style={{ fontSize: '10px' }}>
                {i18n.t('sensorPanel.WeatherDataFrom', lang) + ' ' + city + ' | ' + moment(now).format('MM/DD')}
              </span>
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
              {`${i18n.t('word.Close', lang)}`}
            </span>
          </Header>
          <LineGraph
            type={GraphDataType.DailyRadiationSensorData}
            chartType={ChartType.Line}
            dataSource={sensorData}
            labels={sensorLabels}
            height={100}
            dataKeyAxisX={'Hour'}
            labelX={labelX}
            labelY={labelY}
            unitY={'kWh/m²'}
            yMin={0}
            curveType={'linear'}
            fractionDigits={2}
            symbolCount={24}
            referenceX={now.getHours()}
          />
          <Space style={{ alignSelf: 'center', direction: 'ltr' }}>
            <Button
              type="default"
              icon={emptyGraph ? <CaretRightOutlined /> : <ReloadOutlined />}
              title={i18n.t(emptyGraph ? 'word.Run' : 'word.Update', lang)}
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
                    if (loggable) {
                      state.actionInfo = { name: 'Collect Daily Data for Sensors', timestamp: new Date().getTime() };
                    }
                  });
                  usePrimitiveStore.getState().set((state) => {
                    state.runDailyLightSensor = true;
                    state.pauseDailyLightSensor = false;
                    state.simulationInProgress = true;
                  });
                }, 100);
              }}
            />
            <Button
              type="default"
              icon={<CameraOutlined />}
              title={i18n.t('word.SaveAsImage', lang)}
              onClick={() => {
                screenshot('line-graph-' + labelX + '-' + labelY, 'daily-light-sensor').then(() => {
                  showInfo(i18n.t('message.ScreenshotSaved', lang));
                  if (loggable) {
                    setCommonStore((state) => {
                      state.actionInfo = {
                        name: 'Take Screenshot of Daily Light Sensor Graph',
                        timestamp: new Date().getTime(),
                      };
                    });
                  }
                });
              }}
            />
            {sensorData && sensorData.length > 0 && (
              <Button
                type="default"
                icon={<SaveOutlined />}
                title={i18n.t('word.SaveAsCsv', lang)}
                onClick={() => {
                  saveCsv(sensorData, 'daily-light-sensor.csv');
                  showInfo(i18n.t('message.CsvFileSaved', lang));
                  if (loggable) {
                    setCommonStore((state) => {
                      state.actionInfo = {
                        name: 'Export Daily Light Sensor Result as CSV',
                        timestamp: new Date().getTime(),
                      };
                    });
                  }
                }}
              />
            )}
          </Space>
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
});

export default DailyLightSensorPanel;
