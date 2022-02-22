/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ConcentratedSolarPowerCollector } from './ConcentratedSolarPowerCollector';

export interface HeliostatModel extends ConcentratedSolarPowerCollector {
  towerId: string; // the ID of the tower foundation, if not set, use its parent
}
