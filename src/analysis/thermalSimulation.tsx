/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../stores/common';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import * as Selector from '../stores/selector';
import { RoofModel, RoofType } from '../models/RoofModel';
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { DiurnalTemperatureModel, ObjectType } from '../types';
import { Util } from '../Util';
import { MINUTES_OF_DAY } from './analysisConstants';
import { WallFill, WallModel, WallStructure } from '../models/WallModel';
import {
  computeOutsideTemperature,
  getGroundTemperatureAtMinute,
  getLightAbsorption,
  getOutsideTemperatureAtMinute,
  U_VALUE_OPENING,
} from './heatTools';
import {
  computeDeclinationAngle,
  computeHourAngle,
  computeSunLocation,
  computeSunriseAndSunsetInMinutes,
} from './sunTools';
import { WindowModel } from '../models/WindowModel';
import { DoorModel } from '../models/DoorModel';
import { Point2 } from '../models/Point2';
import { useThree } from '@react-three/fiber';
import { Intersection, Object3D, Raycaster, Vector3 } from 'three';
import { SolarRadiation } from './SolarRadiation';
import {
  DEFAULT_CEILING_R_VALUE,
  DEFAULT_DOOR_U_VALUE,
  DEFAULT_FOUNDATION_SLAB_DEPTH,
  DEFAULT_GROUND_FLOOR_R_VALUE,
  DEFAULT_ROOF_R_VALUE,
  DEFAULT_WALL_R_VALUE,
  DEFAULT_WINDOW_U_VALUE,
  ZERO_TOLERANCE,
} from '../constants';
import { FoundationModel } from '../models/FoundationModel';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { PvModel } from '../models/PvModel';
import { SunMinutes } from './SunMinutes';
import { useDataStore } from '../stores/commonData';

interface ThermalSimulationProps {
  city: string | null;
}

interface RoofSegmentResult {
  surfaceTemperature: number;
  totalArea: number;
}

