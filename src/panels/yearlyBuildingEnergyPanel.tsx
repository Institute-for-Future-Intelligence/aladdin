/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ChartType, DatumEntry, EnergyUsage, GraphDataType, ObjectType } from '../types';
import { FLOATING_WINDOW_OPACITY, MONTHS } from '../constants';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space } from 'antd';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { screenshot, showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { Rectangle } from '../models/Rectangle';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { Util } from '../Util';
import { FoundationModel } from '../models/FoundationModel';
import { adjustEnergyUsage, computeOutsideTemperature } from '../analysis/heatTools';

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

export interface YearlyBuildingEnergyPanelProps {
  city: string | null;
}

const YearlyBuildingEnergyPanel = ({ city }: YearlyBuildingEnergyPanelProps) => {
  const world = useStore.getState().world;
  const getWeather = useStore(Selector.getWeather);
  const language = useStore(Selector.language);
  const loggable = useStore(Selector.loggable);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const elements = useStore.getState().elements;
  const getElementById = useStore(Selector.getElementById);
  const getFoundation = useStore(Selector.getFoundation);
  const now = new Date(useStore(Selector.world.date));
  const panelRect = useStore(Selector.viewState.yearlyBuildingEnergyPanelRect);
  const countElementsByType = useStore(Selector.countElementsByType);
  const monthlyHeatExchangeArrayMap = usePrimitiveStore(Selector.monthlyHeatExchangeArrayMap);
  const monthlySolarHeatGainArrayMap = usePrimitiveStore(Selector.monthlySolarHeatGainArrayMap);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : panelRect ? panelRect.width + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : panelRect ? panelRect.height + 100 : 600;
  const [curPosition, setCurPosition] = useState({
    x: panelRect ? Math.max(panelRect.x, wOffset - window.innerWidth) : 0,
    y: panelRect ? Math.min(panelRect.y, window.innerHeight - hOffset) : 0,
  });
  const [data, setData] = useState<DatumEntry[]>([]);
  const [heaterSum, setHeaterSum] = useState(0);
  const [acSum, setAcSum] = useState(0);
  const [netSum, setNetSum] = useState(0);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const lang = { lng: language };
  const weather = getWeather(city ?? 'Boston MA, USA');
  const labels = ['Heater', 'AC', 'Net'];
  const referenceX = MONTHS[now.getMonth()];
  const daysPerYear = world.daysPerYear ?? 6;
  const monthInterval = 12 / daysPerYear;

  useEffect(() => {
    const sum: DatumEntry[] = [];
    let sumHeater = 0;
    let sumAc = 0;
    const dataLabels = [];
    const hourlyHeat = new Array(24);
    const hourlyAc = new Array(24);
    for (let i = 0; i < daysPerYear; i++) {
      const date = new Date(now);
      date.setMonth(i * monthInterval, 22);
      // get the highest and lowest temperatures of the day from the weather data
      const outsideTemperatureRange = computeOutsideTemperature(
        date,
        weather.lowestTemperatures,
        weather.highestTemperatures,
      );
      hourlyHeat.fill(0);
      hourlyAc.fill(0);
      const datum: DatumEntry = {};
      const energy = new Map<string, EnergyUsage>();
      for (const e of elements) {
        if (Util.onBuildingEnvelope(e)) {
          const exchange = monthlyHeatExchangeArrayMap.get(e.id);
          if (exchange && exchange.length === daysPerYear) {
            for (let j = 0; j < 24; j++) {
              if (exchange[i][j] < 0) {
                hourlyHeat[j] += exchange[i][j];
              } else {
                hourlyAc[j] += exchange[i][j];
              }
            }
            const f = getFoundation(e);
            if (f) {
              let energyUsage = energy.get(f.id);
              if (!energyUsage) {
                energyUsage = { heater: 0, ac: 0, label: f.label } as EnergyUsage;
                energy.set(f.id, energyUsage);
                dataLabels.push(f.label);
              }
              for (let j = 0; j < 24; j++) {
                if (exchange[i][j] < 0) {
                  energyUsage.heater += exchange[i][j];
                } else {
                  energyUsage.ac += exchange[i][j];
                }
              }
            }
          }
        }
      }
      // deal with the solar heat gain
      for (const e of elements) {
        if (e.type === ObjectType.Foundation) {
          const gain = monthlySolarHeatGainArrayMap.get(e.id);
          if (gain && gain.length === daysPerYear) {
            const energyUsage = energy.get(e.id);
            if (energyUsage) {
              for (let j = 0; j < 24; j++) {
                if (hourlyHeat[j] < 0) {
                  // It must be cold outside. Solar heat gain decreases heating burden in this case.
                  energyUsage.heater += gain[i][j];
                } else if (hourlyAc[j] > 0) {
                  // It must be hot outside. Solar heat gain increases cooling burden in this case.
                  energyUsage.ac += gain[i][j];
                }
              }
            }
          }
        }
      }
      //console.log(i, energy)
      if (energy.size > 1) {
        let index = 1;
        for (const key of energy.keys()) {
          datum['Month'] = MONTHS[i * monthInterval];
          const value = energy.get(key);
          if (value) {
            const elem = getElementById(key);
            if (elem && elem.type === ObjectType.Foundation) {
              const f = elem as FoundationModel;
              const setpoint = f.hvacSystem?.thermostatSetpoint ?? 20;
              const threshold = f.hvacSystem?.temperatureThreshold ?? 3;
              const id = value.label ?? index;
              const adjustedHeat =
                30 * Math.abs(adjustEnergyUsage(outsideTemperatureRange, value.heater, setpoint, threshold));
              const adjustedAc = 30 * adjustEnergyUsage(outsideTemperatureRange, value.ac, setpoint, threshold);
              datum['Heater ' + id] = adjustedHeat;
              datum['AC ' + id] = adjustedAc;
              datum['Net ' + id] = adjustedHeat + adjustedAc;
              sumHeater += adjustedHeat;
              sumAc += adjustedAc;
            }
          }
          index++;
        }
      } else {
        for (const key of energy.keys()) {
          datum['Month'] = MONTHS[i * monthInterval];
          const value = energy.get(key);
          if (value) {
            const elem = getElementById(key);
            if (elem && elem.type === ObjectType.Foundation) {
              const f = elem as FoundationModel;
              const setpoint = f.hvacSystem?.thermostatSetpoint ?? 20;
              const threshold = f.hvacSystem?.temperatureThreshold ?? 3;
              const adjustedHeat =
                30 * Math.abs(adjustEnergyUsage(outsideTemperatureRange, value.heater, setpoint, threshold));
              if (i === 3) console.log(outsideTemperatureRange, value.heater, adjustedHeat / 30);
              const adjustedAc = 30 * adjustEnergyUsage(outsideTemperatureRange, value.ac, setpoint, threshold);
              datum['Heater'] = adjustedHeat;
              datum['AC'] = adjustedAc;
              datum['Net'] = adjustedHeat + adjustedAc;
              sumHeater += adjustedHeat;
              sumAc += adjustedAc;
            }
          }
        }
      }
      sum.push(datum);
    }
    setData(sum);
    setHeaterSum(sumHeater * monthInterval);
    setAcSum(sumAc * monthInterval);
    setNetSum((sumHeater + sumAc) * monthInterval);
  }, [monthlyHeatExchangeArrayMap, daysPerYear]);

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
              {i18n.t('buildingEnergyPanel.YearlyBuildingEnergy', lang) + ': '}
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
            type={GraphDataType.YearlyBuildingEnergy}
            chartType={ChartType.Line}
            dataSource={data}
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
          <Space style={{ alignSelf: 'center', direction: 'ltr' }}>
            <Space style={{ cursor: 'default' }}>
              {i18n.t('buildingEnergyPanel.Heater', lang) + ': ' + heaterSum.toFixed(1)}
            </Space>
            <Space style={{ cursor: 'default' }}>
              {i18n.t('buildingEnergyPanel.AC', lang) + ': ' + acSum.toFixed(1)}
            </Space>
            <Space style={{ cursor: 'default' }}>
              {i18n.t('buildingEnergyPanel.Net', lang) + ': ' + netSum.toFixed(1)}
            </Space>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              title={i18n.t('word.Update', lang)}
              onClick={() => {
                const foundationCount = countElementsByType(ObjectType.Foundation);
                if (foundationCount === 0) {
                  showInfo(i18n.t('analysisManager.NoBuildingForAnalysis', lang));
                  return;
                }
                showInfo(i18n.t('message.SimulationStarted', lang));
                // give it 0.1 second for the info to show up
                setTimeout(() => {
                  setCommonStore((state) => {
                    state.runYearlyThermalSimulation = true;
                    state.pauseYearlyThermalSimulation = false;
                    state.simulationInProgress = true;
                    if (loggable) {
                      state.actionInfo = { name: 'Run Yearly Thermal Simulation', timestamp: new Date().getTime() };
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
                screenshot('line-graph-' + labelX + '-' + labelY, 'yearly-building-energy', {}).then(() => {
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
          </Space>
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default React.memo(YearlyBuildingEnergyPanel);
