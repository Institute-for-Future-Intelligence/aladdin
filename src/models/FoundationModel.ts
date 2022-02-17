/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { FoundationTexture, SolarReceiver } from '../types';

export interface FoundationModel extends ElementModel {
  textureType: FoundationTexture;
  solarReceiver?: SolarReceiver;

  // tube receiver for Fresnel reflectors
  solarReceiverTubeRadius?: number;
  solarReceiverTubeRelativeLength?: number;
  solarReceiverTubeMountHeight?: number;
  solarReceiverTubePoleNumber?: number;
  solarReceiverTubeAbsorptance?: number; // the percentage of energy absorbed by the receiver tube
  solarReceiverTubeOpticalEfficiency?: number;
  solarReceiverTubeThermalEfficiency?: number;
}
