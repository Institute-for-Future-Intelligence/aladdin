/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { immerable } from 'immer';
import { ActionState } from './ActionState';
import { HumanName } from '../types';

export class DefaultActionState implements ActionState {
  // Needed for immer drafting to work properly: https://immerjs.github.io/immer/docs/complex-objects
  [immerable] = true;

  humanName: HumanName;

  constructor() {
    this.humanName = HumanName.Jack;
  }

  static resetActionState(actionState: ActionState) {
    actionState.humanName = HumanName.Jack;
  }
}
