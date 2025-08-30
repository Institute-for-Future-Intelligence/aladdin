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
    this.humanName = HumanName.Jack;

    this.flowerType = FlowerType.YellowFlower;

    this.treeType = TreeType.Dogwood;
    this.treeSpread = 3;
    this.treeHeight = 4;

    this.foundationHeight = 0.1;
    this.foundationColor = '#808080';
    this.foundationTexture = FoundationTexture.NoTexture;
    this.foundationEnableSlope = false;
    this.foundationSlope = 0.2;
    this.groundFloorRValue = Constants.DEFAULT_GROUND_FLOOR_R_VALUE;

    this.rulerHeight = 0.1;
    this.rulerWidth = 1;
    this.rulerColor = '#D3D3D3';

    this.cuboidHeight = 4;
    this.cuboidFaceColors = ['#808080', '#808080', '#808080', '#808080', '#808080', '#808080'];
    this.cuboidFaceTextures = [
      CuboidTexture.NoTexture,
      CuboidTexture.NoTexture,
      CuboidTexture.NoTexture,
      CuboidTexture.NoTexture,
      CuboidTexture.NoTexture,
      CuboidTexture.NoTexture,
    ];
    this.cuboidStackable = false;
    this.cuboidTransparency = 0;

    this.wallHeight = 5;
    this.wallThickness = 0.3;
    this.wallColor = '#ffffff';
    this.wallTexture = WallTexture.Default;
    this.wallStructure = WallStructure.Default;
    this.wallStructureSpacing = 2;
    this.wallStructureWidth = 0.1;
    this.wallStructureColor = '#ffffff';
    this.wallOpacity = 0.5;
    this.wallRValue = Constants.DEFAULT_WALL_R_VALUE;
    this.wallAirPermeability = 0;
    this.wallVolumetricHeatCapacity = 0.5;
    this.wallEavesLength = 0.3;
    this.wallParapet = DEFAULT_PARAPET_SETTINGS;

    this.roofColor = Constants.DEFAULT_ROOF_COLOR;
    this.roofSideColor = Constants.DEFAULT_ROOF_SIDE_COLOR;
    this.roofTexture = RoofTexture.Default;
    this.roofThickness = Constants.DEFAULT_ROOF_THICKNESS;
    this.roofStructure = RoofStructure.Default;
    this.roofGlassOpacity = 0.5;
    this.roofGlassTint = '#73D8FF';
    this.roofRafterWidth = 0.1;
    this.roofRafterSpacing = 1;
    this.roofRafterColor = '#ffffff';
    this.roofRValue = Constants.DEFAULT_ROOF_R_VALUE;
    this.roofAirPermeability = 0;
    this.roofVolumetricHeatCapacity = 0.5;
    this.roofRise = 2;
    this.roofCeiling = false;
    this.ceilingRValue = Constants.DEFAULT_CEILING_R_VALUE;

    this.doorColor = '#ffffff';
    this.doorFrameColor = '#ffffff';
    this.doorTexture = DoorTexture.Default;
    this.doorType = DoorType.Default;
    this.doorArchHeight = 1;
    this.doorFilled = true;
    this.doorInterior = false;
    this.doorUValue = Constants.DEFAULT_DOOR_U_VALUE;
    this.doorAirPermeability = 0;
    this.doorOpacity = 1;
    this.doorVolumetricHeatCapacity = 0.5;

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
    this.solarPanelPoleHeight = 1;
    this.solarPanelPoleSpacing = 3;
    this.solarPanelTiltAngle = 0;
    this.solarPanelRelativeAzimuth = 0;
    this.solarPanelFrameColor = '#ffffff';
    this.solarPanelCx = 0;
    this.solarPanelCy = 0;
    this.solarPanelBatteryStorageId = null;

    this.solarWaterHeaterColor = Constants.DEFAULT_SOLAR_WATER_HEATER_COLOR;
    this.solarWaterHeaterRelativeAzimuth = 0;
    this.solarWaterHeaterTankRadius = Constants.DEFAULT_SOLAR_WATER_HEATER_TANK_RADIUS;
    this.solarWaterHeaterHeight = Constants.DEFAULT_SOLAR_WATER_HEATER_HEIGHT;

    this.parabolicDishReflectance = 0.9;
    this.parabolicDishAbsorptance = 0.95;
    this.parabolicDishOpticalEfficiency = 0.7;
    this.parabolicDishThermalEfficiency = 0.3;
    this.parabolicDishRimDiameter = 4;
    this.parabolicDishLatusRectum = 8;
    this.parabolicDishPoleHeight = 0.2;
    this.parabolicDishPoleRadius = 0.1;
    this.parabolicDishReceiverStructure = ParabolicDishStructureType.CentralPole;

    this.parabolicTroughReflectance = 0.9;
    this.parabolicTroughAbsorptance = 0.95;
    this.parabolicTroughOpticalEfficiency = 0.7;
    this.parabolicTroughThermalEfficiency = 0.3;
    this.parabolicTroughLatusRectum = 2;
    this.parabolicTroughPoleHeight = 0.2;
    this.parabolicTroughWidth = 2;
    this.parabolicTroughModuleLength = 3;

    this.fresnelReflectorReceiver = 'None';
    this.fresnelReflectorReflectance = 0.9;
    this.fresnelReflectorPoleHeight = 0.2;
    this.fresnelReflectorWidth = 2;
    this.fresnelReflectorModuleLength = 3;

    this.heliostatTower = 'None';
    this.heliostatReflectance = 0.9;
    this.heliostatPoleHeight = 0.2;
    this.heliostatPoleRadius = 0.1;
    this.heliostatWidth = 4;
    this.heliostatLength = 2;

    this.lightColor = '#ffff99';
    this.lightIntensity = 3;
    this.lightDistance = 5;
  }
}
