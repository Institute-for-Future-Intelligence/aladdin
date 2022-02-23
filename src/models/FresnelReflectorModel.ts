/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ConcentratedSolarPowerCollector } from './ConcentratedSolarPowerCollector';

export interface FresnelReflectorModel extends ConcentratedSolarPowerCollector {
  // lx is the width, ly is the module length multiplied by the number of modules
  moduleLength: number;

  // the ID of the receiver foundation, if not set, use its parent
  receiverId: string;
}
