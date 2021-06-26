/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {ViewState} from "../views/ViewState";

export class DefaultViewState implements ViewState {

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

    constructor() {

        this.axes = true;
        this.shadowEnabled = true;
        this.theme = 'Default';
        this.heliodon = false;
        this.groundImage = false;
        this.groundColor = 'forestgreen';

        this.showGroundPanel = false;
        this.showHeliodonPanel = false;
        this.showWeatherPanel = false;
        this.showDailyLightSensorPanel = false;
        this.showYearlyLightSensorPanel = false;
        this.autoRotate = false;

        this.mapZoom = 16;
        this.mapType = 'roadmap';
        this.mapTilt = 0;
        this.mapWeatherStations = false;

    }

}
