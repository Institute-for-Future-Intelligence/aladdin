/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {SensorModel} from "../models/sensorModel";
import {getSunDirection} from "./sunTools";
import {Vector3} from "three";

export const computeDailyData = (sensor: SensorModel,
                                 lat: number,
                                 lng: number,
                                 date: Date) => {

    //const sunDirection = getSunDirection(date, lat);
    //const normal = new Vector3(0, 0, 1);

    return [6, 5, 4].sort();

};
