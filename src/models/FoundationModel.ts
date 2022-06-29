/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { FoundationTexture, SolarStructure } from '../types';
import { SolarUpdraftTowerModel } from './SolarUpdraftTowerModel';
import { SolarPowerTowerModel } from './SolarPowerTowerModel';
import { SolarAbsorberPipeModel } from './SolarAbsorberPipeModel';

export interface FoundationModel extends ElementModel {
  textureType: FoundationTexture;

  solarStructure?: SolarStructure;

  // tower for heliostats
  solarPowerTower?: SolarPowerTowerModel;

  // absorber pipe for Fresnel reflectors
  solarAbsorberPipe?: SolarAbsorberPipeModel;

  // solar updraft tower
  solarUpdraftTower?: SolarUpdraftTowerModel;

  // group master
  enableGroupMaster?: boolean;
}
