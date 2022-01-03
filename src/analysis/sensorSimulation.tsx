/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { calculateDiffuseAndReflectedRadiation, calculatePeakRadiation, getSunDirection } from './sunTools';
import { Object3D, Raycaster, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useStore } from '../stores/common';
import { DatumEntry, ObjectType } from '../types';
import { Util } from '../Util';
import { AirMass } from './analysisConstants';
import { MONTHS, UNIT_VECTOR_POS_Z } from '../constants';
import { SensorModel } from '../models/SensorModel';
import * as Selector from '../stores/selector';

export interface SensorSimulationProps {
  city: string | null;
}

const SensorSimulation = ({ city }: SensorSimulationProps) => {
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getElementById = useStore(Selector.getElementById);
  const getWeather = useStore(Selector.getWeather);
  const setSensorLabels = useStore(Selector.setSensorLabels);
  const setDailyLightSensorData = useStore(Selector.setDailyLightSensorData);
  const setYearlyLightSensorData = useStore(Selector.setYearlyLightSensorData);
  const dailyLightSensorFlag = useStore(Selector.dailyLightSensorFlag);
  const yearlyLightSensorFlag = useStore(Selector.yearlyLightSensorFlag);

  const { scene } = useThree();
  const weather = getWeather(city ?? 'Boston MA, USA');
  const elevation = city ? getWeather(city).elevation : 0;
  const interval = 60 / world.timesPerHour;
  const ray = useMemo(() => new Raycaster(), []);
  const now = new Date(world.date);
  const loadedDaily = useRef(false);
  const loadedYearly = useRef(false);

  useEffect(() => {
    if (loadedDaily.current) {
      // avoid calling on first render
      if (elements && elements.length > 0) {
        collectAllDailyLightSensorData();
      }
    } else {
      loadedDaily.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyLightSensorFlag]);

  useEffect(() => {
    if (loadedYearly.current) {
      // avoid calling on first render
      if (elements && elements.length > 0) {
        collectAllYearlyLightSensorData();
      }
    } else {
      loadedYearly.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearlyLightSensorFlag]);

  const inShadow = (content: Object3D[], objects: Object3D[], position: Vector3, sunDirection: Vector3) => {
    // convert the position and direction from physics model to the coordinate system of three.js
    ray.set(position, sunDirection);
    if (content.length > 0) {
      const intersects = ray.intersectObjects(objects);
      return intersects.length > 0;
    }
    return false;
  };

  const fetchSimulationElements = (sensorId: string, obj: Object3D, arr: Object3D[]) => {
    if (obj.userData['simulation'] && obj.uuid !== sensorId) {
      arr.push(obj);
    }
    if (obj.children.length > 0) {
      for (const c of obj.children) {
        fetchSimulationElements(sensorId, c, arr);
      }
    }
  };

  const collectAllDailyLightSensorData = () => {
    const map = new Map<string, number[]>();
    let index = 0;
    const labels = [];
    for (const e of elements) {
      if (e.type === ObjectType.Sensor) {
        index++;
        map.set('Radiation' + index, collectDailyLightSensorData(e as SensorModel));
        labels.push(e.label ? e.label : 'Radiation' + index);
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

  const collectDailyLightSensorData = (sensor: SensorModel) => {
    const parent = getElementById(sensor.parentId);
    if (!parent) throw new Error('parent of sensor does not exist');
    const position = Util.absoluteCoordinates(sensor.cx, sensor.cy, sensor.cz, parent);
    const normal = new Vector3().fromArray(sensor.normal);
    // TODO: right now we assume a parent rotation is always around the z-axis
    normal.applyAxisAngle(UNIT_VECTOR_POS_Z, parent.rotation[2]);
    const result = new Array(24).fill(0);
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    let count = 0;
    const content = scene.children.filter((c) => c.name === 'Content');
    const objects: Object3D[] = [];
    if (content.length > 0) {
      const components = content[0].children;
      for (const c of components) {
        fetchSimulationElements(sensor.id, c, objects);
      }
    }
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < world.timesPerHour; j++) {
        const cur = new Date(year, month, date, i, j * interval);
        const sunDirection = getSunDirection(cur, world.latitude);
        if (sunDirection.z > 0) {
          // when the sun is out
          count++;
          const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
          const dot = normal.dot(sunDirection);
          if (dot > 0) {
            if (!inShadow(content, objects, position, sunDirection)) {
              // direct radiation
              result[i] += dot * peakRadiation;
            }
          }
          // indirect radiation
          result[i] += calculateDiffuseAndReflectedRadiation(world.ground, month, normal, peakRadiation);
        }
      }
    }
    // apply clearness and convert the unit of time step from minute to hour so that we get kWh
    const daylight = (count * interval) / 60;
    const clearness = weather.sunshineHours[month] / (30 * daylight);
    return result.map((x) => (x * clearness) / world.timesPerHour);
  };

  const collectAllYearlyLightSensorData = () => {
    const resultArr = [];
    const labels = [];
    let index = 0;
    for (const e of elements) {
      if (e.type === ObjectType.Sensor) {
        resultArr.push(collectYearlyLightSensorData(e as SensorModel));
        index++;
        labels.push(e.label ? e.label : 'Radiation' + index);
      }
    }
    const results = [];
    for (let month = 0; month < 12; month++) {
      const r: DatumEntry = {};
      r['Month'] = MONTHS[month];
      for (const [i, a] of resultArr.entries()) {
        r['Daylight'] = a[month].Daylight;
        r['Clearness'] = a[month].Clearness;
        r[labels[i]] = a[month].Radiation;
      }
      results.push(r);
    }
    setYearlyLightSensorData(results);
    setSensorLabels(labels);
  };

  const collectYearlyLightSensorData = (sensor: SensorModel) => {
    const data = [];
    const parent = getElementById(sensor.parentId);
    if (!parent) throw new Error('parent of sensor does not exist');
    const position = Util.absoluteCoordinates(sensor.cx, sensor.cy, sensor.cz, parent);
    const normal = new Vector3().fromArray(sensor.normal);
    // TODO: right now we assume a parent rotation is always around the z-axis
    normal.applyAxisAngle(UNIT_VECTOR_POS_Z, parent.rotation[2]);
    const year = now.getFullYear();
    const date = 15;
    for (let month = 0; month < 12; month++) {
      const midMonth = new Date(year, month, date);
      const dayOfYear = Util.dayOfYear(midMonth);
      let total = 0;
      let count = 0;
      const content = scene.children.filter((c) => c.name === 'Content');
      const objects: Object3D[] = [];
      if (content.length > 0) {
        const components = content[0].children;
        for (const c of components) {
          fetchSimulationElements(sensor.id, c, objects);
        }
      }
      for (let hour = 0; hour < 24; hour++) {
        for (let step = 0; step < world.timesPerHour; step++) {
          const cur = new Date(year, month, date, hour, step * interval);
          const sunDirection = getSunDirection(cur, world.latitude);
          if (sunDirection.z > 0) {
            // when the sun is out
            count++;
            const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
            const dot = normal.dot(sunDirection);
            if (dot > 0) {
              if (!inShadow(content, objects, position, sunDirection)) {
                // direct radiation
                total += dot * peakRadiation;
              }
            }
            // indirect radiation
            total += calculateDiffuseAndReflectedRadiation(world.ground, month, normal, peakRadiation);
          }
        }
      }
      const daylight = (count * interval) / 60;
      const clearness = weather.sunshineHours[midMonth.getMonth()] / (30 * daylight);
      total *= clearness; // apply clearness
      total /= world.timesPerHour; // convert the unit of timeStep from minute to hour so that we get kWh
      data.push({
        Month: MONTHS[month],
        Daylight: daylight,
        Clearness: clearness * 100,
        Radiation: total,
      } as DatumEntry);
    }
    return data;
  };

  return <></>;
};

export default React.memo(SensorSimulation);
