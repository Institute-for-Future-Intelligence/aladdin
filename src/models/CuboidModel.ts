/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { CuboidTexture } from '../types';

export interface CuboidModel extends ElementModel {
  textureTypes?: CuboidTexture[];
  faceColors?: string[]; // if defined, these colors supersede the color attribute
}
