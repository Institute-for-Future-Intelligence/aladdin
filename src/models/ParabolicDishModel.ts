/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ConcentratedSolarPowerCollector } from './ConcentratedSolarPowerCollector';

export interface ParabolicDishModel extends ConcentratedSolarPowerCollector {
  rimRadius: number;
  focalLength: number;
  structureType: number;
}
