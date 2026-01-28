/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { ObjectType } from 'src/types';
import { ElementModel } from './ElementModel';
import { Point2 } from './Point2';

export interface PrismModel extends ElementModel {
  vertices: Point2[]; // [x, y] coordinates of the polygon vertices relative to center
  height?: number; // height of the cuboid (defaults to lz if not specified)
  color?: string; // color of the cuboid
  transparency?: number; // transparency value (0-1)
}
