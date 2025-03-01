/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';

export interface BatteryStorageModel extends ElementModel {
  connectedHvacIds?: string[];
  editableId?: string;
  energyDensity: number;
  chargingEfficiency: number; // [0, 1] dimensionless
  dischargingEfficiency: number; // [0, 1] dimensionless
}
