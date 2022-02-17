/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ParabolicCollector } from './ParabolicCollector';

export interface ParabolicDishModel extends ParabolicCollector {
  structureType: number;

  receiverRadius: number;

  receiverPoleRadius: number;
}
