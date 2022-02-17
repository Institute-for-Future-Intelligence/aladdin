/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { SolarCollector } from './SolarCollector';

export interface ConcentratedSolarPowerCollector extends SolarCollector {
  // a number in (0, 1), iron glass has a reflectance of 0.9
  // (but dirt and dust reduce it to 0.82, this is accounted for by Atmosphere)
  reflectance: number;
}
