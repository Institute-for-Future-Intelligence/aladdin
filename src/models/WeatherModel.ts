/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

export interface WeatherModel {

    city: string;
    country: string;
    latitude: number;
    longitude: number;
    elevation: number;
    lowestTemperatures: number[];
    highestTemperatures: number[];
    sunshineHours: number[];

}
