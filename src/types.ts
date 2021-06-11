/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

export interface GraphDatumEntry {
    [key: string]: number | undefined;
}

export enum WeatherDataType {
    hourlyTemperatures = 0,
    monthlyTemperatures = 1,
    sunshineHours = 2,
}

export enum Theme {
    default = 'Default',
    desert = 'Desert',
    grassland = 'Grassland',
}

export enum ClickObjectType {
    sky = 'Sky',
    ground = 'Ground',
}
