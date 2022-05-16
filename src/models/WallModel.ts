/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { WallTexture } from 'src/types';

export interface WallModel extends ElementModel {
  // using ly as wall thickness
  relativeAngle: number;
  leftPoint: number[];
  rightPoint: number[];
  leftJoints: string[];
  rightJoints: string[];
  textureType: WallTexture;

  roofId?: string | null;
  leftRoofHeight?: number;
  rightRoofHeight?: number;
  centerRoofHeight?: number[]; // [x, h];
  centerLeftRoofHeight?: number[]; // [x, h];
  centerRightRoofHeight?: number[]; // [x, h];
}
