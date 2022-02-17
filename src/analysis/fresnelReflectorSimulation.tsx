/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  calculateDiffuseAndReflectedRadiation,
  calculatePeakRadiation,
  computeSunriseAndSunsetInMinutes,
  getSunDirection,
} from './sunTools';
import { Euler, Intersection, Object3D, Raycaster, Vector2, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useStore } from '../stores/common';
import * as Selector from 'src/stores/selector';
import { DatumEntry, ObjectType } from '../types';
import { Util } from '../Util';
import { AirMass } from './analysisConstants';
import { MONTHS, UNIT_VECTOR_POS_Z, ZERO_TOLERANCE } from '../constants';
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { FresnelReflectorModel } from '../models/FresnelReflectorModel';
import { FoundationModel } from '../models/FoundationModel';
import { SunMinutes } from './SunMinutes';

export interface FresnelReflectorSimulationProps {
  city: string | null;
}

const FresnelReflectorSimulation = ({ city }: FresnelReflectorSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getWeather = useStore(Selector.getWeather);
  const getParent = useStore(Selector.getParent);
  const setDailyYield = useStore(Selector.setDailyFresnelReflectorYield);
  const updateDailyYield = useStore(Selector.updateSolarCollectorDailyYieldById);
  const dailyIndividualOutputs = useStore(Selector.dailyFresnelReflectorIndividualOutputs);
  const setYearlyYield = useStore(Selector.setYearlyFresnelReflectorYield);
  const updateYearlyYield = useStore(Selector.updateSolarCollectorYearlyYieldById);
  const yearlyIndividualOutputs = useStore(Selector.yearlyFresnelReflectorIndividualOutputs);
  const setFresnelReflectorLabels = useStore(Selector.setFresnelReflectorLabels);
  const runDailySimulation = useStore(Selector.runDailySimulationForFresnelReflectors);
  const runYearlySimulation = useStore(Selector.runYearlySimulationForFresnelReflectors);
  const pauseDailySimulation = useStore(Selector.pauseDailySimulationForFresnelReflectors);
  const pauseYearlySimulation = useStore(Selector.pauseYearlySimulationForFresnelReflectors);
  const showDailyFresnelReflectorYieldPanel = useStore(Selector.viewState.showDailyFresnelReflectorYieldPanel);

  const { scene } = useThree();
  const lang = { lng: language };
  const weather = getWeather(city ?? 'Boston MA, USA');
  const elevation = city ? weather.elevation : 0;
  const timesPerHour = world.cspTimesPerHour ?? 4;
  const minuteInterval = 60 / timesPerHour;
  const daysPerYear = world.cspDaysPerYear ?? 6;
  const monthInterval = 12 / daysPerYear;
  const ray = useMemo(() => new Raycaster(), []);
  const now = new Date(world.date);
  const dustLoss = 0.05;
  const cellSize = world.cspGridCellSize ?? 0.5;
  const objectsRef = useRef<Object3D[]>([]);
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

  /* do the daily simulation */

  useEffect(() => {
    if (runDailySimulation) {
      initDaily();
      pauseRef.current = false;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runDailySimulation]);

  useEffect(() => {
    pauseRef.current = pauseDailySimulation;
    if (pauseDailySimulation) {
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
      simulateDaily();
    }
  }, [pauseDailySimulation]);

  const initDaily = () => {
    if (pauseRef.current) {
      now.setTime(pausedDateRef.current.getTime());
    } else {
      originalDateRef.current = new Date(world.date);
      // beginning 30 minutes before the sunrise hour just in case and to provide a cue
      now.setHours(Math.floor(sunMinutes.sunrise / 60), -30);
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
          state.runDailySimulationForFresnelReflectors = false;
          state.simulationInProgress = false;
          state.simulationPaused = false;
          state.world.date = originalDateRef.current.toString();
          state.viewState.showDailyFresnelReflectorYieldPanel = true;
        });
        showInfo(i18n.t('message.SimulationCompleted', lang));
        simulationCompletedRef.current = true;
        finishDaily();
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
        if (e.type === ObjectType.FresnelReflector) {
          calculateYield(e as FresnelReflectorModel);
        }
      }
      // recursive call to the next step of the simulation
      requestRef.current = requestAnimationFrame(simulateDaily);
    }
  };

  const finishDaily = () => {
    const timeFactor = getTimeFactor();
    for (const e of elements) {
      if (e.type === ObjectType.FresnelReflector) {
        const reflector = e as FresnelReflectorModel;
        const result = dailyOutputsMapRef.current.get(reflector.id);
        if (result) {
          const factor = getElementFactor(reflector) * timeFactor;
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
        if (e.type === ObjectType.FresnelReflector) {
          const output = dailyOutputsMapRef.current.get(e.id);
          if (output) {
            updateDailyYield(
              e.id,
              output.reduce((a, b) => a + b, 0),
            );
            index++;
            map.set('Reflector' + index, output);
            labels.push(e.label ?? 'Reflector' + index);
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
          const key = 'Reflector' + k;
          datum[labels[k - 1]] = map.get(key)?.[i];
        }
        data.push(datum);
      }
      setDailyYield(data);
      setFresnelReflectorLabels(labels);
    } else {
      const total = new Array(24).fill(0);
      for (const e of elements) {
        if (e.type === ObjectType.FresnelReflector) {
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
            state.world.date = originalDateRef.current.toString();
            state.simulationInProgress = false;
            state.simulationPaused = false;
          });
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runYearlySimulation]);

  const initYearly = () => {
    originalDateRef.current = new Date(world.date);
    sampledDayRef.current = 0;
    // begin from January, 22
    now.setMonth(0, 22);
    sunMinutesRef.current = computeSunriseAndSunsetInMinutes(now, world.latitude);
    now.setHours(Math.floor(sunMinutesRef.current.sunrise / 60), -30);
    // set the initial date so that the scene gets a chance to render before the simulation starts
    setCommonStore((state) => {
      state.world.date = now.toString();
    });
    simulationCompletedRef.current = false;
    fetchObjects();
    resetDailyOutputsMap();
    resetYearlyOutputsMap();
  };

  const simulateYearly = () => {
    if (runYearlySimulation) {
      const totalMinutes = now.getMinutes() + now.getHours() * 60;
      if (totalMinutes < sunMinutesRef.current.sunset) {
        // this is where time advances (by incrementing the minutes with the given interval)
        now.setHours(now.getHours(), now.getMinutes() + minuteInterval);
        setCommonStore((state) => {
          state.world.date = now.toString();
        });
        for (const e of elements) {
          if (e.type === ObjectType.FresnelReflector) {
            calculateYield(e as FresnelReflectorModel);
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
            state.runYearlySimulationForFresnelReflectors = false;
            state.simulationInProgress = false;
            state.simulationPaused = false;
            state.world.date = originalDateRef.current.toString();
            state.viewState.showYearlyFresnelReflectorYieldPanel = true;
          });
          showInfo(i18n.t('message.SimulationCompleted', lang));
          simulationCompletedRef.current = true;
          generateYearlyYieldData();
          return;
        }
        // go to the next month
        now.setMonth(sampledDayRef.current * monthInterval, 22);
        sunMinutesRef.current = computeSunriseAndSunsetInMinutes(now, world.latitude);
        now.setHours(Math.floor(sunMinutesRef.current.sunrise / 60), -30);
        resetDailyOutputsMap();
        // recursive call to the next step of the simulation
        requestRef.current = requestAnimationFrame(simulateYearly);
      }
    }
  };

  const finishMonthly = () => {
    const timeFactor = getTimeFactor();
    for (const e of elements) {
      if (e.type === ObjectType.FresnelReflector) {
        const reflector = e as FresnelReflectorModel;
        const result = dailyOutputsMapRef.current.get(reflector.id);
        if (result) {
          const total = yearlyOutputsMapRef.current.get(reflector.id);
          if (total) {
            const sumDaily = result.reduce((a, b) => a + b, 0);
            total[sampledDayRef.current] += sumDaily * timeFactor * getElementFactor(reflector);
          }
        }
      }
    }
    if (showDailyFresnelReflectorYieldPanel) finishDaily();
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
        if (e.type === ObjectType.FresnelReflector) {
          const output = yearlyOutputsMapRef.current.get(e.id);
          if (output) {
            updateYearlyYield(
              e.id,
              output.reduce((a, b) => a + b, 0),
            );
            resultArr.push(output);
            index++;
            labels.push(e.label ?? 'Reflector' + index);
          }
        }
      }
      const results = [];
      for (let month = 0; month < 12; month += monthInterval) {
        const r: DatumEntry = {};
        r['Month'] = MONTHS[month];
        for (const [i, a] of resultArr.entries()) {
          r[labels[i]] = a[month / monthInterval] * 30;
        }
        results.push(r);
      }
      setYearlyYield(results);
      setFresnelReflectorLabels(labels);
    } else {
      const resultArr = [];
      for (const e of elements) {
        if (e.type === ObjectType.FresnelReflector) {
          const output = yearlyOutputsMapRef.current.get(e.id);
          if (output) {
            updateYearlyYield(
              e.id,
              output.reduce((a, b) => a + b, 0),
            );
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
        results.push({ Month: MONTHS[month], Total: total * 30 } as DatumEntry);
      }
      setYearlyYield(results);
    }
  };

  // there is room for performance improvement if we figure out a way to cache a lot of things used below
  const calculateYield = (reflector: FresnelReflectorModel) => {
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z < ZERO_TOLERANCE) return; // when the sun is not out
    const parent = getParent(reflector);
    if (!parent) throw new Error('parent of Fresnel reflector does not exist');
    if (parent.type !== ObjectType.Foundation) return;
    const foundation = parent as FoundationModel;
    const dayOfYear = Util.dayOfYear(now);
    const center = Util.absoluteCoordinates(reflector.cx, reflector.cy, reflector.cz, parent);
    const normal = new Vector3().fromArray(reflector.normal);
    const originalNormal = normal.clone();
    const lx = reflector.lx;
    const ly = reflector.ly;
    const actualPoleHeight = reflector.poleHeight + lx / 2;
    const nx = Math.max(2, Math.round(reflector.lx / cellSize));
    const ny = Math.max(2, Math.round(reflector.ly / cellSize));
    const dx = lx / nx;
    const dy = ly / ny;
    // shift half cell size to the center of each grid cell
    const x0 = center.x - (lx - cellSize) / 2;
    const y0 = center.y - (ly - cellSize) / 2;
    const z0 = foundation.lz + actualPoleHeight + reflector.lz;
    const center2d = new Vector2(center.x, center.y);
    const v = new Vector3();
    const rot = parent.rotation[2];
    // we do not handle relative azimuth yet, so this is just a placeholder
    const zRot = rot + reflector.relativeAzimuth;
    const zRotZero = Util.isZero(zRot);
    const cosRot = zRotZero ? 1 : Math.cos(zRot);
    const sinRot = zRotZero ? 0 : Math.sin(zRot);
    // convert the receiver's coordinates into those relative to the center of this reflector
    const receiverCenter = foundation.solarReceiver
      ? new Vector3(
          -reflector.cx * foundation.lx,
          -reflector.cy * foundation.ly,
          foundation.lz + (foundation.solarReceiverTubeMountHeight ?? 10),
        )
      : undefined;
    // the rotation axis is in the north-south direction, so the relative azimuth is zero, which maps to (0, 1, 0)
    const rotationAxis = new Vector3(sinRot, cosRot, 0);
    const shiftedReceiverCenter = new Vector3();
    if (receiverCenter) {
      // the reflector moves only when there is a receiver
      shiftedReceiverCenter.set(receiverCenter.x, receiverCenter.y, receiverCenter.z);
      // how much the reflected light should shift in the direction of the receiver tube?
      const shift =
        (-receiverCenter.z * (sunDirection.y * rotationAxis.y + sunDirection.x * rotationAxis.x)) / sunDirection.z;
      shiftedReceiverCenter.x += shift * rotationAxis.x;
      shiftedReceiverCenter.y -= shift * rotationAxis.y;
      const reflectorToReceiver = shiftedReceiverCenter.clone().normalize();
      // no need to normalize the following vector as both vectors to add have already been normalized
      let normalVector = reflectorToReceiver.add(sunDirection).multiplyScalar(0.5);
      // avoid singularity: atan(x, y) = infinity if x = 0
      if (Util.isSame(normalVector, UNIT_VECTOR_POS_Z)) {
        normalVector = new Vector3(-0.001, 0, 1).normalize();
      }
      normal.copy(
        originalNormal.clone().applyEuler(new Euler(0, Math.atan2(normalVector.x, normalVector.z), 0, 'ZXY')),
      );
    }
    // the unit of radiation is kW/m^2
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const indirectRadiation = calculateDiffuseAndReflectedRadiation(
      world.ground,
      now.getMonth(),
      normal,
      peakRadiation,
    );
    let sum = 0;
    const dot = normal.dot(sunDirection);
    const v2 = new Vector2();
    let tmpX = 0;
    for (let ku = 0; ku < nx; ku++) {
      tmpX = x0 + ku * dx;
      for (let kv = 0; kv < ny; kv++) {
        sum += indirectRadiation;
        if (dot > 0) {
          v2.set(tmpX, y0 + kv * dy);
          if (!zRotZero) v2.rotateAround(center2d, zRot);
          v.set(v2.x, v2.y, z0);
          if (!inShadow(reflector.id, v, sunDirection)) {
            sum += dot * peakRadiation;
          }
        }
      }
    }
    const output = dailyOutputsMapRef.current.get(reflector.id);
    if (output) {
      // the output is the average radiation density, hence we have to divide it by nx * ny
      output[now.getHours()] += sum / (nx * ny);
    }
  };

  // apply clearness and convert the unit of time step from minute to hour so that we get kWh
  // (divided by times per hour as the radiation is added up that many times in an hour)
  const getTimeFactor = () => {
    const daylight = sunMinutesRef.current.daylight() / 60;
    return daylight > ZERO_TOLERANCE ? weather.sunshineHours[now.getMonth()] / (30 * daylight * timesPerHour) : 0;
  };

  const getElementFactor = (reflector: FresnelReflectorModel) => {
    return (
      reflector.lx *
      reflector.ly *
      reflector.opticalEfficiency *
      reflector.thermalEfficiency *
      reflector.absorptance *
      reflector.reflectance *
      (1 - dustLoss)
    );
  };

  const inShadow = (reflectorId: string, position: Vector3, sunDirection: Vector3) => {
    if (objectsRef.current.length > 1) {
      intersectionsRef.current.length = 0;
      ray.set(position, sunDirection);
      const objects = objectsRef.current.filter((obj) => obj.uuid !== reflectorId);
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
      if (e.type === ObjectType.FresnelReflector) {
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
      if (e.type === ObjectType.FresnelReflector) {
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

export default React.memo(FresnelReflectorSimulation);
