/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ChartType, GraphDataType, SolarStructure } from '../types';
import moment from 'moment';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Col, Row, Space, Popover } from 'antd';
import { saveCsv, screenshot, showInfo } from '../helpers';
import { CameraOutlined, CaretRightOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import i18n from '../i18n/i18n';
import SutBiaxialLineGraph from '../components/sutBiaxialLineGraph';
import { Rectangle } from '../models/Rectangle';
import { FLOATING_WINDOW_OPACITY, Z_INDEX_FRONT_PANEL } from '../constants';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';
import { useTranslation } from 'react-i18next';

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

export interface DailySolarUpdraftTowerYieldPanelProps {
  city: string | null;
}

const DailySolarUpdraftTowerYieldPanel = ({ city }: DailySolarUpdraftTowerYieldPanelProps) => {
  const language = useStore(Selector.language);
  const loggable = useStore(Selector.loggable);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const now = new Date(useStore(Selector.world.date));
  const countSolarStructuresByType = useStore(Selector.countSolarStructuresByType);
  const dailyYield = useDataStore(Selector.dailyUpdraftTowerYield);
  const dailyResults = useDataStore(Selector.dailyUpdraftTowerResults);
  const individualOutputs = useStore(Selector.dailyUpdraftTowerIndividualOutputs);
  const panelRect = useStore(Selector.viewState.dailyUpdraftTowerYieldPanelRect);
  const updraftTowerLabels = useDataStore(Selector.updraftTowerLabels);
  const simulationInProgress = usePrimitiveStore(Selector.simulationInProgress);
  const selectedFloatingWindow = useStore(Selector.selectedFloatingWindow);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : panelRect ? panelRect.width + 40 : 680;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : panelRect ? panelRect.height + 100 : 650;
  const [curPosition, setCurPosition] = useState({
    x: panelRect ? Math.max(panelRect.x, wOffset - window.innerWidth) : 0,
    y: panelRect ? Math.min(panelRect.y, window.innerHeight - hOffset) : 0,
  });
  const [sum, setSum] = useState(0);
  const towerSumRef = useRef(new Map<string, number>());

  const lang = { lng: language };

  useEffect(() => {
    let s = 0;
    towerSumRef.current.clear();
    for (const datum of dailyYield) {
      for (const prop in datum) {
        if (datum.hasOwnProperty(prop)) {
          if (prop !== 'Hour') {
            s += datum[prop] as number;
            towerSumRef.current.set(prop, (towerSumRef.current.get(prop) ?? 0) + (datum[prop] as number));
          }
        }
      }
    }
    setSum(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyYield]);

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
              if (!state.viewState.dailyUpdraftTowerYieldPanelRect) {
                state.viewState.dailyUpdraftTowerYieldPanelRect = new Rectangle(0, 0, 640, 550);
              }
              state.viewState.dailyUpdraftTowerYieldPanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.dailyUpdraftTowerYieldPanelRect.height = wrapperRef.current.offsetHeight;
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
      if (!state.viewState.dailyUpdraftTowerYieldPanelRect) {
        state.viewState.dailyUpdraftTowerYieldPanelRect = new Rectangle(0, 0, 640, 550);
      }
      state.viewState.dailyUpdraftTowerYieldPanelRect.x = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.dailyUpdraftTowerYieldPanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showDailyUpdraftTowerYieldPanel = false;
      if (loggable) {
        state.actionInfo = {
          name: 'Close Solar Updraft Tower Daily Yield Graph',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const towerCount = countSolarStructuresByType(SolarStructure.UpdraftTower);
  useEffect(() => {
    if (towerCount < 2 && individualOutputs) {
      setCommonStore((state) => {
        if (state.graphState) state.graphState.dailyUpdraftTowerIndividualOutputs = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [towerCount, individualOutputs]);

  const { t } = useTranslation();
  const labelHour = t('word.Hour', lang);
  const labelYield = t('updraftTowerYieldPanel.YieldPerHour', lang);
  const labelTemperature = t('updraftTowerYieldPanel.ChimneyAirTemperature', lang);
  const labelSpeed = t('updraftTowerYieldPanel.ChimneyWindSpeed', lang);
  const emptyGraph = dailyYield && dailyYield[0] ? Object.keys(dailyYield[0]).length === 0 : true;

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
          state.selectedFloatingWindow = 'dailySolarUpdraftTowerYieldPanel';
        });
      }}
    >
      <Container
        ref={nodeRef}
        style={{ zIndex: selectedFloatingWindow === 'dailySolarUpdraftTowerYieldPanel' ? Z_INDEX_FRONT_PANEL : 9 }}
      >
        <ColumnWrapper
          ref={wrapperRef}
          style={{
            opacity: opacity,
            width: (panelRect ? panelRect.width : 640) + 'px',
            height: (panelRect ? panelRect.height : 550) + 'px',
          }}
        >
          <Header className="handle" style={{ direction: 'ltr' }}>
            <span>
              {t('updraftTowerYieldPanel.UpdraftTowerDailyYield', lang) + ': '}
              <span style={{ fontSize: '10px' }}>
                {t('sensorPanel.WeatherDataFrom', lang) + ' ' + city + ' | ' + moment(now).format('MM/DD')}
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
              {t('word.Close', lang)}
            </span>
          </Header>
          <LineGraph
            type={GraphDataType.DailyUpdraftTowerYield}
            chartType={individualOutputs ? ChartType.Line : ChartType.Area}
            dataSource={dailyYield}
            labels={updraftTowerLabels}
            height={100}
            dataKeyAxisX={'Hour'}
            labelX={labelHour}
            labelY={labelYield}
            unitY={t('word.kWh', lang)}
            yMin={0}
            curveType={'linear'}
            fractionDigits={2}
            symbolCount={24}
            referenceX={now.getHours()}
          />
          <SutBiaxialLineGraph
            dataSource={dailyResults}
            height={100}
            dataKeyAxisX={'Hour'}
            labelX={labelHour}
            labelY1={labelTemperature}
            labelY2={labelSpeed}
            unitY1={'°C'}
            unitY2={t('word.MeterPerSecond', lang)}
            yMin1={0}
            yMin2={0}
            curveType={'linear'}
            fractionDigits={2}
            symbolCount={24}
            referenceX={now.getHours()}
          />
          {!simulationInProgress && (
            <Space style={{ alignSelf: 'center', direction: 'ltr' }}>
              {towerCount > 1 && towerSumRef.current.size > 0 ? (
                <Popover
                  title={[...towerSumRef.current.entries()].map((e, i) => (
                    <React.Fragment key={i}>
                      <Row style={{ textAlign: 'right' }}>
                        <Col span={16} style={{ textAlign: 'right', paddingRight: '8px' }}>
                          {e[0] + ': '}
                        </Col>
                        <Col span={8}>{e[1].toFixed(3)}</Col>
                      </Row>
                      {i === towerSumRef.current.size - 1 && (
                        <>
                          <hr></hr>
                          <div style={{ textAlign: 'right' }}>
                            {t('word.Total', lang) + ': ' + sum.toFixed(3) + ' ' + t('word.kWh', lang)}
                          </div>
                        </>
                      )}
                    </React.Fragment>
                  ))}
                >
                  <Space style={{ cursor: 'pointer', border: '2px solid #ccc', padding: '4px' }}>
                    {t('shared.OutputBreakdown', lang)}
                  </Space>
                </Popover>
              ) : (
                <Space style={{ cursor: 'default' }}>
                  {t('updraftTowerYieldPanel.DailyTotal', lang)}:{sum.toFixed(2)} {t('word.kWh', lang)}
                </Space>
              )}
              <Button
                type="default"
                icon={emptyGraph ? <CaretRightOutlined /> : <ReloadOutlined />}
                title={t(emptyGraph ? 'word.Run' : 'word.Update', lang)}
                onClick={() => {
                  if (towerCount === 0) {
                    showInfo(t('analysisManager.NoSolarUpdraftTowerForAnalysis', lang));
                    return;
                  }
                  showInfo(t('message.SimulationStarted', lang));
                  // give it 0.1 second for the info to show up
                  setTimeout(() => {
                    setCommonStore((state) => {
                      if (loggable) {
                        state.actionInfo = {
                          name: 'Run Daily Simulation For Solar Updraft Tower',
                          timestamp: new Date().getTime(),
                        };
                      }
                    });
                    usePrimitiveStore.getState().set((state) => {
                      state.runDailySimulationForUpdraftTower = true;
                      state.pauseDailySimulationForUpdraftTower = false;
                      state.simulationInProgress = true;
                    });
                  }, 100);
                }}
              />
              <Button
                type="default"
                icon={<CameraOutlined />}
                title={t('word.SaveAsImage', lang)}
                onClick={() => {
                  screenshot('line-graph-' + labelHour + '-' + labelYield, 'daily-updraft-tower-yield', {}).then(() => {
                    showInfo(t('message.ScreenshotSaved', lang));
                    if (loggable) {
                      setCommonStore((state) => {
                        state.actionInfo = {
                          name: 'Take Screenshot of Daily Updraft Tower Yield Graph',
                          timestamp: new Date().getTime(),
                        };
                      });
                    }
                  });
                }}
              />
              {dailyYield && dailyYield.length > 0 && (
                <Button
                  type="default"
                  icon={<SaveOutlined />}
                  title={t('word.SaveAsCsv', lang)}
                  onClick={() => {
                    saveCsv(dailyYield, 'daily-updraft-tower-yield.csv');
                    showInfo(t('message.CsvFileSaved', lang));
                    if (loggable) {
                      setCommonStore((state) => {
                        state.actionInfo = {
                          name: 'Export Daily Updraft Tower Yield Result as CSV',
                          timestamp: new Date().getTime(),
                        };
                      });
                    }
                  }}
                />
              )}
            </Space>
          )}
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default React.memo(DailySolarUpdraftTowerYieldPanel);
