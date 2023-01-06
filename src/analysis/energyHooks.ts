/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { adjustEnergyUsage, computeOutsideTemperature } from './heatTools';
import { DatumEntry, EnergyUsage, ObjectType } from '../types';
import { Util } from '../Util';
import { FoundationModel } from '../models/FoundationModel';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { WeatherModel } from '../models/WeatherModel';
import { useEffect, useRef } from 'react';
import { usePrimitiveStore } from '../stores/commonPrimitive';

export const useDailyEnergySorter = (
  now: Date,
  weather: WeatherModel,
  hasSolarPanels: boolean,
  hourlyHeatExchangeArrayMap: Map<string, number[]>,
  hourlySolarHeatGainArrayMap: Map<string, number[]>,
  hourlySolarPanelOutputArrayMap: Map<string, number[]>,
) => {
  const elements = useStore.getState().elements;
  const getFoundation = useStore(Selector.getFoundation);
  const getElementById = useStore(Selector.getElementById);
  const flagOfDailySimulation = usePrimitiveStore(Selector.flagOfDailySimulation);

  const sum: DatumEntry[] = [];
  const dataLabels: string[] = [];
  const sumHeaterMapRef = useRef<Map<string, number>>(new Map<string, number>());
  const sumAcMapRef = useRef<Map<string, number>>(new Map<string, number>());
  const sumSolarPanelMapRef = useRef<Map<string, number>>(new Map<string, number>());

  useEffect(() => {
    // get the highest and lowest temperatures of the day from the weather data
    const outsideTemperatureRange = computeOutsideTemperature(
      now,
      weather.lowestTemperatures,
      weather.highestTemperatures,
    );
    sumHeaterMapRef.current.clear();
    sumAcMapRef.current.clear();
    sumSolarPanelMapRef.current.clear();
    for (let i = 0; i < 24; i++) {
      const datum: DatumEntry = {};
      const energy = new Map<string, EnergyUsage>();
      for (const e of elements) {
        if (Util.onBuildingEnvelope(e)) {
          const exchange = hourlyHeatExchangeArrayMap.get(e.id);
          if (exchange) {
            const f = getFoundation(e);
            if (f && Util.isCompleteBuilding(f, elements)) {
              let energyUsage = energy.get(f.id);
              if (!energyUsage) {
                energyUsage = hasSolarPanels
                  ? ({ heater: 0, ac: 0, solarPanel: 0, label: f.label?.trim() } as EnergyUsage)
                  : ({ heater: 0, ac: 0, label: f.label?.trim() } as EnergyUsage);
                energy.set(f.id, energyUsage);
                if (f.label && f.label.length > 0 && !dataLabels.includes(f.label)) {
                  dataLabels.push(f.label);
                }
              }
              if (exchange[i] < 0) {
                energyUsage.heater += exchange[i];
              } else {
                energyUsage.ac += exchange[i];
              }
            }
          }
        }
      }
      // deal with the solar heat gain through windows and electricity generation through solar panels
      for (const e of elements) {
        if (e.type === ObjectType.Foundation) {
          if (!Util.isCompleteBuilding(e as FoundationModel, elements)) continue;
          const energyUsage = energy.get(e.id);
          if (energyUsage) {
            const h = hourlySolarHeatGainArrayMap.get(e.id);
            if (h) {
              if (energyUsage.heater < 0) {
                // It must be cold outside. Solar heat gain decreases heating burden in this case.
                energyUsage.heater += h[i];
              } else if (energyUsage.ac > 0) {
                // It must be hot outside. Solar heat gain increases cooling burden in this case.
                energyUsage.ac += h[i];
              }
            }
            if (energyUsage.solarPanel !== undefined) {
              const s = hourlySolarPanelOutputArrayMap.get(e.id);
              if (s) {
                energyUsage.solarPanel += s[i];
              }
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
              if (Util.isCompleteBuilding(f, elements)) {
                const setpoint = f.hvacSystem?.thermostatSetpoint ?? 20;
                const threshold = f.hvacSystem?.temperatureThreshold ?? 3;
                const id = value.label && value.label !== '' ? value.label : index.toString();
                const adjustedHeat = Math.abs(
                  adjustEnergyUsage(outsideTemperatureRange, value.heater, setpoint, threshold),
                );
                const adjustedAc = adjustEnergyUsage(outsideTemperatureRange, value.ac, setpoint, threshold);
                datum['Heater ' + id] = adjustedHeat;
                datum['AC ' + id] = adjustedAc;
                if (value.solarPanel !== undefined) {
                  datum['Solar ' + id] = -value.solarPanel;
                }
                datum['Net ' + id] = adjustedHeat + adjustedAc - (value.solarPanel ?? 0);
                let x = sumHeaterMapRef.current.get(id);
                if (x === undefined) x = 0;
                x += adjustedHeat;
                sumHeaterMapRef.current.set(id, x);
                x = sumAcMapRef.current.get(id);
                if (x === undefined) x = 0;
                x += adjustedAc;
                sumAcMapRef.current.set(id, x);
                if (hasSolarPanels) {
                  x = sumSolarPanelMapRef.current.get(id);
                  if (x === undefined) x = 0;
                  x += value.solarPanel;
                  sumSolarPanelMapRef.current.set(id, x);
                }
              }
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
              if (Util.isCompleteBuilding(f, elements)) {
                const setpoint = f.hvacSystem?.thermostatSetpoint ?? 20;
                const threshold = f.hvacSystem?.temperatureThreshold ?? 3;
                const adjustedHeat = Math.abs(
                  adjustEnergyUsage(outsideTemperatureRange, value.heater, setpoint, threshold),
                );
                const adjustedAc = adjustEnergyUsage(outsideTemperatureRange, value.ac, setpoint, threshold);
                datum['Heater'] = adjustedHeat;
                datum['AC'] = adjustedAc;
                if (value.solarPanel !== undefined) {
                  datum['Solar'] = -value.solarPanel;
                }
                datum['Net'] = adjustedHeat + adjustedAc - (value.solarPanel ?? 0);
                const id = 'default';
                let x = sumHeaterMapRef.current.get(id);
                if (x === undefined) x = 0;
                x += adjustedHeat;
                sumHeaterMapRef.current.set(id, x);
                x = sumAcMapRef.current.get(id);
                if (x === undefined) x = 0;
                x += adjustedAc;
                sumAcMapRef.current.set(id, x);
                if (hasSolarPanels) {
                  x = sumSolarPanelMapRef.current.get(id);
                  if (x === undefined) x = 0;
                  x += value.solarPanel;
                  sumSolarPanelMapRef.current.set(id, x);
                }
              }
            }
          }
        }
      }
      sum.push(datum);
    }
  }, [flagOfDailySimulation]);

  return {
    sum,
    sumHeaterMap: sumHeaterMapRef.current,
    sumAcMap: sumAcMapRef.current,
    sumSolarPanelMap: sumSolarPanelMapRef.current,
    dataLabels,
  };
};
