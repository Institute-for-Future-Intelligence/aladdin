/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateDiffuseAndReflectedRadiation,
  calculatePeakRadiation,
  computeSunriseAndSunsetInMinutes,
  getSunDirection,
} from './sunTools';
import { Euler, Intersection, Object3D, Quaternion, Raycaster, Vector2, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useStore } from '../stores/common';
import * as Selector from 'src/stores/selector';
import { DatumEntry, Discretization, ObjectType, Orientation, ShadeTolerance, TrackerType } from '../types';
import { Util } from '../Util';
import { AirMass, MINUTES_OF_DAY } from './analysisConstants';
import { HALF_PI, MONTHS_ABBV, UNIT_VECTOR_POS_Y, UNIT_VECTOR_POS_Z, ZERO_TOLERANCE } from '../constants';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { computeOutsideTemperature, getOutsideTemperatureAtMinute } from './heatTools';
import { PvModel } from '../models/PvModel';
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { SunMinutes } from './SunMinutes';
import { WallModel } from '../models/WallModel';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';
import { useLanguage, useWeather } from '../hooks';
import { FoundationModel } from 'src/models/FoundationModel';

export interface SolarPanelSimulationProps {
  city: string | null;
}

const getPanelEfficiency = (temperature: number, pvModel: PvModel) => {
  let e = pvModel.efficiency;
  if (pvModel.cellType === 'Monocrystalline') {
    e *= 0.95; // assuming that the packing density factor of semi-round cells is 0.95
  }
  return e * (1 + pvModel.pmaxTC * (temperature - 25));
};

