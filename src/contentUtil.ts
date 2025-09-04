import { Color } from 'three';
import * as Constants from './constants';
import { DoorType } from './models/DoorModel';
import { RoofStructure } from './models/RoofModel';
import { WallFill, WallStructure } from './models/WallModel';
import { WindowType } from './models/WindowModel';
import {
  CuboidTexture,
  DoorTexture,
  EvolutionMethod,
  FoundationTexture,
  ObjectType,
  RoofTexture,
  TrackerType,
  WallTexture,
} from './types';
import { DEFAULT_PARAPET_SETTINGS } from './views/wall/parapet';
import { DefaultGraphState } from './stores/DefaultGraphState';
import { DefaultSolarPanelArrayLayoutParams } from './stores/DefaultSolarPanelArrayLayoutParams';
import { DefaultSolarPanelArrayLayoutConstraints } from './stores/DefaultSolarPanelArrayLayoutConstraints';
import { DefaultEvolutionaryAlgorithmState } from './stores/DefaultEvolutionaryAlgorithmState';
import { DefaultEconomicsParams } from './stores/DefaultEconomicsParams';

export class ContentUtil {
  static compressContent(c: any) {
    ContentUtil.compressWorld(c.world);
    ContentUtil.compressElements(c.elements);
    ContentUtil.compressView(c.view);
    ContentUtil.compressGraphState(c.graphState);
    ContentUtil.compressSolarPanelArrayLayoutParams(c.solarPanelArrayLayoutParams);
    ContentUtil.compressSolarPanelArrayLayoutConstraints(c.solarPanelArrayLayoutConstraints);
    ContentUtil.compressEvolutionaryAlgorithmState(c.evolutionaryAlgorithmState);
    ContentUtil.compressEconomicsParams(c.economicsParams);

    if (!c.owner) delete c.owner;
    if (!c.email) delete c.email;
    if (!c.modelAuthor) delete c.modelAuthor;
    if (!c.modelLabel) delete c.modelLabel;
    if (!c.modelDescription) delete c.modelDescription;
    if (!c.designProjectType) delete c.designProjectType;

    if (c.sceneRadius === Constants.DEFAULT_SCENE_RADIUS) delete c.sceneRadius;
    if (c.audioTitle === Constants.DEFAULT_AUDIO_TITLE) delete c.audioTitle;
    if (c.audioUrl === Constants.DEFAULT_AUDIO_URL) delete c.audioUrl;

    if (c.modelType === 'Unknown') delete c.modelType;
    if (c.animate24Hours === false) delete c.animate24Hours;
    if (c.evolutionMethod === EvolutionMethod.GENETIC_ALGORITHM) delete c.evolutionMethod;
    if (c.moveStep === 0.5) delete c.moveStep;
    if (c.minimumNavigationMoveSpeed === 3) delete c.minimumNavigationMoveSpeed;
    if (c.minimumNavigationTurnSpeed === 3) delete c.minimumNavigationTurnSpeed;
    if (c.notes.length === 0) delete c.notes;

    return c;
  }

  static expandContent(c: any) {
    ContentUtil.expandWorld(c.world);
    ContentUtil.expandElements(c.elements);
    ContentUtil.expandView(c.view);

    ContentUtil.expandGraphState(c);
    ContentUtil.expandSolarPanelArrayLayoutParams(c);
    ContentUtil.expandSolarPanelArrayLayoutConstraints(c);
    ContentUtil.expandEvolutionaryAlgorithmState(c);
    ContentUtil.expandEconomicsParams(c);

    if (c.owner === undefined) c.owner = null;
    if (c.email === undefined) c.email = null;
    if (c.modelAuthor === undefined) c.modelAuthor = null;
    if (c.modelLabel === undefined) c.modelLabel = null;
    if (c.modelDescription === undefined) c.modelDescription = null;
    if (c.designProjectType === undefined) c.designProjectType = null;

    if (c.sceneRadius === undefined) c.sceneRadius = Constants.DEFAULT_SCENE_RADIUS;
    if (c.audioTitle === undefined) c.audioTitle = Constants.DEFAULT_AUDIO_TITLE;
    if (c.audioUrl === undefined) c.audioUrl = Constants.DEFAULT_AUDIO_URL;

    if (c.modelType === undefined) c.modelType = 'Unknown';
    if (c.animate24Hours === undefined) c.animate24Hours = false;
    if (c.evolutionMethod === undefined) c.evolutionMethod = EvolutionMethod.GENETIC_ALGORITHM;
    if (c.moveStep === undefined) c.moveStep = 0.5;
    if (c.minimumNavigationMoveSpeed === undefined) c.minimumNavigationMoveSpeed = 3;
    if (c.minimumNavigationTurnSpeed === undefined) c.minimumNavigationTurnSpeed = 3;
    if (c.notes === undefined) c.notes = [];

    return c;
  }

  static compressElements(elements: any[]) {
    for (const e of elements) {
      ContentUtil.compressBasicElement(e);
      switch (e.type) {
        case ObjectType.Cuboid: {
          ContentUtil.compressCuboid(e);
          break;
        }
        case ObjectType.Foundation: {
          ContentUtil.compressFoundation(e);
          break;
        }
        case ObjectType.Wall: {
          ContentUtil.compressWall(e);
          break;
        }
        case ObjectType.Door: {
          ContentUtil.compressDoor(e);
          break;
        }
        case ObjectType.Window: {
          ContentUtil.compressWindow(e);
          break;
        }
        case ObjectType.Roof: {
          ContentUtil.compressRoof(e);
          break;
        }
        case ObjectType.SolarWaterHeater: {
          ContentUtil.compressSolarWaterHeater(e);
          break;
        }
        case ObjectType.SolarPanel:
        case ObjectType.FresnelReflector:
        case ObjectType.ParabolicDish:
        case ObjectType.ParabolicTrough:
        case ObjectType.Heliostat: {
          ContentUtil.compressSolarCollector(e);
          break;
        }
        case ObjectType.Human:
        case ObjectType.Tree:
        case ObjectType.Flower: {
          ContentUtil.compressBillBoard(e);
          break;
        }
        case ObjectType.WindTurbine: {
          ContentUtil.compressWindTurbine(e);
          break;
        }
        case ObjectType.Light: {
          ContentUtil.compressLight(e);
          break;
        }
        case ObjectType.BatteryStorage: {
          ContentUtil.compressBatterStorage(e);
          break;
        }
      }
    }
    return elements;
  }

  static expandElements(elements: any[]) {
    for (const e of elements) {
      switch (e.type) {
        case ObjectType.Cuboid: {
          ContentUtil.expandCuboid(e);
          break;
        }
        case ObjectType.Foundation: {
          ContentUtil.expandFoundation(e);
          break;
        }
        case ObjectType.Wall: {
          ContentUtil.expandWall(e);
          break;
        }
        case ObjectType.Door: {
          ContentUtil.expandDoor(e);
          break;
        }
        case ObjectType.Window: {
          ContentUtil.expandWindow(e);
          break;
        }
        case ObjectType.Roof: {
          ContentUtil.expandRoof(e);
          break;
        }
        case ObjectType.SolarWaterHeater: {
          ContentUtil.expandSolarWaterHeater(e);
          break;
        }
        case ObjectType.SolarPanel:
        case ObjectType.FresnelReflector:
        case ObjectType.ParabolicDish:
        case ObjectType.ParabolicTrough:
        case ObjectType.Heliostat: {
          ContentUtil.expandSolarCollector(e);
          break;
        }
        case ObjectType.Human:
        case ObjectType.Tree:
        case ObjectType.Flower: {
          ContentUtil.expandBillBoards(e);
          break;
        }
        case ObjectType.WindTurbine: {
          ContentUtil.expandWindTurbine(e);
          break;
        }
        case ObjectType.Light: {
          ContentUtil.expandLight(e);
          break;
        }
        case ObjectType.BatteryStorage: {
          ContentUtil.expandBatterStorage(e);
          break;
        }
      }
    }
    return elements;
  }

