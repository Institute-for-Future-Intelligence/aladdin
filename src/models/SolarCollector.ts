/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';

export interface SolarCollector extends ElementModel {
  // although this is named as relativeAzimuth, it is positive in the counterclockwise direction.
  // this is opposite to azimuth which is positive in the clockwise direction.
  // note that the GUI has reversed the sign to be consistent with the convention of azimuth,
  // but we should not do that internally.
  relativeAzimuth: number; // in radian

  tiltAngle: number; // in radian
  poleHeight: number;
  poleRadius: number;
  drawSunBeam: boolean;
  dailyYield?: number;
  yearlyYield?: number;
}
