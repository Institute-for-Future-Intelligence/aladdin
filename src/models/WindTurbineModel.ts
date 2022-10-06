/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';

export interface WindTurbineModel extends ElementModel {
  bladeRadius: number;
  towerRadius: number;
  towerHeight: number;
}