  static compressView(v: any) {
    if (v.navigationView === Constants.DEFAULT_VIEW_NAVIGATION_VIEW) delete v.navigationView;
    if (v.orthographic === Constants.DEFAULT_VIEW_ORTHOGRAPHIC) delete v.orthographic;
    if (v.enableRotate === Constants.DEFAULT_VIEW_ENABLE_ROTATE) delete v.enableRotate;
    if (v.shadowCameraFar === Constants.DEFAULT_VIEW_SHADOW_CAMERA_FAR) delete v.shadowCameraFar;

    if (v.axes === Constants.DEFAULT_VIEW_AXES) delete v.axes;
    if (v.heatFluxScaleFactor === Constants.DEFAULT_VIEW_HEAT_FLUX_SCALE_FACTOR) delete v.heatFluxScaleFactor;
    if (isSameColor(v.heatFluxColor, Constants.DEFAULT_VIEW_HEAT_FLUX_COLOR)) delete v.heatFluxColor;
    if (v.heatFluxWidth === Constants.DEFAULT_VIEW_HEAT_FLUX_WIDTH) delete v.heatFluxWidth;
    if (v.solarRadiationHeatMapMaxValue === Constants.DEFAULT_VIEW_SOLAR_RADIATION_HEAT_MAP_MAX_VALUE)
      delete v.solarRadiationHeatMapMaxValue;
    if (v.solarRadiationHeatMapReflectionOnly === Constants.DEFAULT_VIEW_SOLAR_RADIATION_HEAT_MAP_REFLECTION_ONLY)
      delete v.solarRadiationHeatMapReflectionOnly;
    if (v.shadowEnabled === Constants.DEFAULT_VIEW_SHADOW_ENABLED) delete v.shadowEnabled;
    if (v.theme === Constants.DEFAULT_VIEW_THEME) delete v.theme;
    if (v.heliodon === Constants.DEFAULT_VIEW_HELIODON) delete v.heliodon;
    if (v.showSunAngles === Constants.DEFAULT_VIEW_SHOW_SUN_ANGLES) delete v.showSunAngles;
    if (v.showAzimuthAngle === Constants.DEFAULT_VIEW_SHOW_AZIMUTH_ANGLE) delete v.showAzimuthAngle;
    if (v.showElevationAngle === Constants.DEFAULT_VIEW_SHOW_ELEVATION_ANGLE) delete v.showElevationAngle;
    if (v.showZenithAngle === Constants.DEFAULT_VIEW_SHOW_ZENITH_ANGLE) delete v.showZenithAngle;
    if (v.hideAddress === Constants.DEFAULT_VIEW_HIDE_ADDRESS) delete v.hideAddress;
    if (v.groundImage === Constants.DEFAULT_VIEW_GROUND_IMAGE) delete v.groundImage;
    if (v.groundImageType === Constants.DEFAULT_VIEW_GROUND_IMAGE_TYPE) delete v.groundImageType;
    if (isSameColor(v.groundColor, Constants.DEFAULT_VIEW_GROUND_COLOR)) delete v.groundColor;
    if (v.waterSurface === Constants.DEFAULT_VIEW_WATER_SURFACE) delete v.waterSurface;
    if (v.solarPanelShininess === Constants.DEFAULT_VIEW_SOLAR_PANEL_SHININESS) delete v.solarPanelShininess;
    if (v.windowShininess === Constants.DEFAULT_VIEW_WINDOW_SHININESS) delete v.windowShininess;

    if (v.showModelTree === Constants.DEFAULT_VIEW_SHOW_MODEL_TREE) delete v.showModelTree;
    if (v.hideShareLinks === Constants.DEFAULT_VIEW_HIDE_SHARE_LINKS) delete v.hideShareLinks;
    if (v.showMapPanel === Constants.DEFAULT_VIEW_SHOW_MAP_PANEL) delete v.showMapPanel;
    if (v.showHeliodonPanel === Constants.DEFAULT_VIEW_SHOW_HELIODON_PANEL) delete v.showHeliodonPanel;
    if (v.showWeatherPanel === Constants.DEFAULT_VIEW_SHOW_WEATHER_PANEL) delete v.showWeatherPanel;
    if (v.showDiurnalTemperaturePanel === Constants.DEFAULT_VIEW_SHOW_DIURNAL_TEMPERATURE_PANEL)
      delete v.showDiurnalTemperaturePanel;
    if (v.showStickyNotePanel === Constants.DEFAULT_VIEW_SHOW_STICKY_NOTE_PANEL) delete v.showStickyNotePanel;
    if (v.showAudioPlayerPanel === Constants.DEFAULT_VIEW_SHOW_AUDIO_PLAYER_PANEL) delete v.showAudioPlayerPanel;
    if (v.showSiteInfoPanel === Constants.DEFAULT_VIEW_SHOW_SITE_INFO_PANEL) delete v.showSiteInfoPanel;
    if (v.showDesignInfoPanel === Constants.DEFAULT_VIEW_SHOW_DESIGN_INFO_PANEL) delete v.showDesignInfoPanel;
    if (v.showInstructionPanel === Constants.DEFAULT_VIEW_SHOW_INSTRUCTION_PANEL) delete v.showInstructionPanel;
    if (v.showDailyLightSensorPanel === Constants.DEFAULT_VIEW_SHOW_DAILY_LIGHT_SENSOR_PANEL)
      delete v.showDailyLightSensorPanel;
    if (v.showYearlyLightSensorPanel === Constants.DEFAULT_VIEW_SHOW_YEARLY_LIGHT_SENSOR_PANEL)
      delete v.showYearlyLightSensorPanel;
    if (v.showDailyPvYieldPanel === Constants.DEFAULT_VIEW_SHOW_DAILY_PV_YIELD_PANEL) delete v.showDailyPvYieldPanel;
    if (v.showYearlyPvYieldPanel === Constants.DEFAULT_VIEW_SHOW_YEARLY_PV_YIELD_PANEL) delete v.showYearlyPvYieldPanel;
    if (v.showSolarPanelVisibilityResultsPanel === Constants.DEFAULT_VIEW_SHOW_SOLAR_PANEL_VISIBILITY_RESULTS_PANEL)
      delete v.showSolarPanelVisibilityResultsPanel;
    if (v.showDailyParabolicTroughYieldPanel === Constants.DEFAULT_VIEW_SHOW_DAILY_PARABOLIC_TROUGH_YIELD_PANEL)
      delete v.showDailyParabolicTroughYieldPanel;
    if (v.showYearlyParabolicTroughYieldPanel === Constants.DEFAULT_VIEW_SHOW_YEARLY_PARABOLIC_TROUGH_YIELD_PANEL)
      delete v.showYearlyParabolicTroughYieldPanel;
    if (v.showDailyParabolicDishYieldPanel === Constants.DEFAULT_VIEW_SHOW_DAILY_PARABOLIC_DISH_YIELD_PANEL)
      delete v.showDailyParabolicDishYieldPanel;
    if (v.showYearlyParabolicDishYieldPanel === Constants.DEFAULT_VIEW_SHOW_YEARLY_PARABOLIC_DISH_YIELD_PANEL)
      delete v.showYearlyParabolicDishYieldPanel;
    if (v.showDailyFresnelReflectorYieldPanel === Constants.DEFAULT_VIEW_SHOW_DAILY_FRESNEL_REFLECTOR_YIELD_PANEL)
      delete v.showDailyFresnelReflectorYieldPanel;
    if (v.showYearlyFresnelReflectorYieldPanel === Constants.DEFAULT_VIEW_SHOW_YEARLY_FRESNEL_REFLECTOR_YIELD_PANEL)
      delete v.showYearlyFresnelReflectorYieldPanel;
    if (v.showDailyHeliostatYieldPanel === Constants.DEFAULT_VIEW_SHOW_DAILY_HELIOSTAT_YIELD_PANEL)
      delete v.showDailyHeliostatYieldPanel;
    if (v.showYearlyHeliostatYieldPanel === Constants.DEFAULT_VIEW_SHOW_YEARLY_HELIOSTAT_YIELD_PANEL)
      delete v.showYearlyHeliostatYieldPanel;
    if (v.showDailyUpdraftTowerYieldPanel === Constants.DEFAULT_VIEW_SHOW_DAILY_UPDRAFT_TOWER_YIELD_PANEL)
      delete v.showDailyUpdraftTowerYieldPanel;
    if (v.showYearlyUpdraftTowerYieldPanel === Constants.DEFAULT_VIEW_SHOW_YEARLY_UPDRAFT_TOWER_YIELD_PANEL)
      delete v.showYearlyUpdraftTowerYieldPanel;
    if (v.showDailyBuildingEnergyPanel === Constants.DEFAULT_VIEW_SHOW_DAILY_BUILDING_ENERGY_PANEL)
      delete v.showDailyBuildingEnergyPanel;
    if (v.showYearlyBuildingEnergyPanel === Constants.DEFAULT_VIEW_SHOW_YEARLY_BUILDING_ENERGY_PANEL)
      delete v.showYearlyBuildingEnergyPanel;
    if (v.showDailyBatteryStorageEnergyPanel === Constants.DEFAULT_VIEW_SHOW_DAILY_BATTERY_STORAGE_ENERGY_PANEL)
      delete v.showDailyBatteryStorageEnergyPanel;
    if (v.showYearlyBatteryStorageEnergyPanel === Constants.DEFAULT_VIEW_SHOW_YEARLY_BATTERY_STORAGE_ENERGY_PANEL)
      delete v.showYearlyBatteryStorageEnergyPanel;
    if (v.showEvolutionPanel === Constants.DEFAULT_VIEW_SHOW_EVOLUTION_PANEL) delete v.showEvolutionPanel;
    if (v.autoRotate === Constants.DEFAULT_VIEW_AUTO_ROTATE) delete v.autoRotate;

    if (v.mapZoom === Constants.DEFAULT_VIEW_MAP_ZOOM) delete v.mapZoom;
    if (v.mapType === Constants.DEFAULT_VIEW_MAP_TYPE) delete v.mapType;
    if (v.mapTilt === Constants.DEFAULT_VIEW_MAP_TILT) delete v.mapTilt;

    if (v.heliodonPanelX === Constants.DEFAULT_HELIODON_PANEL_X) delete v.heliodonPanelX;
    if (v.heliodonPanelY === Constants.DEFAULT_HELIODON_PANEL_Y) delete v.heliodonPanelY;
    if (v.mapPanelX === Constants.DEFAULT_MAP_PANEL_X) delete v.mapPanelX;
    if (v.mapPanelY === Constants.DEFAULT_MAP_PANEL_Y) delete v.mapPanelY;

    if (isRectSame(v.weatherPanelRect, Constants.DEFAULT_VIEW_WEATHER_PANEL_RECT)) delete v.weatherPanelRect;
    if (isRectSame(v.diurnalTemperaturePanelRect, Constants.DEFAULT_VIEW_DIURNAL_TEMPERATURE_PANEL_RECT))
      delete v.diurnalTemperaturePanelRect;
    if (isRectSame(v.stickyNotePanelRect, Constants.DEFAULT_VIEW_STICKY_NOTE_PANEL_RECT)) delete v.stickyNotePanelRect;
    if (isRectSame(v.audioPlayerPanelRect, Constants.DEFAULT_VIEW_AUDIO_PLAYER_PANEL_RECT))
      delete v.audioPlayerPanelRect;
    if (isRectSame(v.dailyLightSensorPanelRect, Constants.DEFAULT_VIEW_DAILY_LIGHT_SENSOR_PANEL_RECT))
      delete v.dailyLightSensorPanelRect;
    if (isRectSame(v.yearlyLightSensorPanelRect, Constants.DEFAULT_VIEW_YEARLY_LIGHT_SENSOR_PANEL_RECT))
      delete v.yearlyLightSensorPanelRect;
    if (v.yearlyLightSensorPanelShowDaylight === Constants.DEFAULT_VIEW_YEARLY_LIGHT_SENSOR_PANEL_SHOW_DAYLIGHT)
      delete v.yearlyLightSensorPanelShowDaylight;
    if (v.yearlyLightSensorPanelShowClearness === Constants.DEFAULT_VIEW_YEARLY_LIGHT_SENSOR_PANEL_SHOW_CLEARNESS)
      delete v.yearlyLightSensorPanelShowClearness;
    if (isRectSame(v.dailyPvYieldPanelRect, Constants.DEFAULT_VIEW_DAILY_PV_YIELD_PANEL_RECT))
      delete v.dailyPvYieldPanelRect;
    if (isRectSame(v.yearlyPvYieldPanelRect, Constants.DEFAULT_VIEW_YEARLY_PV_YIELD_PANEL_RECT))
      delete v.yearlyPvYieldPanelRect;
    if (isRectSame(v.visibilityResultsPanelRect, Constants.DEFAULT_VIEW_VISIBILITY_RESULTS_PANEL_RECT))
      delete v.visibilityResultsPanelRect;
    if (
      isRectSame(v.dailyParabolicTroughYieldPanelRect, Constants.DEFAULT_VIEW_DAILY_PARABOLIC_TROUGH_YIELD_PANEL_RECT)
    )
      delete v.dailyParabolicTroughYieldPanelRect;
    if (
      isRectSame(v.yearlyParabolicTroughYieldPanelRect, Constants.DEFAULT_VIEW_YEARLY_PARABOLIC_TROUGH_YIELD_PANEL_RECT)
    )
      delete v.yearlyParabolicTroughYieldPanelRect;
    if (isRectSame(v.dailyParabolicDishYieldPanelRect, Constants.DEFAULT_VIEW_DAILY_PARABOLIC_DISH_YIELD_PANEL_RECT))
      delete v.dailyParabolicDishYieldPanelRect;
    if (isRectSame(v.yearlyParabolicDishYieldPanelRect, Constants.DEFAULT_VIEW_YEARLY_PARABOLIC_DISH_YIELD_PANEL_RECT))
      delete v.yearlyParabolicDishYieldPanelRect;
    if (
      isRectSame(v.dailyFresnelReflectorYieldPanelRect, Constants.DEFAULT_VIEW_DAILY_FRESNEL_REFLECTOR_YIELD_PANEL_RECT)
    )
      delete v.dailyFresnelReflectorYieldPanelRect;
    if (
      isRectSame(
        v.yearlyFresnelReflectorYieldPanelRect,
        Constants.DEFAULT_VIEW_YEARLY_FRESNEL_REFLECTOR_YIELD_PANEL_RECT,
      )
    )
      delete v.yearlyFresnelReflectorYieldPanelRect;
    if (isRectSame(v.dailyHeliostatYieldPanelRect, Constants.DEFAULT_VIEW_DAILY_HELIOSTAT_YIELD_PANEL_RECT))
      delete v.dailyHeliostatYieldPanelRect;
    if (isRectSame(v.yearlyHeliostatYieldPanelRect, Constants.DEFAULT_VIEW_YEARLY_HELIOSTAT_YIELD_PANEL_RECT))
      delete v.yearlyHeliostatYieldPanelRect;
    if (isRectSame(v.dailyUpdraftTowerYieldPanelRect, Constants.DEFAULT_VIEW_DAILY_UPDRAFT_TOWER_YIELD_PANEL_RECT))
      delete v.dailyUpdraftTowerYieldPanelRect;
    if (isRectSame(v.yearlyUpdraftTowerYieldPanelRect, Constants.DEFAULT_VIEW_YEARLY_UPDRAFT_TOWER_YIELD_PANEL_RECT))
      delete v.yearlyUpdraftTowerYieldPanelRect;
    if (isRectSame(v.dailyBuildingEnergyPanelRect, Constants.DEFAULT_VIEW_DAILY_BUILDING_ENERGY_PANEL_RECT))
      delete v.dailyBuildingEnergyPanelRect;
    if (isRectSame(v.yearlyBuildingEnergyPanelRect, Constants.DEFAULT_VIEW_YEARLY_BUILDING_ENERGY_PANEL_RECT))
      delete v.yearlyBuildingEnergyPanelRect;
    if (
      isRectSame(v.dailyBatteryStorageEnergyPanelRect, Constants.DEFAULT_VIEW_DAILY_BATTERY_STORAGE_ENERGY_PANEL_RECT)
    )
      delete v.dailyBatteryStorageEnergyPanelRect;
    if (
      isRectSame(v.yearlyBatteryStorageEnergyPanelRect, Constants.DEFAULT_VIEW_YEARLY_BATTERY_STORAGE_ENERGY_PANEL_RECT)
    )
      delete v.yearlyBatteryStorageEnergyPanelRect;
    if (isRectSame(v.evolutionPanelRect, Constants.DEFAULT_VIEW_EVOLUTION_PANEL_RECT)) delete v.evolutionPanelRect;

    // legacy properties
    delete v.weatherPanelX;
    delete v.weatherPanelY;
    delete v.diurnalTemperaturePanelX;
    delete v.diurnalTemperaturePanelY;
    delete v.stickyNotePanelX;
    delete v.stickyNotePanelY;
    delete v.audioPlayerPanelX;
    delete v.audioPlayerPanelY;
    delete v.dailyLightSensorPanelX;
    delete v.dailyLightSensorPanelY;
    delete v.yearlyLightSensorPanelX;
    delete v.yearlyLightSensorPanelY;
    delete v.dailyPvYieldPanelX;
    delete v.dailyPvYieldPanelY;
    delete v.yearlyPvYieldPanelX;
    delete v.yearlyPvYieldPanelY;
    delete v.visibilityResultsPanelX;
    delete v.visibilityResultsPanelY;
    delete v.dailyParabolicTroughYieldPanelX;
    delete v.dailyParabolicTroughYieldPanelY;
    delete v.yearlyParabolicTroughYieldPanelX;
    delete v.yearlyParabolicTroughYieldPanelY;
    delete v.dailyParabolicDishYieldPanelX;
    delete v.dailyParabolicDishYieldPanelY;
    delete v.yearlyParabolicDishYieldPanelX;
    delete v.yearlyParabolicDishYieldPanelY;
    delete v.dailyFresnelReflectorYieldPanelX;
    delete v.dailyFresnelReflectorYieldPanelY;
    delete v.yearlyFresnelReflectorYieldPanelX;
    delete v.yearlyFresnelReflectorYieldPanelY;
    delete v.dailyHeliostatYieldPanelX;
    delete v.dailyHeliostatYieldPanelY;
    delete v.yearlyHeliostatYieldPanelX;
    delete v.yearlyHeliostatYieldPanelY;
    delete v.dailyUpdraftTowerYieldPanelX;
    delete v.dailyUpdraftTowerYieldPanelY;
    delete v.yearlyUpdraftTowerYieldPanelX;
    delete v.yearlyUpdraftTowerYieldPanelY;
    delete v.dailyBuildingEnergyPanelX;
    delete v.dailyBuildingEnergyPanelY;
    delete v.yearlyBuildingEnergyPanelX;
    delete v.yearlyBuildingEnergyPanelY;
    delete v.dailyBatteryStorageEnergyPanelX;
    delete v.dailyBatteryStorageEnergyPanelY;
    delete v.yearlyBatteryStorageEnergyPanelX;
    delete v.yearlyBatteryStorageEnergyPanelY;
    delete v.evolutionPanelX;
    delete v.evolutionPanelY;

    return v;
  }

