/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { calculateDiffuseAndReflectedRadiation, calculatePeakRadiation, getSunDirection } from './sunTools';
import { Euler, Intersection, Object3D, Quaternion, Raycaster, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useStore } from '../stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, TrackerType } from '../types';
import { Util } from '../Util';
import { AirMass } from './analysisConstants';
import { UNIT_VECTOR_POS_X, UNIT_VECTOR_POS_Y, UNIT_VECTOR_POS_Z } from '../constants';
import { SolarPanelModel } from '../models/SolarPanelModel';

export interface SolarRadiationSimulationProps {
  city: string | null;
}

const SolarRadiationSimulation = ({ city }: SolarRadiationSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getWeather = useStore(Selector.getWeather);
  const getElementById = useStore(Selector.getElementById);
  const dailySolarRadiationSimulationFlag = useStore(Selector.dailySolarRadiationSimulationFlag);
  const setHeatmap = useStore(Selector.setHeatmap);

  const { scene } = useThree();
  const weather = getWeather(city ?? 'Boston MA, USA');
  const elevation = city ? weather.elevation : 0;
  const interval = 60 / world.timesPerHour;
  const ray = useMemo(() => new Raycaster(), []);
  const now = new Date(world.date);
  const loaded = useRef(false);
  const cellSize = world.solarPanelGridCellSize ?? 0.25;
  const objectsRef = useRef<Object3D[]>([]); // reuse array in intersection detection
  const intersectionsRef = useRef<Intersection[]>([]); // reuse array in intersection detection

  useEffect(() => {
    if (loaded.current) {
      // avoid calling on first render
      if (elements && elements.length > 0) {
        generateHeatmaps();
      }
    } else {
      loaded.current = true;
    }
    setCommonStore((state) => {
      state.viewState.showSolarRadiationHeatmap = true;
      state.simulationInProgress = false;
      console.log('simulation ended', state.simulationInProgress);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailySolarRadiationSimulationFlag]);

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

  const generateHeatmaps = () => {
    fetchObjects();
    for (const e of elements) {
      if (e.type === ObjectType.SolarPanel) {
        generateHeatmap(e as SolarPanelModel);
      }
    }
  };

  const generateHeatmap = (panel: SolarPanelModel) => {
    const parent = getElementById(panel.parentId);
    if (!parent) throw new Error('parent of solar panel does not exist');
    const center = Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent);
    const normal = new Vector3().fromArray(panel.normal);
    const originalNormal = normal.clone();
    if (Math.abs(panel.tiltAngle) > 0.001 && panel.trackerType === TrackerType.NO_TRACKER) {
      // TODO: right now we assume a parent rotation is always around the z-axis
      normal.applyEuler(new Euler(panel.tiltAngle, panel.relativeAzimuth + parent.rotation[2], 0, 'XYZ'));
    }
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    const lx = panel.lx;
    const ly = panel.ly * Math.cos(panel.tiltAngle);
    const lz = panel.ly * Math.abs(Math.sin(panel.tiltAngle));
    const nx = Math.max(2, Math.round(panel.lx / cellSize));
    const ny = Math.max(2, Math.round(panel.ly / cellSize));
    const dx = lx / nx;
    const dy = ly / ny;
    const dz = lz / ny;
    const x0 = center.x - lx / 2;
    const y0 = center.y - ly / 2;
    const z0 = panel.poleHeight + center.z - lz / 2;
    const v = new Vector3();
    const cellOutputs = Array.from(Array<number>(nx), () => new Array<number>(ny));
    const cellOutputTotals = Array(nx)
      .fill(0)
      .map(() => Array(ny).fill(0));
    let count = 0;
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < world.timesPerHour; j++) {
        const currentTime = new Date(year, month, date, i, j * interval);
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
          for (let kx = 0; kx < nx; kx++) {
            for (let ky = 0; ky < ny; ky++) {
              cellOutputs[kx][ky] = indirectRadiation;
              cellOutputTotals[kx][ky] += indirectRadiation;
              if (dot > 0) {
                v.set(x0 + kx * dx, y0 + ky * dy, z0 + ky * dz);
                if (!inShadow(panel.id, v, sunDirection)) {
                  // direct radiation
                  cellOutputs[kx][ky] += dot * peakRadiation;
                  cellOutputTotals[kx][ky] += dot * peakRadiation;
                }
              }
            }
          }
        }
      }
    }
    // apply clearness and convert the unit of time step from minute to hour so that we get kWh
    const daylight = (count * interval) / 60;
    const clearness = weather.sunshineHours[month] / (30 * daylight);
    for (let i = 0; i < cellOutputTotals.length; i++) {
      for (let j = 0; j < cellOutputTotals[i].length; j++) {
        cellOutputTotals[i][j] *= clearness;
      }
    }
    // send heat map data to common store for visualization
    setHeatmap(panel.id, cellOutputTotals);
  };

  return <></>;
};

export default React.memo(SolarRadiationSimulation);
