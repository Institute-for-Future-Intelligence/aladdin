/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ChartType, GraphDataType, ObjectType } from '../types';
import moment from 'moment';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space, Switch } from 'antd';
import { saveCsv, screenshot, showInfo } from '../helpers';
import {
  CameraOutlined,
  CaretRightOutlined,
  ReloadOutlined,
  SaveOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import i18n from '../i18n/i18n';
import { Rectangle } from '../models/Rectangle';
import { FLOATING_WINDOW_OPACITY } from '../constants';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';

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

export interface DailyParabolicDishYieldPanelProps {
  city: string | null;
}

const DailyParabolicDishYieldPanel = ({ city }: DailyParabolicDishYieldPanelProps) => {
  const language = useStore(Selector.language);
  const loggable = useStore(Selector.loggable);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const now = new Date(useStore(Selector.world.date));
  const countElementsByType = useStore(Selector.countElementsByType);
  const dailyYield = useDataStore(Selector.dailyParabolicDishYield);
  const individualOutputs = useStore(Selector.dailyParabolicDishIndividualOutputs);
  const panelRect = useStore(Selector.viewState.dailyParabolicDishYieldPanelRect);
  const parabolicDishLabels = useDataStore(Selector.parabolicDishLabels);
  const simulationInProgress = usePrimitiveStore(Selector.simulationInProgress);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : panelRect ? panelRect.width + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : panelRect ? panelRect.height + 100 : 500;
  const [curPosition, setCurPosition] = useState({
    x: panelRect ? Math.max(panelRect.x, wOffset - window.innerWidth) : 0,
    y: panelRect ? Math.min(panelRect.y, window.innerHeight - hOffset) : 0,
  });
  const [sum, setSum] = useState(0);
  const dishSumRef = useRef(new Map<string, number>());

  const lang = { lng: language };

  useEffect(() => {
    let s = 0;
    dishSumRef.current.clear();
    for (const datum of dailyYield) {
      for (const prop in datum) {
        if (datum.hasOwnProperty(prop)) {
          if (prop !== 'Hour') {
            s += datum[prop] as number;
            dishSumRef.current.set(prop, (dishSumRef.current.get(prop) ?? 0) + (datum[prop] as number));
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
              if (!state.viewState.dailyParabolicDishYieldPanelRect) {
                state.viewState.dailyParabolicDishYieldPanelRect = new Rectangle(0, 0, 600, 400);
              }
              state.viewState.dailyParabolicDishYieldPanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.dailyParabolicDishYieldPanelRect.height = wrapperRef.current.offsetHeight;
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
      if (!state.viewState.dailyParabolicDishYieldPanelRect) {
        state.viewState.dailyParabolicDishYieldPanelRect = new Rectangle(0, 0, 600, 400);
      }
      state.viewState.dailyParabolicDishYieldPanelRect.x = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.dailyParabolicDishYieldPanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showDailyParabolicDishYieldPanel = false;
      if (loggable) {
        state.actionInfo = {
          name: 'Close Parabolic Dish Daily Yield Graph',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const parabolicDishCount = countElementsByType(ObjectType.ParabolicDish);
  useEffect(() => {
    if (parabolicDishCount < 2 && individualOutputs) {
      setCommonStore((state) => {
        if (state.graphState) state.graphState.dailyParabolicDishIndividualOutputs = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parabolicDishCount, individualOutputs]);

  const labelX = i18n.t('word.Hour', lang);
  const labelY = i18n.t('parabolicDishYieldPanel.YieldPerHour', lang);
  let totalTooltip = '';
  if (individualOutputs) {
    dishSumRef.current.forEach((value, key) => (totalTooltip += key + ': ' + value.toFixed(2) + '\n'));
    totalTooltip += '——————————\n';
    totalTooltip += i18n.t('word.Total', lang) + ': ' + sum.toFixed(2) + ' ' + i18n.t('word.kWh', lang);
  }
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
    >
      <Container ref={nodeRef}>
        <ColumnWrapper
          ref={wrapperRef}
          style={{
            opacity: opacity,
            width: (panelRect ? panelRect.width : 600) + 'px',
            height: (panelRect ? panelRect.height : 400) + 'px',
          }}
        >
          <Header className="handle" style={{ direction: 'ltr' }}>
            <span>
              {i18n.t('parabolicDishYieldPanel.ParabolicDishDailyYield', lang) + ': '}
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
              {i18n.t('word.Close', lang)}
            </span>
          </Header>
          <LineGraph
            type={GraphDataType.DailyParabolicDishYield}
            chartType={individualOutputs ? ChartType.Line : ChartType.Area}
            dataSource={dailyYield}
            labels={parabolicDishLabels}
            height={100}
            dataKeyAxisX={'Hour'}
            labelX={labelX}
            labelY={labelY}
            unitY={i18n.t('word.kWh', lang)}
            yMin={0}
            curveType={'linear'}
            fractionDigits={2}
            symbolCount={24}
            referenceX={now.getHours()}
          />
          {!simulationInProgress && (
            <Space style={{ alignSelf: 'center', direction: 'ltr' }}>
              {individualOutputs && parabolicDishCount > 1 ? (
                <Space title={totalTooltip} style={{ cursor: 'pointer', border: '2px solid #ccc', padding: '4px' }}>
                  {i18n.t('shared.OutputBreakdown', lang)}
                </Space>
              ) : (
                <Space style={{ cursor: 'default' }}>
                  {i18n.t('parabolicDishYieldPanel.DailyTotal', lang)}:{sum.toFixed(2)} {i18n.t('word.kWh', lang)}
                </Space>
              )}
              {parabolicDishCount > 1 && (
                <Switch
                  title={i18n.t('parabolicDishYieldPanel.ShowOutputsOfIndividualParabolicDishes', lang)}
                  checkedChildren={<UnorderedListOutlined />}
                  unCheckedChildren={<UnorderedListOutlined />}
                  checked={individualOutputs}
                  onChange={(checked) => {
                    if (parabolicDishCount === 0) {
                      showInfo(i18n.t('analysisManager.NoParabolicDishForAnalysis', lang));
                      return;
                    }
                    showInfo(i18n.t('message.SimulationStarted', lang));
                    // give it 0.1 second for the info to show up
                    setTimeout(() => {
                      setCommonStore((state) => {
                        if (state.graphState) state.graphState.dailyParabolicDishIndividualOutputs = checked;
                        if (loggable) {
                          state.actionInfo = {
                            name: 'Run Daily Simulation For Parabolic Dishes: ' + (checked ? 'Individual' : 'Total'),
                            timestamp: new Date().getTime(),
                          };
                        }
                      });
                      usePrimitiveStore.setState((state) => {
                        state.runDailySimulationForParabolicDishes = true;
                        state.pauseDailySimulationForParabolicDishes = false;
                        state.simulationInProgress = true;
                      });
                    }, 100);
                  }}
                />
              )}
              <Button
                type="default"
                icon={emptyGraph ? <CaretRightOutlined /> : <ReloadOutlined />}
                title={i18n.t(emptyGraph ? 'word.Run' : 'word.Update', lang)}
                onClick={() => {
                  if (parabolicDishCount === 0) {
                    showInfo(i18n.t('analysisManager.NoParabolicDishForAnalysis', lang));
                    return;
                  }
                  showInfo(i18n.t('message.SimulationStarted', lang));
                  // give it 0.1 second for the info to show up
                  setTimeout(() => {
                    setCommonStore((state) => {
                      if (loggable) {
                        state.actionInfo = {
                          name: 'Run Daily Simulation For Parabolic Dishes',
                          timestamp: new Date().getTime(),
                        };
                      }
                    });
                    usePrimitiveStore.setState((state) => {
                      state.runDailySimulationForParabolicDishes = true;
                      state.pauseDailySimulationForParabolicDishes = false;
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
                  screenshot('line-graph-' + labelX + '-' + labelY, 'daily-parabolic-dish-yield', {}).then(() => {
                    showInfo(i18n.t('message.ScreenshotSaved', lang));
                    if (loggable) {
                      setCommonStore((state) => {
                        state.actionInfo = {
                          name: 'Take Screenshot of Daily Parabolic Dish Yield Graph',
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
                  title={i18n.t('word.SaveAsCsv', lang)}
                  onClick={() => {
                    saveCsv(dailyYield, 'daily-parabolic-dish-yield.csv');
                    showInfo(i18n.t('message.CsvFileSaved', lang));
                    if (loggable) {
                      setCommonStore((state) => {
                        state.actionInfo = {
                          name: 'Export Daily Parabolic Dish Yield Result as CSV',
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

export default React.memo(DailyParabolicDishYieldPanel);
