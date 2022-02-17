/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ConcentratedSolarPowerCollector } from './ConcentratedSolarPowerCollector';

export interface ParabolicCollector extends ConcentratedSolarPowerCollector {
  // parabola y = x^2/4f, latus rectum p = 4f, f is the focal parameter
  latusRectum: number;

  // the percentage of energy absorbed by the receiver
  absorptance: number;

  // the percentage of the effective reflection area
  // (since it is modeled as a whole plate, this factor deducts the areas of gaps, frames, etc.)
  opticalEfficiency: number;

  thermalEfficiency: number;
}
