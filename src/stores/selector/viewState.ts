/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { CommonStoreState } from '../common';

export const shadowEnabled = (state: CommonStoreState) => state.viewState.shadowEnabled;

export const solarPanelShininess = (state: CommonStoreState) => state.viewState.solarPanelShininess;

export const windowShininess = (state: CommonStoreState) => state.viewState.windowShininess;

export const heatFluxScaleFactor = (state: CommonStoreState) => state.viewState.heatFluxScaleFactor;

export const heatFluxColor = (state: CommonStoreState) => state.viewState.heatFluxColor;

export const heatFluxWidth = (state: CommonStoreState) => state.viewState.heatFluxWidth;

export const solarRadiationHeatmapMaxValue = (state: CommonStoreState) => state.viewState.solarRadiationHeatMapMaxValue;

export const solarRadiationHeatmapReflectionOnly = (state: CommonStoreState) =>
  state.viewState.solarRadiationHeatMapReflectionOnly;

export const axes = (state: CommonStoreState) => state.viewState.axes;

export const ambientLightIntensity = (state: CommonStoreState) => state.viewState.ambientLightIntensity;

export const directLightIntensity = (state: CommonStoreState) => state.viewState.directLightIntensity;

export const theme = (state: CommonStoreState) => state.viewState.theme;

export const showAzimuthAngle = (state: CommonStoreState) => state.viewState.showAzimuthAngle;

export const showElevationAngle = (state: CommonStoreState) => state.viewState.showElevationAngle;

export const showZenithAngle = (state: CommonStoreState) => state.viewState.showZenithAngle;

export const autoRotate = (state: CommonStoreState) => state.viewState.autoRotate;

export const groundImage = (state: CommonStoreState) => state.viewState.groundImage;

export const groundColor = (state: CommonStoreState) => state.viewState.groundColor;

export const waterSurface = (state: CommonStoreState) => state.viewState.waterSurface;

export const orthographic = (state: CommonStoreState) => state.viewState.orthographic;

export const enableRotate = (state: CommonStoreState) => state.viewState.enableRotate;

export const cameraPosition = (state: CommonStoreState) => state.viewState.cameraPosition;

export const cameraPosition2D = (state: CommonStoreState) => state.viewState.cameraPosition2D;

export const panCenter = (state: CommonStoreState) => state.viewState.panCenter;

export const panCenter2D = (state: CommonStoreState) => state.viewState.panCenter2D;

export const cameraZoom = (state: CommonStoreState) => state.viewState.cameraZoom;

export const heliodon = (state: CommonStoreState) => state.viewState.heliodon;

export const showSunAngles = (state: CommonStoreState) => state.viewState.showSunAngles;

export const mapZoom = (state: CommonStoreState) => state.viewState.mapZoom;

export const mapTilt = (state: CommonStoreState) => state.viewState.mapTilt;

export const mapType = (state: CommonStoreState) => state.viewState.mapType;

export const mapWeatherStations = (state: CommonStoreState) => state.viewState.mapWeatherStations;

export const showSiteInfoPanel = (state: CommonStoreState) => state.viewState.showSiteInfoPanel;

export const showDesignInfoPanel = (state: CommonStoreState) => state.viewState.showDesignInfoPanel;

export const showInstructionPanel = (state: CommonStoreState) => state.viewState.showInstructionPanel;

export const showHeliodonPanel = (state: CommonStoreState) => state.viewState.showHeliodonPanel;

export const heliodonPanelX = (state: CommonStoreState) => state.viewState.heliodonPanelX;

export const heliodonPanelY = (state: CommonStoreState) => state.viewState.heliodonPanelY;

export const showMapPanel = (state: CommonStoreState) => state.viewState.showMapPanel;

export const mapPanelX = (state: CommonStoreState) => state.viewState.mapPanelX;

export const mapPanelY = (state: CommonStoreState) => state.viewState.mapPanelY;

export const showWeatherPanel = (state: CommonStoreState) => state.viewState.showWeatherPanel;

export const weatherPanelRect = (state: CommonStoreState) => state.viewState.weatherPanelRect;

export const showDiurnalTemperaturePanel = (state: CommonStoreState) => state.viewState.showDiurnalTemperaturePanel;

export const diurnalTemperaturePanelRect = (state: CommonStoreState) => state.viewState.diurnalTemperaturePanelRect;

export const showEconomicsPanel = (state: CommonStoreState) => state.viewState.showEconomicsPanel;

export const showStickyNotePanel = (state: CommonStoreState) => state.viewState.showStickyNotePanel;

export const stickyNotePanelRect = (state: CommonStoreState) => state.viewState.stickyNotePanelRect;

export const showDailyBuildingEnergyPanel = (state: CommonStoreState) => state.viewState.showDailyBuildingEnergyPanel;

export const dailyBuildingEnergyPanelRect = (state: CommonStoreState) => state.viewState.dailyBuildingEnergyPanelRect;

export const showYearlyBuildingEnergyPanel = (state: CommonStoreState) => state.viewState.showYearlyBuildingEnergyPanel;

