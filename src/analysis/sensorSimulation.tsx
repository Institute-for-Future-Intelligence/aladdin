/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
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
import { DatumEntry, ObjectType } from '../types';
import { Util } from '../Util';
import { AirMass, MINUTES_OF_DAY } from './analysisConstants';
import {
  MONTHS,
  UNIT_VECTOR_NEG_Y_ARRAY,
  UNIT_VECTOR_POS_Z,
  UNIT_VECTOR_POS_Z_ARRAY,
  ZERO_TOLERANCE,
} from '../constants';
import { SensorModel } from '../models/SensorModel';
import * as Selector from '../stores/selector';
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { SunMinutes } from './SunMinutes';

export interface SensorSimulationProps {
  city: string | null;
}

const SensorSimulation = ({ city }: SensorSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const loggable = useStore(Selector.loggable);
  const language = useStore(Selector.language);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getParent = useStore(Selector.getParent);
  const getWeather = useStore(Selector.getWeather);
  const getHorizontalSolarRadiation = useStore(Selector.getHorizontalSolarRadiation);
  const getVerticalSolarRadiation = useStore(Selector.getVerticalSolarRadiation);
  const setSensorLabels = useStore(Selector.setSensorLabels);
  const setDailyLightSensorData = useStore(Selector.setDailyLightSensorData);
  const setYearlyLightSensorData = useStore(Selector.setYearlyLightSensorData);
  const runDailyLightSensor = useStore(Selector.runDailyLightSensor);
  const pauseDailyLightSensor = useStore(Selector.pauseDailyLightSensor);
  const runYearlyLightSensor = useStore(Selector.runYearlyLightSensor);
  const pauseYearlyLightSensor = useStore(Selector.pauseYearlyLightSensor);
  const showDailyLightSensorPanel = useStore(Selector.viewState.showDailyLightSensorPanel);
  const noAnimation = useStore(Selector.world.noAnimationForSensorDataCollection);

  const { scene } = useThree();
  const lang = { lng: language };
  const weather = getWeather(city ?? 'Boston MA, USA');
  const measuredHorizontalRadiation = getHorizontalSolarRadiation(city ?? 'Boston MA, USA');
  const measuredVerticalRadiation = getVerticalSolarRadiation(city ?? 'Boston MA, USA');
  const elevation = city ? getWeather(city)?.elevation : 0;
  const timesPerHour = world.timesPerHour ?? 4;
  const minuteInterval = 60 / timesPerHour;
  const ray = useMemo(() => new Raycaster(), []);
  const now = new Date(world.date);
  const objectsRef = useRef<Object3D[]>([]);
  const intersectionsRef = useRef<Intersection[]>([]); // reuse array in intersection detection
  const requestRef = useRef<number>(0);
  const simulationCompletedRef = useRef<boolean>(false);
  const originalDateRef = useRef<Date>(new Date(world.date));
  const dailyDataMapRef = useRef<Map<string, number[]>>(new Map<string, number[]>());
  const yearlyDataMapRef = useRef<Map<string, number[]>>(new Map<string, number[]>());
  const daylightArrayRef = useRef<number[]>(new Array(12).fill(0));
  const clearnessArrayRef = useRef<number[]>(new Array(12).fill(0));
  const sampledDayRef = useRef<number>(0);
  const pauseRef = useRef<boolean>(false);
  const pausedDateRef = useRef<Date>(new Date(world.date));
  const dayRef = useRef<number>(0);

  // this is used in daily simulation that should respond to change of date and latitude
  const sunMinutes = useMemo(() => {
    return computeSunriseAndSunsetInMinutes(now, world.latitude);
  }, [world.date, world.latitude]);

  // this is used in yearly simulation in which the date is changed programmatically based on the current latitude
  const sunMinutesRef = useRef<SunMinutes>(sunMinutes);

  /* do the daily simulation to generate daily sensor data */

  useEffect(() => {
    if (runDailyLightSensor) {
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
              state.world.date = originalDateRef.current.toString();
              state.simulationInProgress = false;
              state.simulationPaused = false;
            });
          }
          pauseRef.current = false;
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runDailyLightSensor]);

  useEffect(() => {
    pauseRef.current = pauseDailyLightSensor;
    if (pauseDailyLightSensor) {
      pausedDateRef.current = new Date(now.getTime());
      cancelAnimationFrame(requestRef.current);
      setCommonStore((state) => {
        state.simulationPaused = true;
      });
      showInfo(i18n.t('message.SimulationPaused', lang));
    } else {
      setCommonStore((state) => {
        state.simulationPaused = false;
      });
      // continue the simulation
      simulateDaily();
    }
  }, [pauseDailyLightSensor]);

  const staticSimulateDaily = () => {
    fetchObjects();
    resetDailyDataMap();
    for (const e of elements) {
      if (e.type === ObjectType.Sensor) {
        calculateMeasurementWithoutAnimation(e as SensorModel);
      }
    }
    setCommonStore((state) => {
      state.runDailyLightSensor = false;
      state.simulationInProgress = false;
      state.simulationPaused = false;
      state.viewState.showDailyLightSensorPanel = true;
    });
    showInfo(i18n.t('message.SimulationCompleted', lang));
    simulationCompletedRef.current = true;
    finishDaily();
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Static Daily Simulation for Sensors Completed',
          details: state.dailyLightSensorData,
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
    resetDailyDataMap();
  };

  const simulateDaily = () => {
    if (runDailyLightSensor && !pauseRef.current) {
      const totalMinutes = now.getMinutes() + now.getHours() * 60 + (now.getDay() - dayRef.current) * MINUTES_OF_DAY;
      if (totalMinutes + minuteInterval >= sunMinutes.sunset) {
        cancelAnimationFrame(requestRef.current);
        setCommonStore((state) => {
          state.runDailyLightSensor = false;
          state.simulationInProgress = false;
          state.simulationPaused = false;
          state.world.date = originalDateRef.current.toString();
          state.viewState.showDailyLightSensorPanel = true;
        });
        showInfo(i18n.t('message.SimulationCompleted', lang));
        simulationCompletedRef.current = true;
        finishDaily();
        if (loggable) {
          setCommonStore((state) => {
            state.actionInfo = {
              name: 'Dynamic Daily Simulation for Sensors Completed',
              details: state.dailyLightSensorData,
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
        state.world.date = now.toString();
      });
      // will the calculation immediately use the latest geometry after re-rendering?
      for (const e of elements) {
        if (e.type === ObjectType.Sensor) {
          calculateMeasurement(e as SensorModel);
        }
      }
      // recursive call to the next step of the simulation
      requestRef.current = requestAnimationFrame(simulateDaily);
    }
  };

  const finishDaily = () => {
    const timeFactor = getTimeFactor();
    for (const e of elements) {
      if (e.type === ObjectType.Sensor) {
        const result = dailyDataMapRef.current.get(e.id);
        if (result) {
          for (let i = 0; i < result.length; i++) {
            if (result[i] !== 0) result[i] *= timeFactor;
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
      if (e.type === ObjectType.Sensor) {
        const result = dailyDataMapRef.current.get(e.id);
        if (result) {
          map.set('Radiation' + ++index, result);
          labels.push(e.label ? e.label : 'Radiation' + index);
        }
      }
    }
    const data = [];
    for (let i = 0; i < 24; i++) {
      const datum: DatumEntry = {};
      datum['Hour'] = i;
      for (let k = 1; k <= index; k++) {
        const key = 'Radiation' + k;
        datum[labels[k - 1]] = map.get(key)?.[i];
      }
      data.push(datum);
    }
    setDailyLightSensorData(data);
    setSensorLabels(labels);
  };

  /* do the yearly simulation to collect sensor data */

  useEffect(() => {
    if (runYearlyLightSensor) {
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
              state.world.date = originalDateRef.current.toString();
              state.simulationInProgress = false;
              state.simulationPaused = false;
            });
          }
          pauseRef.current = false;
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runYearlyLightSensor]);

  useEffect(() => {
    pauseRef.current = pauseYearlyLightSensor;
    if (pauseYearlyLightSensor) {
      pausedDateRef.current = new Date(now.getTime());
      cancelAnimationFrame(requestRef.current);
      setCommonStore((state) => {
        state.simulationPaused = true;
      });
      showInfo(i18n.t('message.SimulationPaused', lang));
    } else {
      setCommonStore((state) => {
        state.simulationPaused = false;
      });
      // continue the simulation
      simulateYearly();
    }
  }, [pauseYearlyLightSensor]);

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
        state.world.date = now.toString();
      });
    }
    simulationCompletedRef.current = false;
    fetchObjects();
    resetDailyDataMap();
    resetYearlyDataMap();
  };

  const staticSimulateYearly = () => {
    fetchObjects();
    resetDailyDataMap();
    resetYearlyDataMap();
    originalDateRef.current = new Date(world.date);
    sampledDayRef.current = 0;
    for (let month = 0; month < 12; month++) {
      now.setMonth(month, 22);
      sunMinutesRef.current = computeSunriseAndSunsetInMinutes(now, world.latitude);
      resetDailyDataMap();
      for (const e of elements) {
        if (e.type === ObjectType.Sensor) {
          calculateMeasurementWithoutAnimation(e as SensorModel);
        }
      }
      finishMonthly();
      sampledDayRef.current++;
    }
    setCommonStore((state) => {
      state.runYearlyLightSensor = false;
      state.simulationInProgress = false;
      state.simulationPaused = false;
      state.world.date = originalDateRef.current.toString();
      state.viewState.showYearlyLightSensorPanel = true;
    });
    showInfo(i18n.t('message.SimulationCompleted', lang));
    simulationCompletedRef.current = true;
    generateYearlyData();
    if (loggable) {
      setCommonStore((state) => {
        state.actionInfo = {
          name: 'Static Yearly Simulation for Sensors Completed',
          details: state.yearlyLightSensorData,
          timestamp: new Date().getTime(),
        };
      });
    }
  };

  const simulateYearly = () => {
    if (runYearlyLightSensor && !pauseRef.current) {
      const totalMinutes = now.getMinutes() + now.getHours() * 60 + (now.getDay() - dayRef.current) * MINUTES_OF_DAY;
      if (totalMinutes + minuteInterval < sunMinutesRef.current.sunset) {
        // this is where time advances (by incrementing the minutes with the given interval)
        now.setHours(now.getHours(), now.getMinutes() + minuteInterval);
        setCommonStore((state) => {
          state.world.date = now.toString();
        });
        for (const e of elements) {
          if (e.type === ObjectType.Sensor) {
            calculateMeasurement(e as SensorModel);
          }
        }
        // recursive call to the next step of the simulation within the current day
        requestRef.current = requestAnimationFrame(simulateYearly);
      } else {
        finishMonthly();
        sampledDayRef.current++;
        if (sampledDayRef.current === 12) {
          cancelAnimationFrame(requestRef.current);
          setCommonStore((state) => {
            state.runYearlyLightSensor = false;
            state.simulationInProgress = false;
            state.simulationPaused = false;
            state.world.date = originalDateRef.current.toString();
            state.viewState.showYearlyLightSensorPanel = true;
          });
          showInfo(i18n.t('message.SimulationCompleted', lang));
          simulationCompletedRef.current = true;
          generateYearlyData();
          if (loggable) {
            setCommonStore((state) => {
              state.actionInfo = {
                name: 'Dynamic Yearly Simulation for Sensors Completed',
                details: state.yearlyLightSensorData,
                timestamp: new Date().getTime(),
              };
            });
          }
          return;
        }
        // go to the next month
        now.setMonth(sampledDayRef.current, 22);
        dayRef.current = now.getDay();
        sunMinutesRef.current = computeSunriseAndSunsetInMinutes(now, world.latitude);
        now.setHours(Math.floor(sunMinutesRef.current.sunrise / 60), -minuteInterval / 2);
        resetDailyDataMap();
        // recursive call to the next step of the simulation
        requestRef.current = requestAnimationFrame(simulateYearly);
      }
    }
  };

  const finishMonthly = () => {
    const timeFactor = getTimeFactorByMonth();
    for (const e of elements) {
      if (e.type === ObjectType.Sensor) {
        const result = dailyDataMapRef.current.get(e.id);
        if (result) {
          const total = yearlyDataMapRef.current.get(e.id);
          if (total) {
            const sumDaily = result.reduce((a, b) => a + b, 0);
            total[sampledDayRef.current] += sumDaily * timeFactor;
          }
        }
      }
    }
    if (showDailyLightSensorPanel) finishDaily();
  };

  const generateYearlyData = () => {
    const resultArr = [];
    const labels = [];
    let index = 0;
    let hasHorizontalSensor = false;
    let hasVerticalSensor = false;
    for (const e of elements) {
      if (e.type === ObjectType.Sensor) {
        const result = yearlyDataMapRef.current.get(e.id);
        if (result) {
          resultArr.push(result);
          labels.push(e.label ? e.label : 'Radiation' + ++index);
          if (!hasHorizontalSensor && Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
            hasHorizontalSensor = true;
          }
          if (!hasVerticalSensor && Util.isIdentical(e.normal, UNIT_VECTOR_NEG_Y_ARRAY)) {
            hasVerticalSensor = true;
          }
        }
      }
    }
    const includeHorizontalMeasurement = hasHorizontalSensor && measuredHorizontalRadiation;
    if (includeHorizontalMeasurement) labels.push('Measured (Hor.)');
    const includeVerticalMeasurement = hasVerticalSensor && measuredVerticalRadiation;
    if (includeVerticalMeasurement) labels.push('Measured (Ver.)');
    const results = [];
    for (let month = 0; month < 12; month++) {
      const r: DatumEntry = {};
      r['Month'] = MONTHS[month];
      for (const [i, a] of resultArr.entries()) {
        r['Daylight'] = daylightArrayRef.current[month];
        r['Clearness'] = clearnessArrayRef.current[month] * 100;
        if (includeHorizontalMeasurement) r['Measured (Hor.)'] = measuredHorizontalRadiation.data[month];
        if (includeVerticalMeasurement) r['Measured (Ver.)'] = measuredVerticalRadiation.data[month];
        r[labels[i]] = a[month];
      }
      results.push(r);
    }
    setYearlyLightSensorData(results);
    setSensorLabels(labels);
  };

  /* shared functions between daily and yearly simulation */

  const resetDailyDataMap = () => {
    for (const e of elements) {
      if (e.type === ObjectType.Sensor) {
        const result = dailyDataMapRef.current.get(e.id);
        if (result) {
          result.fill(0);
        } else {
          dailyDataMapRef.current.set(e.id, new Array(24).fill(0));
        }
      }
    }
  };

  const resetYearlyDataMap = () => {
    for (const e of elements) {
      if (e.type === ObjectType.Sensor) {
        const yearlyResult = yearlyDataMapRef.current.get(e.id);
        if (yearlyResult) {
          yearlyResult.fill(0);
        } else {
          yearlyDataMapRef.current.set(e.id, new Array(12).fill(0));
        }
      }
    }
  };

  const calculateMeasurement = (sensor: SensorModel) => {
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z < ZERO_TOLERANCE) return; // when the sun is not out
    const parent = getParent(sensor);
    if (!parent) throw new Error('parent of sensor does not exist');
    const position = Util.absoluteCoordinates(sensor.cx, sensor.cy, sensor.cz, parent);
    const normal = new Vector3().fromArray(sensor.normal);
    // TODO: right now we assume a parent rotation is always around the z-axis
    normal.applyAxisAngle(UNIT_VECTOR_POS_Z, parent.rotation[2]);
    const dayOfYear = Util.dayOfYear(now);
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const dot = normal.dot(sunDirection);
    // indirect radiation
    let result = calculateDiffuseAndReflectedRadiation(world.ground, now.getMonth(), normal, peakRadiation);
    if (dot > 0) {
      if (!inShadow(sensor.id, position, sunDirection)) {
        // direct radiation
        result += dot * peakRadiation;
      }
    }
    const output = dailyDataMapRef.current.get(sensor.id);
    if (output) {
      // the output is the average radiation intensity. if the minutes are greater than 30 or 30, it is counted
      // as the measurement of the next hour to maintain the symmetry around noon
      const index = now.getMinutes() >= 30 ? (now.getHours() + 1 === 24 ? 0 : now.getHours() + 1) : now.getHours();
      output[index] += result;
    }
  };

  // if there are no moving parts, this is way faster
  const calculateMeasurementWithoutAnimation = (sensor: SensorModel) => {
    const parent = getParent(sensor);
    if (!parent) throw new Error('parent of sensor does not exist');
    const result = dailyDataMapRef.current.get(sensor.id);
    if (!result) return;
    const position = Util.absoluteCoordinates(sensor.cx, sensor.cy, sensor.cz, parent);
    const normal = new Vector3().fromArray(sensor.normal);
    // TODO: right now we assume a parent rotation is always around the z-axis
    normal.applyAxisAngle(UNIT_VECTOR_POS_Z, parent.rotation[2]);
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < world.timesPerHour; j++) {
        // a shift of 30 minutes minute half of the interval ensures the symmetry of the result around noon
        const cur = new Date(year, month, date, i, (j + 0.5) * minuteInterval - 30);
        const sunDirection = getSunDirection(cur, world.latitude);
        if (sunDirection.z > 0) {
          // when the sun is out
          const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
          const dot = normal.dot(sunDirection);
          if (dot > 0) {
            if (!inShadow(sensor.id, position, sunDirection)) {
              // direct radiation
              result[i] += dot * peakRadiation;
            }
          }
          // indirect radiation
          result[i] += calculateDiffuseAndReflectedRadiation(world.ground, month, normal, peakRadiation);
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
    const month = now.getMonth();
    const daylight = sunMinutesRef.current.daylight() / 60;
    if (daylight > ZERO_TOLERANCE) {
      daylightArrayRef.current[month] = daylight;
      clearnessArrayRef.current[month] = weather.sunshineHours[month] / (30 * daylight);
      return clearnessArrayRef.current[month] / timesPerHour;
    }
    daylightArrayRef.current[month] = 0;
    clearnessArrayRef.current[month] = 0;
    return 0;
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

  const inShadow = (sensorId: string, position: Vector3, sunDirection: Vector3) => {
    if (objectsRef.current.length > 1) {
      intersectionsRef.current.length = 0;
      ray.set(position, sunDirection);
      const objects = objectsRef.current.filter((obj) => obj.uuid !== sensorId);
      ray.intersectObjects(objects, false, intersectionsRef.current);
      return intersectionsRef.current.length > 0;
    }
    return false;
  };

  return <></>;
};

export default React.memo(SensorSimulation);
