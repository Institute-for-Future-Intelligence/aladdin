/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';

export interface SolarCollector extends ElementModel {
  relativeAzimuth: number; // in radian
  tiltAngle: number; // in radian
  poleHeight: number;
  poleRadius: number;
  drawSunBeam: boolean;
  dailyYield?: number;
  yearlyYield?: number;
}
