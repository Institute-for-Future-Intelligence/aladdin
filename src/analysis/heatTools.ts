/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { DAILY_LAG_IN_MINUTES, MINUTES_OF_DAY, OMEGA_DAY, OMEGA_YEAR, YEARLY_LAG_IN_DAYS } from './analysisConstants';
import { Util } from '../Util';
import { SunMinutes } from './SunMinutes';
import { BuildingCompletionStatus, DiurnalTemperatureModel, ObjectType } from '../types';
import { ElementModel } from '../models/ElementModel';
import { FoundationModel } from '../models/FoundationModel';

export enum CheckStatus {
  NO_BUILDING = 3,
  AT_LEAST_ONE_BAD_NO_GOOD = 2,
  AT_LEAST_ONE_BAD_AT_LEAST_ONE_GOOD = 1,
  OK = 0,
}

export interface CheckResult {
  status: CheckStatus;
  buildingCompletion?: BuildingCompletionStatus;
}

export const U_VALUE_OPENING = 50;

export const checkBuilding = (
  elements: ElementModel[],
  countElementsByType: Function,
  getChildrenOfType: Function,
): CheckResult => {
  const foundationCount = countElementsByType(ObjectType.Foundation);
  if (foundationCount === 0) return { status: CheckStatus.NO_BUILDING } as CheckResult;
  let atLeastOneGood = false;
  let atLeastOneBad = false;
  let errorType = undefined;
  for (const e of elements) {
    if (e.type === ObjectType.Foundation) {
      const f = e as FoundationModel;
      const walls = getChildrenOfType(ObjectType.Wall, f.id);
      if (walls.length > 0) {
        const completionStatus = Util.getBuildingCompletionStatus(f, elements);
        if (completionStatus === BuildingCompletionStatus.COMPLETE) {
          atLeastOneGood = true;
        } else {
          atLeastOneBad = true;
          errorType = completionStatus;
        }
      } else {
        atLeastOneBad = true;
      }
    }
  }
  if (atLeastOneBad && !atLeastOneGood)
    return { status: CheckStatus.AT_LEAST_ONE_BAD_NO_GOOD, buildingCompletion: errorType } as CheckResult;
  if (atLeastOneBad && atLeastOneGood) return { status: CheckStatus.AT_LEAST_ONE_BAD_AT_LEAST_ONE_GOOD } as CheckResult;
  return { status: CheckStatus.OK } as CheckResult;
};

