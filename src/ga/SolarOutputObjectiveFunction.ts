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
        result = Math.random(); // TODO: dummy function for testing
        break;
      default:
        result = Math.random(); // TODO: dummy function for testing
        break;
    }
    return result;
  }
}
