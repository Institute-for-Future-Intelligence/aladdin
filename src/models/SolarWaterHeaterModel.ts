/*
 * @Copyright 2024. Institute for Future Intelligence, Inc.
 */

import { ObjectType } from 'src/types';
import { SolarCollector } from './SolarCollector';

export interface SolarWaterHeaterModel extends SolarCollector {
  parentType: ObjectType;
  waterTankRadius: number;
}
