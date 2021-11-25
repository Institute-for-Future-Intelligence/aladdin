/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { WallTexture } from 'src/types';

export interface WallModel extends ElementModel {
  thickness: number;
  relativeAngle: number;
  leftPoint: number[];
  rightPoint: number[];
  leftJoints: string[];
  rightJoints: string[];
  textureType: WallTexture;
  leftOffset: number;
  rightOffset: number;
}
