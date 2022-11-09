/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { calculateDiffuseAndReflectedRadiation, calculatePeakRadiation, getSunDirection } from './sunTools';
import { Euler, Intersection, Object3D, Raycaster, Vector2, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useStore } from '../stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, SolarStructure, TrackerType } from '../types';
import { Util } from '../Util';
import { AirMass } from './analysisConstants';
import {
  HALF_PI,
  UNIT_VECTOR_NEG_X,
  UNIT_VECTOR_NEG_Y,
  UNIT_VECTOR_POS_X,
  UNIT_VECTOR_POS_Y,
  UNIT_VECTOR_POS_Z,
  ZERO_TOLERANCE,
} from '../constants';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { FoundationModel } from '../models/FoundationModel';
import { CuboidModel } from '../models/CuboidModel';
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { WallModel } from '../models/WallModel';

export interface StaticSolarRadiationSimulationProps {
  city: string | null;
}

// note that this cannot be used for anything related to CSP as CPS must move to track or reflect the sun
// for the same reason, this cannot be used for PV with trackers.

const StaticSolarRadiationSimulation = ({ city }: StaticSolarRadiationSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getWeather = useStore(Selector.getWeather);
  const getParent = useStore(Selector.getParent);
  const getFoundation = useStore(Selector.getFoundation);
  const setHeatmap = useStore(Selector.setHeatmap);
  const runSimulation = useStore(Selector.runStaticSimulation);

  const { scene } = useThree();
  const lang = { lng: language };
  const weather = getWeather(city ?? 'Boston MA, USA');
  const elevation = city ? weather?.elevation : 0;
  const interval = 60 / world.timesPerHour;
  const ray = useMemo(() => new Raycaster(), []);
  const now = new Date(world.date);
  const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
  const objectsRef = useRef<Object3D[]>([]); // reuse array in intersection detection
  const intersectionsRef = useRef<Intersection[]>([]); // reuse array in intersection detection

  useEffect(() => {
    if (runSimulation) {
      if (elements && elements.length > 0) {
        generateHeatmaps();
        setCommonStore((state) => {
          state.showSolarRadiationHeatmap = true;
          state.simulationInProgress = false;
          state.runStaticSimulation = false;
        });
        showInfo(i18n.t('message.SimulationCompleted', lang));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runSimulation]);

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
        Util.fetchSimulationElements(c, objectsRef.current);
      }
    }
  };

  const generateHeatmaps = () => {
    fetchObjects();
    for (const e of elements) {
      switch (e.type) {
        case ObjectType.Foundation:
          const f = e as FoundationModel;
          generateHeatmapForFoundation(f);
          if (f.solarStructure === SolarStructure.UpdraftTower) {
            generateHeatmapForSolarUpdraftTower(f);
          }
          break;
        case ObjectType.Cuboid:
          generateHeatmapForCuboid(e as CuboidModel);
          break;
        case ObjectType.SolarPanel:
          generateHeatmapForSolarPanel(e as SolarPanelModel);
          break;
        case ObjectType.Wall:
          generateHeatmapForWall(e as WallModel);
          break;
        case ObjectType.Roof:
          // TODO
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
                v2.set(uc + (u + 0.5) * dx, vc + (v + 0.5) * dy);
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
                v2.set(uc + (u + 0.5) * dx, southY);
                v2.rotateAround(center2d, cuboid.rotation[2]);
                vec.set(v2.x, v2.y, vc + (v + 0.5) * dz);
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
                v2.set(uc + (u + 0.5) * dx, northY);
                v2.rotateAround(center2d, cuboid.rotation[2]);
                vec.set(v2.x, v2.y, vc + (nz - (v + 0.5)) * dz);
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
                v2.set(westX, uc + (u + 0.5) * dy);
                v2.rotateAround(center2d, cuboid.rotation[2]);
                vec.set(v2.x, v2.y, vc + (v + 0.5) * dz);
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
                v2.set(eastX, uc + (u + 0.5) * dy);
                v2.rotateAround(center2d, cuboid.rotation[2]);
                vec.set(v2.x, v2.y, vc + (v + 0.5) * dz);
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
    const scaleFactor =
      daylight > ZERO_TOLERANCE ? weather.sunshineHours[month] / (30 * daylight * world.timesPerHour) : 0;
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
                v2.set(x0 + (kx + 0.5) * dx, y0 + (ky + 0.5) * dy);
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
    const scaleFactor =
      daylight > ZERO_TOLERANCE ? weather.sunshineHours[month] / (30 * daylight * world.timesPerHour) : 0;
    applyScaleFactor(cellOutputTotals, scaleFactor);
    // send heat map data to common store for visualization
    setHeatmap(foundation.id, cellOutputTotals);
  };

  const generateHeatmapForSolarUpdraftTower = (foundation: FoundationModel) => {
    const solarUpdraftTower = foundation.solarUpdraftTower;
    if (!solarUpdraftTower) return;
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    const radius = solarUpdraftTower.collectorRadius;
    const max = Math.max(2, Math.round((radius * 2) / cellSize));
    // shift half cell size to the center of each grid cell
    const x0 = foundation.cx - radius + cellSize / 2;
    const y0 = foundation.cy - radius + cellSize / 2;
    const z0 = foundation.lz + solarUpdraftTower.collectorHeight;
    const cellOutputTotals = Array(max)
      .fill(0)
      .map(() => Array(max).fill(0));
    const v = new Vector3(0, 0, z0);
    const rsq = radius * radius;
    let count = 0;
    let dx, dy;
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
          for (let kx = 0; kx < max; kx++) {
            v.x = x0 + (kx + 0.5) * cellSize;
            dx = v.x - foundation.cx;
            for (let ky = 0; ky < max; ky++) {
              v.y = y0 + (ky + 0.5) * cellSize;
              dy = v.y - foundation.cy;
              if (dx * dx + dy * dy > rsq) continue;
              cellOutputTotals[kx][ky] += indirectRadiation;
              if (dot > 0) {
                if (!inShadow(foundation.id + '-sut', v, sunDirection)) {
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
    const scaleFactor =
      daylight > ZERO_TOLERANCE ? weather.sunshineHours[month] / (30 * daylight * world.timesPerHour) : 0;
    applyScaleFactor(cellOutputTotals, scaleFactor);
    // send heat map data to common store for visualization
    setHeatmap(foundation.id + '-sut', cellOutputTotals);
  };

  const generateHeatmapForSolarPanel = (panel: SolarPanelModel) => {
    if (panel.trackerType !== TrackerType.NO_TRACKER) throw new Error('trackers cannot use static simulation');
    let parent = getParent(panel);
    if (!parent) throw new Error('parent of solar panel does not exist');
    let rooftop = panel.parentType === ObjectType.Roof;
    const walltop = panel.parentType === ObjectType.Wall;
    if (rooftop) {
      // x and y coordinates of a rooftop solar panel are relative to the foundation
      parent = getFoundation(parent);
      if (!parent) throw new Error('foundation of solar panel does not exist');
    }
    const center = walltop
      ? Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent, getFoundation(panel), panel.lz)
      : Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent);
    const normal = new Vector3().fromArray(panel.normal);
    const rot = parent.rotation[2];
    let zRot = rot + panel.relativeAzimuth;
    let angle = panel.tiltAngle;
    let flat = true;
    if (rooftop) {
      // z coordinate of a rooftop solar panel is absolute
      center.z = panel.cz + panel.lz / 2 + parent.cz + parent.lz / 2;
      if (Util.isZero(panel.rotation[0])) {
        // on a flat roof, add pole height
        center.z += panel.poleHeight;
      } else {
        // on a no-flat roof, ignore tilt angle and relative azimuth
        angle = panel.rotation[0];
        zRot = rot;
        flat = false;
      }
    }
    if (walltop && !Util.isZero(panel.tiltAngle)) {
      const wall = parent as WallModel;
      const foundation = getFoundation(parent);
      const wallAbsAngle = foundation ? foundation.rotation[2] + wall.relativeAngle : wall.relativeAngle;
      const an = wallAbsAngle - HALF_PI;
      const dr = (panel.ly * Math.abs(Math.sin(panel.tiltAngle))) / 2;
      center.x += dr * Math.cos(an); // panel.ly has been rotated based on the orientation
      center.y += dr * Math.sin(an);
    }
    // TODO: right now we assume a parent rotation is always around the z-axis
    // normal has been set if it is on top of a tilted roof, but has not if it is on top of a foundation or flat roof.
    // so we only need to tilt the normal for a solar panel on a foundation or flat roof
    const normalEuler = new Euler(rooftop && !flat ? 0 : angle, 0, zRot, 'ZYX');
    normal.applyEuler(normalEuler);
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    const lx = panel.lx;
    const ly = panel.ly;
    const nx = Math.max(2, Math.round(panel.lx / cellSize));
    const ny = Math.max(2, Math.round(panel.ly / cellSize));
    const dx = lx / nx;
    const dy = ly / ny;
    // shift half cell size to the center of each grid cell
    const x0 = center.x - (lx - cellSize) / 2;
    const y0 = center.y - (ly - cellSize) / 2;
    const z0 = rooftop || walltop ? center.z : parent.lz + panel.poleHeight + panel.lz;
    const center2d = new Vector2(center.x, center.y);
    const v = new Vector3();
    const cellOutputTotals = Array(nx)
      .fill(0)
      .map(() => Array(ny).fill(0));
    let count = 0;
    // the dot array on a solar panel above a tilted roof has not been tilted or rotated
    // we need to set the normal Euler below for this case
    if (rooftop && !flat) {
      normalEuler.x = panel.rotation[0];
      normalEuler.z = panel.rotation[2] + rot;
    }
    if (walltop) {
      // wall panels use negative tilt angles, opposite to foundation panels, so we use + below.
      normalEuler.x = HALF_PI + panel.tiltAngle;
      normalEuler.z = (parent as WallModel).relativeAngle + rot;
    }
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < world.timesPerHour; j++) {
        const currentTime = new Date(year, month, date, i, j * interval);
        const sunDirection = getSunDirection(currentTime, world.latitude);
        if (sunDirection.z > 0) {
          // when the sun is out
          count++;
          const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
          const indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, month, normal, peakRadiation);
          const dot = normal.dot(sunDirection);
          const v2d = new Vector2();
          const dv = new Vector3();
          for (let kx = 0; kx < nx; kx++) {
            for (let ky = 0; ky < ny; ky++) {
              cellOutputTotals[kx][ky] += indirectRadiation;
              if (dot > 0) {
                v2d.set(x0 + kx * dx, y0 + ky * dy);
                dv.set(v2d.x - center2d.x, v2d.y - center2d.y, 0);
                dv.applyEuler(normalEuler);
                v.set(center.x + dv.x, center.y + dv.y, z0 + dv.z);
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
    const scaleFactor =
      daylight > ZERO_TOLERANCE ? weather.sunshineHours[month] / (30 * daylight * world.timesPerHour) : 0;
    applyScaleFactor(cellOutputTotals, scaleFactor);
    // send heat map data to common store for visualization
    setHeatmap(panel.id, cellOutputTotals);
  };

  const generateHeatmapForWall = (wall: WallModel) => {
    const foundation = getFoundation(wall);
    if (!foundation) throw new Error('foundation of wall not found');
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    const lx = wall.lx; // width
    const lz = wall.lz; // height
    const nx = Math.max(2, Math.round(lx / cellSize));
    const nz = Math.max(2, Math.round(lz / cellSize));
    const dx = lx / nx;
    const dz = lz / nz;
    const absAngle = foundation.rotation[2] + wall.relativeAngle;
    const absPos = Util.wallAbsolutePosition(new Vector3(wall.cx, wall.cy, wall.cz), foundation).setZ(
      wall.lz / 2 + foundation.lz,
    );
    const normal = new Vector3().fromArray([Math.cos(absAngle - HALF_PI), Math.sin(absAngle - HALF_PI), 0]);
    const v = new Vector3();
    const cellOutputTotals = Array(nx)
      .fill(0)
      .map(() => Array(nz).fill(0));
    let count = 0;
    const dxcos = dx * Math.cos(absAngle);
    const dxsin = dx * Math.sin(absAngle);
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < world.timesPerHour; j++) {
        const currentTime = new Date(year, month, date, i, j * interval);
        const sunDirection = getSunDirection(currentTime, world.latitude);
        if (sunDirection.z > 0) {
          // when the sun is out
          count++;
          const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
          const indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, month, normal, peakRadiation);
          const dot = normal.dot(sunDirection);
          for (let kx = 0; kx < nx; kx++) {
            for (let kz = 0; kz < nz; kz++) {
              cellOutputTotals[kx][kz] += indirectRadiation;
              if (dot > 0) {
                v.set(
                  absPos.x + (kx - nx / 2 + 0.5) * dxcos,
                  absPos.y + (kx - nx / 2 + 0.5) * dxsin,
                  absPos.z + (kz - nz / 2 + 0.5) * dz,
                );
                if (!inShadow(wall.id, v, sunDirection)) {
                  // direct radiation
                  cellOutputTotals[kx][kz] += dot * peakRadiation;
                }
              }
            }
          }
        }
      }
    }
    // apply clearness and convert the unit of time step from minute to hour so that we get kWh
    const daylight = (count * interval) / 60;
    const scaleFactor =
      daylight > ZERO_TOLERANCE ? weather.sunshineHours[month] / (30 * daylight * world.timesPerHour) : 0;
    applyScaleFactor(cellOutputTotals, scaleFactor);
    // send heat map data to common store for visualization
    setHeatmap(wall.id, cellOutputTotals);
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

export default React.memo(StaticSolarRadiationSimulation);
