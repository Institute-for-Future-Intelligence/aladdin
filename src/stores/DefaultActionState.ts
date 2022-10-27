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
  TreeType,
  WallTexture,
} from '../types';
import { WallStructure } from '../models/WallModel';
import { defaultShutter } from '../views/window/window';

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
  wallStudSpacing: number;
  wallStudWidth: number;
  wallStudColor: string;
  wallOpacity: number;

  doorColor: string;
  doorTexture: DoorTexture;

  windowColor: string;
  windowTint: string;
  windowOpacity: number;
  windowMullion: boolean;
  windowMullionWidth: number;
  windowMullionSpacing: number;
  windowMullionColor: string;
  windowShutterLeft: boolean;
  windowShutterRight: boolean;
  windowShutterColor: string;
  windowShutterWidth: number;

  solarPanelModelName: string;
  solarPanelOrientation: Orientation;
  solarPanelPoleHeight: number;
  solarPanelPoleSpacing: number;
  solarPanelTiltAngle: number;
  solarPanelRelativeAzimuth: number;

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
    this.wallStudSpacing = 2;
    this.wallStudWidth = 0.1;
    this.wallStudColor = 'white';
    this.wallOpacity = 0.5;

    this.doorColor = 'white';
    this.doorTexture = DoorTexture.Default;

    this.windowColor = 'white';
    this.windowTint = '#73D8FF';
    this.windowOpacity = 0.5;
    this.windowMullion = true;
    this.windowMullionWidth = 0.06;
    this.windowMullionSpacing = 0.5;
    this.windowMullionColor = 'white';
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
  }
}
