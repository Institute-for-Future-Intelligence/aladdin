/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { FlowerType, FoundationTexture, HumanName, TreeType } from '../types';

export interface ActionState {
  humanName: HumanName;

  flowerType: FlowerType;

  treeType: TreeType;

  foundationColor: string;
  foundationTexture: FoundationTexture;
}
