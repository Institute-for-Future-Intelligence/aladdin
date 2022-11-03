/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';

export interface LightModel extends ElementModel {
  intensity: number;
  distance: number;
  decay: number;
  inside: boolean;
}