  static expandView(v: any) {
    if (v.navigationView === undefined) v.navigationView = Constants.DEFAULT_VIEW_NAVIGATION_VIEW;
    if (v.orthographic === undefined) v.orthographic = Constants.DEFAULT_VIEW_ORTHOGRAPHIC;
    if (v.enableRotate === undefined) v.enableRotate = Constants.DEFAULT_VIEW_ENABLE_ROTATE;
    if (v.cameraPosition === undefined) v.cameraPosition = Constants.DEFAULT_VIEW_CAMERA_POSITION;
    if (v.cameraPosition2D === undefined) v.cameraPosition2D = Constants.DEFAULT_VIEW_CAMERA_POSITION_2D;
    if (v.panCenter === undefined) v.panCenter = Constants.DEFAULT_VIEW_PAN_CENTER;
    if (v.panCenter2D === undefined) v.panCenter2D = Constants.DEFAULT_VIEW_PAN_CENTER_2D;
    if (v.cameraZoom === undefined) v.cameraZoom = Constants.DEFAULT_VIEW_CAMERA_ZOOM;
    if (v.cameraPositionNav === undefined) v.cameraPositionNav = Constants.DEFAULT_VIEW_CAMERA_POSITION_NAV;
    if (v.cameraRotationNav === undefined) v.cameraRotationNav = Constants.DEFAULT_VIEW_CAMERA_ROTATION_NAV;
    if (v.shadowCameraFar === undefined) v.shadowCameraFar = Constants.DEFAULT_VIEW_SHADOW_CAMERA_FAR;

    if (v.axes === undefined) v.axes = Constants.DEFAULT_VIEW_AXES;
    if (v.heatFluxScaleFactor === undefined) v.heatFluxScaleFactor = Constants.DEFAULT_VIEW_HEAT_FLUX_SCALE_FACTOR;
    if (v.heatFluxColor === undefined) v.heatFluxColor = Constants.DEFAULT_VIEW_HEAT_FLUX_COLOR;
    if (v.heatFluxWidth === undefined) v.heatFluxWidth = Constants.DEFAULT_VIEW_HEAT_FLUX_WIDTH;
    if (v.solarRadiationHeatMapMaxValue === undefined)
      v.solarRadiationHeatMapMaxValue = Constants.DEFAULT_VIEW_SOLAR_RADIATION_HEAT_MAP_MAX_VALUE;
    if (v.solarRadiationHeatMapReflectionOnly === undefined)
      v.solarRadiationHeatMapReflectionOnly = Constants.DEFAULT_VIEW_SOLAR_RADIATION_HEAT_MAP_REFLECTION_ONLY;
    if (v.shadowEnabled === undefined) v.shadowEnabled = Constants.DEFAULT_VIEW_SHADOW_ENABLED;
    if (v.theme === undefined) v.theme = Constants.DEFAULT_VIEW_THEME;
    if (v.heliodon === undefined) v.heliodon = Constants.DEFAULT_VIEW_HELIODON;
    if (v.showSunAngles === undefined) v.showSunAngles = Constants.DEFAULT_VIEW_SHOW_SUN_ANGLES;
    if (v.showAzimuthAngle === undefined) v.showAzimuthAngle = Constants.DEFAULT_VIEW_SHOW_AZIMUTH_ANGLE;
    if (v.showElevationAngle === undefined) v.showElevationAngle = Constants.DEFAULT_VIEW_SHOW_ELEVATION_ANGLE;
    if (v.showZenithAngle === undefined) v.showZenithAngle = Constants.DEFAULT_VIEW_SHOW_ZENITH_ANGLE;
    if (v.hideAddress === undefined) v.hideAddress = Constants.DEFAULT_VIEW_HIDE_ADDRESS;
    if (v.groundImage === undefined) v.groundImage = Constants.DEFAULT_VIEW_GROUND_IMAGE;
    if (v.groundImageType === undefined) v.groundImageType = Constants.DEFAULT_VIEW_GROUND_IMAGE_TYPE;
    if (v.groundColor === undefined) v.groundColor = Constants.DEFAULT_VIEW_GROUND_COLOR;
    if (v.waterSurface === undefined) v.waterSurface = Constants.DEFAULT_VIEW_WATER_SURFACE;
    if (v.solarPanelShininess === undefined) v.solarPanelShininess = Constants.DEFAULT_VIEW_SOLAR_PANEL_SHININESS;
    if (v.windowShininess === undefined) v.windowShininess = Constants.DEFAULT_VIEW_WINDOW_SHININESS;

    if (v.showModelTree === undefined) v.showModelTree = Constants.DEFAULT_VIEW_SHOW_MODEL_TREE;
    if (v.hideShareLinks === undefined) v.hideShareLinks = Constants.DEFAULT_VIEW_HIDE_SHARE_LINKS;
    if (v.showMapPanel === undefined) v.showMapPanel = Constants.DEFAULT_VIEW_SHOW_MAP_PANEL;
    if (v.showHeliodonPanel === undefined) v.showHeliodonPanel = Constants.DEFAULT_VIEW_SHOW_HELIODON_PANEL;
    if (v.showWeatherPanel === undefined) v.showWeatherPanel = Constants.DEFAULT_VIEW_SHOW_WEATHER_PANEL;
    if (v.showDiurnalTemperaturePanel === undefined)
      v.showDiurnalTemperaturePanel = Constants.DEFAULT_VIEW_SHOW_DIURNAL_TEMPERATURE_PANEL;
    if (v.showStickyNotePanel === undefined) v.showStickyNotePanel = Constants.DEFAULT_VIEW_SHOW_STICKY_NOTE_PANEL;
    if (v.showAudioPlayerPanel === undefined) v.showAudioPlayerPanel = Constants.DEFAULT_VIEW_SHOW_AUDIO_PLAYER_PANEL;
    if (v.showSiteInfoPanel === undefined) v.showSiteInfoPanel = Constants.DEFAULT_VIEW_SHOW_SITE_INFO_PANEL;
    if (v.showDesignInfoPanel === undefined) v.showDesignInfoPanel = Constants.DEFAULT_VIEW_SHOW_DESIGN_INFO_PANEL;
    if (v.showInstructionPanel === undefined) v.showInstructionPanel = Constants.DEFAULT_VIEW_SHOW_INSTRUCTION_PANEL;
    if (v.showDailyLightSensorPanel === undefined)
      v.showDailyLightSensorPanel = Constants.DEFAULT_VIEW_SHOW_DAILY_LIGHT_SENSOR_PANEL;
    if (v.showYearlyLightSensorPanel === undefined)
      v.showYearlyLightSensorPanel = Constants.DEFAULT_VIEW_SHOW_YEARLY_LIGHT_SENSOR_PANEL;
    if (v.showDailyPvYieldPanel === undefined)
      v.showDailyPvYieldPanel = Constants.DEFAULT_VIEW_SHOW_DAILY_PV_YIELD_PANEL;
    if (v.showYearlyPvYieldPanel === undefined)
      v.showYearlyPvYieldPanel = Constants.DEFAULT_VIEW_SHOW_YEARLY_PV_YIELD_PANEL;
    if (v.showSolarPanelVisibilityResultsPanel === undefined)
      v.showSolarPanelVisibilityResultsPanel = Constants.DEFAULT_VIEW_SHOW_SOLAR_PANEL_VISIBILITY_RESULTS_PANEL;
    if (v.showDailyParabolicTroughYieldPanel === undefined)
      v.showDailyParabolicTroughYieldPanel = Constants.DEFAULT_VIEW_SHOW_DAILY_PARABOLIC_TROUGH_YIELD_PANEL;
    if (v.showYearlyParabolicTroughYieldPanel === undefined)
      v.showYearlyParabolicTroughYieldPanel = Constants.DEFAULT_VIEW_SHOW_YEARLY_PARABOLIC_TROUGH_YIELD_PANEL;
    if (v.showDailyParabolicDishYieldPanel === undefined)
      v.showDailyParabolicDishYieldPanel = Constants.DEFAULT_VIEW_SHOW_DAILY_PARABOLIC_DISH_YIELD_PANEL;
    if (v.showYearlyParabolicDishYieldPanel === undefined)
      v.showYearlyParabolicDishYieldPanel = Constants.DEFAULT_VIEW_SHOW_YEARLY_PARABOLIC_DISH_YIELD_PANEL;
    if (v.showDailyFresnelReflectorYieldPanel === undefined)
      v.showDailyFresnelReflectorYieldPanel = Constants.DEFAULT_VIEW_SHOW_DAILY_FRESNEL_REFLECTOR_YIELD_PANEL;
    if (v.showYearlyFresnelReflectorYieldPanel === undefined)
      v.showYearlyFresnelReflectorYieldPanel = Constants.DEFAULT_VIEW_SHOW_YEARLY_FRESNEL_REFLECTOR_YIELD_PANEL;
    if (v.showDailyHeliostatYieldPanel === undefined)
      v.showDailyHeliostatYieldPanel = Constants.DEFAULT_VIEW_SHOW_DAILY_HELIOSTAT_YIELD_PANEL;
    if (v.showYearlyHeliostatYieldPanel === undefined)
      v.showYearlyHeliostatYieldPanel = Constants.DEFAULT_VIEW_SHOW_YEARLY_HELIOSTAT_YIELD_PANEL;
    if (v.showDailyUpdraftTowerYieldPanel === undefined)
      v.showDailyUpdraftTowerYieldPanel = Constants.DEFAULT_VIEW_SHOW_DAILY_UPDRAFT_TOWER_YIELD_PANEL;
    if (v.showYearlyUpdraftTowerYieldPanel === undefined)
      v.showYearlyUpdraftTowerYieldPanel = Constants.DEFAULT_VIEW_SHOW_YEARLY_UPDRAFT_TOWER_YIELD_PANEL;
    if (v.showDailyBuildingEnergyPanel === undefined)
      v.showDailyBuildingEnergyPanel = Constants.DEFAULT_VIEW_SHOW_DAILY_BUILDING_ENERGY_PANEL;
    if (v.showYearlyBuildingEnergyPanel === undefined)
      v.showYearlyBuildingEnergyPanel = Constants.DEFAULT_VIEW_SHOW_YEARLY_BUILDING_ENERGY_PANEL;
    if (v.showDailyBatteryStorageEnergyPanel === undefined)
      v.showDailyBatteryStorageEnergyPanel = Constants.DEFAULT_VIEW_SHOW_DAILY_BATTERY_STORAGE_ENERGY_PANEL;
    if (v.showYearlyBatteryStorageEnergyPanel === undefined)
      v.showYearlyBatteryStorageEnergyPanel = Constants.DEFAULT_VIEW_SHOW_YEARLY_BATTERY_STORAGE_ENERGY_PANEL;
    if (v.showEvolutionPanel === undefined) v.showEvolutionPanel = Constants.DEFAULT_VIEW_SHOW_EVOLUTION_PANEL;
    if (v.autoRotate === undefined) v.autoRotate = Constants.DEFAULT_VIEW_AUTO_ROTATE;

    if (v.heliodonPanelX === undefined) v.heliodonPanelX = Constants.DEFAULT_HELIODON_PANEL_X;
    if (v.heliodonPanelY === undefined) v.heliodonPanelY = Constants.DEFAULT_HELIODON_PANEL_Y;
    if (v.mapPanelX === undefined) v.mapPanelX = Constants.DEFAULT_MAP_PANEL_X;
    if (v.mapPanelY === undefined) v.mapPanelY = Constants.DEFAULT_MAP_PANEL_Y;
    if (v.diurnalTemperaturePanelRect === undefined)
      v.diurnalTemperaturePanelRect = { ...Constants.DEFAULT_VIEW_DIURNAL_TEMPERATURE_PANEL_RECT };
    if (v.stickyNotePanelRect === undefined)
      v.stickyNotePanelRect = { ...Constants.DEFAULT_VIEW_STICKY_NOTE_PANEL_RECT };
    if (v.audioPlayerPanelRect === undefined)
      v.audioPlayerPanelRect = { ...Constants.DEFAULT_VIEW_AUDIO_PLAYER_PANEL_RECT };
    if (v.dailyLightSensorPanelRect === undefined)
      v.dailyLightSensorPanelRect = { ...Constants.DEFAULT_VIEW_DAILY_LIGHT_SENSOR_PANEL_RECT };
    if (v.yearlyLightSensorPanelRect === undefined)
      v.yearlyLightSensorPanelRect = { ...Constants.DEFAULT_VIEW_YEARLY_LIGHT_SENSOR_PANEL_RECT };
    if (v.yearlyLightSensorPanelShowDaylight === undefined)
      v.yearlyLightSensorPanelShowDaylight = Constants.DEFAULT_VIEW_YEARLY_LIGHT_SENSOR_PANEL_SHOW_DAYLIGHT;
    if (v.yearlyLightSensorPanelShowClearness === undefined)
      v.yearlyLightSensorPanelShowClearness = Constants.DEFAULT_VIEW_YEARLY_LIGHT_SENSOR_PANEL_SHOW_CLEARNESS;
    if (v.dailyPvYieldPanelRect === undefined)
      v.dailyPvYieldPanelRect = { ...Constants.DEFAULT_VIEW_DAILY_PV_YIELD_PANEL_RECT };
    if (v.yearlyPvYieldPanelRect === undefined)
      v.yearlyPvYieldPanelRect = { ...Constants.DEFAULT_VIEW_YEARLY_PV_YIELD_PANEL_RECT };
    if (v.visibilityResultsPanelRect === undefined)
      v.visibilityResultsPanelRect = { ...Constants.DEFAULT_VIEW_VISIBILITY_RESULTS_PANEL_RECT };
    if (v.dailyParabolicTroughYieldPanelRect === undefined)
      v.dailyParabolicTroughYieldPanelRect = { ...Constants.DEFAULT_VIEW_DAILY_PARABOLIC_TROUGH_YIELD_PANEL_RECT };
    if (v.yearlyParabolicTroughYieldPanelRect === undefined)
      v.yearlyParabolicTroughYieldPanelRect = { ...Constants.DEFAULT_VIEW_YEARLY_PARABOLIC_TROUGH_YIELD_PANEL_RECT };
    if (v.dailyParabolicDishYieldPanelRect === undefined)
      v.dailyParabolicDishYieldPanelRect = { ...Constants.DEFAULT_VIEW_DAILY_PARABOLIC_DISH_YIELD_PANEL_RECT };
    if (v.yearlyParabolicDishYieldPanelRect === undefined)
      v.yearlyParabolicDishYieldPanelRect = { ...Constants.DEFAULT_VIEW_YEARLY_PARABOLIC_DISH_YIELD_PANEL_RECT };
    if (v.dailyFresnelReflectorYieldPanelRect === undefined)
      v.dailyFresnelReflectorYieldPanelRect = { ...Constants.DEFAULT_VIEW_DAILY_FRESNEL_REFLECTOR_YIELD_PANEL_RECT };
    if (v.yearlyFresnelReflectorYieldPanelRect === undefined)
      v.yearlyFresnelReflectorYieldPanelRect = { ...Constants.DEFAULT_VIEW_YEARLY_FRESNEL_REFLECTOR_YIELD_PANEL_RECT };
    if (v.dailyHeliostatYieldPanelRect === undefined)
      v.dailyHeliostatYieldPanelRect = { ...Constants.DEFAULT_VIEW_DAILY_HELIOSTAT_YIELD_PANEL_RECT };
    if (v.yearlyHeliostatYieldPanelRect === undefined)
      v.yearlyHeliostatYieldPanelRect = { ...Constants.DEFAULT_VIEW_YEARLY_HELIOSTAT_YIELD_PANEL_RECT };
    if (v.dailyUpdraftTowerYieldPanelRect === undefined)
      v.dailyUpdraftTowerYieldPanelRect = { ...Constants.DEFAULT_VIEW_DAILY_UPDRAFT_TOWER_YIELD_PANEL_RECT };
    if (v.yearlyUpdraftTowerYieldPanelRect === undefined)
      v.yearlyUpdraftTowerYieldPanelRect = { ...Constants.DEFAULT_VIEW_YEARLY_UPDRAFT_TOWER_YIELD_PANEL_RECT };
    if (v.dailyBuildingEnergyPanelRect === undefined)
      v.dailyBuildingEnergyPanelRect = { ...Constants.DEFAULT_VIEW_DAILY_BUILDING_ENERGY_PANEL_RECT };
    if (v.yearlyBuildingEnergyPanelRect === undefined)
      v.yearlyBuildingEnergyPanelRect = { ...Constants.DEFAULT_VIEW_YEARLY_BUILDING_ENERGY_PANEL_RECT };
    if (v.dailyBatteryStorageEnergyPanelRect === undefined)
      v.dailyBatteryStorageEnergyPanelRect = { ...Constants.DEFAULT_VIEW_DAILY_BATTERY_STORAGE_ENERGY_PANEL_RECT };
    if (v.yearlyBatteryStorageEnergyPanelRect === undefined)
      v.yearlyBatteryStorageEnergyPanelRect = { ...Constants.DEFAULT_VIEW_YEARLY_BATTERY_STORAGE_ENERGY_PANEL_RECT };
    if (v.evolutionPanelRect === undefined) v.evolutionPanelRect = { ...Constants.DEFAULT_VIEW_EVOLUTION_PANEL_RECT };

    return v;
  }

