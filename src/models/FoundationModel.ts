/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { FoundationTexture, SolarReceiver } from '../types';

export interface FoundationModel extends ElementModel {
  textureType: FoundationTexture;

  solarReceiver?: SolarReceiver;
  solarReceiverAbsorptance?: number; // the percentage of energy absorbed by the receiver
  solarReceiverOpticalEfficiency?: number;
  solarReceiverThermalEfficiency?: number;
  solarReceiverApertureWidth?: number;
  solarReceiverHeight?: number;

  // tube receiver for Fresnel reflectors
  solarReceiverTubeRelativeLength?: number;
  solarReceiverTubePoleNumber?: number;
}
