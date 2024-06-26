/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  calculateDiffuseAndReflectedRadiation,
  calculatePeakRadiation,
  computeSunriseAndSunsetInMinutes,
  getSunDirection,
} from './sunTools';
import { Intersection, Object3D, Raycaster, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useStore } from '../stores/common';
import { DatumEntry, ObjectType, SolarStructure } from '../types';
import { Util } from '../Util';
import {
  AIR_DENSITY,
  AIR_ISOBARIC_SPECIFIC_HEAT,
  AirMass,
  GRAVITATIONAL_ACCELERATION,
  KELVIN_AT_ZERO_CELSIUS,
  MINUTES_OF_DAY,
  STEFAN_BOLTZMANN_CONSTANT,
} from './analysisConstants';
import { MONTHS_ABBV, UNIT_VECTOR_POS_Z, ZERO_TOLERANCE } from '../constants';
import * as Selector from '../stores/selector';
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { SunMinutes } from './SunMinutes';
import { FoundationModel } from '../models/FoundationModel';
import { computeOutsideTemperature, getOutsideTemperatureAtMinute } from './heatTools';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';
import { useLanguage, useWeather } from '../hooks';

export interface SolarUpdraftTowerSimulationProps {
  city: string | null;
}

const SolarUpdraftTowerSimulation = React.memo(({ city }: SolarUpdraftTowerSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const setPrimitiveStore = usePrimitiveStore(Selector.setPrimitiveStore);
  const loggable = useStore(Selector.loggable);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const setLabels = useDataStore(Selector.setUpdraftTowerLabels);
  const setDailyResults = useDataStore(Selector.setDailyUpdraftTowerResults);
  const setDailyYield = useDataStore(Selector.setDailyUpdraftTowerYield);
  const setYearlyYield = useDataStore(Selector.setYearlyUpdraftTowerYield);
  const runDailySimulation = usePrimitiveStore(Selector.runDailySimulationForUpdraftTower);
  const pauseDailySimulation = usePrimitiveStore(Selector.pauseDailySimulationForUpdraftTower);
  const runYearlySimulation = usePrimitiveStore(Selector.runYearlySimulationForUpdraftTower);
  const pauseYearlySimulation = usePrimitiveStore(Selector.pauseYearlySimulationForUpdraftTower);
  const showDailyUpdraftTowerPanel = useStore(Selector.viewState.showDailyUpdraftTowerYieldPanel);
  const noAnimation = useStore(Selector.world.noAnimationForSolarUpdraftTowerSimulation);
  const highestTemperatureTimeInMinutes = useStore(Selector.world.highestTemperatureTimeInMinutes) ?? 900;
  const cellSize = world.sutGridCellSize ?? 1;

  const { scene } = useThree();
  const lang = useLanguage();
  const weather = useWeather(city);
  const now = new Date(world.date);

  const elevation = weather ? weather.elevation : 0;
  const timesPerHour = world.sutTimesPerHour ?? 4;
  const minuteInterval = 60 / timesPerHour;
  const daysPerYear = world.sutDaysPerYear ?? 6;
  const monthInterval = 12 / daysPerYear;
  const ray = useMemo(() => new Raycaster(), []);
  const objectsRef = useRef<Object3D[]>([]);
  const intersectionsRef = useRef<Intersection[]>([]); // reuse array in intersection detection
  const requestRef = useRef<number>(0);
  const simulationCompletedRef = useRef<boolean>(false);
  const originalDateRef = useRef<Date>(new Date(world.date));
  const dailyAmbientTemperaturesRef = useRef<number[]>(new Array(24).fill(0));
  const dailyChimneyInletAirTemperaturesMapRef = useRef<Map<string, number[]>>(new Map<string, number[]>());
  const dailyWindSpeedsMapRef = useRef<Map<string, number[]>>(new Map<string, number[]>());
  const dailyOutputsMapRef = useRef<Map<string, number[]>>(new Map<string, number[]>());
  const yearlyOutputsMapRef = useRef<Map<string, number[]>>(new Map<string, number[]>());
  const sampledDayRef = useRef<number>(0);
  const pauseRef = useRef<boolean>(false);
  const pausedDateRef = useRef<Date>(new Date(world.date));
  const dayRef = useRef<number>(0);

  // this is used in daily simulation that should respond to change of date and latitude
  const sunMinutes = useMemo(() => {
    return computeSunriseAndSunsetInMinutes(now, world.latitude);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world.date, world.latitude]);

  // this is used in yearly simulation in which the date is changed programmatically based on the current latitude
  const sunMinutesRef = useRef<SunMinutes>(sunMinutes);

  const daysOfMonth = Util.daysInYear(now) / 12;

  /* do the daily simulation to generate daily yield */

  useEffect(() => {
    if (runDailySimulation) {
      if (noAnimation && !Util.hasMovingParts(elements)) {
        staticSimulateDaily();
      } else {
        initDaily();
        requestRef.current = requestAnimationFrame(simulateDaily);
        return () => {
          // this is called when the recursive call of requestAnimationFrame exits
          cancelAnimationFrame(requestRef.current);
          if (!simulationCompletedRef.current) {
            showInfo(i18n.t('message.SimulationAborted', lang));
            setCommonStore((state) => {
              state.world.date = originalDateRef.current.toLocaleString('en-US');
            });
            usePrimitiveStore.getState().set((state) => {
              state.simulationInProgress = false;
              state.simulationPaused = false;
            });
          }
          pauseRef.current = false;
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runDailySimulation]);

  useEffect(() => {
    pauseRef.current = pauseDailySimulation;
    if (pauseDailySimulation) {
      pausedDateRef.current = new Date(now.getTime());
      cancelAnimationFrame(requestRef.current);
      setPrimitiveStore('simulationPaused', true);
      showInfo(i18n.t('message.SimulationPaused', lang));
    } else {
      setPrimitiveStore('simulationPaused', false);
      // continue the simulation
      simulateDaily();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pauseDailySimulation]);

  const staticSimulateDaily = () => {
    fetchObjects();
    resetDailyMaps();
    for (const e of elements) {
      if (e.type === ObjectType.Foundation) {
        const f = e as FoundationModel;
        if (f.solarStructure === SolarStructure.UpdraftTower && f.solarUpdraftTower) {
          calculateYieldWithoutAnimation(f);
        }
      }
    }
    setCommonStore((state) => {
      state.viewState.showDailyUpdraftTowerYieldPanel = true;
      state.selectedFloatingWindow = 'dailySolarUpdraftTowerYieldPanel';
    });
    usePrimitiveStore.getState().set((state) => {
      state.runDailySimulationForUpdraftTower = false;
      state.simulationInProgress = false;
      state.simulationPaused = false;
    });
    showInfo(i18n.t('message.SimulationCompleted', lang));
    simulationCompletedRef.current = true;
    finishDaily();
    if (loggable) {
      setCommonStore((state) => {
        const totalYield = useDataStore.getState().sumDailyUpdraftTowerYield();
        state.actionInfo = {
          name: 'Static Daily Simulation for Updraft Tower Completed',
          result: { totalYield: totalYield },
          details: useDataStore.getState().dailyUpdraftTowerYield,
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  const initDaily = () => {
    if (pauseRef.current) {
      // if the simulation has been paused, continue from the paused date
      now.setTime(pausedDateRef.current.getTime());
      pauseRef.current = false;
    } else {
      originalDateRef.current = new Date(world.date);
      dayRef.current = now.getDay();
      // beginning some minutes before the sunrise hour just in case and to provide a cue
      now.setHours(Math.floor(sunMinutes.sunrise / 60), -minuteInterval / 2);
    }
    simulationCompletedRef.current = false;
    fetchObjects();
    resetDailyMaps();
  };

  const simulateDaily = () => {
    if (runDailySimulation && !pauseRef.current) {
      const totalMinutes = now.getMinutes() + now.getHours() * 60 + (now.getDay() - dayRef.current) * MINUTES_OF_DAY;
      if (totalMinutes + minuteInterval >= sunMinutes.sunset) {
        cancelAnimationFrame(requestRef.current);
        setCommonStore((state) => {
          state.world.date = originalDateRef.current.toLocaleString('en-US');
          state.viewState.showDailyUpdraftTowerYieldPanel = true;
          state.selectedFloatingWindow = 'dailySolarUpdraftTowerYieldPanel';
        });
        usePrimitiveStore.getState().set((state) => {
          state.runDailySimulationForUpdraftTower = false;
          state.simulationInProgress = false;
          state.simulationPaused = false;
        });
        showInfo(i18n.t('message.SimulationCompleted', lang));
        simulationCompletedRef.current = true;
        finishDaily();
        if (loggable) {
          setCommonStore((state) => {
            const totalYield = useDataStore.getState().sumDailyUpdraftTowerYield();
            state.actionInfo = {
              name: 'Dynamic Daily Simulation for Updraft Tower Completed',
              result: { totalYield: totalYield },
              details: useDataStore.getState().dailyUpdraftTowerYield,
              timestamp: new Date().getTime(),
            };
          });
        }
        return;
      }
      // this is where time advances (by incrementing the minutes with the given interval)
      // minutes more than 60 results in the increase of the hour accordingly
      now.setHours(now.getHours(), now.getMinutes() + minuteInterval);
      // this forces the scene to be re-rendered
      setCommonStore((state) => {
        state.world.date = now.toLocaleString('en-US');
      });
      // will the calculation immediately use the latest geometry after re-rendering?
      for (const e of elements) {
        if (e.type === ObjectType.Foundation) {
          const f = e as FoundationModel;
          if (f.solarStructure === SolarStructure.UpdraftTower && f.solarUpdraftTower) {
            calculateYield(f);
          }
        }
      }
      // recursive call to the next step of the simulation
      requestRef.current = requestAnimationFrame(simulateDaily);
    }
  };

  const finishDaily = () => {
    const timeFactor = getTimeFactor();
    for (const e of elements) {
      if (e.type === ObjectType.Foundation) {
        const f = e as FoundationModel;
        if (f.solarStructure === SolarStructure.UpdraftTower && f.solarUpdraftTower) {
          const transmissivity = f.solarUpdraftTower.collectorTransmissivity ?? 0.9;
          const turbineEfficiency = f.solarUpdraftTower.turbineEfficiency ?? 0.3;
          const dischargeCoefficient = f.solarUpdraftTower.dischargeCoefficient ?? 0.65;
          const chimneyArea = Math.PI * f.solarUpdraftTower.chimneyRadius * f.solarUpdraftTower.chimneyRadius;
          const collectorArea = Math.PI * f.solarUpdraftTower.collectorRadius * f.solarUpdraftTower.collectorRadius;
          const dca = AIR_DENSITY * AIR_ISOBARIC_SPECIFIC_HEAT * chimneyArea;
          const speedFactor = 2 * GRAVITATIONAL_ACCELERATION * f.solarUpdraftTower.chimneyHeight;
          const chimneyInletTemperatures = dailyChimneyInletAirTemperaturesMapRef.current.get(e.id + '-sut');
          const windSpeeds = dailyWindSpeedsMapRef.current.get(e.id + '-sut');
          const outputs = dailyOutputsMapRef.current.get(e.id + '-sut');
          if (outputs && chimneyInletTemperatures && windSpeeds) {
            const powerFactor = 0.5 * dischargeCoefficient * turbineEfficiency * AIR_DENSITY * chimneyArea;
            const date = new Date(world.date);
            let temp;
            if (weather) {
              temp = computeOutsideTemperature(date, weather.lowestTemperatures, weather.highestTemperatures);
            }
            for (let i = 0; i < outputs.length; i++) {
              let ambientTemperature = 20;
              if (weather && temp) {
                date.setHours(i);
                ambientTemperature = getOutsideTemperatureAtMinute(
                  temp.high,
                  temp.low,
                  world.diurnalTemperatureModel,
                  highestTemperatureTimeInMinutes,
                  sunMinutes,
                  Util.minutesIntoDay(date),
                );
                dailyAmbientTemperaturesRef.current[i] = ambientTemperature;
              }
              outputs[i] *= timeFactor * transmissivity * 1000; // from kW to W
              const tAmbientK = ambientTemperature + KELVIN_AT_ZERO_CELSIUS;
              if (outputs[i] > 0 && i > 0 && chimneyInletTemperatures[i - 1] > ambientTemperature) {
                // assume that the average temperature of the collector is the mean between ambient and inlet
                const tCollector = (chimneyInletTemperatures[i - 1] + ambientTemperature) / 2;
                const convectiveLoss =
                  (world.airConvectiveCoefficient ?? 5) * collectorArea * (tCollector - ambientTemperature);
                const tCollectorK = tCollector + KELVIN_AT_ZERO_CELSIUS;
                const tCollector4 = tCollectorK * tCollectorK * tCollectorK * tCollectorK;
                const tAmbient4 = tAmbientK * tAmbientK * tAmbientK * tAmbientK;
                const radiationLoss =
                  (f.solarUpdraftTower.collectorEmissivity ?? 0.95) *
                  STEFAN_BOLTZMANN_CONSTANT *
                  collectorArea *
                  (tCollector4 - tAmbient4);
                outputs[i] -= convectiveLoss + radiationLoss;
                if (outputs[i] < 0) outputs[i] = 0;
              }
              const a = outputs[i] / (dca * tAmbientK);
              const temperature = tAmbientK * (1 + Math.cbrt((a * a) / speedFactor)) - KELVIN_AT_ZERO_CELSIUS;
              const speed =
                temperature > ambientTemperature
                  ? Math.sqrt(speedFactor * ((temperature + KELVIN_AT_ZERO_CELSIUS) / tAmbientK - 1))
                  : 0;
              outputs[i] = powerFactor * speed * speed * speed * 0.001; // from W to kW
              chimneyInletTemperatures[i] = temperature;
              windSpeeds[i] = speed;
            }
          }
        }
      }
    }
    generateDailyData();
  };

  const generateDailyData = () => {
    const map = new Map<string, number[]>();
    let index = 0;
    const labels = [];
    for (const e of elements) {
      if (e.type === ObjectType.Foundation) {
        const f = e as FoundationModel;
        if (f.solarStructure === SolarStructure.UpdraftTower && f.solarUpdraftTower) {
          index++;
          const temperature = dailyChimneyInletAirTemperaturesMapRef.current.get(e.id + '-sut');
          if (temperature) {
            map.set('Temperature Tower' + index, temperature);
          }
          const speed = dailyWindSpeedsMapRef.current.get(e.id + '-sut');
          if (speed) {
            map.set('Wind Speed Tower' + index, speed);
          }
          const output = dailyOutputsMapRef.current.get(e.id + '-sut');
          if (output) {
            map.set('Tower' + index, output);
            labels.push(e.label ? e.label : 'Tower' + index);
          }
        }
      }
    }
    const outputs = [];
    for (let i = 0; i < 24; i++) {
      const datum: DatumEntry = {};
      datum['Hour'] = i;
      for (let k = 1; k <= index; k++) {
        const key = 'Tower' + k;
        datum[labels[k - 1]] = map.get(key)?.[i];
      }
      outputs.push(datum);
    }
    setDailyYield(outputs);
    const results = [];
    for (let i = 0; i < 24; i++) {
      const datum: DatumEntry = {};
      datum['Hour'] = i;
      datum['T_Ambient'] = dailyAmbientTemperaturesRef.current[i];
      for (let k = 1; k <= index; k++) {
        let key = 'Temperature Tower' + k;
        datum['T_' + labels[k - 1]] = map.get(key)?.[i];
        key = 'Wind Speed Tower' + k;
        datum['V_' + labels[k - 1]] = map.get(key)?.[i];
      }
      results.push(datum);
    }
    setDailyResults(results);
    setLabels(labels);
  };

  /* do the yearly simulation to generate the yearly yield */

  useEffect(() => {
    if (runYearlySimulation) {
      if (noAnimation && !Util.hasMovingParts(elements)) {
        staticSimulateYearly();
      } else {
        initYearly();
        requestRef.current = requestAnimationFrame(simulateYearly);
        return () => {
          // this is called when the recursive call of requestAnimationFrame exits
          cancelAnimationFrame(requestRef.current);
          if (!simulationCompletedRef.current) {
            showInfo(i18n.t('message.SimulationAborted', lang));
            setCommonStore((state) => {
              state.world.date = originalDateRef.current.toLocaleString('en-US');
            });
            usePrimitiveStore.getState().set((state) => {
              state.simulationInProgress = false;
              state.simulationPaused = false;
            });
          }
          pauseRef.current = false;
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runYearlySimulation]);

  useEffect(() => {
    pauseRef.current = pauseYearlySimulation;
    if (pauseYearlySimulation) {
      pausedDateRef.current = new Date(now.getTime());
      cancelAnimationFrame(requestRef.current);
      setPrimitiveStore('simulationPaused', true);
      showInfo(i18n.t('message.SimulationPaused', lang));
    } else {
      setPrimitiveStore('simulationPaused', false);
      // continue the simulation
      simulateYearly();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pauseYearlySimulation]);

  const initYearly = () => {
    if (pauseRef.current) {
      // if the simulation has been paused, continue from the paused date
      now.setTime(pausedDateRef.current.getTime());
      pauseRef.current = false;
    } else {
      originalDateRef.current = new Date(world.date);
      sampledDayRef.current = 0;
      now.setMonth(0, 22); // begin from January, 22
      dayRef.current = now.getDay();
      sunMinutesRef.current = computeSunriseAndSunsetInMinutes(now, world.latitude);
      now.setHours(Math.floor(sunMinutesRef.current.sunrise / 60), -minuteInterval / 2);
      // set the initial date so that the scene gets a chance to render before the simulation starts
      setCommonStore((state) => {
        state.world.date = now.toLocaleString('en-US');
      });
    }
    simulationCompletedRef.current = false;
    fetchObjects();
    resetDailyMaps();
    resetYearlyMap();
  };

  const staticSimulateYearly = () => {
    fetchObjects();
    resetDailyMaps();
    resetYearlyMap();
    originalDateRef.current = new Date(world.date);
    sampledDayRef.current = 0;
    for (let month = 0; month < 12; month += monthInterval) {
      now.setMonth(month, 22);
      sunMinutesRef.current = computeSunriseAndSunsetInMinutes(now, world.latitude);
      resetDailyMaps();
      for (const e of elements) {
        if (e.type === ObjectType.Foundation) {
          const f = e as FoundationModel;
          if (f.solarStructure === SolarStructure.UpdraftTower && f.solarUpdraftTower) {
            calculateYieldWithoutAnimation(f);
          }
        }
      }
      finishMonthly();
      sampledDayRef.current++;
    }
    setCommonStore((state) => {
      state.world.date = originalDateRef.current.toLocaleString('en-US');
      state.viewState.showYearlyUpdraftTowerYieldPanel = true;
      state.selectedFloatingWindow = 'yearlySolarUpdraftTowerYieldPanel';
    });
    usePrimitiveStore.getState().set((state) => {
      state.runYearlySimulationForUpdraftTower = false;
      state.simulationInProgress = false;
      state.simulationPaused = false;
    });
    showInfo(i18n.t('message.SimulationCompleted', lang));
    simulationCompletedRef.current = true;
    generateYearlyData();
    if (loggable) {
      setCommonStore((state) => {
        const totalYield = useDataStore.getState().sumYearlyUpdraftTowerYield();
        state.actionInfo = {
          name: 'Static Yearly Simulation for Updraft Tower Completed',
          result: { totalYield: totalYield },
          details: useDataStore.getState().yearlyUpdraftTowerYield,
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  const simulateYearly = () => {
    if (runYearlySimulation && !pauseRef.current) {
      const totalMinutes = now.getMinutes() + now.getHours() * 60 + (now.getDay() - dayRef.current) * MINUTES_OF_DAY;
      if (totalMinutes + minuteInterval < sunMinutesRef.current.sunset) {
        // this is where time advances (by incrementing the minutes with the given interval)
        now.setHours(now.getHours(), now.getMinutes() + minuteInterval);
        setCommonStore((state) => {
          state.world.date = now.toLocaleString('en-US');
        });
        for (const e of elements) {
          if (e.type === ObjectType.Foundation) {
            const f = e as FoundationModel;
            if (f.solarStructure === SolarStructure.UpdraftTower && f.solarUpdraftTower) {
              calculateYield(f);
            }
          }
        }
        // recursive call to the next step of the simulation within the current day
        requestRef.current = requestAnimationFrame(simulateYearly);
      } else {
        finishMonthly();
        sampledDayRef.current++;
        if (sampledDayRef.current === daysPerYear) {
          cancelAnimationFrame(requestRef.current);
          setCommonStore((state) => {
            state.world.date = originalDateRef.current.toLocaleString('en-US');
            state.viewState.showYearlyUpdraftTowerYieldPanel = true;
            state.selectedFloatingWindow = 'yearlySolarUpdraftTowerYieldPanel';
          });
          usePrimitiveStore.getState().set((state) => {
            state.runYearlySimulationForUpdraftTower = false;
            state.simulationInProgress = false;
            state.simulationPaused = false;
          });
          showInfo(i18n.t('message.SimulationCompleted', lang));
          simulationCompletedRef.current = true;
          generateYearlyData();
          if (loggable) {
            setCommonStore((state) => {
              const totalYield = useDataStore.getState().sumYearlyUpdraftTowerYield();
              state.actionInfo = {
                name: 'Dynamic Yearly Simulation for Updraft Tower Completed',
                result: { totalYield: totalYield },
                details: useDataStore.getState().yearlyUpdraftTowerYield,
                timestamp: new Date().getTime(),
              };
            });
          }
          return;
        }
        // go to the next month
        now.setMonth(sampledDayRef.current * monthInterval, 22);
        dayRef.current = now.getDay();
        sunMinutesRef.current = computeSunriseAndSunsetInMinutes(now, world.latitude);
        now.setHours(Math.floor(sunMinutesRef.current.sunrise / 60), -minuteInterval / 2);
        resetDailyMaps();
        // recursive call to the next step of the simulation
        requestRef.current = requestAnimationFrame(simulateYearly);
      }
    }
  };

  const finishMonthly = () => {
    const timeFactor = getTimeFactorByMonth();
    for (const e of elements) {
      if (e.type === ObjectType.Foundation) {
        const f = e as FoundationModel;
        if (f.solarStructure === SolarStructure.UpdraftTower && f.solarUpdraftTower) {
          const outputs = dailyOutputsMapRef.current.get(f.id + '-sut');
          const chimneyInletTemperatures = dailyChimneyInletAirTemperaturesMapRef.current.get(e.id + '-sut');
          const windSpeeds = dailyWindSpeedsMapRef.current.get(e.id + '-sut');
          if (outputs && chimneyInletTemperatures && windSpeeds) {
            const transmissivity = f.solarUpdraftTower.collectorTransmissivity ?? 0.9;
            const turbineEfficiency = f.solarUpdraftTower.turbineEfficiency ?? 0.3;
            const dischargeCoefficient = f.solarUpdraftTower.dischargeCoefficient ?? 0.65;
            const chimneyArea = Math.PI * f.solarUpdraftTower.chimneyRadius * f.solarUpdraftTower.chimneyRadius;
            const collectorArea = Math.PI * f.solarUpdraftTower.collectorRadius * f.solarUpdraftTower.collectorRadius;
            const dca = AIR_DENSITY * AIR_ISOBARIC_SPECIFIC_HEAT * chimneyArea;
            const speedFactor = 2 * GRAVITATIONAL_ACCELERATION * f.solarUpdraftTower.chimneyHeight;
            const powerFactor = 0.5 * dischargeCoefficient * turbineEfficiency * AIR_DENSITY * chimneyArea;
            let temp;
            if (weather) {
              temp = computeOutsideTemperature(now, weather.lowestTemperatures, weather.highestTemperatures);
            }
            for (let i = 0; i < outputs.length; i++) {
              let ambientTemperature = 20;
              if (weather && temp) {
                now.setHours(i);
                ambientTemperature = getOutsideTemperatureAtMinute(
                  temp.high,
                  temp.low,
                  world.diurnalTemperatureModel,
                  highestTemperatureTimeInMinutes,
                  sunMinutes,
                  Util.minutesIntoDay(now),
                );
                dailyAmbientTemperaturesRef.current[i] = ambientTemperature;
              }
              outputs[i] *= timeFactor * transmissivity * 1000; // from kW to W
              const tAmbientK = ambientTemperature + KELVIN_AT_ZERO_CELSIUS;
              if (outputs[i] > 0 && i > 0 && chimneyInletTemperatures[i - 1] > ambientTemperature) {
                // assume that the average temperature of the collector is the mean between ambient and inlet
                const tCollector = (chimneyInletTemperatures[i - 1] + ambientTemperature) / 2;
                const convectiveLoss =
                  (world.airConvectiveCoefficient ?? 5) * collectorArea * (tCollector - ambientTemperature);
                const tCollectorK = tCollector + KELVIN_AT_ZERO_CELSIUS;
                const tCollector4 = tCollectorK * tCollectorK * tCollectorK * tCollectorK;
                const tAmbient4 = tAmbientK * tAmbientK * tAmbientK * tAmbientK;
                const radiationLoss =
                  (f.solarUpdraftTower.collectorEmissivity ?? 0.95) *
                  STEFAN_BOLTZMANN_CONSTANT *
                  collectorArea *
                  (tCollector4 - tAmbient4);
                outputs[i] -= convectiveLoss + radiationLoss;
                if (outputs[i] < 0) outputs[i] = 0;
              }
              const a = outputs[i] / (dca * tAmbientK);
              const temperature = tAmbientK * (1 + Math.cbrt((a * a) / speedFactor)) - KELVIN_AT_ZERO_CELSIUS;
              const speed =
                temperature > ambientTemperature
                  ? Math.sqrt(speedFactor * ((temperature + KELVIN_AT_ZERO_CELSIUS) / tAmbientK - 1))
                  : 0;
              outputs[i] = powerFactor * speed * speed * speed * 0.001; // from W to kW
              chimneyInletTemperatures[i] = temperature;
              windSpeeds[i] = speed;
            }
            const total = yearlyOutputsMapRef.current.get(f.id + '-sut');
            if (total) {
              const sumDaily = outputs.reduce((a, b) => a + b, 0);
              total[sampledDayRef.current] += sumDaily;
            }
          }
        }
      }
    }
    if (showDailyUpdraftTowerPanel) {
      generateDailyData();
    }
  };

  const generateYearlyData = () => {
    const resultArr = [];
    const labels = [];
    let index = 0;
    for (const e of elements) {
      if (e.type === ObjectType.Foundation) {
        const f = e as FoundationModel;
        if (f.solarStructure === SolarStructure.UpdraftTower && f.solarUpdraftTower) {
          const result = yearlyOutputsMapRef.current.get(e.id + '-sut');
          if (result) {
            resultArr.push(result);
            labels.push(e.label ? e.label : 'Tower' + ++index);
          }
        }
      }
    }
    const results = [];
    for (let month = 0; month < 12; month += monthInterval) {
      const r: DatumEntry = {};
      r['Month'] = MONTHS_ABBV[month];
      for (const [i, a] of resultArr.entries()) {
        r[labels[i]] = a[month / monthInterval] * daysOfMonth;
      }
      results.push(r);
    }
    setYearlyYield(results);
    setLabels(labels);
  };

  /* shared functions between daily and yearly simulation */

  const resetDailyMaps = () => {
    for (const e of elements) {
      if (e.type === ObjectType.Foundation) {
        const f = e as FoundationModel;
        if (f.solarStructure === SolarStructure.UpdraftTower && f.solarUpdraftTower) {
          const airTemperatures = dailyChimneyInletAirTemperaturesMapRef.current.get(e.id + '-sut');
          if (airTemperatures) {
            airTemperatures.fill(0);
          } else {
            dailyChimneyInletAirTemperaturesMapRef.current.set(e.id + '-sut', new Array(24).fill(0));
          }
          const windSpeeds = dailyWindSpeedsMapRef.current.get(e.id + '-sut');
          if (windSpeeds) {
            windSpeeds.fill(0);
          } else {
            dailyWindSpeedsMapRef.current.set(e.id + '-sut', new Array(24).fill(0));
          }
          const yields = dailyOutputsMapRef.current.get(e.id + '-sut');
          if (yields) {
            yields.fill(0);
          } else {
            dailyOutputsMapRef.current.set(e.id + '-sut', new Array(24).fill(0));
          }
        }
      }
    }
  };

  const resetYearlyMap = () => {
    for (const e of elements) {
      if (e.type === ObjectType.Foundation) {
        const f = e as FoundationModel;
        if (f.solarStructure === SolarStructure.UpdraftTower && f.solarUpdraftTower) {
          const yearlyOutput = yearlyOutputsMapRef.current.get(e.id + '-sut');
          if (yearlyOutput && yearlyOutput.length === daysPerYear) {
            yearlyOutput.fill(0);
          } else {
            yearlyOutputsMapRef.current.set(e.id + '-sut', new Array(daysPerYear).fill(0));
          }
        }
      }
    }
  };

  const calculateYield = (foundation: FoundationModel) => {
    const solarUpdraftTower = foundation.solarUpdraftTower;
    if (!solarUpdraftTower) return;
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z < ZERO_TOLERANCE) return; // when the sun is not out
    const output = dailyOutputsMapRef.current.get(foundation.id + '-sut');
    if (output) {
      const dayOfYear = Util.dayOfYear(now);
      const normal = new Vector3().fromArray(foundation.normal);
      const radius = solarUpdraftTower.collectorRadius;
      const max = Math.max(2, Math.round((radius * 2) / cellSize));
      // shift half cell size to the center of each grid cell
      const x0 = foundation.cx - radius + cellSize / 2;
      const y0 = foundation.cy - radius + cellSize / 2;
      const z0 = foundation.lz + solarUpdraftTower.collectorHeight;
      const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
      const indirectRadiation = calculateDiffuseAndReflectedRadiation(
        world.ground,
        now.getMonth(),
        normal,
        peakRadiation,
      );
      const vec = new Vector3(0, 0, z0);
      const dot = normal.dot(sunDirection);
      const rsq = radius * radius;
      let result = 0;
      let countPoints = 0;
      let dx, dy;
      for (let u = 0; u < max; u++) {
        vec.x = x0 + u * cellSize;
        dx = vec.x - foundation.cx;
        for (let v = 0; v < max; v++) {
          vec.y = y0 + v * cellSize;
          dy = vec.y - foundation.cy;
          if (dx * dx + dy * dy > rsq) continue;
          countPoints++;
          result += indirectRadiation;
          if (dot > 0) {
            if (!inShadow(foundation.id + '-sut', vec, sunDirection)) {
              result += dot * peakRadiation;
            }
          }
        }
      }
      if (countPoints) result /= countPoints;
      // the output is the average radiation intensity. if the minutes are greater than 30 or 30, it is counted
      // as the measurement of the next hour to maintain the symmetry around noon
      const index = now.getMinutes() >= 30 ? (now.getHours() + 1 === 24 ? 0 : now.getHours() + 1) : now.getHours();
      const area = Math.PI * solarUpdraftTower.collectorRadius * solarUpdraftTower.collectorRadius;
      output[index] += result * area;
    }
  };

  // if there are no moving parts, this is way faster
  const calculateYieldWithoutAnimation = (foundation: FoundationModel) => {
    const solarUpdraftTower = foundation.solarUpdraftTower;
    if (!solarUpdraftTower) return;
    const result = dailyOutputsMapRef.current.get(foundation.id + '-sut');
    if (!result) return;
    const normal = new Vector3().fromArray(foundation.normal);
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    const radius = solarUpdraftTower.collectorRadius;
    const max = Math.max(2, Math.round((radius * 2) / cellSize));
    // shift half cell size to the center of each grid cell
    const x0 = foundation.cx - radius + cellSize / 2;
    const y0 = foundation.cy - radius + cellSize / 2;
    const z0 = foundation.lz + solarUpdraftTower.collectorHeight;
    const v = new Vector3(0, 0, z0);
    const rsq = radius * radius;
    let countPoints = 0;
    let dx, dy;
    const area = Math.PI * solarUpdraftTower.collectorRadius * solarUpdraftTower.collectorRadius;
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < timesPerHour; j++) {
        // a shift of 30 minutes minute half of the interval ensures the symmetry of the result around noon
        const cur = new Date(year, month, date, i, (j + 0.5) * minuteInterval - 30);
        const sunDirection = getSunDirection(cur, world.latitude);
        if (sunDirection.z > 0) {
          // when the sun is out
          const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
          const indirectRadiation = calculateDiffuseAndReflectedRadiation(
            world.ground,
            month,
            UNIT_VECTOR_POS_Z,
            peakRadiation,
          );
          const dot = normal.dot(sunDirection);
          countPoints = 0;
          for (let kx = 0; kx < max; kx++) {
            v.x = x0 + kx * cellSize;
            dx = v.x - foundation.cx;
            for (let ky = 0; ky < max; ky++) {
              v.y = y0 + ky * cellSize;
              dy = v.y - foundation.cy;
              if (dx * dx + dy * dy > rsq) continue;
              countPoints++;
              result[i] += indirectRadiation;
              if (dot > 0) {
                if (!inShadow(foundation.id + '-sut', v, sunDirection)) {
                  result[i] += dot * peakRadiation;
                }
              }
            }
          }
        }
      }
      if (countPoints) result[i] /= countPoints;
      result[i] *= area;
    }
  };

  // apply clearness and convert the unit of time step from minute to hour so that we get kWh
  // (divided by times per hour as the radiation is added up that many times in an hour)
  const getTimeFactor = () => {
    const daylight = sunMinutes.daylight() / 60; // in hours
    return daylight > ZERO_TOLERANCE ? weather.sunshineHours[now.getMonth()] / (30 * daylight * timesPerHour) : 0;
  };

  const getTimeFactorByMonth = () => {
    const month = now.getMonth();
    const daylight = sunMinutesRef.current.daylight() / 60;
    return daylight > ZERO_TOLERANCE ? weather.sunshineHours[month] / (30 * daylight * timesPerHour) : 0;
  };

  const fetchObjects = () => {
    const content = scene.children.filter((c) => c.name === 'Content');
    if (content.length > 0) {
      const components = content[0].children;
      objectsRef.current.length = 0;
      for (const c of components) {
        Util.fetchSimulationElements(c, objectsRef.current);
      }
    }
  };

  const inShadow = (foundationId: string, position: Vector3, sunDirection: Vector3) => {
    if (objectsRef.current.length > 1) {
      intersectionsRef.current.length = 0;
      ray.set(position, sunDirection);
      const objects = objectsRef.current.filter((obj) => obj.uuid !== foundationId);
      ray.intersectObjects(objects, false, intersectionsRef.current);
      return intersectionsRef.current.length > 0;
    }
    return false;
  };

  return <></>;
});

export default SolarUpdraftTowerSimulation;
