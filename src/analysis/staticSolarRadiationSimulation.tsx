/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  calculateDiffuseAndReflectedRadiation,
  calculatePeakRadiation,
  getSunDirection,
  ROOFTOP_SOLAR_PANEL_OFFSET,
} from './sunTools';
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
import { RoofModel, RoofType } from '../models/RoofModel';
import { DoorModel, DoorType } from '../models/DoorModel';
import { SolarRadiation } from './SolarRadiation';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';
import { useLanguage, useWeather } from '../hooks';
import { SolarWaterHeaterModel } from 'src/models/SolarWaterHeaterModel';

export interface StaticSolarRadiationSimulationProps {
  city: string | null;
}

// note that this cannot be used for anything related to CSP as CPS must move to track or reflect the sun
// for the same reason, this cannot be used for PV with trackers.

const StaticSolarRadiationSimulation = React.memo(({ city }: StaticSolarRadiationSimulationProps) => {
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getParent = useStore(Selector.getParent);
  const getFoundation = useStore(Selector.getFoundation);
  const setHeatmap = useDataStore(Selector.setHeatmap);
  const clearHeatmaps = useDataStore(Selector.clearHeatmaps);
  const runSimulation = usePrimitiveStore(Selector.runStaticSimulation);
  const getRoofSegmentVertices = useDataStore(Selector.getRoofSegmentVertices);

  const { scene } = useThree();
  const lang = useLanguage();
  const weather = useWeather(city);
  const now = new Date(world.date);

  const elevation = city ? weather?.elevation : 0;
  const interval = 60 / world.timesPerHour;
  const ray = useMemo(() => new Raycaster(), []);
  const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
  const objectsRef = useRef<Object3D[]>([]); // reuse array in intersection detection
  const intersectionsRef = useRef<Intersection[]>([]); // reuse array in intersection detection

  useEffect(() => {
    if (runSimulation) {
      if (elements && elements.length > 0) {
        clearHeatmaps();
        generateHeatmaps();
        usePrimitiveStore.getState().set((state) => {
          state.runStaticSimulation = false;
          state.simulationInProgress = false;
          state.showSolarRadiationHeatmap = true;
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
      // console.log(objectsRef.current)
    }
  };

  const generateHeatmaps = () => {
    fetchObjects();
    for (const e of elements) {
      switch (e.type) {
        case ObjectType.Foundation: {
          const f = e as FoundationModel;
          generateHeatmapForFoundation(f);
          if (f.solarStructure === SolarStructure.UpdraftTower) {
            generateHeatmapForSolarUpdraftTower(f);
          }
          break;
        }
        case ObjectType.Cuboid: {
          generateHeatmapForCuboid(e as CuboidModel);
          break;
        }
        case ObjectType.SolarPanel: {
          generateHeatmapForSolarPanel(e as SolarPanelModel);
          break;
        }
        case ObjectType.SolarWaterHeater: {
          generateHeatmapForSolarWaterHeater(e as SolarWaterHeaterModel);
          break;
        }
        case ObjectType.Wall: {
          generateHeatmapForWall(e as WallModel);
          break;
        }
        case ObjectType.Door: {
          generateHeatmapForDoor(e as DoorModel);
          break;
        }
        case ObjectType.Roof: {
          const roof = e as RoofModel;
          switch (roof.roofType) {
            case RoofType.Pyramid:
              generateHeatmapForPyramidRoof(roof);
              break;
            case RoofType.Gable:
              generateHeatmapForGableRoof(roof);
              break;
            case RoofType.Gambrel:
              generateHeatmapForGambrelRoof(roof);
              break;
            case RoofType.Mansard:
              generateHeatmapForMansardRoof(roof);
              break;
            case RoofType.Hip:
              generateHeatmapForHipRoof(roof);
              break;
          }
          break;
        }
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
    const parent = getParent(cuboid);
    let cx = cuboid.cx;
    let cy = cuboid.cy;
    let cz = cuboid.cz;
    if (parent && parent.type === ObjectType.Cuboid) {
      const worldData = Util.getWorldDataById(cuboid.id);
      cx = worldData.pos.x;
      cy = worldData.pos.y;
      cz = worldData.pos.z;
    }
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
    const center2d = new Vector2(cx, cy);
    const v2 = new Vector2();
    const southY = cy - ly / 2;
    const northY = cy + ly / 2;
    const westX = cx - lx / 2;
    const eastX = cx + lx / 2;

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
          let uc = cx - lx / 2;
          let vc = cy - ly / 2;
          const topZ = cz + lz / 2;
          for (let u = 0; u < nx; u++) {
            for (let v = 0; v < ny; v++) {
              topCellOutputTotals[u][v] += indirectRadiation;
              if (dot > 0) {
                v2.set(uc + (u + 0.5) * dx, vc + (v + 0.5) * dy);
                v2.rotateAround(center2d, cuboid.rotation[2]);
                vec.set(v2.x, v2.y, topZ);
                if (!inShadow(cuboid.id, vec, sunDirection)) {
                  // direct radiation
                  topCellOutputTotals[u][v] += dot * peakRadiation;
                }
              }
            }
          }

          // south face
          uc = cx - lx / 2;
          vc = cz - lz / 2;
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
          uc = cy - ly / 2;
          vc = cz - lz / 2;
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
    const lengthX = foundation.enableSlope ? foundation.lx / Math.cos(foundation.slope ?? 0) : foundation.lx;
    const nx = Math.max(2, Math.round(lengthX / cellSize));
    const ny = Math.max(2, Math.round(ly / cellSize));
    const dx = lx / nx;
    const dy = ly / ny;
    const x0 = foundation.cx - lx / 2;
    const y0 = foundation.cy - ly / 2;
    const center2d = new Vector2(foundation.cx, foundation.cy);
    const normal = new Vector3(0, 0, 1);
    if (foundation.enableSlope && foundation.slope) {
      normal.applyEuler(new Euler(0, -foundation.slope, foundation.rotation[2], 'ZXY'));
    }
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
          const indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, month, normal, peakRadiation);
          const dot = normal.dot(sunDirection);
          const v2 = new Vector2();
          for (let kx = 0; kx < nx; kx++) {
            for (let ky = 0; ky < ny; ky++) {
              cellOutputTotals[kx][ky] += indirectRadiation;
              if (dot > 0) {
                const vx = (kx + 0.5) * dx;
                let vz = lz;
                if (foundation.enableSlope) {
                  vz = lz + Util.getZOnSlope(lx, foundation.slope, -lx / 2 + vx);
                }
                v2.set(x0 + vx, y0 + (ky + 0.5) * dy);
                v2.rotateAround(center2d, foundation.rotation[2]);
                v.set(v2.x, v2.y, vz);
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
    const rooftop = panel.parentType === ObjectType.Roof;
    const walltop = panel.parentType === ObjectType.Wall;
    const slopetop = parent.type === ObjectType.Foundation && (parent as FoundationModel).enableSlope;
    const cubeside = parent.type === ObjectType.Cuboid && !Util.isEqual(panel.normal[2], 1);
    if (rooftop) {
      // x and y coordinates of a rooftop solar panel are relative to the foundation
      parent = getFoundation(parent);
      if (!parent) throw new Error('foundation of solar panel does not exist');
    }
    const center = walltop
      ? Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent, getFoundation(panel), panel.lz)
      : Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent, undefined, undefined, true);
    const normal = new Vector3().fromArray(panel.normal);
    if (walltop) {
      normal.applyEuler(new Euler(0, 0, (parent as WallModel).relativeAngle));
    }
    const rot = parent.type === ObjectType.Cuboid ? Util.getWorldDataById(parent.id).rot : parent.rotation[2];
    let zRot = rot + (walltop || cubeside ? 0 : panel.relativeAzimuth);
    let angle = panel.tiltAngle;
    let flat = true;
    if (rooftop) {
      // z coordinate of a rooftop solar panel is absolute
      center.z = panel.cz + panel.lz + 0.02 + parent.cz;
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
    if (slopetop) {
      const f = parent as FoundationModel;
      center.z = f.lz + Util.getZOnSlope(f.lx, f.slope, panel.cx);
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
    const z0 = rooftop || walltop ? center.z : (slopetop ? center.z : parent.lz) + panel.poleHeight + panel.lz;
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
      const foundation = getParent(panel);
      if (foundation) {
        // wall panels use negative tilt angles, opposite to foundation panels, so we use + below.
        normalEuler.x = HALF_PI + panel.tiltAngle;
        normalEuler.z = (parent as WallModel).relativeAngle + foundation.rotation[2];
      }
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

  const generateHeatmapForSolarWaterHeater = (heater: SolarWaterHeaterModel) => {
    const parent = getParent(heater);
    if (!parent) throw new Error('parent of solar water heater does not exist');
    // x and y coordinates of a rooftop solar panel are relative to the foundation
    const foundation = getFoundation(parent);
    if (!foundation) throw new Error('foundation of solar water heater does not exist');

    // world center, the center of the panel, not only [cx,cy,cz]
    const center = Util.absoluteCoordinates(heater.cx, heater.cy, heater.cz, foundation, undefined, undefined, true);
    const euler = new Euler(); // world rotation euler
    const localCz = (heater.lz - heater.waterTankRadius) / 2;
    const tiltAngle = Math.atan2(heater.lz - heater.waterTankRadius, heater.ly);

    const isFlat = Util.isZero(heater.rotation[0]);
    if (isFlat) {
      euler.set(tiltAngle, 0, heater.relativeAzimuth + foundation.rotation[2], 'ZXY');
      center.z += localCz;
    } else {
      euler.set(heater.rotation[0] + tiltAngle, 0, heater.rotation[2] + foundation.rotation[2], 'ZXY');
      center.add(new Vector3(0, 0, localCz).applyEuler(euler));
    }

    const normal = new Vector3(0, 0, 1).applyEuler(euler);

    // TODO: right now we assume a parent rotation is always around the z-axis
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    const lx = heater.lx;
    const ly = Math.hypot(heater.ly, heater.lz - heater.waterTankRadius);
    const nx = Math.max(2, Math.round(heater.lx / cellSize));
    const ny = Math.max(2, Math.round(heater.ly / cellSize));
    const dx = lx / nx;
    const dy = ly / ny;
    const x0 = -(lx - cellSize) / 2;
    const y0 = -(ly - cellSize) / 2;
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
          const indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, month, normal, peakRadiation);
          const dot = normal.dot(sunDirection);
          const v2d = new Vector2();
          const pos = new Vector3();
          for (let kx = 0; kx < nx; kx++) {
            for (let ky = 0; ky < ny; ky++) {
              cellOutputTotals[kx][ky] += indirectRadiation;
              if (dot > 0) {
                v2d.set(x0 + kx * dx, y0 + ky * dy);
                pos.set(v2d.x, v2d.y, 0).applyEuler(euler).add(center);
                if (!inShadow(heater.id, pos, sunDirection)) {
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
    setHeatmap(heater.id, cellOutputTotals);
  };

  const generateHeatmapForWall = (wall: WallModel) => {
    const foundation = getFoundation(wall);
    if (!foundation) throw new Error('foundation of wall not found');
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    const lx = wall.lx; // width
    const lz = Util.getHighestPointOfWall(wall); // height
    const nx = Math.max(2, Math.round(lx / cellSize));
    const nz = Math.max(2, Math.round(lz / cellSize));
    const dx = lx / nx;
    const dz = lz / nz;
    const absAngle = foundation.rotation[2] + wall.relativeAngle;
    const absPos = Util.wallAbsolutePosition(new Vector3(wall.cx, wall.cy, lz / 2), foundation).setZ(
      lz / 2 + foundation.lz,
    );
    const normal = new Vector3(Math.cos(absAngle - HALF_PI), Math.sin(absAngle - HALF_PI), 0);
    const v = new Vector3();
    const cellOutputTotals = Array(nx)
      .fill(0)
      .map(() => Array(nz).fill(0));
    let count = 0;
    const dxcos = dx * Math.cos(absAngle);
    const dxsin = dx * Math.sin(absAngle);
    const polygon = Util.getWallVertices(wall, 2);
    const halfDif = (lz - wall.lz) / 2;
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
              const kx2 = kx - nx / 2 + 0.5;
              const kz2 = kz - nz / 2 + 0.5;
              if (Util.isPointInside(kx2 * dx, kz2 * dz + halfDif, polygon)) {
                cellOutputTotals[kx][kz] += indirectRadiation;
                if (dot > 0) {
                  v.set(absPos.x + kx2 * dxcos, absPos.y + kx2 * dxsin, absPos.z + kz2 * dz);
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
    }
    // apply clearness and convert the unit of time step from minute to hour so that we get kWh
    const daylight = (count * interval) / 60;
    const scaleFactor =
      daylight > ZERO_TOLERANCE ? weather.sunshineHours[month] / (30 * daylight * world.timesPerHour) : 0;
    applyScaleFactor(cellOutputTotals, scaleFactor);
    // send heat map data to common store for visualization
    setHeatmap(wall.id, cellOutputTotals);
  };

  const generateHeatmapForDoor = (door: DoorModel) => {
    const foundation = getFoundation(door);
    if (!foundation) throw new Error('foundation of door not found');
    const parent = getParent(door);
    if (!parent) throw new Error('parent of door not found');
    const wall = parent as WallModel;
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    const lx = door.lx * wall.lx; // width
    const lz = door.lz * wall.lz; // height
    const nx = Math.max(2, Math.round(lx / cellSize));
    const nz = Math.max(2, Math.round(lz / cellSize));
    const dx = lx / nx;
    const dz = lz / nz;
    const absAngle = foundation.rotation[2] + wall.relativeAngle;
    const absWallPos = Util.wallAbsolutePosition(new Vector3(wall.cx, wall.cy, wall.cz), foundation).setZ(
      wall.lz / 2 + foundation.lz,
    );
    const absPos = absWallPos.clone().add(new Vector3(door.cx * wall.lx, 0, door.cz * wall.lz));
    const normal = new Vector3(Math.cos(absAngle - HALF_PI), Math.sin(absAngle - HALF_PI), 0);
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
          if (door.doorType === DoorType.Arched) {
            for (let kx = 0; kx < nx; kx++) {
              for (let kz = 0; kz < nz; kz++) {
                const kx2 = kx - nx / 2 + 0.5;
                const kz2 = kz - nz / 2 + 0.5;
                v.set(absPos.x + kx2 * dxcos, absPos.y + kx2 * dxsin, absPos.z + kz2 * dz);
                if (SolarRadiation.pointWithinArch(v, lx, lz, door.archHeight, absPos)) {
                  cellOutputTotals[kx][kz] += indirectRadiation;
                  if (dot > 0) {
                    if (!inShadow(door.id, v, sunDirection)) {
                      // direct radiation
                      cellOutputTotals[kx][kz] += dot * peakRadiation;
                    }
                  }
                }
              }
            }
          } else {
            for (let kx = 0; kx < nx; kx++) {
              for (let kz = 0; kz < nz; kz++) {
                const kx2 = kx - nx / 2 + 0.5;
                const kz2 = kz - nz / 2 + 0.5;
                cellOutputTotals[kx][kz] += indirectRadiation;
                if (dot > 0) {
                  v.set(absPos.x + kx2 * dxcos, absPos.y + kx2 * dxsin, absPos.z + kz2 * dz);
                  if (!inShadow(door.id, v, sunDirection)) {
                    // direct radiation
                    cellOutputTotals[kx][kz] += dot * peakRadiation;
                  }
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
    setHeatmap(door.id, cellOutputTotals);
  };

  const generateHeatmapForPyramidRoof = (roof: RoofModel) => {
    if (roof.roofType !== RoofType.Pyramid) throw new Error('roof is not pyramid');
    const foundation = getFoundation(roof);
    if (!foundation) throw new Error('foundation of wall not found');
    const segments = getRoofSegmentVertices(roof.id);
    if (!segments || segments.length === 0) return;
    // check if the roof is flat or not
    let flat = true;
    const h0 = segments[0][0].z;
    for (const s of segments) {
      for (const v of s) {
        if (Math.abs(v.z - h0) > 0.01) {
          flat = false;
          break;
        }
      }
    }
    if (flat) {
      generateHeatmapForFlatRoof(roof, foundation, segments);
    } else {
      const year = now.getFullYear();
      const month = now.getMonth();
      const date = now.getDate();
      const dayOfYear = Util.dayOfYear(now);
      const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
      for (const [index, s] of segments.entries()) {
        const uuid = roof.id + '-' + index;
        const s0 = s[0].clone().applyEuler(euler);
        const s1 = s[1].clone().applyEuler(euler);
        const s2 = s[2].clone().applyEuler(euler);
        const v10 = new Vector3().subVectors(s1, s0);
        const v20 = new Vector3().subVectors(s2, s0);
        const v21 = new Vector3().subVectors(s2, s1);
        const length10 = v10.length();
        // find the distance from top to the edge: https://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
        const distance = new Vector3().crossVectors(v20, v21).length() / length10;
        const m = Math.max(2, Math.round(length10 / cellSize));
        const n = Math.max(2, Math.round(distance / cellSize));
        const cellOutputTotals = Array(m)
          .fill(0)
          .map(() => Array(n).fill(0));
        v10.normalize();
        v20.normalize();
        v21.normalize();
        // find the normal vector of the plane (must normalize the cross product as it is not normalized!)
        const normal = new Vector3().crossVectors(v20, v21).normalize();
        // find the incremental vector going along the bottom edge (half-length)
        const dm = v10.multiplyScalar((0.5 * length10) / m);
        // find the incremental vector going from bottom to top (half-length)
        const dn = new Vector3()
          .crossVectors(normal, v10)
          .normalize()
          .multiplyScalar((0.5 * distance) / n);
        // find the starting point of the grid (shift half of length in both directions)
        const v0 = new Vector3(
          foundation.cx + s0.x,
          foundation.cy + s0.y,
          foundation.lz + s0.z + ROOFTOP_SOLAR_PANEL_OFFSET,
        );
        v0.add(dm).add(dn);
        // double half-length to full-length for the increment vectors in both directions
        dm.multiplyScalar(2);
        dn.multiplyScalar(2);
        let count = 0;
        const v = new Vector3();
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
                normal,
                peakRadiation,
              );
              const dot = normal.dot(sunDirection);
              for (let p = 0; p < m; p++) {
                const dmp = dm.clone().multiplyScalar(p);
                for (let q = 0; q < n; q++) {
                  cellOutputTotals[p][q] += indirectRadiation;
                  if (dot > 0) {
                    v.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
                    if (!inShadow(uuid, v, sunDirection)) {
                      // direct radiation
                      cellOutputTotals[p][q] += dot * peakRadiation;
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
        setHeatmap(uuid, cellOutputTotals);
      }
    }
  };

  const generateHeatmapForMansardRoof = (roof: RoofModel) => {
    if (roof.roofType !== RoofType.Mansard) throw new Error('roof is not mansard');
    const foundation = getFoundation(roof);
    if (!foundation) throw new Error('foundation of wall not found');
    const segments = getRoofSegmentVertices(roof.id);
    if (!segments || segments.length === 0) return;
    // check if the roof is flat or not
    let flat = true;
    const h0 = segments[0][0].z;
    for (const s of segments) {
      for (const v of s) {
        if (Math.abs(v.z - h0) > 0.01) {
          flat = false;
          break;
        }
      }
    }
    if (flat) {
      generateHeatmapForFlatRoof(roof, foundation, segments);
    } else {
      const year = now.getFullYear();
      const month = now.getMonth();
      const date = now.getDate();
      const dayOfYear = Util.dayOfYear(now);
      const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
      for (const [index, s] of segments.entries()) {
        const uuid = roof.id + '-' + index;
        if (index === segments.length - 1) {
          // top surface
          // obtain the bounding rectangle
          let minX = Number.MAX_VALUE;
          let minY = Number.MAX_VALUE;
          let maxX = -Number.MAX_VALUE;
          let maxY = -Number.MAX_VALUE;
          for (const v of s) {
            const v2 = v.clone().applyEuler(euler);
            if (v2.x > maxX) maxX = v2.x;
            if (v2.x < minX) minX = v2.x;
            if (v2.y > maxY) maxY = v2.y;
            if (v2.y < minY) minY = v2.y;
          }
          minX += foundation.cx;
          minY += foundation.cy;
          maxX += foundation.cx;
          maxY += foundation.cy;
          const h0 = s[0].z;
          const nx = Math.max(2, Math.round((maxX - minX) / cellSize));
          const ny = Math.max(2, Math.round((maxY - minY) / cellSize));
          const dx = (maxX - minX) / nx;
          const dy = (maxY - minY) / ny;
          const cellOutputTotals = Array(nx)
            .fill(0)
            .map(() => Array(ny).fill(0));
          const v0 = new Vector3(
            minX + cellSize / 2,
            minY + cellSize / 2,
            foundation.lz + h0 + ROOFTOP_SOLAR_PANEL_OFFSET,
          );
          let count = 0;
          const v = new Vector3(0, 0, v0.z);
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
                for (let p = 0; p < nx; p++) {
                  v.x = v0.x + p * dx;
                  for (let q = 0; q < ny; q++) {
                    cellOutputTotals[p][q] += indirectRadiation;
                    if (dot > 0) {
                      v.y = v0.y + q * dy;
                      if (!inShadow(uuid, v, sunDirection)) {
                        // direct radiation
                        cellOutputTotals[p][q] += dot * peakRadiation;
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
          setHeatmap(uuid, cellOutputTotals);
        } else {
          // side surfaces
          const s0 = s[0].clone().applyEuler(euler);
          const s1 = s[1].clone().applyEuler(euler);
          const s2 = s[2].clone().applyEuler(euler);
          const v10 = new Vector3().subVectors(s1, s0);
          const v20 = new Vector3().subVectors(s2, s0);
          const v21 = new Vector3().subVectors(s2, s1);
          const length10 = v10.length();
          // find the distance from top to the edge: https://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
          const distance = new Vector3().crossVectors(v20, v21).length() / length10;
          const m = Math.max(2, Math.round(length10 / cellSize));
          const n = Math.max(2, Math.round(distance / cellSize));
          const cellOutputTotals = Array(m)
            .fill(0)
            .map(() => Array(n).fill(0));
          v10.normalize();
          v20.normalize();
          v21.normalize();
          // find the normal vector of the quad
          const normal = new Vector3().crossVectors(v20, v21).normalize();
          // find the incremental vector going along the bottom edge (half of length)
          const dm = v10.multiplyScalar((0.5 * length10) / m);
          // find the incremental vector going from bottom to top (half of length)
          const dn = new Vector3()
            .crossVectors(normal, v10)
            .normalize()
            .multiplyScalar((0.5 * distance) / n);
          // find the starting point of the grid (shift half of length in both directions)
          const v0 = new Vector3(
            foundation.cx + s0.x,
            foundation.cy + s0.y,
            foundation.lz + s0.z + ROOFTOP_SOLAR_PANEL_OFFSET,
          );
          v0.add(dm).add(dn);
          // double half-length to full-length for the increment vectors in both directions
          dm.multiplyScalar(2);
          dn.multiplyScalar(2);
          let count = 0;
          const v = new Vector3();
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
                  normal,
                  peakRadiation,
                );
                const dot = normal.dot(sunDirection);
                for (let p = 0; p < m; p++) {
                  const dmp = dm.clone().multiplyScalar(p);
                  for (let q = 0; q < n; q++) {
                    cellOutputTotals[p][q] += indirectRadiation;
                    if (dot > 0) {
                      v.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
                      if (!inShadow(uuid, v, sunDirection)) {
                        // direct radiation
                        cellOutputTotals[p][q] += dot * peakRadiation;
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
          setHeatmap(uuid, cellOutputTotals);
        }
      }
    }
  };

  const generateHeatmapForGambrelRoof = (roof: RoofModel) => {
    if (roof.roofType !== RoofType.Gambrel) throw new Error('roof is not gambrel');
    const foundation = getFoundation(roof);
    if (!foundation) throw new Error('foundation of wall not found');
    const segments = getRoofSegmentVertices(roof.id);
    if (!segments || segments.length === 0) return;
    // check if the roof is flat or not
    let flat = true;
    const h0 = segments[0][0].z;
    for (const s of segments) {
      for (const v of s) {
        if (Math.abs(v.z - h0) > 0.01) {
          flat = false;
          break;
        }
      }
    }
    if (flat) {
      generateHeatmapForFlatRoof(roof, foundation, segments);
    } else {
      const year = now.getFullYear();
      const month = now.getMonth();
      const date = now.getDate();
      const dayOfYear = Util.dayOfYear(now);
      const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
      for (const [index, s] of segments.entries()) {
        const uuid = roof.id + '-' + index;
        const s0 = s[0].clone().applyEuler(euler);
        const s1 = s[1].clone().applyEuler(euler);
        const s2 = s[2].clone().applyEuler(euler);
        const v10 = new Vector3().subVectors(s1, s0);
        const v20 = new Vector3().subVectors(s2, s0);
        const v21 = new Vector3().subVectors(s2, s1);
        const length10 = v10.length();
        // find the distance from top to the edge: https://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
        const distance = new Vector3().crossVectors(v20, v21).length() / length10;
        const m = Math.max(2, Math.round(length10 / cellSize));
        const n = Math.max(2, Math.round(distance / cellSize));
        const cellOutputTotals = Array(m)
          .fill(0)
          .map(() => Array(n).fill(0));
        v10.normalize();
        v20.normalize();
        v21.normalize();
        // find the normal vector of the quad
        const normal = new Vector3().crossVectors(v20, v21).normalize();
        // find the incremental vector going along the bottom edge (half of length)
        const dm = v10.multiplyScalar((0.5 * length10) / m);
        // find the incremental vector going from bottom to top (half of length)
        const dn = new Vector3()
          .crossVectors(normal, v10)
          .normalize()
          .multiplyScalar((0.5 * distance) / n);
        // find the starting point of the grid (shift half of length in both directions)
        const v0 = new Vector3(
          foundation.cx + s0.x,
          foundation.cy + s0.y,
          foundation.lz + s0.z + ROOFTOP_SOLAR_PANEL_OFFSET,
        );
        v0.add(dm).add(dn);
        // double half-length to full-length for the increment vectors in both directions
        dm.multiplyScalar(2);
        dn.multiplyScalar(2);
        let count = 0;
        const v = new Vector3();
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
                normal,
                peakRadiation,
              );
              const dot = normal.dot(sunDirection);
              for (let p = 0; p < m; p++) {
                const dmp = dm.clone().multiplyScalar(p);
                for (let q = 0; q < n; q++) {
                  cellOutputTotals[p][q] += indirectRadiation;
                  if (dot > 0) {
                    v.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
                    if (!inShadow(uuid, v, sunDirection)) {
                      // direct radiation
                      cellOutputTotals[p][q] += dot * peakRadiation;
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
        setHeatmap(uuid, cellOutputTotals);
      }
    }
  };

  const generateHeatmapForHipRoof = (roof: RoofModel) => {
    if (roof.roofType !== RoofType.Hip) throw new Error('roof is not hip');
    const foundation = getFoundation(roof);
    if (!foundation) throw new Error('foundation of wall not found');
    const segments = getRoofSegmentVertices(roof.id);
    if (!segments || segments.length === 0) return;
    // check if the roof is flat or not
    let flat = true;
    const h0 = segments[0][0].z;
    for (const s of segments) {
      for (const v of s) {
        if (Math.abs(v.z - h0) > 0.01) {
          flat = false;
          break;
        }
      }
    }
    if (flat) {
      generateHeatmapForFlatRoof(roof, foundation, segments);
    } else {
      const year = now.getFullYear();
      const month = now.getMonth();
      const date = now.getDate();
      const dayOfYear = Util.dayOfYear(now);
      const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
      for (const [index, s] of segments.entries()) {
        const uuid = roof.id + '-' + index;
        const s0 = s[0].clone().applyEuler(euler);
        const s1 = s[1].clone().applyEuler(euler);
        const s2 = s[2].clone().applyEuler(euler);
        const v10 = new Vector3().subVectors(s1, s0);
        const v20 = new Vector3().subVectors(s2, s0);
        const v21 = new Vector3().subVectors(s2, s1);
        const length10 = v10.length();
        // find the distance from top to the edge: https://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
        const distance = new Vector3().crossVectors(v20, v21).length() / length10;
        const m = Math.max(2, Math.round(length10 / cellSize));
        const n = Math.max(2, Math.round(distance / cellSize));
        const cellOutputTotals = Array(m)
          .fill(0)
          .map(() => Array(n).fill(0));
        v10.normalize();
        v20.normalize();
        v21.normalize();
        // find the normal vector of the quad
        // (must normalize the cross product of two normalized vectors as it is not automatically normalized)
        const normal = new Vector3().crossVectors(v20, v21).normalize();
        // find the incremental vector going along the bottom edge (half-length)
        const dm = v10.multiplyScalar((0.5 * length10) / m);
        // find the incremental vector going from bottom to top (half-length)
        const dn = new Vector3()
          .crossVectors(normal, v10)
          .normalize()
          .multiplyScalar((0.5 * distance) / n);
        let count = 0;
        const v = new Vector3();
        // find the starting point of the grid (shift half of length in both directions)
        const v0 = new Vector3(
          foundation.cx + s0.x,
          foundation.cy + s0.y,
          foundation.lz + s0.z + ROOFTOP_SOLAR_PANEL_OFFSET,
        );
        v0.add(dm).add(dn);
        // double half-length to full-length for the increment vectors in both directions
        dm.multiplyScalar(2);
        dn.multiplyScalar(2);
        if (index % 2 === 0) {
          // even number (0, 2) are quads, odd number (1, 3) are triangles
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
                  normal,
                  peakRadiation,
                );
                const dot = normal.dot(sunDirection);
                for (let p = 0; p < m; p++) {
                  const dmp = dm.clone().multiplyScalar(p);
                  for (let q = 0; q < n; q++) {
                    cellOutputTotals[p][q] += indirectRadiation;
                    if (dot > 0) {
                      v.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
                      if (!inShadow(uuid, v, sunDirection)) {
                        // direct radiation
                        cellOutputTotals[p][q] += dot * peakRadiation;
                      }
                    }
                  }
                }
              }
            }
          }
        } else {
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
                  normal,
                  peakRadiation,
                );
                const dot = normal.dot(sunDirection);
                for (let p = 0; p < m; p++) {
                  const dmp = dm.clone().multiplyScalar(p);
                  for (let q = 0; q < n; q++) {
                    cellOutputTotals[p][q] += indirectRadiation;
                    if (dot > 0) {
                      v.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
                      if (!inShadow(uuid, v, sunDirection)) {
                        // direct radiation
                        cellOutputTotals[p][q] += dot * peakRadiation;
                      }
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
        setHeatmap(uuid, cellOutputTotals);
      }
    }
  };

  const generateHeatmapForFlatRoof = (roof: RoofModel, foundation: FoundationModel, segments: Vector3[][]) => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
    const h0 = segments[0][0].z;
    // obtain the bounding rectangle
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = -Number.MAX_VALUE;
    let maxY = -Number.MAX_VALUE;
    for (const s of segments) {
      for (const v of s) {
        const v2 = v.clone().applyEuler(euler);
        if (v2.x > maxX) maxX = v2.x;
        if (v2.x < minX) minX = v2.x;
        if (v2.y > maxY) maxY = v2.y;
        if (v2.y < minY) minY = v2.y;
      }
    }
    minX += foundation.cx;
    minY += foundation.cy;
    maxX += foundation.cx;
    maxY += foundation.cy;
    const nx = Math.max(2, Math.round((maxX - minX) / cellSize));
    const ny = Math.max(2, Math.round((maxY - minY) / cellSize));
    const dx = (maxX - minX) / nx;
    const dy = (maxY - minY) / ny;
    const cellOutputTotals = Array(nx)
      .fill(0)
      .map(() => Array(ny).fill(0));
    const v0 = new Vector3(minX + cellSize / 2, minY + cellSize / 2, foundation.lz + h0 + ROOFTOP_SOLAR_PANEL_OFFSET);
    let count = 0;
    const v = new Vector3(0, 0, v0.z);
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
          for (let p = 0; p < nx; p++) {
            v.x = v0.x + p * dx;
            for (let q = 0; q < ny; q++) {
              cellOutputTotals[p][q] += indirectRadiation;
              if (dot > 0) {
                v.y = v0.y + q * dy;
                if (!inShadow(roof.id, v, sunDirection)) {
                  // direct radiation
                  cellOutputTotals[p][q] += dot * peakRadiation;
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
    setHeatmap(roof.id, cellOutputTotals);
  };

  // gable roofs are treated as a special case
  const generateHeatmapForGableRoof = (roof: RoofModel) => {
    if (roof.roofType !== RoofType.Gable) throw new Error('roof is not gable');
    const foundation = getFoundation(roof);
    if (!foundation) throw new Error('foundation of wall not found');
    const segments = getRoofSegmentVertices(roof.id);
    if (!segments || segments.length === 0) return;
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfYear = Util.dayOfYear(now);
    const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
    for (const [index, s] of segments.entries()) {
      const uuid = roof.id + '-' + index;
      const s0 = s[0].clone().applyEuler(euler);
      const s1 = s[1].clone().applyEuler(euler);
      const s2 = s[2].clone().applyEuler(euler);
      const v10 = new Vector3().subVectors(s1, s0);
      const v20 = new Vector3().subVectors(s2, s0);
      const v21 = new Vector3().subVectors(s2, s1);
      const length10 = v10.length();
      // find the distance from top to the edge: https://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
      const distance = new Vector3().crossVectors(v20, v21).length() / length10;
      const m = Math.max(2, Math.round(length10 / cellSize));
      const n = Math.max(2, Math.round(distance / cellSize));
      const cellOutputTotals = Array(m)
        .fill(0)
        .map(() => Array(n).fill(0));
      v10.normalize();
      v20.normalize();
      v21.normalize();
      // find the normal vector of the quad
      const normal = new Vector3().crossVectors(v20, v21).normalize();
      // find the incremental vector going along the bottom edge (half of length)
      const dm = v10.multiplyScalar((0.5 * length10) / m);
      // find the incremental vector going from bottom to top (half of length)
      const dn = new Vector3()
        .crossVectors(normal, v10)
        .normalize()
        .multiplyScalar((0.5 * distance) / n);
      // find the starting point of the grid (shift half of length in both directions)
      const v0 = new Vector3(
        foundation.cx + s0.x,
        foundation.cy + s0.y,
        foundation.lz + s0.z + ROOFTOP_SOLAR_PANEL_OFFSET,
      );
      v0.add(dm).add(dn);
      // double half-length to full-length for the increment vectors in both directions
      dm.multiplyScalar(2);
      dn.multiplyScalar(2);
      let count = 0;
      const v = new Vector3();
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
            for (let p = 0; p < m; p++) {
              const dmp = dm.clone().multiplyScalar(p);
              for (let q = 0; q < n; q++) {
                cellOutputTotals[p][q] += indirectRadiation;
                if (dot > 0) {
                  v.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
                  if (!inShadow(uuid, v, sunDirection)) {
                    // direct radiation
                    cellOutputTotals[p][q] += dot * peakRadiation;
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
      setHeatmap(uuid, cellOutputTotals);
    }
  };

  const applyScaleFactor = (output: number[][], scaleFactor: number) => {
    for (let i = 0; i < output.length; i++) {
      for (let j = 0; j < output[i].length; j++) {
        output[i][j] *= scaleFactor;
      }
    }
  };

  return <></>;
});

export default StaticSolarRadiationSimulation;
