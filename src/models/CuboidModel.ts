/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { CuboidTexture } from '../types';
import { Groupable } from './Groupable';
import { Stackable } from './Stackable';

export interface CuboidModel extends ElementModel, Groupable, Stackable {
  textureTypes?: CuboidTexture[];
  faceColors?: string[]; // if defined, these colors supersede the color attribute
  transparency?: number;
  instanced?: boolean;
}
