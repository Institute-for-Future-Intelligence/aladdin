/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

export interface ViewState {
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
}
