/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { immerable } from 'immer';
import { ActionState } from './ActionState';
import { CuboidTexture, FlowerType, FoundationTexture, HumanName, TreeType } from '../types';

export class DefaultActionState implements ActionState {
  // Needed for immer drafting to work properly: https://immerjs.github.io/immer/docs/complex-objects
  [immerable] = true;

  humanName: HumanName;

  flowerType: FlowerType;

  treeType: TreeType;
  treeSpread: number;
  treeHeight: number;

  foundationHeight: number;
  foundationColor: string;
  foundationTexture: FoundationTexture;

  cuboidHeight: number;
  cuboidFaceColors: string[];
  cuboidFaceTextures: CuboidTexture[];

  constructor() {
    this.humanName = HumanName.Jack;

    this.flowerType = FlowerType.YellowFlower;

    this.treeType = TreeType.Dogwood;
    this.treeSpread = 3;
    this.treeHeight = 4;

    this.foundationHeight = 0.1;
    this.foundationColor = 'gray';
    this.foundationTexture = FoundationTexture.NoTexture;

    this.cuboidHeight = 4;
    this.cuboidFaceColors = ['gray', 'gray', 'gray', 'gray', 'gray', 'gray'];
    this.cuboidFaceTextures = [
      CuboidTexture.NoTexture,
      CuboidTexture.NoTexture,
      CuboidTexture.NoTexture,
      CuboidTexture.NoTexture,
      CuboidTexture.NoTexture,
      CuboidTexture.NoTexture,
    ];
  }
}