  static compressWorld(w: any) {
    if (w.latitude === Constants.DEFAULT_LATITUDE) delete w.latitude;
    if (w.longitude === Constants.DEFAULT_LONGITUDE) delete w.longitude;
    if (w.address === Constants.DEFAULT_ADDRESS) delete w.address;
    if (w.countryCode === Constants.DEFAULT_COUNTRY_CODE) delete w.countryCode;

    if (w.name === Constants.DEFAULT_NAME) delete w.name;
    if (isSameGround(w.ground, Constants.DEFAULT_GROUND)) delete w.ground;

    if (w.leafDayOfYear1 === Constants.DEFAULT_LEAF_DAY_OF_YEAR_1) delete w.leafDayOfYear1;
    if (w.leafDayOfYear2 === Constants.DEFAULT_LEAF_DAY_OF_YEAR_2) delete w.leafDayOfYear2;

    if (w.airAttenuationCoefficient === Constants.DEFAULT_AIR_ATTENUATION_COEFFICIENT)
      delete w.airAttenuationCoefficient;
    if (w.airConvectiveCoefficient === Constants.DEFAULT_AIR_CONVECTIVE_COEFFICIENT) delete w.airConvectiveCoefficient;

    if (w.timesPerHour === Constants.DEFAULT_TIMES_PER_HOUR) delete w.timesPerHour;
    if (w.daysPerYear === Constants.DEFAULT_DAYS_PER_YEAR) delete w.daysPerYear;
    if (w.monthlyIrradianceLosses?.every((v: any, i: any) => v === Constants.DEFAULT_MONTHLY_IRRADIANCE_LOSSES[i]))
      delete w.monthlyIrradianceLosses;

    if (w.pvGridCellSize === Constants.DEFAULT_PV_GRID_CELL_SIZE) delete w.pvGridCellSize;
    if (w.discretization === Constants.DEFAULT_DISCRETIZATION) delete w.discretization;
    if (w.diurnalTemperatureModel === Constants.DEFAULT_DIURNAL_TEMPERATURE_MODEL) delete w.diurnalTemperatureModel;
    if (w.highestTemperatureTimeInMinutes === Constants.DEFAULT_HIGHEST_TEMPERATURE_TIME_IN_MINUTES)
      delete w.highestTemperatureTimeInMinutes;

    if (w.applyElectricityConsumptions === Constants.DEFAULT_APPLY_ELECTRICITY_CONSUMPTIONS)
      delete w.applyElectricityConsumptions;
    if (
      w.monthlyElectricityConsumptions?.every(
        (v: any, i: any) => v === Constants.DEFAULT_MONTHLY_ELECTRICITY_CONSUMPTIONS[i],
      )
    )
      delete w.monthlyElectricityConsumptions;

    if (w.solarPanelVisibilityGridCellSize === Constants.DEFAULT_SOLAR_PANEL_VISIBILITY_GRID_CELL_SIZE)
      delete w.solarPanelVisibilityGridCellSize;
    if (w.solarRadiationHeatmapGridCellSize === Constants.DEFAULT_SOLAR_RADIATION_HEATMAP_GRID_CELL_SIZE)
      delete w.solarRadiationHeatmapGridCellSize;

    if (w.cspTimesPerHour === Constants.DEFAULT_CSP_TIMES_PER_HOUR) delete w.cspTimesPerHour;
    if (w.cspDaysPerYear === Constants.DEFAULT_CSP_DAYS_PER_YEAR) delete w.cspDaysPerYear;
    if (w.cspGridCellSize === Constants.DEFAULT_CSP_GRID_CELL_SIZE) delete w.cspGridCellSize;

    if (w.sutTimesPerHour === Constants.DEFAULT_SUT_TIMES_PER_HOUR) delete w.sutTimesPerHour;
    if (w.sutDaysPerYear === Constants.DEFAULT_SUT_DAYS_PER_YEAR) delete w.sutDaysPerYear;
    if (w.sutGridCellSize === Constants.DEFAULT_SUT_GRID_CELL_SIZE) delete w.sutGridCellSize;

    if (w.noAnimationForHeatmapSimulation === Constants.DEFAULT_NO_ANIMATION_FOR_HEATMAP_SIMULATION)
      delete w.noAnimationForHeatmapSimulation;
    if (w.noAnimationForThermalSimulation === Constants.DEFAULT_NO_ANIMATION_FOR_THERMAL_SIMULATION)
      delete w.noAnimationForThermalSimulation;
    if (w.noAnimationForSensorDataCollection === Constants.DEFAULT_NO_ANIMATION_FOR_SENSOR_DATA_COLLECTION)
      delete w.noAnimationForSensorDataCollection;
    if (w.noAnimationForSolarPanelSimulation === Constants.DEFAULT_NO_ANIMATION_FOR_SOLAR_PANEL_SIMULATION)
      delete w.noAnimationForSolarPanelSimulation;
    if (
      w.noAnimationForSolarUpdraftTowerSimulation === Constants.DEFAULT_NO_ANIMATION_FOR_SOLAR_UPDRAFT_TOWER_SIMULATION
    )
      delete w.noAnimationForSolarUpdraftTowerSimulation;

    return w;
  }

  static expandWorld(w: any) {
    if (w.latitude === undefined) w.latitude = Constants.DEFAULT_LATITUDE;
    if (w.longitude === undefined) w.longitude = Constants.DEFAULT_LONGITUDE;
    if (w.address === undefined) w.address = Constants.DEFAULT_ADDRESS;
    if (w.countryCode === undefined) w.countryCode = Constants.DEFAULT_COUNTRY_CODE;

    if (w.name === undefined) w.name = Constants.DEFAULT_NAME;
    if (w.ground === undefined)
      w.ground = {
        albedo: 0.3,
        thermalDiffusivity: 0.05,
        snowReflectionFactors: new Array(12).fill(0),
      };
    if (w.leafDayOfYear1 === undefined) w.leafDayOfYear1 = Constants.DEFAULT_LEAF_DAY_OF_YEAR_1;
    if (w.leafDayOfYear2 === undefined) w.leafDayOfYear2 = Constants.DEFAULT_LEAF_DAY_OF_YEAR_2;

    if (w.airAttenuationCoefficient === undefined)
      w.airAttenuationCoefficient = Constants.DEFAULT_AIR_ATTENUATION_COEFFICIENT;
    if (w.airConvectiveCoefficient === undefined)
      w.airConvectiveCoefficient = Constants.DEFAULT_AIR_CONVECTIVE_COEFFICIENT;

    if (w.timesPerHour === undefined) w.timesPerHour = Constants.DEFAULT_TIMES_PER_HOUR;
    if (w.daysPerYear === undefined) w.daysPerYear = Constants.DEFAULT_DAYS_PER_YEAR;
    if (w.monthlyIrradianceLosses === undefined)
      w.monthlyIrradianceLosses = [...Constants.DEFAULT_MONTHLY_IRRADIANCE_LOSSES];

    if (w.pvGridCellSize === undefined) w.pvGridCellSize = Constants.DEFAULT_PV_GRID_CELL_SIZE;
    if (w.discretization === undefined) w.discretization = Constants.DEFAULT_DISCRETIZATION;
    if (w.diurnalTemperatureModel === undefined)
      w.diurnalTemperatureModel = Constants.DEFAULT_DIURNAL_TEMPERATURE_MODEL;
    if (w.highestTemperatureTimeInMinutes === undefined)
      w.highestTemperatureTimeInMinutes = Constants.DEFAULT_HIGHEST_TEMPERATURE_TIME_IN_MINUTES;

    if (w.applyElectricityConsumptions === undefined)
      w.applyElectricityConsumptions = Constants.DEFAULT_APPLY_ELECTRICITY_CONSUMPTIONS;
    if (w.monthlyElectricityConsumptions === undefined)
      w.monthlyElectricityConsumptions = [...Constants.DEFAULT_MONTHLY_ELECTRICITY_CONSUMPTIONS];

    if (w.solarPanelVisibilityGridCellSize === undefined)
      w.solarPanelVisibilityGridCellSize = Constants.DEFAULT_SOLAR_PANEL_VISIBILITY_GRID_CELL_SIZE;
    if (w.solarRadiationHeatmapGridCellSize === undefined)
      w.solarRadiationHeatmapGridCellSize = Constants.DEFAULT_SOLAR_RADIATION_HEATMAP_GRID_CELL_SIZE;

    if (w.cspTimesPerHour === undefined) w.cspTimesPerHour = Constants.DEFAULT_CSP_TIMES_PER_HOUR;
    if (w.cspDaysPerYear === undefined) w.cspDaysPerYear = Constants.DEFAULT_CSP_DAYS_PER_YEAR;
    if (w.cspGridCellSize === undefined) w.cspGridCellSize = Constants.DEFAULT_CSP_GRID_CELL_SIZE;

    if (w.sutTimesPerHour === undefined) w.sutTimesPerHour = Constants.DEFAULT_SUT_TIMES_PER_HOUR;
    if (w.sutDaysPerYear === undefined) w.sutDaysPerYear = Constants.DEFAULT_SUT_DAYS_PER_YEAR;
    if (w.sutGridCellSize === undefined) w.sutGridCellSize = Constants.DEFAULT_SUT_GRID_CELL_SIZE;

    if (w.noAnimationForHeatmapSimulation === undefined)
      w.noAnimationForHeatmapSimulation = Constants.DEFAULT_NO_ANIMATION_FOR_HEATMAP_SIMULATION;
    if (w.noAnimationForThermalSimulation === undefined)
      w.noAnimationForThermalSimulation = Constants.DEFAULT_NO_ANIMATION_FOR_THERMAL_SIMULATION;
    if (w.noAnimationForSensorDataCollection === undefined)
      w.noAnimationForSensorDataCollection = Constants.DEFAULT_NO_ANIMATION_FOR_SENSOR_DATA_COLLECTION;
    if (w.noAnimationForSolarPanelSimulation === undefined)
      w.noAnimationForSolarPanelSimulation = Constants.DEFAULT_NO_ANIMATION_FOR_SOLAR_PANEL_SIMULATION;
    if (w.noAnimationForSolarUpdraftTowerSimulation === undefined)
      w.noAnimationForSolarUpdraftTowerSimulation = Constants.DEFAULT_NO_ANIMATION_FOR_SOLAR_UPDRAFT_TOWER_SIMULATION;

    return w;
  }

