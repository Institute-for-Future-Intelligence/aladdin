/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { BuildingCompletionStatus, DatumEntry, GraphDataType } from '../types';
import { FLOATING_WINDOW_OPACITY, MONTHS_ABBV, Z_INDEX_FRONT_PANEL } from '../constants';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Popover, Space } from 'antd';
import { CameraOutlined, CaretRightOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { saveCsv, screenshot, showError, showInfo, showWarning } from '../helpers';
import i18n from '../i18n/i18n';
import { Rectangle } from '../models/Rectangle';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDailyEnergySorter } from '../analysis/energyHooks';
import BuildingEnergyGraph from '../components/buildingEnergyGraph';
import { Util } from '../Util';
import { checkBuilding, CheckStatus } from '../analysis/heatTools';
import { useDataStore } from '../stores/commonData';
import { useLanguage, useWeather } from '../hooks';

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

export interface YearlyBuildingEnergyPanelProps {
  city: string | null;
}

const YearlyBuildingEnergyPanel = React.memo(({ city }: YearlyBuildingEnergyPanelProps) => {
  const world = useStore.getState().world;
  const loggable = useStore(Selector.loggable);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const selectNone = useStore(Selector.selectNone);
  const now = new Date(useStore(Selector.world.date));
  const panelRect = useStore(Selector.viewState.yearlyBuildingEnergyPanelRect);
  const flagOfDailySimulation = usePrimitiveStore(Selector.flagOfDailySimulation);
  const runYearlySimulation = usePrimitiveStore(Selector.runYearlyThermalSimulation);
  const clearYearlySimulationResultsFlag = usePrimitiveStore(Selector.clearYearlySimulationResultsFlag);
  const simulationInProgress = usePrimitiveStore(Selector.simulationInProgress);
  const hasSolarPanels = Util.hasSolarPanels(useStore.getState().elements);
  const setTotalBuildingHeater = useDataStore(Selector.setTotalBuildingHeater);
  const setTotalBuildingAc = useDataStore(Selector.setTotalBuildingAc);
  const setTotalBuildingSolarPanel = useDataStore(Selector.setTotalBuildingSolarPanel);
  const selectedFloatingWindow = useStore(Selector.selectedFloatingWindow);

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

  const lang = useLanguage();
  const weather = useWeather(city);
  const referenceX = MONTHS_ABBV[now.getMonth()];
  const daysPerYear = world.daysPerYear ?? 6;
  const monthInterval = 12 / daysPerYear;

  const [heaterSum, setHeaterSum] = useState(0);
  const [acSum, setAcSum] = useState(0);
  const [solarPanelSum, setSolarPanelSum] = useState(0);
  const [netSum, setNetSum] = useState(0);
  const [labels, setLabels] = useState(['Heater', 'AC', 'Solar', 'Net']);
  const [data, setData] = useState<DatumEntry[]>([]);

  const { sum, sumHeaterMap, sumAcMap, sumSolarPanelMap, dataLabels } = useDailyEnergySorter(
    now,
    weather,
    hasSolarPanels,
  );

  const resultRef = useRef<DatumEntry[]>(new Array(daysPerYear).fill({}));
  const heaterSumRef = useRef<number[]>(new Array(daysPerYear).fill(0));
  const acSumRef = useRef<number[]>(new Array(daysPerYear).fill(0));
  const solarPanelSumRef = useRef<number[]>(new Array(daysPerYear).fill(0));
  const netSumRef = useRef<number[]>(new Array(daysPerYear).fill(0));
  const tooltipHeaterBreakdown = useRef<string[]>([]);
  const tooltipAcBreakdown = useRef<string[]>([]);
  const tooltipSolarPanelBreakdown = useRef<string[]>([]);
  const tooltipNetBreakdown = useRef<string[]>([]);

  useEffect(() => {
    clearResults();
  }, [daysPerYear, clearYearlySimulationResultsFlag]);

  useEffect(() => {
    if (runYearlySimulation) {
      clearResults();
    }
  }, [runYearlySimulation]);

  const clearResults = () => {
    resultRef.current = new Array(daysPerYear).fill({});
    heaterSumRef.current = new Array(daysPerYear).fill(0);
    acSumRef.current = new Array(daysPerYear).fill(0);
    solarPanelSumRef.current = new Array(daysPerYear).fill(0);
    netSumRef.current = new Array(daysPerYear).fill(0);
    setData([]);
    setHeaterSum(0);
    setAcSum(0);
    setSolarPanelSum(0);
    setNetSum(0);
    setLabels([]);
  };

  useEffect(() => {
    const indexOfMonth = Math.floor(now.getMonth() / monthInterval);
    const countBuildings = (Object.keys(sum[0]).length - 1) / (hasSolarPanels ? 4 : 3);
    tooltipHeaterBreakdown.current = [];
    tooltipAcBreakdown.current = [];
    tooltipNetBreakdown.current = [];
    tooltipSolarPanelBreakdown.current = [];
    if (countBuildings > 1) {
      const heaterMap = new Map<string, number>();
      const acMap = new Map<string, number>();
      const solarPanelMap = new Map<string, number>();
      const netMap = new Map<string, number>();
      for (const h of sum) {
        let i = 0;
        for (let j = 0; j < countBuildings; j++) {
          // If the data label is not set, we will give it a default label by its index,
          // but some labels may be set, so we have to use an incrementer here.
          if (!dataLabels[j]) i++;
          const id = dataLabels[j] ?? i;
          let heater = heaterMap.get(id);
          if (heater === undefined) heater = 0;
          heater += h['Heater ' + id] as number;
          heaterMap.set(id, heater);
          let ac = acMap.get(id);
          if (ac === undefined) ac = 0;
          ac += h['AC ' + id] as number;
          acMap.set(id, ac);
          let net = netMap.get(id);
          if (net === undefined) net = 0;
          net += h['Net ' + id] as number;
          netMap.set(id, net);
          if (hasSolarPanels) {
            let solarPanel = solarPanelMap.get(id);
            if (solarPanel === undefined) solarPanel = 0;
            solarPanel += h['Solar ' + id] as number;
            solarPanelMap.set(id, solarPanel);
          }
        }
      }
      const datum: DatumEntry = {};
      datum['Month'] = MONTHS_ABBV[now.getMonth()];
      const l = [];
      let i = 0;
      for (let index = 0; index < countBuildings; index++) {
        // If the data label is not set, we will give it a default label by its index,
        // but some labels may be set, so we have to use an incrementer here.
        if (!dataLabels[index]) i++;
        const id = dataLabels[index] ?? i;
        if (hasSolarPanels) {
          l.push('Heater ' + id, 'AC ' + id, 'Solar ' + id, 'Net ' + id);
          datum['Solar ' + id] = (solarPanelMap.get(id) ?? 0) * 30;
        } else {
          l.push('Heater ' + id, 'AC ' + id, 'Net ' + id);
        }
        datum['Heater ' + id] = (heaterMap.get(id) ?? 0) * 30;
        datum['AC ' + id] = (acMap.get(id) ?? 0) * 30;
        datum['Net ' + id] = (netMap.get(id) ?? 0) * 30;
      }
      setLabels(l);
      resultRef.current[indexOfMonth] = datum;
      i = 0;
      for (let index = 0; index < countBuildings; index++) {
        // If the data label is not set, we will give it a default label by its index,
        // but some labels may be set, so we have to use an incrementer here.
        if (!dataLabels[index]) i++;
        let totalHeater = 0;
        let totalAc = 0;
        let totalSolarPanel = 0;
        let totalNet = 0;
        const id = dataLabels[index] ?? i;
        for (const res of resultRef.current) {
          totalHeater += res['Heater ' + id] as number;
          totalAc += res['AC ' + id] as number;
          totalNet += res['Net ' + id] as number;
          if (hasSolarPanels) totalSolarPanel += res['Solar ' + id] as number;
        }
        totalHeater *= monthInterval;
        totalAc *= monthInterval;
        totalNet *= monthInterval;
        tooltipHeaterBreakdown.current.push(id + ': ' + totalHeater.toFixed(1) + ' ' + i18n.t('word.kWh', lang));
        tooltipAcBreakdown.current.push(id + ': ' + totalAc.toFixed(1) + ' ' + i18n.t('word.kWh', lang));
        tooltipNetBreakdown.current.push(id + ': ' + totalNet.toFixed(1) + ' ' + i18n.t('word.kWh', lang));
        if (totalSolarPanel !== 0) {
          totalSolarPanel *= -monthInterval;
          tooltipSolarPanelBreakdown.current.push(
            id + ': ' + totalSolarPanel.toFixed(1) + ' ' + i18n.t('word.kWh', lang),
          );
        }
      }
    } else {
      // only one building
      let heater = 0;
      let ac = 0;
      let net = 0;
      let bid = '';
      for (const k in sum[0]) {
        if (k.startsWith('Heater')) {
          if (k.length > 6) bid = ' ' + k.substring(6).trim();
          break;
        }
      }
      const heaterId = 'Heater' + bid;
      const acId = 'AC' + bid;
      const netId = 'Net' + bid;
      if (hasSolarPanels) {
        const solarId = 'Solar' + bid;
        let solarPanel = 0;
        setLabels([heaterId, acId, solarId, netId]);
        for (const h of sum) {
          heater += h[heaterId] as number;
          ac += h[acId] as number;
          solarPanel += h[solarId] as number;
          net += h[netId] as number;
        }
        const datum: DatumEntry = {};
        datum['Month'] = MONTHS_ABBV[now.getMonth()];
        datum[heaterId] = 30 * heater;
        datum[acId] = 30 * ac;
        datum[solarId] = 30 * solarPanel;
        datum[netId] = 30 * net;
        resultRef.current[indexOfMonth] = datum;
      } else {
        setLabels([heaterId, acId, netId]);
        for (const h of sum) {
          heater += h[heaterId] as number;
          ac += h[acId] as number;
          net += h[netId] as number;
        }
        const datum: DatumEntry = {};
        datum['Month'] = MONTHS_ABBV[now.getMonth()];
        datum[heaterId] = 30 * heater;
        datum[acId] = 30 * ac;
        datum[netId] = 30 * net;
        resultRef.current[indexOfMonth] = datum;
      }
    }
    setData([...resultRef.current]);
    let sumHeater = 0;
    if (sumHeaterMap) {
      for (const key of sumHeaterMap.keys()) {
        sumHeater += sumHeaterMap.get(key) ?? 0;
      }
    }
    let sumAc = 0;
    if (sumAcMap) {
      for (const key of sumAcMap.keys()) {
        sumAc += sumAcMap.get(key) ?? 0;
      }
    }
    let sumSolarPanel = 0;
    if (sumSolarPanelMap && hasSolarPanels) {
      for (const key of sumSolarPanelMap.keys()) {
        sumSolarPanel += sumSolarPanelMap.get(key) ?? 0;
      }
    }
    heaterSumRef.current[indexOfMonth] = sumHeater * monthInterval * 30;
    acSumRef.current[indexOfMonth] = sumAc * monthInterval * 30;
    solarPanelSumRef.current[indexOfMonth] = sumSolarPanel * monthInterval * 30;
    netSumRef.current[indexOfMonth] =
      heaterSumRef.current[indexOfMonth] + acSumRef.current[indexOfMonth] - solarPanelSumRef.current[indexOfMonth];
    const totalHeater = heaterSumRef.current.slice(0, indexOfMonth + 1).reduce((pv, cv) => pv + cv, 0);
    setHeaterSum(totalHeater);
    const totalAc = acSumRef.current.slice(0, indexOfMonth + 1).reduce((pv, cv) => pv + cv, 0);
    setAcSum(totalAc);
    const totalSolarPanel = solarPanelSumRef.current.slice(0, indexOfMonth + 1).reduce((pv, cv) => pv + cv, 0);
    setSolarPanelSum(totalSolarPanel);
    setNetSum(netSumRef.current.slice(0, indexOfMonth + 1).reduce((pv, cv) => pv + cv, 0));
    // for logger
    setTotalBuildingHeater(totalHeater);
    setTotalBuildingAc(totalAc);
    setTotalBuildingSolarPanel(totalSolarPanel);
    if (!usePrimitiveStore.getState().showSolarRadiationHeatmap) {
      useDataStore.getState().clearDataStore();
    }
  }, [flagOfDailySimulation]);

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
              if (!state.viewState.yearlyBuildingEnergyPanelRect) {
                state.viewState.yearlyBuildingEnergyPanelRect = new Rectangle(0, 0, 600, 500);
              }
              state.viewState.yearlyBuildingEnergyPanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.yearlyBuildingEnergyPanelRect.height = wrapperRef.current.offsetHeight;
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
      if (!state.viewState.yearlyBuildingEnergyPanelRect) {
        state.viewState.yearlyBuildingEnergyPanelRect = new Rectangle(0, 0, 600, 360);
      }
      state.viewState.yearlyBuildingEnergyPanelRect.x = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.yearlyBuildingEnergyPanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showYearlyBuildingEnergyPanel = false;
      if (loggable) {
        state.actionInfo = {
          name: 'Close Yearly Building Energy Graph',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const labelX = i18n.t('word.Month', lang);
  const labelY = i18n.t('word.Energy', lang);
  const emptyGraph = data && data[0] ? Object.keys(data[0]).length === 0 : true;

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
          state.selectedFloatingWindow = 'yearlyBuildingEnergyPanel';
        });
      }}
    >
      <Container
        ref={nodeRef}
        style={{ zIndex: selectedFloatingWindow === 'yearlyBuildingEnergyPanel' ? Z_INDEX_FRONT_PANEL : 9 }}
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
              {i18n.t('buildingEnergyPanel.YearlyBuildingEnergy', lang) + ': '}
              <span style={{ fontSize: '10px' }}>
                {i18n.t('sensorPanel.WeatherDataFrom', lang) + ' ' + city + ' | ' + now.getFullYear()}
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
          <BuildingEnergyGraph
            type={GraphDataType.YearlyBuildingEnergy}
            dataSource={data}
            hasSolarPanels={hasSolarPanels}
            labels={labels}
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
          {!simulationInProgress && (
            <Space style={{ alignSelf: 'center', direction: 'ltr' }}>
              {tooltipHeaterBreakdown.current.length === 0 ? (
                <Space style={{ cursor: 'default' }}>
                  {i18n.t('buildingEnergyPanel.Heater', lang) + ': ' + heaterSum.toFixed(0)}
                </Space>
              ) : (
                <Popover
                  content={tooltipHeaterBreakdown.current.map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
                >
                  <Space style={{ cursor: 'help' }}>
                    {i18n.t('buildingEnergyPanel.Heater', lang) + ': ' + heaterSum.toFixed(0)}
                  </Space>
                </Popover>
              )}
              {tooltipAcBreakdown.current.length === 0 ? (
                <Space style={{ cursor: 'default' }}>
                  {i18n.t('buildingEnergyPanel.AC', lang) + ': ' + acSum.toFixed(0)}
                </Space>
              ) : (
                <Popover
                  content={tooltipAcBreakdown.current.map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
                >
                  <Space style={{ cursor: 'help' }}>
                    {i18n.t('buildingEnergyPanel.AC', lang) + ': ' + acSum.toFixed(0)}
                  </Space>
                </Popover>
              )}
              {solarPanelSum !== 0 && (
                <>
                  {tooltipSolarPanelBreakdown.current.length === 0 ? (
                    <Space style={{ cursor: 'default' }}>
                      {i18n.t('buildingEnergyPanel.SolarPanel', lang) + ': ' + solarPanelSum.toFixed(0)}
                    </Space>
                  ) : (
                    <Popover
                      content={tooltipSolarPanelBreakdown.current.map((e, i) => (
                        <div key={i}>{e}</div>
                      ))}
                    >
                      <Space style={{ cursor: 'help' }}>
                        {i18n.t('buildingEnergyPanel.SolarPanel', lang) + ': ' + solarPanelSum.toFixed(0)}
                      </Space>
                    </Popover>
                  )}
                </>
              )}
              {tooltipNetBreakdown.current.length === 0 ? (
                <Space style={{ cursor: 'default' }}>
                  {i18n.t('buildingEnergyPanel.Net', lang) + ': ' + netSum.toFixed(0)}
                </Space>
              ) : (
                <Popover
                  content={tooltipNetBreakdown.current.map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
                >
                  <Space style={{ cursor: 'help' }}>
                    {i18n.t('buildingEnergyPanel.Net', lang) + ': ' + netSum.toFixed(0)}
                  </Space>
                </Popover>
              )}
              <Button
                type="default"
                icon={emptyGraph ? <CaretRightOutlined /> : <ReloadOutlined />}
                title={i18n.t(emptyGraph ? 'word.Run' : 'word.Update', lang)}
                onClick={() => {
                  const elements = useStore.getState().elements;
                  const countElementsByType = useStore.getState().countElementsByType;
                  const getChildrenOfType = useStore.getState().getChildrenOfType;
                  const checkResult = checkBuilding(elements, countElementsByType, getChildrenOfType);
                  if (checkResult.status === CheckStatus.NO_BUILDING) {
                    showInfo(i18n.t('analysisManager.NoBuildingForAnalysis', lang));
                    return;
                  }
                  if (checkResult.status === CheckStatus.AT_LEAST_ONE_BAD_NO_GOOD) {
                    let errorType;
                    switch (checkResult.buildingCompletion) {
                      case BuildingCompletionStatus.WALL_DISJOINED:
                        errorType = i18n.t('message.WallsAreNotConnected', lang);
                        break;
                      case BuildingCompletionStatus.WALL_EMPTY:
                        errorType = i18n.t('message.BuildingContainsEmptyWall', lang);
                        break;
                      case BuildingCompletionStatus.ROOF_MISSING:
                        errorType = i18n.t('message.BuildingRoofMissing', lang);
                        break;
                      default:
                        errorType = i18n.t('message.UnknownErrors', lang);
                    }
                    showError(i18n.t('message.SimulationWillNotStartDueToErrors', lang) + ': ' + errorType);
                    return;
                  }
                  if (checkResult.status === CheckStatus.AT_LEAST_ONE_BAD_AT_LEAST_ONE_GOOD) {
                    showWarning(i18n.t('message.SimulationWillStartDespiteWarnings', lang));
                  }
                  showInfo(i18n.t('message.SimulationStarted', lang));
                  // give it 0.1 second for the info to show up
                  setTimeout(() => {
                    selectNone();
                    usePrimitiveStore.getState().set((state) => {
                      state.runYearlyThermalSimulation = true;
                      state.pauseYearlyThermalSimulation = false;
                      state.simulationInProgress = true;
                    });
                    setCommonStore((state) => {
                      if (loggable) {
                        state.actionInfo = {
                          name: 'Run Yearly Building Energy Analysis',
                          timestamp: new Date().getTime(),
                        };
                      }
                    });
                  }, 100);
                }}
              />
              <Button
                type="default"
                icon={<CameraOutlined />}
                title={i18n.t('word.SaveAsImage', lang)}
                onClick={() => {
                  screenshot('line-graph-' + labelX + '-' + labelY, 'yearly-building-energy').then(() => {
                    showInfo(i18n.t('message.ScreenshotSaved', lang));
                    if (loggable) {
                      setCommonStore((state) => {
                        state.actionInfo = {
                          name: 'Take Screenshot of Yearly Building Energy Graph',
                          timestamp: new Date().getTime(),
                        };
                      });
                    }
                  });
                }}
              />
              {resultRef.current && resultRef.current.length > 0 && (
                <Button
                  type="default"
                  icon={<SaveOutlined />}
                  title={i18n.t('word.SaveAsCsv', lang)}
                  onClick={() => {
                    saveCsv(resultRef.current, 'yearly-building-energy.csv');
                    showInfo(i18n.t('message.CsvFileSaved', lang));
                    if (loggable) {
                      setCommonStore((state) => {
                        state.actionInfo = {
                          name: 'Export Yearly Building Energy Result as CSV',
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
});

export default YearlyBuildingEnergyPanel;
