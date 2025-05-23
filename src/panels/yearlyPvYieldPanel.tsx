/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ChartType, DatumEntry, GraphDataType, ObjectType } from '../types';
import { FLOATING_WINDOW_OPACITY, MONTHS_ABBV, Z_INDEX_FRONT_PANEL } from '../constants';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space, Switch, Popover, Row, Col, Checkbox } from 'antd';
import { saveCsv, screenshot, showInfo } from '../helpers';
import {
  BarChartOutlined,
  CameraOutlined,
  CaretRightOutlined,
  ReloadOutlined,
  SaveOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Rectangle } from '../models/Rectangle';
import { Util } from 'src/Util';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks';
import { ElectricityConsumptionInput } from './electricityConsumptionInput';

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
`;

export interface YearlyPvYieldPanelProps {
  city: string | null;
}

const YearlyPvYieldPanel = React.memo(({ city }: YearlyPvYieldPanelProps) => {
  const loggable = useStore(Selector.loggable);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const daysPerYear = useStore(Selector.world.daysPerYear) ?? 6;
  const now = new Date(useStore(Selector.world.date));
  const yearlyYield = useDataStore(Selector.yearlyPvYield);
  const individualOutputs = useStore(Selector.yearlyPvIndividualOutputs);
  const solarPanelLabels = useDataStore(Selector.solarPanelLabels);
  const countElementsByType = useStore(Selector.countElementsByType);
  const panelRect = useStore(Selector.viewState.yearlyPvYieldPanelRect);
  const runEvolution = usePrimitiveStore(Selector.runEvolution);
  const economics = useStore.getState().economicsParams;
  const simulationInProgress = usePrimitiveStore(Selector.simulationInProgress);
  const selectedFloatingWindow = useStore(Selector.selectedFloatingWindow);
  const applyElectricityConsumptions = useStore(Selector.world.applyElectricityConsumptions);
  const monthlyElectricityConsumptions = useStore(Selector.world.monthlyElectricityConsumptions);

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
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const panelSumRef = useRef(new Map<string, number>());
  const resizeObserverRef = useRef<ResizeObserver>();
  const dataRef = useRef<DatumEntry[]>(new Array<DatumEntry>(12));

  const referenceX = MONTHS_ABBV[now.getMonth()];
  const lang = useLanguage();
  const solarPanelCount = countElementsByType(ObjectType.SolarPanel);

  useEffect(() => {
    let s = 0;
    panelSumRef.current.clear();
    for (const datum of yearlyYield) {
      for (const prop in datum) {
        if (Object.hasOwn(datum, prop)) {
          if (prop !== 'Month') {
            s += datum[prop] as number;
            panelSumRef.current.set(prop, (panelSumRef.current.get(prop) ?? 0) + (datum[prop] as number));
          }
        }
      }
    }
    setSum(s);
    // sum does not change when we run a breakdown simulation; so we use updateFlag to trigger re-rendering
    setUpdateFlag(!updateFlag);
    if (applyElectricityConsumptions) {
      dataRef.current = new Array<DatumEntry>(12 / daysPerYear);
      if (yearlyYield.length > 0) {
        for (let i = 0; i < yearlyYield.length; i++) {
          const utility = monthlyElectricityConsumptions
            ? monthlyElectricityConsumptions[i * yearScaleFactor] ?? 600
            : 600;
          dataRef.current[i] = { ...yearlyYield[i], Utility: utility };
        }
      } else {
        for (let i = 0; i < 12; i += yearScaleFactor) {
          const utility = monthlyElectricityConsumptions ? monthlyElectricityConsumptions[i] ?? 600 : 600;
          dataRef.current[i / yearScaleFactor] = { Month: MONTHS_ABBV[i], Utility: utility };
        }
      }
    } else {
      dataRef.current = [...yearlyYield];
    }
  }, [yearlyYield, monthlyElectricityConsumptions, applyElectricityConsumptions]);

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
  }, [panelRect, wOffset, hOffset]);

  useEffect(() => {
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
        if (state.graphState) state.graphState.yearlyPvIndividualOutputs = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solarPanelCount, individualOutputs]);

  const { t } = useTranslation();
  const labelX = t('word.Month', lang);
  const labelY = t('solarPanelYieldPanel.Yield', lang);

  const solarPanelNumber = Util.countAllSolarPanels();
  const yearScaleFactor = 12 / daysPerYear;
  const totalYield = sum * yearScaleFactor;
  const totalCost = solarPanelNumber * economics.operationalCostPerUnit * 365;
  const totalRevenue = totalYield * economics.electricitySellingPrice;
  const totalProfit = totalRevenue - totalCost;
  const emptyGraph = yearlyYield && yearlyYield[0] ? Object.keys(yearlyYield[0]).length === 0 : true;

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
          state.selectedFloatingWindow = 'yearlyPvYieldPanel';
        });
      }}
    >
      <Container
        ref={nodeRef}
        style={{ zIndex: selectedFloatingWindow === 'yearlyPvYieldPanel' ? Z_INDEX_FRONT_PANEL : 9 }}
      >
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
              {t('solarPanelYieldPanel.SolarPanelYearlyYield', lang) + ': '}
              <span style={{ fontSize: '10px' }}>
                {t('sensorPanel.WeatherDataFrom', lang) + ' ' + city + ' | ' + now.getFullYear()}
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
            type={GraphDataType.YearlyPvYield}
            chartType={individualOutputs ? ChartType.Line : ChartType.Area}
            dataSource={dataRef.current}
            labels={solarPanelLabels}
            height={100}
            dataKeyAxisX={'Month'}
            labelX={labelX}
            labelY={labelY}
            unitY={t('word.kWh', lang)}
            yMin={0}
            curveType={'linear'}
            fractionDigits={2}
            referenceX={referenceX}
          />
          {!simulationInProgress && (
            <Space style={{ alignSelf: 'center', direction: 'ltr' }}>
              {individualOutputs && solarPanelCount > 1 && panelSumRef.current.size > 0 ? (
                <Popover
                  title={t('shared.OutputBreakdown', lang)}
                  content={[...panelSumRef.current.entries()].map((e, i) => (
                    <React.Fragment key={i}>
                      <Row style={{ textAlign: 'right' }}>
                        <Col span={16} style={{ textAlign: 'right', paddingRight: '8px' }}>
                          {e[0] + ': '}
                        </Col>
                        <Col span={8}>{(e[1] * yearScaleFactor).toFixed(2)}</Col>
                      </Row>
                      {i === panelSumRef.current.size - 1 && (
                        <>
                          <hr></hr>
                          <div style={{ textAlign: 'right' }}>
                            {t('word.Total', lang) + ': ' + totalYield.toFixed(2) + ' ' + t('word.kWh', lang)}
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
                <>
                  {totalYield > 0 && (
                    <Space>
                      {t('solarPanelYieldPanel.YearlyTotal', lang) +
                        ': ' +
                        totalYield.toFixed(2) +
                        ' ' +
                        t('word.kWh', lang)}
                    </Space>
                  )}
                  {totalYield > 0 && (
                    <Popover
                      title={t('shared.MoreResults', lang)}
                      content={
                        <>
                          <Row style={{ width: '200px' }}>
                            <Col span={14}>{t('solarPanelYieldPanel.ModuleCount', lang) + ': '}</Col>
                            <Col span={10}>{solarPanelNumber}</Col>
                          </Row>
                          <Row style={{ width: '200px' }}>
                            <Col span={14}>{t('solarPanelYieldPanel.MeanYield', lang) + ': '}</Col>
                            <Col span={10}>{(totalYield / solarPanelNumber).toFixed(2)} kWh</Col>
                          </Row>
                          <Row style={{ width: '200px' }}>
                            <Col span={14}>{t('solarPanelYieldPanel.TotalCost', lang) + ': '}</Col>
                            <Col span={10}>${totalCost.toFixed(2)}</Col>
                          </Row>
                          <Row style={{ width: '200px' }}>
                            <Col span={14}>{t('solarPanelYieldPanel.TotalRevenue', lang) + ': '}</Col>
                            <Col span={10}>${totalRevenue.toFixed(2)}</Col>
                          </Row>
                          <Row style={{ width: '200px' }}>
                            <Col span={14}>{t('solarPanelYieldPanel.Profit', lang) + ': '}</Col>
                            <Col span={10}>{(totalProfit > 0 ? '$' : '-$') + Math.abs(totalProfit).toFixed(2)}</Col>
                          </Row>
                        </>
                      }
                    >
                      <Button type="default">{t('shared.MoreResults', lang)}</Button>
                    </Popover>
                  )}
                </>
              )}
              {!runEvolution && (
                <>
                  {solarPanelCount > 1 && (
                    <Switch
                      title={t('solarPanelYieldPanel.ShowOutputsOfIndividualSolarPanels', lang)}
                      checkedChildren={<UnorderedListOutlined />}
                      unCheckedChildren={<UnorderedListOutlined />}
                      checked={individualOutputs}
                      onChange={(checked) => {
                        if (solarPanelCount === 0) {
                          showInfo(t('analysisManager.NoSolarPanelForAnalysis', lang));
                          return;
                        }
                        showInfo(t('message.SimulationStarted', lang));
                        // give it 0.1 second for the info to show up
                        setTimeout(() => {
                          setCommonStore((state) => {
                            if (state.graphState) state.graphState.yearlyPvIndividualOutputs = checked;
                            if (loggable) {
                              state.actionInfo = {
                                name: 'Run Yearly Simulation For Solar Panels: ' + (checked ? 'Individual' : 'Total'),
                                timestamp: new Date().getTime(),
                              };
                            }
                          });
                          usePrimitiveStore.getState().set((state) => {
                            state.simulationInProgress = true;
                            state.runYearlySimulationForSolarPanels = true;
                            state.pauseYearlySimulationForSolarPanels = false;
                          });
                        }, 100);
                      }}
                    />
                  )}
                  <Button
                    type="default"
                    icon={emptyGraph ? <CaretRightOutlined /> : <ReloadOutlined />}
                    title={t(emptyGraph ? 'word.Run' : 'word.Update', lang)}
                    onClick={() => {
                      if (solarPanelCount === 0) {
                        showInfo(t('analysisManager.NoSolarPanelForAnalysis', lang));
                        return;
                      }
                      showInfo(t('message.SimulationStarted', lang));
                      // give it 0.1 second for the info to show up
                      setTimeout(() => {
                        setCommonStore((state) => {
                          if (loggable) {
                            state.actionInfo = {
                              name: 'Run Yearly Simulation For Solar Panels',
                              timestamp: new Date().getTime(),
                            };
                          }
                        });
                        usePrimitiveStore.getState().set((state) => {
                          state.simulationInProgress = true;
                          state.runYearlySimulationForSolarPanels = true;
                          state.pauseYearlySimulationForSolarPanels = false;
                        });
                      }, 100);
                    }}
                  />
                  <Popover
                    title={t('solarPanelYieldPanel.CompareWithElectricityConsumption', lang)}
                    content={
                      <>
                        <Row>
                          <Col span={12}>
                            <ElectricityConsumptionInput monthIndex={0} />
                          </Col>
                          <Col span={12}>
                            <ElectricityConsumptionInput monthIndex={1} />
                          </Col>
                        </Row>
                        <Row>
                          <Col span={12}>
                            <ElectricityConsumptionInput monthIndex={2} />
                          </Col>
                          <Col span={12}>
                            <ElectricityConsumptionInput monthIndex={3} />
                          </Col>
                        </Row>
                        <Row>
                          <Col span={12}>
                            <ElectricityConsumptionInput monthIndex={4} />
                          </Col>
                          <Col span={12}>
                            <ElectricityConsumptionInput monthIndex={5} />
                          </Col>
                        </Row>
                        <Row>
                          <Col span={12}>
                            <ElectricityConsumptionInput monthIndex={6} />
                          </Col>
                          <Col span={12}>
                            <ElectricityConsumptionInput monthIndex={7} />
                          </Col>
                        </Row>
                        <Row>
                          <Col span={12}>
                            <ElectricityConsumptionInput monthIndex={8} />
                          </Col>
                          <Col span={12}>
                            <ElectricityConsumptionInput monthIndex={9} />
                          </Col>
                        </Row>
                        <Row>
                          <Col span={12}>
                            <ElectricityConsumptionInput monthIndex={10} />
                          </Col>
                          <Col span={12}>
                            <ElectricityConsumptionInput monthIndex={11} />
                          </Col>
                        </Row>
                        <Row style={{ paddingTop: '12px' }}>
                          <Col span={12}>{t('word.Unit', lang) + ': ' + t('word.kWh', lang)}</Col>
                          <Col span={12} style={{ display: 'flex', justifyContent: 'right' }}>
                            <Checkbox
                              checked={applyElectricityConsumptions}
                              onChange={(e) => {
                                setCommonStore((state) => {
                                  state.world.applyElectricityConsumptions = e.target.checked;
                                });
                              }}
                            >
                              {t('word.Apply', lang)}
                            </Checkbox>
                          </Col>
                        </Row>
                      </>
                    }
                  >
                    <Button type="default" icon={<BarChartOutlined />} />
                  </Popover>
                  <Button
                    type="default"
                    icon={<CameraOutlined />}
                    title={t('word.SaveAsImage', lang)}
                    onClick={() => {
                      screenshot('line-graph-' + labelX + '-' + labelY, 'yearly-pv-yield').then(() => {
                        showInfo(t('message.ScreenshotSaved', lang));
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
                  {yearlyYield && yearlyYield.length > 0 && (
                    <Button
                      type="default"
                      icon={<SaveOutlined />}
                      title={t('word.SaveAsCsv', lang)}
                      onClick={() => {
                        saveCsv(yearlyYield, 'yearly-pv-yield.csv');
                        showInfo(t('message.CsvFileSaved', lang));
                        if (loggable) {
                          setCommonStore((state) => {
                            state.actionInfo = {
                              name: 'Export Solar Panel Yearly Yield Result as CSV',
                              timestamp: new Date().getTime(),
                            };
                          });
                        }
                      }}
                    />
                  )}
                </>
              )}
            </Space>
          )}
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
});

export default YearlyPvYieldPanel;
