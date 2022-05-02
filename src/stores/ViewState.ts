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
  weatherPanelX: number;
  weatherPanelY: number;
  diurnalTemperaturePanelX: number;
  diurnalTemperaturePanelY: number;
  stickyNotePanelX: number;
  stickyNotePanelY: number;
  dailyLightSensorPanelX: number;
  dailyLightSensorPanelY: number;
  yearlyLightSensorPanelX: number;
  yearlyLightSensorPanelY: number;
  yearlyLightSensorPanelShowDaylight: boolean;
  yearlyLightSensorPanelShowClearness: boolean;
  dailyPvYieldPanelRect: Rectangle;
  yearlyPvYieldPanelX: number;
  yearlyPvYieldPanelY: number;
  visibilityResultsPanelX: number;
  visibilityResultsPanelY: number;
  dailyParabolicTroughYieldPanelX: number;
  dailyParabolicTroughYieldPanelY: number;
  yearlyParabolicTroughYieldPanelX: number;
  yearlyParabolicTroughYieldPanelY: number;
  dailyParabolicDishYieldPanelX: number;
  dailyParabolicDishYieldPanelY: number;
  yearlyParabolicDishYieldPanelX: number;
  yearlyParabolicDishYieldPanelY: number;
  dailyFresnelReflectorYieldPanelX: number;
  dailyFresnelReflectorYieldPanelY: number;
  yearlyFresnelReflectorYieldPanelX: number;
  yearlyFresnelReflectorYieldPanelY: number;
  dailyHeliostatYieldPanelX: number;
  dailyHeliostatYieldPanelY: number;
  yearlyHeliostatYieldPanelX: number;
  yearlyHeliostatYieldPanelY: number;
  dailyUpdraftTowerYieldPanelX: number;
  dailyUpdraftTowerYieldPanelY: number;
  yearlyUpdraftTowerYieldPanelX: number;
  yearlyUpdraftTowerYieldPanelY: number;
  evolutionPanelX: number;
  evolutionPanelY: number;

  mapZoom: number;
  mapType: string;
  mapTilt: number;
  mapWeatherStations: boolean;
}
