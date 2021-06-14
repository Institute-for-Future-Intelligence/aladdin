/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {SensorModel} from "../models/sensorModel";
import {
    calculateDiffuseAndReflectedRadiation,
    calculateDirectRadiation,
    calculatePeakRadiation,
    getSunDirection
} from "./sunTools";
import {Vector3} from "three";
import {WeatherModel} from "../models/weatherModel";
import {GraphDatumEntry} from "../types";
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

    const normal = new Vector3(0, -1, 0);

    let total = 0;
    let count = 0;
    let noon = true;

    loop:
        for (let i = 12; i < 24; i++) {
            for (let j = 0; j < TIMES_PER_HOUR; j++) {
                const cur = new Date(date.getFullYear(), date.getMonth(), date.getDate(), i, j * INTERVAL);
                const sunDirection = getSunDirection(cur, lat);
                if (sunDirection.z < 0) break loop; // the sun has set, break the outer loop
                const peakRadiation = calculatePeakRadiation(sunDirection, Util.dayOfYear(cur), altitude, AirMass.KASTEN_YOUNG);
                // avoid double counting at noon, which is the starting point
                count += noon ? 0.5 : 1;
                const dot = normal.dot(sunDirection);
                let directRadiation = 0;
                if (dot > 0) {
                    directRadiation = calculateDirectRadiation(sunDirection, normal, peakRadiation);
                    // avoid double counting at noon, which is the starting point
                    total += noon ? directRadiation * 0.5 : directRadiation;
                }
                const indirectRadiation = calculateDiffuseAndReflectedRadiation(ground, date.getMonth(), normal, peakRadiation);
                total += indirectRadiation;
                if (noon) noon = false;
            }
        }
    const daylight = count * INTERVAL / 30;
    let clearness = weather.sunshineHours[date.getMonth()] / (30 * daylight);
    total *= 2;// double it because we only calculate half day above
    total *= clearness; // apply clearness
    total /= TIMES_PER_HOUR; // convert the unit of timeStep from minute to hour so that we get kWh

    return {
        Month: MONTHS[date.getMonth()],
        Daylight: daylight,
        Clearness: clearness * 100,
        Radiation: total
    } as GraphDatumEntry;

};
