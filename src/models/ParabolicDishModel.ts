/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ConcentratedSolarPowerCollector } from './ConcentratedSolarPowerCollector';

export interface ParabolicDishModel extends ConcentratedSolarPowerCollector {
  // parabola y = x^2/4f, latus rectum p = 4f, f is the focal parameter
  latusRectum: number;

  structureType: number;

  receiverRadius: number;

  receiverPoleRadius: number;
}
