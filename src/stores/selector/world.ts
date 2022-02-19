/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { CommonStoreState } from '../common';

export const latitude = (state: CommonStoreState) => state.world.latitude;

export const longitude = (state: CommonStoreState) => state.world.longitude;

export const date = (state: CommonStoreState) => state.world.date;

export const address = (state: CommonStoreState) => state.world.address;

export const airAttenuationCoefficient = (state: CommonStoreState) => state.world.airAttenuationCoefficient;

export const timesPerHour = (state: CommonStoreState) => state.world.timesPerHour;

export const daysPerYear = (state: CommonStoreState) => state.world.daysPerYear;

export const dustLoss = (state: CommonStoreState) => state.world.dustLoss;

export const discretization = (state: CommonStoreState) => state.world.discretization;

export const solarRadiationHeatmapGridCellSize = (state: CommonStoreState) =>
  state.world.solarRadiationHeatmapGridCellSize;

export const solarPanelGridCellSize = (state: CommonStoreState) => state.world.solarPanelGridCellSize;

export const solarPanelVisibilityGridCellSize = (state: CommonStoreState) =>
  state.world.solarPanelVisibilityGridCellSize;

export const cspTimesPerHour = (state: CommonStoreState) => state.world.cspTimesPerHour;

export const cspDaysPerYear = (state: CommonStoreState) => state.world.cspDaysPerYear;

export const cspGridCellSize = (state: CommonStoreState) => state.world.cspGridCellSize;

export const noAnimationForHeatmapSimulation = (state: CommonStoreState) => state.world.noAnimationForHeatmapSimulation;

export const noAnimationForSensorDataCollection = (state: CommonStoreState) =>
  state.world.noAnimationForSensorDataCollection;
