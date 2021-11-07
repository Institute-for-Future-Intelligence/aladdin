/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';

export interface RoofModel extends ElementModel {
  points: RoofPoint[];
}

export interface RoofPoint {
  x: number;
  y: number;
}
