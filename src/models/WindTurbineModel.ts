/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';

export interface WindTurbineModel extends ElementModel {
  speed: number; // revolutions per minute (typically 10-20)
  initialRotorAngle: number;
  relativeAngle: number; // in radian
  bladeRadius: number;
  towerRadius: number;
  towerHeight: number;
}
