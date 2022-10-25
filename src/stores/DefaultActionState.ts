/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { immerable } from 'immer';
import { ActionState } from './ActionState';
import { FlowerType, FoundationTexture, HumanName, TreeType } from '../types';

export class DefaultActionState implements ActionState {
  // Needed for immer drafting to work properly: https://immerjs.github.io/immer/docs/complex-objects
  [immerable] = true;

  humanName: HumanName;

  flowerType: FlowerType;

  treeType: TreeType;

  foundationColor: string;
  foundationTexture: FoundationTexture;

  constructor() {
    this.humanName = HumanName.Jack;

    this.flowerType = FlowerType.YellowFlower;

    this.treeType = TreeType.Dogwood;

    this.foundationColor = 'gray';
    this.foundationTexture = FoundationTexture.NoTexture;
  }
}
