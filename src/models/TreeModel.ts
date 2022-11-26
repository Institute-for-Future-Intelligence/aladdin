/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { TreeType } from '../types';

export interface TreeModel extends ElementModel {
  name: TreeType;
  showModel: boolean;
  flip?: boolean; // used to flip the billboard horizontally so a tree can face a different direction
}
