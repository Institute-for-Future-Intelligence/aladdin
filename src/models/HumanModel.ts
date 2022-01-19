/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { HumanName } from '../types';

export interface HumanModel extends ElementModel {
  name: HumanName;
  observer: boolean; // used to view solar fields for visibility assessment
}
