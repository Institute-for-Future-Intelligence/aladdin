/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from './ElementModel';
import { FoundationTexture, SolarStructure } from '../types';
import { SolarUpdraftTowerModel } from './SolarUpdraftTowerModel';
import { SolarPowerTowerModel } from './SolarPowerTowerModel';
import { SolarAbsorberPipeModel } from './SolarAbsorberPipeModel';
import { HvacSystem } from './HvacSystem';
import { Groupable } from './Groupable';

export interface FoundationModel extends ElementModel, Groupable {
  textureType: FoundationTexture;

  solarStructure?: SolarStructure;

  // tower for heliostats
  solarPowerTower?: SolarPowerTowerModel;

  // absorber pipe for Fresnel reflectors
  solarAbsorberPipe?: SolarAbsorberPipeModel;

  // solar updraft tower
  solarUpdraftTower?: SolarUpdraftTowerModel;

  // these apply only to the portion that are within a building
  rValue: number;
  volumetricHeatCapacity: number;
  hvacSystem: HvacSystem;
}
