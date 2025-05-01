/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

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

export interface ActionState {
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

  rulerWidth: number;
  rulerHeight: number;
  rulerColor: string;

  cuboidHeight: number;
  cuboidFaceColors: string[];
  cuboidFaceTextures: CuboidTexture[];
  cuboidStackable: boolean;
  cuboidTransparency: number;

  wallHeight: number;
  wallThickness: number;
  wallOpacity: number;
  wallColor: string;
  wallTexture: WallTexture;
  wallStructure: WallStructure;
  wallStructureSpacing: number;
  wallStructureWidth: number;
  wallStructureColor: string;
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
  windowColor: string; // frame color
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
}
