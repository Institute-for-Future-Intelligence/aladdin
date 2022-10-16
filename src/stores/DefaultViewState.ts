/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ViewState } from './ViewState';
import { immerable } from 'immer';
import { Rectangle } from '../models/Rectangle';

export class DefaultViewState implements ViewState {
  [immerable] = true;
  orthographic: boolean;
  enableRotate: boolean;
  ambientLightIntensity: number;
  cameraPosition: number[];
  cameraPosition2D: number[];
  panCenter: number[];
  panCenter2D: number[];
  cameraZoom: number;

  axes: boolean;
  solarRadiationHeatMapMaxValue: number;
  solarRadiationHeatMapReflectionOnly: boolean; // for heliostats and Fresnel reflectors
  shadowEnabled: boolean;
  theme: string;
  heliodon: boolean;
  showSunAngles: boolean;
  showAzimuthAngle: boolean;
  showElevationAngle: boolean;
  showZenithAngle: boolean;
  groundImage: boolean;
  groundColor: string;
  waterSurface: boolean;

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
  autoRotate: boolean;

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

  constructor() {
    this.orthographic = false;
    this.enableRotate = true;
    this.ambientLightIntensity = 0.1;
    this.cameraPosition = [5, -30, 1];
    this.cameraPosition2D = [0, 0, 150];
    this.panCenter = [0, 0, 0];
    this.panCenter2D = [0, 0, 0];
    this.cameraZoom = 20;

    this.axes = true;
    this.solarRadiationHeatMapMaxValue = 5;
    this.solarRadiationHeatMapReflectionOnly = false;
    this.shadowEnabled = true;
    this.theme = 'Default';
    this.heliodon = false;
    this.showSunAngles = false;
    this.showAzimuthAngle = true;
    this.showElevationAngle = true;
    this.showZenithAngle = true;
    this.groundImage = false;
    this.groundColor = '#16A5A5';
    this.waterSurface = false;

    this.showMapPanel = false;
    this.showHeliodonPanel = false;
    this.showWeatherPanel = false;
    this.showDiurnalTemperaturePanel = false;
    this.showEconomicsPanel = false;
    this.showStickyNotePanel = false;
    this.showSiteInfoPanel = true;
    this.showDesignInfoPanel = false;
    this.showInstructionPanel = true;
    this.showDailyLightSensorPanel = false;
    this.showYearlyLightSensorPanel = false;
    this.showDailyPvYieldPanel = false;
    this.showYearlyPvYieldPanel = false;
    this.showSolarPanelVisibilityResultsPanel = false;
    this.showDailyParabolicTroughYieldPanel = false;
    this.showYearlyParabolicTroughYieldPanel = false;
    this.showDailyParabolicDishYieldPanel = false;
    this.showYearlyParabolicDishYieldPanel = false;
    this.showDailyFresnelReflectorYieldPanel = false;
    this.showYearlyFresnelReflectorYieldPanel = false;
    this.showDailyHeliostatYieldPanel = false;
    this.showYearlyHeliostatYieldPanel = false;
    this.showDailyUpdraftTowerYieldPanel = false;
    this.showYearlyUpdraftTowerYieldPanel = false;
    this.showEvolutionPanel = false;
    this.autoRotate = false;

    this.heliodonPanelX = 0;
    this.heliodonPanelY = 0;
    this.mapPanelX = 0;
    this.mapPanelY = 0;
    this.weatherPanelRect = new Rectangle(0, 0, 500, 500);
    this.diurnalTemperaturePanelRect = new Rectangle(0, 0, 600, 400);
    this.stickyNotePanelRect = new Rectangle(0, 0, 400, 300);
    this.dailyLightSensorPanelRect = new Rectangle(0, 0, 600, 360);
    this.yearlyLightSensorPanelRect = new Rectangle(0, 0, 600, 500);
    this.yearlyLightSensorPanelShowDaylight = false;
    this.yearlyLightSensorPanelShowClearness = false;
    this.dailyPvYieldPanelRect = new Rectangle(0, 0, 600, 400);
    this.yearlyPvYieldPanelRect = new Rectangle(0, 0, 600, 400);
    this.visibilityResultsPanelRect = new Rectangle(0, 0, 600, 470);
    this.dailyParabolicTroughYieldPanelRect = new Rectangle(0, 0, 600, 400);
    this.yearlyParabolicTroughYieldPanelRect = new Rectangle(0, 0, 600, 400);
    this.dailyParabolicDishYieldPanelRect = new Rectangle(0, 0, 600, 400);
    this.yearlyParabolicDishYieldPanelRect = new Rectangle(0, 0, 600, 400);
    this.dailyFresnelReflectorYieldPanelRect = new Rectangle(0, 0, 600, 400);
    this.yearlyFresnelReflectorYieldPanelRect = new Rectangle(0, 0, 600, 400);
    this.dailyHeliostatYieldPanelRect = new Rectangle(0, 0, 600, 400);
    this.yearlyHeliostatYieldPanelRect = new Rectangle(0, 0, 600, 400);
    this.dailyUpdraftTowerYieldPanelRect = new Rectangle(0, 0, 640, 550);
    this.yearlyUpdraftTowerYieldPanelRect = new Rectangle(0, 0, 600, 400);
    this.evolutionPanelRect = new Rectangle(0, 0, 640, 400);

    this.mapZoom = 18;
    this.mapType = 'roadmap';
    this.mapTilt = 0;
    this.mapWeatherStations = false;
  }

