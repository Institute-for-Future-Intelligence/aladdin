/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { WallSide, WallTexture } from 'src/types';

export interface WallModel extends ElementModel {
  relativeAngle: number;
  leftPoint: number[];
  rightPoint: number[];
  leftJoints: JointProps[];
  rightJoints: JointProps[];
  textureType: WallTexture;
  leftOffset?: number;
  rightOffset?: number;
}

export interface JointProps {
  id: string;
  side: WallSide;
}
