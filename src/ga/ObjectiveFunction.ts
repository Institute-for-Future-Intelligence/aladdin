/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ObjectiveFunctionType } from '../types';

export abstract class ObjectiveFunction {
  abstract compute(): number;

  type: ObjectiveFunctionType = ObjectiveFunctionType.DAILY;

  cancelled: boolean = false;

  cancel(): void {
    this.cancelled = true;
  }
}
