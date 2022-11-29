/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
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

  roofColor: string;
  roofSideColor: string;
  roofTexture: RoofTexture;
  roofThickness: number;
  roofOverhang: number;
  roofStructure: RoofStructure;
  roofGlassOpacity: number;
  roofGlassTint: string;
  roofRafterWidth: number;
  roofRafterSpacing: number;
  roofRafterColor: string;
  roofRValue: number;

  doorColor: string;
  doorTexture: DoorTexture;
  doorType: DoorType;
  doorArchHeight: number;
  doorFilled: boolean;
  doorUValue: number;

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
    this.foundationColor = 'gray';
    this.foundationTexture = FoundationTexture.NoTexture;

    this.cuboidHeight = 4;
    this.cuboidFaceColors = ['gray', 'gray', 'gray', 'gray', 'gray', 'gray'];
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
    this.wallColor = 'white';
    this.wallTexture = WallTexture.Default;
    this.wallStructure = WallStructure.Default;
    this.wallStructureSpacing = 2;
    this.wallStructureWidth = 0.1;
    this.wallStructureColor = 'white';
    this.wallOpacity = 0.5;
    this.wallRValue = 2;

    this.roofColor = '#454769';
    this.roofSideColor = 'white';
    this.roofTexture = RoofTexture.Default;
    this.roofThickness = 0.2;
    this.roofOverhang = 0.3;
    this.roofStructure = RoofStructure.Default;
    this.roofGlassOpacity = 0.5;
    this.roofGlassTint = '#73D8FF';
    this.roofRafterWidth = 0.1;
    this.roofRafterSpacing = 1;
    this.roofRafterColor = 'white';
    this.roofRValue = 2;

    this.doorColor = 'white';
    this.doorTexture = DoorTexture.Default;
    this.doorType = DoorType.Default;
    this.doorArchHeight = 1;
    this.doorFilled = true;
    this.doorUValue = 1;

    this.windowWidth = 1;
    this.windowHeight = 1;
    this.windowColor = 'white';
    this.windowTint = '#73D8FF';
    this.windowOpacity = 0.5;
    this.windowUValue = 2;
    this.windowMullion = true;
    this.windowMullionWidth = 0.06;
    this.windowMullionSpacing = 0.5;
    this.windowMullionColor = 'white';
    this.windowFrame = false;
    this.windowFrameWidth = 0.1;
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
    this.solarPanelFrameColor = 'white';

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
