/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ObjectiveFunctionType } from '../types';

export abstract class ObjectiveFunction {
  type: ObjectiveFunctionType = ObjectiveFunctionType.DAILY;

  cancelled: boolean = false;

  abstract compute(): number;

  cancel(): void {
    this.cancelled = true;
  }
}
