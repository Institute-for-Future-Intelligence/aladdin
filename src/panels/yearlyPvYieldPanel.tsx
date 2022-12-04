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
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space, Switch } from 'antd';
import { screenshot, showInfo } from '../helpers';
import { ReloadOutlined, SaveOutlined, UnorderedListOutlined } from '@ant-design/icons';
import i18n from '../i18n/i18n';
import { Rectangle } from '../models/Rectangle';
import { Util } from 'src/Util';

const Container = styled.div`
  position: fixed;
  top: 85px;
  right: 36px;
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

export interface YearlyPvYieldPanelProps {
  city: string | null;
}

const YearlyPvYieldPanel = ({ city }: YearlyPvYieldPanelProps) => {
  const language = useStore(Selector.language);
  const loggable = useStore(Selector.loggable);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const daysPerYear = useStore(Selector.world.daysPerYear) ?? 6;
  const now = new Date(useStore(Selector.world.date));
  const yearlyYield = useStore(Selector.yearlyPvYield);
  const individualOutputs = useStore(Selector.yearlyPvIndividualOutputs);
  const solarPanelLabels = useStore(Selector.solarPanelLabels);
  const countElementsByType = useStore(Selector.countElementsByType);
  const panelRect = useStore(Selector.viewState.yearlyPvYieldPanelRect);
  const runEvolution = useStore(Selector.runEvolution);
  const economics = useStore.getState().economicsParams;

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 500;
  const [curPosition, setCurPosition] = useState({
    x: panelRect ? Math.max(panelRect.x, wOffset - window.innerWidth) : 0,
    y: panelRect ? Math.min(panelRect.y, window.innerHeight - hOffset) : 0,
  });
  const [sum, setSum] = useState(0);
  const panelSumRef = useRef(new Map<string, number>());
  const resizeObserverRef = useRef<ResizeObserver>();

  const referenceX = MONTHS[now.getMonth()];
  const lang = { lng: language };
  const solarPanelCount = countElementsByType(ObjectType.SolarPanel);

  useEffect(() => {
    let s = 0;
    panelSumRef.current.clear();
    for (const datum of yearlyYield) {
      for (const prop in datum) {
        if (datum.hasOwnProperty(prop)) {
          if (prop !== 'Month') {
            s += datum[prop] as number;
            panelSumRef.current.set(prop, (panelSumRef.current.get(prop) ?? 0) + (datum[prop] as number));
          }
        }
      }
    }
    setSum(s);
  }, [yearlyYield]);

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
              if (!state.viewState.yearlyPvYieldPanelRect) {
                state.viewState.yearlyPvYieldPanelRect = new Rectangle(0, 0, 600, 400);
              }
              state.viewState.yearlyPvYieldPanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.yearlyPvYieldPanelRect.height = wrapperRef.current.offsetHeight;
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
  }, [panelRect, wOffset, hOffset]);

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.max(ui.x, wOffset - window.innerWidth),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    setCommonStore((state) => {
      if (!state.viewState.yearlyPvYieldPanelRect) {
        state.viewState.yearlyPvYieldPanelRect = new Rectangle(0, 0, 600, 400);
      }
      state.viewState.yearlyPvYieldPanelRect.x = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.yearlyPvYieldPanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showYearlyPvYieldPanel = false;
      if (loggable) {
        state.actionInfo = {
          name: 'Close Solar Panel Yearly Yield Graph',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  useEffect(() => {
    if (solarPanelCount < 2 && individualOutputs) {
      setCommonStore((state) => {
        state.yearlyPvIndividualOutputs = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solarPanelCount, individualOutputs]);

  const labelX = i18n.t('word.Month', lang);
  const labelY = i18n.t('solarPanelYieldPanel.Yield', lang);
  const yearScaleFactor = 12 / daysPerYear;
  let totalTooltip = '';
  if (individualOutputs) {
    panelSumRef.current.forEach(
      (value, key) => (totalTooltip += key + ': ' + (value * yearScaleFactor).toFixed(2) + '\n'),
    );
    totalTooltip += '——————————\n';
    totalTooltip +=
      i18n.t('word.Total', lang) + ': ' + (sum * yearScaleFactor).toFixed(2) + ' ' + i18n.t('word.kWh', lang);
  }

  const solarPanelNumber = Util.countAllSolarPanels();
  const totalYield = sum * yearScaleFactor;
  const totalProfit =
    totalYield * economics.electricitySellingPrice - solarPanelNumber * economics.operationalCostPerUnit * 365;

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
              {i18n.t('solarPanelYieldPanel.SolarPanelYearlyYield', lang) + ': '}
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
          <LineGraph
            type={GraphDataType.YearlyPvYield}
            chartType={individualOutputs ? ChartType.Line : ChartType.Area}
            dataSource={yearlyYield.map(({ Daylight, Clearness, ...item }) => item)}
            labels={solarPanelLabels}
            height={100}
            dataKeyAxisX={'Month'}
            labelX={labelX}
            labelY={labelY}
            unitY={i18n.t('word.kWh', lang)}
            yMin={0}
            curveType={'linear'}
            fractionDigits={2}
            referenceX={referenceX}
          />
          <Space style={{ alignSelf: 'center', direction: 'ltr' }}>
            {individualOutputs && solarPanelCount > 1 ? (
              <Space title={totalTooltip} style={{ cursor: 'pointer', border: '2px solid #ccc', padding: '4px' }}>
                {i18n.t('solarPanelYieldPanel.HoverForBreakdown', lang)}
              </Space>
            ) : (
              <>
                <Space>
                  {i18n.t('solarPanelYieldPanel.YearlyTotal', lang) +
                    ': ' +
                    totalYield.toFixed(2) +
                    ' ' +
                    i18n.t('word.kWh', lang)}
                </Space>
                {totalYield > 0 && (
                  <Space>{'| ' + i18n.t('solarPanelYieldPanel.Profit', lang) + ': $' + totalProfit.toFixed(2)}</Space>
                )}
              </>
            )}
            {!runEvolution && (
              <>
                {solarPanelCount > 1 && (
                  <Switch
                    title={i18n.t('solarPanelYieldPanel.ShowOutputsOfIndividualSolarPanels', lang)}
                    checkedChildren={<UnorderedListOutlined />}
                    unCheckedChildren={<UnorderedListOutlined />}
                    checked={individualOutputs}
                    onChange={(checked) => {
                      if (solarPanelCount === 0) {
                        showInfo(i18n.t('analysisManager.NoSolarPanelForAnalysis', lang));
                        return;
                      }
                      showInfo(i18n.t('message.SimulationStarted', lang));
                      // give it 0.1 second for the info to show up
                      setTimeout(() => {
                        setCommonStore((state) => {
                          state.simulationInProgress = true;
                          state.yearlyPvIndividualOutputs = checked;
                          state.runYearlySimulationForSolarPanels = true;
                          state.pauseYearlySimulationForSolarPanels = false;
                          if (loggable) {
                            state.actionInfo = {
                              name: 'Run Yearly Simulation For Solar Panels: ' + (checked ? 'Individual' : 'Total'),
                              timestamp: new Date().getTime(),
                            };
                          }
                        });
                      }, 100);
                    }}
                  />
                )}
                <Button
                  type="default"
                  icon={<ReloadOutlined />}
                  title={i18n.t('word.Update', lang)}
                  onClick={() => {
                    if (solarPanelCount === 0) {
                      showInfo(i18n.t('analysisManager.NoSolarPanelForAnalysis', lang));
                      return;
                    }
                    showInfo(i18n.t('message.SimulationStarted', lang));
                    // give it 0.1 second for the info to show up
                    setTimeout(() => {
                      setCommonStore((state) => {
                        state.simulationInProgress = true;
                        state.runYearlySimulationForSolarPanels = true;
                        state.pauseYearlySimulationForSolarPanels = false;
                        if (loggable) {
                          state.actionInfo = {
                            name: 'Run Yearly Simulation For Solar Panels',
                            timestamp: new Date().getTime(),
                          };
                        }
                      });
                    }, 100);
                  }}
                />
                <Button
                  type="default"
                  icon={<SaveOutlined />}
                  title={i18n.t('word.SaveAsImage', lang)}
                  onClick={() => {
                    screenshot('line-graph-' + labelX + '-' + labelY, 'yearly-pv-yield', {}).then(() => {
                      showInfo(i18n.t('message.ScreenshotSaved', lang));
                      if (loggable) {
                        setCommonStore((state) => {
                          state.actionInfo = {
                            name: 'Take Screenshot of Solar Panel Yearly Yield Graph',
                            timestamp: new Date().getTime(),
                          };
                        });
                      }
                    });
                  }}
                />
              </>
            )}
          </Space>
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default React.memo(YearlyPvYieldPanel);
