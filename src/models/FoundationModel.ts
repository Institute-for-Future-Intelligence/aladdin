/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { FoundationTexture } from '../types';

export interface FoundationModel extends ElementModel {
  textureType: FoundationTexture;
}
