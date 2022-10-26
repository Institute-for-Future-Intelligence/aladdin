/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { CuboidTexture, FlowerType, FoundationTexture, HumanName, Orientation, TreeType, WallTexture } from '../types';
import { WallStructure } from '../models/WallModel';

export interface ActionState {
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

  solarPanelModelName: string;
  solarPanelOrientation: Orientation;
  solarPanelPoleHeight: number;
  solarPanelPoleSpacing: number;
  solarPanelTiltAngle: number;
  solarPanelRelativeAzimuth: number;
}