const SolarPanelSimulation = React.memo(({ city }: SolarPanelSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const setPrimitiveStore = usePrimitiveStore(Selector.setPrimitiveStore);
  const loggable = useStore(Selector.loggable);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getPvModule = useStore(Selector.getPvModule);
  const getParent = useStore(Selector.getParent);
  const getFoundation = useStore(Selector.getFoundation);
  const setDailyYield = useDataStore(Selector.setDailyPvYield);
  const updateDailyYield = useStore(Selector.updateSolarCollectorDailyYieldById);
  const setYearlyYield = useDataStore(Selector.setYearlyPvYield);
  const updateYearlyYield = useStore(Selector.updateSolarCollectorYearlyYieldById);
  const dailyIndividualOutputs = useStore(Selector.dailyPvIndividualOutputs);
  const yearlyIndividualOutputs = useStore(Selector.yearlyPvIndividualOutputs);
  const setSolarPanelLabels = useDataStore(Selector.setSolarPanelLabels);
  const runDailySimulation = usePrimitiveStore(Selector.runDailySimulationForSolarPanels);
  const runDailySimulationLastStep = usePrimitiveStore(Selector.runDailySimulationForSolarPanelsLastStep);
  const pauseDailySimulation = usePrimitiveStore(Selector.pauseDailySimulationForSolarPanels);
  const runYearlySimulation = usePrimitiveStore(Selector.runYearlySimulationForSolarPanels);
  const runYearlySimulationLastStep = usePrimitiveStore(Selector.runYearlySimulationForSolarPanelsLastStep);
  const pauseYearlySimulation = usePrimitiveStore(Selector.pauseYearlySimulationForSolarPanels);
  const showDailyPvYieldPanel = useStore(Selector.viewState.showDailyPvYieldPanel);
  const noAnimation = useStore(Selector.world.noAnimationForSolarPanelSimulation);
  const highestTemperatureTimeInMinutes = useStore(Selector.world.highestTemperatureTimeInMinutes) ?? 900;
  const runEvolution = usePrimitiveStore(Selector.runEvolution);

  const { scene } = useThree();
  const lang = useLanguage();
  const weather = useWeather(city);
  const now = new Date(world.date);

  const elevation = city ? weather?.elevation : 0;
  const timesPerHour = world.timesPerHour ?? 4;
  const minuteInterval = 60 / timesPerHour;
  const daysPerYear = world.daysPerYear ?? 6;
  const monthInterval = 12 / daysPerYear;
  const ray = useMemo(() => new Raycaster(), []);
  const monthlyIrradianceLosses = world.monthlyIrradianceLosses ?? new Array(12).fill(0.05);
  const cellSize = world.pvGridCellSize ?? 0.25;
  const objectsRef = useRef<Object3D[]>([]); // reuse array in intersection detection
  const intersectionsRef = useRef<Intersection[]>([]); // reuse array in intersection detection
  const requestRef = useRef<number>(0);
  const simulationCompletedRef = useRef<boolean>(false);
  const originalDateRef = useRef<Date>(new Date(world.date));
  const dailyOutputsMapRef = useRef<Map<string, number[]>>(new Map<string, number[]>());
  const yearlyOutputsMapRef = useRef<Map<string, number[]>>(new Map<string, number[]>());
  const sampledDayRef = useRef<number>(0);
  const pauseRef = useRef<boolean>(false);
  const pausedDateRef = useRef<Date>(new Date(world.date));
  const dayRef = useRef<number>(0);
  const currentTemperatureRef = useRef<number>(20);

  // this is used in daily simulation that should respond to change of date and latitude
  const sunMinutes = useMemo(() => {
    return computeSunriseAndSunsetInMinutes(now, world.latitude);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world.date, world.latitude]);

  // this is used in yearly simulation in which the date is changed programmatically based on the current latitude
  const sunMinutesRef = useRef<SunMinutes>(sunMinutes);

  const daysOfMonth = Util.daysInYear(now) / 12;

  /* do the daily simulation to generate daily PV outputs */

  useEffect(() => {
    if (runDailySimulation) {
      if (noAnimation && !Util.hasMovingParts(elements)) {
        // this causes the simulation code to run at the beginning of the next event cycle
        // that hopefully has the updated scene graph
        setTimeout(() => {
          staticSimulateDaily(false);
        }, 50);
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

  // this is used in the last step of simulation in an evolution
  useEffect(() => {
    if (runDailySimulationLastStep) {
      if (noAnimation && !Util.hasMovingParts(elements)) {
        // this causes the simulation code to run at the beginning of the next event cycle
        // that hopefully has the updated scene graph
        setTimeout(() => {
          staticSimulateDaily(true);
        }, 50);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runDailySimulationLastStep]);

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

  const staticSimulateDaily = (lastStep: boolean) => {
    fetchObjects();
    resetDailyOutputsMap();
    for (const e of elements) {
      if (e.type === ObjectType.SolarPanel) {
        calculateYieldWithoutAnimation(e as SolarPanelModel);
      }
    }
    setCommonStore((state) => {
      if (!runEvolution && !lastStep) {
        state.viewState.showDailyPvYieldPanel = true;
        state.selectedFloatingWindow = 'dailyPvYieldPanel';
      }
    });
    usePrimitiveStore.getState().set((state) => {
      if (lastStep) {
        state.runDailySimulationForSolarPanelsLastStep = false;
      } else {
        state.runDailySimulationForSolarPanels = false;
      }
      state.simulationInProgress = false;
      state.simulationPaused = false;
    });
    simulationCompletedRef.current = true;
    finishDaily();
    if (!runEvolution && !lastStep) {
      // don't show info or log data when this simulation is called by an evolution
      showInfo(i18n.t('message.SimulationCompleted', lang));
      if (loggable) {
        const totalDailyYield = useDataStore.getState().sumDailyPvYield();
        const dailyProfit = useDataStore.getState().getDailyPvProfit();
        const dailyYieldArray = useDataStore.getState().dailyPvYield;
        setCommonStore((state) => {
          state.actionInfo = {
            name: 'Static Daily Simulation for Solar Panels Completed',
            result: { totalYield: totalDailyYield.toFixed(2), profit: dailyProfit.toFixed(2) },
            details: dailyYieldArray,
            timestamp: new Date().getTime(),
          };
        });
      }
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
      // beginning before the sunrise hour just in case and to provide a cue
      now.setHours(Math.floor(sunMinutes.sunrise / 60), -minuteInterval / 2);
    }
    simulationCompletedRef.current = false;
    fetchObjects();
    resetDailyOutputsMap();
  };

  const simulateDaily = () => {
    if (runDailySimulation && !pauseRef.current) {
      const totalMinutes = now.getMinutes() + now.getHours() * 60 + (now.getDay() - dayRef.current) * MINUTES_OF_DAY;
      if (totalMinutes + minuteInterval >= sunMinutes.sunset) {
        cancelAnimationFrame(requestRef.current);
        setCommonStore((state) => {
          state.world.date = originalDateRef.current.toLocaleString('en-US');
          if (!runEvolution) {
            state.viewState.showDailyPvYieldPanel = true;
            state.selectedFloatingWindow = 'dailyPvYieldPanel';
          }
        });
        usePrimitiveStore.getState().set((state) => {
          state.runDailySimulationForSolarPanels = false;
          state.simulationInProgress = false;
          state.simulationPaused = false;
        });
        simulationCompletedRef.current = true;
        finishDaily();
        if (!runEvolution) {
          // don't show info or log data when this simulation is called by an evolution
          showInfo(i18n.t('message.SimulationCompleted', lang));
          if (loggable) {
            const totalDailyYield = useDataStore.getState().sumDailyPvYield();
            const dailyProfit = useDataStore.getState().getDailyPvProfit();
            const dailyYieldArray = useDataStore.getState().dailyPvYield;
            setCommonStore((state) => {
              state.actionInfo = {
                name: 'Dynamic Daily Simulation for Solar Panels Completed',
                result: { totalYield: totalDailyYield.toFixed(2), profit: dailyProfit.toFixed(2) },
                details: dailyYieldArray,
                timestamp: new Date().getTime(),
              };
            });
          }
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
        if (e.type === ObjectType.SolarPanel) {
          calculateYield(e as SolarPanelModel);
        }
      }
      // recursive call to the next step of the simulation
      requestRef.current = requestAnimationFrame(simulateDaily);
    }
  };

  const finishDaily = () => {
    const timeFactor = getTimeFactor();
    for (const e of elements) {
      if (e.type === ObjectType.SolarPanel) {
        const panel = e as SolarPanelModel;
        const output = dailyOutputsMapRef.current.get(e.id);
        if (output) {
          const factor = getElementFactor(panel) * timeFactor;
          for (let i = 0; i < output.length; i++) {
            if (output[i] !== 0) output[i] *= factor;
          }
        }
      }
    }
    generateDailyData();
  };

  const generateDailyData = () => {
    if (dailyIndividualOutputs) {
      const total = new Array(24).fill(0);
      const map = new Map<string, number[]>();
      let index = 0;
      const labels = [];
      for (const e of elements) {
        if (e.type === ObjectType.SolarPanel) {
          const output = dailyOutputsMapRef.current.get(e.id);
          if (output) {
            updateDailyYield(
              e.id,
              output.reduce((a, b) => a + b, 0),
            );
            index++;
            map.set('Panel' + index, output);
            labels.push(e.label ? e.label : 'Panel' + index);
            for (let i = 0; i < 24; i++) {
              total[i] += output[i];
            }
          }
        }
      }
      const data = [];
      for (let i = 0; i < 24; i++) {
        const datum: DatumEntry = {};
        datum['Hour'] = i;
        for (let k = 1; k <= index; k++) {
          const key = 'Panel' + k;
          datum[labels[k - 1]] = map.get(key)?.[i];
        }
        data.push(datum);
      }
      setDailyYield(data);
      setSolarPanelLabels(labels);
    } else {
      const total = new Array(24).fill(0);
      for (const e of elements) {
        if (e.type === ObjectType.SolarPanel) {
          const output = dailyOutputsMapRef.current.get(e.id);
          if (output) {
            updateDailyYield(
              e.id,
              output.reduce((a, b) => a + b, 0),
            );
            for (let i = 0; i < 24; i++) {
              total[i] += output[i];
            }
          }
        }
      }
      const data = [];
      for (let i = 0; i < 24; i++) {
        data.push({ Hour: i, Total: total[i] } as DatumEntry);
      }
      setDailyYield(data);
    }
  };

  /* do the yearly simulation to generate yearly PV outputs */

  const [monthIndex, setMonthIndex] = useState<number>(now.getMonth());

  useEffect(() => {
    // give it some time for the scene to update as a result of month change
    setTimeout(() => {
      fetchObjects();
    }, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthIndex]);

  useEffect(() => {
    if (runYearlySimulation) {
      if (noAnimation && !Util.hasMovingParts(elements)) {
        // this causes the simulation code to run at the beginning of the next event cycle
        // that hopefully has the updated scene graph
        setTimeout(() => {
          staticSimulateYearly(false);
        }, 50);
      } else {
        initYearly();
        setMonthIndex(now.getMonth());
        fetchObjects(); // ensure that the objects are fetched if the initial date happens to be in January
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

  // this is used for the last step of simulation in an evolution
  useEffect(() => {
    if (runYearlySimulationLastStep) {
      if (noAnimation && !Util.hasMovingParts(elements)) {
        // this causes the simulation code to run at the beginning of the next event cycle
        // that hopefully has the updated scene graph
        setTimeout(() => {
          staticSimulateYearly(true);
        }, 50);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runYearlySimulationLastStep]);

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
    resetDailyOutputsMap();
    resetYearlyOutputsMap();
  };

  const staticSimulateYearly = (lastStep: boolean) => {
    fetchObjects();
    resetDailyOutputsMap();
    resetYearlyOutputsMap();
    originalDateRef.current = new Date(world.date);
    sampledDayRef.current = 0;
    for (let month = 0; month < 12; month += monthInterval) {
      now.setMonth(month, 22);
      sunMinutesRef.current = computeSunriseAndSunsetInMinutes(now, world.latitude);
      resetDailyOutputsMap();
      for (const e of elements) {
        if (e.type === ObjectType.SolarPanel) {
          calculateYieldWithoutAnimation(e as SolarPanelModel);
        }
      }
      finishMonthly();
      sampledDayRef.current++;
    }
    setCommonStore((state) => {
      state.world.date = originalDateRef.current.toLocaleString('en-US');
      if (!runEvolution && !lastStep) {
        state.viewState.showYearlyPvYieldPanel = true;
        state.selectedFloatingWindow = 'yearlyPvYieldPanel';
      }
    });
    usePrimitiveStore.getState().set((state) => {
      if (lastStep) {
        state.runYearlySimulationForSolarPanelsLastStep = false;
      } else {
        state.runYearlySimulationForSolarPanels = false;
      }
      state.simulationInProgress = false;
      state.simulationPaused = false;
    });
    simulationCompletedRef.current = true;
    generateYearlyData();
    if (!runEvolution && !lastStep) {
      // don't show info or log data when this simulation is called by an evolution
      showInfo(i18n.t('message.SimulationCompleted', lang));
      if (loggable) {
        const totalYearlyYield = useDataStore.getState().sumYearlyPvYield();
        const yearlyProfit = useDataStore.getState().getYearlyPvProfit();
        const yearlyYieldArray = useDataStore.getState().yearlyPvYield;
        setCommonStore((state) => {
          state.actionInfo = {
            name: 'Static Yearly Simulation for Solar Panels Completed',
            result: { totalYield: totalYearlyYield.toFixed(2), profit: yearlyProfit.toFixed(2) },
            details: yearlyYieldArray,
            timestamp: new Date().getTime(),
          };
        });
      }
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
          if (e.type === ObjectType.SolarPanel) {
            calculateYield(e as SolarPanelModel);
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
            if (!runEvolution) {
              state.viewState.showYearlyPvYieldPanel = true;
              state.selectedFloatingWindow = 'yearlyPvYieldPanel';
            }
          });
          usePrimitiveStore.getState().set((state) => {
            state.runYearlySimulationForSolarPanels = false;
            state.simulationInProgress = false;
            state.simulationPaused = false;
          });
          simulationCompletedRef.current = true;
          generateYearlyData();
          if (!runEvolution) {
            // don't show info or log data when this simulation is called by an evolution
            showInfo(i18n.t('message.SimulationCompleted', lang));
            if (loggable) {
              const totalYearlyYield = useDataStore.getState().sumYearlyPvYield();
              const yearlyProfit = useDataStore.getState().getYearlyPvProfit();
              const yearlyYieldArray = useDataStore.getState().yearlyPvYield;
              setCommonStore((state) => {
                state.actionInfo = {
                  name: 'Dynamic Yearly Simulation for Solar Panels Completed',
                  result: { totalYield: totalYearlyYield.toFixed(2), profit: yearlyProfit.toFixed(2) },
                  details: yearlyYieldArray,
                  timestamp: new Date().getTime(),
                };
              });
            }
          }
          return;
        }
        // go to the next month
        now.setMonth(sampledDayRef.current * monthInterval, 22);
        setMonthIndex(now.getMonth());
        dayRef.current = now.getDay();
        sunMinutesRef.current = computeSunriseAndSunsetInMinutes(now, world.latitude);
        now.setHours(Math.floor(sunMinutesRef.current.sunrise / 60), -minuteInterval / 2);
        resetDailyOutputsMap();
        // recursive call to the next step of the simulation
        requestRef.current = requestAnimationFrame(simulateYearly);
      }
    }
  };

  const finishMonthly = () => {
    const timeFactor = getTimeFactorByMonth();
    for (const e of elements) {
      if (e.type === ObjectType.SolarPanel) {
        const panel = e as SolarPanelModel;
        const result = dailyOutputsMapRef.current.get(e.id);
        if (result) {
          const total = yearlyOutputsMapRef.current.get(e.id);
          if (total) {
            const sumDaily = result.reduce((a, b) => a + b, 0);
            total[sampledDayRef.current] += sumDaily * timeFactor * getElementFactor(panel);
          }
        }
      }
    }
    if (!runEvolution && showDailyPvYieldPanel) finishDaily();
  };

  // TODO:
  // Figure out a way to regenerate the graph without redoing the calculation
  // when switching between individual and total outputs
  const generateYearlyData = () => {
    if (yearlyIndividualOutputs) {
      const resultArr = [];
      const labels = [];
      let index = 0;
      for (const e of elements) {
        if (e.type === ObjectType.SolarPanel) {
          const output = yearlyOutputsMapRef.current.get(e.id);
          if (output) {
            updateYearlyYield(e.id, output.reduce((a, b) => a + b, 0) * monthInterval * daysOfMonth);
            resultArr.push(output);
            index++;
            labels.push(e.label ?? 'Panel' + index);
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
      setSolarPanelLabels(labels);
    } else {
      const resultArr = [];
      for (const e of elements) {
        if (e.type === ObjectType.SolarPanel) {
          const output = yearlyOutputsMapRef.current.get(e.id);
          if (output) {
            updateYearlyYield(e.id, output.reduce((a, b) => a + b, 0) * monthInterval * daysOfMonth);
            resultArr.push(output);
          }
        }
      }
      const results = [];
      for (let month = 0; month < 12; month += monthInterval) {
        let total = 0;
        for (const result of resultArr) {
          total += result[month / monthInterval];
        }
        results.push({ Month: MONTHS_ABBV[month], Total: total * daysOfMonth } as DatumEntry);
      }
      setYearlyYield(results);
    }
  };

  /* shared functions between daily and yearly simulation */

  // if there are no moving parts, this is way faster
  const calculateYieldWithoutAnimation = (panel: SolarPanelModel) => {
    if (panel.trackerType !== TrackerType.NO_TRACKER)
      throw new Error('static simulation is not for solar panel with tracker');
    let parent = getParent(panel);
    if (!parent) throw new Error('parent of solar panel does not exist');
    const rooftop = panel.parentType === ObjectType.Roof;
    const walltop = panel.parentType === ObjectType.Wall;
    if (rooftop) {
      // x and y coordinates of a rooftop solar panel are relative to the foundation
      parent = getFoundation(parent);
      if (!parent) throw new Error('foundation of solar panel does not exist');
    }
    const pvModel = getPvModule(panel.pvModelName);
    if (!pvModel) throw new Error('PV model not found');
    const output = dailyOutputsMapRef.current.get(panel.id);
    if (!output) return;
    const center = walltop
      ? Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent, getFoundation(panel), panel.lz)
      : Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent, undefined, undefined, true);
    const rot = parent.rotation[2];
    let zRot = rot + panel.relativeAzimuth;
    let angle = panel.tiltAngle;
    let flat = true;
    if (rooftop) {
      // z coordinate of a rooftop solar panel is absolute
      center.z = panel.cz + panel.lz + 0.02 + parent.cz;
      if (Util.isZero(panel.rotation[0])) {
        // on a flat roof, add pole height
        center.z += panel.poleHeight;
      } else {
        // on a no-flat roof, ignore tilt angle
        angle = panel.rotation[0];
        zRot = rot;
        flat = false;
      }
    }
    if (walltop && !Util.isZero(panel.tiltAngle)) {
      const wall = parent as WallModel;
      const foundation = getFoundation(parent);
      const wallAbsAngle = foundation ? foundation.rotation[2] + wall.relativeAngle : wall.relativeAngle;
      const an = wallAbsAngle - HALF_PI;
      const dr = (panel.ly * Math.abs(Math.sin(panel.tiltAngle))) / 2;
      center.x += dr * Math.cos(an); // panel.ly has been rotated based on the orientation
      center.y += dr * Math.sin(an);
    }
    const normal = new Vector3().fromArray(panel.normal);
    // TODO: right now we assume a parent rotation is always around the z-axis
    // normal has been set if it is on top of a tilted roof, but has not if it is on top of a foundation or flat roof
    // or wall. So we only need to tilt the normal for a solar panel on a foundation or flat roof or wall.
    const normalEuler = new Euler(rooftop && !flat ? 0 : angle, 0, zRot, 'ZYX');
    normal.applyEuler(normalEuler);
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    let lx: number, ly: number, nx: number, ny: number;
    let dCell: number;
    if (world.discretization === Discretization.EXACT) {
      lx = panel.lx;
      ly = panel.ly;
      if (panel.orientation === Orientation.portrait) {
        nx = Math.max(1, Math.round(panel.lx / pvModel.width));
        ny = Math.max(1, Math.round(panel.ly / pvModel.length));
        nx *= pvModel.n;
        ny *= pvModel.m;
      } else {
        nx = Math.max(1, Math.round(panel.lx / pvModel.length));
        ny = Math.max(1, Math.round(panel.ly / pvModel.width));
        nx *= pvModel.m;
        ny *= pvModel.n;
      }
      dCell = panel.lx / nx;
    } else {
      lx = panel.lx;
      ly = panel.ly;
      nx = Math.max(2, Math.round(panel.lx / cellSize));
      ny = Math.max(2, Math.round(panel.ly / cellSize));
      // nx and ny must be even (for circuit simulation)
      if (nx % 2 !== 0) nx += 1;
      if (ny % 2 !== 0) ny += 1;
      dCell = cellSize;
    }
    const dx = lx / nx;
    const dy = ly / ny;
    // shift half cell size to the center of each grid cell
    const x0 = center.x - (lx - dCell) / 2;
    const y0 = center.y - (ly - dCell) / 2;
    const z0 = rooftop || walltop ? center.z : parent.lz + panel.poleHeight + panel.lz;
    const center2d = new Vector2(center.x, center.y);
    const v = new Vector3();
    const cellOutputs = Array.from(Array<number>(nx), () => new Array<number>(ny));
    // the dot array on a solar panel above a tilted roof has not been tilted or rotated
    // we need to set the normal Euler below for this case
    if (rooftop && !flat) {
      normalEuler.x = panel.rotation[0];
      normalEuler.z = panel.rotation[2] + rot;
    }
    if (walltop) {
      // wall panels use negative tilt angles, opposite to foundation panels, so we use + below.
      normalEuler.x = HALF_PI + panel.tiltAngle;
      normalEuler.z = (parent as WallModel).relativeAngle + rot;
    }
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < timesPerHour; j++) {
        // a shift of 30 minutes minute half of the interval ensures the symmetry of the result around noon
        const currentTime = new Date(year, month, date, i, (j + 0.5) * minuteInterval - 30);
        const sunDirection = getSunDirection(currentTime, world.latitude);
        if (sunDirection.z > 0) {
          // when the sun is out
          const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
          const frontIndirectRadiation = calculateDiffuseAndReflectedRadiation(
            world.ground,
            month,
            normal,
            peakRadiation,
          );
          const dot = normal.dot(sunDirection);
          const v2d = new Vector2();
          const dv = new Vector3();
          if (pvModel.bifacialityFactor > 0) {
            // bifacial panel
            const backsideNormal = normal.clone().negate();
            const backIndirectRadiation = calculateDiffuseAndReflectedRadiation(
              world.ground,
              month,
              backsideNormal,
              peakRadiation,
            );
            const indirectRadiation = frontIndirectRadiation + backIndirectRadiation * pvModel.bifacialityFactor;
            for (let kx = 0; kx < nx; kx++) {
              for (let ky = 0; ky < ny; ky++) {
                cellOutputs[kx][ky] = indirectRadiation;
                v2d.set(x0 + kx * dx, y0 + ky * dy);
                dv.set(v2d.x - center2d.x, v2d.y - center2d.y, 0);
                dv.applyEuler(normalEuler);
                v.set(center.x + dv.x, center.y + dv.y, z0 + dv.z);
                if (!inShadow(panel.id, v, sunDirection)) {
                  cellOutputs[kx][ky] += (dot > 0 ? dot : -dot * pvModel.bifacialityFactor) * peakRadiation;
                }
              }
            }
          } else {
            // monofacial panel
            for (let kx = 0; kx < nx; kx++) {
              for (let ky = 0; ky < ny; ky++) {
                cellOutputs[kx][ky] = frontIndirectRadiation;
                if (dot > 0) {
                  v2d.set(x0 + kx * dx, y0 + ky * dy);
                  dv.set(v2d.x - center2d.x, v2d.y - center2d.y, 0);
                  dv.applyEuler(normalEuler);
                  v.set(center.x + dv.x, center.y + dv.y, z0 + dv.z);
                  if (!inShadow(panel.id, v, sunDirection)) {
                    // direct radiation
                    cellOutputs[kx][ky] += dot * peakRadiation;
                  }
                }
              }
            }
          }
          // we must consider cell wiring and distributed efficiency
          // Nice demo at: https://www.youtube.com/watch?v=UNPJapaZlCU
          let sum = 0;
          updateTemperature(currentTime);
          const eff = getPanelEfficiency(currentTemperatureRef.current, pvModel);
          switch (pvModel.shadeTolerance) {
            case ShadeTolerance.NONE: {
              // all the cells are connected in a single series,
              // so the total output is determined by the minimum
              let min1 = Number.MAX_VALUE;
              for (let kx = 0; kx < nx; kx++) {
                for (let ky = 0; ky < ny; ky++) {
                  const c = cellOutputs[kx][ky];
                  if (c < min1) {
                    min1 = c;
                  }
                }
              }
              sum = min1 * nx * ny;
              break;
            }
            case ShadeTolerance.PARTIAL: {
              // assuming each panel uses a diode bypass to connect two columns of cells
              let min2 = Number.MAX_VALUE;
              if (panel.orientation === Orientation.portrait) {
                // e.g., nx = 6, ny = 10
                for (let kx = 0; kx < nx; kx++) {
                  if (kx % 2 === 0) {
                    // reset min every two columns of cells
                    min2 = Number.MAX_VALUE;
                  }
                  for (let ky = 0; ky < ny; ky++) {
                    const c = cellOutputs[kx][ky];
                    if (c < min2) {
                      min2 = c;
                    }
                  }
                  if (kx % 2 === 1) {
                    sum += min2 * ny * 2;
                  }
                }
              } else {
                // landscape, e.g., nx = 10, ny = 6
                for (let ky = 0; ky < ny; ky++) {
                  if (ky % 2 === 0) {
                    // reset min every two columns of cells
                    min2 = Number.MAX_VALUE;
                  }
                  for (let kx = 0; kx < nx; kx++) {
                    const c = cellOutputs[kx][ky];
                    if (c < min2) {
                      min2 = c;
                    }
                  }
                  if (ky % 2 === 1) {
                    sum += min2 * nx * 2;
                  }
                }
              }
              break;
            }
            default: {
              // this probably is too idealized
              for (let kx = 0; kx < nx; kx++) {
                for (let ky = 0; ky < ny; ky++) {
                  sum += cellOutputs[kx][ky];
                }
              }
              break;
            }
          }
          output[i] += (eff * sum) / (nx * ny);
        } else {
          for (let kx = 0; kx < nx; kx++) {
            for (let ky = 0; ky < ny; ky++) {
              cellOutputs[kx][ky] = 0;
            }
          }
        }
      }
    }
  };

  const calculateYield = (panel: SolarPanelModel) => {
    let parent = getParent(panel);
    if (!parent) throw new Error('parent of solar panel does not exist');
    const rooftop = panel.parentType === ObjectType.Roof;
    const walltop = panel.parentType === ObjectType.Wall;
    const slopetop = parent.type === ObjectType.Foundation && (parent as FoundationModel).enableSlope;
    const cubeside = parent.type === ObjectType.Cuboid && !Util.isEqual(panel.normal[2], 1);
    if (rooftop) {
      // x and y coordinates of a rooftop solar panel are relative to the foundation
      parent = getFoundation(parent);
      if (!parent) throw new Error('foundation of solar panel does not exist');
    }
    const pvModel = getPvModule(panel.pvModelName);
    if (!pvModel) throw new Error('PV model not found');
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z <= 0) return; // when the sun is not out
    const center = walltop
      ? Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent, getFoundation(panel), panel.lz)
      : Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent, undefined, undefined, true);
    const rot = parent.type === ObjectType.Cuboid ? Util.getWorldDataById(parent.id).rot : parent.rotation[2];
    let angle = panel.tiltAngle;
    let zRot = rot + (walltop || cubeside ? 0 : panel.relativeAzimuth);
    let flat = true;
    if (rooftop) {
      // z coordinate of a rooftop solar panel is absolute
      center.z = panel.cz + panel.lz + 0.02 + parent.cz;
      if (Util.isZero(panel.rotation[0])) {
        // on a flat roof, add pole height
        center.z += panel.poleHeight;
      } else {
        // on a no-flat roof, ignore tilt angle
        angle = panel.rotation[0];
        zRot = rot;
        flat = false;
      }
    }
    if (walltop && !Util.isZero(panel.tiltAngle)) {
      const wall = parent as WallModel;
      const foundation = getFoundation(parent);
      const wallAbsAngle = foundation ? foundation.rotation[2] + wall.relativeAngle : wall.relativeAngle;
      const an = wallAbsAngle - HALF_PI;
      const dr = (panel.ly * Math.abs(Math.sin(panel.tiltAngle))) / 2;
      center.x += dr * Math.cos(an); // panel.ly has been rotated based on the orientation
      center.y += dr * Math.sin(an);
    }
    if (slopetop) {
      const f = parent as FoundationModel;
      center.z = f.lz + Util.getZOnSlope(f.lx, f.slope, panel.cx);
    }
    const normal = new Vector3().fromArray(panel.normal);
    const month = now.getMonth();
    const dayOfYear = Util.dayOfYear(now);
    let lx: number, ly: number, nx: number, ny: number;
    let dCell: number;
    if (world.discretization === Discretization.EXACT) {
      lx = panel.lx;
      ly = panel.ly;
      if (panel.orientation === Orientation.portrait) {
        nx = Math.max(1, Math.round(panel.lx / pvModel.width));
        ny = Math.max(1, Math.round(panel.ly / pvModel.length));
        nx *= pvModel.n;
        ny *= pvModel.m;
      } else {
        nx = Math.max(1, Math.round(panel.lx / pvModel.length));
        ny = Math.max(1, Math.round(panel.ly / pvModel.width));
        nx *= pvModel.m;
        ny *= pvModel.n;
      }
      dCell = panel.lx / nx;
    } else {
      lx = panel.lx;
      ly = panel.ly;
      nx = Math.max(2, Math.round(panel.lx / cellSize));
      ny = Math.max(2, Math.round(panel.ly / cellSize));
      // nx and ny must be even (for circuit simulation)
      if (nx % 2 !== 0) nx += 1;
      if (ny % 2 !== 0) ny += 1;
      dCell = cellSize;
    }
    const dx = lx / nx;
    const dy = ly / ny;
    // shift half cell size to the center of each grid cell
    const x0 = center.x - (lx - dCell) / 2;
    const y0 = center.y - (ly - dCell) / 2;
    const z0 = rooftop || walltop ? center.z : (slopetop ? center.z : parent.lz) + panel.poleHeight + panel.lz;
    const center2d = new Vector2(center.x, center.y);
    const v = new Vector3();
    const cellOutputs = Array.from(Array<number>(nx), () => new Array<number>(ny));
    // normal has been set if it is on top of a tilted roof, but has not if it is on top of a foundation or flat roof.
    // so we only need to tilt the normal for a solar panel on a foundation or flat roof
    let normalEuler = new Euler(rooftop && !flat ? 0 : angle, 0, zRot, 'ZYX');
    if (panel.trackerType !== TrackerType.NO_TRACKER) {
      // dynamic angles
      const rotatedSunDirection = rot
        ? sunDirection.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, -rot)
        : sunDirection.clone();
      switch (panel.trackerType) {
        case TrackerType.ALTAZIMUTH_DUAL_AXIS_TRACKER: {
          const qRotAADAT = new Quaternion().setFromUnitVectors(UNIT_VECTOR_POS_Z, rotatedSunDirection);
          normalEuler = new Euler().setFromQuaternion(qRotAADAT);
          // the default order is XYZ, so we rotate the relative azimuth below using the z-component
          normalEuler.z += zRot;
          break;
        }
        case TrackerType.HORIZONTAL_SINGLE_AXIS_TRACKER: {
          const qRotHSAT = new Quaternion().setFromUnitVectors(
            UNIT_VECTOR_POS_Z,
            new Vector3(rotatedSunDirection.x, 0, rotatedSunDirection.z).normalize(),
          );
          normalEuler = new Euler().setFromQuaternion(qRotHSAT);
          // the default order is XYZ, so we rotate the relative azimuth below using the z-component
          normalEuler.z += zRot;
          break;
        }
        case TrackerType.VERTICAL_SINGLE_AXIS_TRACKER: {
          const v2 = new Vector3(rotatedSunDirection.x, -rotatedSunDirection.y, 0).normalize();
          const az = Math.acos(UNIT_VECTOR_POS_Y.dot(v2)) * Math.sign(v2.x);
          normalEuler = new Euler(panel.tiltAngle, 0, az + rot, 'ZYX');
          break;
        }
        case TrackerType.TILTED_SINGLE_AXIS_TRACKER: {
          // TODO
          break;
        }
      }
    }
    if (walltop) {
      normal.applyEuler(new Euler(0, 0, (parent as WallModel).relativeAngle));
    }
    normal.applyEuler(normalEuler);
    // the dot array on a solar panel above a tilted roof has not been tilted or rotated
    // we need to set the normal Euler below for this case
    if (rooftop && !flat) {
      normalEuler.x = panel.rotation[0];
      normalEuler.z = panel.rotation[2] + rot;
    }
    if (walltop) {
      const foundation = getParent(panel);
      if (foundation) {
        // wall panels use negative tilt angles, opposite to foundation panels, so we use + below.
        normalEuler.x = HALF_PI + panel.tiltAngle;
        normalEuler.z = (parent as WallModel).relativeAngle + foundation.rotation[2];
      }
    }
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const frontIndirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, month, normal, peakRadiation);
    const dot = normal.dot(sunDirection);
    const v2d = new Vector2();
    const dv = new Vector3();
    if (pvModel.bifacialityFactor > 0) {
      // bifacial panel
      const backsideNormal = normal.clone().negate();
      const backIndirectRadiation = calculateDiffuseAndReflectedRadiation(
        world.ground,
        month,
        backsideNormal,
        peakRadiation,
      );
      const indirectRadiation = frontIndirectRadiation + backIndirectRadiation * pvModel.bifacialityFactor;
      for (let kx = 0; kx < nx; kx++) {
        for (let ky = 0; ky < ny; ky++) {
          cellOutputs[kx][ky] = indirectRadiation;
          v2d.set(x0 + kx * dx, y0 + ky * dy);
          dv.set(v2d.x - center2d.x, v2d.y - center2d.y, 0);
          dv.applyEuler(normalEuler);
          v.set(center.x + dv.x, center.y + dv.y, z0 + dv.z);
          if (!inShadow(panel.id, v, sunDirection)) {
            cellOutputs[kx][ky] += (dot > 0 ? dot : -dot * pvModel.bifacialityFactor) * peakRadiation;
          }
        }
      }
    } else {
      // monofacial panel
      for (let kx = 0; kx < nx; kx++) {
        for (let ky = 0; ky < ny; ky++) {
          cellOutputs[kx][ky] = frontIndirectRadiation;
          if (dot > 0) {
            v2d.set(x0 + kx * dx, y0 + ky * dy);
            dv.set(v2d.x - center2d.x, v2d.y - center2d.y, 0);
            dv.applyEuler(normalEuler);
            v.set(center.x + dv.x, center.y + dv.y, z0 + dv.z);
            if (!inShadow(panel.id, v, sunDirection)) {
              // direct radiation
              cellOutputs[kx][ky] += dot * peakRadiation;
            }
          }
        }
      }
    }
    // we must consider cell wiring and distributed efficiency
    // Nice demo at: https://www.youtube.com/watch?v=UNPJapaZlCU
    let sum = 0;
    switch (pvModel.shadeTolerance) {
      case ShadeTolerance.NONE: {
        // all the cells are connected in a single series,
        // so the total output is determined by the minimum
        let min1 = Number.MAX_VALUE;
        for (let kx = 0; kx < nx; kx++) {
          for (let ky = 0; ky < ny; ky++) {
            const c = cellOutputs[kx][ky];
            if (c < min1) {
              min1 = c;
            }
          }
        }
        sum = min1 * nx * ny;
        break;
      }
      case ShadeTolerance.PARTIAL: {
        // assuming each panel uses a diode bypass to connect two columns of cells
        let min2 = Number.MAX_VALUE;
        if (panel.orientation === Orientation.portrait) {
          // e.g., nx = 6, ny = 10
          for (let kx = 0; kx < nx; kx++) {
            if (kx % 2 === 0) {
              // reset min every two columns of cells
              min2 = Number.MAX_VALUE;
            }
            for (let ky = 0; ky < ny; ky++) {
              const c = cellOutputs[kx][ky];
              if (c < min2) {
                min2 = c;
              }
            }
            if (kx % 2 === 1) {
              sum += min2 * ny * 2;
            }
          }
        } else {
          // landscape, e.g., nx = 10, ny = 6
          for (let ky = 0; ky < ny; ky++) {
            if (ky % 2 === 0) {
              // reset min every two columns of cells
              min2 = Number.MAX_VALUE;
            }
            for (let kx = 0; kx < nx; kx++) {
              const c = cellOutputs[kx][ky];
              if (c < min2) {
                min2 = c;
              }
            }
            if (ky % 2 === 1) {
              sum += min2 * nx * 2;
            }
          }
        }
        break;
      }
      default: {
        // this probably is too idealized
        for (let kx = 0; kx < nx; kx++) {
          for (let ky = 0; ky < ny; ky++) {
            sum += cellOutputs[kx][ky];
          }
        }
        break;
      }
    }
    const output = dailyOutputsMapRef.current.get(panel.id);
    if (output) {
      updateTemperature(now);
      const eff = getPanelEfficiency(currentTemperatureRef.current, pvModel);
      // the output is the average radiation intensity. if the minutes are greater than 30 or 30, it is counted
      // as the measurement of the next hour to maintain the symmetry around noon
      const index = now.getMinutes() >= 30 ? (now.getHours() + 1 === 24 ? 0 : now.getHours() + 1) : now.getHours();
      output[index] += (eff * sum) / (nx * ny);
    }
  };

  const resetDailyOutputsMap = () => {
    for (const e of elements) {
      if (e.type === ObjectType.SolarPanel) {
        const output = dailyOutputsMapRef.current.get(e.id);
        if (output) {
          output.fill(0);
        } else {
          dailyOutputsMapRef.current.set(e.id, new Array(24).fill(0));
        }
      }
    }
  };

  const resetYearlyOutputsMap = () => {
    for (const e of elements) {
      if (e.type === ObjectType.SolarPanel) {
        const yearlyOutput = yearlyOutputsMapRef.current.get(e.id);
        if (yearlyOutput && yearlyOutput.length === daysPerYear) {
          yearlyOutput.fill(0);
        } else {
          yearlyOutputsMapRef.current.set(e.id, new Array(daysPerYear).fill(0));
        }
      }
    }
  };

  // apply clearness and convert the unit of time step from minute to hour so that we get kWh
  // (divided by times per hour as the radiation is added up that many times in an hour)
  const getTimeFactor = () => {
    const daylight = sunMinutes.daylight() / 60;
    return daylight > ZERO_TOLERANCE ? weather.sunshineHours[now.getMonth()] / (30 * daylight * timesPerHour) : 0;
  };

  const getTimeFactorByMonth = () => {
    const daylight = sunMinutesRef.current.daylight() / 60;
    return daylight > ZERO_TOLERANCE ? weather.sunshineHours[now.getMonth()] / (30 * daylight * timesPerHour) : 0;
  };

  const getElementFactor = (panel: SolarPanelModel) => {
    const pvModel = getPvModule(panel.pvModelName);
    if (!pvModel) throw new Error('PV model not found');
    return panel.lx * panel.ly * (panel.inverterEfficiency ?? 0.95) * (1 - monthlyIrradianceLosses[now.getMonth()]);
  };

  const updateTemperature = (currentTime: Date) => {
    if (weather) {
      const t = computeOutsideTemperature(currentTime, weather.lowestTemperatures, weather.highestTemperatures);
      currentTemperatureRef.current = getOutsideTemperatureAtMinute(
        t.high,
        t.low,
        world.diurnalTemperatureModel,
        highestTemperatureTimeInMinutes,
        computeSunriseAndSunsetInMinutes(currentTime, world.latitude),
        Util.minutesIntoDay(currentTime),
      );
    }
  };

  const inShadow = (panelId: string, position: Vector3, sunDirection: Vector3) => {
    if (objectsRef.current.length > 1) {
      intersectionsRef.current.length = 0;
      ray.set(position, sunDirection);
      const objects = objectsRef.current.filter((obj) => obj.uuid !== panelId);
      ray.intersectObjects(objects, false, intersectionsRef.current);
      return intersectionsRef.current.length > 0;
    }
    return false;
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

  return <></>;
});

export default SolarPanelSimulation;
