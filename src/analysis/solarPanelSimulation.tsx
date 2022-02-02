/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { calculateDiffuseAndReflectedRadiation, calculatePeakRadiation, getSunDirection } from './sunTools';
import { Euler, Intersection, Object3D, Quaternion, Raycaster, Vector2, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useStore } from '../stores/common';
import * as Selector from 'src/stores/selector';
import { DatumEntry, Discretization, ObjectType, Orientation, ShadeTolerance, TrackerType } from '../types';
import { Util } from '../Util';
import { AirMass } from './analysisConstants';
import { MONTHS, UNIT_VECTOR_POS_X, UNIT_VECTOR_POS_Y, UNIT_VECTOR_POS_Z } from '../constants';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { computeOutsideTemperature, getOutsideTemperatureAtMinute } from './heatTools';
import { PvModel } from '../models/PvModel';
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';

export interface SolarPanelSimulationProps {
  city: string | null;
}

const getPanelEfficiency = (temperature: number, panel: SolarPanelModel, pvModel: PvModel) => {
  let e = pvModel.efficiency;
  if (pvModel.cellType === 'Monocrystalline') {
    e *= 0.95; // assuming that the packing density factor of semi-round cells is 0.95
  }
  return e * (1 + pvModel.pmaxTC * (temperature - 25));
};

