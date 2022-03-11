/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { FoundationTexture, SolarStructure } from '../types';
import { SolarUpdraftTowerModel } from './SolarUpdraftTowerModel';

export interface FoundationModel extends ElementModel {
  textureType: FoundationTexture;

  solarStructure?: SolarStructure;

  // solar receiver (CSP pipe or tower)
  solarReceiverAbsorptance?: number; // the percentage of energy absorbed by the receiver
  solarReceiverOpticalEfficiency?: number;
  solarReceiverThermalEfficiency?: number;
  solarReceiverApertureWidth?: number;
  solarReceiverHeight?: number;

  // tower for heliostats
  solarTowerRadius?: number;
  solarTowerCentralReceiverRadius?: number;
  solarTowerCentralReceiverHeight?: number;

  // pipe receiver for Fresnel reflectors
  solarReceiverPipeRelativeLength?: number;
  solarReceiverPipePoleNumber?: number;

  // solar updraft tower
  solarUpdraftTower?: SolarUpdraftTowerModel;
}
