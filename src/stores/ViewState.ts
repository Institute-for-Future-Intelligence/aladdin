/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { Rectangle } from '../models/Rectangle';

export interface ViewState {
  navigationView: boolean;
  orthographic: boolean;
  enableRotate: boolean;
  directLightIntensity: number;
  ambientLightIntensity: number;
  cameraPosition: number[]; // 3D mode
  panCenter: number[]; // 3D mode
  cameraPosition2D: number[];
  panCenter2D: number[];
  cameraZoom: number; // for orthographic camera in 2D mode
  cameraPositionNav: number[];
  cameraRotationNav: number[];
  shadowCameraFar: number;

  axes: boolean;
  heatFluxScaleFactor: number;
  heatFluxColor: string;
  heatFluxWidth: number;
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
  hideAddress: boolean;
  groundImage: boolean;
  groundImageType: string;
  groundColor: string;
  waterSurface: boolean;
  solarPanelShininess?: number;
  windowShininess?: number;

  showModelTree: boolean;
  showMapPanel: boolean;
  showHeliodonPanel: boolean;
  showWeatherPanel: boolean;
  showDiurnalTemperaturePanel: boolean;
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
  showDailyBuildingEnergyPanel: boolean;
  showYearlyBuildingEnergyPanel: boolean;
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
  dailyBuildingEnergyPanelRect: Rectangle;
  yearlyBuildingEnergyPanelRect: Rectangle;
  evolutionPanelRect: Rectangle;

  mapZoom: number;
  mapType: string;
  mapTilt: number;
}