  static compressSolarPanelArrayLayoutParams(val: any) {
    if (val.pvModelName === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS.pvModelName) delete val.pvModelName;
    if (val.rowAxis === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS.rowAxis) delete val.rowAxis;
    if (val.orientation === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS.orientation) delete val.orientation;
    if (val.tiltAngle === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS.tiltAngle) delete val.tiltAngle;
    if (val.rowsPerRack === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS.rowsPerRack) delete val.rowsPerRack;
    if (val.interRowSpacing === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS.interRowSpacing)
      delete val.interRowSpacing;
    if (val.poleHeight === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS.poleHeight) delete val.poleHeight;
    if (val.poleSpacing === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS.poleSpacing) delete val.poleSpacing;
    if (val.margin === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS.margin) delete val.margin;
    return val;
  }

  static expandSolarPanelArrayLayoutParams(content: any) {
    const p = content.solarPanelArrayLayoutParams;
    if (!p) {
      content.solarPanelArrayLayoutParams = new DefaultSolarPanelArrayLayoutParams();
      return;
    }
    if (p.pvModelName === undefined) p.pvModelName = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS.pvModelName;
    if (p.rowAxis === undefined) p.rowAxis = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS.rowAxis;
    if (p.orientation === undefined) p.orientation = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS.orientation;
    if (p.tiltAngle === undefined) p.tiltAngle = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS.tiltAngle;
    if (p.rowsPerRack === undefined) p.rowsPerRack = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS.rowsPerRack;
    if (p.interRowSpacing === undefined)
      p.interRowSpacing = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS.interRowSpacing;
    if (p.poleHeight === undefined) p.poleHeight = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS.poleHeight;
    if (p.poleSpacing === undefined) p.poleSpacing = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS.poleSpacing;
    if (p.margin === undefined) p.margin = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_PARAMS.margin;
    return p;
  }

  static compressSolarPanelArrayLayoutConstraints(val: any) {
    if (val.minimumInterRowSpacing === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.minimumInterRowSpacing)
      delete val.minimumInterRowSpacing;
    if (val.maximumInterRowSpacing === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.maximumInterRowSpacing)
      delete val.maximumInterRowSpacing;
    if (val.minimumRowsPerRack === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.minimumRowsPerRack)
      delete val.minimumRowsPerRack;
    if (val.maximumRowsPerRack === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.maximumRowsPerRack)
      delete val.maximumRowsPerRack;
    if (val.minimumTiltAngle === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.minimumTiltAngle)
      delete val.minimumTiltAngle;
    if (val.maximumTiltAngle === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.maximumTiltAngle)
      delete val.maximumTiltAngle;
    if (val.poleHeight === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.poleHeight) delete val.poleHeight;
    if (val.poleSpacing === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.poleSpacing) delete val.poleSpacing;
    if (val.orientation === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.orientation) delete val.orientation;
    if (val.pvModelName === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.pvModelName) delete val.pvModelName;
    if (val.rowAxis === Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.rowAxis) delete val.rowAxis;
    return val;
  }

  static expandSolarPanelArrayLayoutConstraints(content: any) {
    const p = content.solarPanelArrayLayoutConstraints;
    if (!p) {
      content.solarPanelArrayLayoutConstraints = new DefaultSolarPanelArrayLayoutConstraints();
      return;
    }
    if (p.minimumInterRowSpacing === undefined)
      p.minimumInterRowSpacing = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.minimumInterRowSpacing;
    if (p.maximumInterRowSpacing === undefined)
      p.maximumInterRowSpacing = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.maximumInterRowSpacing;
    if (p.minimumRowsPerRack === undefined)
      p.minimumRowsPerRack = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.minimumRowsPerRack;
    if (p.maximumRowsPerRack === undefined)
      p.maximumRowsPerRack = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.maximumRowsPerRack;
    if (p.minimumTiltAngle === undefined)
      p.minimumTiltAngle = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.minimumTiltAngle;
    if (p.maximumTiltAngle === undefined)
      p.maximumTiltAngle = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.maximumTiltAngle;
    if (p.poleHeight === undefined) p.poleHeight = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.poleHeight;
    if (p.poleSpacing === undefined) p.poleSpacing = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.poleSpacing;
    if (p.orientation === undefined) p.orientation = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.orientation;
    if (p.pvModelName === undefined) p.pvModelName = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.pvModelName;
    if (p.rowAxis === undefined) p.rowAxis = Constants.DEFAULT_SOLAR_PANEL_ARRAY_LAYOUT_CONSTRAINTS.rowAxis;
    return p;
  }

  static compressEconomicsParams(p: any) {
    if (p.projectLifeSpan === Constants.DEFAULT_ECONOMICS_PARAMS.projectLifeSpan) delete p.projectLifeSpan;
    if (p.electricitySellingPrice === Constants.DEFAULT_ECONOMICS_PARAMS.electricitySellingPrice)
      delete p.electricitySellingPrice;
    if (p.operationalCostPerUnit === Constants.DEFAULT_ECONOMICS_PARAMS.operationalCostPerUnit)
      delete p.operationalCostPerUnit;
    return p;
  }

  static expandEconomicsParams(content: any) {
    const p = content.economicParams;
    if (!p) {
      content.economicParams = new DefaultEconomicsParams();
      return;
    }
    if (p.projectLifeSpan === undefined) p.projectLifeSpan = Constants.DEFAULT_ECONOMICS_PARAMS.projectLifeSpan;
    if (p.electricitySellingPrice === undefined)
      p.electricitySellingPrice = Constants.DEFAULT_ECONOMICS_PARAMS.electricitySellingPrice;
    if (p.operationalCostPerUnit === undefined)
      p.operationalCostPerUnit = Constants.DEFAULT_ECONOMICS_PARAMS.operationalCostPerUnit;
    return p;
  }

  static compressEvolutionaryAlgorithmState(s: any) {
    ContentUtil.compressGeneticAlgorithmParams(s.geneticAlgorithmParams);
    ContentUtil.compressParticleSwarmOptimizationParams(s.particleSwarmOptimizationParams);
    return s;
  }

  static expandEvolutionaryAlgorithmState(content: any) {
    const s = content.evolutionaryAlgorithmState;
    if (!s) {
      content.evolutionaryAlgorithmState = new DefaultEvolutionaryAlgorithmState();
      return;
    }
    ContentUtil.expandGeneticAlgorithmParams(s.geneticAlgorithmParams);
    ContentUtil.expandParticleSwarmOptimizationParams(s.particleSwarmOptimizationParams);
    return s;
  }

  static compressParticleSwarmOptimizationParams(p: any) {
    if (p.problem === Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.problem) delete p.problem;
    if (p.objectiveFunctionType === Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.objectiveFunctionType)
      delete p.objectiveFunctionType;
    if (p.searchMethod === Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.searchMethod) delete p.searchMethod;
    if (p.swarmSize === Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.swarmSize) delete p.swarmSize;
    if (p.maximumSteps === Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.maximumSteps) delete p.maximumSteps;
    if (p.vmax === Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.vmax) delete p.vmax;
    if (p.inertia === Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.inertia) delete p.inertia;
    if (p.cognitiveCoefficient === Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.cognitiveCoefficient)
      delete p.cognitiveCoefficient;
    if (p.socialCoefficient === Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.socialCoefficient)
      delete p.socialCoefficient;
    if (p.convergenceThreshold === Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.convergenceThreshold)
      delete p.convergenceThreshold;
    if (p.localSearchRadius === Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.localSearchRadius)
      delete p.localSearchRadius;

    return p;
  }

  static expandParticleSwarmOptimizationParams(p: any) {
    if (p.problem === undefined) p.problem = Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.problem;
    if (p.objectiveFunctionType === undefined)
      p.objectiveFunctionType = Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.objectiveFunctionType;
    if (p.searchMethod === undefined)
      p.searchMethod = Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.searchMethod;
    if (p.swarmSize === undefined) p.swarmSize = Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.swarmSize;
    if (p.maximumSteps === undefined)
      p.maximumSteps = Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.maximumSteps;
    if (p.vmax === undefined) p.vmax = Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.vmax;
    if (p.inertia === undefined) p.inertia = Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.inertia;
    if (p.cognitiveCoefficient === undefined)
      p.cognitiveCoefficient = Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.cognitiveCoefficient;
    if (p.socialCoefficient === undefined)
      p.socialCoefficient = Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.socialCoefficient;
    if (p.convergenceThreshold === undefined)
      p.convergenceThreshold = Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.convergenceThreshold;
    if (p.localSearchRadius === undefined)
      p.localSearchRadius = Constants.DEFAULT_PARTICLE_SWARM_OPTIMIZATION_PARAMS.localSearchRadius;

    return p;
  }

  static compressGeneticAlgorithmParams(p: any) {
    if (p.problem === Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.problem) delete p.problem;
    if (p.objectiveFunctionType === Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.objectiveFunctionType)
      delete p.objectiveFunctionType;
    if (p.selectionMethod === Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.selectionMethod) delete p.selectionMethod;
    if (p.searchMethod === Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.searchMethod) delete p.searchMethod;
    if (p.populationSize === Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.populationSize) delete p.populationSize;
    if (p.maximumGenerations === Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.maximumGenerations)
      delete p.maximumGenerations;
    if (p.selectionRate === Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.selectionRate) delete p.selectionRate;
    if (p.crossoverRate === Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.crossoverRate) delete p.crossoverRate;
    if (p.mutationRate === Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.mutationRate) delete p.mutationRate;
    if (p.convergenceThreshold === Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.convergenceThreshold)
      delete p.convergenceThreshold;
    if (p.localSearchRadius === Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.localSearchRadius)
      delete p.localSearchRadius;

    return p;
  }

  static expandGeneticAlgorithmParams(p: any) {
    if (p.problem === undefined) p.problem = Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.problem;
    if (p.objectiveFunctionType === undefined)
      p.objectiveFunctionType = Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.objectiveFunctionType;
    if (p.selectionMethod === undefined) p.selectionMethod = Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.selectionMethod;
    if (p.searchMethod === undefined) p.searchMethod = Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.searchMethod;
    if (p.populationSize === undefined) p.populationSize = Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.populationSize;
    if (p.maximumGenerations === undefined)
      p.maximumGenerations = Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.maximumGenerations;
    if (p.selectionRate === undefined) p.selectionRate = Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.selectionRate;
    if (p.crossoverRate === undefined) p.crossoverRate = Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.crossoverRate;
    if (p.mutationRate === undefined) p.mutationRate = Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.mutationRate;
    if (p.convergenceThreshold === undefined)
      p.convergenceThreshold = Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.convergenceThreshold;
    if (p.localSearchRadius === undefined)
      p.localSearchRadius = Constants.DEFAULT_GENETIC_ALGORITHM_PARAMS.localSearchRadius;

    return p;
  }

  static compressGraphState(g: any) {
    if (!g.dailyPvIndividualOutputs) delete g.dailyPvIndividualOutputs;
    if (!g.yearlyPvIndividualOutputs) delete g.yearlyPvIndividualOutputs;

    if (!g.dailyParabolicDishIndividualOutputs) delete g.dailyParabolicDishIndividualOutputs;
    if (!g.yearlyParabolicDishIndividualOutputs) delete g.yearlyParabolicDishIndividualOutputs;

    if (!g.dailyParabolicTroughIndividualOutputs) delete g.dailyParabolicTroughIndividualOutputs;
    if (!g.yearlyParabolicTroughIndividualOutputs) delete g.yearlyParabolicTroughIndividualOutputs;

    if (!g.dailyFresnelReflectorIndividualOutputs) delete g.dailyFresnelReflectorIndividualOutputs;
    if (!g.yearlyFresnelReflectorIndividualOutputs) delete g.yearlyFresnelReflectorIndividualOutputs;

    if (!g.dailyHeliostatIndividualOutputs) delete g.dailyHeliostatIndividualOutputs;
    if (!g.yearlyHeliostatIndividualOutputs) delete g.yearlyHeliostatIndividualOutputs;

    if (!g.dailyUpdraftTowerIndividualOutputs) delete g.dailyUpdraftTowerIndividualOutputs;
    if (!g.yearlyUpdraftTowerIndividualOutputs) delete g.yearlyUpdraftTowerIndividualOutputs;

    // default true
    if (g.dailyBatteryStorageIndividualOutputs) delete g.dailyBatteryStorageIndividualOutputs;
    if (g.yearlyBatteryStorageIndividualOutputs) delete g.yearlyBatteryStorageIndividualOutputs;

    return g;
  }

  static expandGraphState(content: any) {
    const g = content.graphState;
    if (!g) {
      content.graphState = new DefaultGraphState();
      return;
    }
    if (g.dailyPvIndividualOutputs === undefined) g.dailyPvIndividualOutputs = false;
    if (g.yearlyPvIndividualOutputs === undefined) g.yearlyPvIndividualOutputs = false;

    if (g.dailyParabolicDishIndividualOutputs === undefined) g.dailyParabolicDishIndividualOutputs = false;
    if (g.yearlyParabolicDishIndividualOutputs === undefined) g.yearlyParabolicDishIndividualOutputs = false;

    if (g.dailyParabolicTroughIndividualOutputs === undefined) g.dailyParabolicTroughIndividualOutputs = false;
    if (g.yearlyParabolicTroughIndividualOutputs === undefined) g.yearlyParabolicTroughIndividualOutputs = false;

    if (g.dailyFresnelReflectorIndividualOutputs === undefined) g.dailyFresnelReflectorIndividualOutputs = false;
    if (g.yearlyFresnelReflectorIndividualOutputs === undefined) g.yearlyFresnelReflectorIndividualOutputs = false;

    if (g.dailyHeliostatIndividualOutputs === undefined) g.dailyHeliostatIndividualOutputs = false;
    if (g.yearlyHeliostatIndividualOutputs === undefined) g.yearlyHeliostatIndividualOutputs = false;

    if (g.dailyUpdraftTowerIndividualOutputs === undefined) g.dailyUpdraftTowerIndividualOutputs = false;
    if (g.yearlyUpdraftTowerIndividualOutputs === undefined) g.yearlyUpdraftTowerIndividualOutputs = false;

    // default true
    if (g.dailyBatteryStorageIndividualOutputs === undefined) g.dailyBatteryStorageIndividualOutputs = true;
    if (g.yearlyBatteryStorageIndividualOutputs === undefined) g.yearlyBatteryStorageIndividualOutputs = true;

    return g;
  }

