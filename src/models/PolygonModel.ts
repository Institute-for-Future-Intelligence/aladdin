/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { Point2 } from './Point2';
import { PolygonTexture } from '../types';

export interface PolygonModel extends ElementModel {
  vertices: Point2[]; // positions relative to the parent
  filled: boolean;
  opacity: number;
  textureType: PolygonTexture;
  selectedIndex: number;
}
