/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ConcentratedSolarPowerCollector } from './ConcentratedSolarPowerCollector';

export interface FresnelReflectorModel extends ConcentratedSolarPowerCollector {
  moduleLength: number;
}
