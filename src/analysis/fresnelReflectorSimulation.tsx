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
import { Euler, Intersection, Object3D, Raycaster, Vector2, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useStore } from '../stores/common';
import * as Selector from 'src/stores/selector';
import { DatumEntry, ObjectType } from '../types';
import { Util } from '../Util';
import { AirMass } from './analysisConstants';
import { UNIT_VECTOR_POS_Z, ZERO_TOLERANCE } from '../constants';
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { FresnelReflectorModel } from '../models/FresnelReflectorModel';
import { FoundationModel } from '../models/FoundationModel';

export interface FresnelReflectorSimulationProps {
  city: string | null;
}

const FresnelReflectorSimulation = ({ city }: FresnelReflectorSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getWeather = useStore(Selector.getWeather);
  const getParent = useStore(Selector.getParent);
  const setDailyYield = useStore(Selector.setDailyFresnelReflectorYield);
  const updateDailyYield = useStore(Selector.updateSolarCollectorDailyYieldById);
  const dailyIndividualOutputs = useStore(Selector.dailyFresnelReflectorIndividualOutputs);
  const setFresnelReflectorLabels = useStore(Selector.setFresnelReflectorLabels);
  const runSimulation = useStore(Selector.runSimulationForFresnelReflectors);

  const { scene } = useThree();
  const lang = { lng: language };
  const weather = getWeather(city ?? 'Boston MA, USA');
  const elevation = city ? weather.elevation : 0;
  const interval = 60 / (world.cspTimesPerHour ?? 4);
  const ray = useMemo(() => new Raycaster(), []);
  const now = new Date(world.date);
  const dustLoss = 0.05;
  const cellSize = world.cspGridCellSize ?? 0.5;
  const objectsRef = useRef<Object3D[]>([]); // reuse array in intersection detection
  const intersectionsRef = useRef<Intersection[]>([]); // reuse array in intersection detection
  const requestRef = useRef<number>(0);
  const simulationCompletedRef = useRef<boolean>(false);
  const originalDateRef = useRef<Date>(new Date(world.date));
  const dailyOutputsMapRef = useRef<Map<string, number[]>>(new Map<string, number[]>());

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

  // getting ready for the simulation
  const init = () => {
    originalDateRef.current = new Date(world.date);
    // beginning from just a bit before sunrise
    now.setHours(Math.floor(sunMinutes.sunrise / 60), 0.5 * interval - 30);
    simulationCompletedRef.current = false;
    fetchObjects();
    // reset the result arrays
    for (const e of elements) {
      if (e.type === ObjectType.FresnelReflector) {
        const result = new Array(24).fill(0);
        dailyOutputsMapRef.current.set(e.id, result);
      }
    }
  };

  const simulate = () => {
    if (runSimulation) {
      const totalMinutes = now.getMinutes() + now.getHours() * 60;
      if (totalMinutes >= sunMinutes.sunset) {
        cancelAnimationFrame(requestRef.current);
        setCommonStore((state) => {
          state.runSimulationForFresnelReflectors = false;
          state.simulationInProgress = false;
          state.world.date = originalDateRef.current.toString();
          state.viewState.showDailyFresnelReflectorYieldPanel = true;
        });
        showInfo(i18n.t('message.SimulationCompleted', lang));
        simulationCompletedRef.current = true;
        finish();
        return;
      }
      // this is where time advances (by incrementing the minutes with the given interval)
      now.setHours(now.getHours(), now.getMinutes() + interval);
      setCommonStore((state) => {
        state.world.date = now.toString();
      });
      for (const e of elements) {
        if (e.type === ObjectType.FresnelReflector) {
          calculateYield(e as FresnelReflectorModel);
        }
      }
      // recursive call to the next step of the simulation
      requestRef.current = requestAnimationFrame(simulate);
    }
  };

  const finish = () => {
    // apply clearness and convert the unit of time step from minute to hour so that we get kWh
    const daylight = (sunMinutes.sunset - sunMinutes.sunrise) / 60;
    // divide by times per hour as the radiation is added up that many times
    const scale =
      daylight > ZERO_TOLERANCE
        ? weather.sunshineHours[now.getMonth()] / (30 * daylight * (world.cspTimesPerHour ?? 4))
        : 0;
    for (const e of elements) {
      if (e.type === ObjectType.FresnelReflector) {
        const reflector = e as FresnelReflectorModel;
        const result = dailyOutputsMapRef.current.get(reflector.id);
        if (result) {
          const factor =
            reflector.lx *
            reflector.ly *
            reflector.opticalEfficiency *
            reflector.thermalEfficiency *
            reflector.absorptance *
            reflector.reflectance *
            (1 - dustLoss);
          for (let i = 0; i < result.length; i++) {
            if (result[i] !== 0) result[i] *= factor * scale;
          }
        }
      }
    }
    generateDailyYieldData();
  };

  const generateDailyYieldData = () => {
    if (dailyIndividualOutputs) {
      const total = new Array(24).fill(0);
      const map = new Map<string, number[]>();
      let index = 0;
      const labels = [];
      for (const e of elements) {
        if (e.type === ObjectType.FresnelReflector) {
          const output = dailyOutputsMapRef.current.get(e.id);
          if (output) {
            updateDailyYield(
              e.id,
              output.reduce((a, b) => a + b, 0),
            );
            index++;
            map.set('Reflector' + index, output);
            labels.push(e.label ? e.label : 'Reflector' + index);
            for (let i = 0; i < 24; i++) {
              total[i] += output[i];
            }
          }
        }
      }
      const data = [];
      for (let i = 0; i < 24; i++) {
        const datum: DatumEntry = {};
        datum['Hour'] = i;
        for (let k = 1; k <= index; k++) {
          const key = 'Reflector' + k;
          datum[labels[k - 1]] = map.get(key)?.[i];
        }
        data.push(datum);
      }
      setDailyYield(data);
      setFresnelReflectorLabels(labels);
    } else {
      const total = new Array(24).fill(0);
      for (const e of elements) {
        if (e.type === ObjectType.FresnelReflector) {
          const output = dailyOutputsMapRef.current.get(e.id);
          if (output) {
            updateDailyYield(
              e.id,
              output.reduce((a, b) => a + b, 0),
            );
            for (let i = 0; i < 24; i++) {
              total[i] += output[i];
            }
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

  // there is room for performance improvement if we figure out a way to cache a lot of things used below
  const calculateYield = (reflector: FresnelReflectorModel) => {
    const parent = getParent(reflector);
    if (!parent) throw new Error('parent of Fresnel reflector does not exist');
    if (parent.type !== ObjectType.Foundation) return;
    const dayOfYear = Util.dayOfYear(now);
    const foundation = parent as FoundationModel;
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
    const cellOutputs = Array(nx)
      .fill(0)
      .map(() => Array(ny).fill(0));
    const rot = parent.rotation[2];
    const zRot = rot + reflector.relativeAzimuth;
    const zRotZero = Util.isZero(zRot);
    const cosRot = zRotZero ? 1 : Math.cos(zRot);
    const sinRot = zRotZero ? 0 : Math.sin(zRot);
    // convert the receiver's coordinates into those relative to the center of this reflector
    const receiverCenter = foundation.solarReceiver
      ? new Vector3(
          foundation.cx - reflector.cx,
          foundation.cy - reflector.cy,
          foundation.lz - reflector.cz + (foundation.solarReceiverTubeMountHeight ?? 10),
        )
      : undefined;
    // the rotation axis is in the north-south direction, so the relative azimuth is zero, which maps to (0, 1, 0)
    const rotationAxis = new Vector3(sinRot, cosRot, 0);
    const shiftedReceiverCenter = new Vector3();
    const sunDirection = getSunDirection(now, world.latitude);
    if (sunDirection.z > 0) {
      // when the sun is out
      if (receiverCenter) {
        // the reflector moves only when there is a receiver
        shiftedReceiverCenter.set(receiverCenter.x, receiverCenter.y, receiverCenter.z);
        // how much the reflected light should shift in the direction of the receiver tube?
        const shift =
          sunDirection.z < ZERO_TOLERANCE
            ? 0
            : (-receiverCenter.z * (sunDirection.y * rotationAxis.y + sunDirection.x * rotationAxis.x)) /
              sunDirection.z;
        shiftedReceiverCenter.x += shift * rotationAxis.x;
        shiftedReceiverCenter.y -= shift * rotationAxis.y;
        const reflectorToReceiver = shiftedReceiverCenter.clone().normalize();
        // no need to normalize as both vectors to add have already been normalized
        let normalVector = reflectorToReceiver.add(sunDirection).multiplyScalar(0.5);
        if (Util.isSame(normalVector, UNIT_VECTOR_POS_Z)) {
          normalVector = new Vector3(-0.001, 0, 1).normalize();
        }
        normal.copy(
          originalNormal.clone().applyEuler(new Euler(0, Math.atan2(normalVector.x, normalVector.z), 0, 'ZXY')),
        );
      }
      const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
      const indirectRadiation = calculateDiffuseAndReflectedRadiation(
        world.ground,
        now.getMonth(),
        normal,
        peakRadiation,
      );
      const dot = normal.dot(sunDirection);
      const v2 = new Vector2();
      let tmpX = 0;
      for (let ku = 0; ku < nx; ku++) {
        tmpX = x0 + ku * dx;
        for (let kv = 0; kv < ny; kv++) {
          cellOutputs[ku][kv] += indirectRadiation;
          if (dot > 0) {
            v2.set(tmpX, y0 + kv * dy);
            if (!zRotZero) v2.rotateAround(center2d, zRot);
            v.set(v2.x, v2.y, z0);
            if (!inShadow(reflector.id, v, sunDirection)) {
              cellOutputs[ku][kv] += dot * peakRadiation;
            }
          }
        }
      }
      const output = dailyOutputsMapRef.current.get(reflector.id);
      if (output) {
        let sum = 0;
        for (let kx = 0; kx < nx; kx++) {
          for (let ky = 0; ky < ny; ky++) {
            sum += cellOutputs[kx][ky];
          }
        }
        output[now.getHours()] += sum / (nx * ny);
      }
    }
  };

  const inShadow = (reflectorId: string, position: Vector3, sunDirection: Vector3) => {
    if (objectsRef.current.length > 1) {
      intersectionsRef.current.length = 0;
      ray.set(position, sunDirection);
      const objects = objectsRef.current.filter((obj) => obj.uuid !== reflectorId);
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

  return <></>;
};

export default React.memo(FresnelReflectorSimulation);
