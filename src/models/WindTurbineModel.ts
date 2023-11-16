/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';

export interface WindTurbineModel extends ElementModel {
  speed: number; // revolutions per minute (typically 10-20)
  maximumChordRadius: number;
  maximumChordLength: number;
  initialRotorAngle: number; // in radian
  relativeAngle: number; // in radian
  pitchAngle: number; // in radian
  hubRadius: number;
  hubLength: number;
  bladeRadius: number;
  bladeTipWidth: number;
  bladeRootRadius: number;
  towerRadius: number;
  towerHeight: number;
}
