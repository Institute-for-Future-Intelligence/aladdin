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
import { TEMPERATURE_THRESHOLD } from '../constants';

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
  const hourlyHeatFluxArrayMapRef = useRef<Map<string, number[]>>(new Map<string, number[]>());

  const lang = { lng: language };
  const weather = getWeather(city ?? 'Boston MA, USA');
  const now = new Date(world.date);
  const timesPerHour = world.timesPerHour ?? 4;
  const minuteInterval = 60 / timesPerHour;

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

  useEffect(() => {
    if (weather) {
      outsideTemperatureRangeRef.current = computeOutsideTemperature(
        new Date(world.date),
        weather.lowestTemperatures,
        weather.highestTemperatures,
      );
    }
  }, [world.date, weather?.lowestTemperatures, weather?.highestTemperatures]);

  /*
   If the lowest outside temperature is higher than the threshold, don't turn on the heater.
   If the highest outside temperature is lower than the threshold, don't turn on the air conditioner.
  */
  const computeEnergyUsage = (heatGain: number, setpoint: number) => {
    if (
      (heatGain < 0 && outsideTemperatureRangeRef.current.low >= setpoint - TEMPERATURE_THRESHOLD) ||
      (heatGain > 0 && outsideTemperatureRangeRef.current.high <= setpoint + TEMPERATURE_THRESHOLD)
    )
      return 0;
    // energy usage is absolute because it is a net expense
    return Math.abs(heatGain);
  };

  /* do the daily simulation to generate hourly data and daily total */

  useEffect(() => {
    if (runDailySimulation) {
      if (noAnimation && !Util.hasMovingParts(elements)) {
        staticCalculateHeatTransfer();
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

  const staticCalculateHeatTransfer = () => {
    updateTemperature(now);
    for (const e of elements) {
      switch (e.type) {
        case ObjectType.Foundation:
          break;
        case ObjectType.Cuboid:
          break;
        case ObjectType.Wall:
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
    resetHourlyHeatFluxMap();
  };

  const finishDaily = () => {
    for (const e of elements) {
      if (Util.isThermal(e)) {
        const arr = hourlyHeatFluxArrayMapRef.current.get(e.id);
        if (arr) {
          setHourlyHeatExchangeArray(e.id, [...arr]);
        }
      }
    }
  };

  const resetHourlyHeatFluxMap = () => {
    for (const e of elements) {
      if (Util.isThermal(e)) {
        hourlyHeatFluxArrayMapRef.current.get(e.id)?.fill(0);
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
      // will the calculation immediately use the latest geometry after re-rendering?
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

  const updateCurrentHeatFlux = (id: string, heat: number) => {
    let a = hourlyHeatFluxArrayMapRef.current.get(id);
    if (!a) {
      a = new Array(24).fill(0);
      hourlyHeatFluxArrayMapRef.current.set(id, a);
    }
    a[now.getHours()] = heat;
  };

  const calculateWindow = (window: WindowModel) => {
    const foundation = getFoundation(window);
    if (foundation) {
      const parent = getParent(window);
      if (parent) {
        const setpoint = foundation.hvacSystem?.thermostatSetpoint ?? 20;
        const area = Util.getWindowArea(window, parent);
        const deltaT = currentOutsideTemperatureRef.current - setpoint;
        // convert heat gain to kWh
        const heatGain = computeEnergyUsage((deltaT * area * (window.uValue ?? 2) * 0.001) / timesPerHour, setpoint);
        updateCurrentHeatFlux(window.id, heatGain);
      }
    }
  };

  const calculateDoor = (door: DoorModel) => {
    const foundation = getFoundation(door);
    if (foundation) {
      const parent = getParent(door);
      if (parent) {
        const setpoint = foundation.hvacSystem?.thermostatSetpoint ?? 20;
        const area = door.lx * door.lz * parent.lx * parent.lz;
        const deltaT = currentOutsideTemperatureRef.current - setpoint;
        // convert heat gain to kWh
        const heatGain = computeEnergyUsage((deltaT * area * (door.uValue ?? 2) * 0.001) / timesPerHour, setpoint);
        updateCurrentHeatFlux(door.id, heatGain);
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
      const deltaT = currentOutsideTemperatureRef.current - setpoint;
      // U is the inverse of R with SI units of W/(m2⋅K)
      const heatGain = computeEnergyUsage((((deltaT * area) / (wall.rValue ?? 0.5)) * 0.001) / timesPerHour, setpoint);
      updateCurrentHeatFlux(wall.id, heatGain);
    }
  };

  const calculateRoof = (roof: RoofModel) => {
    const foundation = getFoundation(roof);
    if (!foundation) return;
    const segments = getRoofSegmentVerticesWithoutOverhang(roof.id);
    if (!segments) return;
    const setpoint = foundation.hvacSystem?.thermostatSetpoint ?? 20;
    const deltaT = currentOutsideTemperatureRef.current - setpoint;
    let totalArea = 0;
    switch (roof.roofType) {
      case RoofType.Pyramid:
        for (const v of segments) {
          const area = Util.getTriangleArea(v[0], v[1], v[2]);
          totalArea += area;
        }
        break;
      case RoofType.Hip:
        for (const v of segments) {
          if (v.length === 3) {
            totalArea += Util.getTriangleArea(v[0], v[1], v[2]);
          } else if (v.length === 4) {
            totalArea += Util.getTriangleArea(v[0], v[1], v[2]);
            totalArea += Util.getTriangleArea(v[2], v[3], v[0]);
          }
        }
        break;
      case RoofType.Gable:
        for (const v of segments) {
          totalArea += Util.getTriangleArea(v[0], v[1], v[2]);
          totalArea += Util.getTriangleArea(v[2], v[3], v[0]);
        }
        break;
      case RoofType.Gambrel:
        for (const v of segments) {
          totalArea += Util.getTriangleArea(v[0], v[1], v[2]);
          totalArea += Util.getTriangleArea(v[2], v[3], v[0]);
        }
        break;
      case RoofType.Mansard:
        for (const v of segments) {
          totalArea += Util.getTriangleArea(v[0], v[1], v[2]);
          totalArea += Util.getTriangleArea(v[2], v[3], v[0]);
        }
        break;
    }
    // convert heat gain to kWh
    const heatGain = computeEnergyUsage(
      (((deltaT * totalArea) / (roof.rValue ?? 0.5)) * 0.001) / timesPerHour,
      setpoint,
    );
    updateCurrentHeatFlux(roof.id, heatGain);
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
    resetHourlyHeatFluxMap();
    simulationCompletedRef.current = false;
  };

  const simulateYearly = () => {
    resetHourlyHeatFluxMap();
  };

  return <></>;
};

export default React.memo(ThermalSimulation);
