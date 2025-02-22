/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';

export interface BatteryStorageModel extends ElementModel {
  connectedHvacIds?: string[];
  batteryId?: string;
}