  static compressBasicElement(e: any) {
    delete e.selected;

    if (!e.locked) delete e.locked;
    if (!e.showLabel) delete e.showLabel;
    if (isSameColor(e.lineColor, Constants.DEFAULT_LINE_COLOR)) delete e.lineColor;
    if (e.lineWidth === Constants.DEFAULT_LINE_WIDTH) delete e.lineWidth;
    if (e.labelSize === Constants.DEFAULT_LABEL_SIZE) delete e.labelSize;
    if (e.labelFontSize === Constants.DEFAULT_LABEL_FONT_SIZE) delete e.labelFontSize;
    if (isSameColor(e.labelColor, Constants.DEFAULT_LABEL_COLOR)) delete e.labelColor;
    if (e.labelHeight === Constants.DEFAULT_LABEL_HEIGHT) delete e.labelHeight;
  }

  static compressFoundation(e: any) {
    // always same
    delete e.selected; // legacy
    delete e.normal;
    delete e.parentId;

    // check if it's default value
    if (e.color === Constants.DEFAULT_FOUNDATION_COLOR) delete e.color;
    if (e.slope === Constants.DEFAULT_FOUNDATION_SLOPE) delete e.slope;
    if (e.lz === Constants.DEFAULT_FOUNDATION_LZ) delete e.lz;
    if (e.rotation[2] === 0) delete e.rotation;
    if (e.rValue === Constants.DEFAULT_GROUND_FLOOR_R_VALUE) delete e.rValue;
    if (isSameColor(e.color, Constants.DEFAULT_FOUNDATION_COLOR)) delete e.color;
    if (e.textureType === FoundationTexture.NoTexture) delete e.textureType;
    if (isObjectShallowEqual(e.hvacSystem, Constants.DEFAULT_HVAC_SYSTEM)) delete e.hvacSystem;

    // optional parameters, no need to expand
    if (!e.enableGroupMaster) delete e.enableGroupMaster;
    if (!e.locked) delete e.locked;
    if (!e.notBuilding) delete e.notBuilding;
    if (!e.invisible) delete e.invisible;
    if (!e.enableSlope) delete e.enableSlope;
    if (isSameColor(e.lineColor, Constants.DEFAULT_LINE_COLOR)) delete e.lineColor;
    if (e.lineWidth === Constants.DEFAULT_LINE_WIDTH) delete e.lineWidth;
    if (!e.showLabel) delete e.showLabel;
    if (isObjectExistAndEmpty(e.solarAbsorberPipe)) delete e.solarAbsorberPipe;
    if (isObjectExistAndEmpty(e.solarPowerTower)) delete e.solarPowerTower;
    if (isObjectExistAndEmpty(e.solarUpdraftTower)) delete e.solarUpdraftTower;
  }

  static expandFoundation(e: any) {
    e.normal = [0, 0, 1];
    e.parentId = Constants.GROUND_ID;

    if (e.color === undefined) e.color = Constants.DEFAULT_FOUNDATION_COLOR;
    if (e.lz === undefined) e.lz = Constants.DEFAULT_FOUNDATION_LZ;
    if (e.rotation === undefined) e.rotation = [0, 0, 0];
    if (e.rValue === undefined) e.rValue = Constants.DEFAULT_GROUND_FLOOR_R_VALUE;
    if (e.color === undefined) e.color = Constants.DEFAULT_FOUNDATION_COLOR;
    if (e.textureType === undefined) e.textureType = FoundationTexture.NoTexture;
    if (e.hvacSystem === undefined) e.hvacSystem = { ...Constants.DEFAULT_HVAC_SYSTEM };
  }

  static compressCuboid(e: any) {
    delete e.normal;

    if (!e.stackable) delete e.stackable;
    if (e.transparency === Constants.DEFAULT_CUBOID_TRANSPARENCY) delete e.transparency;
    if (e.faceColors.every((color: string) => isSameColor(color, Constants.DEFAULT_CUBOID_COLOR))) delete e.faceColors;
    if (e.textureTypes.every((t: string) => t === CuboidTexture.NoTexture)) delete e.textureTypes;
  }

  static expandCuboid(e: any) {
    e.normal = [0, 0, 1];

    if (e.stackable === undefined) e.stackable = false;
    if (e.faceColors === undefined) e.faceColors = new Array(6).fill(Constants.DEFAULT_CUBOID_COLOR);
    if (e.textureTypes === undefined) e.faceColors = new Array(6).fill(CuboidTexture.NoTexture);
  }

  static compressWall(e: any) {
    // always same
    delete e.windows; // legacy
    delete e.normal;
    delete e.rotation;

    if (e.airPermeability === Constants.DEFAULT_WALL_AIR_PERMEABILITY) delete e.airPermeability;
    if (e.volumetricHeatCapacity === Constants.DEFAULT_WALL_VOLUMETRIC_HEAT_CAPACITY) delete e.volumetricHeatCapacity;
    if (e.textureType === WallTexture.Default) delete e.textureType;
    if (isSameColor(e.color, Constants.DEFAULT_WALL_COLOR)) delete e.color;
    if (e.lz === Constants.DEFAULT_WALL_HEIGHT) delete e.lz;
    if (e.eavesLength === Constants.DEFAULT_WALL_EAVES_LENGTH) delete e.eavesLength;
    if (e.fill === WallFill.Full) delete e.fill;
    if (e.leftUnfilledHeight === Constants.DEFAULT_WALL_UNFILLED_HEIGHT) delete e.leftUnfilledHeight;
    if (e.rightUnfilledHeight === Constants.DEFAULT_WALL_UNFILLED_HEIGHT) delete e.rightUnfilledHeight;
    if (e.leftTopPartialHeight === e.lz - Constants.DEFAULT_WALL_UNFILLED_HEIGHT) delete e.leftTopPartialHeight;
    if (e.rightTopPartialHeight === e.lz - Constants.DEFAULT_WALL_UNFILLED_HEIGHT) delete e.rightTopPartialHeight;
    if (e.opacity === Constants.DEFAULT_WALL_OPACITY) delete e.opacity;
    if (e.wallStructure === WallStructure.Default) delete e.wallStructure;
    if (e.structureSpacing === Constants.DEFAULT_WALL_STRUCTURE_SPACING) delete e.structureSpacing;
    if (e.structureWidth === Constants.DEFAULT_WALL_STRUCTURE_WIDTH) delete e.structureWidth;
    if (isSameColor(e.structureColor, Constants.DEFAULT_WALL_STRUCTURE_COLOR)) delete e.structureColor;
    if (e.rValue === Constants.DEFAULT_WALL_R_VALUE) delete e.rValue;
    if (isObjectShallowEqual(e.parapet, DEFAULT_PARAPET_SETTINGS)) delete e.parapet;
    if (!e.openToOutside) delete e.openToOutside;
  }

  static expandWall(e: any) {
    e.normal = [0, 0, 1];
    e.rotation = [0, 0, 0];

    if (e.volumetricHeatCapacity === undefined)
      e.volumetricHeatCapacity = Constants.DEFAULT_WALL_VOLUMETRIC_HEAT_CAPACITY;
    if (e.textureType === undefined) e.textureType = WallTexture.Default;
    if (e.color === undefined) e.color = Constants.DEFAULT_WALL_COLOR;
    if (e.lz === undefined) e.lz = Constants.DEFAULT_WALL_HEIGHT;
    if (e.eavesLength === undefined) e.eavesLength = Constants.DEFAULT_WALL_EAVES_LENGTH;
    if (e.fill === undefined) e.fill = WallFill.Full;
    if (e.leftTopPartialHeight === undefined) e.leftTopPartialHeight = e.lz - Constants.DEFAULT_WALL_UNFILLED_HEIGHT;
    if (e.rightTopPartialHeight === undefined) e.rightTopPartialHeight = e.lz - Constants.DEFAULT_WALL_UNFILLED_HEIGHT;
    if (e.opacity === undefined) e.opacity = Constants.DEFAULT_WALL_OPACITY;
    if (e.wallStructure === undefined) e.wallStructure = WallStructure.Default;
    if (e.structureSpacing === undefined) e.structureSpacing = Constants.DEFAULT_WALL_STRUCTURE_SPACING;
    if (e.structureWidth === undefined) e.structureWidth = Constants.DEFAULT_WALL_STRUCTURE_WIDTH;
    if (e.structureColor === undefined) e.structureColor = Constants.DEFAULT_WALL_STRUCTURE_COLOR;
    if (e.rValue === undefined) e.rValue = Constants.DEFAULT_WALL_R_VALUE;
    if (e.parapet === undefined) e.parapet = { ...DEFAULT_PARAPET_SETTINGS };

    // handle old files properties
    if (e.leftUnfilledHeight === undefined || e.rightUnfilledHeight === undefined) {
      const val = e.unfilledHeight ?? Constants.DEFAULT_WALL_UNFILLED_HEIGHT;
      e.leftUnfilledHeight = val;
      e.rightUnfilledHeight = val;
    }
  }

  static compressWindow(e: any) {
    delete e.normal;
    delete e.select;

    if (isSameColor(e.color, Constants.DEFAULT_WINDOW_COLOR)) delete e.color;
    if (e.opacity === Constants.DEFAULT_WINDOW_OPACITY) delete e.opacity;
    if (e.tint === Constants.DEFAULT_WINDOW_TINT) delete e.windowTint;
    if (e.uValue === Constants.DEFAULT_WINDOW_U_VALUE) delete e.uValue;
    if (isSameColor(e.shutterColor, Constants.DEFAULT_WINDOW_SHUTTER_COLOR)) delete e.shutterColor;
    if (e.shutterWidth === Constants.DEFAULT_WINDOW_SHUTTER_WIDTH) delete e.shutterWidth;
    if (isSameColor(e.mullionColor, Constants.DEFAULT_MULLION_COLOR)) delete e.mullionColor;
    if (e.mullionWidth === Constants.DEFAULT_MULLION_WIDTH) delete e.mullionWidth;
    if (e.horizontalMullionSpacing === Constants.DEFAULT_HORIZONTAL_MULLION_SPACING) delete e.horizontalMullionSpacing;
    if (e.verticalMullionSpacing === Constants.DEFAULT_VERTICAL_MULLION_SPACING) delete e.verticalMullionSpacing;
    if (e.frameWidth === Constants.DEFAULT_WINDOW_FRAME_WIDTH) delete e.frameWidth;
    if (e.sillWidth === Constants.DEFAULT_WINDOW_SILL_WIDTH) delete e.sillWidth;
    if (e.windowType === WindowType.Default) delete e.windowType;
    if (e.archHeight === Constants.DEFAULT_WINDOW_ARCH_HEIGHT) delete e.archHeight;
    if (e.parentType === ObjectType.Wall) {
      delete e.rotation;
      delete e.parentType;
    }
    if (e.airPermeability === Constants.DEFAULT_WINDOW_AIR_PERMEABILITY) delete e.airPermeability;

    if (e.horizontalMullion) delete e.horizontalMullion; // default true
    if (e.verticalMullion) delete e.verticalMullion; // default true
    if (!e.leftShutter) delete e.leftShutter;
    if (!e.rightShutter) delete e.rightShutter;
    if (!e.frame) delete e.frame;
    if (!e.empty) delete e.empty;
    if (!e.interior) delete e.interior;
    if (!e.setback) delete e.setback;
    if (e !== undefined && e.airPermeability === Constants.DEFAULT_WINDOW_AIR_PERMEABILITY) delete e.airPermeability;
  }

  static expandWindow(e: any) {
    e.normal = [0, -1, 0];

    if (e.color === undefined) e.color = Constants.DEFAULT_WINDOW_COLOR;
    if (e.opacity === undefined) e.opacity = Constants.DEFAULT_WINDOW_OPACITY;
    if (e.tint === undefined) e.windowTint = Constants.DEFAULT_WINDOW_TINT;
    if (e.uValue === undefined) e.uValue = Constants.DEFAULT_WINDOW_U_VALUE;
    if (e.shutterColor === undefined) e.shutterColor = Constants.DEFAULT_WINDOW_SHUTTER_COLOR;
    if (e.shutterWidth === undefined) e.shutterWidth = Constants.DEFAULT_WINDOW_SHUTTER_WIDTH;
    if (e.mullionColor === undefined) e.mullionColor = Constants.DEFAULT_MULLION_COLOR;
    if (e.mullionWidth === undefined) e.mullionWidth = Constants.DEFAULT_MULLION_WIDTH;
    if (e.horizontalMullionSpacing === undefined)
      e.horizontalMullionSpacing = Constants.DEFAULT_HORIZONTAL_MULLION_SPACING;
    if (e.verticalMullionSpacing === undefined) e.verticalMullionSpacing = Constants.DEFAULT_VERTICAL_MULLION_SPACING;
    if (e.frameWidth === undefined) e.frameWidth = Constants.DEFAULT_WINDOW_FRAME_WIDTH;
    if (e.sillWidth === undefined) e.sillWidth = Constants.DEFAULT_WINDOW_SILL_WIDTH;
    if (e.windowType === undefined) e.windowType = WindowType.Default;
    if (e.archHeight === undefined) e.archHeight = Constants.DEFAULT_WINDOW_ARCH_HEIGHT;
    if (e.horizontalMullion === undefined) e.horizontalMullion = true;
    if (e.verticalMullion === undefined) e.verticalMullion = true;
    if (e.parentType === undefined) {
      e.rotation = [0, 0, 0];
    }

    // old files may contain those parameters
    if (e.shutter) {
      e.leftShutter = e.shutter.showLeft;
      e.rightShutter = e.shutter.showRight;
      e.shutterColor = e.shutter.color;
      e.shutterWidth = e.shutter.width;
      delete e.shutter;
    }
    if (e.mullion) {
      e.horizontalMullion = e.mullion;
      e.verticalMullion = e.mullion;
      delete e.mullion;
    }
    if (e.mullionSpacing) {
      e.horizontalMullionSpacing = e.mullionSpacing;
      e.verticalMullionSpacing = e.mullionSpacing;
      delete e.mullionSpacing;
    }
  }

