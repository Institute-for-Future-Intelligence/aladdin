/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { FoundationTexture, SolarReceiver } from '../types';

export interface FoundationModel extends ElementModel {
  textureType: FoundationTexture;
  solarReceiver?: SolarReceiver;
  solarReceiverTubeRadius?: number;
  solarReceiverTubeRelativeLength?: number;
  solarReceiverTubeMountHeight?: number;
  solarReceiverTubePoleNumber?: number;
}
