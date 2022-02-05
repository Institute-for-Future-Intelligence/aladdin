/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ConcentratedSolarPowerCollector } from './ConcentratedSolarPowerCollector';

export interface ParabolicTroughModel extends ConcentratedSolarPowerCollector {
  // lx is the aperture width, ly is the module length multiplied by the number of modules
  moduleLength: number;

  // parabola y = x^2/4f, latus rectum p = 4f, f is the focal parameter
  latusRectum: number;

  absorberTubeRadius: number;
}
