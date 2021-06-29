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

    heliodonPanelX: number;
    heliodonPanelY: number;
    groundPanelX: number;
    groundPanelY: number;
    weatherPanelX: number;
    weatherPanelY: number;
    dailyLightSensorPanelX: number;
    dailyLightSensorPanelY: number;
    yearlyLightSensorPanelX: number;
    yearlyLightSensorPanelY: number;

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

        this.heliodonPanelX = 0;
        this.heliodonPanelY = 0;
        this.groundPanelX = 0;
        this.groundPanelY = 0;
        this.weatherPanelX = 0;
        this.weatherPanelY = 0;
        this.dailyLightSensorPanelX = 0;
        this.dailyLightSensorPanelY = 0;
        this.yearlyLightSensorPanelX = 0;
        this.yearlyLightSensorPanelY = 0;

        this.mapZoom = 16;
        this.mapType = 'roadmap';
        this.mapTilt = 0;
        this.mapWeatherStations = false;

    }

}
