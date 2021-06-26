/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

export interface ViewState {

    axes: boolean;
    shadowEnabled: boolean;
    theme: string;
    heliodon: boolean;
    groundImage: boolean;
    groundColor: string;

    showGroundPanel: boolean;
    showHeliodonPanel: boolean;
    showWeatherPanel: boolean;
    showDailyLightSensorPanel: boolean;
    showYearlyLightSensorPanel: boolean;
    autoRotate: boolean;

    mapZoom: number;
    mapType: string;
    mapTilt: number;
    mapWeatherStations: boolean;

}
