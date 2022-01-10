/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { CommonStoreState } from '../common';

export const shadowEnabled = (state: CommonStoreState) => state.viewState.shadowEnabled;

export const axes = (state: CommonStoreState) => state.viewState.axes;

export const ambientLightIntensity = (state: CommonStoreState) => state.viewState.ambientLightIntensity;

export const theme = (state: CommonStoreState) => state.viewState.theme;

export const autoRotate = (state: CommonStoreState) => state.viewState.autoRotate;

export const groundImage = (state: CommonStoreState) => state.viewState.groundImage;

export const groundColor = (state: CommonStoreState) => state.viewState.groundColor;

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

export const weatherPanelX = (state: CommonStoreState) => state.viewState.weatherPanelX;

export const weatherPanelY = (state: CommonStoreState) => state.viewState.weatherPanelY;

export const showStickyNotePanel = (state: CommonStoreState) => state.viewState.showStickyNotePanel;

export const stickyNotePanelX = (state: CommonStoreState) => state.viewState.stickyNotePanelX;

export const stickyNotePanelY = (state: CommonStoreState) => state.viewState.stickyNotePanelY;

export const showDailyLightSensorPanel = (state: CommonStoreState) => state.viewState.showDailyLightSensorPanel;

export const dailyLightSensorPanelX = (state: CommonStoreState) => state.viewState.dailyLightSensorPanelX;

export const dailyLightSensorPanelY = (state: CommonStoreState) => state.viewState.dailyLightSensorPanelY;

export const showYearlyLightSensorPanel = (state: CommonStoreState) => state.viewState.showYearlyLightSensorPanel;

export const yearlyLightSensorPanelX = (state: CommonStoreState) => state.viewState.yearlyLightSensorPanelX;

export const yearlyLightSensorPanelY = (state: CommonStoreState) => state.viewState.yearlyLightSensorPanelY;

export const showDailyPvYieldPanel = (state: CommonStoreState) => state.viewState.showDailyPvYieldPanel;

export const dailyPvYieldPanelX = (state: CommonStoreState) => state.viewState.dailyPvYieldPanelX;

export const dailyPvYieldPanelY = (state: CommonStoreState) => state.viewState.dailyPvYieldPanelY;

export const showYearlyPvYieldPanel = (state: CommonStoreState) => state.viewState.showYearlyPvYieldPanel;

export const yearlyPvYieldPanelX = (state: CommonStoreState) => state.viewState.yearlyPvYieldPanelX;

export const yearlyPvYieldPanelY = (state: CommonStoreState) => state.viewState.yearlyPvYieldPanelY;
