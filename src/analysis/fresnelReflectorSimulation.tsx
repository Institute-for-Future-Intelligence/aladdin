/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { calculatePeakRadiation, computeSunriseAndSunsetInMinutes, getSunDirection } from './sunTools';
import { Euler, Intersection, Object3D, Raycaster, Vector2, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useStore } from '../stores/common';
import * as Selector from 'src/stores/selector';
import { DatumEntry, ObjectType, SolarStructure } from '../types';
import { Util } from '../Util';
import { AirMass } from './analysisConstants';
import { MONTHS_ABBV, UNIT_VECTOR_POS_Z, ZERO_TOLERANCE } from '../constants';
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { FresnelReflectorModel } from '../models/FresnelReflectorModel';
import { FoundationModel } from '../models/FoundationModel';
import { SunMinutes } from './SunMinutes';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';
import { useLanguage, useWeather } from '../views/hooks';

export interface FresnelReflectorSimulationProps {
  city: string | null;
}

const FresnelReflectorSimulation = React.memo(({ city }: FresnelReflectorSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const setPrimitiveStore = usePrimitiveStore(Selector.setPrimitiveStore);
  const loggable = useStore(Selector.loggable);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getParent = useStore(Selector.getParent);
  const setDailyYield = useDataStore(Selector.setDailyFresnelReflectorYield);
  const updateDailyYield = useStore(Selector.updateSolarCollectorDailyYieldById);
  const dailyIndividualOutputs = useStore(Selector.dailyFresnelReflectorIndividualOutputs);
  const setYearlyYield = useDataStore(Selector.setYearlyFresnelReflectorYield);
  const updateYearlyYield = useStore(Selector.updateSolarCollectorYearlyYieldById);
  const yearlyIndividualOutputs = useStore(Selector.yearlyFresnelReflectorIndividualOutputs);
  const setFresnelReflectorLabels = useDataStore(Selector.setFresnelReflectorLabels);
  const runDailySimulation = usePrimitiveStore(Selector.runDailySimulationForFresnelReflectors);
  const runYearlySimulation = usePrimitiveStore(Selector.runYearlySimulationForFresnelReflectors);
  const pauseDailySimulation = usePrimitiveStore(Selector.pauseDailySimulationForFresnelReflectors);
  const pauseYearlySimulation = usePrimitiveStore(Selector.pauseYearlySimulationForFresnelReflectors);
  const showDailyFresnelReflectorYieldPanel = useStore(Selector.viewState.showDailyFresnelReflectorYieldPanel);

  const { scene } = useThree();
  const lang = useLanguage();
  const weather = useWeather(city);
  const now = new Date(world.date);

  const elevation = city ? weather?.elevation : 0;
  const timesPerHour = world.cspTimesPerHour ?? 4;
  const minuteInterval = 60 / timesPerHour;
  const daysPerYear = world.cspDaysPerYear ?? 6;
  const monthInterval = 12 / daysPerYear;
  const ray = useMemo(() => new Raycaster(), []);
  const monthlyIrradianceLosses = world.monthlyIrradianceLosses ?? new Array(12).fill(0.05);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          usePrimitiveStore.getState().set((state) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          state.viewState.showDailyFresnelReflectorYieldPanel = true;
          state.selectedFloatingWindow = 'dailyFresnelReflectorYieldPanel';
        });
        usePrimitiveStore.getState().set((state) => {
          state.runDailySimulationForFresnelReflectors = false;
          state.simulationInProgress = false;
          state.simulationPaused = false;
        });
        showInfo(i18n.t('message.SimulationCompleted', lang));
        simulationCompletedRef.current = true;
        finishDaily();
        if (loggable) {
          setCommonStore((state) => {
            const totalYield = useDataStore.getState().sumDailyFresnelReflectorYield();
            state.actionInfo = {
              name: 'Daily Simulation for Fresnel Reflectors Completed',
              result: { totalYield: totalYield },
              details: useDataStore.getState().dailyFresnelReflectorYield,
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
            state.world.date = originalDateRef.current.toLocaleString('en-US');
            state.viewState.showYearlyFresnelReflectorYieldPanel = true;
            state.selectedFloatingWindow = 'yearlyFresnelReflectorYieldPanel';
          });
          usePrimitiveStore.getState().set((state) => {
            state.runYearlySimulationForFresnelReflectors = false;
            state.simulationInProgress = false;
            state.simulationPaused = false;
          });
          showInfo(i18n.t('message.SimulationCompleted', lang));
          simulationCompletedRef.current = true;
          generateYearlyYieldData();
          if (loggable) {
            setCommonStore((state) => {
              const totalYield = useDataStore.getState().sumYearlyFresnelReflectorYield();
              state.actionInfo = {
                name: 'Yearly Simulation for Fresnel Reflectors Completed',
                result: { totalYield: totalYield },
                details: useDataStore.getState().yearlyFresnelReflectorYield,
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
            updateYearlyYield(e.id, output.reduce((a, b) => a + b, 0) * monthInterval * daysOfMonth);
            resultArr.push(output);
            index++;
            labels.push(e.label ?? 'Reflector' + index);
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
      setFresnelReflectorLabels(labels);
    } else {
      const resultArr = [];
      for (const e of elements) {
        if (e.type === ObjectType.FresnelReflector) {
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

  /* shared functions */

  // there is room for performance improvement if we figure out a way to cache a lot of things used below
  const calculateYield = (reflector: FresnelReflectorModel) => {
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z < ZERO_TOLERANCE) return; // when the sun is not out
    const parent = getParent(reflector);
    if (!parent) throw new Error('parent of Fresnel reflector does not exist');
    if (parent.type !== ObjectType.Foundation) return;
    const foundation = parent as FoundationModel;
    const absorberPipe = foundation.solarAbsorberPipe;
    if (!absorberPipe) return;
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
    const receiverCenter =
      foundation.solarStructure === SolarStructure.FocusPipe
        ? new Vector3(
            (foundation.cx - center.x) * cosRot,
            (foundation.cy - center.y) * sinRot,
            foundation.cz - center.z + foundation.lz / 2 + (absorberPipe.absorberHeight ?? 10),
          )
        : undefined;
    // the rotation axis is in the north-south direction, so the relative azimuth is zero, which maps to (0, 1, 0)
    const rotationAxis = new Vector3(sinRot, cosRot, 0);
    const shiftedReceiverCenter = new Vector3();
    let normalEuler;
    let reflectorToReceiver;
    if (receiverCenter) {
      // the reflector moves only when there is a receiver
      shiftedReceiverCenter.set(receiverCenter.x, receiverCenter.y, receiverCenter.z);
      // how much the reflected light should shift in the direction of the receiver pipe?
      const shift =
        (-receiverCenter.z * (sunDirection.y * rotationAxis.y + sunDirection.x * rotationAxis.x)) / sunDirection.z;
      shiftedReceiverCenter.x += shift * rotationAxis.x;
      shiftedReceiverCenter.y -= shift * rotationAxis.y;
      reflectorToReceiver = shiftedReceiverCenter.clone().normalize();
      let normalVector = reflectorToReceiver.add(sunDirection).normalize();
      // avoid singularity: atan(x, y) = infinity if x = 0
      if (Util.isSame(normalVector, UNIT_VECTOR_POS_Z)) {
        normalVector = new Vector3(-0.001, 0, 1).normalize();
      }
      if (!zRotZero) {
        normalVector.applyAxisAngle(UNIT_VECTOR_POS_Z, -zRot);
      }
      normalEuler = new Euler(0, Math.atan2(normalVector.x, normalVector.z), zRot, 'ZXY');
      normal.copy(originalNormal.clone().applyEuler(normalEuler));
    } else {
      reflectorToReceiver = new Vector3(0, 0, 1);
      normalEuler = new Euler();
    }
    // the unit of radiation is kW/m^2
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const dot = normal.dot(sunDirection);
    const v2d = new Vector2();
    const dv = new Vector3();
    let sum = 0;
    let tmpX = 0;
    for (let ku = 0; ku < nx; ku++) {
      tmpX = x0 + ku * dx;
      for (let kv = 0; kv < ny; kv++) {
        if (dot > 0) {
          v2d.set(tmpX, y0 + kv * dy);
          dv.set(v2d.x - center2d.x, v2d.y - center2d.y, 0);
          dv.applyEuler(normalEuler);
          v.set(center.x + dv.x, center.y + dv.y, z0 + dv.z);
          if (!inShadow(reflector.id, v, sunDirection) && !inShadow(reflector.id, v, reflectorToReceiver)) {
            sum += dot * peakRadiation;
          }
        }
      }
    }
    const output = dailyOutputsMapRef.current.get(reflector.id);
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

  const getElementFactor = (reflector: FresnelReflectorModel) => {
    const parent = getParent(reflector);
    if (!parent) throw new Error('parent of Fresnel reflector does not exist');
    let systemEfficiency = 1;
    if (parent.type === ObjectType.Foundation) {
      const foundation = parent as FoundationModel;
      const absorberPipe = foundation.solarAbsorberPipe;
      systemEfficiency *=
        (absorberPipe?.absorberOpticalEfficiency ?? 0.7) *
        (absorberPipe?.absorberThermalEfficiency ?? 0.3) *
        (absorberPipe?.absorberAbsorptance ?? 0.95);
    }
    return (
      reflector.lx *
      reflector.ly *
      reflector.reflectance *
      systemEfficiency *
      (1 - monthlyIrradianceLosses[now.getMonth()])
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
});

export default FresnelReflectorSimulation;
