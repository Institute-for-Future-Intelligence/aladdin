/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

export interface SolarUpdraftTowerModel {
  chimneyHeight: number;
  chimneyRadius: number;

  collectorHeight: number;
  collectorRadius: number;

  dailyYield?: number;
  yearlyYield?: number;
}
