/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { calculatePeakRadiation, getSunDirection } from './sunTools';
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

export interface ParabolicDishSimulationProps {
  city: string | null;
}

const ParabolicDishSimulation = ({ city }: ParabolicDishSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getWeather = useStore(Selector.getWeather);
  const getParent = useStore(Selector.getParent);
  const setDailyYield = useStore(Selector.setDailyParabolicDishYield);
  const updateDailyYield = useStore(Selector.updateSolarCollectorDailyYieldById);
  const setYearlyYield = useStore(Selector.setYearlyParabolicDishYield);
  const updateYearlyYield = useStore(Selector.updateSolarCollectorYearlyYieldById);
  const dailyFlag = useStore(Selector.dailyParabolicDishFlag);
  const yearlyFlag = useStore(Selector.yearlyParabolicDishFlag);
  const dailyIndividualOutputs = useStore(Selector.dailyParabolicDishIndividualOutputs);
  const yearlyIndividualOutputs = useStore(Selector.yearlyParabolicDishIndividualOutputs);
  const setParabolicDishLabels = useStore(Selector.setParabolicDishLabels);

  const { scene } = useThree();
  const lang = { lng: language };
  const weather = getWeather(city ?? 'Boston MA, USA');
  const elevation = city ? weather.elevation : 0;
  const interval = 60 / (world.cspTimesPerHour ?? 4);
  const ray = useMemo(() => new Raycaster(), []);
  const now = new Date(world.date);
  const loadedDaily = useRef(false);
  const loadedYearly = useRef(false);
  const dustLoss = 0.05;
  const cellSize = world.cspGridCellSize ?? 0.5;
  const objectsRef = useRef<Object3D[]>([]); // reuse array in intersection detection
  const intersectionsRef = useRef<Intersection[]>([]); // reuse array in intersection detection

  useEffect(() => {
    if (loadedDaily.current) {
      // avoid calling on first render
      if (elements && elements.length > 0) {
        getDailyYieldForAllParabolicDishes();
        showInfo(i18n.t('message.SimulationCompleted', lang));
      }
    } else {
      loadedDaily.current = true;
    }
    setCommonStore((state) => {
      state.simulationInProgress = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyFlag]);

  useEffect(() => {
    if (loadedYearly.current) {
      // avoid calling on first render
      if (elements && elements.length > 0) {
        getYearlyYieldForAllParabolicDishes();
        showInfo(i18n.t('message.SimulationCompleted', lang));
      }
    } else {
      loadedYearly.current = true;
    }
    setCommonStore((state) => {
      state.simulationInProgress = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearlyFlag]);

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

  const getDailyYieldForAllParabolicDishes = () => {
    fetchObjects();
    if (dailyIndividualOutputs) {
      const total = new Array(24).fill(0);
      const map = new Map<string, number[]>();
      let index = 0;
      const labels = [];
      for (const e of elements) {
        if (e.type === ObjectType.ParabolicDish) {
          const output = getDailyYield(e as ParabolicDishModel);
          updateDailyYield(
            e.id,
            output.reduce((a, b) => a + b, 0),
          );
          index++;
          map.set('Dish' + index, output);
          labels.push(e.label ? e.label : 'Dish' + index);
          for (let i = 0; i < 24; i++) {
            total[i] += output[i];
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
          const output = getDailyYield(e as ParabolicDishModel);
          updateDailyYield(
            e.id,
            output.reduce((a, b) => a + b, 0),
          );
          for (let i = 0; i < 24; i++) {
            total[i] += output[i];
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

  const getDailyYield = (dish: ParabolicDishModel) => {
    const parent = getParent(dish);
    if (!parent) throw new Error('parent of parabolic dish does not exist');
    const center = Util.absoluteCoordinates(dish.cx, dish.cy, dish.cz, parent);
    const normal = new Vector3().fromArray(dish.normal);
    const originalNormal = normal.clone();
    const zRot = parent.rotation[2] + dish.relativeAzimuth;
    const zRotZero = Util.isZero(zRot);
    const result = new Array(24).fill(0);
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    let count = 0;
    const lx = dish.lx;
    const ly = dish.ly;
    let nx = Math.max(2, Math.round(dish.lx / cellSize));
    let ny = Math.max(2, Math.round(dish.ly / cellSize));
    // nx and ny must be even (for circuit simulation)
    if (nx % 2 !== 0) nx += 1;
    if (ny % 2 !== 0) ny += 1;
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
    const cellOutputs = Array(nx)
      .fill(0)
      .map(() => Array(ny).fill(0));
    const rot = parent.rotation[2];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < (world.cspTimesPerHour ?? 4); j++) {
        // a shift of 30 minutes minute half of the interval ensures the symmetry of the result around noon
        const currentTime = new Date(year, month, date, i, (j + 0.5) * interval - 30);
        const sunDirection = getSunDirection(currentTime, world.latitude);
        if (sunDirection.z > 0) {
          // when the sun is out
          const rotatedSunDirection = rot
            ? sunDirection.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, -rot)
            : sunDirection.clone();
          const ori = originalNormal.clone();
          const qRot = new Quaternion().setFromUnitVectors(UNIT_VECTOR_POS_Z, rotatedSunDirection);
          normal.copy(ori.applyEuler(new Euler().setFromQuaternion(qRot)));
          count++;
          const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
          const dot = normal.dot(sunDirection);
          const v2 = new Vector2();
          for (let kx = 0; kx < nx; kx++) {
            for (let ky = 0; ky < ny; ky++) {
              cellOutputs[kx][ky] = 0;
              if (dot > 0) {
                // simplify the simulation by using the aperture surface instead of the parabolic surface
                v2.set(x0 + kx * dx, y0 + ky * dy);
                if (!zRotZero) v2.rotateAround(center2d, zRot);
                v.set(v2.x, v2.y, z0);
                if (!inShadow(dish.id, v, sunDirection)) {
                  // direct radiation
                  cellOutputs[kx][ky] += dot * peakRadiation;
                }
              }
            }
          }
          let sum = 0;
          for (let kx = 0; kx < nx; kx++) {
            for (let ky = 0; ky < ny; ky++) {
              sum += cellOutputs[kx][ky];
            }
          }
          result[i] += sum / (nx * ny);
        }
      }
    }
    // apply clearness and convert the unit of time step from minute to hour so that we get kWh
    const daylight = (count * interval) / 60;
    const clearness = daylight > ZERO_TOLERANCE ? weather.sunshineHours[month] / (30 * daylight) : 0;
    // all the light beams travel the same distance from the reflection point to the focus,
    // irrespective of where they hit the parabolic surface. So there is no additional attenuation
    // difference that needs to be accounted for.
    const factor =
      dish.lx *
      dish.ly *
      dish.opticalEfficiency *
      dish.thermalEfficiency *
      dish.absorptance *
      dish.reflectance *
      (1 - dustLoss);
    return result.map((x) => (x * factor * clearness) / (world.cspTimesPerHour ?? 4));
  };

  const getYearlyYieldForAllParabolicDishes = () => {
    fetchObjects();
    if (yearlyIndividualOutputs) {
      const resultArr = [];
      const labels = [];
      let index = 0;
      for (const e of elements) {
        if (e.type === ObjectType.ParabolicDish) {
          const yearlyPvYield = getYearlyYield(e as ParabolicDishModel);
          updateYearlyYield(
            e.id,
            yearlyPvYield.reduce((a, b) => a + b, 0),
          );
          resultArr.push(yearlyPvYield);
          index++;
          labels.push(e.label ? e.label : 'Dish' + index);
        }
      }
      const results = [];
      for (let month = 0; month < 12; month++) {
        const r: DatumEntry = {};
        r['Month'] = MONTHS[month];
        for (const [i, a] of resultArr.entries()) {
          r[labels[i]] = (a[month].Yield as number) * 30;
        }
        results.push(r);
      }
      setYearlyYield(results);
      setParabolicDishLabels(labels);
    } else {
      const resultArr = [];
      for (const e of elements) {
        if (e.type === ObjectType.ParabolicDish) {
          const yearlyPvYield = getYearlyYield(e as ParabolicDishModel);
          updateYearlyYield(
            e.id,
            yearlyPvYield.reduce((a, b) => a + b, 0),
          );
          resultArr.push(yearlyPvYield);
        }
      }
      const results = [];
      for (let month = 0; month < 12; month++) {
        const r: DatumEntry = {};
        r['Month'] = MONTHS[month];
        let total = 0;
        for (const result of resultArr) {
          total += result[month].Yield as number;
        }
        r['Total'] = total * 30;
        results.push(r);
      }
      setYearlyYield(results);
    }
  };

  const getYearlyYield = (dish: ParabolicDishModel) => {
    const data: any[] = [];
    const parent = getParent(dish);
    if (!parent) throw new Error('parent of parabolic dish does not exist');
    const center = Util.absoluteCoordinates(dish.cx, dish.cy, dish.cz, parent);
    const normal = new Vector3().fromArray(dish.normal);
    const originalNormal = normal.clone();
    const zRot = parent.rotation[2] + dish.relativeAzimuth;
    const zRotZero = Util.isZero(zRot);
    const year = now.getFullYear();
    const date = 15;
    const lx = dish.lx;
    const ly = dish.ly;
    let nx = Math.max(2, Math.round(dish.lx / cellSize));
    let ny = Math.max(2, Math.round(dish.ly / cellSize));
    // nx and ny must be even (for circuit simulation)
    if (nx % 2 !== 0) nx += 1;
    if (ny % 2 !== 0) ny += 1;
    const dx = lx / nx;
    const dy = ly / ny;
    const depth = (lx * lx) / (4 * dish.latusRectum); // the distance from the bottom to the aperture plane
    // const focalLength = 0.25*dish.latusRectum; // equal to the distance from the directrix to the horizontal axis
    const actualPoleHeight = dish.poleHeight + lx / 2;
    // shift half cell size to the center of each grid cell
    const x0 = center.x - (lx - cellSize) / 2;
    const y0 = center.y - (ly - cellSize) / 2;
    const z0 = parent.lz + actualPoleHeight + dish.lz + depth;
    const v = new Vector3();
    const center2d = new Vector2(center.x, center.y);
    const cellOutputs = Array(nx)
      .fill(0)
      .map(() => Array(ny).fill(0));
    const rot = parent.rotation[2];
    for (let month = 0; month < 12; month++) {
      const midMonth = new Date(year, month, date);
      const dayOfYear = Util.dayOfYear(midMonth);
      let dailyYield = 0;
      let count = 0;
      for (let hour = 0; hour < 24; hour++) {
        for (let step = 0; step < (world.cspTimesPerHour ?? 4); step++) {
          const currentTime = new Date(year, month, date, hour, step * interval);
          const sunDirection = getSunDirection(currentTime, world.latitude);
          if (sunDirection.z > 0) {
            // when the sun is out
            const rotatedSunDirection = rot
              ? sunDirection.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, -rot)
              : sunDirection.clone();
            const ori = originalNormal.clone();
            const qRot = new Quaternion().setFromUnitVectors(UNIT_VECTOR_POS_Z, rotatedSunDirection);
            normal.copy(ori.applyEuler(new Euler().setFromQuaternion(qRot)));
            count++;
            const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
            const dot = normal.dot(sunDirection);
            const v2 = new Vector2();
            for (let kx = 0; kx < nx; kx++) {
              for (let ky = 0; ky < ny; ky++) {
                cellOutputs[kx][ky] = 0;
                if (dot > 0) {
                  // simplify the simulation by using the aperture surface instead of the parabolic surface
                  v2.set(x0 + kx * dx, y0 + ky * dy);
                  if (!zRotZero) v2.rotateAround(center2d, zRot);
                  v.set(v2.x, v2.y, z0);
                  if (!inShadow(dish.id, v, sunDirection)) {
                    // direct radiation
                    cellOutputs[kx][ky] += dot * peakRadiation;
                  }
                }
              }
            }
            let sum = 0;
            for (let kx = 0; kx < nx; kx++) {
              for (let ky = 0; ky < ny; ky++) {
                sum += cellOutputs[kx][ky];
              }
            }
            dailyYield += sum / (nx * ny);
          }
        }
      }
      const daylight = (count * interval) / 60;
      const clearness = daylight > ZERO_TOLERANCE ? weather.sunshineHours[midMonth.getMonth()] / (30 * daylight) : 0;
      // all the light beams travel the same distance from the reflection point to the focus,
      // irrespective of where they hit the parabolic surface. So there is no additional attenuation
      // difference that needs to be accounted for.
      const factor =
        dish.lx *
        dish.ly *
        dish.opticalEfficiency *
        dish.thermalEfficiency *
        dish.absorptance *
        dish.reflectance *
        (1 - dustLoss);
      dailyYield *= clearness * factor;
      dailyYield /= world.cspTimesPerHour ?? 4; // convert the unit of timeStep from minute to hour so that we get kWh
      data.push({ Month: MONTHS[month], Yield: dailyYield } as DatumEntry);
    }
    return data;
  };

  return <></>;
};

export default React.memo(ParabolicDishSimulation);