  static compressDoor(e: any) {
    delete e.normal;
    delete e.rotation;

    if (e.uValue === Constants.DEFAULT_DOOR_U_VALUE) delete e.uValue;
    if (e.airPermeability === Constants.DEFAULT_DOOR_AIR_PERMEABILITY) delete e.airPermeability;
    if (e.volumetricHeatCapacity === Constants.DEFAULT_DOOR_VOLUMETRIC_HEAT_CAPACITY) delete e.volumetricHeatCapacity;
    if (e.textureType === DoorTexture.Default) delete e.textureType;
    if (e.doorType === DoorType.Default) delete e.doorType;
    if (e.archHeight === Constants.DEFAULT_DOOR_ARCH_HEIGHT) delete e.archHeight;
    if (e.opacity === Constants.DEFAULT_DOOR_OPACITY) delete e.opacity;
    if (isSameColor(e.frameColor, Constants.DEFAULT_DOOR_FRAME_COLOR)) delete e.frameColor;

    if (e.filled) delete e.filled; // default true
    if (!e.frameless) delete e.frameless;
    if (!e.interior) delete e.interior;
  }

  static expandDoor(e: any) {
    e.normal = [0, 1, 0];
    e.rotation = [0, 0, 0];

    if (e.uValue === undefined) e.uValue = Constants.DEFAULT_DOOR_U_VALUE;
    if (e.airPermeability === undefined) e.airPermeability = Constants.DEFAULT_DOOR_AIR_PERMEABILITY;
    if (e.volumetricHeatCapacity === undefined)
      e.volumetricHeatCapacity = Constants.DEFAULT_DOOR_VOLUMETRIC_HEAT_CAPACITY;
    if (e.textureType === undefined) e.textureType = DoorTexture.Default;
    if (e.doorType === undefined) e.doorType = DoorType.Default;
    if (e.archHeight === undefined) e.archHeight = Constants.DEFAULT_DOOR_ARCH_HEIGHT;
    if (e.opacity === undefined) e.opacity = Constants.DEFAULT_DOOR_OPACITY;
    if (e.frameColor === undefined) e.frameColor = Constants.DEFAULT_DOOR_FRAME_COLOR;
    if (e.filled === undefined) e.filled = true;
  }

  static compressRoof(e: any) {
    delete e.cx;
    delete e.cy;
    delete e.cz;
    delete e.lx;
    delete e.ly;
    delete e.lz;
    delete e.normal;
    delete e.rotation;

    if (e.roofStructure && e.roofStructure === RoofStructure.Default) delete e.roofStructure;
    if (e.textureType === RoofTexture.Default) delete e.textureType;
    if (e.thickness === Constants.DEFAULT_ROOF_THICKNESS) delete e.thickness;
    if (isSameColor(e.sideColor, Constants.DEFAULT_ROOF_SIDE_COLOR)) delete e.sideColor;
    if (e.rafterSpacing === Constants.DEFAULT_ROOF_RAFTER_SPACING) delete e.rafterSpacing;
    if (e.rafterWidth === Constants.DEFAULT_ROOF_RAFTER_WIDTH) delete e.rafterWidth;
    if (isSameColor(e.rafterColor, Constants.DEFAULT_ROOF_RAFTER_COLOR)) delete e.rafterColor;
    if (e.glassTint === Constants.DEFAULT_ROOF_GLASS_TINT) delete e.glassTint;
    if (e.opacity === Constants.DEFAULT_ROOF_OPACITY) delete e.opacity;
    if (e.rValue === Constants.DEFAULT_ROOF_R_VALUE) delete e.rValue;
    if (e.volumetricHeatCapacity === Constants.DEFAULT_ROOF_VOLUMETRIC_HEAT_CAPACITY) delete e.volumetricHeatCapacity;
    if (e.airPermeability === Constants.DEFAULT_ROOF_AIR_PERMEABILITY) delete e.airPermeability;
    if (e.rise === Constants.DEFAULT_ROOF_RISE) delete e.rise;
    if (e.ceilingRValue === Constants.DEFAULT_CEILING_R_VALUE) delete e.ceilingRValue;

    if (!e.ceiling) delete e.ceiling;
  }

  static expandRoof(e: any) {
    [e.cx, e.cy, e.cz, e.lx, e.ly, e.lz] = [0, 0, 0, 0, 0, 0];
    e.normal = [0, 0, 1];
    e.rotation = [0, 0, 0];

    if (e.textureType === undefined) e.textureType = RoofTexture.Default;
    if (e.thickness === undefined) e.thickness = Constants.DEFAULT_ROOF_THICKNESS;
    if (e.rValue === undefined) e.rValue = Constants.DEFAULT_ROOF_R_VALUE;
    if (e.volumetricHeatCapacity === undefined)
      e.volumetricHeatCapacity = Constants.DEFAULT_ROOF_VOLUMETRIC_HEAT_CAPACITY;
    if (e.rise === undefined) e.rise = Constants.DEFAULT_ROOF_RISE;
  }

  static compressSolarWaterHeater(e: any) {
    if (isSameColor(e.color, Constants.DEFAULT_SOLAR_WATER_HEATER_COLOR)) delete e.color;
    if (e.waterTankRadius === Constants.DEFAULT_SOLAR_WATER_HEATER_TANK_RADIUS) delete e.waterTankRadius;
    if (e.lz === Constants.DEFAULT_SOLAR_WATER_HEATER_HEIGHT) delete e.lz;
  }

  static expandSolarWaterHeater(e: any) {
    if (e.color === undefined) e.color = Constants.DEFAULT_SOLAR_WATER_HEATER_COLOR;
    if (e.waterTankRadius === undefined) e.waterTankRadius = Constants.DEFAULT_SOLAR_WATER_HEATER_TANK_RADIUS;
    if (e.lz === undefined) e.lz = Constants.DEFAULT_SOLAR_WATER_HEATER_HEIGHT;
  }

  static compressSolarPanel(e: any) {
    if (e.poleHeight === Constants.DEFAULT_SOLAR_PANEL_POLE_HEIGHT) delete e.poleHeight;
    if (e.poleRadius === Constants.DEFAULT_SOLAR_PANEL_POLE_RADIUS) delete e.poleRadius;
    if (e.pvModelName === Constants.DEFAULT_SOLAR_PANEL_MODEL) delete e.pvModelName;
    if (e.poleSpacing === Constants.DEFAULT_SOLAR_PANEL_POLE_SPACING) delete e.poleSpacing;
    if (e.orientation === Constants.DEFAULT_SOLAR_PANEL_ORIENTATION) delete e.orientation;
    if (e.trackerType === TrackerType.NO_TRACKER) delete e.trackerType;
    if (isSameColor(e.frameColor, Constants.DEFAULT_SOLAR_PANEL_FRAME_COLOR)) delete e.frameColor;

    if (!e.drawSunBeam) delete e.drawSunBeam;
    if (e.batteryStorageId === null) delete e.batteryStorageId;
  }

  static expandSolarPanel(e: any) {
    if (e.pvModelName === undefined) e.pvModelName = Constants.DEFAULT_SOLAR_PANEL_MODEL;
    if (e.poleSpacing === undefined) e.poleSpacing = Constants.DEFAULT_SOLAR_PANEL_POLE_SPACING;
    if (e.orientation === undefined) e.orientation = Constants.DEFAULT_SOLAR_PANEL_ORIENTATION;
    if (e.trackerType === undefined) e.trackerType = TrackerType.NO_TRACKER;
    if (e.frameColor === undefined) e.frameColor = Constants.DEFAULT_SOLAR_PANEL_FRAME_COLOR;
    if (e.poleHeight === undefined) e.poleHeight = Constants.DEFAULT_SOLAR_PANEL_POLE_HEIGHT;
    if (e.poleRadius === undefined) e.poleRadius = Constants.DEFAULT_SOLAR_PANEL_POLE_RADIUS;

    if (e.drawSunBeam === undefined) e.drawSunBeam = false;
  }

  static compressParabolicDish(e: any) {
    if (e.reflectance === Constants.DEFAULT_PARABOLIC_DISH_REFLECTANCE) delete e.reflectance;

    if (e.latusRectum === Constants.DEFAULT_PARABOLIC_DISH_LATUS_RECTUM) delete e.latusRectum;
    if (e.absorptance === Constants.DEFAULT_PARABOLIC_DISH_ABSORPTANCE) delete e.absorptance;
    if (e.opticalEfficiency === Constants.DEFAULT_PARABOLIC_DISH_OPTICAL_EFFICIENCY) delete e.opticalEfficiency;
    if (e.thermalEfficiency === Constants.DEFAULT_PARABOLIC_DISH_THERMAL_EFFICIENCY) delete e.thermalEfficiency;

    if (e.structureType === Constants.DEFAULT_PARABOLIC_DISH_RECEIVER_STRUCTURE) delete e.structureType;
    if (e.receiverRadius === Constants.DEFAULT_PARABOLIC_DISH_RECEIVER_RADIUS) delete e.receiverRadius;
    if (e.receiverPoleRadius === Constants.DEFAULT_PARABOLIC_DISH_RECEIVER_RADIUS) delete e.receiverPoleRadius;

    if (e.poleHeight === Constants.DEFAULT_PARABOLIC_DISH_POLE_HEIGHT) delete e.poleHeight;
    if (e.poleRadius === Constants.DEFAULT_PARABOLIC_DISH_POLE_RADIUS) delete e.poleRadius;
  }

  static expandParabolicDish(e: any) {
    if (e.reflectance === undefined) e.reflectance = Constants.DEFAULT_PARABOLIC_DISH_REFLECTANCE;

    if (e.latusRectum === undefined) e.latusRectum = Constants.DEFAULT_PARABOLIC_DISH_LATUS_RECTUM;
    if (e.absorptance === undefined) e.absorptance = Constants.DEFAULT_PARABOLIC_DISH_ABSORPTANCE;
    if (e.opticalEfficiency === undefined) e.opticalEfficiency = Constants.DEFAULT_PARABOLIC_DISH_OPTICAL_EFFICIENCY;
    if (e.thermalEfficiency === undefined) e.thermalEfficiency = Constants.DEFAULT_PARABOLIC_DISH_THERMAL_EFFICIENCY;

    if (e.structureType === undefined) e.structureType = Constants.DEFAULT_PARABOLIC_DISH_RECEIVER_STRUCTURE;
    if (e.receiverRadius === undefined) e.receiverRadius = Constants.DEFAULT_PARABOLIC_DISH_RECEIVER_RADIUS;
    if (e.receiverPoleRadius === undefined) e.receiverPoleRadius = Constants.DEFAULT_PARABOLIC_DISH_POLE_RADIUS;

    if (e.poleHeight === undefined) e.poleHeight = Constants.DEFAULT_PARABOLIC_DISH_POLE_HEIGHT;
    if (e.poleRadius === undefined) e.poleRadius = Constants.DEFAULT_PARABOLIC_DISH_POLE_RADIUS;
  }

  static compressParabolicTrough(e: any) {
    if (e.reflectance === Constants.DEFAULT_PARABOLIC_TROUGH_REFLECTANCE) delete e.reflectance;

    if (e.latusRectum === Constants.DEFAULT_PARABOLIC_TROUGH_LATUS_RECTUM) delete e.latusRectum;
    if (e.absorptance === Constants.DEFAULT_PARABOLIC_TROUGH_ABSORPTANCE) delete e.absorptance;
    if (e.opticalEfficiency === Constants.DEFAULT_PARABOLIC_TROUGH_OPTICAL_EFFICIENCY) delete e.opticalEfficiency;
    if (e.thermalEfficiency === Constants.DEFAULT_PARABOLIC_TROUGH_THERMAL_EFFICIENCY) delete e.thermalEfficiency;

    if (e.moduleLength === Constants.DEFAULT_PARABOLIC_TROUGH_MODULE_LENGTH) delete e.moduleLength;
    if (e.absorberTubeRadius === Constants.DEFAULT_PARABOLIC_TROUGH_ABSORBER_TUBE_RADIUS) delete e.absorberTubeRadius;

    if (e.poleHeight === Constants.DEFAULT_PARABOLIC_TROUGH_POLE_HEIGHT) delete e.poleHeight;
    if (e.poleRadius === Constants.DEFAULT_PARABOLIC_TROUGH_POLE_RADIUS) delete e.poleRadius;
  }

