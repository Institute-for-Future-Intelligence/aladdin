/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ChartType, DatumEntry, EnergyUsage, GraphDataType, ObjectType } from '../types';
import moment from 'moment';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space } from 'antd';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { screenshot, showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { Rectangle } from '../models/Rectangle';
import { FLOATING_WINDOW_OPACITY } from '../constants';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { Util } from '../Util';
import { computeOutsideTemperature } from '../analysis/heatTools';
import { FoundationModel } from '../models/FoundationModel';

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

export interface DailyBuildingEnergyPanelProps {
  city: string | null;
}

const DailyBuildingEnergyPanel = ({ city }: DailyBuildingEnergyPanelProps) => {
  const language = useStore(Selector.language);
  const loggable = useStore(Selector.loggable);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const getWeather = useStore(Selector.getWeather);
  const getFoundation = useStore(Selector.getFoundation);
  const getElementById = useStore(Selector.getElementById);
  const elements = useStore.getState().elements;
  const now = new Date(useStore(Selector.world.date));
  const hourlyHeatExchangeArrayMap = usePrimitiveStore(Selector.hourlyHeatExchangeArrayMap);
  const hourlySolarHeatGainArrayMap = usePrimitiveStore(Selector.hourlySolarHeatGainArrayMap);
  const panelRect = useStore(Selector.viewState.dailyBuildingEnergyPanelRect);
  const countElementsByType = useStore(Selector.countElementsByType);

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
  const [data, setData] = useState<DatumEntry[]>([]);
  const [heaterSum, setHeaterSum] = useState(0);
  const [acSum, setAcSum] = useState(0);
  const [netSum, setNetSum] = useState(0);
  const [labels, setLabels] = useState(['Heater', 'AC', 'Net']);

  const lang = { lng: language };
  const weather = getWeather(city ?? 'Boston MA, USA');

  /*
   If the lowest outside temperature is higher than the threshold, don't turn on the heater.
   If the highest outside temperature is lower than the threshold, don't turn on the air conditioner.
  */
  const adjustEnergyUsage = (
    outsideTemperatureRange: { high: number; low: number },
    heatExchange: number,
    setpoint: number,
    threshold: number,
  ) => {
    if (
      (heatExchange < 0 && outsideTemperatureRange.low >= setpoint - threshold) ||
      (heatExchange > 0 && outsideTemperatureRange.high <= setpoint + threshold)
    ) {
      return 0;
    }
    // negative heat exchange goes to heater, positive heat exchange goes to air conditioner
    return heatExchange;
  };

  useEffect(() => {
    // get the highest and lowest temperatures of the day from the weather data
    const outsideTemperatureRange = computeOutsideTemperature(
      now,
      weather.lowestTemperatures,
      weather.highestTemperatures,
    );
    const sum: DatumEntry[] = [];
    let sumHeater = 0;
    let sumAc = 0;
    const dataLabels = [];
    for (let i = 0; i < 24; i++) {
      const datum: DatumEntry = {};
      const energy = new Map<string, EnergyUsage>();
      for (const e of elements) {
        if (Util.onBuildingEnvelope(e)) {
          const h = hourlyHeatExchangeArrayMap.get(e.id);
          if (h) {
            const f = getFoundation(e);
            if (f) {
              let energyUsage = energy.get(f.id);
              if (energyUsage === undefined) {
                energyUsage = { heater: 0, ac: 0, label: f.label } as EnergyUsage;
                energy.set(f.id, energyUsage);
                dataLabels.push(f.label);
              }
              if (h[i] < 0) {
                energyUsage.heater += h[i];
              } else {
                energyUsage.ac += h[i];
              }
            }
          }
        }
      }
      // deal with the solar heat gain
      for (const e of elements) {
        if (e.type === ObjectType.Foundation) {
          const h = hourlySolarHeatGainArrayMap.get(e.id);
          const energyUsage = energy.get(e.id);
          if (energyUsage && h) {
            if (energyUsage.heater < 0) {
              // It must be cold outside. Solar heat gain decreases heating burden in this case.
              energyUsage.heater += h[i];
            } else if (energyUsage.ac > 0) {
              // It must be hot outside. Solar heat gain increases cooling burden in this case.
              energyUsage.ac += h[i];
            }
          }
        }
      }
      if (energy.size > 1) {
        let index = 1;
        for (const key of energy.keys()) {
          datum['Hour'] = i;
          const value = energy.get(key);
          if (value) {
            const elem = getElementById(key);
            if (elem && elem.type === ObjectType.Foundation) {
              const f = elem as FoundationModel;
              const setpoint = f.hvacSystem?.thermostatSetpoint ?? 20;
              const threshold = f.hvacSystem?.temperatureThreshold ?? 3;
              const id = value.label ?? index;
              const adjustedHeat = Math.abs(
                adjustEnergyUsage(outsideTemperatureRange, value.heater, setpoint, threshold),
              );
              const adjustedAc = adjustEnergyUsage(outsideTemperatureRange, value.ac, setpoint, threshold);
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
          datum['Hour'] = i;
          const value = energy.get(key);
          if (value) {
            const elem = getElementById(key);
            if (elem && elem.type === ObjectType.Foundation) {
              const f = elem as FoundationModel;
              const setpoint = f.hvacSystem?.thermostatSetpoint ?? 20;
              const threshold = f.hvacSystem?.temperatureThreshold ?? 3;
              const adjustedHeat = Math.abs(
                adjustEnergyUsage(outsideTemperatureRange, value.heater, setpoint, threshold),
              );
              const adjustedAc = adjustEnergyUsage(outsideTemperatureRange, value.ac, setpoint, threshold);
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
    setHeaterSum(sumHeater);
    setAcSum(sumAc);
    setNetSum(sumHeater + sumAc);
    const count = countElementsByType(ObjectType.Foundation);
    if (count > 1) {
      const l = [];
      for (let index = 0; index < count; index++) {
        const id = dataLabels[index] ?? index + 1;
        l.push('Heater ' + id, 'AC ' + id, 'Net ' + id);
      }
      setLabels(l);
    } else {
      setLabels(['Heater', 'AC', 'Net']);
    }
  }, [hourlyHeatExchangeArrayMap, hourlySolarHeatGainArrayMap]);

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
              if (!state.viewState.dailyBuildingEnergyPanelRect) {
                state.viewState.dailyBuildingEnergyPanelRect = new Rectangle(0, 0, 600, 360);
              }
              state.viewState.dailyBuildingEnergyPanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.dailyBuildingEnergyPanelRect.height = wrapperRef.current.offsetHeight;
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
      if (!state.viewState.dailyBuildingEnergyPanelRect) {
        state.viewState.dailyBuildingEnergyPanelRect = new Rectangle(0, 0, 600, 360);
      }
      state.viewState.dailyBuildingEnergyPanelRect.x = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.dailyBuildingEnergyPanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showDailyBuildingEnergyPanel = false;
      if (loggable) {
        state.actionInfo = {
          name: 'Close Daily Building Energy Graph',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const labelX = i18n.t('word.Hour', lang);
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
            height: (panelRect ? panelRect.height : 360) + 'px',
          }}
        >
          <Header className="handle" style={{ direction: 'ltr' }}>
            <span>
              {i18n.t('buildingEnergyPanel.DailyBuildingEnergy', lang) + ': '}
              <label style={{ fontSize: '10px' }}>
                {i18n.t('sensorPanel.WeatherDataFrom', lang) + ' ' + city + ' | ' + moment(now).format('MM/DD')}
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
            type={GraphDataType.DailyBuildingEnergy}
            chartType={ChartType.Line}
            dataSource={data}
            labels={labels}
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
                    state.runDailyThermalSimulation = true;
                    state.pauseDailyThermalSimulation = false;
                    state.simulationInProgress = true;
                    if (loggable) {
                      state.actionInfo = { name: 'Run Daily Thermal Simulation', timestamp: new Date().getTime() };
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
                screenshot('line-graph-' + labelX + '-' + labelY, 'daily-building-energy', {}).then(() => {
                  showInfo(i18n.t('message.ScreenshotSaved', lang));
                  if (loggable) {
                    setCommonStore((state) => {
                      state.actionInfo = {
                        name: 'Take Screenshot of Daily Building Energy Graph',
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

export default React.memo(DailyBuildingEnergyPanel);
