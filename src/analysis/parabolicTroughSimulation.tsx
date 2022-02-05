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
import { MONTHS, UNIT_VECTOR_POS_Z } from '../constants';
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { ParabolicTroughModel } from '../models/ParabolicTroughModel';

export interface ParabolicTroughSimulationProps {
  city: string | null;
}

const ParabolicTroughSimulation = ({ city }: ParabolicTroughSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getWeather = useStore(Selector.getWeather);
  const getParent = useStore(Selector.getParent);
  const setDailyYield = useStore(Selector.setDailyParabolicTroughYield);
  const updateDailyYield = useStore(Selector.updateSolarCollectorDailyYieldById);
  const setYearlyYield = useStore(Selector.setYearlyParabolicTroughYield);
  const updateYearlyYield = useStore(Selector.updateSolarCollectorYearlyYieldById);
  const dailyFlag = useStore(Selector.dailyParabolicTroughFlag);
  const yearlyFlag = useStore(Selector.yearlyParabolicTroughFlag);
  const dailyIndividualOutputs = useStore(Selector.dailyParabolicTroughIndividualOutputs);
  const yearlyIndividualOutputs = useStore(Selector.yearlyParabolicTroughIndividualOutputs);
  const setParabolicTroughLabels = useStore(Selector.setParabolicTroughLabels);

  const { scene } = useThree();
  const lang = { lng: language };
  const weather = getWeather(city ?? 'Boston MA, USA');
  const elevation = city ? weather.elevation : 0;
  const interval = 60 / (world.parabolicTroughTimesPerHour ?? 4);
  const ray = useMemo(() => new Raycaster(), []);
  const now = new Date(world.date);
  const loadedDaily = useRef(false);
  const loadedYearly = useRef(false);
  const dustLoss = 0.05;
  const cellSize = world.parabolicTroughGridCellSize ?? 0.5;
  const objectsRef = useRef<Object3D[]>([]); // reuse array in intersection detection
  const intersectionsRef = useRef<Intersection[]>([]); // reuse array in intersection detection

  useEffect(() => {
    if (loadedDaily.current) {
      // avoid calling on first render
      if (elements && elements.length > 0) {
        getDailyYieldForAllParabolicTroughs();
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
        getYearlyYieldForAllParabolicTroughs();
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

  const inShadow = (troughId: string, position: Vector3, sunDirection: Vector3) => {
    if (objectsRef.current.length > 1) {
      intersectionsRef.current.length = 0;
      ray.set(position, sunDirection);
      const objects = objectsRef.current.filter((obj) => obj.uuid !== troughId);
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
        fetchSimulationElements(c, objectsRef.current);
      }
    }
  };

  const fetchSimulationElements = (obj: Object3D, arr: Object3D[]) => {
    if (obj.userData['simulation']) {
      arr.push(obj);
    }
    if (obj.children.length > 0) {
      for (const c of obj.children) {
        fetchSimulationElements(c, arr);
      }
    }
  };

  const getDailyYieldForAllParabolicTroughs = () => {
    fetchObjects();
    if (dailyIndividualOutputs) {
      const total = new Array(24).fill(0);
      const map = new Map<string, number[]>();
      let index = 0;
      const labels = [];
      for (const e of elements) {
        if (e.type === ObjectType.ParabolicTrough) {
          const output = getDailyYield(e as ParabolicTroughModel);
          updateDailyYield(
            e.id,
            output.reduce((a, b) => a + b, 0),
          );
          index++;
          map.set('Trough' + index, output);
          labels.push(e.label ? e.label : 'Trough' + index);
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
          const key = 'Trough' + k;
          datum[labels[k - 1]] = map.get(key)?.[i];
        }
        data.push(datum);
      }
      setDailyYield(data);
      setParabolicTroughLabels(labels);
    } else {
      const total = new Array(24).fill(0);
      for (const e of elements) {
        if (e.type === ObjectType.ParabolicTrough) {
          const output = getDailyYield(e as ParabolicTroughModel);
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

  const getDailyYield = (trough: ParabolicTroughModel) => {
    const parent = getParent(trough);
    if (!parent) throw new Error('parent of parabolic trough does not exist');
    const center = Util.absoluteCoordinates(trough.cx, trough.cy, trough.cz, parent);
    const normal = new Vector3().fromArray(trough.normal);
    const originalNormal = normal.clone();
    const zRot = parent.rotation[2] + trough.relativeAzimuth;
    const zRotZero = Util.isZero(zRot);
    const result = new Array(24).fill(0);
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    let count = 0;
    const lx = trough.lx;
    const ly = trough.ly;
    let nx = Math.max(2, Math.round(trough.lx / cellSize));
    let ny = Math.max(2, Math.round(trough.ly / cellSize));
    // nx and ny must be even (for circuit simulation)
    if (nx % 2 !== 0) nx += 1;
    if (ny % 2 !== 0) ny += 1;
    const dx = lx / nx;
    const dy = ly / ny;
    const depth = (lx * lx) / (4 * trough.latusRectum); // the distance from the bottom to the aperture plane
    const actualPoleHeight = trough.poleHeight + lx / 2;
    // shift half cell size to the center of each grid cell
    const x0 = center.x - (lx - cellSize) / 2;
    const y0 = center.y - (ly - cellSize) / 2;
    const z0 = parent.lz + actualPoleHeight + trough.lz + depth;
    const center2d = new Vector2(center.x, center.y);
    const v = new Vector3();
    const cellOutputs = Array(nx)
      .fill(0)
      .map(() => Array(ny).fill(0));
    const rot = parent.rotation[2];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < (world.parabolicTroughTimesPerHour ?? 4); j++) {
        // a shift of 30 minutes minute half of the interval ensures the symmetry of the result around noon
        const currentTime = new Date(year, month, date, i, (j + 0.5) * interval - 30);
        const sunDirection = getSunDirection(currentTime, world.latitude);
        if (sunDirection.z > 0) {
          // when the sun is out
          const rotatedSunDirection = rot
            ? sunDirection.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, -rot)
            : sunDirection.clone();
          const ori = originalNormal.clone();
          const qRot = new Quaternion().setFromUnitVectors(
            UNIT_VECTOR_POS_Z,
            new Vector3(rotatedSunDirection.x, 0, rotatedSunDirection.z).normalize(),
          );
          normal.copy(ori.applyEuler(new Euler().setFromQuaternion(qRot)));
          count++;
          const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
          const dot = normal.dot(sunDirection);
          const v2 = new Vector2();
          for (let kx = 0; kx < nx; kx++) {
            for (let ky = 0; ky < ny; ky++) {
              cellOutputs[kx][ky] = 0;
              if (dot > 0) {
                // TODO: we have to use the parabolic surface, not the aperture surface
                v2.set(x0 + kx * dx, y0 + ky * dy);
                if (!zRotZero) v2.rotateAround(center2d, zRot);
                v.set(v2.x, v2.y, z0);
                if (!inShadow(trough.id, v, sunDirection)) {
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
    const clearness = weather.sunshineHours[month] / (30 * daylight);
    const factor =
      trough.lx *
      trough.ly *
      trough.opticalEfficiency *
      trough.thermalEfficiency *
      trough.absorptance *
      trough.reflectance *
      (1 - dustLoss);
    return result.map((x) => (x * factor * clearness) / (world.parabolicTroughTimesPerHour ?? 4));
  };

  const getYearlyYieldForAllParabolicTroughs = () => {
    fetchObjects();
    if (yearlyIndividualOutputs) {
      const resultArr = [];
      const labels = [];
      let index = 0;
      for (const e of elements) {
        if (e.type === ObjectType.ParabolicTrough) {
          const yearlyPvYield = getYearlyYield(e as ParabolicTroughModel);
          updateYearlyYield(
            e.id,
            yearlyPvYield.reduce((a, b) => a + b, 0),
          );
          resultArr.push(yearlyPvYield);
          index++;
          labels.push(e.label ? e.label : 'Trough' + index);
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
      setParabolicTroughLabels(labels);
    } else {
      const resultArr = [];
      for (const e of elements) {
        if (e.type === ObjectType.ParabolicTrough) {
          const yearlyPvYield = getYearlyYield(e as ParabolicTroughModel);
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

  const getYearlyYield = (trough: ParabolicTroughModel) => {
    const data: any[] = [];
    const parent = getParent(trough);
    if (!parent) throw new Error('parent of parabolic trough does not exist');
    const center = Util.absoluteCoordinates(trough.cx, trough.cy, trough.cz, parent);
    const normal = new Vector3().fromArray(trough.normal);
    const originalNormal = normal.clone();
    const zRot = parent.rotation[2] + trough.relativeAzimuth;
    const zRotZero = Util.isZero(zRot);
    const year = now.getFullYear();
    const date = 15;
    const lx = trough.lx;
    const ly = trough.ly;
    let nx = Math.max(2, Math.round(trough.lx / cellSize));
    let ny = Math.max(2, Math.round(trough.ly / cellSize));
    // nx and ny must be even (for circuit simulation)
    if (nx % 2 !== 0) nx += 1;
    if (ny % 2 !== 0) ny += 1;
    const dx = lx / nx;
    const dy = ly / ny;
    const depth = (lx * lx) / (4 * trough.latusRectum); // the distance from the bottom to the aperture plane
    const actualPoleHeight = trough.poleHeight + lx / 2;
    // shift half cell size to the center of each grid cell
    const x0 = center.x - (lx - cellSize) / 2;
    const y0 = center.y - (ly - cellSize) / 2;
    const z0 = parent.lz + actualPoleHeight + trough.lz + depth;
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
        for (let step = 0; step < (world.parabolicTroughTimesPerHour ?? 4); step++) {
          const currentTime = new Date(year, month, date, hour, step * interval);
          const sunDirection = getSunDirection(currentTime, world.latitude);
          if (sunDirection.z > 0) {
            // when the sun is out
            const rotatedSunDirection = rot
              ? sunDirection.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, -rot)
              : sunDirection.clone();
            const ori = originalNormal.clone();
            const qRot = new Quaternion().setFromUnitVectors(
              UNIT_VECTOR_POS_Z,
              new Vector3(rotatedSunDirection.x, 0, rotatedSunDirection.z).normalize(),
            );
            normal.copy(ori.applyEuler(new Euler().setFromQuaternion(qRot)));
            count++;
            const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
            const dot = normal.dot(sunDirection);
            const v2 = new Vector2();
            for (let kx = 0; kx < nx; kx++) {
              for (let ky = 0; ky < ny; ky++) {
                cellOutputs[kx][ky] = 0;
                if (dot > 0) {
                  // TODO: we have to use the parabolic surface, not the aperture surface
                  v2.set(x0 + kx * dx, y0 + ky * dy);
                  if (!zRotZero) v2.rotateAround(center2d, zRot);
                  v.set(v2.x, v2.y, z0);
                  if (!inShadow(trough.id, v, sunDirection)) {
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
      const clearness = weather.sunshineHours[midMonth.getMonth()] / (30 * daylight);
      const factor =
        trough.lx *
        trough.ly *
        trough.opticalEfficiency *
        trough.thermalEfficiency *
        trough.absorptance *
        trough.reflectance *
        (1 - dustLoss);
      dailyYield *= clearness * factor;
      dailyYield /= world.parabolicTroughTimesPerHour ?? 4; // convert the unit of timeStep from minute to hour so that we get kWh
      data.push({ Month: MONTHS[month], Yield: dailyYield } as DatumEntry);
    }
    return data;
  };

  return <></>;
};

export default React.memo(ParabolicTroughSimulation);
