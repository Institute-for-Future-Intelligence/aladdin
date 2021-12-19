/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Vector3 } from 'three';

export interface ViewState {
  orthographic: boolean;
  enableRotate: boolean;
  cameraPosition: Vector3; // 3D mode
  panCenter: Vector3; // 3D mode
  cameraPosition2D: Vector3;
  panCenter2D: Vector3;
  cameraZoom: number; // for orthographic camera in 2D mode

  axes: boolean;
  autoRotate: boolean;
  shadowEnabled: boolean;
  theme: string;
  heliodon: boolean;
  showSunAngles: boolean;
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
}
