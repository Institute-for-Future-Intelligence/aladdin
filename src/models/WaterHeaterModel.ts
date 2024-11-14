/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ObjectType } from 'src/types';
import { SolarCollector } from './SolarCollector';

export interface WaterHeaterModel extends SolarCollector {
  parentType: ObjectType;
  waterTankRadius: number;
}
