/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Vector3 } from 'three';
import { ElementModel } from './ElementModel';
import { WallSide } from 'src/types';
import { WindowModel } from './WindowModel';

export interface WallModel extends ElementModel {
  relativeAngle: number;
  leftPoint: Vector3;
  rightPoint: Vector3;
  leftJoints: JointProps[];
  rightJoints: JointProps[];
  windows: WindowModel[];
  leftOffset?: number;
  rightOffset?: number;
}

export interface JointProps {
  id: string;
  side: WallSide;
}
