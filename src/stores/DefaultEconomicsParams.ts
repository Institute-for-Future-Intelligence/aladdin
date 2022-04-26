/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { EconomicsParams } from './EconomicsParams';

export class DefaultEconomicsParams implements EconomicsParams {
  projectLifeSpan: number;
  electricitySellingPrice: number;
  operationalCostPerUnit: number;

  constructor() {
    this.projectLifeSpan = 25;
    this.electricitySellingPrice = 0.25; // US dollars per kWh
    this.operationalCostPerUnit = 0.15; // US dollars per day
  }
}
