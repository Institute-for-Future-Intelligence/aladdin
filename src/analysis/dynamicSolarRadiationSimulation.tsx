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
import { Euler, Intersection, Object3D, Quaternion, Raycaster, Vector2, Vector3 } from 'three';
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
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { FoundationModel } from '../models/FoundationModel';
import { CuboidModel } from '../models/CuboidModel';
import { ParabolicTroughModel } from '../models/ParabolicTroughModel';
import { ParabolicDishModel } from '../models/ParabolicDishModel';
import { FresnelReflectorModel } from '../models/FresnelReflectorModel';
import { HeliostatModel } from '../models/HeliostatModel';

export interface DynamicSolarRadiationSimulationProps {
  city: string | null;
}

const DynamicSolarRadiationSimulation = ({ city }: DynamicSolarRadiationSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getWeather = useStore(Selector.getWeather);
  const getParent = useStore(Selector.getParent);
  const setHeatmap = useStore(Selector.setHeatmap);
  const clearHeatmaps = useStore(Selector.clearHeatmaps);
  const runSimulation = useStore(Selector.runDynamicSimulation);
  const pauseSimulation = useStore(Selector.pauseSimulation);
  const solarRadiationHeatmapReflectionOnly = useStore(Selector.viewState.solarRadiationHeatmapReflectionOnly);

  const { scene } = useThree();
  const lang = { lng: language };
  const weather = getWeather(city ?? 'Boston MA, USA');
  const now = new Date(world.date);
  const elevation = city ? weather?.elevation : 0;
  const interval = 60 / world.timesPerHour;
  const ray = useMemo(() => new Raycaster(), []);
  const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
  const objectsRef = useRef<Object3D[]>([]); // reuse array in intersection detection
  const intersectionsRef = useRef<Intersection[]>([]); // reuse array in intersection detection
  const requestRef = useRef<number>(0);
  const simulationCompletedRef = useRef<boolean>(false);
  const originalDateRef = useRef<Date>(new Date(world.date));
  const cellOutputsMapRef = useRef<Map<string, number[][]>>(new Map<string, number[][]>());
  const pauseRef = useRef<boolean>(false);
  const pausedDateRef = useRef<Date>(new Date(world.date));

  const sunMinutes = useMemo(() => {
    return computeSunriseAndSunsetInMinutes(now, world.latitude);
  }, [world.date, world.latitude]);

  useEffect(() => {
    if (runSimulation) {
      init();
      requestRef.current = requestAnimationFrame(simulate);
      return () => {
        // this is called when the recursive call of requestAnimationFrame exits
        cancelAnimationFrame(requestRef.current);
        if (!simulationCompletedRef.current) {
          showInfo(i18n.t('message.SimulationAborted', lang));
          setCommonStore((state) => {
            state.world.date = originalDateRef.current.toString();
            state.simulationInProgress = false;
          });
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runSimulation]);

  useEffect(() => {
    pauseRef.current = pauseSimulation;
    if (pauseSimulation) {
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
      // continue the simulation
      simulate();
    }
  }, [pauseSimulation]);

  // getting ready for the simulation
  const init = () => {
    setCommonStore((state) => {
      state.simulationInProgress = true;
    });
    // beginning from sunrise
    now.setHours(Math.floor(sunMinutes.sunrise / 60), sunMinutes.sunrise % 60);
    originalDateRef.current = new Date(world.date);
    simulationCompletedRef.current = false;
    fetchObjects();
    // clear the buffer arrays if any
    for (const e of elements) {
      switch (e.type) {
        case ObjectType.Cuboid:
        case ObjectType.SolarPanel:
        case ObjectType.ParabolicTrough:
        case ObjectType.ParabolicDish:
        case ObjectType.FresnelReflector:
        case ObjectType.Heliostat:
          cellOutputsMapRef.current.delete(e.id);
          break;
        case ObjectType.Foundation:
          cellOutputsMapRef.current.delete(e.id);
          cellOutputsMapRef.current.delete(e.id + '-sut');
          break;
      }
    }
  };

  const updateHeatmaps = () => {
    clearHeatmaps();
    // apply clearness and convert the unit of time step from minute to hour so that we get kWh
    const daylight = sunMinutes.daylight() / 60;
    // divide by times per hour as the radiation is added up that many times
    const scaleFactor =
      daylight > ZERO_TOLERANCE ? weather.sunshineHours[now.getMonth()] / (30 * daylight * world.timesPerHour) : 0;
    for (const e of elements) {
      switch (e.type) {
        case ObjectType.Foundation:
        case ObjectType.SolarPanel:
        case ObjectType.ParabolicTrough:
        case ObjectType.ParabolicDish:
        case ObjectType.FresnelReflector:
        case ObjectType.Heliostat:
          const data = cellOutputsMapRef.current.get(e.id);
          if (data) {
            for (let i = 0; i < data.length; i++) {
              for (let j = 0; j < data[i].length; j++) {
                data[i][j] *= scaleFactor;
              }
            }
            // send a copy of the heat map data to common store for visualization
            setHeatmap(
              e.id,
              data.map((a) => [...a]),
            );
          }
          break;
        case ObjectType.Cuboid:
          setCuboidHeatmap(e.id, 'top', scaleFactor);
          setCuboidHeatmap(e.id, 'south', scaleFactor);
          setCuboidHeatmap(e.id, 'north', scaleFactor);
          setCuboidHeatmap(e.id, 'west', scaleFactor);
          setCuboidHeatmap(e.id, 'east', scaleFactor);
          break;
      }
      if (e.type === ObjectType.Foundation) {
        const foundation = e as FoundationModel;
        if (foundation.solarStructure === SolarStructure.UpdraftTower && foundation.solarUpdraftTower) {
          const uuid = e.id + '-sut';
          const data = cellOutputsMapRef.current.get(uuid);
          if (data) {
            for (let i = 0; i < data.length; i++) {
              for (let j = 0; j < data[i].length; j++) {
                data[i][j] *= scaleFactor;
              }
            }
            // send a copy of the heat map data to common store for visualization
            setHeatmap(
              uuid,
              data.map((a) => [...a]),
            );
          }
        }
      }
    }
  };

  const setCuboidHeatmap = (id: string, side: string, scaleFactor: number) => {
    const data = cellOutputsMapRef.current.get(id + '-' + side);
    if (data) {
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          data[i][j] *= scaleFactor;
        }
      }
      // send a copy of the heat map data to common store for visualization
      if (side === 'east' || side === 'west') {
        setHeatmap(id + '-' + side, Util.transpose(Util.clone2DArray(data)));
      } else {
        setHeatmap(id + '-' + side, Util.clone2DArray(data));
      }
    }
  };

  const simulate = () => {
    if (runSimulation && !pauseRef.current) {
      const totalMinutes = now.getMinutes() + now.getHours() * 60;
      if (totalMinutes >= sunMinutes.sunset) {
        cancelAnimationFrame(requestRef.current);
        setCommonStore((state) => {
          state.runDynamicSimulation = false;
          state.world.date = originalDateRef.current.toString();
        });
        showInfo(i18n.t('message.SimulationCompleted', lang));
        simulationCompletedRef.current = true;
        updateHeatmaps();
        // the following must be set with a different common store callback so that the useEffect hook of app.ts
        // is not triggered to cancel the solar radiation heat map
        setCommonStore((state) => {
          state.showSolarRadiationHeatmap = true;
          state.simulationInProgress = false;
        });
        return;
      }
      // this is where time advances (by incrementing the minutes with the given interval)
      now.setHours(now.getHours(), now.getMinutes() + interval);
      setCommonStore((state) => {
        state.world.date = now.toString();
      });
      if (solarRadiationHeatmapReflectionOnly) {
        for (const e of elements) {
          switch (e.type) {
            case ObjectType.FresnelReflector:
              calculateFresnelReflector(e as FresnelReflectorModel);
              break;
            case ObjectType.Heliostat:
              calculateHeliostat(e as HeliostatModel);
              break;
          }
        }
      } else {
        for (const e of elements) {
          switch (e.type) {
            case ObjectType.Foundation:
              const foundation = e as FoundationModel;
              calculateFoundation(foundation);
              if (foundation.solarStructure === SolarStructure.UpdraftTower) {
                calculateSolarUpdraftTower(foundation);
              }
              break;
            case ObjectType.Cuboid:
              calculateCuboid(e as CuboidModel);
              break;
            case ObjectType.SolarPanel:
              calculateSolarPanel(e as SolarPanelModel);
              break;
            case ObjectType.ParabolicTrough:
              calculateParabolicTrough(e as ParabolicTroughModel);
              break;
            case ObjectType.ParabolicDish:
              calculateParabolicDish(e as ParabolicDishModel);
              break;
            case ObjectType.FresnelReflector:
              calculateFresnelReflector(e as FresnelReflectorModel);
              break;
            case ObjectType.Heliostat:
              calculateHeliostat(e as HeliostatModel);
              break;
          }
        }
      }
      // recursive call to the next step of the simulation
      requestRef.current = requestAnimationFrame(simulate);
    }
  };

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

  const calculateCuboid = (cuboid: CuboidModel) => {
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z <= 0) return; // when the sun is not out
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

    // initialize the arrays
    let cellOutputsTop = cellOutputsMapRef.current.get(cuboid.id + '-top');
    if (!cellOutputsTop || cellOutputsTop.length !== nx || cellOutputsTop[0].length !== ny) {
      cellOutputsTop = Array(nx)
        .fill(0)
        .map(() => Array(ny).fill(0));
      cellOutputsMapRef.current.set(cuboid.id + '-top', cellOutputsTop);
    }
    let cellOutputsSouth = cellOutputsMapRef.current.get(cuboid.id + '-south');
    if (!cellOutputsSouth || cellOutputsSouth.length !== nx || cellOutputsSouth[0].length !== nz) {
      cellOutputsSouth = Array(nx)
        .fill(0)
        .map(() => Array(nz).fill(0));
      cellOutputsMapRef.current.set(cuboid.id + '-south', cellOutputsSouth);
    }
    let cellOutputsNorth = cellOutputsMapRef.current.get(cuboid.id + '-north');
    if (!cellOutputsNorth || cellOutputsNorth.length !== nx || cellOutputsNorth[0].length !== nz) {
      cellOutputsNorth = Array(nx)
        .fill(0)
        .map(() => Array(nz).fill(0));
      cellOutputsMapRef.current.set(cuboid.id + '-north', cellOutputsNorth);
    }
    let cellOutputsWest = cellOutputsMapRef.current.get(cuboid.id + '-west');
    if (!cellOutputsWest || cellOutputsWest.length !== ny || cellOutputsWest[0].length !== nz) {
      cellOutputsWest = Array(ny)
        .fill(0)
        .map(() => Array(nz).fill(0));
      cellOutputsMapRef.current.set(cuboid.id + '-west', cellOutputsWest);
    }
    let cellOutputsEast = cellOutputsMapRef.current.get(cuboid.id + '-east');
    if (!cellOutputsEast || cellOutputsEast.length !== ny || cellOutputsEast[0].length !== nz) {
      cellOutputsEast = Array(ny)
        .fill(0)
        .map(() => Array(nz).fill(0));
      cellOutputsMapRef.current.set(cuboid.id + '-east', cellOutputsEast);
    }

    const normalTop = UNIT_VECTOR_POS_Z;
    const normalSouth = UNIT_VECTOR_NEG_Y.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, cuboid.rotation[2]);
    const normalNorth = UNIT_VECTOR_POS_Y.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, cuboid.rotation[2]);
    const normalWest = UNIT_VECTOR_NEG_X.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, cuboid.rotation[2]);
    const normalEast = UNIT_VECTOR_POS_X.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, cuboid.rotation[2]);

    const vec = new Vector3();
    const center2d = new Vector2(cuboid.cx, cuboid.cy);
    const v2 = new Vector2();
    const southY = cuboid.cy - cuboid.ly / 2;
    const northY = cuboid.cy + cuboid.ly / 2;
    const westX = cuboid.cx - cuboid.lx / 2;
    const eastX = cuboid.cx + cuboid.lx / 2;

    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);

    // top face
    let indirectRadiation = calculateDiffuseAndReflectedRadiation(
      world.ground,
      now.getMonth(),
      normalTop,
      peakRadiation,
    );
    let dot = normalTop.dot(sunDirection);
    let uc = cuboid.cx - lx / 2;
    let vc = cuboid.cy - ly / 2;
    for (let u = 0; u < nx; u++) {
      for (let v = 0; v < ny; v++) {
        cellOutputsTop[u][v] += indirectRadiation;
        if (dot > 0) {
          v2.set(uc + u * dx, vc + v * dy);
          v2.rotateAround(center2d, cuboid.rotation[2]);
          vec.set(v2.x, v2.y, lz);
          if (!inShadow(cuboid.id, vec, sunDirection)) {
            // direct radiation
            cellOutputsTop[u][v] += dot * peakRadiation;
          }
        }
      }
    }

    // south face
    uc = cuboid.cx - lx / 2;
    vc = cuboid.cz - lz / 2;
    indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, now.getMonth(), normalSouth, peakRadiation);
    dot = normalSouth.dot(sunDirection);
    for (let u = 0; u < nx; u++) {
      for (let v = 0; v < nz; v++) {
        cellOutputsSouth[u][v] += indirectRadiation;
        if (dot > 0) {
          v2.set(uc + u * dx, southY);
          v2.rotateAround(center2d, cuboid.rotation[2]);
          vec.set(v2.x, v2.y, vc + v * dz);
          if (!inShadow(cuboid.id, vec, sunDirection)) {
            // direct radiation
            cellOutputsSouth[u][v] += dot * peakRadiation;
          }
        }
      }
    }

    // north face
    indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, now.getMonth(), normalNorth, peakRadiation);
    dot = normalNorth.dot(sunDirection);
    for (let u = 0; u < nx; u++) {
      for (let v = 0; v < nz; v++) {
        cellOutputsNorth[u][v] += indirectRadiation;
        if (dot > 0) {
          v2.set(uc + u * dx, northY);
          v2.rotateAround(center2d, cuboid.rotation[2]);
          vec.set(v2.x, v2.y, vc + (nz - v) * dz);
          if (!inShadow(cuboid.id, vec, sunDirection)) {
            // direct radiation
            cellOutputsNorth[u][v] += dot * peakRadiation;
          }
        }
      }
    }

    // west face
    uc = cuboid.cy - ly / 2;
    vc = cuboid.cz - lz / 2;
    indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, now.getMonth(), normalWest, peakRadiation);
    dot = normalWest.dot(sunDirection);
    for (let u = 0; u < ny; u++) {
      for (let v = 0; v < nz; v++) {
        cellOutputsWest[u][v] += indirectRadiation;
        if (dot > 0) {
          v2.set(westX, uc + u * dy);
          v2.rotateAround(center2d, cuboid.rotation[2]);
          vec.set(v2.x, v2.y, vc + v * dz);
          if (!inShadow(cuboid.id, vec, sunDirection)) {
            // direct radiation
            cellOutputsWest[u][v] += dot * peakRadiation;
          }
        }
      }
    }

    // east face
    indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, now.getMonth(), normalEast, peakRadiation);
    dot = normalEast.dot(sunDirection);
    for (let u = 0; u < ny; u++) {
      for (let v = 0; v < nz; v++) {
        cellOutputsEast[u][v] += indirectRadiation;
        if (dot > 0) {
          v2.set(eastX, uc + u * dy);
          v2.rotateAround(center2d, cuboid.rotation[2]);
          vec.set(v2.x, v2.y, vc + v * dz);
          if (!inShadow(cuboid.id, vec, sunDirection)) {
            // direct radiation
            cellOutputsEast[u][v] += dot * peakRadiation;
          }
        }
      }
    }
  };

  const calculateFoundation = (foundation: FoundationModel) => {
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z <= 0) return; // when the sun is not out
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
    let cellOutputs = cellOutputsMapRef.current.get(foundation.id);
    if (!cellOutputs || cellOutputs.length !== nx || cellOutputs[0].length !== ny) {
      cellOutputs = Array(nx)
        .fill(0)
        .map(() => Array(ny).fill(0));
      cellOutputsMapRef.current.set(foundation.id, cellOutputs);
    }
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const indirectRadiation = calculateDiffuseAndReflectedRadiation(
      world.ground,
      now.getMonth(),
      UNIT_VECTOR_POS_Z,
      peakRadiation,
    );
    const dot = UNIT_VECTOR_POS_Z.dot(sunDirection);
    const v2 = new Vector2();
    for (let kx = 0; kx < nx; kx++) {
      for (let ky = 0; ky < ny; ky++) {
        cellOutputs[kx][ky] += indirectRadiation;
        if (dot > 0) {
          v2.set(x0 + kx * dx, y0 + ky * dy);
          v2.rotateAround(center2d, foundation.rotation[2]);
          v.set(v2.x, v2.y, lz);
          if (!inShadow(foundation.id, v, sunDirection)) {
            // direct radiation
            cellOutputs[kx][ky] += dot * peakRadiation;
          }
        }
      }
    }
  };

  const calculateSolarPanel = (panel: SolarPanelModel) => {
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z <= 0) return; // when the sun is not out
    const parent = getParent(panel);
    if (!parent) throw new Error('parent of solar panel does not exist');
    const dayOfYear = Util.dayOfYear(now);
    const center = Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent);
    const normal = new Vector3().fromArray(panel.normal);
    const rot = parent.rotation[2];
    const zRot = rot + panel.relativeAzimuth;
    const lx = panel.lx;
    const ly = panel.ly;
    const nx = Math.max(2, Math.round(panel.lx / cellSize));
    const ny = Math.max(2, Math.round(panel.ly / cellSize));
    const dx = lx / nx;
    const dy = ly / ny;
    // shift half cell size to the center of each grid cell
    const x0 = center.x - (lx - cellSize) / 2;
    const y0 = center.y - (ly - cellSize) / 2;
    const z0 = parent.lz + panel.poleHeight + panel.lz;
    const center2d = new Vector2(center.x, center.y);
    const v = new Vector3();
    let cellOutputs = cellOutputsMapRef.current.get(panel.id);
    if (!cellOutputs || cellOutputs.length !== nx || cellOutputs[0].length !== ny) {
      cellOutputs = Array(nx)
        .fill(0)
        .map(() => Array(ny).fill(0));
      cellOutputsMapRef.current.set(panel.id, cellOutputs);
    }
    let normalEuler = new Euler(panel.tiltAngle, 0, zRot, 'ZYX');
    if (panel.trackerType !== TrackerType.NO_TRACKER) {
      // dynamic angles
      const rotatedSunDirection = rot
        ? sunDirection.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, -rot)
        : sunDirection.clone();
      switch (panel.trackerType) {
        case TrackerType.ALTAZIMUTH_DUAL_AXIS_TRACKER:
          const qRotAADAT = new Quaternion().setFromUnitVectors(UNIT_VECTOR_POS_Z, rotatedSunDirection);
          normalEuler = new Euler().setFromQuaternion(qRotAADAT);
          break;
        case TrackerType.HORIZONTAL_SINGLE_AXIS_TRACKER:
          const qRotHSAT = new Quaternion().setFromUnitVectors(
            UNIT_VECTOR_POS_Z,
            new Vector3(rotatedSunDirection.x, 0, rotatedSunDirection.z).normalize(),
          );
          normalEuler = new Euler().setFromQuaternion(qRotHSAT);
          break;
        case TrackerType.VERTICAL_SINGLE_AXIS_TRACKER:
          if (Math.abs(panel.tiltAngle) > 0.001) {
            const v2 = new Vector3(rotatedSunDirection.x, -rotatedSunDirection.y, 0).normalize();
            const az = Math.acos(UNIT_VECTOR_POS_Y.dot(v2)) * Math.sign(v2.x);
            normalEuler = new Euler(panel.tiltAngle, 0, az + rot, 'ZYX');
          }
          break;
        case TrackerType.TILTED_SINGLE_AXIS_TRACKER:
          // TODO
          break;
      }
    }
    normal.applyEuler(normalEuler);
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const indirectRadiation = calculateDiffuseAndReflectedRadiation(
      world.ground,
      now.getMonth(),
      normal,
      peakRadiation,
    );
    const dot = normal.dot(sunDirection);
    const v2d = new Vector2();
    const dv = new Vector3();
    for (let kx = 0; kx < nx; kx++) {
      for (let ky = 0; ky < ny; ky++) {
        cellOutputs[kx][ky] += indirectRadiation;
        if (dot > 0) {
          v2d.set(x0 + kx * dx, y0 + ky * dy);
          dv.set(v2d.x - center2d.x, v2d.y - center2d.y, 0);
          dv.applyEuler(normalEuler);
          v.set(center.x + dv.x, center.y + dv.y, z0 + dv.z);
          if (!inShadow(panel.id, v, sunDirection)) {
            // direct radiation
            cellOutputs[kx][ky] += dot * peakRadiation;
          }
        }
      }
    }
  };

  const calculateParabolicTrough = (trough: ParabolicTroughModel) => {
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z <= 0) return; // when the sun is not out
    const parent = getParent(trough);
    if (!parent) throw new Error('parent of parabolic trough does not exist');
    const dayOfYear = Util.dayOfYear(now);
    const center = Util.absoluteCoordinates(trough.cx, trough.cy, trough.cz, parent);
    const normal = new Vector3().fromArray(trough.normal);
    const originalNormal = normal.clone();
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
    let cellOutputs = cellOutputsMapRef.current.get(trough.id);
    if (!cellOutputs || cellOutputs.length !== nx || cellOutputs[0].length !== ny) {
      cellOutputs = Array(nx)
        .fill(0)
        .map(() => Array(ny).fill(0));
      cellOutputsMapRef.current.set(trough.id, cellOutputs);
    }
    const rot = parent.rotation[2];
    const zRot = rot + trough.relativeAzimuth;
    const zRotZero = Util.isZero(zRot);
    const cosRot = zRotZero ? 1 : Math.cos(zRot);
    const sinRot = zRotZero ? 0 : Math.sin(zRot);
    const rotatedSunDirection = rot
      ? sunDirection.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, -rot)
      : sunDirection.clone();
    const qRot = new Quaternion().setFromUnitVectors(
      UNIT_VECTOR_POS_Z,
      new Vector3(rotatedSunDirection.x * cosRot, rotatedSunDirection.x * sinRot, rotatedSunDirection.z).normalize(),
    );
    const normalEuler = new Euler().setFromQuaternion(qRot);
    normal.copy(originalNormal.clone().applyEuler(normalEuler));
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const indirectRadiation = calculateDiffuseAndReflectedRadiation(
      world.ground,
      now.getMonth(),
      normal,
      peakRadiation,
    );
    const dot = normal.dot(sunDirection);
    const v2d = new Vector2();
    const dv = new Vector3();
    let tmpX = 0;
    let disX = 0;
    let areaRatio = 1;
    const lr2 = 4 / (trough.latusRectum * trough.latusRectum);
    // we have to calculate the irradiance on the parabolic surface, not the aperture surface.
    // the irradiance on the former is less than that on the latter because of the area difference.
    // the relationship between a unit area on the parabolic surface and that on the aperture surface
    // is S = A * sqrt(1 + 4 * x^2 / p^2), where p is the latus rectum, x is the distance from the center
    // of the parabola, and A is the unit area on the aperture area. Note that this modification only
    // applies to direct radiation. Indirect radiation can come from any direction.
    for (let ku = 0; ku < nx; ku++) {
      tmpX = x0 + ku * dx;
      disX = tmpX - center.x;
      areaRatio = 1 / Math.sqrt(1 + disX * disX * lr2);
      for (let kv = 0; kv < ny; kv++) {
        cellOutputs[ku][kv] += indirectRadiation;
        if (dot > 0) {
          v2d.set(tmpX, y0 + kv * dy);
          // TODO: this implementation differs from that for Fresnel reflectors
          // so we must rotate here. this can be avoided.
          if (!zRotZero) v2d.rotateAround(center2d, zRot);
          dv.set(v2d.x - center2d.x, v2d.y - center2d.y, 0);
          dv.applyEuler(normalEuler);
          v.set(center.x + dv.x, center.y + dv.y, z0 + dv.z);
          if (!inShadow(trough.id, v, sunDirection)) {
            cellOutputs[ku][kv] += dot * peakRadiation * areaRatio;
          }
        }
      }
    }
  };

  const calculateParabolicDish = (dish: ParabolicDishModel) => {
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z <= 0) return; // when the sun is not out
    const parent = getParent(dish);
    if (!parent) throw new Error('parent of parabolic dish does not exist');
    const dayOfYear = Util.dayOfYear(now);
    const center = Util.absoluteCoordinates(dish.cx, dish.cy, dish.cz, parent);
    const normal = new Vector3().fromArray(dish.normal);
    const originalNormal = normal.clone();
    const lx = dish.lx;
    const ly = dish.ly;
    const depth = (lx * lx) / (4 * dish.latusRectum); // the distance from the bottom to the aperture circle
    const actualPoleHeight = dish.poleHeight + lx / 2;
    const nx = Math.max(2, Math.round(dish.lx / cellSize));
    const ny = Math.max(2, Math.round(dish.ly / cellSize));
    const dx = lx / nx;
    const dy = ly / ny;
    // shift half cell size to the center of each grid cell
    const x0 = center.x - (lx - cellSize) / 2;
    const y0 = center.y - (ly - cellSize) / 2;
    const z0 = parent.lz + actualPoleHeight + dish.lz + depth;
    const center2d = new Vector2(center.x, center.y);
    const v = new Vector3();
    let cellOutputs = cellOutputsMapRef.current.get(dish.id);
    if (!cellOutputs || cellOutputs.length !== nx || cellOutputs[0].length !== ny) {
      cellOutputs = Array(nx)
        .fill(0)
        .map(() => Array(ny).fill(0));
      cellOutputsMapRef.current.set(dish.id, cellOutputs);
    }
    const rot = parent.rotation[2];
    const zRot = rot + dish.relativeAzimuth;
    const zRotZero = Util.isZero(zRot);
    const rotatedSunDirection = rot
      ? sunDirection.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, -rot)
      : sunDirection.clone();
    const qRot = new Quaternion().setFromUnitVectors(UNIT_VECTOR_POS_Z, rotatedSunDirection);
    const normalEuler = new Euler().setFromQuaternion(qRot);
    normal.copy(originalNormal.clone().applyEuler(normalEuler));
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const indirectRadiation = calculateDiffuseAndReflectedRadiation(
      world.ground,
      now.getMonth(),
      normal,
      peakRadiation,
    );
    const dot = normal.dot(sunDirection);
    const v2d = new Vector2();
    const dv = new Vector3();
    let tmpX = 0;
    let tmpY = 0;
    let disX = 0;
    let disY = 0;
    let areaRatio = 1;
    const lr2 = 4 / (dish.latusRectum * dish.latusRectum);
    // we have to calculate the irradiance on the parabolic surface, not the aperture surface.
    // the irradiance on the former is less than that on the latter because of the area difference.
    // the relationship between a unit area on the parabolic surface and that on the aperture surface
    // is S = A * sqrt(1 + 4 * (x^2 + y^2) / p^2), where p is the latus rectum, x is the x distance
    // from the center of the paraboloid, y is the y distance from the center of the paraboloid,
    // and A is the unit area on the aperture area. Note that this modification only
    // applies to direct radiation. Indirect radiation can come from any direction.
    for (let ku = 0; ku < nx; ku++) {
      tmpX = x0 + ku * dx;
      disX = tmpX - center.x;
      if (Math.abs(disX) > lx / 2) continue;
      for (let kv = 0; kv < ny; kv++) {
        tmpY = y0 + kv * dy;
        disY = tmpY - center.y;
        if (Math.abs(disY) > ly / 2) continue;
        cellOutputs[ku][kv] += indirectRadiation;
        if (dot > 0) {
          v2d.set(tmpX, tmpY);
          if (!zRotZero) v2d.rotateAround(center2d, zRot);
          dv.set(v2d.x - center2d.x, v2d.y - center2d.y, 0);
          dv.applyEuler(normalEuler);
          v.set(center.x + dv.x, center.y + dv.y, z0 + dv.z);
          if (!inShadow(dish.id, v, sunDirection)) {
            areaRatio = 1 / Math.sqrt(1 + (disX * disX + disY * disY) * lr2);
            cellOutputs[ku][kv] += dot * peakRadiation * areaRatio;
          }
        }
      }
    }
  };

  const calculateFresnelReflector = (reflector: FresnelReflectorModel) => {
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
    let cellOutputs = cellOutputsMapRef.current.get(reflector.id);
    if (!cellOutputs || cellOutputs.length !== nx || cellOutputs[0].length !== ny) {
      cellOutputs = Array(nx)
        .fill(0)
        .map(() => Array(ny).fill(0));
      cellOutputsMapRef.current.set(reflector.id, cellOutputs);
    }
    const rot = parent.rotation[2];
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
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const indirectRadiation = calculateDiffuseAndReflectedRadiation(
      world.ground,
      now.getMonth(),
      normal,
      peakRadiation,
    );
    const dot = normal.dot(sunDirection);
    const v2d = new Vector2();
    const dv = new Vector3();
    let tmpX = 0;
    if (solarRadiationHeatmapReflectionOnly) {
      for (let ku = 0; ku < nx; ku++) {
        tmpX = x0 + ku * dx;
        for (let kv = 0; kv < ny; kv++) {
          if (dot > 0) {
            v2d.set(tmpX, y0 + kv * dy);
            dv.set(v2d.x - center2d.x, v2d.y - center2d.y, 0);
            dv.applyEuler(normalEuler);
            v.set(center.x + dv.x, center.y + dv.y, z0 + dv.z);
            if (!inShadow(reflector.id, v, sunDirection) && !inShadow(reflector.id, v, reflectorToReceiver)) {
              cellOutputs[ku][kv] += dot * peakRadiation;
            }
          }
        }
      }
    } else {
      for (let ku = 0; ku < nx; ku++) {
        tmpX = x0 + ku * dx;
        for (let kv = 0; kv < ny; kv++) {
          cellOutputs[ku][kv] += indirectRadiation;
          if (dot > 0) {
            v2d.set(tmpX, y0 + kv * dy);
            dv.set(v2d.x - center2d.x, v2d.y - center2d.y, 0);
            dv.applyEuler(normalEuler);
            v.set(center.x + dv.x, center.y + dv.y, z0 + dv.z);
            if (!inShadow(reflector.id, v, sunDirection)) {
              cellOutputs[ku][kv] += dot * peakRadiation;
            }
          }
        }
      }
    }
  };

  const calculateHeliostat = (heliostat: HeliostatModel) => {
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z < ZERO_TOLERANCE) return; // when the sun is not out
    const parent = getParent(heliostat);
    if (!parent) throw new Error('parent of Fresnel reflector does not exist');
    if (parent.type !== ObjectType.Foundation) return;
    const foundation = parent as FoundationModel;
    const powerTower = foundation.solarPowerTower;
    if (!powerTower) return;
    const dayOfYear = Util.dayOfYear(now);
    const center = Util.absoluteCoordinates(heliostat.cx, heliostat.cy, heliostat.cz, parent);
    const normal = new Vector3().fromArray(heliostat.normal);
    const originalNormal = normal.clone();
    const lx = heliostat.lx;
    const ly = heliostat.ly;
    const actualPoleHeight = heliostat.poleHeight + Math.max(lx, ly) / 2;
    const nx = Math.max(2, Math.round(heliostat.lx / cellSize));
    const ny = Math.max(2, Math.round(heliostat.ly / cellSize));
    const dx = lx / nx;
    const dy = ly / ny;
    // shift half cell size to the center of each grid cell
    const x0 = center.x - (lx - cellSize) / 2;
    const y0 = center.y - (ly - cellSize) / 2;
    const z0 = foundation.lz + actualPoleHeight + heliostat.lz;
    const center2d = new Vector2(center.x, center.y);
    const v = new Vector3();
    let cellOutputs = cellOutputsMapRef.current.get(heliostat.id);
    if (!cellOutputs || cellOutputs.length !== nx || cellOutputs[0].length !== ny) {
      cellOutputs = Array(nx)
        .fill(0)
        .map(() => Array(ny).fill(0));
      cellOutputsMapRef.current.set(heliostat.id, cellOutputs);
    }
    const rot = parent.rotation[2];
    // convert the receiver's coordinates into those relative to the center of this reflector
    const receiverCenter =
      foundation.solarStructure === SolarStructure.FocusTower
        ? new Vector3(
            foundation.cx - center.x,
            foundation.cy - center.y,
            foundation.cz - center.z + (powerTower.towerHeight ?? 20),
          )
        : undefined;
    let heliostatToReceiver;
    let normalEuler;
    if (receiverCenter) {
      heliostatToReceiver = receiverCenter.clone().normalize();
      let normalVector = heliostatToReceiver.clone().add(sunDirection).normalize();
      if (Util.isSame(normalVector, UNIT_VECTOR_POS_Z)) {
        normalVector = new Vector3(-0.001, 0, 1).normalize();
      }
      if (rot) {
        normalVector.applyAxisAngle(UNIT_VECTOR_POS_Z, -rot);
      }
      // convert the normal vector to euler
      const r = Math.hypot(normalVector.x, normalVector.y);
      normalEuler = new Euler(
        Math.atan2(r, normalVector.z),
        0,
        Math.atan2(normalVector.y, normalVector.x) + HALF_PI,
        'ZXY',
      );
      normal.copy(originalNormal.clone().applyEuler(normalEuler));
    } else {
      heliostatToReceiver = new Vector3(0, 0, 1);
      normalEuler = new Euler();
    }
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const indirectRadiation = calculateDiffuseAndReflectedRadiation(
      world.ground,
      now.getMonth(),
      normal,
      peakRadiation,
    );
    const dot = normal.dot(sunDirection);
    const v2d = new Vector2();
    const dv = new Vector3();
    let tmpX = 0;
    if (solarRadiationHeatmapReflectionOnly) {
      for (let ku = 0; ku < nx; ku++) {
        tmpX = x0 + ku * dx;
        for (let kv = 0; kv < ny; kv++) {
          if (dot > 0) {
            v2d.set(tmpX, y0 + kv * dy);
            dv.set(v2d.x - center2d.x, v2d.y - center2d.y, 0);
            dv.applyEuler(normalEuler);
            v.set(center.x + dv.x, center.y + dv.y, z0 + dv.z);
            if (!inShadow(heliostat.id, v, sunDirection) && !inShadow(heliostat.id, v, heliostatToReceiver)) {
              cellOutputs[ku][kv] += dot * peakRadiation;
            }
          }
        }
      }
    } else {
      for (let ku = 0; ku < nx; ku++) {
        tmpX = x0 + ku * dx;
        for (let kv = 0; kv < ny; kv++) {
          cellOutputs[ku][kv] += indirectRadiation;
          if (dot > 0) {
            v2d.set(tmpX, y0 + kv * dy);
            dv.set(v2d.x - center2d.x, v2d.y - center2d.y, 0);
            dv.applyEuler(normalEuler);
            v.set(center.x + dv.x, center.y + dv.y, z0 + dv.z);
            if (!inShadow(heliostat.id, v, sunDirection)) {
              cellOutputs[ku][kv] += dot * peakRadiation;
            }
          }
        }
      }
    }
  };

  const calculateSolarUpdraftTower = (foundation: FoundationModel) => {
    const solarUpdraftTower = foundation.solarUpdraftTower;
    if (!solarUpdraftTower) return;
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z <= 0) return; // when the sun is not out
    const dayOfYear = Util.dayOfYear(now);
    const normal = new Vector3().fromArray(foundation.normal);
    const radius = solarUpdraftTower.collectorRadius;
    const max = Math.max(2, Math.round((radius * 2) / cellSize));
    // shift half cell size to the center of each grid cell
    const x0 = foundation.cx - radius + cellSize / 2;
    const y0 = foundation.cy - radius + cellSize / 2;
    const z0 = foundation.lz + solarUpdraftTower.collectorHeight;
    const uuid = foundation.id + '-sut';
    let cellOutputs = cellOutputsMapRef.current.get(uuid);
    if (!cellOutputs || cellOutputs.length !== max || cellOutputs[0].length !== max) {
      cellOutputs = Array(max)
        .fill(0)
        .map(() => Array(max).fill(0));
      cellOutputsMapRef.current.set(uuid, cellOutputs);
    }
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const indirectRadiation = calculateDiffuseAndReflectedRadiation(
      world.ground,
      now.getMonth(),
      normal,
      peakRadiation,
    );
    const vec = new Vector3(0, 0, z0);
    const dot = normal.dot(sunDirection);
    const rsq = radius * radius;
    let dx, dy;
    for (let u = 0; u < max; u++) {
      vec.x = x0 + u * cellSize;
      dx = vec.x - foundation.cx;
      for (let v = 0; v < max; v++) {
        vec.y = y0 + v * cellSize;
        dy = vec.y - foundation.cy;
        if (dx * dx + dy * dy > rsq) continue;
        cellOutputs[u][v] += indirectRadiation;
        if (dot > 0) {
          if (!inShadow(uuid, vec, sunDirection)) {
            cellOutputs[u][v] += dot * peakRadiation;
          }
        }
      }
    }
  };

  return <></>;
};

export default React.memo(DynamicSolarRadiationSimulation);
