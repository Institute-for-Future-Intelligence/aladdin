/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { ViewState } from '../views/ViewState';
import { Vector3 } from 'three';

export class DefaultViewState implements ViewState {
  orthographic: boolean;
  enableRotate: boolean;
  cameraPosition: Vector3;
  cameraZoom: number;
  panCenter: Vector3;

  axes: boolean;
  shadowEnabled: boolean;
  theme: string;
  heliodon: boolean;
  groundImage: boolean;
  groundColor: string;

  showMapPanel: boolean;
  showHeliodonPanel: boolean;
  showWeatherPanel: boolean;
  showStickyNotePanel: boolean;
  showInfoPanel: boolean;
  showDailyLightSensorPanel: boolean;
  showYearlyLightSensorPanel: boolean;
  showDailyPvYieldPanel: boolean;
  showYearlyPvYieldPanel: boolean;
  autoRotate: boolean;

  heliodonPanelX: number;
  heliodonPanelY: number;
  mapPanelX: number;
  mapPanelY: number;
  weatherPanelX: number;
  weatherPanelY: number;
  stickyNotePanelX: number;
  stickyNotePanelY: number;
  dailyLightSensorPanelX: number;
  dailyLightSensorPanelY: number;
  yearlyLightSensorPanelX: number;
  yearlyLightSensorPanelY: number;
  dailyPvYieldPanelX: number;
  dailyPvYieldPanelY: number;
  yearlyPvYieldPanelX: number;
  yearlyPvYieldPanelY: number;

  mapZoom: number;
  mapType: string;
  mapTilt: number;
  mapWeatherStations: boolean;

  constructor() {
    this.panCenter = new Vector3(0, 0, 0);
    this.orthographic = false;
    this.enableRotate = true;
    this.cameraPosition = new Vector3(0, -5, 0);
    this.cameraZoom = 20;

    this.axes = true;
    this.shadowEnabled = true;
    this.theme = 'Default';
    this.heliodon = false;
    this.groundImage = false;
    this.groundColor = 'forestgreen';

    this.showMapPanel = false;
    this.showHeliodonPanel = false;
    this.showWeatherPanel = false;
    this.showStickyNotePanel = false;
    this.showInfoPanel = true;
    this.showDailyLightSensorPanel = false;
    this.showYearlyLightSensorPanel = false;
    this.showDailyPvYieldPanel = false;
    this.showYearlyPvYieldPanel = false;
    this.autoRotate = false;

    this.heliodonPanelX = 0;
    this.heliodonPanelY = 0;
    this.mapPanelX = 0;
    this.mapPanelY = 0;
    this.weatherPanelX = 0;
    this.weatherPanelY = 0;
    this.stickyNotePanelX = 0;
    this.stickyNotePanelY = 0;
    this.dailyLightSensorPanelX = 0;
    this.dailyLightSensorPanelY = 0;
    this.yearlyLightSensorPanelX = 0;
    this.yearlyLightSensorPanelY = 0;
    this.dailyPvYieldPanelX = 0;
    this.dailyPvYieldPanelY = 0;
    this.yearlyPvYieldPanelX = 0;
    this.yearlyPvYieldPanelY = 0;

    this.mapZoom = 16;
    this.mapType = 'roadmap';
    this.mapTilt = 0;
    this.mapWeatherStations = false;
  }
}
