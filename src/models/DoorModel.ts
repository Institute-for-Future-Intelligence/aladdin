/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { DoorTexture } from 'src/types';
import { ElementModel } from './ElementModel';

export interface DoorModel extends ElementModel {
  uValue: number;
  textureType: DoorTexture;
  doorType: DoorType;

  archHeight: number;
  filled: boolean;
}

export enum DoorType {
  Default = 'Default',
  Arched = 'Arched',
}
