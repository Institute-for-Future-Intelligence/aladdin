/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import { immerable } from 'immer';
import { ActionState } from './ActionState';
import {
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
import { WallStructure } from '../models/WallModel';
import { defaultShutter } from '../views/window/window';
import { WindowType } from 'src/models/WindowModel';
import { RoofStructure } from '../models/RoofModel';
import { DoorType } from 'src/models/DoorModel';
import {
  DEFAULT_CEILING_R_VALUE,
  DEFAULT_DOOR_U_VALUE,
  DEFAULT_GROUND_FLOOR_R_VALUE,
  DEFAULT_ROOF_R_VALUE,
  DEFAULT_WALL_R_VALUE,
  DEFAULT_WINDOW_U_VALUE,
} from '../constants';

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
  wallUnfilledHeight: number;
  wallEavesLength: number;

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
  doorUValue: number;
  doorOpacity: number;
  doorVolumetricHeatCapacity: number;

  windowWidth: number;
  windowHeight: number;
  windowColor: string;
  windowTint: string;
  windowOpacity: number;
  windowUValue: number;
  windowMullion: boolean;
  windowMullionWidth: number;
  windowMullionSpacing: number;
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

  solarPanelModelName: string;
  solarPanelOrientation: Orientation;
  solarPanelPoleHeight: number;
  solarPanelPoleSpacing: number;
  solarPanelTiltAngle: number;
  solarPanelRelativeAzimuth: number;
  solarPanelFrameColor: string;

  parabolicDishReflectance: number;
  parabolicDishAbsorptance: number;
  parabolicDishOpticalEfficiency: number;
  parabolicDishThermalEfficiency: number;
  parabolicDishRimDiameter: number;
  parabolicDishLatusRectum: number;
  parabolicDishPoleHeight: number;
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
    this.wallUnfilledHeight = 0.5;
    this.wallEavesLength = 0.3;

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
    this.doorUValue = DEFAULT_DOOR_U_VALUE;
    this.doorOpacity = 1;
    this.doorVolumetricHeatCapacity = 0.5;

    this.windowWidth = 1;
    this.windowHeight = 1;
    this.windowColor = '#ffffff';
    this.windowTint = '#73D8FF';
    this.windowOpacity = 0.5;
    this.windowUValue = DEFAULT_WINDOW_U_VALUE;
    this.windowMullion = true;
    this.windowMullionWidth = 0.06;
    this.windowMullionSpacing = 0.5;
    this.windowMullionColor = '#ffffff';
    this.windowFrame = false;
    this.windowFrameWidth = 0.1;
    this.windowSillWidth = 0.2;
    this.windowType = WindowType.Default;
    this.windowArchHeight = 1;
    // I worry about this using Shutter objects may cause default to be accidentally overwritten.
    this.windowShutterLeft = defaultShutter.showLeft;
    this.windowShutterRight = defaultShutter.showRight;
    this.windowShutterColor = defaultShutter.color;
    this.windowShutterWidth = defaultShutter.width;

    this.solarPanelModelName = 'SPR-X21-335-BLK';
    this.solarPanelOrientation = Orientation.landscape;
    this.solarPanelPoleHeight = 1;
    this.solarPanelPoleSpacing = 3;
    this.solarPanelTiltAngle = 0;
    this.solarPanelRelativeAzimuth = 0;
    this.solarPanelFrameColor = '#ffffff';

    this.parabolicDishReflectance = 0.9;
    this.parabolicDishAbsorptance = 0.95;
    this.parabolicDishOpticalEfficiency = 0.7;
    this.parabolicDishThermalEfficiency = 0.3;
    this.parabolicDishRimDiameter = 4;
    this.parabolicDishLatusRectum = 8;
    this.parabolicDishPoleHeight = 0.2;
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
    this.heliostatWidth = 4;
    this.heliostatLength = 2;

    this.lightColor = '#ffff99';
    this.lightIntensity = 3;
    this.lightDistance = 5;
  }
}