// use the darkness of color to approximate light absorption
export const getLightAbsorption = (element: ElementModel) => {
  if (!element.color) return 0.5;
  // catch some common cases
  const lc = element.color.toLowerCase();
  if (lc === 'white') return 0.05;
  if (lc === 'black') return 0.95;
  const bigint = parseInt(element.color.substring(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  let min = Math.min(r, g);
  min = Math.min(min, b);
  let max = Math.max(r, g);
  max = Math.max(max, b);
  return Math.min(0.95, Math.max(0.05, 1 - (min + max) / 510));
};

/*
 If the lowest outside temperature is higher than the threshold, don't turn on the heater.
 If the highest outside temperature is lower than the threshold, don't turn on the air conditioner.
*/
export const adjustEnergyUsage = (
  outsideTemperatureRange: { high: number; low: number },
  heatExchange: number,
  setpoint: number,
  threshold: number,
) => {
  if (
    (heatExchange < 0 && outsideTemperatureRange.low >= setpoint - threshold) ||
    (heatExchange > 0 && outsideTemperatureRange.high <= setpoint + threshold)
  ) {
    return 0;
  }
  // negative heat exchange goes to heater, positive heat exchange goes to air conditioner
  return heatExchange;
};

// interpolate between the lowest and highest temperatures of the day
// to get the temperature of a given minute in the day
export const getOutsideTemperatureAtMinute = (
  hi: number,
  lo: number,
  model: DiurnalTemperatureModel,
  highestTemperatureTimeInMinutes: number,
  sunMinutes: SunMinutes,
  minute: number,
) => {
  if (model === DiurnalTemperatureModel.Sinusoidal) {
    return 0.5 * (hi + lo) - 0.5 * (hi - lo) * Math.cos(OMEGA_DAY * (minute - (highestTemperatureTimeInMinutes - 720)));
  }
  const mean = 0.5 * (hi + lo);
  const ampl = 0.5 * (hi - lo);
  const day = sunMinutes.daylight();
  // day time
  if (minute > sunMinutes.sunrise && minute < sunMinutes.sunset) {
    return mean + ampl * Math.cos((Math.PI / day) * (minute - highestTemperatureTimeInMinutes));
  }
  const night = MINUTES_OF_DAY - day;
  const temperatureAtSunset =
    mean + ampl * Math.cos((Math.PI / day) * (sunMinutes.sunset - highestTemperatureTimeInMinutes));
  const b = 6;
  // after sunset
  if (minute > sunMinutes.sunset) {
    const minutesAfterSunset = minute - sunMinutes.sunset;
    return lo + (temperatureAtSunset - lo) * Math.exp((-b * minutesAfterSunset) / night);
  }
  // before sunrise
  const minutesAfterSunset = minute + 23 * 60 - sunMinutes.sunset;
  return lo + (temperatureAtSunset - lo) * Math.exp((-b * minutesAfterSunset) / night);
};

// we only know the average lowest and highest temperatures of the months. So we have to interpolate between these monthly data to get the daily data.
export const computeOutsideTemperature = (day: Date, los: number[], his: number[]) => {
  const currentYear = day.getFullYear();
  const currentMonth = day.getMonth();
  const dayInMonth = day.getDate();
  const daysOfCurrentMonth = Util.daysOfMonth(currentMonth, currentYear);
  const halfOfCurrentMonth = daysOfCurrentMonth / 2;

  // interpolate the temperatures
  let month1: number;
  let month2: number;
  let weight;
  if (dayInMonth < halfOfCurrentMonth) {
    // use previous month
    month1 = currentMonth - 1;
    if (month1 < 0) {
      month1 = 11;
    }
    month2 = currentMonth;
    const halfOfPreviousMonth = Util.daysOfMonth(month1, currentYear) / 2;
    const length = halfOfPreviousMonth + halfOfCurrentMonth;
    weight = (dayInMonth + halfOfPreviousMonth) / length;
  } else {
    // use next month
    month1 = currentMonth;
    month2 = currentMonth + 1;
    if (month2 > 11) {
      month2 = 0;
    }
    const halfOfNextMonth = Util.daysOfMonth(month2, currentYear) / 2;
    const length = halfOfCurrentMonth + halfOfNextMonth;
    weight = (dayInMonth - halfOfCurrentMonth) / length;
  }

  const min = los[month1] + (los[month2] - los[month1]) * weight;
  const max = his[month1] + (his[month2] - his[month1]) * weight;

  return { low: min, high: max };
};

// calculate the average ground temperature of a given day using the Kusuda formula:
// http://soilphysics.okstate.edu/software/SoilTemperature/document.pdf
export const calculateTemperatureOnDay = (
  latitude: number,
  day: number,
  los: number[],
  his: number[],
  thermalDiffusivity: number,
  depth: number,
): number => {
  const n = los.length;
  let average = 0;
  let hiMax = -1000,
    hiMin = 1000,
    loMax = -1000,
    loMin = 1000;
  for (let i = 0; i < n; i++) {
    average += his[i] + los[i];
    if (hiMax < his[i]) {
      hiMax = his[i];
    }
    if (loMax < los[i]) {
      loMax = los[i];
    }
    if (hiMin > his[i]) {
      hiMin = his[i];
    }
    if (loMin > los[i]) {
      loMin = los[i];
    }
  }
  average /= 2 * n;
  const amplitude = 0.25 * (hiMax - hiMin + loMax - loMin);
  const d2 = depth * Math.sqrt(OMEGA_YEAR / (2.0 * thermalDiffusivity));
  if (latitude > 0) {
    return average - amplitude * Math.exp(-d2) * Math.cos(OMEGA_YEAR * (day - YEARLY_LAG_IN_DAYS) - d2);
  }
  return average - amplitude * Math.exp(-d2) * Math.cos(Math.PI + OMEGA_YEAR * (day - YEARLY_LAG_IN_DAYS) - d2);
};

export const getGroundTemperatureAtMinute = (
  latitude: number,
  day: number,
  minute: number,
  los: number[],
  his: number[],
  highestTemperatureTimeInMinutes: number,
  airTemperatureFluctuationAmplitudeOfDay: number,
  thermalDiffusivity: number,
  depth: number,
): number => {
  return (
    calculateTemperatureOnDay(latitude, day, los, his, thermalDiffusivity, depth) -
    Math.exp(-depth * Math.sqrt(OMEGA_DAY / (2.0 * thermalDiffusivity))) *
      airTemperatureFluctuationAmplitudeOfDay *
      Math.cos(OMEGA_DAY * (minute - (highestTemperatureTimeInMinutes - 720) - DAILY_LAG_IN_MINUTES))
  );
};
