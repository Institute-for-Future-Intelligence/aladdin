/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { DoorTexture } from 'src/types';
import { ElementModel } from './ElementModel';

export interface DoorModel extends ElementModel {
  uValue: number;
  airPermeability?: number;
  volumetricHeatCapacity: number;
  textureType: DoorTexture;
  doorType: DoorType;

  archHeight: number;
  filled: boolean;
  frameless?: boolean;
  opacity?: number;
  frameColor?: string;

  // Is this door inside a building? If yes, this will be no heat exchange. By default, it is not.
  interior?: boolean;
}

export enum DoorType {
  Default = 'Default',
  Arched = 'Arched',
}
