/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

// in kW, see http://en.wikipedia.org/wiki/Solar_constant
export const SOLAR_CONSTANT = 1.361;

// original ASHRAE_C = [0.058, 0.060, 0.071, 0.097, 0.121, 0.134, 0.136, 0.122, 0.092, 0.073, 0.063, 0.057];
// http://www.physics.arizona.edu/~cronin/Solar/References/Irradiance%20Models%20and%20Data/WOC01.pdf
// revised C coefficients found from Iqbal's book
export const ASHRAE_C = [
  0.103, 0.104, 0.109, 0.12, 0.13, 0.137, 0.138, 0.134, 0.121, 0.111, 0.106, 0.103,
];

export enum AirMass {
  NONE = 0,
  KASTEN_YOUNG = 1,
  SPHERE_MODEL = 2,
}

export const MINUTES_OF_DAY = 1440;

// the daily cycle is 1440 minutes
export const OMEGA_DAY = Math.PI / 720;

// the annual cycle is 365 days
export const OMEGA_YEAR = Math.PI / 182.5;

export const YEARLY_LAG_IN_DAYS = 30;

export const DAILY_LAG_IN_MINUTES = 120;
