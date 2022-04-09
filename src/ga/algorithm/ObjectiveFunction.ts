/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { ObjectiveFunctionType } from '../../types';

export abstract class ObjectiveFunction {
  type: ObjectiveFunctionType = ObjectiveFunctionType.DAILY_OUTPUT;

  abstract compute(): number;
}
