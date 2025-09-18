/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import { immerable } from 'immer';
import { ActionState } from './ActionState';
import {
  BirdSafeDesign,
  CuboidTexture,
  DoorTexture,
  FlowerType,
  FoundationTexture,
  HumanName,
  Orientation,
  ParabolicDishStructureType,
  RoofTexture,
  TreeType,
  WallTexture,
} from '../types';
import { ParapetArgs, WallStructure } from '../models/WallModel';
import { WindowType } from 'src/models/WindowModel';
import { RoofStructure } from '../models/RoofModel';
import { DoorType } from 'src/models/DoorModel';
import * as Constants from '../constants';
import { DEFAULT_PARAPET_SETTINGS } from 'src/views/wall/parapet';

export class DefaultActionState implements ActionState {
  // Needed for immer drafting to work properly: https://immerjs.github.io/immer/docs/complex-objects
  [immerable] = true;

  humanName: HumanName;

  flowerType: FlowerType;

  treeType: TreeType;
  treeSpread: number;
  treeHeight: number;

  foundationHeight: number;
  foundationColor: string;
  foundationTexture: FoundationTexture;
  foundationEnableSlope: boolean;
  foundationSlope: number;
  groundFloorRValue: number;

  rulerHeight: number;
  rulerWidth: number;
  rulerColor: string;

  protractorLy: number;
  protractorLz: number;
  protractorRadius: number;
  protractorColor: string;
  protractorTickMarkColor: string;

  cuboidHeight: number;
  cuboidFaceColors: string[];
  cuboidFaceTextures: CuboidTexture[];
  cuboidStackable: boolean;
  cuboidTransparency: number;

  wallHeight: number;
  wallThickness: number;
  wallColor: string;
  wallTexture: WallTexture;
  wallStructure: WallStructure;
  wallStructureSpacing: number;
  wallStructureWidth: number;
  wallStructureColor: string;
  wallOpacity: number;
  wallRValue: number;
  wallAirPermeability: number;
  wallVolumetricHeatCapacity: number;
  wallEavesLength: number;
  wallParapet: ParapetArgs;

  roofColor: string;
  roofSideColor: string;
  roofTexture: RoofTexture;
  roofThickness: number;
  roofStructure: RoofStructure;
  roofGlassOpacity: number;
  roofGlassTint: string;
  roofRafterWidth: number;
  roofRafterSpacing: number;
  roofRafterColor: string;
  roofRValue: number;
  roofAirPermeability: number;
  roofVolumetricHeatCapacity: number;
  roofRise: number;
  roofCeiling: boolean;
  ceilingRValue: number;

  doorColor: string;
  doorFrameColor: string;
  doorTexture: DoorTexture;
  doorType: DoorType;
  doorArchHeight: number;
  doorFilled: boolean;
  doorInterior: boolean;
  doorUValue: number;
  doorAirPermeability: number;
  doorOpacity: number;
  doorVolumetricHeatCapacity: number;

  windowWidth: number;
  windowHeight: number;
  windowColor: string;
  windowTint: string;
  windowOpacity: number;
  windowUValue: number;
  windowAirPermeability: number;
  windowHorizontalMullion: boolean;
  windowVerticalMullion: boolean;
  windowMullionWidth: number;
  windowHorizontalMullionSpacing: number;
  windowVerticalMullionSpacing: number;
  windowMullionColor: string;
  windowShutterLeft: boolean;
  windowShutterRight: boolean;
  windowShutterColor: string;
  windowShutterWidth: number;
  windowFrame: boolean;
  windowFrameWidth: number;
  windowSillWidth: number;
  windowType: WindowType;
  windowArchHeight: number;
  windowEmpty: boolean;
  windowInterior: boolean;

  windTurbineBirdSafeDesign: BirdSafeDesign;
  windTurbineBladeColor: string;
  windTurbineStripeColor: string;
  windTurbineNumberOfBlades: number;
  windTurbinePitchAngle: number;
  windTurbineRelativeYawAngle: number;
  windTurbineInitialRotorAngle: number;
  windTurbineTowerHeight: number;
  windTurbineTowerRadius: number;
  windTurbineBladeRadius: number;
  windTurbineBladeMaximumChordLength: number;
  windTurbineBladeMaximumChordRadius: number;
  windTurbineBladeRootRadius: number;
  windTurbineHubRadius: number;
  windTurbineHubLength: number;

