/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

// in kW/m^2, see http://en.wikipedia.org/wiki/Solar_constant
export const SOLAR_CONSTANT = 1.361;

// in m/s^2
export const GRAVITATIONAL_ACCELERATION = 9.8067;

// in J/(kg*K) https://www.engineeringtoolbox.com/air-specific-heat-capacity-d_705.html
export const AIR_ISOBARIC_SPECIFIC_HEAT = 1012;

// in kg/m^3 (at 101.325 kPa and 15 °C)
export const AIR_DENSITY = 1.225;

export const KWH_TO_JOULE = 3600000;

export const JOULE_TO_KWH = 1 / KWH_TO_JOULE;

// 0 °C in K
export const KELVIN_AT_ZERO_CELSIUS = 273.15;

// in W/(m^2*K^4) Stefan–Boltzmann constant
export const STEFAN_BOLTZMANN_CONSTANT = 5.67e-8;

// original ASHRAE_C = [0.058, 0.060, 0.071, 0.097, 0.121, 0.134, 0.136, 0.122, 0.092, 0.073, 0.063, 0.057];
// http://www.physics.arizona.edu/~cronin/Solar/References/Irradiance%20Models%20and%20Data/WOC01.pdf
// revised C coefficients found from Iqbal's book
export const ASHRAE_C = [0.103, 0.104, 0.109, 0.12, 0.13, 0.137, 0.138, 0.134, 0.121, 0.111, 0.106, 0.103];

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
