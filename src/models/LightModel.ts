/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ObjectType } from 'src/types';
import { ElementModel } from './ElementModel';

export interface LightModel extends ElementModel {
  intensity: number;
  distance: number;
  decay: number;
  inside: boolean;
  parentType?: ObjectType;
}
