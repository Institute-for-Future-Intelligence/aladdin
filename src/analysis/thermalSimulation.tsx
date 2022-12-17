/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
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
import { computeSunriseAndSunsetInMinutes } from './sunTools';
import { WindowModel } from '../models/WindowModel';
import { DoorModel } from '../models/DoorModel';
import { Point2 } from '../models/Point2';

export interface ThermalSimulationProps {
  city: string | null;
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

  const lang = { lng: language };
  const weather = getWeather(city ?? 'Boston MA, USA');
  const now = new Date(world.date);
  const timesPerHour = world.timesPerHour ?? 4;
  const minuteInterval = 60 / timesPerHour;

  // get the highest and lowest temperatures of the day from the weather data
  useEffect(() => {
    if (weather) {
      outsideTemperatureRangeRef.current = computeOutsideTemperature(
        new Date(world.date),
        weather.lowestTemperatures,
        weather.highestTemperatures,
      );
    }
  }, [world.date, weather?.lowestTemperatures, weather?.highestTemperatures]);

  // get the air temperature at the current time
  const updateTemperature = (currentTime: Date) => {
    currentOutsideTemperatureRef.current = getOutsideTemperatureAtMinute(
      outsideTemperatureRangeRef.current.high,
      outsideTemperatureRangeRef.current.low,
      world.diurnalTemperatureModel ?? DiurnalTemperatureModel.Sinusoidal,
      highestTemperatureTimeInMinutes,
      computeSunriseAndSunsetInMinutes(currentTime, world.latitude),
      Util.minutesIntoDay(currentTime),
    );
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
    a[now.getHours()] = heatExchange;
  };

  const resetHourlyHeatExchangeMap = () => {
    for (const e of elements) {
      if (Util.isThermal(e)) {
        hourlyHeatExchangeArrayMapRef.current.get(e.id)?.fill(0);
      }
    }
  };

  /* do the daily simulation to generate hourly data and daily total */

  useEffect(() => {
    if (runDailySimulation) {
      if (noAnimation && !Util.hasMovingParts(elements)) {
        staticCalculateDaily();
      } else {
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
    updateTemperature(now);
    for (const e of elements) {
      switch (e.type) {
        case ObjectType.Window:
          calculateWindow(e as WindowModel);
          break;
        case ObjectType.Door:
          calculateDoor(e as DoorModel);
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

  const initDaily = () => {
    if (pauseRef.current) {
      // if the simulation has been paused, continue from the paused date
      now.setTime(pausedDateRef.current.getTime());
      pauseRef.current = false;
    } else {
      originalDateRef.current = new Date(world.date);
      dayRef.current = now.getDay();
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
      const totalMinutes = now.getMinutes() + now.getHours() * 60 + (now.getDay() - dayRef.current) * MINUTES_OF_DAY;
      if (totalMinutes + minuteInterval >= MINUTES_OF_DAY) {
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
      // this is where time advances (by incrementing the minutes with the given interval)
      // minutes more than 60 results in the increase of the hour accordingly
      now.setHours(now.getHours(), now.getMinutes() + minuteInterval);
      // this forces the scene to be re-rendered
      setCommonStore((state) => {
        state.world.date = now.toLocaleString('en-US');
      });
      updateTemperature(now);
      for (const e of elements) {
        switch (e.type) {
          case ObjectType.Wall:
            calculateWall(e as WallModel);
            break;
          case ObjectType.Roof:
            calculateRoof(e as RoofModel);
            break;
          case ObjectType.Window:
            calculateWindow(e as WindowModel);
            break;
          case ObjectType.Door:
            calculateDoor(e as DoorModel);
            break;
        }
      }
      // recursive call to the next step of the simulation
      requestRef.current = requestAnimationFrame(calculateDaily);
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
        const setpoint = foundation.hvacSystem?.thermostatSetpoint ?? 20;
        const threshold = foundation.hvacSystem?.temperatureThreshold ?? 3;
        const area = door.lx * door.lz * parent.lx * parent.lz;
        const deltaT = currentOutsideTemperatureRef.current - setpoint;
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
      const polygon = Util.getWallVertices(wall, 0);
      let area = Util.getPolygonArea(polygon);
      const windows = getChildrenOfType(ObjectType.Window, wall.id);
      if (windows && windows.length > 0) {
        for (const w of windows) {
          area -= Util.getWindowArea(w as WindowModel, wall);
        }
      }
      const doors = getChildrenOfType(ObjectType.Door, wall.id);
      if (doors && doors.length > 0) {
        for (const d of doors) {
          area -= d.lx * d.lz * wall.lx * wall.lz;
        }
      }
      const setpoint = foundation.hvacSystem?.thermostatSetpoint ?? 20;
      const threshold = foundation.hvacSystem?.temperatureThreshold ?? 3;
      const deltaT = currentOutsideTemperatureRef.current - setpoint;
      // U is the inverse of R with SI units of W/(m2⋅K)
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
    const setpoint = foundation.hvacSystem?.thermostatSetpoint ?? 20;
    const threshold = foundation.hvacSystem?.temperatureThreshold ?? 3;
    const deltaT = currentOutsideTemperatureRef.current - setpoint;
    let totalArea = 0;
    switch (roof.roofType) {
      case RoofType.Pyramid:
        for (const s of segments) {
          const area = Util.getTriangleArea(s[0], s[1], s[2]);
          totalArea += area;
        }
        break;
      case RoofType.Hip:
        for (const s of segments) {
          if (s.length === 3) {
            totalArea += Util.getTriangleArea(s[0], s[1], s[2]);
          } else if (s.length === 4) {
            totalArea += Util.getTriangleArea(s[0], s[1], s[2]);
            totalArea += Util.getTriangleArea(s[2], s[3], s[0]);
          }
        }
        break;
      case RoofType.Gable:
        for (const s of segments) {
          totalArea += Util.getTriangleArea(s[0], s[1], s[2]);
          totalArea += Util.getTriangleArea(s[2], s[3], s[0]);
        }
        break;
      case RoofType.Gambrel:
        for (const s of segments) {
          totalArea += Util.getTriangleArea(s[0], s[1], s[2]);
          totalArea += Util.getTriangleArea(s[2], s[3], s[0]);
        }
        break;
      case RoofType.Mansard:
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
        break;
    }
    // convert heat exchange to kWh
    const heatExchange = computeEnergyUsage(
      (((deltaT * totalArea) / (roof.rValue ?? 0.5)) * 0.001) / timesPerHour,
      setpoint,
      threshold,
    );
    updateHeatExchangeNow(roof.id, heatExchange);
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
      dayRef.current = now.getDay();
      now.setHours(0, -minuteInterval / 2);
      // set the initial date so that the scene gets a chance to render before the simulation starts
      setCommonStore((state) => {
        state.world.date = now.toLocaleString('en-US');
      });
    }
    resetHourlyHeatExchangeMap();
    simulationCompletedRef.current = false;
  };

  const simulateYearly = () => {
    resetHourlyHeatExchangeMap();
  };

  return <></>;
};

export default React.memo(ThermalSimulation);
