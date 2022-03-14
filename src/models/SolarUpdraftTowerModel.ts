/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

export interface SolarUpdraftTowerModel {
  chimneyHeight: number;
  chimneyRadius: number;

  collectorHeight: number;
  collectorRadius: number;

  // default to 0.9
  collectorTransmittance?: number;

  // usually taken to be from 0.65 to 0.70: https://en.wikipedia.org/wiki/Stack_effect
  dischargeCoefficient?: number;

  // 0.9, according to https://doi.org/10.1016/j.solener.2014.06.029
  turbineEfficiency?: number;

  dailyYield?: number;
  yearlyYield?: number;
}
