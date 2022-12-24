/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { useStore } from '../stores/common';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import * as Selector from '../stores/selector';
import { RoofModel, RoofType } from '../models/RoofModel';
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { DiurnalTemperatureModel, ObjectType } from '../types';
import { Util } from '../Util';
import { MINUTES_OF_DAY } from './analysisConstants';
import { WallModel } from '../models/WallModel';
import { computeOutsideTemperature, getOutsideTemperatureAtMinute } from './heatTools';
import {
  computeDeclinationAngle,
  computeHourAngle,
  computeSunLocation,
  computeSunriseAndSunsetInMinutes,
} from './sunTools';
import { WindowModel } from '../models/WindowModel';
import { DoorModel } from '../models/DoorModel';
import { Point2 } from '../models/Point2';
import { useThree } from '@react-three/fiber';
import { Intersection, Object3D, Raycaster, Vector3 } from 'three';
import { SolarRadiation } from './SolarRadiation';
import { ZERO_TOLERANCE } from '../constants';
import { FoundationModel } from '../models/FoundationModel';

interface ThermalSimulationProps {
  city: string | null;
}

interface RoofSegmentResult {
  surfaceTemperature: number;
  totalArea: number;
}

const ThermalSimulation = ({ city }: ThermalSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getWeather = useStore(Selector.getWeather);
  const getFoundation = useStore(Selector.getFoundation);
  const getParent = useStore(Selector.getParent);
  const getChildrenOfType = useStore(Selector.getChildrenOfType);
  const runDailySimulation = useStore(Selector.runDailyThermalSimulation);
  const pauseDailySimulation = useStore(Selector.pauseDailyThermalSimulation);
  const runYearlySimulation = useStore(Selector.runYearlyThermalSimulation);
  const pauseYearlySimulation = useStore(Selector.pauseYearlyThermalSimulation);
  const noAnimation = !!useStore(Selector.world.noAnimationForThermalSimulation);
  const getRoofSegmentVerticesWithoutOverhang = useStore(Selector.getRoofSegmentVerticesWithoutOverhang);
  const highestTemperatureTimeInMinutes = useStore(Selector.world.highestTemperatureTimeInMinutes) ?? 900;
  const setHourlyHeatExchangeArray = usePrimitiveStore(Selector.setHourlyHeatExchangeArray);
  const setMonthlyHeatingArray = usePrimitiveStore(Selector.setMonthlyHeatingArray);
  const setMonthlyCoolingArray = usePrimitiveStore(Selector.setMonthlyCoolingArray);
  const showDailyBuildingEnergyPanel = useStore(Selector.viewState.showDailyBuildingEnergyPanel);

  const requestRef = useRef<number>(0);
  const simulationCompletedRef = useRef<boolean>(false);
  const originalDateRef = useRef<Date>(new Date(world.date));
  const sampledDayRef = useRef<number>(0);
  const pauseRef = useRef<boolean>(false);
  const pausedDateRef = useRef<Date>(new Date(world.date));
  const dayRef = useRef<number>(0);
  const outsideTemperatureRangeRef = useRef<{ high: number; low: number }>({ high: 20, low: 0 });
  const currentOutsideTemperatureRef = useRef<number>(20);
  const hourlyHeatExchangeArrayMapRef = useRef<Map<string, number[]>>(new Map<string, number[]>());
  const monthlyHeatingArrayMapRef = useRef<Map<string, number[]>>(new Map<string, number[]>());
  const monthlyCoolingArrayMapRef = useRef<Map<string, number[]>>(new Map<string, number[]>());
  const objectsRef = useRef<Object3D[]>([]); // reuse array in intersection detection
  const intersectionsRef = useRef<Intersection[]>([]); // reuse array in intersection detection
  const sunDirectionRef = useRef<Vector3>();

  const lang = { lng: language };
  const weather = getWeather(city ?? 'Boston MA, USA');
  const elevation = city ? weather?.elevation : 0;
  const now = new Date(world.date);
  const timesPerHour = world.timesPerHour ?? 4;
  const minuteInterval = 60 / timesPerHour;
  const daysPerYear = world.daysPerYear ?? 6;
  const monthInterval = 12 / daysPerYear;
  const { scene } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const sunMinutes = useMemo(() => {
    return computeSunriseAndSunsetInMinutes(now, world.latitude);
  }, [world.date, world.latitude]);

  const calculateSunDirection = () => {
    return computeSunLocation(
      1,
      computeHourAngle(now),
      computeDeclinationAngle(now),
      Util.toRadians(world.latitude),
    ).normalize();
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

  const updateTemperature = (currentTime: Date) => {
    if (weather) {
      // get the highest and lowest temperatures of the day from the weather data
      outsideTemperatureRangeRef.current = computeOutsideTemperature(
        now,
        weather.lowestTemperatures,
        weather.highestTemperatures,
      );
      // get the air temperature at the current time
      currentOutsideTemperatureRef.current = getOutsideTemperatureAtMinute(
        outsideTemperatureRangeRef.current.high,
        outsideTemperatureRangeRef.current.low,
        world.diurnalTemperatureModel ?? DiurnalTemperatureModel.Sinusoidal,
        highestTemperatureTimeInMinutes,
        computeSunriseAndSunsetInMinutes(currentTime, world.latitude),
        Util.minutesIntoDay(currentTime),
      );
    }
  };

  /*
   If the lowest outside temperature is higher than the threshold, don't turn on the heater.
   If the highest outside temperature is lower than the threshold, don't turn on the air conditioner.
  */
  const computeEnergyUsage = (heatExchange: number, setpoint: number, threshold: number) => {
    if (
      (heatExchange < 0 && outsideTemperatureRangeRef.current.low >= setpoint - threshold) ||
      (heatExchange > 0 && outsideTemperatureRangeRef.current.high <= setpoint + threshold)
    )
      return 0;
    // negative heat exchange goes to heater, positive heat exchange goes to air conditioner
    return heatExchange;
  };

  const updateHeatExchangeNow = (id: string, heatExchange: number) => {
    let a = hourlyHeatExchangeArrayMapRef.current.get(id);
    if (!a) {
      a = new Array(24).fill(0);
      hourlyHeatExchangeArrayMapRef.current.set(id, a);
    }
    a[now.getHours()] += heatExchange;
  };

  const resetHourlyHeatExchangeMap = () => {
    for (const e of elements) {
      if (Util.isThermal(e)) {
        hourlyHeatExchangeArrayMapRef.current.get(e.id)?.fill(0);
      }
    }
  };

  const resetMonthlyEnergyMap = () => {
    for (const e of elements) {
      if (Util.isThermal(e)) {
        const monthlyHeating = monthlyHeatingArrayMapRef.current.get(e.id);
        if (monthlyHeating && monthlyHeating.length === daysPerYear) {
          monthlyHeating.fill(0);
        } else {
          monthlyHeatingArrayMapRef.current.set(e.id, new Array(daysPerYear).fill(0));
        }
        const monthlyCooling = monthlyCoolingArrayMapRef.current.get(e.id);
        if (monthlyCooling && monthlyCooling.length === daysPerYear) {
          monthlyCooling.fill(0);
        } else {
          monthlyCoolingArrayMapRef.current.set(e.id, new Array(daysPerYear).fill(0));
        }
      }
    }
  };

  /* do the daily simulation to generate hourly data and daily total */

  useEffect(() => {
    if (runDailySimulation) {
      if (noAnimation && !Util.hasMovingParts(elements)) {
        staticCalculateDaily();
      } else {
        fetchObjects();
        initDaily();
        requestRef.current = requestAnimationFrame(calculateDaily);
        return () => {
          // this is called when the recursive call of requestAnimationFrame exits
          cancelAnimationFrame(requestRef.current);
          if (!simulationCompletedRef.current) {
            showInfo(i18n.t('message.SimulationAborted', lang));
            setCommonStore((state) => {
              state.world.date = originalDateRef.current.toLocaleString('en-US');
              state.simulationInProgress = false;
              state.simulationPaused = false;
            });
          }
          pauseRef.current = false;
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runDailySimulation]);

  useEffect(() => {
    pauseRef.current = pauseDailySimulation;
    if (pauseDailySimulation) {
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
      calculateDaily();
    }
  }, [pauseDailySimulation]);

  // TODO
  const staticCalculateDaily = () => {
    computeNow();
  };

  const initDaily = () => {
    if (pauseRef.current) {
      // if the simulation has been paused, continue from the paused date
      now.setTime(pausedDateRef.current.getTime());
      pauseRef.current = false;
    } else {
      originalDateRef.current = new Date(world.date);
      dayRef.current = Util.dayOfYear(now);
      // start from minuteInterval/2 so that the sampling points are evenly distributed within an hour
      now.setHours(0, minuteInterval / 2);
    }
    simulationCompletedRef.current = false;
    resetHourlyHeatExchangeMap();
  };

  const finishDaily = () => {
    for (const e of elements) {
      if (Util.isThermal(e)) {
        const arr = hourlyHeatExchangeArrayMapRef.current.get(e.id);
        if (arr) {
          setHourlyHeatExchangeArray(e.id, [...arr]);
        }
      }
    }
  };

  const calculateDaily = () => {
    if (runDailySimulation && !pauseRef.current) {
      const totalMinutes =
        now.getMinutes() + now.getHours() * 60 + (Util.dayOfYear(now) - dayRef.current) * MINUTES_OF_DAY;
      if (totalMinutes + minuteInterval > MINUTES_OF_DAY) {
        computeNow();
        cancelAnimationFrame(requestRef.current);
        setCommonStore((state) => {
          state.runDailyThermalSimulation = false;
          state.simulationInProgress = false;
          state.simulationPaused = false;
          state.world.date = originalDateRef.current.toLocaleString('en-US');
          state.viewState.showDailyBuildingEnergyPanel = true;
        });
        showInfo(i18n.t('message.SimulationCompleted', lang));
        simulationCompletedRef.current = true;
        finishDaily();
        return;
      }
      // this forces the scene to be re-rendered
      setCommonStore((state) => {
        state.world.date = now.toLocaleString('en-US');
      });
      computeNow();
      // recursive call to the next step of the simulation
      requestRef.current = requestAnimationFrame(calculateDaily);
      // this is where time advances (by incrementing the minutes with the given interval)
      // minutes more than 60 results in the increase of the hour accordingly
      now.setHours(now.getHours(), now.getMinutes() + minuteInterval);
    }
  };

  // yearly simulation

  useEffect(() => {
    if (runYearlySimulation) {
      if (noAnimation && !Util.hasMovingParts(elements)) {
        // this causes the simulation code to run at the beginning of the next event cycle
        // that hopefully has the updated scene graph
        setTimeout(() => {
          //staticSimulateYearly(false);
        }, 50);
      } else {
        fetchObjects();
        initYearly();
        requestRef.current = requestAnimationFrame(simulateYearly);
        return () => {
          // this is called when the recursive call of requestAnimationFrame exits
          cancelAnimationFrame(requestRef.current);
          if (!simulationCompletedRef.current) {
            showInfo(i18n.t('message.SimulationAborted', lang));
            setCommonStore((state) => {
              state.world.date = originalDateRef.current.toLocaleString('en-US');
              state.simulationInProgress = false;
              state.simulationPaused = false;
            });
          }
          pauseRef.current = false;
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runYearlySimulation]);

  useEffect(() => {
    pauseRef.current = pauseYearlySimulation;
    if (pauseYearlySimulation) {
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
      simulateYearly();
    }
  }, [pauseYearlySimulation]);

  const initYearly = () => {
    if (pauseRef.current) {
      // if the simulation has been paused, continue from the paused date
      now.setTime(pausedDateRef.current.getTime());
      pauseRef.current = false;
    } else {
      originalDateRef.current = new Date(world.date);
      sampledDayRef.current = 0;
      now.setMonth(0, 22); // begin from January, 22
      dayRef.current = Util.dayOfYear(now);
      now.setHours(0, minuteInterval / 2);
      // set the initial date so that the scene gets a chance to render before the simulation starts
      setCommonStore((state) => {
        state.world.date = now.toLocaleString('en-US');
      });
    }
    resetHourlyHeatExchangeMap();
    resetMonthlyEnergyMap();
    simulationCompletedRef.current = false;
  };

  const simulateYearly = () => {
    if (runYearlySimulation && !pauseRef.current) {
      const totalMinutes =
        now.getMinutes() + now.getHours() * 60 + (Util.dayOfYear(now) - dayRef.current) * MINUTES_OF_DAY;
      if (totalMinutes < MINUTES_OF_DAY + minuteInterval / 2) {
        // this is where time advances (by incrementing the minutes with the given interval)
        setCommonStore((state) => {
          state.world.date = now.toLocaleString('en-US');
        });
        computeNow();
        now.setHours(now.getHours(), now.getMinutes() + minuteInterval);
        // recursive call to the next step of the simulation within the current day
        requestRef.current = requestAnimationFrame(simulateYearly);
      } else {
        finishMonthly();
        sampledDayRef.current++;
        if (sampledDayRef.current === daysPerYear) {
          cancelAnimationFrame(requestRef.current);
          setCommonStore((state) => {
            state.runYearlyThermalSimulation = false;
            state.simulationInProgress = false;
            state.simulationPaused = false;
            state.world.date = originalDateRef.current.toLocaleString('en-US');
            state.viewState.showYearlyBuildingEnergyPanel = true;
          });
          showInfo(i18n.t('message.SimulationCompleted', lang));
          simulationCompletedRef.current = true;
          //generateYearlyData();
          return;
        }
        // go to the next month
        now.setMonth(sampledDayRef.current * monthInterval, 22);
        now.setHours(0, minuteInterval / 2);
        dayRef.current = Util.dayOfYear(now);
        resetHourlyHeatExchangeMap();
        // recursive call to the next step of the simulation
        requestRef.current = requestAnimationFrame(simulateYearly);
      }
    }
  };

  const finishMonthly = () => {
    for (const e of elements) {
      if (Util.isThermal(e)) {
        const exchange = hourlyHeatExchangeArrayMapRef.current.get(e.id);
        if (exchange) {
          const heating = monthlyHeatingArrayMapRef.current.get(e.id);
          const cooling = monthlyCoolingArrayMapRef.current.get(e.id);
          if (heating && cooling) {
            for (const e of exchange) {
              if (e < 0) {
                heating[sampledDayRef.current] += e;
              } else {
                cooling[sampledDayRef.current] += e;
              }
            }
            setMonthlyHeatingArray(e.id, [...heating]);
            setMonthlyCoolingArray(e.id, [...cooling]);
          }
        }
      }
    }
    if (showDailyBuildingEnergyPanel) {
      finishDaily();
    }
  };

  // functions shared by daily and yearly simulations

  const computeNow = () => {
    updateTemperature(now);
    sunDirectionRef.current = calculateSunDirection();
    for (const e of elements) {
      switch (e.type) {
        case ObjectType.Door:
          calculateDoor(e as DoorModel);
          break;
        case ObjectType.Window:
          calculateWindow(e as WindowModel);
          break;
        case ObjectType.Wall:
          calculateWall(e as WallModel);
          break;
        case ObjectType.Roof:
          calculateRoof(e as RoofModel);
          break;
      }
    }
  };

  const calculateWindow = (window: WindowModel) => {
    const foundation = getFoundation(window);
    if (foundation) {
      const parent = getParent(window);
      if (parent) {
        const setpoint = foundation.hvacSystem?.thermostatSetpoint ?? 20;
        const threshold = foundation.hvacSystem?.temperatureThreshold ?? 3;
        const area = Util.getWindowArea(window, parent);
        const deltaT = currentOutsideTemperatureRef.current - setpoint;
        // convert heat exchange to kWh
        const heatExchange = computeEnergyUsage(
          (deltaT * area * (window.uValue ?? 2) * 0.001) / timesPerHour,
          setpoint,
          threshold,
        );
        updateHeatExchangeNow(window.id, heatExchange);
      }
    }
  };

  const calculateDoor = (door: DoorModel) => {
    const foundation = getFoundation(door);
    if (foundation) {
      const parent = getParent(door);
      if (parent) {
        const absorption = Util.getLightAbsorption(door);
        let totalSolarHeat = 0;
        // when the sun is out
        if (!Util.isZero(absorption) && sunDirectionRef.current && sunDirectionRef.current.z > 0) {
          const solarRadiationEnergy = SolarRadiation.computeDoorSolarRadiationEnergy(
            now,
            world,
            sunDirectionRef.current,
            door,
            parent as WallModel,
            foundation,
            elevation,
            inShadow,
          );
          if (solarRadiationEnergy) {
            // apply clearness and convert the unit of time step from minute to hour so that we get kWh
            const daylight = sunMinutes.daylight() / 60;
            // divide by times per hour as the radiation is added up that many times
            const scaleFactor =
              daylight > ZERO_TOLERANCE
                ? weather.sunshineHours[now.getMonth()] / (30 * daylight * world.timesPerHour)
                : 0;
            for (let i = 0; i < solarRadiationEnergy.length; i++) {
              for (let j = 0; j < solarRadiationEnergy[i].length; j++) {
                totalSolarHeat += solarRadiationEnergy[i][j] * scaleFactor;
              }
            }
          }
        }
        const setpoint = foundation.hvacSystem?.thermostatSetpoint ?? 20;
        const threshold = foundation.hvacSystem?.temperatureThreshold ?? 3;
        const area = door.lx * door.lz * parent.lx * parent.lz;
        const extraT =
          totalSolarHeat === 0
            ? 0
            : (totalSolarHeat * absorption) / ((door.volumetricHeatCapacity ?? 0.5) * area * Math.max(door.ly, 0.1));
        const deltaT = currentOutsideTemperatureRef.current + extraT - setpoint;
        // convert heat exchange to kWh
        const heatExchange = computeEnergyUsage(
          (deltaT * area * (door.uValue ?? 2) * 0.001) / timesPerHour,
          setpoint,
          threshold,
        );
        updateHeatExchangeNow(door.id, heatExchange);
      }
    }
  };

  const calculateWall = (wall: WallModel) => {
    const foundation = getFoundation(wall);
    if (foundation) {
      const windows = getChildrenOfType(ObjectType.Window, wall.id);
      const doors = getChildrenOfType(ObjectType.Door, wall.id);
      const absorption = Util.getLightAbsorption(wall);
      let totalSolarHeat = 0;
      // when the sun is out
      if (!Util.isZero(absorption) && sunDirectionRef.current && sunDirectionRef.current.z > 0) {
        const solarPanels = getChildrenOfType(ObjectType.SolarPanel, wall.id);
        const solarRadiationEnergy = SolarRadiation.computeWallSolarRadiationEnergy(
          now,
          world,
          sunDirectionRef.current,
          wall,
          foundation,
          windows,
          doors,
          solarPanels,
          elevation,
          inShadow,
        );
        if (solarRadiationEnergy) {
          // apply clearness and convert the unit of time step from minute to hour so that we get kWh
          const daylight = sunMinutes.daylight() / 60;
          // divide by times per hour as the radiation is added up that many times
          const scaleFactor =
            daylight > ZERO_TOLERANCE
              ? weather.sunshineHours[now.getMonth()] / (30 * daylight * world.timesPerHour)
              : 0;
          for (let i = 0; i < solarRadiationEnergy.length; i++) {
            for (let j = 0; j < solarRadiationEnergy[i].length; j++) {
              totalSolarHeat += solarRadiationEnergy[i][j] * scaleFactor;
            }
          }
        }
      }
      const polygon = Util.getWallVertices(wall, 0);
      let area = Util.getPolygonArea(polygon);
      if (windows && windows.length > 0) {
        for (const w of windows) {
          area -= Util.getWindowArea(w as WindowModel, wall);
        }
      }
      if (doors && doors.length > 0) {
        for (const d of doors) {
          area -= d.lx * d.lz * wall.lx * wall.lz;
        }
      }
      const setpoint = foundation.hvacSystem?.thermostatSetpoint ?? 20;
      const threshold = foundation.hvacSystem?.temperatureThreshold ?? 3;
      const extraT =
        totalSolarHeat === 0
          ? 0
          : (totalSolarHeat * absorption) / ((wall.volumetricHeatCapacity ?? 0.5) * area * wall.ly);
      const deltaT = currentOutsideTemperatureRef.current + extraT - setpoint;
      // U is the inverse of R with SI units of W/(m^2⋅K), we convert the energy unit to kWh here
      const heatExchange = computeEnergyUsage(
        (((deltaT * area) / (wall.rValue ?? 0.5)) * 0.001) / timesPerHour,
        setpoint,
        threshold,
      );
      updateHeatExchangeNow(wall.id, heatExchange);
    }
  };

  const calculateRoof = (roof: RoofModel) => {
    const foundation = getFoundation(roof);
    if (!foundation) return;
    const segments = getRoofSegmentVerticesWithoutOverhang(roof.id);
    if (!segments) return;
    let roofSegmentResults = undefined;
    switch (roof.roofType) {
      case RoofType.Pyramid:
        roofSegmentResults = calculatePyramidRoof(roof, segments, foundation);
        break;
      case RoofType.Hip:
        roofSegmentResults = calculateHipRoof(roof, segments);
        break;
      case RoofType.Gable:
      case RoofType.Gambrel:
        roofSegmentResults = calculateGableRoof(roof, segments, foundation);
        break;
      case RoofType.Mansard:
        roofSegmentResults = calculateMansardRoof(roof, segments);
        break;
    }
    if (roofSegmentResults) {
      console.log(now, roofSegmentResults);
      const setpoint = foundation.hvacSystem?.thermostatSetpoint ?? 20;
      const threshold = foundation.hvacSystem?.temperatureThreshold ?? 3;
      let heatExchange = 0;
      for (const segmentResult of roofSegmentResults) {
        const deltaT = segmentResult.surfaceTemperature - setpoint;
        // convert heat exchange to kWh
        heatExchange += computeEnergyUsage(
          (((deltaT * segmentResult.totalArea) / (roof.rValue ?? 0.5)) * 0.001) / timesPerHour,
          setpoint,
          threshold,
        );
      }
      updateHeatExchangeNow(roof.id, heatExchange);
    }
  };

  const calculatePyramidRoof = (roof: RoofModel, segments: Vector3[][], foundation: FoundationModel) => {
    if (roof.roofType !== RoofType.Pyramid) throw new Error('roof is not pyramid');
    const n = segments.length;
    if (n === 0) return;
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
    const totalAreas: number[] = [];
    if (flat) {
      let totalArea = 0;
      for (const s of segments) {
        totalArea += Util.getTriangleArea(s[0], s[1], s[2]);
      }
      totalAreas.push(totalArea);
    } else {
      for (const s of segments) {
        totalAreas.push(Util.getTriangleArea(s[0], s[1], s[2]));
      }
    }
    const absorption = Util.getLightAbsorption(roof);
    const m = flat ? 1 : n;
    const totalSolarHeats: number[] = Array(m).fill(0);
    // when the sun is out
    if (!Util.isZero(absorption) && sunDirectionRef.current && sunDirectionRef.current.z > 0) {
      const solarRadiationEnergySegments = SolarRadiation.computePyramidRoofSolarRadiationEnergy(
        now,
        world,
        sunDirectionRef.current,
        roof,
        flat,
        segments,
        foundation,
        getChildrenOfType(ObjectType.SolarPanel, roof.id),
        elevation,
        inShadow,
      );
      if (solarRadiationEnergySegments) {
        // apply clearness and convert the unit of time step from minute to hour so that we get kWh
        const daylight = sunMinutes.daylight() / 60;
        // divide by times per hour as the radiation is added up that many times
        const scaleFactor =
          daylight > ZERO_TOLERANCE ? weather.sunshineHours[now.getMonth()] / (30 * daylight * world.timesPerHour) : 0;
        for (let k = 0; k < m; k++) {
          const seg = solarRadiationEnergySegments[k];
          for (let i = 0; i < seg.length; i++) {
            for (let j = 0; j < seg[i].length; j++) {
              totalSolarHeats[k] += seg[i][j] * scaleFactor;
            }
          }
        }
      }
    }
    const extraT: number[] = Array(m).fill(0);
    const results: RoofSegmentResult[] = [];
    for (let k = 0; k < m; k++) {
      if (totalSolarHeats[k] !== 0) {
        extraT[k] =
          (totalSolarHeats[k] * absorption) / ((roof.volumetricHeatCapacity ?? 0.5) * totalAreas[k] * roof.thickness);
      }
      results.push({
        surfaceTemperature: currentOutsideTemperatureRef.current + extraT[k],
        totalArea: totalAreas[k],
      } as RoofSegmentResult);
    }
    return results;
  };

  const calculateHipRoof = (roof: RoofModel, segments: Vector3[][]) => {
    if (roof.roofType !== RoofType.Hip) throw new Error('roof is not hip');
    let totalArea = 0;
    for (const s of segments) {
      if (s.length === 3) {
        totalArea += Util.getTriangleArea(s[0], s[1], s[2]);
      } else if (s.length === 4) {
        totalArea += Util.getTriangleArea(s[0], s[1], s[2]);
        totalArea += Util.getTriangleArea(s[2], s[3], s[0]);
      }
    }
    const surfaceTemperature = currentOutsideTemperatureRef.current;
    return [{ surfaceTemperature: surfaceTemperature, totalArea: totalArea } as RoofSegmentResult];
  };

  const calculateGableRoof = (roof: RoofModel, segments: Vector3[][], foundation: FoundationModel) => {
    if (roof.roofType !== RoofType.Gable && roof.roofType !== RoofType.Gambrel)
      throw new Error('roof is not gable or gambrel');
    const n = segments.length;
    if (n === 0) return;
    const totalAreas: number[] = [];
    for (const s of segments) {
      totalAreas.push(Util.getTriangleArea(s[0], s[1], s[2]) + Util.getTriangleArea(s[2], s[3], s[0]));
    }
    const absorption = Util.getLightAbsorption(roof);
    const totalSolarHeats: number[] = Array(n).fill(0);
    // when the sun is out
    if (!Util.isZero(absorption) && sunDirectionRef.current && sunDirectionRef.current.z > 0) {
      const solarRadiationEnergySegments = SolarRadiation.computeGableRoofSolarRadiationEnergy(
        now,
        world,
        sunDirectionRef.current,
        roof,
        segments,
        foundation,
        getChildrenOfType(ObjectType.SolarPanel, roof.id),
        elevation,
        inShadow,
      );
      if (solarRadiationEnergySegments) {
        // apply clearness and convert the unit of time step from minute to hour so that we get kWh
        const daylight = sunMinutes.daylight() / 60;
        // divide by times per hour as the radiation is added up that many times
        const scaleFactor =
          daylight > ZERO_TOLERANCE ? weather.sunshineHours[now.getMonth()] / (30 * daylight * world.timesPerHour) : 0;
        for (let k = 0; k < n; k++) {
          const seg = solarRadiationEnergySegments[k];
          for (let i = 0; i < seg.length; i++) {
            for (let j = 0; j < seg[i].length; j++) {
              totalSolarHeats[k] += seg[i][j] * scaleFactor;
            }
          }
        }
      }
    }
    const extraT: number[] = Array(n).fill(0);
    const results: RoofSegmentResult[] = [];
    for (let k = 0; k < n; k++) {
      if (totalSolarHeats[k] !== 0) {
        extraT[k] =
          (totalSolarHeats[k] * absorption) / ((roof.volumetricHeatCapacity ?? 0.5) * totalAreas[k] * roof.thickness);
      }
      results.push({
        surfaceTemperature: currentOutsideTemperatureRef.current + extraT[k],
        totalArea: totalAreas[k],
      } as RoofSegmentResult);
    }
    return results;
  };

  const calculateMansardRoof = (roof: RoofModel, segments: Vector3[][]) => {
    if (roof.roofType !== RoofType.Mansard) throw new Error('roof is not mansard');
    let totalArea = 0;
    const n = segments.length;
    for (let i = 0; i < n - 1; i++) {
      const s = segments[i];
      totalArea += Util.getTriangleArea(s[0], s[1], s[2]);
      totalArea += Util.getTriangleArea(s[2], s[3], s[0]);
    }
    // the last segment may not be a quad
    const s = segments[n - 1];
    const points = new Array<Point2>();
    for (const p of s) {
      points.push({ x: p.x, y: p.y } as Point2);
    }
    totalArea += Util.getPolygonArea(points);
    const surfaceTemperature = currentOutsideTemperatureRef.current;
    return [{ surfaceTemperature: surfaceTemperature, totalArea: totalArea } as RoofSegmentResult];
  };

  return <></>;
};

export default React.memo(ThermalSimulation);
