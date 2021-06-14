/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {SensorModel} from "../models/sensorModel";
import {
    calculateDiffuseAndReflectedRadiation,
    calculatePeakRadiation,
    getSunDirection
} from "./sunTools";
import {Vector3} from "three";
import {WeatherModel} from "../models/weatherModel";
import {DatumEntry} from "../types";
import {MONTHS} from "../constants";
import {AirMass} from "./analysisConstants";
import {Util} from "../util";
import {GroundModel} from "../models/groundModel";

const TIMES_PER_HOUR = 4; // how many times an hour
const INTERVAL = 60 / TIMES_PER_HOUR;

export const computeDailyData = (sensor: SensorModel,
                                 weather: WeatherModel,
                                 ground: GroundModel,
                                 lat: number,
                                 lng: number,
                                 altitude: number,
                                 date: Date) => {

    const normal = new Vector3(0, 0, 1);

    let total = 0;
    let count = 0;

    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < TIMES_PER_HOUR; j++) {
            const cur = new Date(date.getFullYear(), date.getMonth(), date.getDate(), i, j * INTERVAL);
            const sunDirection = getSunDirection(cur, lat);
            if (sunDirection.z > 0) {
                // when the sun is out
                count++;
                const peakRadiation = calculatePeakRadiation(sunDirection, Util.dayOfYear(cur), altitude, AirMass.SPHERE_MODEL);
                const dot = normal.dot(sunDirection);
                if (dot > 0) {
                    // direct radiation
                    total += dot * peakRadiation;
                }
                // indirect radiation
                total += calculateDiffuseAndReflectedRadiation(ground, date.getMonth(), normal, peakRadiation);
            }
        }
    }
    const daylight = count * INTERVAL / 60;
    const clearness = weather.sunshineHours[date.getMonth()] / (30 * daylight);
    total *= clearness; // apply clearness
    total /= TIMES_PER_HOUR; // convert the unit of timeStep from minute to hour so that we get kWh

    return {
        Month: MONTHS[date.getMonth()],
        Daylight: daylight,
        Clearness: clearness * 100,
        Radiation: total
    } as DatumEntry;

};

export const computeHourlyData = (sensor: SensorModel,
                                  weather: WeatherModel,
                                  ground: GroundModel,
                                  lat: number,
                                  lng: number,
                                  altitude: number,
                                  date: Date) => {

    const normal = new Vector3(0, 0, 1);

    const result = new Array(24).fill(0);
    let count = 0;

    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < TIMES_PER_HOUR; j++) {
            const cur = new Date(date.getFullYear(), date.getMonth(), date.getDate(), i, j * INTERVAL);
            const sunDirection = getSunDirection(cur, lat);
            if (sunDirection.z > 0) {
                // when the sun is out
                count++;
                const peakRadiation = calculatePeakRadiation(sunDirection, Util.dayOfYear(cur), altitude, AirMass.SPHERE_MODEL);
                const dot = normal.dot(sunDirection);
                if (dot > 0) {
                    // direct radiation
                    result[i] += dot * peakRadiation;
                }
                // indirect radiation
                result[i] += calculateDiffuseAndReflectedRadiation(ground, date.getMonth(), normal, peakRadiation);
            }
        }
    }

    const daylight = count * INTERVAL / 60;
    const clearness = weather.sunshineHours[date.getMonth()] / (30 * daylight);

    // apply clearness andconvert the unit of timeStep from minute to hour so that we get kWh
    const data = [];
    for (let i = 0; i < 24; i++) {
        data.push({Hour: i, Radiation: result[i] * clearness / TIMES_PER_HOUR} as DatumEntry);
    }
    return data;

};
