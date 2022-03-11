/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

export interface SolarAbsorberPipeModel {
  absorberHeight: number;
  apertureWidth: number;
  relativeLength: number;
  poleNumber: number;

  absorberAbsorptance: number;
  absorberOpticalEfficiency: number;
  absorberThermalEfficiency: number;
}
