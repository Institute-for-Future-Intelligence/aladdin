/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { EconomicsParams } from './EconomicsParams';
import { immerable } from 'immer';

export class DefaultEconomicsParams implements EconomicsParams {
  // Needed for immer drafting to work properly: https://immerjs.github.io/immer/docs/complex-objects
  [immerable] = true;

  projectLifeSpan: number;
  electricitySellingPrice: number;
  operationalCostPerUnit: number;

  constructor() {
    this.projectLifeSpan = 25;
    this.electricitySellingPrice = 0.25; // US dollars per kWh
    this.operationalCostPerUnit = 0.15; // US dollars per day
  }
}
