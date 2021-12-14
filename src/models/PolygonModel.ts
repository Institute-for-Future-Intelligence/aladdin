/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { Point2 } from './Point2';

export interface PolygonModel extends ElementModel {
  vertices: Point2[];
  filled: boolean;
  selectedIndex: number;
}
