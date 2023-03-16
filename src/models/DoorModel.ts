/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { DoorTexture } from 'src/types';
import { ElementModel } from './ElementModel';

export interface DoorModel extends ElementModel {
  uValue: number;
  volumetricHeatCapacity: number;
  textureType: DoorTexture;
  doorType: DoorType;

  archHeight: number;
  filled: boolean;
  opacity?: number;
  frameColor?: string;
}

export enum DoorType {
  Default = 'Default',
  Arched = 'Arched',
}
