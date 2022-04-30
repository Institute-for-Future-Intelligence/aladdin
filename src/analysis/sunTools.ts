/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Vector3 } from 'three';
import { Util } from '../Util';
import { AirMass, ASHRAE_C, SOLAR_CONSTANT } from './analysisConstants';
import { GroundModel } from '../models/GroundModel';
import { TWO_PI, UNIT_VECTOR_POS_Z } from '../constants';
import { SunMinutes } from './SunMinutes';

export const TILT_ANGLE = (23.45 / 180.0) * Math.PI;

const DAY_MILLISECONDS = 1000 * 60 * 60 * 24;
const HALF_DAY_MINUTES = 720;

export const computeDeclinationAngle = (date: Date) => {
  const days = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / DAY_MILLISECONDS);
  return TILT_ANGLE * Math.sin((TWO_PI * (284 + days)) / Util.daysInYear(date));
};

// https://en.wikipedia.org/wiki/Sunrise_equation
// from sunrise to noon and from noon to sunset have the same minutes
export const computeSunriseAndSunsetInMinutes = (date: Date, latitude: number) => {
  const a = Math.tan(Util.toRadians(latitude)) * Math.tan(computeDeclinationAngle(date));
  if (Math.abs(a) > 1) {
    return new SunMinutes(0, a > 0 ? HALF_DAY_MINUTES * 2 : 0);
  }
  const b = (60 * Math.acos(-a)) / Util.toRadians(15);
  return new SunMinutes(HALF_DAY_MINUTES - b, HALF_DAY_MINUTES + b);
};

export const computeHourAngle = (date: Date) => {
  const minutes = date.getHours() * 60 + date.getMinutes() - HALF_DAY_MINUTES;
  return (minutes / HALF_DAY_MINUTES) * Math.PI;
};

export const computeHourAngleAtMinute = (minutes: number) => {
  return (minutes / HALF_DAY_MINUTES - 1) * Math.PI;
};

export const getSunDirection = (date: Date, latitude: number) => {
  return computeSunLocation(
    1,
    computeHourAngle(date),
    computeDeclinationAngle(date),
    Util.toRadians(latitude),
  ).normalize();
};

export const computeSunLocation = (radius: number, hourAngle: number, declinationAngle: number, latitude: number) => {
  const cosDec = Math.cos(declinationAngle);
  const sinDec = Math.sin(declinationAngle);
  const cosLat = Math.cos(latitude);
  const sinLat = Math.sin(latitude);
  const cosHou = Math.cos(hourAngle);
  const sinHou = Math.sin(hourAngle);
  const altitudeAngle = Math.asin(sinDec * sinLat + cosDec * cosHou * cosLat);
  const xAzm = sinHou * cosDec;
  const yAzm = cosLat * sinDec - cosHou * cosDec * sinLat;
  const azimuthAngle = Math.atan2(yAzm, xAzm);
  const coords = new Vector3(radius, azimuthAngle, altitudeAngle);
  Util.sphericalToCartesianZ(coords);
  // reverse the x so that sun moves from east to west
  coords.x = -coords.x;
  return coords;
};

// Solar radiation incident outside the earth's atmosphere is called extraterrestrial radiation, in kW.
// https://pvpmc.sandia.gov/modeling-steps/1-weather-design-inputs/irradiance-and-insolation-2/extraterrestrial-radiation/
const getExtraterrestrialRadiation = (dayOfYear: number) => {
  const b = (TWO_PI * dayOfYear) / 365;
  const er =
    1.00011 + 0.034221 * Math.cos(b) + 0.00128 * Math.sin(b) + 0.000719 * Math.cos(2 * b) + 0.000077 * Math.sin(2 * b);
  return SOLAR_CONSTANT * er;
};

// air mass calculation from http://en.wikipedia.org/wiki/Air_mass_(solar_energy)#At_higher_altitudes
const computeAirMass = (airMassType: AirMass, sunDirection: Vector3, altitude: number) => {
  let zenithAngle;
  switch (airMassType) {
    case AirMass.NONE:
      return 1;
    case AirMass.KASTEN_YOUNG:
      zenithAngle = sunDirection.angleTo(UNIT_VECTOR_POS_Z);
      return 1 / (Math.cos(zenithAngle) + 0.50572 * Math.pow(96.07995 - (zenithAngle / Math.PI) * 180, -1.6364));
    default:
      zenithAngle = sunDirection.angleTo(UNIT_VECTOR_POS_Z);
      const cos = Math.cos(zenithAngle);
      const r = 708;
      const c = altitude / 9000;
      return Math.sqrt((r + c) * (r + c) * cos * cos + (2 * r + 1 + c) * (1 - c)) - (r + c) * cos;
  }
};

// Reused peak solar radiation value. Must be called once and only once before
// calling calculateDirectRadiation and calculateDiffusionAndReflection, the unit is in kW
export const calculatePeakRadiation = (
  sunDirection: Vector3,
  dayOfYear: number,
  altitude: number,
  airMassType: AirMass,
) => {
  // don't use the 1.1 prefactor as we consider diffuse radiation in the ASHRAE model
  return (
    getExtraterrestrialRadiation(dayOfYear) *
    Math.pow(0.7, Math.pow(computeAirMass(airMassType, sunDirection, altitude), 0.678))
  );
};

// see: http://www.physics.arizona.edu/~cronin/Solar/References/Irradiance%20Models%20and%20Data/WOC01.pdf
export const calculateDiffuseAndReflectedRadiation = (
  ground: GroundModel,
  month: number,
  normal: Vector3,
  peakRadiation: number,
) => {
  let result = 0;
  const cos = normal.dot(UNIT_VECTOR_POS_Z);
  const viewFactorWithSky = 0.5 * (1 + cos);
  if (viewFactorWithSky > 0) {
    // diffuse irradiance from the sky
    result += ASHRAE_C[month] * viewFactorWithSky * peakRadiation;
  }
  // if a surface faces down, it should receive ground reflection as well
  const viewFactorWithGround = 0.5 * Math.abs(1 - cos);
  if (!Util.isZero(viewFactorWithGround)) {
    // short-wave reflection from the ground
    result += ground.albedo * viewFactorWithGround * peakRadiation;
  }
  return result;
};
