/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ObjectiveFunctionType } from '../types';
import { ObjectiveFunction } from './ObjectiveFunction';

export class SolarOutputObjectiveFunction extends ObjectiveFunction {
  SolarOutputObjectiveFunction(type: ObjectiveFunctionType) {
    this.type = type;
  }

  compute(): number {
    let result = 0;
    switch (this.type) {
      case ObjectiveFunctionType.YEARLY:
        break;
      default:
        break;
    }
    return result;
  }
}
