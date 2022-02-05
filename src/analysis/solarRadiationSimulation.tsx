/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { calculateDiffuseAndReflectedRadiation, calculatePeakRadiation, getSunDirection } from './sunTools';
import { Euler, Intersection, Object3D, Quaternion, Raycaster, Vector2, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useStore } from '../stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, TrackerType } from '../types';
import { Util } from '../Util';
import { AirMass } from './analysisConstants';
import {
  UNIT_VECTOR_NEG_X,
  UNIT_VECTOR_NEG_Y,
  UNIT_VECTOR_POS_X,
  UNIT_VECTOR_POS_Y,
  UNIT_VECTOR_POS_Z,
} from '../constants';
import { ParabolicTroughModel } from '../models/ParabolicTroughModel';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { FoundationModel } from '../models/FoundationModel';
import { CuboidModel } from '../models/CuboidModel';
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';

export interface SolarRadiationSimulationProps {
  city: string | null;
}

const SolarRadiationSimulation = ({ city }: SolarRadiationSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getWeather = useStore(Selector.getWeather);
  const getParent = useStore(Selector.getParent);
  const dailySolarRadiationSimulationFlag = useStore(Selector.dailySolarRadiationSimulationFlag);
  const setHeatmap = useStore(Selector.setHeatmap);

  const { scene } = useThree();
  const lang = { lng: language };
  const weather = getWeather(city ?? 'Boston MA, USA');
  const elevation = city ? weather.elevation : 0;
  const interval = 60 / world.timesPerHour;
  const ray = useMemo(() => new Raycaster(), []);
  const now = new Date(world.date);
  const loaded = useRef<boolean>(false);
  const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
  const objectsRef = useRef<Object3D[]>([]); // reuse array in intersection detection
  const intersectionsRef = useRef<Intersection[]>([]); // reuse array in intersection detection

  useEffect(() => {
    if (loaded.current) {
      // avoid calling on first render
      if (elements && elements.length > 0) {
        generateHeatmaps();
        setCommonStore((state) => {
          state.showSolarRadiationHeatmap = true;
        });
        showInfo(i18n.t('message.SimulationCompleted', lang));
      }
    } else {
      loaded.current = true;
    }
    setCommonStore((state) => {
      state.simulationInProgress = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailySolarRadiationSimulationFlag]);

  const inShadow = (elementId: string, position: Vector3, sunDirection: Vector3) => {
    if (objectsRef.current.length > 1) {
      intersectionsRef.current.length = 0;
      ray.set(position, sunDirection);
      const objects = objectsRef.current.filter((obj) => obj.uuid !== elementId);
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
      switch (e.type) {
        case ObjectType.Foundation:
          generateHeatmapForFoundation(e as FoundationModel);
          break;
        case ObjectType.Cuboid:
          generateHeatmapForCuboid(e as CuboidModel);
          break;
        case ObjectType.SolarPanel:
          generateHeatmapForSolarPanel(e as SolarPanelModel);
          break;
        case ObjectType.ParabolicTrough:
          generateHeatmapForParabolicTrough(e as ParabolicTroughModel);
          break;
      }
    }
  };

  const generateHeatmapForCuboid = (cuboid: CuboidModel) => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    const lx = cuboid.lx;
    const ly = cuboid.ly;
    const lz = cuboid.lz;
    const nx = Math.max(2, Math.round(lx / cellSize));
    const ny = Math.max(2, Math.round(ly / cellSize));
    const nz = Math.max(2, Math.round(lz / cellSize));
    const dx = lx / nx;
    const dy = ly / ny;
    const dz = lz / nz;
    const topCellOutputTotals = Array(nx)
      .fill(0)
      .map(() => Array(ny).fill(0));
    const southCellOutputTotals = Array(nx)
      .fill(0)
      .map(() => Array(nz).fill(0));
    const northCellOutputTotals = Array(nx)
      .fill(0)
      .map(() => Array(nz).fill(0));
    let westCellOutputTotals = Array(ny)
      .fill(0)
      .map(() => Array(nz).fill(0));
    let eastCellOutputTotals = Array(ny)
      .fill(0)
      .map(() => Array(nz).fill(0));

    const normalTop = UNIT_VECTOR_POS_Z;
    const normalSouth = UNIT_VECTOR_NEG_Y.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, cuboid.rotation[2]);
    const normalNorth = UNIT_VECTOR_POS_Y.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, cuboid.rotation[2]);
    const normalWest = UNIT_VECTOR_NEG_X.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, cuboid.rotation[2]);
    const normalEast = UNIT_VECTOR_POS_X.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, cuboid.rotation[2]);

    const vec = new Vector3();
    let count = 0;
    const center2d = new Vector2(cuboid.cx, cuboid.cy);
    const v2 = new Vector2();
    const southY = cuboid.cy - cuboid.ly / 2;
    const northY = cuboid.cy + cuboid.ly / 2;
    const westX = cuboid.cx - cuboid.lx / 2;
    const eastX = cuboid.cx + cuboid.lx / 2;

    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < world.timesPerHour; j++) {
        const currentTime = new Date(year, month, date, i, j * interval);
        const sunDirection = getSunDirection(currentTime, world.latitude);
        if (sunDirection.z > 0) {
          // when the sun is out
          count++;
          const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);

          // top face
          let indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, month, normalTop, peakRadiation);
          let dot = normalTop.dot(sunDirection);
          let uc = cuboid.cx - lx / 2;
          let vc = cuboid.cy - ly / 2;
          for (let u = 0; u < nx; u++) {
            for (let v = 0; v < ny; v++) {
              topCellOutputTotals[u][v] += indirectRadiation;
              if (dot > 0) {
                v2.set(uc + u * dx, vc + v * dy);
                v2.rotateAround(center2d, cuboid.rotation[2]);
                vec.set(v2.x, v2.y, lz);
                if (!inShadow(cuboid.id, vec, sunDirection)) {
                  // direct radiation
                  topCellOutputTotals[u][v] += dot * peakRadiation;
                }
              }
            }
          }

          // south face
          uc = cuboid.cx - lx / 2;
          vc = cuboid.cz - lz / 2;
          indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, month, normalSouth, peakRadiation);
          dot = normalSouth.dot(sunDirection);
          for (let u = 0; u < nx; u++) {
            for (let v = 0; v < nz; v++) {
              southCellOutputTotals[u][v] += indirectRadiation;
              if (dot > 0) {
                v2.set(uc + u * dx, southY);
                v2.rotateAround(center2d, cuboid.rotation[2]);
                vec.set(v2.x, v2.y, vc + v * dz);
                if (!inShadow(cuboid.id, vec, sunDirection)) {
                  // direct radiation
                  southCellOutputTotals[u][v] += dot * peakRadiation;
                }
              }
            }
          }

          // north face
          indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, month, normalNorth, peakRadiation);
          dot = normalNorth.dot(sunDirection);
          for (let u = 0; u < nx; u++) {
            for (let v = 0; v < nz; v++) {
              northCellOutputTotals[u][v] += indirectRadiation;
              if (dot > 0) {
                v2.set(uc + u * dx, northY);
                v2.rotateAround(center2d, cuboid.rotation[2]);
                vec.set(v2.x, v2.y, vc + (nz - v) * dz);
                if (!inShadow(cuboid.id, vec, sunDirection)) {
                  // direct radiation
                  northCellOutputTotals[u][v] += dot * peakRadiation;
                }
              }
            }
          }

          // west face
          uc = cuboid.cy - ly / 2;
          vc = cuboid.cz - lz / 2;
          indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, month, normalWest, peakRadiation);
          dot = normalWest.dot(sunDirection);
          for (let u = 0; u < ny; u++) {
            for (let v = 0; v < nz; v++) {
              westCellOutputTotals[u][v] += indirectRadiation;
              if (dot > 0) {
                v2.set(westX, uc + u * dy);
                v2.rotateAround(center2d, cuboid.rotation[2]);
                vec.set(v2.x, v2.y, vc + v * dz);
                if (!inShadow(cuboid.id, vec, sunDirection)) {
                  // direct radiation
                  westCellOutputTotals[u][v] += dot * peakRadiation;
                }
              }
            }
          }

          // east face
          indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, month, normalEast, peakRadiation);
          dot = normalEast.dot(sunDirection);
          for (let u = 0; u < ny; u++) {
            for (let v = 0; v < nz; v++) {
              eastCellOutputTotals[u][v] += indirectRadiation;
              if (dot > 0) {
                v2.set(eastX, uc + u * dy);
                v2.rotateAround(center2d, cuboid.rotation[2]);
                vec.set(v2.x, v2.y, vc + v * dz);
                if (!inShadow(cuboid.id, vec, sunDirection)) {
                  // direct radiation
                  eastCellOutputTotals[u][v] += dot * peakRadiation;
                }
              }
            }
          }
        }
      }
    }

    westCellOutputTotals = Util.transpose(westCellOutputTotals);
    eastCellOutputTotals = Util.transpose(eastCellOutputTotals);

    // apply clearness and convert the unit of time step from minute to hour so that we get kWh
    const daylight = (count * interval) / 60;
    const scaleFactor = weather.sunshineHours[month] / (30 * daylight * world.timesPerHour);
    applyScaleFactor(topCellOutputTotals, scaleFactor);
    applyScaleFactor(southCellOutputTotals, scaleFactor);
    applyScaleFactor(northCellOutputTotals, scaleFactor);
    applyScaleFactor(westCellOutputTotals, scaleFactor);
    applyScaleFactor(eastCellOutputTotals, scaleFactor);

    // send heat map data to common store for visualization
    setHeatmap(cuboid.id + '-top', topCellOutputTotals);
    setHeatmap(cuboid.id + '-south', southCellOutputTotals);
    setHeatmap(cuboid.id + '-north', northCellOutputTotals);
    setHeatmap(cuboid.id + '-west', westCellOutputTotals);
    setHeatmap(cuboid.id + '-east', eastCellOutputTotals);
  };

  const generateHeatmapForFoundation = (foundation: FoundationModel) => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    const lx = foundation.lx;
    const ly = foundation.ly;
    const lz = foundation.lz;
    const nx = Math.max(2, Math.round(lx / cellSize));
    const ny = Math.max(2, Math.round(ly / cellSize));
    const dx = lx / nx;
    const dy = ly / ny;
    const x0 = foundation.cx - lx / 2;
    const y0 = foundation.cy - ly / 2;
    const center2d = new Vector2(foundation.cx, foundation.cy);
    const v = new Vector3();
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
          count++;
          const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
          const indirectRadiation = calculateDiffuseAndReflectedRadiation(
            world.ground,
            month,
            UNIT_VECTOR_POS_Z,
            peakRadiation,
          );
          const dot = UNIT_VECTOR_POS_Z.dot(sunDirection);
          const v2 = new Vector2();
          for (let kx = 0; kx < nx; kx++) {
            for (let ky = 0; ky < ny; ky++) {
              cellOutputTotals[kx][ky] += indirectRadiation;
              if (dot > 0) {
                v2.set(x0 + kx * dx, y0 + ky * dy);
                v2.rotateAround(center2d, foundation.rotation[2]);
                v.set(v2.x, v2.y, lz);
                if (!inShadow(foundation.id, v, sunDirection)) {
                  // direct radiation
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
    const scaleFactor = weather.sunshineHours[month] / (30 * daylight * world.timesPerHour);
    applyScaleFactor(cellOutputTotals, scaleFactor);
    // send heat map data to common store for visualization
    setHeatmap(foundation.id, cellOutputTotals);
  };

  const generateHeatmapForSolarPanel = (panel: SolarPanelModel) => {
    const parent = getParent(panel);
    if (!parent) throw new Error('parent of solar panel does not exist');
    const center = Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent);
    const normal = new Vector3().fromArray(panel.normal);
    const originalNormal = normal.clone();
    const rot = parent.rotation[2];
    const zRot = rot + panel.relativeAzimuth;
    const zRotZero = Util.isZero(zRot);
    if (Math.abs(panel.tiltAngle) > 0.001 && panel.trackerType === TrackerType.NO_TRACKER) {
      // TODO: right now we assume a parent rotation is always around the z-axis
      //normal.applyAxisAngle(UNIT_VECTOR_POS_X, panel.tiltAngle).applyAxisAngle(UNIT_VECTOR_POS_Z, zRot);
      normal.applyEuler(new Euler(panel.tiltAngle, 0, zRot, 'ZYX'));
    }
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    const cosTilt = Math.cos(panel.tiltAngle);
    const sinTilt = Math.sin(panel.tiltAngle);
    const lx = panel.lx;
    const ly = panel.ly * cosTilt;
    const lz = panel.ly * Math.abs(sinTilt);
    const nx = Math.max(2, Math.round(panel.lx / cellSize));
    const ny = Math.max(2, Math.round(panel.ly / cellSize));
    const dx = lx / nx;
    const dy = ly / ny;
    const dz = lz / ny;
    // shift half cell size to the center of each grid cell
    const x0 = center.x - (lx - cellSize) / 2;
    const y0 = center.y - (ly - cellSize * cosTilt) / 2;
    const z0 = parent.lz + panel.poleHeight + panel.lz - ((lz - cellSize * sinTilt) / 2) * Math.sign(panel.tiltAngle);
    const center2d = new Vector2(center.x, center.y);
    const v = new Vector3();
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
            const rotatedSunDirection = rot
              ? sunDirection.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, -rot)
              : sunDirection.clone();
            const ori = originalNormal.clone();
            switch (panel.trackerType) {
              case TrackerType.ALTAZIMUTH_DUAL_AXIS_TRACKER:
                const qRotAADAT = new Quaternion().setFromUnitVectors(UNIT_VECTOR_POS_Z, rotatedSunDirection);
                normal.copy(ori.applyEuler(new Euler().setFromQuaternion(qRotAADAT)));
                break;
              case TrackerType.HORIZONTAL_SINGLE_AXIS_TRACKER:
                const qRotHSAT = new Quaternion().setFromUnitVectors(
                  UNIT_VECTOR_POS_Z,
                  new Vector3(rotatedSunDirection.x, 0, rotatedSunDirection.z).normalize(),
                );
                normal.copy(ori.applyEuler(new Euler().setFromQuaternion(qRotHSAT)));
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
          for (let kx = 0; kx < nx; kx++) {
            for (let ky = 0; ky < ny; ky++) {
              cellOutputTotals[kx][ky] += indirectRadiation;
              if (dot > 0) {
                v2.set(x0 + kx * dx, y0 + ky * dy);
                if (!zRotZero) v2.rotateAround(center2d, zRot);
                v.set(v2.x, v2.y, z0 + ky * dz);
                if (!inShadow(panel.id, v, sunDirection)) {
                  // direct radiation
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
    const scaleFactor = weather.sunshineHours[month] / (30 * daylight * world.timesPerHour);
    applyScaleFactor(cellOutputTotals, scaleFactor);
    // send heat map data to common store for visualization
    setHeatmap(panel.id, cellOutputTotals);
  };

  const generateHeatmapForParabolicTrough = (trough: ParabolicTroughModel) => {
    const parent = getParent(trough);
    if (!parent) throw new Error('parent of parabolic trough does not exist');
    const center = Util.absoluteCoordinates(trough.cx, trough.cy, trough.cz, parent);
    const normal = new Vector3().fromArray(trough.normal);
    const originalNormal = normal.clone();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    const lx = trough.lx;
    const ly = trough.ly;
    const depth = (lx * lx) / (4 * trough.latusRectum); // the distance from the bottom to the aperture plane
    const actualPoleHeight = trough.poleHeight + lx / 2;
    const nx = Math.max(2, Math.round(trough.lx / cellSize));
    const ny = Math.max(2, Math.round(trough.ly / cellSize));
    const dx = lx / nx;
    const dy = ly / ny;
    // shift half cell size to the center of each grid cell
    const x0 = center.x - (lx - cellSize) / 2;
    const y0 = center.y - (ly - cellSize) / 2;
    const z0 = parent.lz + actualPoleHeight + trough.lz + depth;
    const center2d = new Vector2(center.x, center.y);
    const v = new Vector3();
    const cellOutputTotals = Array(nx)
      .fill(0)
      .map(() => Array(ny).fill(0));
    let count = 0;
    const rot = parent.rotation[2];
    const zRot = rot + trough.relativeAzimuth;
    const zRotZero = Util.isZero(zRot);
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < world.timesPerHour; j++) {
        const currentTime = new Date(year, month, date, i, j * interval);
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
          const indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, month, normal, peakRadiation);
          const dot = normal.dot(sunDirection);
          const v2 = new Vector2();
          for (let ku = 0; ku < nx; ku++) {
            for (let kv = 0; kv < ny; kv++) {
              cellOutputTotals[ku][kv] += indirectRadiation;
              if (dot > 0) {
                // TODO: we have to use the parabolic surface, not the aperture surface
                v2.set(x0 + ku * dx, y0 + kv * dy);
                if (!zRotZero) v2.rotateAround(center2d, zRot);
                v.set(v2.x, v2.y, z0);
                if (!inShadow(trough.id, v, sunDirection)) {
                  cellOutputTotals[ku][kv] += dot * peakRadiation;
                }
              }
            }
          }
        }
      }
    }
    // apply clearness and convert the unit of time step from minute to hour so that we get kWh
    const daylight = (count * interval) / 60;
    const scaleFactor = weather.sunshineHours[month] / (30 * daylight * world.timesPerHour);
    applyScaleFactor(cellOutputTotals, scaleFactor);
    // send heat map data to common store for visualization
    setHeatmap(trough.id, cellOutputTotals);
  };

  const applyScaleFactor = (output: number[][], scaleFactor: number) => {
    for (let i = 0; i < output.length; i++) {
      for (let j = 0; j < output[i].length; j++) {
        output[i][j] *= scaleFactor;
      }
    }
  };

  return <></>;
};

export default React.memo(SolarRadiationSimulation);