export const yearlyBuildingEnergyPanelRect = (state: CommonStoreState) => state.viewState.yearlyBuildingEnergyPanelRect;

export const showDailyLightSensorPanel = (state: CommonStoreState) => state.viewState.showDailyLightSensorPanel;

export const dailyLightSensorPanelRect = (state: CommonStoreState) => state.viewState.dailyLightSensorPanelRect;

export const showYearlyLightSensorPanel = (state: CommonStoreState) => state.viewState.showYearlyLightSensorPanel;

export const yearlyLightSensorPanelRect = (state: CommonStoreState) => state.viewState.yearlyLightSensorPanelRect;

export const yearlyLightSensorPanelShowDaylight = (state: CommonStoreState) =>
  state.viewState.yearlyLightSensorPanelShowDaylight;

export const yearlyLightSensorPanelShowClearness = (state: CommonStoreState) =>
  state.viewState.yearlyLightSensorPanelShowClearness;

export const showDailyPvYieldPanel = (state: CommonStoreState) => state.viewState.showDailyPvYieldPanel;

export const dailyPvYieldPanelRect = (state: CommonStoreState) => state.viewState.dailyPvYieldPanelRect;

export const showYearlyPvYieldPanel = (state: CommonStoreState) => state.viewState.showYearlyPvYieldPanel;

export const yearlyPvYieldPanelRect = (state: CommonStoreState) => state.viewState.yearlyPvYieldPanelRect;

export const showVisibilityResultsPanel = (state: CommonStoreState) =>
  state.viewState.showSolarPanelVisibilityResultsPanel;

export const visibilityResultsPanelRect = (state: CommonStoreState) => state.viewState.visibilityResultsPanelRect;

export const showDailyParabolicTroughYieldPanel = (state: CommonStoreState) =>
  state.viewState.showDailyParabolicTroughYieldPanel;

export const dailyParabolicTroughYieldPanelRect = (state: CommonStoreState) =>
  state.viewState.dailyParabolicTroughYieldPanelRect;

export const showYearlyParabolicTroughYieldPanel = (state: CommonStoreState) =>
  state.viewState.showYearlyParabolicTroughYieldPanel;

export const yearlyParabolicTroughYieldPanelRect = (state: CommonStoreState) =>
  state.viewState.yearlyParabolicTroughYieldPanelRect;

export const showDailyParabolicDishYieldPanel = (state: CommonStoreState) =>
  state.viewState.showDailyParabolicDishYieldPanel;

export const dailyParabolicDishYieldPanelRect = (state: CommonStoreState) =>
  state.viewState.dailyParabolicDishYieldPanelRect;

export const showYearlyParabolicDishYieldPanel = (state: CommonStoreState) =>
  state.viewState.showYearlyParabolicDishYieldPanel;

export const yearlyParabolicDishYieldPanelRect = (state: CommonStoreState) =>
  state.viewState.yearlyParabolicDishYieldPanelRect;

export const showDailyFresnelReflectorYieldPanel = (state: CommonStoreState) =>
  state.viewState.showDailyFresnelReflectorYieldPanel;

export const dailyFresnelReflectorYieldPanelRect = (state: CommonStoreState) =>
  state.viewState.dailyFresnelReflectorYieldPanelRect;

export const showYearlyFresnelReflectorYieldPanel = (state: CommonStoreState) =>
  state.viewState.showYearlyFresnelReflectorYieldPanel;

export const yearlyFresnelReflectorYieldPanelRect = (state: CommonStoreState) =>
  state.viewState.yearlyFresnelReflectorYieldPanelRect;

export const showDailyHeliostatYieldPanel = (state: CommonStoreState) => state.viewState.showDailyHeliostatYieldPanel;

export const dailyHeliostatYieldPanelRect = (state: CommonStoreState) => state.viewState.dailyHeliostatYieldPanelRect;

export const showYearlyHeliostatYieldPanel = (state: CommonStoreState) => state.viewState.showYearlyHeliostatYieldPanel;

export const yearlyHeliostatYieldPanelRect = (state: CommonStoreState) => state.viewState.yearlyHeliostatYieldPanelRect;

export const showDailyUpdraftTowerYieldPanel = (state: CommonStoreState) =>
  state.viewState.showDailyUpdraftTowerYieldPanel;

export const dailyUpdraftTowerYieldPanelRect = (state: CommonStoreState) =>
  state.viewState.dailyUpdraftTowerYieldPanelRect;

export const showYearlyUpdraftTowerYieldPanel = (state: CommonStoreState) =>
  state.viewState.showYearlyUpdraftTowerYieldPanel;

export const yearlyUpdraftTowerYieldPanelRect = (state: CommonStoreState) =>
  state.viewState.yearlyUpdraftTowerYieldPanelRect;

export const showEvolutionPanel = (state: CommonStoreState) => state.viewState.showEvolutionPanel;

export const evolutionPanelRect = (state: CommonStoreState) => state.viewState.evolutionPanelRect;
