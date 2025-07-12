/*
 * @Copyright 2022-2025. Institute for Future Intelligence, Inc.
 */

export interface HvacSystem {
  /*
   If an ID is defined, the HVAC systems on different foundations can be grouped into a single one
   for heat transfer calculation.
  */
  id?: string;

  thermostatSetpoint: number; // legacy, for backward compatability
  heatingSetpoint?: number;
  coolingSetpoint?: number;

  // https://en.wikipedia.org/wiki/Coefficient_of_performance
  coefficientOfPerformanceAC?: number;

  /*
   If the lowest temperature of the day is this degree below the thermostat setpoint,
   then we assume no heating is needed as the heat absorbed during the day can be slowly released
   such that the inside temperature of a house will never fall below the setpoint.
   The same logic can be applied to the case of cooling as well.
   */
  temperatureThreshold: number;

  type?: 'Simple' | 'Programmable';
  thermostatSetpoints?: TimedSetpoint[];
}

export interface TimedSetpoint {
  time: number;
  heat: number;
  cool: number;
}
