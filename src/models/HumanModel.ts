/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { HumanName } from '../types';

export interface HumanModel extends ElementModel {
  name: HumanName;
}
