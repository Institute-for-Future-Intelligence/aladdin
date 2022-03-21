/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

export interface SolarUpdraftTowerModel {
  chimneyHeight: number;
  chimneyRadius: number;

  collectorHeight: number;
  collectorRadius: number;

  // transmissivity is the ratio of the total light that passes through the glass, default to 0.9
  // (don't use transmittance, which is the measured ratio of light at normal incidence)
  collectorTransmissivity?: number;

  // the emissivity of the surface of a material is its effectiveness in emitting energy as thermal radiation.
  // the default value is 0.95
  collectorEmissivity?: number;

  // usually taken to be from 0.65 to 0.70: https://en.wikipedia.org/wiki/Stack_effect
  dischargeCoefficient?: number;

  // 0.9, according to https://doi.org/10.1016/j.solener.2014.06.029
  turbineEfficiency?: number;

  dailyYield?: number;
  yearlyYield?: number;
}
