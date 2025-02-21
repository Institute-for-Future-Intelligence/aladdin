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
import {
  DEFAULT_CEILING_R_VALUE,
  DEFAULT_DOOR_U_VALUE,
  DEFAULT_GROUND_FLOOR_R_VALUE,
  DEFAULT_ROOF_R_VALUE,
  DEFAULT_SOLAR_PANEL_MODEL,
  DEFAULT_WALL_R_VALUE,
  DEFAULT_WIND_TURBINE_BLADE_COLOR,
  DEFAULT_WIND_TURBINE_STRIPE_COLOR,
  DEFAULT_WINDOW_U_VALUE,
} from '../constants';
import { DEFAULT_PARAPET_SETTINGS } from 'src/views/wall/parapet';
import { WATER_TANK_RADIUS } from 'src/views/solarWaterHeater/solarWaterHeater';

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
  groundFloorRValue: number;

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
  doorOpacity: number;
  doorVolumetricHeatCapacity: number;

  windowWidth: number;
  windowHeight: number;
  windowColor: string;
  windowTint: string;
  windowOpacity: number;
  windowUValue: number;
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
    this.groundFloorRValue = DEFAULT_GROUND_FLOOR_R_VALUE;

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
    this.wallRValue = DEFAULT_WALL_R_VALUE;
    this.wallVolumetricHeatCapacity = 0.5;
    this.wallEavesLength = 0.3;
    this.wallParapet = DEFAULT_PARAPET_SETTINGS;

    this.roofColor = '#454769';
    this.roofSideColor = '#ffffff';
    this.roofTexture = RoofTexture.Default;
    this.roofThickness = 0.2;
    this.roofStructure = RoofStructure.Default;
    this.roofGlassOpacity = 0.5;
    this.roofGlassTint = '#73D8FF';
    this.roofRafterWidth = 0.1;
    this.roofRafterSpacing = 1;
    this.roofRafterColor = '#ffffff';
    this.roofRValue = DEFAULT_ROOF_R_VALUE;
    this.roofVolumetricHeatCapacity = 0.5;
    this.roofRise = 2;
    this.roofCeiling = false;
    this.ceilingRValue = DEFAULT_CEILING_R_VALUE;

    this.doorColor = '#ffffff';
    this.doorFrameColor = '#ffffff';
    this.doorTexture = DoorTexture.Default;
    this.doorType = DoorType.Default;
    this.doorArchHeight = 1;
    this.doorFilled = true;
    this.doorInterior = false;
    this.doorUValue = DEFAULT_DOOR_U_VALUE;
    this.doorOpacity = 1;
    this.doorVolumetricHeatCapacity = 0.5;

    this.windowWidth = 1;
    this.windowHeight = 1;
    this.windowColor = '#ffffff';
    this.windowTint = '#73D8FF';
    this.windowOpacity = 0.5;
    this.windowUValue = DEFAULT_WINDOW_U_VALUE;
    this.windowHorizontalMullion = true;
    this.windowVerticalMullion = true;
    this.windowMullionWidth = 0.06;
    this.windowHorizontalMullionSpacing = 0.5;
    this.windowVerticalMullionSpacing = 0.5;
    this.windowMullionColor = '#ffffff';
    this.windowFrame = false;
    this.windowFrameWidth = 0.1;
    this.windowSillWidth = 0.1;
    this.windowType = WindowType.Default;
    this.windowArchHeight = 1;
    // I worry about this using Shutter objects may cause default to be accidentally overwritten.
    this.windowShutterLeft = false;
    this.windowShutterRight = false;
    this.windowShutterColor = 'gray';
    this.windowShutterWidth = 0.5;
    this.windowEmpty = false;
    this.windowInterior = false;

    this.windTurbineBirdSafeDesign = BirdSafeDesign.None;
    this.windTurbineBladeColor = DEFAULT_WIND_TURBINE_BLADE_COLOR;
    this.windTurbineStripeColor = DEFAULT_WIND_TURBINE_STRIPE_COLOR;
    this.windTurbineNumberOfBlades = 3;
    this.windTurbinePitchAngle = Math.PI / 18;
    this.windTurbineRelativeYawAngle = 0;
    this.windTurbineInitialRotorAngle = 0;
    this.windTurbineTowerHeight = 20;
    this.windTurbineTowerRadius = 0.5;
    this.windTurbineBladeRadius = 10;
    this.windTurbineBladeMaximumChordLength = 1;
    this.windTurbineBladeMaximumChordRadius = 3;
    this.windTurbineBladeRootRadius = 0.3;
    this.windTurbineHubRadius = 0.75;
    this.windTurbineHubLength = 1.5;

    this.solarPanelModelName = DEFAULT_SOLAR_PANEL_MODEL;
    this.solarPanelOrientation = Orientation.landscape;
    this.solarPanelPoleHeight = 1;
    this.solarPanelPoleSpacing = 3;
    this.solarPanelTiltAngle = 0;
    this.solarPanelRelativeAzimuth = 0;
    this.solarPanelFrameColor = '#ffffff';
    this.solarPanelCx = 0;
    this.solarPanelCy = 0;
    this.solarPanelBatteryStorageId = null;

    this.solarWaterHeaterColor = 'grey';
    this.solarWaterHeaterRelativeAzimuth = 0;
    this.solarWaterHeaterTankRadius = WATER_TANK_RADIUS;
    this.solarWaterHeaterHeight = 1;

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