const ThermalSimulation = ({ city }: ThermalSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const setPrimitiveStore = usePrimitiveStore(Selector.setPrimitiveStore);
  const language = useStore(Selector.language);
  const loggable = useStore(Selector.loggable);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getWeather = useStore(Selector.getWeather);
  const latitude = useStore(Selector.world.latitude);
  const ground = useStore(Selector.world.ground);
  const getFoundation = useStore(Selector.getFoundation);
  const getParent = useStore(Selector.getParent);
  const getChildrenOfType = useStore(Selector.getChildrenOfType);
  const getPvModule = useStore(Selector.getPvModule);
  const setHeatmap = useDataStore(Selector.setHeatmap);
  const clearDataStore = useDataStore(Selector.clearDataStore);
  const runDailySimulation = usePrimitiveStore(Selector.runDailyThermalSimulation);
  const pauseDailySimulation = usePrimitiveStore(Selector.pauseDailyThermalSimulation);
  const runYearlySimulation = usePrimitiveStore(Selector.runYearlyThermalSimulation);
  const pauseYearlySimulation = usePrimitiveStore(Selector.pauseYearlyThermalSimulation);
  const noAnimation = !!useStore(Selector.world.noAnimationForThermalSimulation);
  const getRoofSegmentVerticesWithoutOverhang = useStore(Selector.getRoofSegmentVerticesWithoutOverhang);
  const getRoofSegmentVertices = useStore(Selector.getRoofSegmentVertices);
  const highestTemperatureTimeInMinutes = useStore(Selector.world.highestTemperatureTimeInMinutes) ?? 900;
  const setHourlyHeatExchangeArray = useDataStore(Selector.setHourlyHeatExchangeArray);
  const setHourlySolarHeatGainArray = useDataStore(Selector.setHourlySolarHeatGainArray);
  const setHourlySolarPanelOutputArray = useDataStore(Selector.setHourlySolarPanelOutputArray);

  const requestRef = useRef<number>(0);
  const simulationCompletedRef = useRef<boolean>(false);
  const originalDateRef = useRef<Date>(new Date(world.date));
  const sampledDayRef = useRef<number>(0);
  const pauseRef = useRef<boolean>(false);
  const pausedDateRef = useRef<Date>(new Date(world.date));
  const dayRef = useRef<number>(0);
  const outsideTemperatureRangeRef = useRef<{ high: number; low: number }>({ high: 20, low: 0 });
  const currentOutsideTemperatureRef = useRef<number>(20);
  const currentGroundTemperatureRef = useRef<number>(20);
  const hourlyHeatExchangeArrayMapRef = useRef<Map<string, number[]>>(new Map<string, number[]>());
  const hourlySolarHeatGainArrayMapRef = useRef<Map<string, number[]>>(new Map<string, number[]>());
  const hourlySolarPanelOutputArrayMapRef = useRef<Map<string, number[]>>(new Map<string, number[]>());
  const objectsRef = useRef<Object3D[]>([]); // reuse array in intersection detection
  const intersectionsRef = useRef<Intersection[]>([]); // reuse array in intersection detection
  const sunDirectionRef = useRef<Vector3>();
  const sunMinutesRef = useRef<SunMinutes>();
  const scaleFactorRef = useRef<number>(0);
  const solarHeatmapRef = useRef<Map<string, number[][]>>(new Map<string, number[][]>());

  const lang = { lng: language };
  const weather = getWeather(city ?? 'Boston MA, USA');
  const elevation = city ? weather?.elevation : 0;
  const dustLoss = world.dustLoss ?? 0.05;
  const now = new Date(world.date);
  const timesPerHour = world.timesPerHour ?? 4;
  const minuteInterval = 60 / timesPerHour;
  const daysPerYear = world.daysPerYear ?? 6;
  const monthInterval = 12 / daysPerYear;
  const { scene } = useThree();
  const ray = useMemo(() => new Raycaster(), []);

  const calculateSunDirection = () => {
    return computeSunLocation(
      1,
      computeHourAngle(now),
      computeDeclinationAngle(now),
      Util.toRadians(world.latitude),
    ).normalize();
  };

  // return -1 if exposed to sunlight, otherwise return the distance of the closest object
  const distanceToClosestObject = (elementId: string, position: Vector3, sunDirection: Vector3) => {
    if (objectsRef.current.length > 1) {
      intersectionsRef.current.length = 0;
      ray.set(position, sunDirection);
      const objects = objectsRef.current.filter((obj) => obj.uuid !== elementId);
      ray.intersectObjects(objects, false, intersectionsRef.current);
      if (intersectionsRef.current.length > 0) {
        return intersectionsRef.current[0].distance;
      }
    }
    return -1;
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

  const updateTemperature = (currentTime: Date) => {
    if (weather) {
      // get the highest and lowest temperatures of the day from the weather data
      outsideTemperatureRangeRef.current = computeOutsideTemperature(
        now,
        weather.lowestTemperatures,
        weather.highestTemperatures,
      );
      // get the air temperature at the current time
      const minutes = Util.minutesIntoDay(currentTime);
      currentOutsideTemperatureRef.current = getOutsideTemperatureAtMinute(
        outsideTemperatureRangeRef.current.high,
        outsideTemperatureRangeRef.current.low,
        world.diurnalTemperatureModel ?? DiurnalTemperatureModel.Sinusoidal,
        highestTemperatureTimeInMinutes,
        computeSunriseAndSunsetInMinutes(currentTime, world.latitude),
        minutes,
      );
      currentGroundTemperatureRef.current = getGroundTemperatureAtMinute(
        latitude,
        Util.dayOfYear(now),
        minutes,
        weather.lowestTemperatures,
        weather.highestTemperatures,
        highestTemperatureTimeInMinutes,
        0.5 * (outsideTemperatureRangeRef.current.high - outsideTemperatureRangeRef.current.low),
        ground.thermalDiffusivity ?? 0.05,
        DEFAULT_FOUNDATION_SLAB_DEPTH,
      );
    }
  };

  // update the heat exchange through an element that is part of a building envelope
  const updateHeatExchangeNow = (id: string, heatExchange: number) => {
    let a = hourlyHeatExchangeArrayMapRef.current.get(id);
    if (!a) {
      // initialize
      a = new Array(24).fill(0);
      hourlyHeatExchangeArrayMapRef.current.set(id, a);
    }
    // sum the results sampled over an hour
    a[now.getHours()] += heatExchange;
  };

  // update solar heat gain for a building represented by the foundation's ID
  const updateSolarHeatGainNow = (id: string, gain: number) => {
    let a = hourlySolarHeatGainArrayMapRef.current.get(id);
    if (!a) {
      // initialize (polar areas may have 24 sunlight in the summer)
      a = new Array(24).fill(0);
      hourlySolarHeatGainArrayMapRef.current.set(id, a);
    }
    // sum the results sampled over an hour
    a[now.getHours()] += gain;
  };

  // update solar panel output for a building represented by the foundation's ID
  const updateSolarPanelOutputNow = (id: string, output: number) => {
    let a = hourlySolarPanelOutputArrayMapRef.current.get(id);
    if (!a) {
      // initialize (polar areas may have 24 sunlight in the summer)
      a = new Array(24).fill(0);
      hourlySolarPanelOutputArrayMapRef.current.set(id, a);
    }
    // sum the results sampled over an hour
    a[now.getHours()] += output;
  };

  const resetHourlyMaps = () => {
    for (const e of elements) {
      if (Util.onBuildingEnvelope(e)) {
        hourlyHeatExchangeArrayMapRef.current.get(e.id)?.fill(0);
      }
      if (e.type === ObjectType.Roof) {
        for (const key of hourlyHeatExchangeArrayMapRef.current.keys()) {
          if (key !== e.id && key.startsWith(e.id)) {
            hourlyHeatExchangeArrayMapRef.current.get(key)?.fill(0);
          }
        }
      }
      if (e.type === ObjectType.Foundation) {
        hourlySolarHeatGainArrayMapRef.current.get(e.id)?.fill(0);
        hourlySolarPanelOutputArrayMapRef.current.get(e.id)?.fill(0);
      }
    }
  };

  const resetSolarHeatMaps = () => {
    // must clear the map to allow the array to be recreated in case the dimensions will change
    solarHeatmapRef.current.clear();
    clearDataStore();
  };

  /* do the daily simulation to generate hourly data and daily total */

  useEffect(() => {
    if (runDailySimulation) {
      if (noAnimation && !Util.hasMovingParts(elements)) {
        staticCalculateDaily();
      } else {
        fetchObjects();
        initDaily();
        requestRef.current = requestAnimationFrame(calculateDaily);
        return () => {
          // this is called when the recursive call of requestAnimationFrame exits
          cancelAnimationFrame(requestRef.current);
          if (!simulationCompletedRef.current) {
            showInfo(i18n.t('message.SimulationAborted', lang));
            setCommonStore((state) => {
              state.world.date = originalDateRef.current.toLocaleString('en-US');
            });
            usePrimitiveStore.setState((state) => {
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
      now.setHours(now.getHours(), now.getMinutes() + minuteInterval);
      // continue the simulation
      calculateDaily();
    }
  }, [pauseDailySimulation]);

  // TODO
  const staticCalculateDaily = () => {
    computeNow();
  };

  const initDaily = () => {
    if (pauseRef.current) {
      // if the simulation has been paused, continue from the paused date
      now.setTime(pausedDateRef.current.getTime());
      pauseRef.current = false;
    } else {
      originalDateRef.current = new Date(world.date);
      dayRef.current = Util.dayOfYear(now);
      // start from minuteInterval/2 so that the sampling points are evenly distributed within an hour
      now.setHours(0, minuteInterval / 2);
    }
    simulationCompletedRef.current = false;
    resetHourlyMaps();
    resetSolarHeatMaps();
  };

  const finishDaily = () => {
    // store the results in the common store for other components to use
    for (const e of elements) {
      // heat exchanges through individual elements on a building envelope
      if (Util.onBuildingEnvelope(e) || e.type === ObjectType.SolarPanel) {
        const arr = hourlyHeatExchangeArrayMapRef.current.get(e.id);
        if (arr) {
          setHourlyHeatExchangeArray(e.id, [...arr]);
        }
        // send a copy of the solar heatmap data to common store for visualization
        const heatmap = solarHeatmapRef.current.get(e.id);
        if (heatmap) {
          setHeatmap(
            e.id,
            heatmap.map((a) => [...a]),
          );
        }
      }
      // heat exchange for each roof segment
      if (e.type === ObjectType.Roof) {
        for (const key of hourlyHeatExchangeArrayMapRef.current.keys()) {
          if (key !== e.id && key.startsWith(e.id)) {
            const arr = hourlyHeatExchangeArrayMapRef.current.get(key);
            if (arr) {
              setHourlyHeatExchangeArray(key, [...arr]);
            }
            // send the solar heatmap data to common store for visualization
            const heatmap = solarHeatmapRef.current.get(key);
            if (heatmap) {
              setHeatmap(
                key,
                heatmap.map((a) => [...a]),
              );
            }
          }
        }
      }
      // the total solar heat gain through all the windows on a foundation
      // the total solar panel output through all the solar panels on a foundation
      if (e.type === ObjectType.Foundation) {
        let arr = hourlySolarHeatGainArrayMapRef.current.get(e.id);
        if (arr) {
          setHourlySolarHeatGainArray(e.id, [...arr]);
        }
        arr = hourlySolarPanelOutputArrayMapRef.current.get(e.id);
        if (arr) {
          setHourlySolarPanelOutputArray(e.id, [...arr]);
        }
      }
    }
    usePrimitiveStore.setState((state) => {
      state.flagOfDailySimulation = !state.flagOfDailySimulation;
      if (!state.runYearlyThermalSimulation) {
        state.showSolarRadiationHeatmap = true;
        state.showHeatFluxes = true;
      }
    });
    if (loggable && !runYearlySimulation) {
      const heater = useDataStore.getState().totalBuildingHeater;
      const ac = useDataStore.getState().totalBuildingAc;
      const solarPanel = useDataStore.getState().totalBuildingSolarPanel;
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Daily Building Energy Analysis Completed',
          result: {
            Heater: heater.toFixed(2),
            AC: ac.toFixed(2),
            SolarPanel: solarPanel.toFixed(2),
            Net: (heater + ac - solarPanel).toFixed(2),
          },
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  const calculateDaily = () => {
    if (runDailySimulation && !pauseRef.current) {
      const totalMinutes =
        now.getMinutes() + now.getHours() * 60 + (Util.dayOfYear(now) - dayRef.current) * MINUTES_OF_DAY;
      if (totalMinutes + minuteInterval > MINUTES_OF_DAY) {
        computeNow();
        cancelAnimationFrame(requestRef.current);
        setCommonStore((state) => {
          state.world.date = originalDateRef.current.toLocaleString('en-US');
          state.viewState.showDailyBuildingEnergyPanel = true;
        });
        usePrimitiveStore.setState((state) => {
          state.runDailyThermalSimulation = false;
          state.simulationPaused = false;
          state.simulationInProgress = false;
        });
        showInfo(i18n.t('message.SimulationCompleted', lang));
        simulationCompletedRef.current = true;
        finishDaily();
        return;
      }
      // this forces the scene to be re-rendered
      setCommonStore((state) => {
        state.world.date = now.toLocaleString('en-US');
      });
      computeNow();
      // recursive call to the next step of the simulation
      requestRef.current = requestAnimationFrame(calculateDaily);
      // this is where time advances (by incrementing the minutes with the given interval)
      // minutes more than 60 results in the increase of the hour accordingly
      now.setHours(now.getHours(), now.getMinutes() + minuteInterval);
    }
  };

  // yearly simulation

  const [monthIndex, setMonthIndex] = useState<number>(now.getMonth());

  useEffect(() => {
    // give it some time for the scene to update as a result of month change
    setTimeout(() => {
      fetchObjects();
    }, 200);
  }, [monthIndex]);

  useEffect(() => {
    if (runYearlySimulation) {
      if (noAnimation && !Util.hasMovingParts(elements)) {
        // this causes the simulation code to run at the beginning of the next event cycle
        // that hopefully has the updated scene graph
        setTimeout(() => {
          //staticSimulateYearly(false);
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
            usePrimitiveStore.setState((state) => {
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
      now.setHours(now.getHours(), now.getMinutes() + minuteInterval);
      // continue the simulation
      simulateYearly();
    }
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
      dayRef.current = Util.dayOfYear(now);
      now.setHours(0, minuteInterval / 2);
      // set the initial date so that the scene gets a chance to render before the simulation starts
      setCommonStore((state) => {
        state.viewState.showYearlyBuildingEnergyPanel = true;
        state.world.date = now.toLocaleString('en-US');
      });
    }
    resetHourlyMaps();
    resetSolarHeatMaps();
    simulationCompletedRef.current = false;
  };

  const simulateYearly = () => {
    if (runYearlySimulation && !pauseRef.current) {
      const totalMinutes =
        now.getMinutes() + now.getHours() * 60 + (Util.dayOfYear(now) - dayRef.current) * MINUTES_OF_DAY;
      if (totalMinutes < MINUTES_OF_DAY + minuteInterval / 2) {
        // this is where time advances (by incrementing the minutes with the given interval)
        setCommonStore((state) => {
          state.world.date = now.toLocaleString('en-US');
        });
        computeNow();
        now.setHours(now.getHours(), now.getMinutes() + minuteInterval);
        // recursive call to the next step of the simulation within the current day
        requestRef.current = requestAnimationFrame(simulateYearly);
      } else {
        finishDaily();
        sampledDayRef.current++;
        if (sampledDayRef.current === daysPerYear) {
          cancelAnimationFrame(requestRef.current);
          setCommonStore((state) => {
            state.world.date = originalDateRef.current.toLocaleString('en-US');
          });
          usePrimitiveStore.setState((state) => {
            state.runYearlyThermalSimulation = false;
            state.simulationInProgress = false;
            state.simulationPaused = false;
          });
          showInfo(i18n.t('message.SimulationCompleted', lang));
          simulationCompletedRef.current = true;
          if (loggable) {
            const heater = useDataStore.getState().totalBuildingHeater;
            const ac = useDataStore.getState().totalBuildingAc;
            const solarPanel = useDataStore.getState().totalBuildingSolarPanel;
            setCommonStore((state) => {
              state.actionInfo = {
                name: 'Yearly Building Energy Analysis Completed',
                result: {
                  Heater: heater.toFixed(2),
                  AC: ac.toFixed(2),
                  SolarPanel: solarPanel.toFixed(2),
                  Net: (heater + ac - solarPanel).toFixed(2),
                },
                timestamp: new Date().getTime(),
              };
            });
          }
          return;
        }
        // go to the next month
        now.setMonth(sampledDayRef.current * monthInterval, 22);
        now.setHours(0, minuteInterval / 2);
        setMonthIndex(now.getMonth());
        dayRef.current = Util.dayOfYear(now);
        resetHourlyMaps();
        resetSolarHeatMaps();
        // recursive call to the next step of the simulation
        requestRef.current = requestAnimationFrame(simulateYearly);
      }
    }
  };

  // functions shared by daily and yearly simulations

  const computeNow = () => {
    updateTemperature(now);
    sunMinutesRef.current = computeSunriseAndSunsetInMinutes(now, world.latitude);
    const daylight = sunMinutesRef.current.daylight() / 60;
    // apply clearness and convert the unit of time step from minute to hour so that we get kWh
    // (divide by times per hour as the radiation is added up that many times)
    scaleFactorRef.current =
      daylight > ZERO_TOLERANCE ? weather.sunshineHours[now.getMonth()] / (30 * daylight * timesPerHour) : 0;
    sunDirectionRef.current = calculateSunDirection();
    for (const e of elements) {
      switch (e.type) {
        case ObjectType.Door:
          calculateDoor(e as DoorModel);
          break;
        case ObjectType.Window:
          calculateWindow(e as WindowModel);
          calculateSolarHeatGain(e as WindowModel);
          break;
        case ObjectType.Wall:
          calculateWall(e as WallModel);
          break;
        case ObjectType.Roof:
          const roof = e as RoofModel;
          calculateRoof(roof);
          calculateFloor(roof);
          break;
        case ObjectType.SolarPanel:
          calculateSolarPanel(e as SolarPanelModel);
          break;
      }
    }
  };

  const getPanelEfficiency = (temperature: number, panel: SolarPanelModel, pvModel: PvModel) => {
    let e = pvModel.efficiency;
    if (pvModel.cellType === 'Monocrystalline') {
      e *= 0.95; // assuming that the packing density factor of semi-round cells is 0.95
    }
    return e * (1 + pvModel.pmaxTC * (temperature - 25));
  };

  // apply clearness and convert the unit of time step from minute to hour so that we get kWh
  // (divided by times per hour as the radiation is added up that many times in an hour)
  const getTimeFactor = () => {
    if (!sunMinutesRef.current) throw new Error('sun minutes not set');
    const daylight = sunMinutesRef.current.daylight() / 60;
    return daylight > ZERO_TOLERANCE ? weather.sunshineHours[now.getMonth()] / (30 * daylight * timesPerHour) : 0;
  };

  const inverterEfficiency = 0.95;
  const getElementFactor = (panel: SolarPanelModel) => {
    const pvModel = getPvModule(panel.pvModelName);
    if (!pvModel) throw new Error('PV model not found');
    return panel.lx * panel.ly * inverterEfficiency * (1 - dustLoss);
  };

  const calculateSolarPanel = (panel: SolarPanelModel) => {
    const foundation = getFoundation(panel);
    if (foundation) {
      const parent = getParent(panel);
      if (parent) {
        const pvModel = getPvModule(panel.pvModelName);
        // when the sun is out
        if (sunDirectionRef.current && sunDirectionRef.current.z > 0) {
          const results = SolarRadiation.computeSolarPanelOutput(
            now,
            world,
            sunDirectionRef.current,
            pvModel,
            panel,
            parent,
            foundation,
            elevation,
            distanceToClosestObject,
          );
          const factor =
            getPanelEfficiency(currentOutsideTemperatureRef.current, panel, pvModel) *
            getTimeFactor() *
            getElementFactor(panel);
          updateSolarPanelOutputNow(foundation.id, results.average * factor);
          // sum up the solar radiation intensity for generating the solar heatmap
          if (runDailySimulation) {
            for (let i = 0; i < results.heatmap.length; i++) {
              for (let j = 0; j < results.heatmap[i].length; j++) {
                results.heatmap[i][j] *= scaleFactorRef.current;
              }
            }
            const solarHeatmap = solarHeatmapRef.current.get(panel.id);
            if (!solarHeatmap) {
              solarHeatmapRef.current.set(panel.id, [...results.heatmap]);
            } else {
              for (let i = 0; i < solarHeatmap.length; i++) {
                for (let j = 0; j < solarHeatmap[i].length; j++) {
                  solarHeatmap[i][j] += results.heatmap[i][j];
                }
              }
            }
          }
        }
      }
    }
  };

  const calculateWindow = (window: WindowModel) => {
    const foundation = getFoundation(window);
    if (foundation) {
      const parent = getParent(window);
      if (parent) {
        const setpoint = foundation.hvacSystem?.thermostatSetpoint ?? 20;
        const area = Util.getWindowArea(window, parent);
        const deltaT = currentOutsideTemperatureRef.current - setpoint;
        // convert heat exchange to kWh
        updateHeatExchangeNow(
          window.id,
          (deltaT * area * (window.uValue ?? DEFAULT_WINDOW_U_VALUE) * 0.001) / timesPerHour,
        );
      }
    }
  };

  const calculateSolarHeatGain = (window: WindowModel) => {
    const foundation = getFoundation(window);
    if (foundation) {
      const parent = getParent(window);
      if (parent) {
        let totalSolarHeat = 0;
        // when the sun is out
        if (sunDirectionRef.current && sunDirectionRef.current.z > 0) {
          const results = SolarRadiation.computeWindowSolarRadiationEnergy(
            now,
            world,
            sunDirectionRef.current,
            window,
            parent as WallModel,
            foundation,
            elevation,
            distanceToClosestObject,
          );
          for (let i = 0; i < results.intensity.length; i++) {
            for (let j = 0; j < results.intensity[i].length; j++) {
              results.intensity[i][j] *= scaleFactorRef.current; // for solar heatmap generation
              totalSolarHeat += results.intensity[i][j] * results.unitArea; // for energy calculation
            }
          }
          // how much solar energy can go through the window (SHGC)
          totalSolarHeat *= 1 - window.opacity;
        }
        updateSolarHeatGainNow(foundation.id, totalSolarHeat / timesPerHour);
      }
    }
  };

  const calculateDoor = (door: DoorModel) => {
    const foundation = getFoundation(door);
    if (foundation) {
      const parent = getParent(door);
      if (parent) {
        const setpoint = foundation.hvacSystem?.thermostatSetpoint ?? 20;
        const area = Util.getDoorArea(door, parent);
        if (door.filled) {
          const absorption = getLightAbsorption(door);
          let totalSolarHeat = 0;
          // when the sun is out
          if (sunDirectionRef.current && sunDirectionRef.current.z > 0) {
            const results = SolarRadiation.computeDoorSolarRadiationEnergy(
              now,
              world,
              sunDirectionRef.current,
              door,
              parent as WallModel,
              foundation,
              elevation,
              distanceToClosestObject,
            );
            for (let i = 0; i < results.intensity.length; i++) {
              for (let j = 0; j < results.intensity[i].length; j++) {
                results.intensity[i][j] *= scaleFactorRef.current; // for solar heatmap generation
                totalSolarHeat += results.intensity[i][j] * results.unitArea; // for energy calculation
              }
            }
            // sum up the solar radiation intensity for generating the solar heatmap
            if (runDailySimulation) {
              const solarHeatmap = solarHeatmapRef.current.get(door.id);
              if (!solarHeatmap) {
                solarHeatmapRef.current.set(door.id, [...results.intensity]);
              } else {
                for (let i = 0; i < solarHeatmap.length; i++) {
                  for (let j = 0; j < solarHeatmap[i].length; j++) {
                    solarHeatmap[i][j] += results.intensity[i][j];
                  }
                }
              }
            }
          }
          const extraT =
            Util.isZero(totalSolarHeat) || Util.isZero(absorption)
              ? 0
              : (totalSolarHeat * absorption) / ((door.volumetricHeatCapacity ?? 0.5) * area * Math.max(door.ly, 0.1));
          const deltaT = currentOutsideTemperatureRef.current + extraT - setpoint;
          // convert heat exchange to kWh
          updateHeatExchangeNow(
            door.id,
            (deltaT * area * (door.uValue ?? DEFAULT_DOOR_U_VALUE) * 0.001) / timesPerHour,
          );
        } else {
          const deltaT = currentOutsideTemperatureRef.current - setpoint;
          // use a large U-value for an open door (not meant to be accurate, but as an indicator of something wrong)
          updateHeatExchangeNow(door.id, (deltaT * area * U_VALUE_OPENING * 0.001) / timesPerHour);
        }
      }
    }
  };

  const calculateWall = (wall: WallModel) => {
    const foundation = getFoundation(wall);
    if (foundation) {
      const filled = wall.fill !== WallFill.Empty && wall.wallStructure === WallStructure.Default;
      const setpoint = foundation.hvacSystem?.thermostatSetpoint ?? 20;
      if (filled) {
        const partial = wall.fill === WallFill.Partial && !Util.isPartialWallFull(wall);
        const frameVertices = Util.getWallVertices(wall, 0);
        const partialWallVertices = partial ? Util.getPartialWallVertices(wall, 0) : frameVertices;
        const frameArea = Util.getPolygonArea(frameVertices);
        let filledArea = partial ? Util.getPolygonArea(partialWallVertices) : frameArea;
        const windows = getChildrenOfType(ObjectType.Window, wall.id);
        const doors = getChildrenOfType(ObjectType.Door, wall.id);
        const absorption = getLightAbsorption(wall);
        let totalSolarHeat = 0;
        // when the sun is out
        if (sunDirectionRef.current && sunDirectionRef.current.z > 0) {
          const rectangular = (partial ? partialWallVertices.length : frameVertices.length) === 4;
          const solarPanels = getChildrenOfType(ObjectType.SolarPanel, wall.id);
          const results = SolarRadiation.computeWallSolarRadiationEnergy(
            now,
            world,
            sunDirectionRef.current,
            wall,
            foundation,
            windows,
            doors,
            solarPanels,
            rectangular ? 0 : 1,
            elevation,
            distanceToClosestObject,
          );
          for (let i = 0; i < results.intensity.length; i++) {
            for (let j = 0; j < results.intensity[i].length; j++) {
              results.intensity[i][j] *= scaleFactorRef.current;
              totalSolarHeat += results.intensity[i][j] * results.unitArea;
            }
          }
          // sum up the solar radiation intensity for generating the solar heatmap
          if (runDailySimulation) {
            for (let i = 0; i < results.heatmap.length; i++) {
              for (let j = 0; j < results.heatmap[i].length; j++) {
                results.heatmap[i][j] *= scaleFactorRef.current;
              }
            }
            const solarHeatmap = solarHeatmapRef.current.get(wall.id);
            if (!solarHeatmap) {
              solarHeatmapRef.current.set(wall.id, [...results.heatmap]);
            } else {
              for (let i = 0; i < solarHeatmap.length; i++) {
                for (let j = 0; j < solarHeatmap[i].length; j++) {
                  solarHeatmap[i][j] += results.heatmap[i][j];
                }
              }
            }
          }
        }
        if (windows && windows.length > 0) {
          for (const w of windows) {
            filledArea -= Util.getWindowArea(w as WindowModel, wall);
          }
        }
        if (doors && doors.length > 0) {
          for (const d of doors) {
            filledArea -= d.lx * d.lz * wall.lx * wall.lz;
          }
        }
        const extraT =
          Util.isZero(totalSolarHeat) || Util.isZero(absorption)
            ? 0
            : (totalSolarHeat * absorption) / ((wall.volumetricHeatCapacity ?? 0.5) * filledArea * wall.ly);
        const deltaT = currentOutsideTemperatureRef.current + extraT - setpoint;
        // U is the inverse of R with SI units of W/(m^2⋅K), we convert the energy unit to kWh here
        let heatExchange = (((deltaT * filledArea) / (wall.rValue ?? DEFAULT_WALL_R_VALUE)) * 0.001) / timesPerHour;
        if (partial && wall.openToOutside) {
          // use a large U-value for the open area (not meant to be accurate, but as an indicator of something wrong)
          heatExchange +=
            ((currentOutsideTemperatureRef.current - setpoint) * (frameArea - filledArea) * U_VALUE_OPENING * 0.001) /
            timesPerHour;
        }
        updateHeatExchangeNow(wall.id, heatExchange);
      } else {
        if (wall.openToOutside) {
          const wallVertices = Util.getWallVertices(wall, 0);
          const area = Util.getPolygonArea(wallVertices);
          const deltaT = currentOutsideTemperatureRef.current - setpoint;
          // use a large U-value for an open wall (not meant to be accurate, but as an indicator of something wrong)
          updateHeatExchangeNow(wall.id, (deltaT * area * U_VALUE_OPENING * 0.001) / timesPerHour);
        }
      }
    }
  };

  const calculateFloor = (roof: RoofModel) => {
    const foundation = getFoundation(roof);
    if (!foundation) return;
    const setpoint = foundation.hvacSystem?.thermostatSetpoint ?? 20;
    const floorArea = Util.calculateBuildingArea(roof);
    const deltaT = currentGroundTemperatureRef.current - setpoint;
    updateHeatExchangeNow(
      foundation.id,
      (((deltaT * floorArea) / (foundation.rValue ?? DEFAULT_GROUND_FLOOR_R_VALUE)) * 0.001) / timesPerHour,
    );
  };

  /* Approximate the attic temperature based on the insulation values of the roof and the ceiling.
   1) if the R-values are the same, the attic temperature is the mean temperature between inside and outside
   2) if the R-value of the roof is higher, the attic temperature is closer to the inside temperature
   3) if the R-value of the roof is lower, the attic temperature is closer to the outside temperature
  */
  const calculateAtticTemperature = (roof: RoofModel, outsideTemperature: number, setpoint: number) => {
    const roofU = 1 / (roof.rValue ?? DEFAULT_ROOF_R_VALUE);
    const ceilingU = 1 / (roof.ceilingRValue ?? DEFAULT_CEILING_R_VALUE);
    return (roofU * outsideTemperature + ceilingU * setpoint) / (roofU + ceilingU);
  };

  const calculateRoof = (roof: RoofModel) => {
    const foundation = getFoundation(roof);
    if (!foundation) return;
    const segmentsWithoutOverhang = getRoofSegmentVerticesWithoutOverhang(roof.id);
    if (!segmentsWithoutOverhang) return;
    let roofSegmentResults = undefined;
    switch (roof.roofType) {
      case RoofType.Pyramid:
        roofSegmentResults = calculatePyramidRoof(roof, segmentsWithoutOverhang, foundation);
        break;
      case RoofType.Hip:
        roofSegmentResults = calculateHipRoof(roof, segmentsWithoutOverhang, foundation);
        break;
      case RoofType.Gable:
      case RoofType.Gambrel:
        roofSegmentResults = calculateGableRoof(roof, segmentsWithoutOverhang, foundation);
        break;
      case RoofType.Mansard:
        roofSegmentResults = calculateMansardRoof(roof, segmentsWithoutOverhang, foundation);
        break;
    }
    if (roofSegmentResults) {
      const setpoint = foundation.hvacSystem?.thermostatSetpoint ?? 20;
      let heatExchange = 0;
      for (const [i, segmentResult] of roofSegmentResults.entries()) {
        const deltaT =
          segmentResult.surfaceTemperature -
          (roof.ceiling ? calculateAtticTemperature(roof, segmentResult.surfaceTemperature, setpoint) : setpoint);
        // convert heat exchange to kWh
        const segmentHeatExchange =
          (((deltaT * segmentResult.totalArea) / (roof.rValue ?? DEFAULT_ROOF_R_VALUE)) * 0.001) / timesPerHour;
        updateHeatExchangeNow(roof.id + '-' + i, segmentHeatExchange);
        heatExchange += segmentHeatExchange;
      }
      updateHeatExchangeNow(roof.id, heatExchange);
    }
  };

  const calculatePyramidRoof = (roof: RoofModel, segmentsWithoutOverhang: Vector3[][], foundation: FoundationModel) => {
    if (roof.roofType !== RoofType.Pyramid) throw new Error('roof is not pyramid');
    const n = segmentsWithoutOverhang.length;
    if (n === 0) return;
    // check if the roof is flat or not
    let flat = true;
    const h0 = segmentsWithoutOverhang[0][0].z;
    for (const s of segmentsWithoutOverhang) {
      for (const v of s) {
        if (Math.abs(v.z - h0) > 0.01) {
          flat = false;
          break;
        }
      }
    }
    const totalAreas: number[] = [];
    if (flat) {
      let totalArea = 0;
      for (const s of segmentsWithoutOverhang) {
        totalArea += Util.getTriangleArea(s[0], s[1], s[2]);
      }
      totalAreas.push(totalArea);
    } else {
      for (const s of segmentsWithoutOverhang) {
        totalAreas.push(Util.getTriangleArea(s[0], s[1], s[2]));
      }
    }
    const absorption = getLightAbsorption(roof);
    const m = flat ? 1 : n;
    const totalSolarHeats: number[] = Array(m).fill(0);
    // when the sun is out
    if (sunDirectionRef.current && sunDirectionRef.current.z > 0) {
      const results = SolarRadiation.computePyramidRoofSolarRadiationEnergy(
        now,
        world,
        sunDirectionRef.current,
        roof,
        flat,
        true,
        segmentsWithoutOverhang,
        foundation,
        elevation,
        distanceToClosestObject,
      );
      for (let k = 0; k < m; k++) {
        const seg = results.segmentIntensities[k];
        const unitArea = results.segmentUnitArea[k];
        for (let i = 0; i < seg.length; i++) {
          for (let j = 0; j < seg[i].length; j++) {
            seg[i][j] *= scaleFactorRef.current; // for solar heatmap generation
            totalSolarHeats[k] += seg[i][j] * unitArea; // for energy calculation
          }
        }
      }
      // sum up the solar radiation intensity for generating the solar heatmap for the entire roof (with overhang)
      if (runDailySimulation) {
        const segments = getRoofSegmentVertices(roof.id);
        if (segments) {
          const heatmapResults = SolarRadiation.computePyramidRoofSolarRadiationEnergy(
            now,
            world,
            sunDirectionRef.current,
            roof,
            flat,
            false,
            segments,
            foundation,
            elevation,
            distanceToClosestObject,
          );
          for (let k = 0; k < m; k++) {
            const seg = heatmapResults.segmentIntensities[k];
            for (let i = 0; i < seg.length; i++) {
              for (let j = 0; j < seg[i].length; j++) {
                seg[i][j] *= scaleFactorRef.current;
              }
            }
            const uid = m === 1 ? roof.id : roof.id + '-' + k;
            const solarHeatmap = solarHeatmapRef.current.get(uid);
            if (!solarHeatmap) {
              solarHeatmapRef.current.set(uid, [...seg]);
            } else {
              for (let i = 0; i < solarHeatmap.length; i++) {
                for (let j = 0; j < solarHeatmap[i].length; j++) {
                  solarHeatmap[i][j] += seg[i][j];
                }
              }
            }
          }
        }
      }
    }
    const extraT: number[] = Array(m).fill(0);
    const results: RoofSegmentResult[] = [];
    for (let k = 0; k < m; k++) {
      if (totalSolarHeats[k] !== 0) {
        extraT[k] =
          (totalSolarHeats[k] * absorption) / ((roof.volumetricHeatCapacity ?? 0.5) * totalAreas[k] * roof.thickness);
      }
      results.push({
        surfaceTemperature: currentOutsideTemperatureRef.current + extraT[k],
        totalArea: totalAreas[k],
      } as RoofSegmentResult);
    }
    return results;
  };

  const calculateHipRoof = (roof: RoofModel, segmentsWithoutOverhang: Vector3[][], foundation: FoundationModel) => {
    if (roof.roofType !== RoofType.Hip) throw new Error('roof is not hip');
    const n = segmentsWithoutOverhang.length;
    if (n === 0) return;
    const totalAreas: number[] = [];
    for (const s of segmentsWithoutOverhang) {
      if (s.length === 3) {
        totalAreas.push(Util.getTriangleArea(s[0], s[1], s[2]));
      } else if (s.length === 4) {
        totalAreas.push(Util.getTriangleArea(s[0], s[1], s[2]) + Util.getTriangleArea(s[2], s[3], s[0]));
      }
    }
    const absorption = getLightAbsorption(roof);
    const totalSolarHeats: number[] = Array(n).fill(0);
    // when the sun is out
    if (sunDirectionRef.current && sunDirectionRef.current.z > 0) {
      const results = SolarRadiation.computeHipRoofSolarRadiationEnergy(
        now,
        world,
        sunDirectionRef.current,
        roof,
        true,
        segmentsWithoutOverhang,
        foundation,
        elevation,
        distanceToClosestObject,
      );
      for (let k = 0; k < n; k++) {
        const seg = results.segmentIntensities[k];
        const unitArea = results.segmentUnitArea[k];
        for (let i = 0; i < seg.length; i++) {
          for (let j = 0; j < seg[i].length; j++) {
            seg[i][j] *= scaleFactorRef.current;
            totalSolarHeats[k] += seg[i][j] * unitArea; // for energy calculation
          }
        }
      }
      // sum up the solar radiation intensity for generating the solar heatmap for the entire roof (with overhang)
      if (runDailySimulation) {
        const segments = getRoofSegmentVertices(roof.id);
        if (segments) {
          const heatmapResults = SolarRadiation.computeHipRoofSolarRadiationEnergy(
            now,
            world,
            sunDirectionRef.current,
            roof,
            false,
            segments,
            foundation,
            elevation,
            distanceToClosestObject,
          );
          for (let k = 0; k < n; k++) {
            const seg = heatmapResults.segmentIntensities[k];
            for (let i = 0; i < seg.length; i++) {
              for (let j = 0; j < seg[i].length; j++) {
                seg[i][j] *= scaleFactorRef.current;
              }
            }
            const uid = roof.id + '-' + k;
            const solarHeatmap = solarHeatmapRef.current.get(uid);
            if (!solarHeatmap) {
              solarHeatmapRef.current.set(uid, [...seg]);
            } else {
              for (let i = 0; i < solarHeatmap.length; i++) {
                for (let j = 0; j < solarHeatmap[i].length; j++) {
                  solarHeatmap[i][j] += seg[i][j];
                }
              }
            }
          }
        }
      }
    }
    const extraT: number[] = Array(n).fill(0);
    const results: RoofSegmentResult[] = [];
    for (let k = 0; k < n; k++) {
      if (totalSolarHeats[k] !== 0) {
        extraT[k] =
          (totalSolarHeats[k] * absorption) / ((roof.volumetricHeatCapacity ?? 0.5) * totalAreas[k] * roof.thickness);
      }
      results.push({
        surfaceTemperature: currentOutsideTemperatureRef.current + extraT[k],
        totalArea: totalAreas[k],
      } as RoofSegmentResult);
    }
    return results;
  };

  const calculateGableRoof = (roof: RoofModel, segmentsWithoutOverhang: Vector3[][], foundation: FoundationModel) => {
    if (roof.roofType !== RoofType.Gable && roof.roofType !== RoofType.Gambrel)
      throw new Error('roof is not gable or gambrel');
    const n = segmentsWithoutOverhang.length;
    if (n === 0) return;
    const totalAreas: number[] = [];
    for (const s of segmentsWithoutOverhang) {
      totalAreas.push(Util.getTriangleArea(s[0], s[1], s[2]) + Util.getTriangleArea(s[2], s[3], s[0]));
    }
    const absorption = getLightAbsorption(roof);
    const totalSolarHeats: number[] = Array(n).fill(0);
    // when the sun is out
    if (sunDirectionRef.current && sunDirectionRef.current.z > 0) {
      const results = SolarRadiation.computeGableRoofSolarRadiationEnergy(
        now,
        world,
        sunDirectionRef.current,
        roof,
        true,
        segmentsWithoutOverhang,
        foundation,
        elevation,
        distanceToClosestObject,
      );
      for (let k = 0; k < n; k++) {
        const seg = results.segmentIntensities[k];
        const unitArea = results.segmentUnitArea[k];
        for (let i = 0; i < seg.length; i++) {
          for (let j = 0; j < seg[i].length; j++) {
            seg[i][j] *= scaleFactorRef.current;
            totalSolarHeats[k] += seg[i][j] * unitArea; // for energy calculation
          }
        }
      }
      // sum up the solar radiation intensity for generating the solar heatmap for the entire roof (with overhang)
      if (runDailySimulation) {
        const segments = getRoofSegmentVertices(roof.id);
        if (segments) {
          const heatmapResults = SolarRadiation.computeGableRoofSolarRadiationEnergy(
            now,
            world,
            sunDirectionRef.current,
            roof,
            false,
            segments,
            foundation,
            elevation,
            distanceToClosestObject,
          );
          for (let k = 0; k < n; k++) {
            const seg = heatmapResults.segmentIntensities[k];
            for (let i = 0; i < seg.length; i++) {
              for (let j = 0; j < seg[i].length; j++) {
                seg[i][j] *= scaleFactorRef.current;
              }
            }
            const uid = roof.id + '-' + k;
            const solarHeatmap = solarHeatmapRef.current.get(uid);
            if (!solarHeatmap) {
              solarHeatmapRef.current.set(uid, [...seg]);
            } else {
              for (let i = 0; i < solarHeatmap.length; i++) {
                for (let j = 0; j < solarHeatmap[i].length; j++) {
                  solarHeatmap[i][j] += seg[i][j];
                }
              }
            }
          }
        }
      }
    }
    const extraT: number[] = Array(n).fill(0);
    const results: RoofSegmentResult[] = [];
    for (let k = 0; k < n; k++) {
      if (totalSolarHeats[k] !== 0) {
        extraT[k] =
          (totalSolarHeats[k] * absorption) / ((roof.volumetricHeatCapacity ?? 0.5) * totalAreas[k] * roof.thickness);
      }
      results.push({
        surfaceTemperature: currentOutsideTemperatureRef.current + extraT[k],
        totalArea: totalAreas[k],
      } as RoofSegmentResult);
    }
    return results;
  };

  const calculateMansardRoof = (roof: RoofModel, segmentsWithoutOverhang: Vector3[][], foundation: FoundationModel) => {
    if (roof.roofType !== RoofType.Mansard) throw new Error('roof is not mansard');
    const n = segmentsWithoutOverhang.length;
    if (n === 0) return;
    const totalAreas: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const s = segmentsWithoutOverhang[i];
      totalAreas.push(Util.getTriangleArea(s[0], s[1], s[2]) + Util.getTriangleArea(s[2], s[3], s[0]));
    }
    // the last segment may not be a quad
    const s = segmentsWithoutOverhang[n - 1];
    const points = new Array<Point2>();
    for (const p of s) {
      points.push({ x: p.x, y: p.y } as Point2);
    }
    totalAreas.push(Util.getPolygonArea(points));
    const absorption = getLightAbsorption(roof);
    const totalSolarHeats: number[] = Array(n).fill(0);
    // when the sun is out
    if (sunDirectionRef.current && sunDirectionRef.current.z > 0) {
      const results = SolarRadiation.computeMansardRoofSolarRadiationEnergy(
        now,
        world,
        sunDirectionRef.current,
        roof,
        true,
        segmentsWithoutOverhang,
        foundation,
        elevation,
        distanceToClosestObject,
      );
      for (let k = 0; k < n; k++) {
        const seg = results.segmentIntensities[k];
        const unitArea = results.segmentUnitArea[k];
        for (let i = 0; i < seg.length; i++) {
          for (let j = 0; j < seg[i].length; j++) {
            seg[i][j] *= scaleFactorRef.current; // for solar heatmap generation
            totalSolarHeats[k] += seg[i][j] * unitArea; // for energy calculation
          }
        }
      }
      // sum up the solar radiation intensity for generating the solar heatmap for the entire roof (with overhang)
      if (runDailySimulation) {
        const segments = getRoofSegmentVertices(roof.id);
        if (segments) {
          const heatmapResults = SolarRadiation.computeMansardRoofSolarRadiationEnergy(
            now,
            world,
            sunDirectionRef.current,
            roof,
            false,
            segments,
            foundation,
            elevation,
            distanceToClosestObject,
          );
          for (let k = 0; k < n; k++) {
            const seg = heatmapResults.segmentIntensities[k];
            for (let i = 0; i < seg.length; i++) {
              for (let j = 0; j < seg[i].length; j++) {
                seg[i][j] *= scaleFactorRef.current;
              }
            }
            const uid = roof.id + '-' + k;
            const solarHeatmap = solarHeatmapRef.current.get(uid);
            if (!solarHeatmap) {
              solarHeatmapRef.current.set(uid, [...seg]);
            } else {
              for (let i = 0; i < solarHeatmap.length; i++) {
                for (let j = 0; j < solarHeatmap[i].length; j++) {
                  solarHeatmap[i][j] += seg[i][j];
                }
              }
            }
          }
        }
      }
    }
    const extraT: number[] = Array(n).fill(0);
    const results: RoofSegmentResult[] = [];
    for (let k = 0; k < n; k++) {
      if (totalSolarHeats[k] !== 0) {
        extraT[k] =
          (totalSolarHeats[k] * absorption) / ((roof.volumetricHeatCapacity ?? 0.5) * totalAreas[k] * roof.thickness);
      }
      results.push({
        surfaceTemperature: currentOutsideTemperatureRef.current + extraT[k],
        totalArea: totalAreas[k],
      } as RoofSegmentResult);
    }
    return results;
  };

  return <></>;
};

export default React.memo(ThermalSimulation);
