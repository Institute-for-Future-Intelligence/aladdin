/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Rectangle } from '../models/Rectangle';

export interface ViewState {
  orthographic: boolean;
  enableRotate: boolean;
  ambientLightIntensity: number;
  cameraPosition: number[]; // 3D mode
  panCenter: number[]; // 3D mode
  cameraPosition2D: number[];
  panCenter2D: number[];
  cameraZoom: number; // for orthographic camera in 2D mode

  axes: boolean;
  solarRadiationHeatMapMaxValue: number;
  solarRadiationHeatMapReflectionOnly: boolean; // for heliostats and Fresnel reflectors
  autoRotate: boolean;
  shadowEnabled: boolean;
  theme: string;
  heliodon: boolean;
  showSunAngles: boolean;
  showAzimuthAngle: boolean;
  showElevationAngle: boolean;
  showZenithAngle: boolean;
  groundImage: boolean;
  groundColor: string;
  ocean: boolean;

  showMapPanel: boolean;
  showHeliodonPanel: boolean;
  showWeatherPanel: boolean;
  showDiurnalTemperaturePanel: boolean;
  showEconomicsPanel: boolean;
  showStickyNotePanel: boolean;
  showSiteInfoPanel: boolean;
  showDesignInfoPanel: boolean;
  showInstructionPanel: boolean;
  showDailyLightSensorPanel: boolean;
  showYearlyLightSensorPanel: boolean;
  showDailyPvYieldPanel: boolean;
  showYearlyPvYieldPanel: boolean;
  showSolarPanelVisibilityResultsPanel: boolean;
  showDailyParabolicTroughYieldPanel: boolean;
  showYearlyParabolicTroughYieldPanel: boolean;
  showDailyParabolicDishYieldPanel: boolean;
  showYearlyParabolicDishYieldPanel: boolean;
  showDailyFresnelReflectorYieldPanel: boolean;
  showYearlyFresnelReflectorYieldPanel: boolean;
  showDailyHeliostatYieldPanel: boolean;
  showYearlyHeliostatYieldPanel: boolean;
  showDailyUpdraftTowerYieldPanel: boolean;
  showYearlyUpdraftTowerYieldPanel: boolean;
  showEvolutionPanel: boolean;

  heliodonPanelX: number;
  heliodonPanelY: number;
  mapPanelX: number;
  mapPanelY: number;
  weatherPanelRect: Rectangle;
  diurnalTemperaturePanelRect: Rectangle;
  stickyNotePanelRect: Rectangle;
  dailyLightSensorPanelRect: Rectangle;
  yearlyLightSensorPanelRect: Rectangle;
  yearlyLightSensorPanelShowDaylight: boolean;
  yearlyLightSensorPanelShowClearness: boolean;
  dailyPvYieldPanelRect: Rectangle;
  yearlyPvYieldPanelRect: Rectangle;
  visibilityResultsPanelRect: Rectangle;
  dailyParabolicTroughYieldPanelRect: Rectangle;
  yearlyParabolicTroughYieldPanelRect: Rectangle;
  dailyParabolicDishYieldPanelRect: Rectangle;
  yearlyParabolicDishYieldPanelRect: Rectangle;
  dailyFresnelReflectorYieldPanelRect: Rectangle;
  yearlyFresnelReflectorYieldPanelRect: Rectangle;
  dailyHeliostatYieldPanelRect: Rectangle;
  yearlyHeliostatYieldPanelRect: Rectangle;
  dailyUpdraftTowerYieldPanelRect: Rectangle;
  yearlyUpdraftTowerYieldPanelRect: Rectangle;
  evolutionPanelRect: Rectangle;

  mapZoom: number;
  mapType: string;
  mapTilt: number;
  mapWeatherStations: boolean;
}
