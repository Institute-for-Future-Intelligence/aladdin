/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { FlowerType } from '../types';

export interface FlowerModel extends ElementModel {
  name: FlowerType;
}
