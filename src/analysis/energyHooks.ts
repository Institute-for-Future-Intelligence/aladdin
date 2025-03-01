/*
 * @Copyright 2022-2025. Institute for Future Intelligence, Inc.
 */

import { adjustEnergyUsage, computeOutsideTemperature } from './heatTools';
import { BuildingCompletionStatus, DatumEntry, EnergyUsage, ObjectType } from '../types';
import { Util } from '../Util';
import { FoundationModel } from '../models/FoundationModel';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { WeatherModel } from '../models/WeatherModel';
import { useEffect, useRef, useState } from 'react';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { BatteryStorageModel } from 'src/models/BatteryStorageModel';

export const useDailyEnergySorter = (
  now: Date,
  weather: WeatherModel,
  hasSolarPanels: boolean,
  isBatterySimulation?: boolean,
) => {
  const elements = useStore.getState().elements;
  const getFoundation = useStore(Selector.getFoundation);
  const getElementById = useStore(Selector.getElementById);
  const flagOfDailySimulation = usePrimitiveStore(Selector.flagOfDailySimulation);
  const hourlyHeatExchangeArrayMap = useDataStore(Selector.hourlyHeatExchangeArrayMap);
  const hourlySolarHeatGainArrayMap = useDataStore(Selector.hourlySolarHeatGainArrayMap);
  const hourlySolarPanelOutputArrayMap = useDataStore(Selector.hourlySolarPanelOutputArrayMap);
  const hourlySingleSolarPanelOutputArrayMap = useDataStore(Selector.hourlySingleSolarPanelOutputArrayMap);

  const sum: DatumEntry[] = [];
  const dataLabels: string[] = [];
  const sumHeaterMapRef = useRef<Map<string, number>>(new Map<string, number>());
  const sumAcMapRef = useRef<Map<string, number>>(new Map<string, number>());
  const sumSolarPanelMapRef = useRef<Map<string, number>>(new Map<string, number>());

  const batteryStorageDataArrayRef = useRef<DatumEntry[]>([]);
  const batterySurplusEnergyMapRef = useRef<Map<string, number>>(new Map());
  const hvacCostMapRef = useRef(new Map<string, number[]>()); // hvacId -> net
  const batteryInputMapRef = useRef(new Map<string, number[]>()); // batteryId -> energy input;
  const hvacSavingPercentMapRef = useRef(new Map<string, number>()); // hvacId -> percent;
  const batteryIdSetRef = useRef(new Set<string>());
  const foundationStatusMapRef = useRef(new Map<string, boolean>()); // foundation with no building

  const [batteryStorageData, setBatteryStorageData] = useState<DatumEntry[] | null>(null);

  const getBatteryEditableIdMap = () => {
    const map = new Map<string, string>();
    let idx = 1;
    for (const e of elements) {
      if (e.type === ObjectType.BatteryStorage) {
        const label = idx + '-' + ((e as BatteryStorageModel).editableId ?? e.id.slice(0, 4));
        map.set(e.id, label);
        idx++;
      }
    }
    return map;
  };

  const setMap = (map: Map<string, number[]>, id: string, idx: number, value: number) => {
    if (!map.has(id)) {
      map.set(id, new Array(24).fill(0));
    }
    const arr = map.get(id);
    if (arr) {
      arr[idx] = value;
    }
  };

  const getHvacIdToBatteryIdMap = () => {
    const map = new Map<string, string[]>(); // hvacId -> batteryId
    for (const e of elements) {
      if (e.type === ObjectType.BatteryStorage) {
        const b = e as BatteryStorageModel;
        if (b.connectedHvacIds && b.connectedHvacIds.length > 0) {
          b.connectedHvacIds.forEach((hvacId) => {
            const arr = map.get(hvacId);
            if (!arr) {
              map.set(hvacId, [b.id]);
            } else {
              arr.push(b.id);
            }
          });
        }
      }
    }
    return map;
  };

  const getNonEmptyBatteryIds = (map: Map<string, number[]>, ids: string[], hour: number) => {
    const nonEmptyIds: string[] = [];

    for (const id of ids) {
      const level = map.get(id);
      if (level && level[hour] > 0) {
        nonEmptyIds.push(id);
      }
    }
    return [...nonEmptyIds];
  };

  const consumeEnergy = (levelMap: Map<string, number[]>, ids: string[], hour: number, value: number) => {
    let remains = 0;
    for (const id of ids) {
      const levels = levelMap.get(id);
      if (levels) {
        const currLevel = levels[hour];
        if (currLevel >= value) {
          levels[hour] = currLevel - value;
        } else {
          levels[hour] = 0;
          remains += value - currLevel;
        }
      }
    }
    return remains;
  };

  useEffect(() => {
    if (!weather) return;
    // get the highest and lowest temperatures of the day from the weather data
    const outsideTemperatureRange = computeOutsideTemperature(
      now,
      weather.lowestTemperatures,
      weather.highestTemperatures,
    );
    sumHeaterMapRef.current.clear();
    sumAcMapRef.current.clear();
    sumSolarPanelMapRef.current.clear();

    if (isBatterySimulation) {
      hvacCostMapRef.current.clear();
      batteryInputMapRef.current.clear();
      hvacSavingPercentMapRef.current.clear();
      batteryIdSetRef.current.clear();
      foundationStatusMapRef.current.clear();

      for (const e of elements) {
        if (e.type === ObjectType.BatteryStorage) {
          batteryIdSetRef.current.add(e.id);
        }
        if (e.type === ObjectType.Foundation) {
          const status =
            Util.getBuildingCompletionStatus(e as FoundationModel, elements) !== BuildingCompletionStatus.COMPLETE;
          foundationStatusMapRef.current.set(e.id, status);
        }
      }
    }

    for (let i = 0; i < 24; i++) {
      const datum: DatumEntry = {};
      const energy = new Map<string, EnergyUsage>();

      for (const e of elements) {
        if (Util.onBuildingEnvelope(e)) {
          const exchange = hourlyHeatExchangeArrayMap.get(e.id);
          if (exchange) {
            const f = e.type === ObjectType.Foundation ? (e as FoundationModel) : getFoundation(e);
            if (
              f &&
              !f.notBuilding &&
              Util.getBuildingCompletionStatus(f, elements) === BuildingCompletionStatus.COMPLETE
            ) {
              let energyUsage = energy.get(f.id);
              if (!energyUsage) {
                energyUsage = hasSolarPanels
                  ? ({ heater: 0, ac: 0, geothermal: 0, solarPanel: 0, label: f.label?.trim() } as EnergyUsage)
                  : ({ heater: 0, ac: 0, geothermal: 0, label: f.label?.trim() } as EnergyUsage);
                energy.set(f.id, energyUsage);
                if (f.hvacSystem?.id) {
                  if (f.hvacSystem.id && f.hvacSystem.id.length > 0 && !dataLabels.includes(f.hvacSystem.id)) {
                    dataLabels.push(f.hvacSystem.id);
                  }
                } else {
                  if (f.label && f.label.length > 0 && !dataLabels.includes(f.label)) {
                    dataLabels.push(f.label);
                  }
                }
              }
              if (e.type === ObjectType.Foundation) {
                energyUsage.geothermal += exchange[i];
              } else {
                if (exchange[i] < 0) {
                  energyUsage.heater += exchange[i];
                } else {
                  energyUsage.ac += exchange[i];
                }
              }
            }
          }
        }
      }
      // deal with the solar heat gain through windows and electricity generation through solar panels
      for (const e of elements) {
        if (e.type === ObjectType.Foundation) {
          const f = e as FoundationModel;
          if (!f.notBuilding && Util.getBuildingCompletionStatus(f, elements) !== BuildingCompletionStatus.COMPLETE)
            continue;
          const energyUsage = energy.get(e.id);
          if (energyUsage) {
            const h = hourlySolarHeatGainArrayMap.get(e.id);
            if (h) {
              if (energyUsage.heater < 0) {
                // It must be cold outside. Solar heat gain decreases heating burden in this case.
                energyUsage.heater += h[i];
                // solar heating cannot turn heater value into positive
                if (energyUsage.heater > 0) energyUsage.heater = 0;
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
        const fIdToHvacIdMap = new Map<string, string>(); // fId -> hvacId
        const hvacIdSet = new Set<string>();

        let index = 1;
        for (const key of energy.keys()) {
          datum['Hour'] = i;
          const value = energy.get(key);
          if (value) {
            const elem = getElementById(key);
            if (elem && elem.type === ObjectType.Foundation) {
              const f = elem as FoundationModel;
              if (
                !f.notBuilding &&
                Util.getBuildingCompletionStatus(f, elements) === BuildingCompletionStatus.COMPLETE
              ) {
                const heatingSetpoint = Util.getHeatingSetpoint(now, f.hvacSystem);
                const coolingSetpoint = Util.getCoolingSetpoint(now, f.hvacSystem);
                const threshold = f.hvacSystem?.temperatureThreshold ?? 3;
                const id = f.hvacSystem?.id ?? (value.label && value.label !== '' ? value.label : index.toString());
                fIdToHvacIdMap.set(f.id, id);
                hvacIdSet.add(id);
                if (id === index.toString()) index++;
                let adjustedHeat = Math.abs(
                  adjustEnergyUsage(outsideTemperatureRange, value.heater, heatingSetpoint, threshold),
                );
                let adjustedAc = adjustEnergyUsage(outsideTemperatureRange, value.ac, coolingSetpoint, threshold);
                if (adjustedHeat > 0) {
                  adjustedHeat -= value.geothermal;
                  if (adjustedHeat < 0) adjustedHeat = 0;
                } else if (adjustedAc > 0) {
                  adjustedAc += value.geothermal;
                  if (adjustedAc < 0) adjustedAc = 0;
                }
                const heaterId = 'Heater ' + id;
                if (datum[heaterId]) {
                  datum[heaterId] = (datum[heaterId] as number) + adjustedHeat;
                } else {
                  datum[heaterId] = adjustedHeat;
                }
                const acId = 'AC ' + id;
                if (datum[acId]) {
                  datum[acId] = (datum[acId] as number) + adjustedAc;
                } else {
                  datum[acId] = adjustedAc;
                }
                if (value.solarPanel !== undefined) {
                  const solarId = 'Solar ' + id;
                  if (datum[solarId]) {
                    datum[solarId] = (datum[solarId] as number) - value.solarPanel;
                  } else {
                    datum[solarId] = -value.solarPanel;
                  }
                }
                const netId = 'Net ' + id;
                if (datum[netId]) {
                  datum[netId] = (datum[netId] as number) + adjustedHeat + adjustedAc - (value.solarPanel ?? 0);
                } else {
                  datum[netId] = adjustedHeat + adjustedAc - (value.solarPanel ?? 0);
                }
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

        if (isBatterySimulation) {
          // calculate hvac saving percent/cost
          for (const id of hvacIdSet.keys()) {
            if (datum['Solar ' + id] !== undefined && Number(datum[`Net ${id}`]) < 0) {
              const percent = Number(datum[`Net ${id}`]) / Number(datum[`Solar ${id}`]);
              hvacSavingPercentMapRef.current.set(id, percent);
            } else {
              hvacSavingPercentMapRef.current.set(id, 0);
              setMap(hvacCostMapRef.current, id, i, Number(datum[`Net ${id}`]));
            }
          }

          // calculate battery input
          for (const e of elements) {
            if (e.type === ObjectType.SolarPanel) {
              const batteryStorageId = (e as SolarPanelModel).batteryStorageId;
              // has connected battery
              if (e.foundationId && batteryStorageId && batteryIdSetRef.current.has(batteryStorageId)) {
                if (!batteryInputMapRef.current.has(batteryStorageId)) {
                  batteryInputMapRef.current.set(batteryStorageId, new Array(24).fill(0));
                }
                const energyOutputArray = hourlySingleSolarPanelOutputArrayMap.get(e.id);
                if (energyOutputArray) {
                  const batteryInput = batteryInputMapRef.current.get(batteryStorageId);
                  if (batteryInput) {
                    const hvacId = fIdToHvacIdMap.get(e.foundationId);
                    if (hvacId) {
                      const energyPercent = hvacSavingPercentMapRef.current.get(hvacId);
                      if (energyPercent) {
                        const savedEnergy = energyPercent * energyOutputArray[i];
                        batteryInput[i] += savedEnergy;
                      }
                    } else {
                      batteryInput[i] += energyOutputArray[i];
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        for (const key of energy.keys()) {
          datum['Hour'] = i;
          const value = energy.get(key);
          if (value) {
            const elem = getElementById(key);
            if (elem && elem.type === ObjectType.Foundation) {
              const f = elem as FoundationModel;
              if (
                !f.notBuilding &&
                Util.getBuildingCompletionStatus(f, elements) === BuildingCompletionStatus.COMPLETE
              ) {
                const heatingSetpoint = Util.getHeatingSetpoint(now, f.hvacSystem);
                const coolingSetpoint = Util.getCoolingSetpoint(now, f.hvacSystem);
                const threshold = f.hvacSystem?.temperatureThreshold ?? 3;
                let adjustedHeat = Math.abs(
                  adjustEnergyUsage(outsideTemperatureRange, value.heater, heatingSetpoint, threshold),
                );
                let adjustedAc = adjustEnergyUsage(outsideTemperatureRange, value.ac, coolingSetpoint, threshold);
                if (adjustedHeat > 0) {
                  adjustedHeat -= value.geothermal;
                  if (adjustedHeat < 0) adjustedHeat = 0;
                } else if (adjustedAc > 0) {
                  adjustedAc += value.geothermal;
                  if (adjustedAc < 0) adjustedAc = 0;
                }
                datum['Heater'] = adjustedHeat;
                datum['AC'] = adjustedAc;
                if (value.solarPanel !== undefined) {
                  datum['Solar'] = -value.solarPanel;
                }
                datum['Net'] = adjustedHeat + adjustedAc - (value.solarPanel ?? 0);
                const id = 'default';
                if (Number(datum['Net']) > 0) {
                  setMap(hvacCostMapRef.current, f.hvacSystem.id ?? id, i, Number(datum['Net']));
                }
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

        if (isBatterySimulation) {
          // calculate battery input
          const savingPercent =
            Number(datum['Net']) < 0 && datum['Solar'] ? Number(datum['Net']) / Number(datum['Solar']) : 0;

          for (const e of elements) {
            if (e.type === ObjectType.SolarPanel) {
              const batteryStorageId = (e as SolarPanelModel).batteryStorageId;
              if (e.foundationId && batteryStorageId && batteryIdSetRef.current.has(batteryStorageId)) {
                const energyOutputArray = hourlySingleSolarPanelOutputArrayMap.get(e.id);
                if (energyOutputArray) {
                  if (!batteryInputMapRef.current.has(batteryStorageId)) {
                    batteryInputMapRef.current.set(batteryStorageId, new Array(24).fill(0));
                  }
                  const batteryFlowData = batteryInputMapRef.current.get(batteryStorageId);
                  if (batteryFlowData) {
                    if (foundationStatusMapRef.current.get(e.foundationId)) {
                      batteryFlowData[i] += energyOutputArray[i];
                    } else {
                      const savedEnergy = savingPercent * energyOutputArray[i];
                      batteryFlowData[i] += savedEnergy;
                    }
                  }
                }
              }
            }
          }
        }
      }
      sum.push(datum);
    }

    // for batteries
    if (isBatterySimulation) {
      const hvacIdToBatteryIdMap = getHvacIdToBatteryIdMap(); // hvacId -> batteryId
      const batteryLevelMap = new Map<string, number[]>(); // batteryId -> power level

      // calculate charge/discharge
      for (let hour = 0; hour < 24; hour++) {
        // charge
        for (const [id, hourlyInput] of batteryInputMapRef.current.entries()) {
          if (!batteryLevelMap.has(id)) {
            batteryLevelMap.set(id, new Array(24).fill(0));
          }
          const batteryLevels = batteryLevelMap.get(id);
          if (batteryLevels) {
            const input = hourlyInput[hour];
            const prevLevel = batteryLevels[(24 + hour - 1) % 24];
            batteryLevels[hour] = input + prevLevel;
          }
        }

        // discharge
        for (const [hvacId, cost] of hvacCostMapRef.current.entries()) {
          const batteryIds = hvacIdToBatteryIdMap.get(hvacId) ?? [];
          const connectedBatteryNumber = batteryIds.length;
          if (connectedBatteryNumber > 0) {
            let nonEmptyBatteryIds = getNonEmptyBatteryIds(batteryLevelMap, batteryIds, hour);
            let energyToConsume = cost[hour];
            while (nonEmptyBatteryIds.length > 0 && energyToConsume > 0.001) {
              const costForEach = energyToConsume / nonEmptyBatteryIds.length;
              energyToConsume = consumeEnergy(batteryLevelMap, nonEmptyBatteryIds, hour, costForEach);
              nonEmptyBatteryIds = getNonEmptyBatteryIds(batteryLevelMap, nonEmptyBatteryIds, hour);
            }
          }
        }
      }

      const endHourMap = new Map<string, number>();
      batteryLevelMap.forEach((levels, id) => {
        const hour = levels.findIndex((v) => v > 0);
        endHourMap.set(id, hour);
      });

      // second round
      for (let hour = 0; hour < 24; hour++) {
        [...batteryLevelMap.entries()].forEach(([id, levels]) => {
          const endHour = endHourMap.get(id);
          if (endHour !== undefined && endHour !== -1 && hour < endHour) {
            levels[hour] = levels[(24 + hour - 1) % 24];
          }
        });

        for (const [hvacId, cost] of hvacCostMapRef.current.entries()) {
          const batteryIds = hvacIdToBatteryIdMap.get(hvacId) ?? [];
          const connectedBatteryNumber = batteryIds.length;
          if (connectedBatteryNumber > 0) {
            let nonEmptyBatteryIds = getNonEmptyBatteryIds(batteryLevelMap, batteryIds, hour).filter((id) => {
              const endHour = endHourMap.get(id);
              if (endHour === undefined || endHour === -1) return false;
              return hour < endHour;
            });
            let energyToConsume = cost[hour];
            while (nonEmptyBatteryIds.length > 0 && energyToConsume > 0.001) {
              const costForEach = energyToConsume / nonEmptyBatteryIds.length;
              energyToConsume = consumeEnergy(batteryLevelMap, nonEmptyBatteryIds, hour, costForEach);
              nonEmptyBatteryIds = getNonEmptyBatteryIds(batteryLevelMap, nonEmptyBatteryIds, hour);
            }
          }
        }
      }

      // set graph data array
      batterySurplusEnergyMapRef.current.clear();
      batteryStorageDataArrayRef.current = new Array(24).fill({});
      const labelMap = getBatteryEditableIdMap();

      [...batteryLevelMap.entries()].forEach(([id, levels]) => {
        const label = labelMap.get(id) ?? id.slice(0, 4); // todo
        let startHour = endHourMap.get(id);
        if (startHour === undefined || startHour === -1) {
          startHour = 0;
        }
        batterySurplusEnergyMapRef.current.set(id, levels[(startHour - 1 + 24) % 24]);
        for (let i = startHour; i < startHour + 24; i++) {
          const hour = i % 24;
          const level = levels[hour];
          if (hour === startHour) {
            const data = batteryStorageDataArrayRef.current[hour];
            batteryStorageDataArrayRef.current[hour] = { ...data, [label]: level, Hour: hour };
          } else {
            const prevLevel = levels[(24 + hour - 1) % 24];
            const change = level - prevLevel;
            const data = batteryStorageDataArrayRef.current[hour];
            batteryStorageDataArrayRef.current[hour] = { ...data, [label]: change, Hour: hour };
          }
        }
      });
      setBatteryStorageData([...batteryStorageDataArrayRef.current]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flagOfDailySimulation, weather]);

  return {
    sum,
    sumHeaterMap: sumHeaterMapRef.current,
    sumAcMap: sumAcMapRef.current,
    sumSolarPanelMap: sumSolarPanelMapRef.current,
    dataLabels,
    batteryStorageData,
    batterySurplusEnergyMap: batterySurplusEnergyMapRef.current,
  };
};
