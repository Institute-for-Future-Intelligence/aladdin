/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { CommonStoreState } from '../common';

export const latitude = (state: CommonStoreState) => state.world.latitude;

export const longitude = (state: CommonStoreState) => state.world.longitude;

export const date = (state: CommonStoreState) => state.world.date;

export const leafDayOfYear1 = (state: CommonStoreState) => state.world.leafDayOfYear1;

export const leafDayOfYear2 = (state: CommonStoreState) => state.world.leafDayOfYear2;

export const ground = (state: CommonStoreState) => state.world.ground;

export const address = (state: CommonStoreState) => state.world.address;

export const countryCode = (state: CommonStoreState) => state.world.countryCode;

export const airAttenuationCoefficient = (state: CommonStoreState) => state.world.airAttenuationCoefficient;

export const airConvectiveCoefficient = (state: CommonStoreState) => state.world.airConvectiveCoefficient;

export const timesPerHour = (state: CommonStoreState) => state.world.timesPerHour;

export const daysPerYear = (state: CommonStoreState) => state.world.daysPerYear;

export const monthlyIrradianceLosses = (state: CommonStoreState) => state.world.monthlyIrradianceLosses;

export const applyElectricityConsumptions = (state: CommonStoreState) => state.world.applyElectricityConsumptions;

export const monthlyElectricityConsumptions = (state: CommonStoreState) => state.world.monthlyElectricityConsumptions;

export const discretization = (state: CommonStoreState) => state.world.discretization;

export const diurnalTemperatureModel = (state: CommonStoreState) => state.world.diurnalTemperatureModel;

export const highestTemperatureTimeInMinutes = (state: CommonStoreState) => state.world.highestTemperatureTimeInMinutes;

export const solarRadiationHeatmapGridCellSize = (state: CommonStoreState) =>
  state.world.solarRadiationHeatmapGridCellSize;

export const pvGridCellSize = (state: CommonStoreState) => state.world.pvGridCellSize;

export const solarPanelVisibilityGridCellSize = (state: CommonStoreState) =>
  state.world.solarPanelVisibilityGridCellSize;

export const cspTimesPerHour = (state: CommonStoreState) => state.world.cspTimesPerHour;

export const cspDaysPerYear = (state: CommonStoreState) => state.world.cspDaysPerYear;

export const cspGridCellSize = (state: CommonStoreState) => state.world.cspGridCellSize;

export const sutTimesPerHour = (state: CommonStoreState) => state.world.sutTimesPerHour;

export const sutDaysPerYear = (state: CommonStoreState) => state.world.sutDaysPerYear;

export const sutGridCellSize = (state: CommonStoreState) => state.world.sutGridCellSize;

export const noAnimationForHeatmapSimulation = (state: CommonStoreState) => state.world.noAnimationForHeatmapSimulation;

export const noAnimationForThermalSimulation = (state: CommonStoreState) => state.world.noAnimationForThermalSimulation;

export const noAnimationForSensorDataCollection = (state: CommonStoreState) =>
  state.world.noAnimationForSensorDataCollection;

export const noAnimationForSolarPanelSimulation = (state: CommonStoreState) =>
  state.world.noAnimationForSolarPanelSimulation;

export const noAnimationForSolarUpdraftTowerSimulation = (state: CommonStoreState) =>
  state.world.noAnimationForSolarUpdraftTowerSimulation;
