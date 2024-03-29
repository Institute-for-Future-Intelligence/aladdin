/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

export interface GroundModel {
  albedo: number;

  // the larger the thermal diffusivity is, the more the ground temperature is affected by air temperature, unit: m^2/s
  thermalDiffusivity: number;

  snowReflectionFactors: number[];
}
