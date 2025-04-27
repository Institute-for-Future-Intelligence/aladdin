/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
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

  notBuilding?: boolean;
  invisible?: boolean;

  enableSlope?: boolean;
  slope?: number;

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

export interface BuildingParts {
  foundationModel: FoundationModel;
}
