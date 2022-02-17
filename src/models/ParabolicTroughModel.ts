/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ParabolicCollector } from './ParabolicCollector';

export interface ParabolicTroughModel extends ParabolicCollector {
  // lx is the aperture width, ly is the module length multiplied by the number of modules
  moduleLength: number;

  absorberTubeRadius: number;
}
