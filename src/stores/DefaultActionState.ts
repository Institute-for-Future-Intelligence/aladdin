/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { immerable } from 'immer';
import { ActionState } from './ActionState';
import { CuboidTexture, FlowerType, FoundationTexture, HumanName, Orientation, TreeType, WallTexture } from '../types';
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

  windowColor: string;
  windowTint: string;
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

    this.windowColor = 'white';
    this.windowTint = '#73D8FF';
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
  }
}
