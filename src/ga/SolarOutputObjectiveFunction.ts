/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ObjectiveFunctionType } from '../types';
import { ObjectiveFunction } from './ObjectiveFunction';

export class SolarOutputObjectiveFunction extends ObjectiveFunction {
  constructor(type: ObjectiveFunctionType) {
    super();
    this.type = type;
  }

  compute(): number {
    let result = 0;
    switch (this.type) {
      case ObjectiveFunctionType.YEARLY_OUTPUT:
        break;
      default:
        break;
    }
    return result;
  }
}
