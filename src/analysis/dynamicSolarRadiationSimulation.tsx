/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  calculateDiffuseAndReflectedRadiation,
  calculatePeakRadiation,
  computeSunriseAndSunsetInMinutes,
  getSunDirection,
  ROOFTOP_SOLAR_PANEL_OFFSET,
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
import { WallModel } from '../models/WallModel';
import { RoofModel, RoofType } from '../models/RoofModel';
import { DoorModel, DoorType } from '../models/DoorModel';
import { SolarRadiation } from './SolarRadiation';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';

export interface DynamicSolarRadiationSimulationProps {
  city: string | null;
}

const DynamicSolarRadiationSimulation = ({ city }: DynamicSolarRadiationSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const setPrimitiveStore = usePrimitiveStore(Selector.setPrimitiveStore);
  const language = useStore(Selector.language);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getWeather = useStore(Selector.getWeather);
  const getParent = useStore(Selector.getParent);
  const getFoundation = useStore(Selector.getFoundation);
  const setHeatmap = useDataStore(Selector.setHeatmap);
  const clearHeatmaps = useDataStore(Selector.clearHeatmaps);
  const runSimulation = usePrimitiveStore(Selector.runDynamicSimulation);
  const pauseSimulation = usePrimitiveStore(Selector.pauseSimulation);
  const solarRadiationHeatmapReflectionOnly = useStore(Selector.viewState.solarRadiationHeatmapReflectionOnly);
  const getRoofSegmentVertices = useDataStore(Selector.getRoofSegmentVertices);

  const { scene } = useThree();
  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);
  const weather = useMemo(() => getWeather(city ?? 'Boston MA, USA'), [city]);
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
            state.world.date = originalDateRef.current.toLocaleString('en-US');
          });
          setPrimitiveStore('simulationInProgress', false);
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
      setPrimitiveStore('simulationPaused', true);
      showInfo(i18n.t('message.SimulationPaused', lang));
    } else {
      setPrimitiveStore('simulationPaused', false);
      // continue the simulation
      simulate();
    }
  }, [pauseSimulation]);

  // getting ready for the simulation
  const init = () => {
    setPrimitiveStore('simulationInProgress', true);
    // beginning from sunrise
    now.setHours(Math.floor(sunMinutes.sunrise / 60), sunMinutes.sunrise % 60);
    originalDateRef.current = new Date(world.date);
    simulationCompletedRef.current = false;
    fetchObjects();
    // clear the buffer arrays if any
    for (const e of elements) {
      switch (e.type) {
        case ObjectType.Wall:
        case ObjectType.Door:
        case ObjectType.SolarPanel:
        case ObjectType.ParabolicTrough:
        case ObjectType.ParabolicDish:
        case ObjectType.FresnelReflector:
        case ObjectType.Heliostat:
          cellOutputsMapRef.current.delete(e.id);
          break;
        case ObjectType.Cuboid:
          cellOutputsMapRef.current.delete(e.id + '-top');
          cellOutputsMapRef.current.delete(e.id + '-north');
          cellOutputsMapRef.current.delete(e.id + '-south');
          cellOutputsMapRef.current.delete(e.id + '-west');
          cellOutputsMapRef.current.delete(e.id + '-east');
          break;
        case ObjectType.Roof:
          const roof = e as RoofModel;
          const segments = getRoofSegmentVertices(roof.id);
          if (segments) {
            const n = segments.length;
            for (let i = 0; i < n; i++) {
              cellOutputsMapRef.current.delete(roof.id + '-' + i);
            }
          }
          cellOutputsMapRef.current.delete(roof.id); // in case it is a flat roof
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
    const daylight = sunMinutes.daylight() / 60;
    // apply clearness and convert the unit of time step from minute to hour so that we get kWh
    // (divide by times per hour as the radiation is added up that many times)
    const scaleFactor =
      daylight > ZERO_TOLERANCE ? weather.sunshineHours[now.getMonth()] / (30 * daylight * world.timesPerHour) : 0;
    for (const e of elements) {
      switch (e.type) {
        case ObjectType.Foundation:
        case ObjectType.Wall:
        case ObjectType.Door:
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
        case ObjectType.Roof:
          const roof = e as RoofModel;
          const segments = getRoofSegmentVertices(roof.id);
          if (segments && segments.length > 0) {
            if (
              roof.roofType === RoofType.Pyramid ||
              roof.roofType === RoofType.Mansard ||
              roof.roofType === RoofType.Gambrel ||
              roof.roofType === RoofType.Hip
            ) {
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
                const data = cellOutputsMapRef.current.get(roof.id);
                if (data) {
                  for (let i = 0; i < data.length; i++) {
                    for (let j = 0; j < data[i].length; j++) {
                      data[i][j] *= scaleFactor;
                    }
                  }
                  // send a copy of the heatmap data to common store for visualization
                  setHeatmap(
                    roof.id,
                    data.map((a) => [...a]),
                  );
                }
                break;
              }
            }
            for (let i = 0; i < segments.length; i++) {
              const uuid = roof.id + '-' + i;
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
        usePrimitiveStore.getState().set((state) => {
          state.runDynamicSimulation = false;
        });
        setCommonStore((state) => {
          state.world.date = originalDateRef.current.toLocaleString('en-US');
        });
        showInfo(i18n.t('message.SimulationCompleted', lang));
        simulationCompletedRef.current = true;
        updateHeatmaps();
        // the following must be set with a different store callback so that the useEffect hook of app.ts
        // is not triggered to cancel the solar radiation heat map
        // setPrimitiveStore('simulationInProgress', false);
        // setPrimitiveStore('showSolarRadiationHeatmap', true);

        // after upgrading packages, have to put this in setTimeout to avoid triggering useEffect hook of app.ts
        setTimeout(() => {
          setPrimitiveStore('simulationInProgress', false);
          setPrimitiveStore('showSolarRadiationHeatmap', true);
        }, 10);
        return;
      }
      // this is where time advances (by incrementing the minutes with the given interval)
      now.setHours(now.getHours(), now.getMinutes() + interval);
      setCommonStore((state) => {
        state.world.date = now.toLocaleString('en-US');
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
            case ObjectType.Wall:
              calculateWall(e as WallModel);
              break;
            case ObjectType.Door:
              calculateDoor(e as DoorModel);
              break;
            case ObjectType.Roof:
              const roof = e as RoofModel;
              switch (roof.roofType) {
                case RoofType.Pyramid:
                  calculatePyramidRoof(roof);
                  break;
                case RoofType.Gable:
                  calculateGableRoof(roof);
                  break;
                case RoofType.Gambrel:
                  calculateGambrelRoof(roof);
                  break;
                case RoofType.Mansard:
                  calculateMansardRoof(roof);
                  break;
                case RoofType.Hip:
                  calculateHipRoof(roof);
                  break;
              }
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
    const vec = new Vector3();
    const center2d = new Vector2(cx, cy);
    const v2 = new Vector2();
    const southY = cy - ly / 2;
    const northY = cy + ly / 2;
    const westX = cx - lx / 2;
    const eastX = cx + lx / 2;

    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);

    // top face
    let indirectRadiation = calculateDiffuseAndReflectedRadiation(
      world.ground,
      now.getMonth(),
      normalTop,
      peakRadiation,
    );
    let dot = normalTop.dot(sunDirection);
    let uc = cx - lx / 2;
    let vc = cy - ly / 2;
    const topZ = cz + lz / 2;
    for (let u = 0; u < nx; u++) {
      for (let v = 0; v < ny; v++) {
        cellOutputsTop[u][v] += indirectRadiation;
        if (dot > 0) {
          v2.set(uc + (u + 0.5) * dx, vc + (v + 0.5) * dy);
          v2.rotateAround(center2d, cuboid.rotation[2]);
          vec.set(v2.x, v2.y, topZ);
          if (!inShadow(cuboid.id, vec, sunDirection)) {
            // direct radiation
            cellOutputsTop[u][v] += dot * peakRadiation;
          }
        }
      }
    }

    // south face
    uc = cx - lx / 2;
    vc = cz - lz / 2;
    indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, now.getMonth(), normalSouth, peakRadiation);
    dot = normalSouth.dot(sunDirection);
    for (let u = 0; u < nx; u++) {
      for (let v = 0; v < nz; v++) {
        cellOutputsSouth[u][v] += indirectRadiation;
        if (dot > 0) {
          v2.set(uc + (u + 0.5) * dx, southY);
          v2.rotateAround(center2d, cuboid.rotation[2]);
          vec.set(v2.x, v2.y, vc + (v + 0.5) * dz);
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
          v2.set(uc + (u + 0.5) * dx, northY);
          v2.rotateAround(center2d, cuboid.rotation[2]);
          vec.set(v2.x, v2.y, vc + (nz - (v + 0.5)) * dz);
          if (!inShadow(cuboid.id, vec, sunDirection)) {
            // direct radiation
            cellOutputsNorth[u][v] += dot * peakRadiation;
          }
        }
      }
    }

    // west face
    uc = cy - ly / 2;
    vc = cz - lz / 2;
    indirectRadiation = calculateDiffuseAndReflectedRadiation(world.ground, now.getMonth(), normalWest, peakRadiation);
    dot = normalWest.dot(sunDirection);
    for (let u = 0; u < ny; u++) {
      for (let v = 0; v < nz; v++) {
        cellOutputsWest[u][v] += indirectRadiation;
        if (dot > 0) {
          v2.set(westX, uc + (u + 0.5) * dy);
          v2.rotateAround(center2d, cuboid.rotation[2]);
          vec.set(v2.x, v2.y, vc + (v + 0.5) * dz);
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
          v2.set(eastX, uc + (u + 0.5) * dy);
          v2.rotateAround(center2d, cuboid.rotation[2]);
          vec.set(v2.x, v2.y, vc + (v + 0.5) * dz);
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
          v2.set(x0 + (kx + 0.5) * dx, y0 + (ky + 0.5) * dy);
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

  const calculateWall = (wall: WallModel) => {
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z <= 0) return; // when the sun is not out
    const foundation = getFoundation(wall);
    if (!foundation) throw new Error('foundation of wall not found');
    const dayOfYear = Util.dayOfYear(now);
    const lx = wall.lx;
    const lz = Util.getHighestPointOfWall(wall); // height
    const nx = Math.max(2, Math.round(lx / cellSize));
    const nz = Math.max(2, Math.round(lz / cellSize));
    const dx = lx / nx;
    const dz = lz / nz;
    const absAngle = foundation.rotation[2] + wall.relativeAngle;
    const absPos = Util.wallAbsolutePosition(new Vector3(wall.cx, wall.cy, wall.cz), foundation).setZ(
      lz / 2 + foundation.lz,
    );
    const normal = new Vector3(Math.cos(absAngle - HALF_PI), Math.sin(absAngle - HALF_PI), 0);
    const dxcos = dx * Math.cos(absAngle);
    const dxsin = dx * Math.sin(absAngle);
    const v = new Vector3();
    let cellOutputs = cellOutputsMapRef.current.get(wall.id);
    if (!cellOutputs || cellOutputs.length !== nx || cellOutputs[0].length !== nz) {
      cellOutputs = Array(nx)
        .fill(0)
        .map(() => Array(nz).fill(0));
      cellOutputsMapRef.current.set(wall.id, cellOutputs);
    }
    const polygon = Util.getWallVertices(wall, 1);
    const halfDif = (lz - wall.lz) / 2;
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const indirectRadiation = calculateDiffuseAndReflectedRadiation(
      world.ground,
      now.getMonth(),
      normal,
      peakRadiation,
    );
    const dot = normal.dot(sunDirection);
    for (let kx = 0; kx < nx; kx++) {
      for (let kz = 0; kz < nz; kz++) {
        const kx2 = kx - nx / 2 + 0.5;
        const kz2 = kz - nz / 2 + 0.5;
        if (Util.isPointInside(kx2 * dx, kz2 * dz + halfDif, polygon)) {
          cellOutputs[kx][kz] += indirectRadiation;
          if (dot > 0) {
            v.set(absPos.x + kx2 * dxcos, absPos.y + kx2 * dxsin, absPos.z + kz2 * dz);
            if (!inShadow(wall.id, v, sunDirection)) {
              // direct radiation
              cellOutputs[kx][kz] += dot * peakRadiation;
            }
          }
        }
      }
    }
  };

  const calculateDoor = (door: DoorModel) => {
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z <= 0) return; // when the sun is not out
    const foundation = getFoundation(door);
    if (!foundation) throw new Error('foundation of door not found');
    const parent = getParent(door);
    if (!parent) throw new Error('parent of door not found');
    const dayOfYear = Util.dayOfYear(now);
    const wall = parent as WallModel;
    const lx = door.lx * wall.lx;
    const lz = door.lz * wall.lz;
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
    const dxcos = dx * Math.cos(absAngle);
    const dxsin = dx * Math.sin(absAngle);
    const v = new Vector3();
    let cellOutputs = cellOutputsMapRef.current.get(door.id);
    if (!cellOutputs || cellOutputs.length !== nx || cellOutputs[0].length !== nz) {
      cellOutputs = Array(nx)
        .fill(0)
        .map(() => Array(nz).fill(0));
      cellOutputsMapRef.current.set(door.id, cellOutputs);
    }
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const indirectRadiation = calculateDiffuseAndReflectedRadiation(
      world.ground,
      now.getMonth(),
      normal,
      peakRadiation,
    );
    const dot = normal.dot(sunDirection);
    if (door.doorType === DoorType.Arched) {
      for (let kx = 0; kx < nx; kx++) {
        for (let kz = 0; kz < nz; kz++) {
          const kx2 = kx - nx / 2 + 0.5;
          const kz2 = kz - nz / 2 + 0.5;
          v.set(absPos.x + kx2 * dxcos, absPos.y + kx2 * dxsin, absPos.z + kz2 * dz);
          if (SolarRadiation.pointWithinArch(v, lx, lz, door.archHeight, absPos)) {
            cellOutputs[kx][kz] += indirectRadiation;
            if (dot > 0) {
              if (!inShadow(door.id, v, sunDirection)) {
                // direct radiation
                cellOutputs[kx][kz] += dot * peakRadiation;
              }
            }
          }
        }
      }
    } else {
      for (let kx = 0; kx < nx; kx++) {
        for (let kz = 0; kz < nz; kz++) {
          cellOutputs[kx][kz] += indirectRadiation;
          if (dot > 0) {
            const kx2 = kx - nx / 2 + 0.5;
            const kz2 = kz - nz / 2 + 0.5;
            v.set(absPos.x + kx2 * dxcos, absPos.y + kx2 * dxsin, absPos.z + kz2 * dz);
            if (!inShadow(door.id, v, sunDirection)) {
              // direct radiation
              cellOutputs[kx][kz] += dot * peakRadiation;
            }
          }
        }
      }
    }
  };

  const calculateFlatRoof = (
    sunDirection: Vector3,
    roof: RoofModel,
    foundation: FoundationModel,
    segments: Vector3[][],
  ) => {
    const h0 = segments[0][0].z;
    const dayOfYear = Util.dayOfYear(now);
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
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
        if (v2.y < minY) minY = v2.y; // don't use else if!!!
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
    let cellOutputs = cellOutputsMapRef.current.get(roof.id);
    if (!cellOutputs || cellOutputs.length !== nx || cellOutputs[0].length !== ny) {
      cellOutputs = Array(nx)
        .fill(0)
        .map(() => Array(ny).fill(0));
      cellOutputsMapRef.current.set(roof.id, cellOutputs);
    }
    const v0 = new Vector3(minX + cellSize / 2, minY + cellSize / 2, foundation.lz + h0 + ROOFTOP_SOLAR_PANEL_OFFSET);
    const v = new Vector3(0, 0, v0.z);
    const indirectRadiation = calculateDiffuseAndReflectedRadiation(
      world.ground,
      now.getMonth(),
      UNIT_VECTOR_POS_Z,
      peakRadiation,
    );
    const dot = UNIT_VECTOR_POS_Z.dot(sunDirection);
    for (let p = 0; p < nx; p++) {
      v.x = v0.x + p * dx;
      for (let q = 0; q < ny; q++) {
        cellOutputs[p][q] += indirectRadiation;
        if (dot > 0) {
          v.y = v0.y + q * dy;
          if (!inShadow(roof.id, v, sunDirection)) {
            // direct radiation
            cellOutputs[p][q] += dot * peakRadiation;
          }
        }
      }
    }
  };

  const calculatePyramidRoof = (roof: RoofModel) => {
    if (roof.roofType !== RoofType.Pyramid) throw new Error('roof is not pyramid');
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z <= 0) return; // when the sun is not out
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
    // send heat map data to common store for visualization
    if (flat) {
      calculateFlatRoof(sunDirection, roof, foundation, segments);
    } else {
      const dayOfYear = Util.dayOfYear(now);
      const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
      const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
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
        let cellOutputs = cellOutputsMapRef.current.get(uuid);
        if (!cellOutputs || cellOutputs.length !== m || cellOutputs[0].length !== n) {
          cellOutputs = Array(m)
            .fill(0)
            .map(() => Array(n).fill(0));
          cellOutputsMapRef.current.set(uuid, cellOutputs);
        }
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
        const v = new Vector3();
        const indirectRadiation = calculateDiffuseAndReflectedRadiation(
          world.ground,
          now.getMonth(),
          normal,
          peakRadiation,
        );
        const dot = normal.dot(sunDirection);
        for (let p = 0; p < m; p++) {
          const dmp = dm.clone().multiplyScalar(p);
          for (let q = 0; q < n; q++) {
            cellOutputs[p][q] += indirectRadiation;
            if (dot > 0) {
              v.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
              if (!inShadow(uuid, v, sunDirection)) {
                // direct radiation
                cellOutputs[p][q] += dot * peakRadiation;
              }
            }
          }
        }
      }
    }
  };

  const calculateMansardRoof = (roof: RoofModel) => {
    if (roof.roofType !== RoofType.Mansard) throw new Error('roof is not mansard');
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z <= 0) return; // when the sun is not out
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
    // send heat map data to common store for visualization
    if (flat) {
      calculateFlatRoof(sunDirection, roof, foundation, segments);
    } else {
      const dayOfYear = Util.dayOfYear(now);
      const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
      const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
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
          let cellOutputs = cellOutputsMapRef.current.get(uuid);
          if (!cellOutputs || cellOutputs.length !== nx || cellOutputs[0].length !== ny) {
            cellOutputs = Array(nx)
              .fill(0)
              .map(() => Array(ny).fill(0));
            cellOutputsMapRef.current.set(uuid, cellOutputs);
          }
          const v0 = new Vector3(
            minX + cellSize / 2,
            minY + cellSize / 2,
            foundation.lz + h0 + ROOFTOP_SOLAR_PANEL_OFFSET,
          );
          const v = new Vector3(0, 0, v0.z);
          const indirectRadiation = calculateDiffuseAndReflectedRadiation(
            world.ground,
            now.getMonth(),
            UNIT_VECTOR_POS_Z,
            peakRadiation,
          );
          const dot = UNIT_VECTOR_POS_Z.dot(sunDirection);
          for (let p = 0; p < nx; p++) {
            v.x = v0.x + p * dx;
            for (let q = 0; q < ny; q++) {
              cellOutputs[p][q] += indirectRadiation;
              if (dot > 0) {
                v.y = v0.y + q * dy;
                if (!inShadow(uuid, v, sunDirection)) {
                  // direct radiation
                  cellOutputs[p][q] += dot * peakRadiation;
                }
              }
            }
          }
        } else {
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
          let cellOutputs = cellOutputsMapRef.current.get(uuid);
          if (!cellOutputs || cellOutputs.length !== m || cellOutputs[0].length !== n) {
            cellOutputs = Array(m)
              .fill(0)
              .map(() => Array(n).fill(0));
            cellOutputsMapRef.current.set(uuid, cellOutputs);
          }
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
          const v = new Vector3();
          const indirectRadiation = calculateDiffuseAndReflectedRadiation(
            world.ground,
            now.getMonth(),
            normal,
            peakRadiation,
          );
          const dot = normal.dot(sunDirection);
          for (let p = 0; p < m; p++) {
            const dmp = dm.clone().multiplyScalar(p);
            for (let q = 0; q < n; q++) {
              cellOutputs[p][q] += indirectRadiation;
              if (dot > 0) {
                v.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
                if (!inShadow(uuid, v, sunDirection)) {
                  // direct radiation
                  cellOutputs[p][q] += dot * peakRadiation;
                }
              }
            }
          }
        }
      }
    }
  };

  const calculateGambrelRoof = (roof: RoofModel) => {
    if (roof.roofType !== RoofType.Gambrel) throw new Error('roof is not gambrel');
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z <= 0) return; // when the sun is not out
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
    // send heat map data to common store for visualization
    if (flat) {
      calculateFlatRoof(sunDirection, roof, foundation, segments);
    } else {
      const dayOfYear = Util.dayOfYear(now);
      const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
      const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
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
        let cellOutputs = cellOutputsMapRef.current.get(uuid);
        if (!cellOutputs || cellOutputs.length !== m || cellOutputs[0].length !== n) {
          cellOutputs = Array(m)
            .fill(0)
            .map(() => Array(n).fill(0));
          cellOutputsMapRef.current.set(uuid, cellOutputs);
        }
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
        const v = new Vector3();
        const indirectRadiation = calculateDiffuseAndReflectedRadiation(
          world.ground,
          now.getMonth(),
          normal,
          peakRadiation,
        );
        const dot = normal.dot(sunDirection);
        for (let p = 0; p < m; p++) {
          const dmp = dm.clone().multiplyScalar(p);
          for (let q = 0; q < n; q++) {
            cellOutputs[p][q] += indirectRadiation;
            if (dot > 0) {
              v.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
              if (!inShadow(uuid, v, sunDirection)) {
                // direct radiation
                cellOutputs[p][q] += dot * peakRadiation;
              }
            }
          }
        }
      }
    }
  };

  const calculateHipRoof = (roof: RoofModel) => {
    if (roof.roofType !== RoofType.Hip) throw new Error('roof is not hip');
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z <= 0) return; // when the sun is not out
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
      calculateFlatRoof(sunDirection, roof, foundation, segments);
    } else {
      const dayOfYear = Util.dayOfYear(now);
      const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
      const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
      for (const [index, s] of segments.entries()) {
        // even number (0, 2) are quads, odd number (1, 3) are triangles
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
        // in case we need it: the position of the top point relative to the first edge point is
        // (m * v20.dot(v10.normalize())) / length10;
        let cellOutputs = cellOutputsMapRef.current.get(uuid);
        if (!cellOutputs || cellOutputs.length !== m || cellOutputs[0].length !== n) {
          cellOutputs = Array(m)
            .fill(0)
            .map(() => Array(n).fill(0));
          cellOutputsMapRef.current.set(uuid, cellOutputs);
        }
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
        const indirectRadiation = calculateDiffuseAndReflectedRadiation(
          world.ground,
          now.getMonth(),
          normal,
          peakRadiation,
        );
        const dot = normal.dot(sunDirection);
        for (let p = 0; p < m; p++) {
          const dmp = dm.clone().multiplyScalar(p);
          for (let q = 0; q < n; q++) {
            cellOutputs[p][q] += indirectRadiation;
            if (dot > 0) {
              v.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
              if (!inShadow(uuid, v, sunDirection)) {
                // direct radiation
                cellOutputs[p][q] += dot * peakRadiation;
              }
            }
          }
        }
      }
    }
  };

  // gable roofs are treated as a special case
  const calculateGableRoof = (roof: RoofModel) => {
    if (roof.roofType !== RoofType.Gable) throw new Error('roof is not gable');
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z <= 0) return; // when the sun is not out
    const foundation = getFoundation(roof);
    if (!foundation) throw new Error('foundation of wall not found');
    const segments = getRoofSegmentVertices(roof.id);
    if (!segments || segments.length === 0) return;
    const dayOfYear = Util.dayOfYear(now);
    const euler = new Euler(0, 0, foundation.rotation[2], 'ZYX');
    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
    // send heat map data to common store for visualization
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
      let cellOutputs = cellOutputsMapRef.current.get(uuid);
      if (!cellOutputs || cellOutputs.length !== m || cellOutputs[0].length !== n) {
        cellOutputs = Array(m)
          .fill(0)
          .map(() => Array(n).fill(0));
        cellOutputsMapRef.current.set(uuid, cellOutputs);
      }
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
      const v = new Vector3();
      const indirectRadiation = calculateDiffuseAndReflectedRadiation(
        world.ground,
        now.getMonth(),
        normal,
        peakRadiation,
      );
      const dot = normal.dot(sunDirection);
      for (let p = 0; p < m; p++) {
        const dmp = dm.clone().multiplyScalar(p);
        for (let q = 0; q < n; q++) {
          cellOutputs[p][q] += indirectRadiation;
          if (dot > 0) {
            v.copy(v0).add(dmp).add(dn.clone().multiplyScalar(q));
            if (!inShadow(uuid, v, sunDirection)) {
              // direct radiation
              cellOutputs[p][q] += dot * peakRadiation;
            }
          }
        }
      }
    }
  };

  const calculateSolarPanel = (panel: SolarPanelModel) => {
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z <= 0) return; // when the sun is not out
    let parent = getParent(panel);
    if (!parent) throw new Error('parent of solar panel does not exist');
    let rooftop = panel.parentType === ObjectType.Roof;
    const walltop = panel.parentType === ObjectType.Wall;
    if (rooftop) {
      // x and y coordinates of a rooftop solar panel are relative to the foundation
      parent = getFoundation(parent);
      if (!parent) throw new Error('foundation of solar panel does not exist');
    }
    const dayOfYear = Util.dayOfYear(now);
    const center = walltop
      ? Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent, getFoundation(panel), panel.lz)
      : Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent);
    const rot = parent.rotation[2];
    let zRot = rot + panel.relativeAzimuth;
    let angle = panel.tiltAngle;
    let flat = true;
    if (rooftop) {
      // z coordinate of a rooftop solar panel is absolute
      center.z = panel.cz + panel.lz + 0.02 + parent.cz + parent.lz / 2;
      if (Util.isZero(panel.rotation[0])) {
        // on a flat roof, add pole height
        center.z += panel.poleHeight;
      } else {
        // on a no-flat roof, ignore tilt angle
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
    const normal = new Vector3().fromArray(panel.normal);
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
    let cellOutputs = cellOutputsMapRef.current.get(panel.id);
    if (!cellOutputs || cellOutputs.length !== nx || cellOutputs[0].length !== ny) {
      cellOutputs = Array(nx)
        .fill(0)
        .map(() => Array(ny).fill(0));
      cellOutputsMapRef.current.set(panel.id, cellOutputs);
    }
    // normal has been set if it is on top of a tilted roof, but has not if it is on top of a foundation or flat roof.
    // so we only need to tilt the normal for a solar panel on a foundation or flat roof
    let normalEuler = new Euler(rooftop && !flat ? 0 : angle, 0, zRot, 'ZYX');
    if (panel.trackerType !== TrackerType.NO_TRACKER) {
      // dynamic angles
      const rotatedSunDirection = rot
        ? sunDirection.clone().applyAxisAngle(UNIT_VECTOR_POS_Z, -rot)
        : sunDirection.clone();
      switch (panel.trackerType) {
        case TrackerType.ALTAZIMUTH_DUAL_AXIS_TRACKER:
          const qRotAADAT = new Quaternion().setFromUnitVectors(UNIT_VECTOR_POS_Z, rotatedSunDirection);
          normalEuler = new Euler().setFromQuaternion(qRotAADAT);
          // the default order is XYZ, so we rotate the relative azimuth below using the z-component
          normalEuler.z += zRot;
          break;
        case TrackerType.HORIZONTAL_SINGLE_AXIS_TRACKER:
          const qRotHSAT = new Quaternion().setFromUnitVectors(
            UNIT_VECTOR_POS_Z,
            new Vector3(rotatedSunDirection.x, 0, rotatedSunDirection.z).normalize(),
          );
          normalEuler = new Euler().setFromQuaternion(qRotHSAT);
          // the default order is XYZ, so we rotate the relative azimuth below using the z-component
          normalEuler.z += zRot;
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
