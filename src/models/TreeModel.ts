/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { TreeType } from '../types';

export interface TreeModel extends ElementModel {
  name: TreeType;
  evergreen: boolean;
  showModel: boolean;
}
