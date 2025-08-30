/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { ObjectType } from 'src/types';

export interface SensorModel extends ElementModel {
  lit?: boolean;
  parentType?: ObjectType;
}
