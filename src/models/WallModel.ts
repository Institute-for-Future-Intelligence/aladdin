/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Vector3 } from 'three';
import { ElementModel } from './ElementModel';

export interface WallModel extends ElementModel {
  relativeAngle: number;
  startPoint?: Vector3;
  endPoint?: Vector3;
}
