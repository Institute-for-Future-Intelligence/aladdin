/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { CuboidTexture } from '../types';

export interface CuboidModel extends ElementModel {
  textureType: CuboidTexture;
  faceColors?: string[]; // if defined, these colors supercede the color attribute
}
