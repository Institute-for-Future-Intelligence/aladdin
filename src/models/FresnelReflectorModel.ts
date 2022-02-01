/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { SolarCollector } from './SolarCollector';

export interface FresnelReflectorModel extends SolarCollector {
  // a number in (0, 1), iron glass has a reflectance of 0.9
  // (but dirt and dust reduce it to 0.82, this is accounted for by Atmosphere)
  reflectance: number;
  // the percentage of the effective reflection area on the heliostat surface
  // (since it is modeled as a whole plate, this factor deducts the areas of gaps, frames, etc.)
  opticalEfficiency: number;
  moduleLength: number;
  moduleWidth: number;
}
