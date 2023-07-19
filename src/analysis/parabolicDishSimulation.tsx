/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { calculatePeakRadiation, computeSunriseAndSunsetInMinutes, getSunDirection } from './sunTools';
import { Euler, Intersection, Object3D, Quaternion, Raycaster, Vector2, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useStore } from '../stores/common';
import * as Selector from 'src/stores/selector';
import { DatumEntry, ObjectType } from '../types';
import { Util } from '../Util';
import { AirMass } from './analysisConstants';
import { MONTHS, UNIT_VECTOR_POS_Z, ZERO_TOLERANCE } from '../constants';
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { ParabolicDishModel } from '../models/ParabolicDishModel';
import { SunMinutes } from './SunMinutes';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';

export interface ParabolicDishSimulationProps {
  city: string | null;
}

const ParabolicDishSimulation = ({ city }: ParabolicDishSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const setPrimitiveStore = usePrimitiveStore(Selector.setPrimitiveStore);
  const loggable = useStore(Selector.loggable);
  const language = useStore(Selector.language);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getWeather = useStore(Selector.getWeather);
  const getParent = useStore(Selector.getParent);
  const setDailyYield = useDataStore(Selector.setDailyParabolicDishYield);
  const updateDailyYield = useStore(Selector.updateSolarCollectorDailyYieldById);
  const setYearlyYield = useDataStore(Selector.setYearlyParabolicDishYield);
  const updateYearlyYield = useStore(Selector.updateSolarCollectorYearlyYieldById);
  const dailyIndividualOutputs = useStore(Selector.dailyParabolicDishIndividualOutputs);
  const yearlyIndividualOutputs = useStore(Selector.yearlyParabolicDishIndividualOutputs);
  const setParabolicDishLabels = useDataStore(Selector.setParabolicDishLabels);
  const runDailySimulation = usePrimitiveStore(Selector.runDailySimulationForParabolicDishes);
  const runYearlySimulation = usePrimitiveStore(Selector.runYearlySimulationForParabolicDishes);
  const pauseDailySimulation = usePrimitiveStore(Selector.pauseDailySimulationForParabolicDishes);
  const pauseYearlySimulation = usePrimitiveStore(Selector.pauseYearlySimulationForParabolicDishes);
  const showDailyParabolicDishYieldPanel = useStore(Selector.viewState.showDailyParabolicDishYieldPanel);

  const { scene } = useThree();
  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);
  const weather = useMemo(() => getWeather(city ?? 'Boston MA, USA'), [city]);
  const now = useMemo(() => new Date(world.date), [world.date]);

  const elevation = city ? weather?.elevation : 0;
  const timesPerHour = world.cspTimesPerHour ?? 4;
  const minuteInterval = 60 / timesPerHour;
  const daysPerYear = world.cspDaysPerYear ?? 6;
  const monthInterval = 12 / daysPerYear;
  const ray = useMemo(() => new Raycaster(), []);
  const dustLoss = world.dustLoss ?? 0.05;
  const cellSize = world.cspGridCellSize ?? 0.5;
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

  // this is used in daily simulation that should respond to change of date and latitude
  const sunMinutes = useMemo(() => {
    return computeSunriseAndSunsetInMinutes(now, world.latitude);
  }, [world.date, world.latitude]);

  // this is used in yearly simulation in which the date is changed programmatically based on the current latitude
  const sunMinutesRef = useRef<SunMinutes>(sunMinutes);

  const daysOfMonth = Util.daysInYear(now) / 12;

  /* do the daily simulation */

  useEffect(() => {
    if (runDailySimulation) {
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
          usePrimitiveStore.setState((state) => {
            state.simulationInProgress = false;
            state.simulationPaused = false;
          });
        }
        pauseRef.current = false;
      };
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
  }, [pauseDailySimulation]);

  const initDaily = () => {
    if (pauseRef.current) {
      // if the simulation has been paused, continue from the paused date
      now.setTime(pausedDateRef.current.getTime());
      pauseRef.current = false;
    } else {
      originalDateRef.current = new Date(world.date);
      // beginning some minutes before the sunrise hour just in case and to provide a cue
      now.setHours(Math.floor(sunMinutes.sunrise / 60), minuteInterval / 2 - 30);
    }
    simulationCompletedRef.current = false;
    fetchObjects();
    resetDailyOutputsMap();
  };

  const simulateDaily = () => {
    if (runDailySimulation && !pauseRef.current) {
      const totalMinutes = now.getMinutes() + now.getHours() * 60;
      if (totalMinutes >= sunMinutes.sunset) {
        cancelAnimationFrame(requestRef.current);
        setCommonStore((state) => {
          state.world.date = originalDateRef.current.toLocaleString('en-US');
          state.viewState.showDailyParabolicDishYieldPanel = true;
        });
        usePrimitiveStore.setState((state) => {
          state.runDailySimulationForParabolicDishes = false;
          state.simulationInProgress = false;
          state.simulationPaused = false;
        });
        showInfo(i18n.t('message.SimulationCompleted', lang));
        simulationCompletedRef.current = true;
        finishDaily();
        if (loggable) {
          setCommonStore((state) => {
            const totalYield = useDataStore.getState().sumDailyParabolicDishYield();
            state.actionInfo = {
              name: 'Daily Simulation for Parabolic Dishes Completed',
              result: { totalYield: totalYield },
              details: useDataStore.getState().dailyParabolicDishYield,
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
        if (e.type === ObjectType.ParabolicDish) {
          calculateYield(e as ParabolicDishModel);
        }
      }
      // recursive call to the next step of the simulation
      requestRef.current = requestAnimationFrame(simulateDaily);
    }
  };

  const finishDaily = () => {
    const timeFactor = getTimeFactor();
    for (const e of elements) {
      if (e.type === ObjectType.ParabolicDish) {
        const dish = e as ParabolicDishModel;
        const result = dailyOutputsMapRef.current.get(dish.id);
        if (result) {
          const factor = getElementFactor(dish) * timeFactor;
          for (let i = 0; i < result.length; i++) {
            if (result[i] !== 0) result[i] *= factor;
          }
        }
      }
    }
    generateDailyYieldData();
  };

  // TODO:
  // Figure out a way to regenerate the graph without redoing the calculation
  // when switching between individual and total outputs
  const generateDailyYieldData = () => {
    if (dailyIndividualOutputs) {
      const total = new Array(24).fill(0);
      const map = new Map<string, number[]>();
      let index = 0;
      const labels = [];
      for (const e of elements) {
        if (e.type === ObjectType.ParabolicDish) {
          const output = dailyOutputsMapRef.current.get(e.id);
          if (output) {
            updateDailyYield(
              e.id,
              output.reduce((a, b) => a + b, 0),
            );
            index++;
            map.set('Dish' + index, output);
            labels.push(e.label ?? 'Dish' + index);
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
          const key = 'Dish' + k;
          datum[labels[k - 1]] = map.get(key)?.[i];
        }
        data.push(datum);
      }
      setDailyYield(data);
      setParabolicDishLabels(labels);
    } else {
      const total = new Array(24).fill(0);
      for (const e of elements) {
        if (e.type === ObjectType.ParabolicDish) {
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

  /* do the yearly simulation */

  useEffect(() => {
    if (runYearlySimulation) {
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
          usePrimitiveStore.setState((state) => {
            state.simulationInProgress = false;
            state.simulationPaused = false;
          });
        }
        pauseRef.current = false;
      };
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
      sunMinutesRef.current = computeSunriseAndSunsetInMinutes(now, world.latitude);
      now.setHours(Math.floor(sunMinutesRef.current.sunrise / 60), minuteInterval / 2 - 30);
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

  const simulateYearly = () => {
    if (runYearlySimulation && !pauseRef.current) {
      const totalMinutes = now.getMinutes() + now.getHours() * 60;
      if (totalMinutes < sunMinutesRef.current.sunset) {
        // this is where time advances (by incrementing the minutes with the given interval)
        now.setHours(now.getHours(), now.getMinutes() + minuteInterval);
        setCommonStore((state) => {
          state.world.date = now.toLocaleString('en-US');
        });
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish) {
            calculateYield(e as ParabolicDishModel);
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
            state.viewState.showYearlyParabolicDishYieldPanel = true;
          });
          usePrimitiveStore.setState((state) => {
            state.runYearlySimulationForParabolicDishes = false;
            state.simulationInProgress = false;
            state.simulationPaused = false;
          });
          showInfo(i18n.t('message.SimulationCompleted', lang));
          simulationCompletedRef.current = true;
          generateYearlyYieldData();
          if (loggable) {
            setCommonStore((state) => {
              const totalYield = useDataStore.getState().sumYearlyParabolicDishYield();
              state.actionInfo = {
                name: 'Yearly Simulation for Parabolic Dishes Completed',
                result: { totalYield: totalYield },
                details: useDataStore.getState().yearlyParabolicDishYield,
                timestamp: new Date().getTime(),
              };
            });
          }
          return;
        }
        // go to the next month
        now.setMonth(sampledDayRef.current * monthInterval, 22);
        sunMinutesRef.current = computeSunriseAndSunsetInMinutes(now, world.latitude);
        now.setHours(Math.floor(sunMinutesRef.current.sunrise / 60), minuteInterval / 2 - 30);
        resetDailyOutputsMap();
        // recursive call to the next step of the simulation
        requestRef.current = requestAnimationFrame(simulateYearly);
      }
    }
  };

  const finishMonthly = () => {
    const timeFactor = getTimeFactorByMonth();
    for (const e of elements) {
      if (e.type === ObjectType.ParabolicDish) {
        const dish = e as ParabolicDishModel;
        const result = dailyOutputsMapRef.current.get(dish.id);
        if (result) {
          const total = yearlyOutputsMapRef.current.get(dish.id);
          if (total) {
            const sumDaily = result.reduce((a, b) => a + b, 0);
            total[sampledDayRef.current] += sumDaily * timeFactor * getElementFactor(dish);
          }
        }
      }
    }
    if (showDailyParabolicDishYieldPanel) finishDaily();
  };

  // TODO:
  // Figure out a way to regenerate the graph without redoing the calculation
  // when switching between individual and total outputs
  const generateYearlyYieldData = () => {
    if (yearlyIndividualOutputs) {
      const resultArr = [];
      const labels = [];
      let index = 0;
      for (const e of elements) {
        if (e.type === ObjectType.ParabolicDish) {
          const output = yearlyOutputsMapRef.current.get(e.id);
          if (output) {
            updateYearlyYield(e.id, output.reduce((a, b) => a + b, 0) * monthInterval * daysOfMonth);
            resultArr.push(output);
            index++;
            labels.push(e.label ?? 'Dish' + index);
          }
        }
      }
      const results = [];
      for (let month = 0; month < 12; month += monthInterval) {
        const r: DatumEntry = {};
        r['Month'] = MONTHS[month];
        for (const [i, a] of resultArr.entries()) {
          r[labels[i]] = a[month / monthInterval] * daysOfMonth;
        }
        results.push(r);
      }
      setYearlyYield(results);
      setParabolicDishLabels(labels);
    } else {
      const resultArr = [];
      for (const e of elements) {
        if (e.type === ObjectType.ParabolicDish) {
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
        results.push({ Month: MONTHS[month], Total: total * daysOfMonth } as DatumEntry);
      }
      setYearlyYield(results);
    }
  };

  /* shared functions */

  // there is room for performance improvement if we figure out a way to cache a lot of things used below
  const calculateYield = (dish: ParabolicDishModel) => {
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z < ZERO_TOLERANCE) return; // when the sun is not out
    const parent = getParent(dish);
    if (!parent) throw new Error('parent of parabolic dish does not exist');
    if (parent.type !== ObjectType.Foundation) return;
    const dayOfYear = Util.dayOfYear(now);
    const center = Util.absoluteCoordinates(dish.cx, dish.cy, dish.cz, parent);
    const normal = new Vector3().fromArray(dish.normal);
    const originalNormal = normal.clone();
    const lx = dish.lx;
    const ly = dish.ly;
    let nx = Math.max(2, Math.round(dish.lx / cellSize));
    let ny = Math.max(2, Math.round(dish.ly / cellSize));
    const dx = lx / nx;
    const dy = ly / ny;
    const depth = (lx * lx) / (4 * dish.latusRectum); // the distance from the bottom to the aperture plane
    // const focalLength = 0.25*dish.latusRectum; // equal to the distance from the directrix to the horizontal axis
    const actualPoleHeight = dish.poleHeight + lx / 2;
    // shift half cell size to the center of each grid cell
    const x0 = center.x - (lx - cellSize) / 2;
    const y0 = center.y - (ly - cellSize) / 2;
    const z0 = parent.lz + actualPoleHeight + dish.lz + depth;
    const center2d = new Vector2(center.x, center.y);
    const v = new Vector3();
    const rot = parent.rotation[2];
    const zRot = rot + dish.relativeAzimuth;
    const zRotZero = Util.isZero(zRot);
    const rotatedSunDirection = rot
      ? sunDirection.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, -rot)
      : sunDirection.clone();
    const qRot = new Quaternion().setFromUnitVectors(UNIT_VECTOR_POS_Z, rotatedSunDirection);
    const normalEuler = new Euler().setFromQuaternion(qRot);
    normal.copy(originalNormal.clone().applyEuler(normalEuler));
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const dot = normal.dot(sunDirection);
    const v2d = new Vector2();
    const dv = new Vector3();
    let sum = 0;
    for (let kx = 0; kx < nx; kx++) {
      for (let ky = 0; ky < ny; ky++) {
        if (dot > 0) {
          // simplify the simulation by using the aperture surface instead of the parabolic surface
          v2d.set(x0 + kx * dx, y0 + ky * dy);
          if (!zRotZero) v2d.rotateAround(center2d, zRot);
          dv.set(v2d.x - center2d.x, v2d.y - center2d.y, 0);
          dv.applyEuler(normalEuler);
          v.set(center.x + dv.x, center.y + dv.y, z0 + dv.z);
          if (!inShadow(dish.id, v, sunDirection)) {
            // direct radiation
            sum += dot * peakRadiation;
          }
        }
      }
    }
    const output = dailyOutputsMapRef.current.get(dish.id);
    if (output) {
      // the output is the average radiation density, hence we have to divide it by nx * ny
      // if the minutes are greater than 30 or 30, it is counted as the output of the next hour
      // to maintain the symmetry around noon
      const index = now.getMinutes() >= 30 ? (now.getHours() + 1 === 24 ? 0 : now.getHours() + 1) : now.getHours();
      output[index] += sum / (nx * ny);
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

  const getElementFactor = (dish: ParabolicDishModel) => {
    return (
      dish.lx *
      dish.ly *
      dish.opticalEfficiency *
      dish.thermalEfficiency *
      dish.absorptance *
      dish.reflectance *
      (1 - dustLoss)
    );
  };

  const inShadow = (dishId: string, position: Vector3, sunDirection: Vector3) => {
    if (objectsRef.current.length > 1) {
      intersectionsRef.current.length = 0;
      ray.set(position, sunDirection);
      const objects = objectsRef.current.filter((obj) => obj.uuid !== dishId);
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

  const resetDailyOutputsMap = () => {
    for (const e of elements) {
      if (e.type === ObjectType.ParabolicDish) {
        const result = dailyOutputsMapRef.current.get(e.id);
        if (result) {
          result.fill(0);
        } else {
          dailyOutputsMapRef.current.set(e.id, new Array(24).fill(0));
        }
      }
    }
  };

  const resetYearlyOutputsMap = () => {
    for (const e of elements) {
      if (e.type === ObjectType.ParabolicDish) {
        const yearlyResult = yearlyOutputsMapRef.current.get(e.id);
        if (yearlyResult && yearlyResult.length === daysPerYear) {
          yearlyResult.fill(0);
        } else {
          yearlyOutputsMapRef.current.set(e.id, new Array(daysPerYear).fill(0));
        }
      }
    }
  };

  return <></>;
};

export default React.memo(ParabolicDishSimulation);
