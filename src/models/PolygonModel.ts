/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { Point2 } from './Point2';
import { LineStyle, ObjectType, PolygonTexture } from '../types';

export interface PolygonModel extends ElementModel {
  vertices: Point2[]; // positions relative to the parent
  filled: boolean;
  noOutline: boolean;
  opacity: number;
  textureType: PolygonTexture;
  selectedIndex: number;
  lineStyle: LineStyle;
  parentType?: ObjectType;
  text?: string;
  fontSize?: number;
  fontColor?: string;
}
