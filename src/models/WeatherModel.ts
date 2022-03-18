/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

export interface WeatherModel {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation: number;
  highestTemperatureTimeInMinutes: number;
  lowestTemperatures: number[];
  highestTemperatures: number[];
  sunshineHours: number[];
}