  solarPanelModelName: string;
  solarPanelOrientation: Orientation;
  solarPanelPoleHeight: number;
  solarPanelPoleSpacing: number;
  solarPanelTiltAngle: number;
  solarPanelRelativeAzimuth: number;
  solarPanelFrameColor: string;
  solarPanelCx: number;
  solarPanelCy: number;
  solarPanelBatteryStorageId: string | null;

  solarWaterHeaterColor: string;
  solarWaterHeaterRelativeAzimuth: number;
  solarWaterHeaterTankRadius: number;
  solarWaterHeaterHeight: number;

  parabolicDishReflectance: number;
  parabolicDishAbsorptance: number;
  parabolicDishOpticalEfficiency: number;
  parabolicDishThermalEfficiency: number;
  parabolicDishRimDiameter: number;
  parabolicDishLatusRectum: number;
  parabolicDishPoleHeight: number;
  parabolicDishPoleRadius: number;
  parabolicDishReceiverStructure: ParabolicDishStructureType;

  parabolicTroughReflectance: number;
  parabolicTroughAbsorptance: number;
  parabolicTroughOpticalEfficiency: number;
  parabolicTroughThermalEfficiency: number;
  parabolicTroughLatusRectum: number;
  parabolicTroughPoleHeight: number;
  parabolicTroughWidth: number;
  parabolicTroughModuleLength: number;

  fresnelReflectorReceiver: string;
  fresnelReflectorReflectance: number;
  fresnelReflectorPoleHeight: number;
  fresnelReflectorWidth: number;
  fresnelReflectorModuleLength: number;

  heliostatTower: string;
  heliostatReflectance: number;
  heliostatPoleHeight: number;
  heliostatPoleRadius: number;
  heliostatWidth: number;
  heliostatLength: number;

  lightColor: string;
  lightIntensity: number;
  lightDistance: number;