  static expandParabolicTrough(e: any) {
    if (e.reflectance === undefined) e.reflectance = Constants.DEFAULT_PARABOLIC_TROUGH_REFLECTANCE;

    if (e.latusRectum === undefined) e.latusRectum = Constants.DEFAULT_PARABOLIC_TROUGH_LATUS_RECTUM;
    if (e.absorptance === undefined) e.absorptance = Constants.DEFAULT_PARABOLIC_TROUGH_ABSORPTANCE;
    if (e.opticalEfficiency === undefined) e.opticalEfficiency = Constants.DEFAULT_PARABOLIC_TROUGH_OPTICAL_EFFICIENCY;
    if (e.thermalEfficiency === undefined) e.thermalEfficiency = Constants.DEFAULT_PARABOLIC_TROUGH_THERMAL_EFFICIENCY;

    if (e.moduleLength === undefined) e.moduleLength = Constants.DEFAULT_PARABOLIC_TROUGH_MODULE_LENGTH;
    if (e.absorberTubeRadius === undefined)
      e.absorberTubeRadius = Constants.DEFAULT_PARABOLIC_TROUGH_ABSORBER_TUBE_RADIUS;

    if (e.poleHeight === undefined) e.poleHeight = Constants.DEFAULT_PARABOLIC_TROUGH_POLE_HEIGHT;
    if (e.poleRadius === undefined) e.poleRadius = Constants.DEFAULT_PARABOLIC_TROUGH_POLE_RADIUS;
  }
  static compressFresnelReflector(e: any) {
    if (e.reflectance === Constants.DEFAULT_FRESNEL_REFLECTOR_REFLECTANCE) delete e.reflectance;

    if (e.moduleLength === Constants.DEFAULT_FRESNEL_REFLECTOR_MODULE_LENGTH) delete e.moduleLength;
    if (e.receiverId === Constants.DEFAULT_FRESNEL_REFLECTOR_RECEIVER) delete e.receiverId;

    if (e.poleHeight === Constants.DEFAULT_FRESNEL_REFLECTOR_POLE_HEIGHT) delete e.poleHeight;
    if (e.poleRadius === Constants.DEFAULT_FRESNEL_REFLECTOR_POLE_RADIUS) delete e.poleRadius;
  }

  static expandFresnelReflector(e: any) {
    if (e.reflectance === undefined) e.reflectance = Constants.DEFAULT_FRESNEL_REFLECTOR_REFLECTANCE;

    if (e.moduleLength === undefined) e.moduleLength = Constants.DEFAULT_FRESNEL_REFLECTOR_MODULE_LENGTH;
    if (e.receiverId === undefined) e.receiverId = Constants.DEFAULT_FRESNEL_REFLECTOR_RECEIVER;

    if (e.poleHeight === undefined) e.poleHeight = Constants.DEFAULT_FRESNEL_REFLECTOR_POLE_HEIGHT;
    if (e.poleRadius === undefined) e.poleRadius = Constants.DEFAULT_FRESNEL_REFLECTOR_POLE_RADIUS;
  }

  static compressHeliostat(e: any) {
    if (e.reflectance === Constants.DEFAULT_HELIOSTAT_REFLECTANCE) delete e.reflectance;

    if (e.towerId === Constants.DEFAULT_HELIOSTAT_TOWER) delete e.towerId;

    if (e.poleHeight === Constants.DEFAULT_HELIOSTAT_POLE_HEIGHT) delete e.poleHeight;
    if (e.poleRadius === Constants.DEFAULT_HELIOSTAT_POLE_RADIUS) delete e.poleRadius;
  }
  static expandHeliostat(e: any) {
    if (e.reflectance === undefined) e.reflectance = Constants.DEFAULT_HELIOSTAT_REFLECTANCE;

    if (e.towerId === undefined) e.towerId = Constants.DEFAULT_HELIOSTAT_TOWER;

    if (e.poleHeight === undefined) e.poleHeight = Constants.DEFAULT_HELIOSTAT_POLE_HEIGHT;
    if (e.poleRadius === undefined) e.poleRadius = Constants.DEFAULT_HELIOSTAT_POLE_RADIUS;
  }

  static compressSolarCollector(e: any) {
    delete e.normal;
    delete e.rotation;
    if (e.relativeAzimuth === Constants.DEFAULT_SOLAR_COLLECTOR_RELATIVE_AZIMUTH) delete e.relativeAzimuth;
    if (e.tiltAngle === Constants.DEFAULT_SOLAR_COLLECTOR_TILT_ANGLE) delete e.tiltAngle;

    switch (e.type) {
      case ObjectType.SolarPanel: {
        ContentUtil.compressSolarPanel(e);
        break;
      }
      case ObjectType.ParabolicDish: {
        ContentUtil.compressParabolicDish(e);
        break;
      }
      case ObjectType.ParabolicTrough: {
        ContentUtil.compressParabolicDish(e);
        break;
      }
      case ObjectType.FresnelReflector: {
        ContentUtil.compressFresnelReflector(e);
        break;
      }
      case ObjectType.Heliostat: {
        ContentUtil.compressHeliostat(e);
        break;
      }
    }
  }

  static expandSolarCollector(e: any) {
    e.rotation = [0, 0, 0];
    e.normal = [0, 0, 1];
    if (e.relativeAzimuth === undefined) e.relativeAzimuth = Constants.DEFAULT_SOLAR_COLLECTOR_RELATIVE_AZIMUTH;
    if (e.tiltAngle === undefined) e.tiltAngle = Constants.DEFAULT_SOLAR_COLLECTOR_TILT_ANGLE;

    switch (e.type) {
      case ObjectType.SolarPanel: {
        ContentUtil.expandSolarPanel(e);
        break;
      }
      case ObjectType.ParabolicDish: {
        ContentUtil.expandParabolicDish(e);
        break;
      }
      case ObjectType.ParabolicTrough: {
        ContentUtil.expandParabolicDish(e);
        break;
      }
      case ObjectType.FresnelReflector: {
        ContentUtil.expandFresnelReflector(e);
        break;
      }
      case ObjectType.Heliostat: {
        ContentUtil.expandHeliostat(e);
        break;
      }
    }
  }

  static compressWindTurbine(e: any) {
    delete e.normal;
    delete e.rotation;
    if (e.numberOfBlades === Constants.DEFAULT_WIND_TURBINE_NUMBER_OF_BLADES) delete e.numberOfBlades;
    if (e.pitchAngle === Constants.DEFAULT_WIND_TURBINE_PITCH_ANGLE) delete e.pitchAngle;
    if (e.relativeYawAngle === Constants.DEFAULT_WIND_TURBINE_RELATIVE_YAW_ANGLE) delete e.relativeYawAngle;
    if (e.initialRotorAngle === Constants.DEFAULT_WIND_TURBINE_INITIAL_ROTOR_ANGLE) delete e.initialRotorAngle;
    if (e.towerHeight === Constants.DEFAULT_WIND_TURBINE_TOWER_HEIGHT) delete e.towerHeight;
    if (e.towerRadius === Constants.DEFAULT_WIND_TURBINE_TOWER_RADIUS) delete e.towerRadius;
    if (e.bladeRadius === Constants.DEFAULT_WIND_TURBINE_BLADE_RADIUS) delete e.bladeRadius;
    if (e.bladeMaximumChordLength === Constants.DEFAULT_WIND_TURBINE_BLADE_MAXIMUM_CHORD_LENGTH)
      delete e.bladeMaximumChordLength;
    if (e.bladeMaximumChordRadius === Constants.DEFAULT_WIND_TURBINE_BLADE_MAXIMUM_CHORD_RADIUS)
      delete e.bladeMaximumChordRadius;
    if (e.bladeRootRadius === Constants.DEFAULT_WIND_TURBINE_BLADE_ROOT_RADIUS) delete e.bladeRootRadius;
    if (e.hubRadius === Constants.DEFAULT_WIND_TURBINE_HUB_RADIUS) delete e.hubRadius;
    if (e.hubLength === Constants.DEFAULT_WIND_TURBINE_HUB_LENGTH) delete e.hubLength;
  }

  static expandWindTurbine(e: any) {
    e.normal = [0, 0, 1];
    e.rotation = [0, 0, 0];
    if (e.numberOfBlades === undefined) e.numberOfBlades = Constants.DEFAULT_WIND_TURBINE_NUMBER_OF_BLADES;
    if (e.pitchAngle === undefined) e.pitchAngle = Constants.DEFAULT_WIND_TURBINE_PITCH_ANGLE;
    if (e.relativeYawAngle === undefined) e.relativeYawAngle = Constants.DEFAULT_WIND_TURBINE_RELATIVE_YAW_ANGLE;
    if (e.initialRotorAngle === undefined) e.initialRotorAngle = Constants.DEFAULT_WIND_TURBINE_INITIAL_ROTOR_ANGLE;
    if (e.towerHeight === undefined) e.towerHeight = Constants.DEFAULT_WIND_TURBINE_TOWER_HEIGHT;
    if (e.towerRadius === undefined) e.towerRadius = Constants.DEFAULT_WIND_TURBINE_TOWER_RADIUS;
    if (e.bladeRadius === undefined) e.bladeRadius = Constants.DEFAULT_WIND_TURBINE_BLADE_RADIUS;
    if (e.bladeMaximumChordLength === undefined)
      e.bladeMaximumChordLength = Constants.DEFAULT_WIND_TURBINE_BLADE_MAXIMUM_CHORD_LENGTH;
    if (e.bladeMaximumChordRadius === undefined)
      e.bladeMaximumChordRadius = Constants.DEFAULT_WIND_TURBINE_BLADE_MAXIMUM_CHORD_RADIUS;
    if (e.bladeRootRadius === undefined) e.bladeRootRadius = Constants.DEFAULT_WIND_TURBINE_BLADE_ROOT_RADIUS;
    if (e.hubRadius === undefined) e.hubRadius = Constants.DEFAULT_WIND_TURBINE_HUB_RADIUS;
    if (e.hubLength === undefined) e.hubLength = Constants.DEFAULT_WIND_TURBINE_HUB_LENGTH;
  }

  static compressBillBoard(e: any) {
    delete e.normal;
    delete e.rotation;
    if (!e.flip) delete e.flip;

    switch (e) {
      case ObjectType.Human: {
        if (e.name === Constants.DEFAULT_HUMAN_NAME) delete e.name;
        if (!e.observer) delete e.observer;
        break;
      }
      case ObjectType.Flower: {
        if (e.name === Constants.DEFAULT_FLOWER_TYPE) delete e.name;
        break;
      }
      case ObjectType.Tree: {
        if (e.name === Constants.DEFAULT_TREE_TYPE) delete e.name;
        if (!e.showModel) delete e.showModel;
        break;
      }
    }
  }

  static expandBillBoards(e: any) {
    e.normal = [0, 0, 1];
    e.rotation = [0, 0, 0];

    switch (e) {
      case ObjectType.Human: {
        if (e.name === undefined) e.name === Constants.DEFAULT_HUMAN_NAME;
        break;
      }
      case ObjectType.Flower: {
        if (e.name === undefined) e.name === Constants.DEFAULT_FLOWER_TYPE;
        break;
      }
      case ObjectType.Tree: {
        if (e.name === undefined) e.name === Constants.DEFAULT_TREE_TYPE;
        break;
      }
    }
  }

  static compressLight(e: any) {
    if (isSameColor(e.color, Constants.DEFAULT_LIGHT_COLOR)) delete e.color;
    if (e.intensity === Constants.DEFAULT_LIGHT_INTENSITY) delete e.intensity;
    if (e.distance === Constants.DEFAULT_LIGHT_DISTANCE) delete e.distance;
    if (e.decay === Constants.DEFAULT_LIGHT_DECAY) delete e.decay;

    if (!e.inside) delete e.inside;
  }

  static expandLight(e: any) {
    if (e.color === undefined) e.color = Constants.DEFAULT_LIGHT_COLOR;
    if (e.intensity === undefined) e.intensity = Constants.DEFAULT_LIGHT_INTENSITY;
    if (e.distance === undefined) e.distance = Constants.DEFAULT_LIGHT_DISTANCE;
    if (e.decay === undefined) e.decay = Constants.DEFAULT_LIGHT_DECAY;

    if (e.inside === undefined) e.inside = false;
  }

  static compressBatterStorage(e: any) {
    delete e.normal;
    delete e.rotation;
    if (isSameColor(e.color, Constants.DEFAULT_BATTERY_STORAGE_COLOR)) delete e.color;
    if (e.chargingEfficiency === Constants.DEFAULT_BATTERY_STORAGE_EFFICIENCY) delete e.chargingEfficiency;
    if (e.dischargingEfficiency === Constants.DEFAULT_BATTERY_STORAGE_EFFICIENCY) delete e.dischargingEfficiency;
  }

  static expandBatterStorage(e: any) {
    e.normal = [0, 0, 0];
    e.rotation = [0, 0, 0];
    if (e.color === undefined) e.color = Constants.DEFAULT_BATTERY_STORAGE_COLOR;
    if (e.chargingEfficiency === undefined) e.chargingEfficiency = Constants.DEFAULT_BATTERY_STORAGE_EFFICIENCY;
    if (e.dischargingEfficiency === undefined) e.dischargingEfficiency = Constants.DEFAULT_BATTERY_STORAGE_EFFICIENCY;
  }
}

const isObjectExistAndEmpty = (obj: any) => {
  if (obj === undefined) return false;
  return Object.keys(obj).length === 0;
};

const isObjectShallowEqual = (obj1: any, obj2: any) => {
  if (obj1 === obj2) return true;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
};

const isSameColor = (color1: any, color2: any) => {
  const c1 = new Color(color1);
  const c2 = new Color(color2);
  return c1.getHex() === c2.getHex();
};

const isRectSame = (r1: any, r2: any) => {
  if (!r1 || !r2) return false;
  return r1.x === r2.x && r1.y === r2.y && r1.width === r2.width && r1.height === r2.height;
};

const isSameGround = (g1: any, g2: any) => {
  if (g1.albedo !== g2.albedo) return false;
  if (g1.thermalDiffusivity !== g2.thermalDiffusivity) return false;
  if (g1.snowReflectionFactors.length !== g2.snowReflectionFactors.length) return false;
  for (let i = 0; i < g1.snowReflectionFactors.length; i++) {
    if (g1.snowReflectionFactors[i] !== g2.snowReflectionFactors[i]) return false;
  }
  return true;
};
