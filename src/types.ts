/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

export interface GraphDatumEntry {
    [key: string]: number | undefined;
}

export enum WeatherDataType {
    HourlyTemperatures = 0,
    MonthlyTemperatures = 1,
    SunshineHours = 2,
}

export enum Theme {
    Default = 'Default',
    Desert = 'Desert',
    Grassland = 'Grassland',
}

export enum ClickObjectType {
    Sky = 'Sky',
    Ground = 'Ground',
}