  constructor() {
    this.humanName = Constants.DEFAULT_HUMAN_NAME;

    this.flowerType = Constants.DEFAULT_FLOWER_TYPE;

    this.treeType = Constants.DEFAULT_TREE_TYPE;
    this.treeSpread = Constants.DEFAULT_TREE_SPREAD;
    this.treeHeight = Constants.DEFAULT_TREE_HEIGHT;

    this.foundationHeight = Constants.DEFAULT_FOUNDATION_LZ;
    this.foundationColor = Constants.DEFAULT_FOUNDATION_COLOR;
    this.foundationTexture = FoundationTexture.NoTexture;
    this.foundationEnableSlope = false;
    this.foundationSlope = Constants.DEFAULT_FOUNDATION_SLOPE;
    this.groundFloorRValue = Constants.DEFAULT_GROUND_FLOOR_R_VALUE;

    this.rulerHeight = 0.1;
    this.rulerWidth = 1;
    this.rulerColor = '#D3D3D3';

    this.protractorLy = Constants.DEFAULT_PROTRACTOR_LY;
    this.protractorLz = Constants.DEFAULT_PROTRACTOR_LZ;
    this.protractorRadius = Constants.DEFAULT_PROTRACTOR_RADIUS;
    this.protractorColor = Constants.DEFAULT_PROTRACTOR_COLOR;
    this.protractorTickMarkColor = Constants.DEFAULT_PROTRACTOR_TICK_MARK_COLOR;

    this.cuboidHeight = 4;
    this.cuboidFaceColors = new Array(6).fill(Constants.DEFAULT_CUBOID_COLOR);
    this.cuboidFaceTextures = new Array(6).fill(CuboidTexture.NoTexture);
    this.cuboidStackable = false;
    this.cuboidTransparency = Constants.DEFAULT_CUBOID_TRANSPARENCY;

    this.wallHeight = Constants.DEFAULT_WALL_HEIGHT;
    this.wallThickness = Constants.DEFAULT_WALL_THICKNESS;
    this.wallColor = Constants.DEFAULT_WALL_COLOR;
    this.wallTexture = WallTexture.Default;
    this.wallStructure = WallStructure.Default;
    this.wallStructureSpacing = Constants.DEFAULT_WALL_STRUCTURE_SPACING;
    this.wallStructureWidth = Constants.DEFAULT_WALL_STRUCTURE_WIDTH;
    this.wallStructureColor = Constants.DEFAULT_WALL_STRUCTURE_COLOR;
    this.wallOpacity = Constants.DEFAULT_WALL_OPACITY;
    this.wallRValue = Constants.DEFAULT_WALL_R_VALUE;
    this.wallAirPermeability = Constants.DEFAULT_WALL_AIR_PERMEABILITY;
    this.wallVolumetricHeatCapacity = Constants.DEFAULT_WALL_VOLUMETRIC_HEAT_CAPACITY;
    this.wallEavesLength = Constants.DEFAULT_WALL_EAVES_LENGTH;
    this.wallParapet = DEFAULT_PARAPET_SETTINGS;

    this.roofColor = Constants.DEFAULT_ROOF_COLOR;
    this.roofSideColor = Constants.DEFAULT_ROOF_SIDE_COLOR;
    this.roofTexture = RoofTexture.Default;
    this.roofThickness = Constants.DEFAULT_ROOF_THICKNESS;
    this.roofStructure = RoofStructure.Default;
    this.roofGlassOpacity = Constants.DEFAULT_ROOF_OPACITY;
    this.roofGlassTint = Constants.DEFAULT_ROOF_GLASS_TINT;
    this.roofRafterWidth = Constants.DEFAULT_ROOF_RAFTER_WIDTH;
    this.roofRafterSpacing = Constants.DEFAULT_ROOF_RAFTER_SPACING;
    this.roofRafterColor = Constants.DEFAULT_ROOF_RAFTER_COLOR;
    this.roofRValue = Constants.DEFAULT_ROOF_R_VALUE;
    this.roofAirPermeability = Constants.DEFAULT_ROOF_AIR_PERMEABILITY;
    this.roofVolumetricHeatCapacity = Constants.DEFAULT_ROOF_VOLUMETRIC_HEAT_CAPACITY;
    this.roofRise = Constants.DEFAULT_ROOF_RISE;
    this.roofCeiling = false;
    this.ceilingRValue = Constants.DEFAULT_CEILING_R_VALUE;

    this.doorColor = Constants.DEFAULT_DOOR_COLOR;
    this.doorFrameColor = Constants.DEFAULT_DOOR_FRAME_COLOR;
    this.doorTexture = DoorTexture.Default;
    this.doorType = DoorType.Default;
    this.doorArchHeight = Constants.DEFAULT_DOOR_ARCH_HEIGHT;
    this.doorFilled = true;
    this.doorInterior = false;
    this.doorUValue = Constants.DEFAULT_DOOR_U_VALUE;
    this.doorAirPermeability = Constants.DEFAULT_DOOR_AIR_PERMEABILITY;
    this.doorOpacity = Constants.DEFAULT_DOOR_OPACITY;
    this.doorVolumetricHeatCapacity = Constants.DEFAULT_DOOR_VOLUMETRIC_HEAT_CAPACITY;

    this.windowWidth = 1;
    this.windowHeight = 1;
    this.windowColor = Constants.DEFAULT_WINDOW_COLOR;
    this.windowTint = Constants.DEFAULT_WINDOW_TINT;
    this.windowOpacity = Constants.DEFAULT_WINDOW_OPACITY;
    this.windowUValue = Constants.DEFAULT_WINDOW_U_VALUE;
    this.windowAirPermeability = Constants.DEFAULT_WINDOW_AIR_PERMEABILITY;
    this.windowHorizontalMullion = true;
    this.windowVerticalMullion = true;
    this.windowMullionWidth = Constants.DEFAULT_MULLION_WIDTH;
    this.windowHorizontalMullionSpacing = Constants.DEFAULT_HORIZONTAL_MULLION_SPACING;
    this.windowVerticalMullionSpacing = Constants.DEFAULT_VERTICAL_MULLION_SPACING;
    this.windowMullionColor = Constants.DEFAULT_MULLION_COLOR;
    this.windowFrame = false;
    this.windowFrameWidth = Constants.DEFAULT_WINDOW_FRAME_WIDTH;
    this.windowSillWidth = Constants.DEFAULT_WINDOW_SILL_WIDTH;
    this.windowType = WindowType.Default;
    this.windowArchHeight = Constants.DEFAULT_WINDOW_ARCH_HEIGHT;
    // I worry about this using Shutter objects may cause default to be accidentally overwritten.
    this.windowShutterLeft = false;
    this.windowShutterRight = false;
    this.windowShutterColor = Constants.DEFAULT_WINDOW_SHUTTER_COLOR;
    this.windowShutterWidth = Constants.DEFAULT_WINDOW_SHUTTER_WIDTH;
    this.windowEmpty = false;
    this.windowInterior = false;

    this.windTurbineBirdSafeDesign = BirdSafeDesign.None;
    this.windTurbineBladeColor = Constants.DEFAULT_WIND_TURBINE_BLADE_COLOR;
    this.windTurbineStripeColor = Constants.DEFAULT_WIND_TURBINE_STRIPE_COLOR;
    this.windTurbineNumberOfBlades = Constants.DEFAULT_WIND_TURBINE_NUMBER_OF_BLADES;
    this.windTurbinePitchAngle = Constants.DEFAULT_WIND_TURBINE_PITCH_ANGLE;
    this.windTurbineRelativeYawAngle = Constants.DEFAULT_WIND_TURBINE_RELATIVE_YAW_ANGLE;
    this.windTurbineInitialRotorAngle = Constants.DEFAULT_WIND_TURBINE_INITIAL_ROTOR_ANGLE;
    this.windTurbineTowerHeight = Constants.DEFAULT_WIND_TURBINE_TOWER_HEIGHT;
    this.windTurbineTowerRadius = Constants.DEFAULT_WIND_TURBINE_TOWER_RADIUS;
    this.windTurbineBladeRadius = Constants.DEFAULT_WIND_TURBINE_BLADE_RADIUS;
    this.windTurbineBladeMaximumChordLength = Constants.DEFAULT_WIND_TURBINE_BLADE_MAXIMUM_CHORD_LENGTH;
    this.windTurbineBladeMaximumChordRadius = Constants.DEFAULT_WIND_TURBINE_BLADE_MAXIMUM_CHORD_RADIUS;
    this.windTurbineBladeRootRadius = Constants.DEFAULT_WIND_TURBINE_BLADE_ROOT_RADIUS;
    this.windTurbineHubRadius = Constants.DEFAULT_WIND_TURBINE_HUB_RADIUS;
    this.windTurbineHubLength = Constants.DEFAULT_WIND_TURBINE_HUB_LENGTH;

    this.solarPanelModelName = Constants.DEFAULT_SOLAR_PANEL_MODEL;
    this.solarPanelOrientation = Orientation.landscape;
    this.solarPanelPoleHeight = Constants.DEFAULT_SOLAR_PANEL_POLE_HEIGHT;
    this.solarPanelPoleSpacing = Constants.DEFAULT_SOLAR_PANEL_POLE_SPACING;
    this.solarPanelTiltAngle = Constants.DEFAULT_SOLAR_COLLECTOR_TILT_ANGLE;
    this.solarPanelRelativeAzimuth = Constants.DEFAULT_SOLAR_COLLECTOR_RELATIVE_AZIMUTH;
    this.solarPanelFrameColor = Constants.DEFAULT_SOLAR_PANEL_FRAME_COLOR;
    this.solarPanelCx = 0;
    this.solarPanelCy = 0;
    this.solarPanelBatteryStorageId = Constants.DEFAULT_SOLAR_PANEL_BATTERY_STORAGE_ID;

    this.solarWaterHeaterColor = Constants.DEFAULT_SOLAR_WATER_HEATER_COLOR;
    this.solarWaterHeaterRelativeAzimuth = Constants.DEFAULT_SOLAR_COLLECTOR_RELATIVE_AZIMUTH;
    this.solarWaterHeaterTankRadius = Constants.DEFAULT_SOLAR_WATER_HEATER_TANK_RADIUS;
    this.solarWaterHeaterHeight = Constants.DEFAULT_SOLAR_WATER_HEATER_HEIGHT;

    this.parabolicDishReflectance = Constants.DEFAULT_PARABOLIC_DISH_REFLECTANCE;
    this.parabolicDishAbsorptance = Constants.DEFAULT_PARABOLIC_DISH_ABSORPTANCE;
    this.parabolicDishOpticalEfficiency = Constants.DEFAULT_PARABOLIC_DISH_OPTICAL_EFFICIENCY;
    this.parabolicDishThermalEfficiency = Constants.DEFAULT_PARABOLIC_DISH_THERMAL_EFFICIENCY;
    this.parabolicDishRimDiameter = Constants.DEFAULT_PARABOLIC_DISH_RIM_DIAMETER;
    this.parabolicDishLatusRectum = Constants.DEFAULT_PARABOLIC_DISH_LATUS_RECTUM;
    this.parabolicDishPoleHeight = Constants.DEFAULT_PARABOLIC_DISH_POLE_HEIGHT;
    this.parabolicDishPoleRadius = Constants.DEFAULT_PARABOLIC_DISH_POLE_RADIUS;
    this.parabolicDishReceiverStructure = Constants.DEFAULT_PARABOLIC_DISH_RECEIVER_STRUCTURE;

    this.parabolicTroughReflectance = Constants.DEFAULT_PARABOLIC_TROUGH_REFLECTANCE;
    this.parabolicTroughAbsorptance = Constants.DEFAULT_PARABOLIC_TROUGH_ABSORPTANCE;
    this.parabolicTroughOpticalEfficiency = Constants.DEFAULT_PARABOLIC_TROUGH_OPTICAL_EFFICIENCY;
    this.parabolicTroughThermalEfficiency = Constants.DEFAULT_PARABOLIC_TROUGH_THERMAL_EFFICIENCY;
    this.parabolicTroughLatusRectum = Constants.DEFAULT_PARABOLIC_TROUGH_LATUS_RECTUM;
    this.parabolicTroughPoleHeight = Constants.DEFAULT_PARABOLIC_TROUGH_POLE_HEIGHT;
    this.parabolicTroughWidth = Constants.DEFAULT_PARABOLIC_TROUGH_WIDTH;
    this.parabolicTroughModuleLength = Constants.DEFAULT_PARABOLIC_TROUGH_MODULE_LENGTH;

    this.fresnelReflectorReceiver = Constants.DEFAULT_FRESNEL_REFLECTOR_RECEIVER;
    this.fresnelReflectorReflectance = Constants.DEFAULT_FRESNEL_REFLECTOR_REFLECTANCE;
    this.fresnelReflectorPoleHeight = Constants.DEFAULT_FRESNEL_REFLECTOR_POLE_HEIGHT;
    this.fresnelReflectorWidth = Constants.DEFAULT_FRESNEL_REFLECTOR_WIDTH;
    this.fresnelReflectorModuleLength = Constants.DEFAULT_FRESNEL_REFLECTOR_MODULE_LENGTH;

    this.heliostatTower = Constants.DEFAULT_HELIOSTAT_TOWER;
    this.heliostatReflectance = Constants.DEFAULT_HELIOSTAT_REFLECTANCE;
    this.heliostatPoleHeight = Constants.DEFAULT_HELIOSTAT_POLE_HEIGHT;
    this.heliostatPoleRadius = Constants.DEFAULT_HELIOSTAT_POLE_RADIUS;
    this.heliostatWidth = Constants.DEFAULT_HELIOSTAT_WIDTH;
    this.heliostatLength = Constants.DEFAULT_HELIOSTAT_LENGTH;

    this.lightColor = Constants.DEFAULT_LIGHT_COLOR;
    this.lightIntensity = Constants.DEFAULT_LIGHT_INTENSITY;
    this.lightDistance = Constants.DEFAULT_LIGHT_DISTANCE;
  }
}
