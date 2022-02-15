/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

export class SunMinutes {
  sunrise: number; // sunrise time in minutes from midnight
  sunset: number; // sunset time in minutes from midnight

  constructor(sunrise: number, sunset: number) {
    this.sunrise = sunrise;
    this.sunset = sunset;
  }

  daylight() {
    return this.sunset - this.sunrise;
  }
}
