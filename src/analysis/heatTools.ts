/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {OMEGA_DAY} from "./analysisConstants";
import {Util} from "../Util";

// interpolate between the lowest and highest temperatures of the day
// to get the temperature of a given minute in the day
export const getOutsideTemperatureAtMinute = (hi: number, lo: number, minute: number) => {
    return 0.5 * (hi + lo) - 0.5 * (hi - lo) * Math.cos(OMEGA_DAY * minute);
}

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
    if (dayInMonth < halfOfCurrentMonth) { // use previous month
        month1 = currentMonth - 1;
        if (month1 < 0) {
            month1 = 11;
        }
        month2 = currentMonth;
        const halfOfPreviousMonth = Util.daysOfMonth(month1, currentYear) / 2;
        const length = halfOfPreviousMonth + halfOfCurrentMonth;
        weight = (dayInMonth + halfOfPreviousMonth) / length;
    } else { // use next month
        month1 = currentMonth;
        month2 = currentMonth + 1
        if (month2 > 11) {
            month2 = 0;
        }
        const halfOfNextMonth = Util.daysOfMonth(month2, currentYear) / 2;
        const length = halfOfCurrentMonth + halfOfNextMonth;
        weight = (dayInMonth - halfOfCurrentMonth) / length;
    }

    const min = los[month1] + (los[month2] - los[month1]) * weight;
    const max = his[month1] + (his[month2] - his[month1]) * weight;

    return {low: min, high: max};

}
