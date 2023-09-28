/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { ViewState } from './ViewState';
import { immerable } from 'immer';
import { Rectangle } from '../models/Rectangle';
import {
  DEFAULT_HEAT_FLUX_COLOR,
  DEFAULT_HEAT_FLUX_SCALE_FACTOR,
  DEFAULT_HEAT_FLUX_WIDTH,
  DEFAULT_SOLAR_PANEL_SHININESS,
  DEFAULT_WINDOW_SHININESS,
} from '../constants';

export class DefaultViewState implements ViewState {
  // Needed for immer drafting to work properly: https://immerjs.github.io/immer/docs/complex-objects
  [immerable] = true;

  navigationView: boolean;
  orthographic: boolean;
  enableRotate: boolean;
  directLightIntensity: number;
  ambientLightIntensity: number;
  cameraPosition: number[];
  cameraPosition2D: number[];
  panCenter: number[];
  panCenter2D: number[];
  cameraZoom: number;
  cameraPositionNav: number[];
  cameraRotationNav: number[];

  axes: boolean;
  heatFluxScaleFactor: number;
  heatFluxColor: string;
  heatFluxWidth: number;
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
  groundImageType: string;
  groundColor: string;
  waterSurface: boolean;
  solarPanelShininess: number;
  windowShininess: number;

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
  dailyBuildingEnergyPanelRect: Rectangle;
  yearlyBuildingEnergyPanelRect: Rectangle;
  evolutionPanelRect: Rectangle;

  mapZoom: number;
  mapType: string;
  mapTilt: number;

  constructor() {
    this.navigationView = false;
    this.orthographic = false;
    this.enableRotate = true;
    this.directLightIntensity = 1;
    this.ambientLightIntensity = 0.1;
    this.cameraPosition = [5, -30, 1];
    this.cameraPosition2D = [0, 0, 150];
    this.panCenter = [0, 0, 0];
    this.panCenter2D = [0, 0, 0];
    this.cameraZoom = 20;
    this.cameraPositionNav = [5, -30, 1];
    this.cameraRotationNav = [1.5374753309166491, 0.16505866097993566, 0.005476951734475092];

    this.axes = true;
    this.heatFluxScaleFactor = DEFAULT_HEAT_FLUX_SCALE_FACTOR;
    this.heatFluxColor = DEFAULT_HEAT_FLUX_COLOR;
    this.heatFluxWidth = DEFAULT_HEAT_FLUX_WIDTH;
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
    this.groundImageType = 'roadmap';
    this.groundColor = '#16A5A5';
    this.waterSurface = false;
    this.solarPanelShininess = DEFAULT_SOLAR_PANEL_SHININESS;
    this.windowShininess = DEFAULT_WINDOW_SHININESS;

    this.showMapPanel = false;
    this.showHeliodonPanel = false;
    this.showWeatherPanel = false;
    this.showDiurnalTemperaturePanel = false;
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
    this.showDailyBuildingEnergyPanel = false;
    this.showYearlyBuildingEnergyPanel = false;
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
    this.dailyBuildingEnergyPanelRect = new Rectangle(0, 0, 600, 400);
    this.yearlyBuildingEnergyPanelRect = new Rectangle(0, 0, 600, 400);
    this.evolutionPanelRect = new Rectangle(0, 0, 640, 400);

    this.mapZoom = 18;
    this.mapType = 'roadmap';
    this.mapTilt = 0;
  }

  static resetViewState(viewState: ViewState) {
    viewState.navigationView = false;
    viewState.orthographic = false;
    viewState.enableRotate = true;
    viewState.cameraPosition = [5, -30, 1];
    viewState.panCenter = [0, 0, 0];
    viewState.cameraZoom = 20;
    viewState.cameraPosition2D = [0, 0, 20];
    viewState.panCenter2D = [0, 0, 0];
    viewState.directLightIntensity = 1;
    viewState.ambientLightIntensity = 0.1;
    viewState.cameraPositionNav = [5, -30, 1];
    viewState.cameraRotationNav = [1.5374753309166491, 0.16505866097993566, 0.005476951734475092];

    viewState.axes = true;
    viewState.heatFluxScaleFactor = DEFAULT_HEAT_FLUX_SCALE_FACTOR;
    viewState.heatFluxColor = DEFAULT_HEAT_FLUX_COLOR;
    viewState.heatFluxWidth = DEFAULT_HEAT_FLUX_WIDTH;
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
    viewState.groundImageType = 'roadmap';
    viewState.groundColor = '#16A5A5';
    viewState.waterSurface = false;
    viewState.solarPanelShininess = DEFAULT_SOLAR_PANEL_SHININESS;
    viewState.windowShininess = DEFAULT_WINDOW_SHININESS;

    viewState.showMapPanel = false;
    viewState.showHeliodonPanel = false;
    viewState.showWeatherPanel = false;
    viewState.showDiurnalTemperaturePanel = false;
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
    viewState.showDailyBuildingEnergyPanel = false;
    viewState.showYearlyBuildingEnergyPanel = false;
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
    viewState.dailyBuildingEnergyPanelRect = new Rectangle(0, 0, 600, 400);
    viewState.yearlyBuildingEnergyPanelRect = new Rectangle(0, 0, 600, 400);
    viewState.evolutionPanelRect = new Rectangle(0, 0, 640, 400);

    viewState.mapZoom = 18;
    viewState.mapType = 'roadmap';
    viewState.mapTilt = 0;
  }
}
