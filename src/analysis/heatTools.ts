/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {OMEGA_DAY} from "./analysisConstants";

// interpolate between the lowest and highest temperatures of the day
// to get the temperature of a given minute in the day
export const getOutsideTemperatureAtMinute = (hi: number, lo: number, minute: number) => {
    return 0.5 * (hi + lo) - 0.5 * (hi - lo) * Math.cos(OMEGA_DAY * minute);
}
