/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {SensorModel} from "../models/sensorModel";
import {getSunDirection} from "./sunTools";
import {Vector3} from "three";
import {WeatherModel} from "../models/weatherModel";
import {GraphDatumEntry} from "../types";

const TIMES_PER_HOUR = 4; // how many times an hour
const INTERVAL = 60 / TIMES_PER_HOUR;

export const computeDailyData = (sensor: SensorModel,
                                 weather: WeatherModel,
                                 lat: number,
                                 lng: number,
                                 date: Date) => {

    const normal = new Vector3(0, 0, 1);

    let total = 0;
    let count = 0;
    let noon = true;

    loop:
        for (let i = 12; i < 24; i++) {
            for (let j = 0; j < TIMES_PER_HOUR; j++) {
                const cur = new Date(date.getFullYear(), date.getMonth(), date.getDate(), i, j * INTERVAL);
                const sunDirection = getSunDirection(cur, lat);
                if (sunDirection.z < 0) break loop; // the sun has set, break the outer loop
                const rad = normal.dot(sunDirection);
                if (rad > 0) {
                    if (noon) { // avoid double counting at noon, which is the starting point
                        count += 0.5;
                        total += rad * 0.5;
                        noon = false;
                    } else {
                        count += 1;
                        total += rad;
                    }
                }
            }
        }
    const daylight = count * INTERVAL / 30;
    let sunshineHours = weather.sunshineHours[date.getMonth()] / 30;

    return {
        Month: date.getMonth(),
        Daylight: daylight,
        Clearness: (sunshineHours / daylight) * 100,
        Radiation: total * 2 * sunshineHours / daylight
    } as GraphDatumEntry;

};
