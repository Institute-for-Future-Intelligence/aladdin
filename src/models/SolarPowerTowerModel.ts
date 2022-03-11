/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

export interface SolarPowerTowerModel {
  towerRadius: number;
  towerHeight: number;

  receiverRadius: number;
  receiverHeight: number;
  receiverAbsorptance: number;
  receiverOpticalEfficiency: number;
  receiverThermalEfficiency: number;
}
