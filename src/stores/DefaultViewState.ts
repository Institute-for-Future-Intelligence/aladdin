/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { ViewState } from '../views/ViewState';
import { Vector3 } from 'three';

export class DefaultViewState implements ViewState {
  orthographic: boolean;
  enableRotate: boolean;
  cameraPosition: Vector3;
  cameraPosition2D: Vector3;
  panCenter: Vector3;
  panCenter2D: Vector3;
  cameraZoom: number;

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
  showSiteInfoPanel: boolean;
  showDesignInfoPanel: boolean;
  showInstructionPanel: boolean;
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
    this.orthographic = false;
    this.enableRotate = true;
    this.cameraPosition = new Vector3(0, -20, 0);
    this.cameraPosition2D = new Vector3(0, -10, 0);
    this.panCenter = new Vector3(0, 0, 0);
    this.panCenter2D = new Vector3(0, 0, 0);
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
    this.showSiteInfoPanel = true;
    this.showDesignInfoPanel = false;
    this.showInstructionPanel = true;
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

    this.mapZoom = 18;
    this.mapType = 'roadmap';
    this.mapTilt = 0;
    this.mapWeatherStations = false;
  }

  static resetViewState(viewState: ViewState) {
    viewState.orthographic = false;
    viewState.enableRotate = true;
    viewState.cameraPosition.x = 0;
    viewState.cameraPosition.y = -20;
    viewState.cameraPosition.z = 0;
    viewState.panCenter.x = 0;
    viewState.panCenter.y = 0;
    viewState.panCenter.z = 0;
    viewState.cameraZoom = 20;
    viewState.cameraPosition2D.x = 0;
    viewState.cameraPosition2D.y = -10;
    viewState.cameraPosition2D.z = 0;
    viewState.panCenter2D.x = 0;
    viewState.panCenter2D.y = 0;
    viewState.panCenter2D.z = 0;

    viewState.axes = true;
    viewState.shadowEnabled = true;
    viewState.theme = 'Default';
    viewState.heliodon = false;
    viewState.groundImage = false;
    viewState.groundColor = 'forestgreen';

    viewState.showMapPanel = false;
    viewState.showHeliodonPanel = false;
    viewState.showWeatherPanel = false;
    viewState.showStickyNotePanel = false;
    viewState.showSiteInfoPanel = true;
    viewState.showDesignInfoPanel = true;
    viewState.showInstructionPanel = true;
    viewState.showDailyLightSensorPanel = false;
    viewState.showYearlyLightSensorPanel = false;
    viewState.showDailyPvYieldPanel = false;
    viewState.showYearlyPvYieldPanel = false;
    viewState.autoRotate = false;

    viewState.heliodonPanelX = 0;
    viewState.heliodonPanelY = 0;
    viewState.mapPanelX = 0;
    viewState.mapPanelY = 0;
    viewState.weatherPanelX = 0;
    viewState.weatherPanelY = 0;
    viewState.stickyNotePanelX = 0;
    viewState.stickyNotePanelY = 0;
    viewState.dailyLightSensorPanelX = 0;
    viewState.dailyLightSensorPanelY = 0;
    viewState.yearlyLightSensorPanelX = 0;
    viewState.yearlyLightSensorPanelY = 0;
    viewState.dailyPvYieldPanelX = 0;
    viewState.dailyPvYieldPanelY = 0;
    viewState.yearlyPvYieldPanelX = 0;
    viewState.yearlyPvYieldPanelY = 0;

    viewState.mapZoom = 18;
    viewState.mapType = 'roadmap';
    viewState.mapTilt = 0;
    viewState.mapWeatherStations = false;
  }
}