const SolarPanelSimulation = ({ city }: SolarPanelSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getPvModule = useStore(Selector.getPvModule);
  const getWeather = useStore(Selector.getWeather);
  const getParent = useStore(Selector.getParent);
  const setPvDailyYield = useStore(Selector.setDailyPvYield);
  const updateSolarPanelDailyYield = useStore(Selector.updateSolarCollectorDailyYieldById);
  const setPvYearlyYield = useStore(Selector.setYearlyPvYield);
  const updateSolarPanelYearlyYield = useStore(Selector.updateSolarCollectorYearlyYieldById);
  const dailyPvFlag = useStore(Selector.dailyPvFlag);
  const yearlyPvFlag = useStore(Selector.yearlyPvFlag);
  const dailyIndividualOutputs = useStore(Selector.dailyPvIndividualOutputs);
  const yearlyIndividualOutputs = useStore(Selector.yearlyPvIndividualOutputs);
  const setSolarPanelLabels = useStore(Selector.setSolarPanelLabels);

  const [currentTemperature, setCurrentTemperature] = useState<number>(20);
  const { scene } = useThree();
  const lang = { lng: language };
  const weather = getWeather(city ?? 'Boston MA, USA');
  const elevation = city ? weather.elevation : 0;
  const interval = 60 / world.timesPerHour;
  const ray = useMemo(() => new Raycaster(), []);
  const now = new Date(world.date);
  const loadedDaily = useRef(false);
  const loadedYearly = useRef(false);
  const inverterEfficiency = 0.95;
  const dustLoss = 0.05;
  const cellSize = world.solarPanelGridCellSize ?? 0.25;
  const objectsRef = useRef<Object3D[]>([]); // reuse array in intersection detection
  const intersectionsRef = useRef<Intersection[]>([]); // reuse array in intersection detection

  useEffect(() => {
    if (loadedDaily.current) {
      // avoid calling on first render
      if (elements && elements.length > 0) {
        getDailyYieldForAllSolarPanels();
        showInfo(i18n.t('message.SimulationCompleted', lang));
      }
    } else {
      loadedDaily.current = true;
    }
    setCommonStore((state) => {
      state.simulationInProgress = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyPvFlag]);

  useEffect(() => {
    if (loadedYearly.current) {
      // avoid calling on first render
      if (elements && elements.length > 0) {
        getYearlyYieldForAllSolarPanels();
        showInfo(i18n.t('message.SimulationCompleted', lang));
      }
    } else {
      loadedYearly.current = true;
    }
    setCommonStore((state) => {
      state.simulationInProgress = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearlyPvFlag]);

  useEffect(() => {
    if (city) {
      const weather = getWeather(city);
      if (weather) {
        const n = new Date(world.date);
        const t = computeOutsideTemperature(n, weather.lowestTemperatures, weather.highestTemperatures);
        const c = getOutsideTemperatureAtMinute(t.high, t.low, Util.minutesIntoDay(n));
        setCurrentTemperature(c);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, world.date]);

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

  const getDailyYieldForAllSolarPanels = () => {
    fetchObjects();
    if (dailyIndividualOutputs) {
      const total = new Array(24).fill(0);
      const map = new Map<string, number[]>();
      let index = 0;
      const labels = [];
      for (const e of elements) {
        if (e.type === ObjectType.SolarPanel) {
          const output = getDailyYield(e as SolarPanelModel);
          updateSolarPanelDailyYield(
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
      setPvDailyYield(data);
      setSolarPanelLabels(labels);
    } else {
      const total = new Array(24).fill(0);
      for (const e of elements) {
        if (e.type === ObjectType.SolarPanel) {
          const output = getDailyYield(e as SolarPanelModel);
          updateSolarPanelDailyYield(
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
      setPvDailyYield(data);
    }
  };

  const getDailyYield = (panel: SolarPanelModel) => {
    const parent = getParent(panel);
    if (!parent) throw new Error('parent of solar panel does not exist');
    const center = Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent);
    const normal = new Vector3().fromArray(panel.normal);
    const originalNormal = normal.clone();
    const zRot = parent.rotation[2] + panel.relativeAzimuth;
    if (Math.abs(panel.tiltAngle) > 0.001 && panel.trackerType === TrackerType.NO_TRACKER) {
      // TODO: right now we assume a parent rotation is always around the z-axis
      normal.applyEuler(new Euler(panel.tiltAngle, 0, zRot, 'ZYX'));
    }
    const result = new Array(24).fill(0);
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    let count = 0;
    let lx, ly, lz, nx: number, ny: number;
    const pvModel = getPvModule(panel.pvModelName);
    if (!pvModel) {
      // return an empty array so that it doesn't crash
      const empty = new Array(24);
      empty.fill(0);
      return empty;
    }
    const cosTilt = Math.cos(panel.tiltAngle);
    const sinTilt = Math.sin(panel.tiltAngle);
    if (world.discretization === Discretization.EXACT) {
      lx = panel.lx;
      ly = panel.ly * cosTilt;
      lz = panel.ly * Math.abs(sinTilt);
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
    } else {
      lx = panel.lx;
      ly = panel.ly * cosTilt;
      lz = panel.ly * Math.abs(sinTilt);
      nx = Math.max(2, Math.round(panel.lx / cellSize));
      ny = Math.max(2, Math.round(panel.ly / cellSize));
      // nx and ny must be even (for circuit simulation)
      if (nx % 2 !== 0) nx += 1;
      if (ny % 2 !== 0) ny += 1;
    }
    const dx = lx / nx;
    const dy = ly / ny;
    const dz = lz / ny;
    // shift half cell size to the center of each grid cell
    const x0 = center.x - (lx - cellSize) / 2;
    const y0 = center.y - (ly - cellSize * cosTilt) / 2;
    const z0 = parent.lz + panel.poleHeight + panel.lz - ((lz - cellSize * sinTilt) / 2) * Math.sign(panel.tiltAngle);
    const center2d = new Vector2(center.x, center.y);
    const v = new Vector3();
    const cellOutputs = Array.from(Array<number>(nx), () => new Array<number>(ny));
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < world.timesPerHour; j++) {
        // a shift of 30 minutes minute half of the interval ensures the symmetry of the result around noon
        const currentTime = new Date(year, month, date, i, (j + 0.5) * interval - 30);
        const sunDirection = getSunDirection(currentTime, world.latitude);
        if (sunDirection.z > 0) {
          // when the sun is out
          if (panel.trackerType !== TrackerType.NO_TRACKER) {
            // dynamic angles
            const rot = parent.rotation[2];
            const rotatedSunDirection = rot
              ? sunDirection.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, -rot)
              : sunDirection.clone();
            const ori = originalNormal.clone();
            switch (panel.trackerType) {
              case TrackerType.ALTAZIMUTH_DUAL_AXIS_TRACKER:
                const qrotAADAT = new Quaternion().setFromUnitVectors(UNIT_VECTOR_POS_Z, rotatedSunDirection);
                normal.copy(ori.applyEuler(new Euler().setFromQuaternion(qrotAADAT)));
                break;
              case TrackerType.HORIZONTAL_SINGLE_AXIS_TRACKER:
                const qrotHSAT = new Quaternion().setFromUnitVectors(
                  UNIT_VECTOR_POS_Z,
                  new Vector3(rotatedSunDirection.x, 0, rotatedSunDirection.z).normalize(),
                );
                normal.copy(ori.applyEuler(new Euler().setFromQuaternion(qrotHSAT)));
                break;
              case TrackerType.VERTICAL_SINGLE_AXIS_TRACKER:
                if (Math.abs(panel.tiltAngle) > 0.001) {
                  const v2d = new Vector3(rotatedSunDirection.x, -rotatedSunDirection.y, 0).normalize();
                  const az = Math.acos(UNIT_VECTOR_POS_Y.dot(v2d)) * Math.sign(v2d.x);
                  ori.applyAxisAngle(UNIT_VECTOR_POS_X, panel.tiltAngle);
                  ori.applyAxisAngle(UNIT_VECTOR_POS_Z, az + rot);
                  normal.copy(ori);
                }
                break;
              case TrackerType.TILTED_SINGLE_AXIS_TRACKER:
                // TODO
                break;
            }
          }
          count++;
          const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
          const indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, month, normal, peakRadiation);
          const dot = normal.dot(sunDirection);
          const v2 = new Vector2();
          const zRotZero = Util.isZero(zRot);
          for (let kx = 0; kx < nx; kx++) {
            for (let ky = 0; ky < ny; ky++) {
              cellOutputs[kx][ky] = indirectRadiation;
              if (dot > 0) {
                v2.set(x0 + kx * dx, y0 + ky * dy);
                if (!zRotZero) v2.rotateAround(center2d, zRot);
                v.set(v2.x, v2.y, z0 + ky * dz);
                if (!inShadow(panel.id, v, sunDirection)) {
                  // direct radiation
                  cellOutputs[kx][ky] += dot * peakRadiation;
                }
              }
            }
          }
          // we must consider cell wiring and distributed efficiency
          // Nice demo at: https://www.youtube.com/watch?v=UNPJapaZlCU
          let sum = 0;
          switch (pvModel.shadeTolerance) {
            case ShadeTolerance.NONE:
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
            case ShadeTolerance.PARTIAL:
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
            default:
              // this probably is too idealized
              for (let kx = 0; kx < nx; kx++) {
                for (let ky = 0; ky < ny; ky++) {
                  sum += cellOutputs[kx][ky];
                }
              }
              break;
          }
          result[i] += sum / (nx * ny);
        }
      }
    }
    // apply clearness and convert the unit of time step from minute to hour so that we get kWh
    const daylight = (count * interval) / 60;
    const clearness = weather.sunshineHours[month] / (30 * daylight);
    const factor =
      panel.lx *
      panel.ly *
      getPanelEfficiency(currentTemperature, panel, pvModel) *
      inverterEfficiency *
      (1 - dustLoss);
    return result.map((x) => (x * factor * clearness) / world.timesPerHour);
  };

  const getYearlyYieldForAllSolarPanels = () => {
    fetchObjects();
    if (yearlyIndividualOutputs) {
      const resultArr = [];
      const labels = [];
      let index = 0;
      for (const e of elements) {
        if (e.type === ObjectType.SolarPanel) {
          const yearlyPvYield = getYearlyPvYield(e as SolarPanelModel);
          updateSolarPanelYearlyYield(
            e.id,
            yearlyPvYield.reduce((a, b) => a + b, 0),
          );
          resultArr.push(yearlyPvYield);
          index++;
          labels.push(e.label ? e.label : 'Panel' + index);
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
      setPvYearlyYield(results);
      setSolarPanelLabels(labels);
    } else {
      const resultArr = [];
      for (const e of elements) {
        if (e.type === ObjectType.SolarPanel) {
          const yearlyPvYield = getYearlyPvYield(e as SolarPanelModel);
          updateSolarPanelYearlyYield(
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
      setPvYearlyYield(results);
    }
  };

  const getYearlyPvYield = (panel: SolarPanelModel) => {
    const data = [];
    const parent = getParent(panel);
    if (!parent) throw new Error('parent of solar panel does not exist');
    const center = Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent);
    const normal = new Vector3().fromArray(panel.normal);
    const originalNormal = normal.clone();
    const zRot = parent.rotation[2] + panel.relativeAzimuth;
    if (Math.abs(panel.tiltAngle) > 0.001 && panel.trackerType === TrackerType.NO_TRACKER) {
      // TODO: right now we assume a parent rotation is always around the z-axis
      normal.applyEuler(new Euler(panel.tiltAngle, 0, zRot, 'ZYX'));
    }
    const year = now.getFullYear();
    const date = 15;
    let lx, ly, lz, nx: number, ny: number;
    const pvModel = getPvModule(panel.pvModelName);
    if (!pvModel) {
      // return an empty array so that it doesn't crash
      const empty = new Array(12);
      empty.fill(0);
      return empty;
    }
    const cosTilt = Math.cos(panel.tiltAngle);
    const sinTilt = Math.sin(panel.tiltAngle);
    if (world.discretization === Discretization.EXACT) {
      lx = panel.lx;
      ly = panel.ly * cosTilt;
      lz = panel.ly * Math.abs(sinTilt);
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
    } else {
      lx = panel.lx;
      ly = panel.ly * cosTilt;
      lz = panel.ly * Math.abs(sinTilt);
      nx = Math.max(2, Math.round(panel.lx / cellSize));
      ny = Math.max(2, Math.round(panel.ly / cellSize));
      // nx and ny must be even (for circuit simulation)
      if (nx % 2 !== 0) nx += 1;
      if (ny % 2 !== 0) ny += 1;
    }
    const dx = lx / nx;
    const dy = ly / ny;
    const dz = lz / ny;
    // shift half cell size to the center of each grid cell
    const x0 = center.x - (lx - cellSize) / 2;
    const y0 = center.y - (ly - cellSize * cosTilt) / 2;
    const z0 = parent.lz + panel.poleHeight + panel.lz - ((lz - cellSize * sinTilt) / 2) * Math.sign(panel.tiltAngle);
    const v = new Vector3();
    const center2d = new Vector2(center.x, center.y);
    const cellOutputs = Array.from(Array<number>(nx), () => new Array<number>(ny));
    for (let month = 0; month < 12; month++) {
      const midMonth = new Date(year, month, date);
      const dayOfYear = Util.dayOfYear(midMonth);
      let dailyYield = 0;
      let count = 0;
      for (let hour = 0; hour < 24; hour++) {
        for (let step = 0; step < world.timesPerHour; step++) {
          const currentTime = new Date(year, month, date, hour, step * interval);
          const sunDirection = getSunDirection(currentTime, world.latitude);
          if (sunDirection.z > 0) {
            // when the sun is out
            if (panel.trackerType !== TrackerType.NO_TRACKER) {
              // dynamic angles
              const rot = parent.rotation[2];
              const rotatedSunDirection = rot
                ? sunDirection.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, -rot)
                : sunDirection.clone();
              const ori = originalNormal.clone();
              switch (panel.trackerType) {
                case TrackerType.ALTAZIMUTH_DUAL_AXIS_TRACKER:
                  const qrotAADAT = new Quaternion().setFromUnitVectors(UNIT_VECTOR_POS_Z, rotatedSunDirection);
                  normal.copy(ori.applyEuler(new Euler().setFromQuaternion(qrotAADAT)));
                  break;
                case TrackerType.HORIZONTAL_SINGLE_AXIS_TRACKER:
                  const qrotHSAT = new Quaternion().setFromUnitVectors(
                    UNIT_VECTOR_POS_Z,
                    new Vector3(rotatedSunDirection.x, 0, rotatedSunDirection.z).normalize(),
                  );
                  normal.copy(ori.applyEuler(new Euler().setFromQuaternion(qrotHSAT)));
                  break;
                case TrackerType.VERTICAL_SINGLE_AXIS_TRACKER:
                  if (Math.abs(panel.tiltAngle) > 0.001) {
                    const v2d = new Vector3(rotatedSunDirection.x, -rotatedSunDirection.y, 0).normalize();
                    const az = Math.acos(UNIT_VECTOR_POS_Y.dot(v2d)) * Math.sign(v2d.x);
                    ori.applyAxisAngle(UNIT_VECTOR_POS_X, panel.tiltAngle);
                    ori.applyAxisAngle(UNIT_VECTOR_POS_Z, az + rot);
                    normal.copy(ori);
                  }
                  break;
                case TrackerType.TILTED_SINGLE_AXIS_TRACKER:
                  // TODO
                  break;
              }
            }
            count++;
            const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
            const indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, month, normal, peakRadiation);
            const v2 = new Vector2();
            const zRotZero = Util.isZero(zRot);
            for (let kx = 0; kx < nx; kx++) {
              for (let ky = 0; ky < ny; ky++) {
                cellOutputs[kx][ky] = indirectRadiation;
                const dot = normal.dot(sunDirection);
                if (dot > 0) {
                  v2.set(x0 + kx * dx, y0 + ky * dy);
                  if (!zRotZero) v2.rotateAround(center2d, zRot);
                  v.set(v2.x, v2.y, z0 + ky * dz);
                  if (!inShadow(panel.id, v, sunDirection)) {
                    // direct radiation
                    cellOutputs[kx][ky] += dot * peakRadiation;
                  }
                }
              }
            }
            // we must consider cell wiring and distributed efficiency
            // Nice demo at: https://www.youtube.com/watch?v=UNPJapaZlCU
            let sum = 0;
            switch (pvModel.shadeTolerance) {
              case ShadeTolerance.NONE:
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
              case ShadeTolerance.PARTIAL:
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
              default:
                // this probably is too idealized
                for (let kx = 0; kx < nx; kx++) {
                  for (let ky = 0; ky < ny; ky++) {
                    sum += cellOutputs[kx][ky];
                  }
                }
                break;
            }
            dailyYield += sum / (nx * ny);
          }
        }
      }
      const daylight = (count * interval) / 60;
      const clearness = weather.sunshineHours[midMonth.getMonth()] / (30 * daylight);
      const factor =
        panel.lx *
        panel.ly *
        getPanelEfficiency(currentTemperature, panel, pvModel) *
        inverterEfficiency *
        (1 - dustLoss);
      dailyYield *= clearness * factor;
      dailyYield /= world.timesPerHour; // convert the unit of timeStep from minute to hour so that we get kWh
      data.push({ Month: MONTHS[month], Yield: dailyYield } as DatumEntry);
    }
    return data;
  };

  return <></>;
};

export default React.memo(SolarPanelSimulation);
