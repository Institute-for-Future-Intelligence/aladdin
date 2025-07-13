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

export const useDailyEnergySorter = (now: Date, weather: WeatherModel, hasSolarPanels: boolean) => {
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
  const summaryMapRef = useRef<Map<string, number>>(new Map());
  const completeBuildingHvacIdSetRef = useRef<Set<string>>(new Set());

  const batteryStorageDataArrayRef = useRef<DatumEntry[]>([]);
  const batterySurplusEnergyMapRef = useRef<Map<string, number>>(new Map());
  const hvacCostMapRef = useRef(new Map<string, number[]>()); // hvacId -> net
  const batteryInputMapRef = useRef(new Map<string, number[]>()); // batteryId -> energy input;
  const hvacSavingPercentMapRef = useRef(new Map<string, number>()); // hvacId -> percent;
  const batteryIdSetRef = useRef(new Set<string>());
  const foundationStatusMapRef = useRef(new Map<string, boolean>()); // foundation with no building
  const batteryEfficiencyMapRef = useRef(new Map<string, { charge: number; discharge: number }>());
  const batteryLabelToIdMapRef = useRef(new Map<string, string>());
  const batteryLevelMapRef = useRef(new Map<string, number[]>());
  const fIdToHvacIdMapRef = useRef(new Map<string, string>());
  const hvacIdSetRef = useRef(new Set<string>());

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

  const consumeEnergy = (levelMap: Map<string, number[]>, ids: string[], hour: number, cost: number) => {
    let remains = 0;
    for (const id of ids) {
      const levels = levelMap.get(id);
      const efficiency = batteryEfficiencyMapRef.current.get(id) ?? { charge: 0.95, discharge: 0.95 };
      if (levels) {
        const currLevel = levels[hour];
        const actualCost = cost / efficiency.discharge;
        if (currLevel >= actualCost) {
          levels[hour] = currLevel - actualCost;
        } else {
          levels[hour] = 0;
          remains += actualCost - currLevel;
        }
      }
    }
    return remains;
  };

  const getSum = (sum: DatumEntry[], key: string) => {
    return sum.reduce((acc, curr) => {
      if (curr[key]) return acc + Number(curr[key]);
      return acc;
    }, 0);
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
    summaryMapRef.current.clear();
    batteryLevelMapRef.current.clear();
    completeBuildingHvacIdSetRef.current.clear();

    const hasConnectedBattery = elements.find((e) => e.type === ObjectType.BatteryStorage);
    if (hasConnectedBattery) {
      hvacCostMapRef.current.clear();
      batteryInputMapRef.current.clear();
      hvacSavingPercentMapRef.current.clear();
      batteryIdSetRef.current.clear();
      foundationStatusMapRef.current.clear();
      batteryEfficiencyMapRef.current.clear();
      batteryLabelToIdMapRef.current.clear();
      fIdToHvacIdMapRef.current.clear();
      hvacIdSetRef.current.clear();

      let batteryIndex = 1;
      for (const e of elements) {
        if (e.type === ObjectType.BatteryStorage) {
          const b = e as BatteryStorageModel;
          batteryIdSetRef.current.add(e.id);
          const { chargingEfficiency = 0.95, dischargingEfficiency = 0.95 } = b;
          batteryEfficiencyMapRef.current.set(e.id, { charge: chargingEfficiency, discharge: dischargingEfficiency });
          const editableId = b.editableId ?? b.id.slice(0, 4);
          batteryLabelToIdMapRef.current.set(batteryIndex + '-' + editableId, e.id);
          batteryIndex++;
        }
        if (e.type === ObjectType.Foundation) {
          const status =
            Util.getBuildingCompletionStatus(e as FoundationModel, elements) !== BuildingCompletionStatus.COMPLETE;
          foundationStatusMapRef.current.set(e.id, status);
        }
      }
    }

    for (const e of useStore.getState().elements) {
      if (e.type === ObjectType.Foundation) {
        const f = e as FoundationModel;
        if (
          !f.notBuilding &&
          f.hvacSystem.id &&
          Util.getBuildingCompletionStatus(f, elements) === BuildingCompletionStatus.COMPLETE
        ) {
          completeBuildingHvacIdSetRef.current.add(f.hvacSystem.id);
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
              ((f.hvacSystem.id && completeBuildingHvacIdSetRef.current.has(f.hvacSystem.id)) ||
                Util.getBuildingCompletionStatus(f, elements) === BuildingCompletionStatus.COMPLETE)
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
          if (
            !f.notBuilding &&
            !(f.hvacSystem.id && completeBuildingHvacIdSetRef.current.has(f.id)) &&
            Util.getBuildingCompletionStatus(f, elements) !== BuildingCompletionStatus.COMPLETE
          )
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
                ((f.hvacSystem.id && completeBuildingHvacIdSetRef.current.has(f.hvacSystem.id)) ||
                  Util.getBuildingCompletionStatus(f, elements) === BuildingCompletionStatus.COMPLETE)
              ) {
                const heatingSetpoint = Util.getHeatingSetpoint(now, f.hvacSystem);
                const coolingSetpoint = Util.getCoolingSetpoint(now, f.hvacSystem);
                const threshold = f.hvacSystem?.temperatureThreshold ?? 3;
                const id = f.hvacSystem?.id ?? (value.label && value.label !== '' ? value.label : index.toString());
                fIdToHvacIdMapRef.current.set(f.id, id);
                hvacIdSetRef.current.add(id);
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
                adjustedAc /= f.hvacSystem.coefficientOfPerformanceAC ?? 4;
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

        if (hasConnectedBattery) {
          // calculate hvac saving percent/cost
          for (const id of hvacIdSetRef.current.keys()) {
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
                    const hvacId = fIdToHvacIdMapRef.current.get(e.foundationId);
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
                ((f.hvacSystem.id && completeBuildingHvacIdSetRef.current.has(f.hvacSystem.id)) ||
                  Util.getBuildingCompletionStatus(f, elements) === BuildingCompletionStatus.COMPLETE)
              ) {
                const hvacId = f.hvacSystem?.id ?? (value.label && value.label !== '' ? value.label : '1');
                hvacIdSetRef.current.add(hvacId);
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
                adjustedAc /= f.hvacSystem.coefficientOfPerformanceAC ?? 4;
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

        if (hasConnectedBattery) {
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
    if (hasConnectedBattery) {
      const hvacIdToBatteryIdMap = getHvacIdToBatteryIdMap(); // hvacId -> batteryId

      // calculate charge/discharge
      for (let hour = 0; hour < 24; hour++) {
        // charge
        for (const [id, hourlyInput] of batteryInputMapRef.current.entries()) {
          if (!batteryLevelMapRef.current.has(id)) {
            batteryLevelMapRef.current.set(id, new Array(24).fill(0));
          }
          const batteryLevels = batteryLevelMapRef.current.get(id);
          if (batteryLevels) {
            const efficiency = batteryEfficiencyMapRef.current.get(id) ?? { charge: 0.95, discharge: 0.95 };
            const input = hourlyInput[hour] * efficiency.charge;
            const prevLevel = batteryLevels[(24 + hour - 1) % 24];
            batteryLevels[hour] = input + prevLevel;
          }
        }

        // discharge
        for (const [hvacId, cost] of hvacCostMapRef.current.entries()) {
          const batteryIds = hvacIdToBatteryIdMap.get(hvacId) ?? [];
          const connectedBatteryNumber = batteryIds.length;
          if (connectedBatteryNumber > 0) {
            let nonEmptyBatteryIds = getNonEmptyBatteryIds(batteryLevelMapRef.current, batteryIds, hour);
            let energyToConsume = cost[hour];
            while (nonEmptyBatteryIds.length > 0 && energyToConsume > 0.001) {
              const costForEach = energyToConsume / nonEmptyBatteryIds.length;
              energyToConsume = consumeEnergy(batteryLevelMapRef.current, nonEmptyBatteryIds, hour, costForEach);
              nonEmptyBatteryIds = getNonEmptyBatteryIds(batteryLevelMapRef.current, nonEmptyBatteryIds, hour);
            }
          }
        }
      }

      const endHourMap = new Map<string, number>();
      batteryLevelMapRef.current.forEach((levels, id) => {
        const hour = levels.findIndex((v) => v > 0);
        endHourMap.set(id, hour);
      });

      // second round
      for (let hour = 0; hour < 24; hour++) {
        [...batteryLevelMapRef.current.entries()].forEach(([id, levels]) => {
          const endHour = endHourMap.get(id);
          if (endHour !== undefined && endHour !== -1 && hour < endHour) {
            levels[hour] = levels[(24 + hour - 1) % 24];
          }
        });

        for (const [hvacId, cost] of hvacCostMapRef.current.entries()) {
          const batteryIds = hvacIdToBatteryIdMap.get(hvacId) ?? [];
          const connectedBatteryNumber = batteryIds.length;
          if (connectedBatteryNumber > 0) {
            let nonEmptyBatteryIds = getNonEmptyBatteryIds(batteryLevelMapRef.current, batteryIds, hour).filter(
              (id) => {
                const endHour = endHourMap.get(id);
                if (endHour === undefined || endHour === -1) return false;
                return hour < endHour;
              },
            );
            let energyToConsume = cost[hour];
            while (nonEmptyBatteryIds.length > 0 && energyToConsume > 0.001) {
              const costForEach = energyToConsume / nonEmptyBatteryIds.length;
              energyToConsume = consumeEnergy(batteryLevelMapRef.current, nonEmptyBatteryIds, hour, costForEach);
              nonEmptyBatteryIds = getNonEmptyBatteryIds(batteryLevelMapRef.current, nonEmptyBatteryIds, hour);
            }
          }
        }
      }

      // set graph data array
      batterySurplusEnergyMapRef.current.clear();
      batteryStorageDataArrayRef.current = new Array(24).fill({});
      const labelMap = getBatteryEditableIdMap();

      [...batteryLevelMapRef.current.entries()].forEach(([id, levels]) => {
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

      for (let hour = 0; hour < 24; hour++) {
        const energyData = sum[hour];
        const batteryData = batteryStorageDataArrayRef.current[hour];

        for (const hvacId of hvacIdSetRef.current) {
          const hasLabelId = Object.keys(sum[0]).find((key) => key.includes('AC') && key.length > 2);

          let netLabel = 'Net';
          let batteryLabel = 'Battery';
          let gridLabel = 'Grid';
          if (hasLabelId) {
            netLabel = 'Net ' + hvacId;
            batteryLabel = 'Battery ' + hvacId;
            gridLabel = 'Grid ' + hvacId;
          }

          const net = Number(energyData[netLabel]);

          if (net > 0) {
            const batteryIds = hvacIdToBatteryIdMap.get(hvacId); // batteries Id connected to this hvac
            if (batteryIds && batteryIds.length > 0) {
              let hasEnergyLeft = false;
              for (const [id, levels] of batteryLevelMapRef.current.entries()) {
                if (batteryIds.indexOf(id) !== -1 && levels[hour] > 0) {
                  hasEnergyLeft = true;
                  break;
                }
              }

              if (hasEnergyLeft) {
                energyData[batteryLabel] = -net;
                energyData[gridLabel] = 0;
              } else {
                const batteryChange = Object.keys(batteryData).reduce((acc, key) => {
                  if (key !== 'Hour') {
                    const batteryLabel = key;
                    const bId = batteryLabelToIdMapRef.current.get(batteryLabel);
                    if (bId && batteryIds.indexOf(bId) !== -1) {
                      const efficiency = batteryEfficiencyMapRef.current.get(bId);
                      const battery = elements.find((e) => e.id === bId) as BatteryStorageModel;
                      if (efficiency && battery && battery.connectedHvacIds) {
                        // should consider how much other connected hvac consume, using hvacCostMapRef.current
                        return (
                          acc +
                          (efficiency.discharge * Number(batteryData[batteryLabel])) / battery.connectedHvacIds.length
                        );
                      }
                    }
                  }
                  return acc;
                }, 0);
                energyData[gridLabel] = net + batteryChange;
                energyData[batteryLabel] = batteryChange;
              }
            } else {
              energyData[batteryLabel] = 0;
              energyData[gridLabel] = net;
            }
          } else {
            // no need battery energy
            energyData[batteryLabel] = 0;
            energyData[gridLabel] = 0;
          }
        }
      }

      for (const hvacId of hvacIdSetRef.current) {
        const batteryIds = hvacIdToBatteryIdMap.get(hvacId);
        let key = '';
        if (batteryIds && batteryIds.length > 0) {
          key = 'Grid';
        } else {
          key = 'Net';
        }
        if (hvacIdSetRef.current.size > 1) {
          key = key + ' ' + hvacId;
          summaryMapRef.current.set(key, getSum(sum, key));
        } else {
          Object.keys(sum[0]).forEach((k) => {
            if (k.slice(0, 4).includes(key)) {
              summaryMapRef.current.set(k, getSum(sum, k));
            }
          });
        }
      }
    } else {
      Object.keys(sum[0]).forEach((key) => {
        if (key.slice(0, 3) === 'Net') {
          summaryMapRef.current.set(key, getSum(sum, key));
        }
      });
    }

    // console.log('sum', sum);
    // console.log('bat', batteryStorageDataArrayRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flagOfDailySimulation, weather]);

  return {
    sum,
    sumHeaterMap: sumHeaterMapRef.current,
    sumAcMap: sumAcMapRef.current,
    sumSolarPanelMap: sumSolarPanelMapRef.current,
    summaryMap: summaryMapRef.current,
    dataLabels,
    batteryStorageData,
    batteryDataRef: batteryStorageDataArrayRef.current,
    batterySurplusEnergyMap: batterySurplusEnergyMapRef.current,
  };
};