  static resetViewState(viewState: ViewState) {
    viewState.orthographic = false;
    viewState.enableRotate = true;
    viewState.cameraPosition = [5, -30, 1];
    viewState.panCenter = [0, 0, 0];
    viewState.cameraZoom = 20;
    viewState.cameraPosition2D = [0, 0, 20];
    viewState.panCenter2D = [0, 0, 0];

    viewState.axes = true;
    viewState.solarRadiationHeatMapMaxValue = 5;
    viewState.solarRadiationHeatMapReflectionOnly = false;
    viewState.shadowEnabled = true;
    viewState.theme = 'Default';
    viewState.heliodon = false;
    viewState.showSunAngles = false;
    viewState.showAzimuthAngle = true;
    viewState.showElevationAngle = true;
    viewState.showZenithAngle = true;
    viewState.groundImage = false;
    viewState.groundColor = '#16A5A5';
    viewState.waterSurface = false;

    viewState.showMapPanel = false;
    viewState.showHeliodonPanel = false;
    viewState.showWeatherPanel = false;
    viewState.showDiurnalTemperaturePanel = false;
    viewState.showEconomicsPanel = false;
    viewState.showStickyNotePanel = false;
    viewState.showSiteInfoPanel = true;
    viewState.showDesignInfoPanel = true;
    viewState.showInstructionPanel = true;
    viewState.showDailyLightSensorPanel = false;
    viewState.showYearlyLightSensorPanel = false;
    viewState.showDailyPvYieldPanel = false;
    viewState.showYearlyPvYieldPanel = false;
    viewState.showSolarPanelVisibilityResultsPanel = false;
    viewState.showDailyParabolicTroughYieldPanel = false;
    viewState.showYearlyParabolicTroughYieldPanel = false;
    viewState.showDailyParabolicDishYieldPanel = false;
    viewState.showYearlyParabolicDishYieldPanel = false;
    viewState.showDailyFresnelReflectorYieldPanel = false;
    viewState.showYearlyFresnelReflectorYieldPanel = false;
    viewState.showDailyHeliostatYieldPanel = false;
    viewState.showYearlyHeliostatYieldPanel = false;
    viewState.showDailyUpdraftTowerYieldPanel = false;
    viewState.showYearlyUpdraftTowerYieldPanel = false;
    viewState.showEvolutionPanel = false;
    viewState.autoRotate = false;

    viewState.heliodonPanelX = 0;
    viewState.heliodonPanelY = 0;
    viewState.mapPanelX = 0;
    viewState.mapPanelY = 0;
    viewState.weatherPanelRect = new Rectangle(0, 0, 500, 500);
    viewState.diurnalTemperaturePanelRect = new Rectangle(0, 0, 600, 400);
    viewState.stickyNotePanelRect = new Rectangle(0, 0, 400, 300);
    viewState.dailyLightSensorPanelRect = new Rectangle(0, 0, 600, 360);
    viewState.yearlyLightSensorPanelRect = new Rectangle(0, 0, 600, 500);
    viewState.yearlyLightSensorPanelShowDaylight = false;
    viewState.yearlyLightSensorPanelShowClearness = false;
    viewState.dailyPvYieldPanelRect = new Rectangle(0, 0, 600, 400);
    viewState.yearlyPvYieldPanelRect = new Rectangle(0, 0, 600, 400);
    viewState.visibilityResultsPanelRect = new Rectangle(0, 0, 600, 470);
    viewState.dailyParabolicTroughYieldPanelRect = new Rectangle(0, 0, 600, 400);
    viewState.yearlyParabolicTroughYieldPanelRect = new Rectangle(0, 0, 600, 400);
    viewState.dailyParabolicDishYieldPanelRect = new Rectangle(0, 0, 600, 400);
    viewState.yearlyParabolicDishYieldPanelRect = new Rectangle(0, 0, 600, 400);
    viewState.dailyFresnelReflectorYieldPanelRect = new Rectangle(0, 0, 600, 400);
    viewState.yearlyFresnelReflectorYieldPanelRect = new Rectangle(0, 0, 600, 400);
    viewState.dailyHeliostatYieldPanelRect = new Rectangle(0, 0, 600, 400);
    viewState.yearlyHeliostatYieldPanelRect = new Rectangle(0, 0, 600, 400);
    viewState.dailyUpdraftTowerYieldPanelRect = new Rectangle(0, 0, 640, 550);
    viewState.yearlyUpdraftTowerYieldPanelRect = new Rectangle(0, 0, 600, 400);
    viewState.evolutionPanelRect = new Rectangle(0, 0, 640, 400);

    viewState.mapZoom = 18;
    viewState.mapType = 'roadmap';
    viewState.mapTilt = 0;
    viewState.mapWeatherStations = false;
  }
}
