/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { immerable } from 'immer';
import { ActionState } from './ActionState';
import { FlowerType, HumanName, TreeType } from '../types';

export class DefaultActionState implements ActionState {
  // Needed for immer drafting to work properly: https://immerjs.github.io/immer/docs/complex-objects
  [immerable] = true;

  humanName: HumanName;
  flowerType: FlowerType;
  treeType: TreeType;

  constructor() {
    this.humanName = HumanName.Jack;
    this.flowerType = FlowerType.YellowFlower;
    this.treeType = TreeType.Dogwood;
  }

  static resetActionState(actionState: ActionState) {
    actionState.humanName = HumanName.Jack;
    actionState.flowerType = FlowerType.YellowFlower;
    actionState.treeType = TreeType.Dogwood;
  }
}
