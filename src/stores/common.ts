/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import create from 'zustand';
import {devtools, persist} from 'zustand/middleware';
import produce, {enableMapSet} from 'immer';
import {WorldModel} from "../models/worldModel";
import {ElementModel} from "../models/elementModel";
import {WeatherModel} from "../models/weatherModel";
import weather from '../resources/weather.csv';
import Papa from "papaparse";
import {Util} from "../util";
import {DatumEntry} from "../types";
import {DefaultWorldModel} from "./DefaultWorldModel";

enableMapSet();

export interface CommonStoreState {
    set: (fn: (state: CommonStoreState) => void) => void;
    world: WorldModel;

    showGroundPanel: boolean;
    showHeliodonPanel: boolean;
    showWeatherPanel: boolean;
    showDailyLightSensorPanel: boolean;
    showYearlyLightSensorPanel: boolean;
    autoRotate: boolean;

    grid: boolean;
    axes: boolean;
    groundImage: boolean;
    groundColor: string;
    theme: string;
    heliodon: boolean;
    address: string;
    latitude: number;
    longitude: number;
    mapZoom: number;
    mapType: string;
    mapTilt: number;
    mapWeatherStations: boolean;
    date: string;

    weatherData: { [key: string]: WeatherModel };
    getWeather: (location: string) => WeatherModel;
    loadWeatherData: () => void;
    getClosestCity: (lat: number, lng: number) => string | null;

    enableOrbitController: boolean;
    clickObjectType: string | null;
    getSelectedElement: () => ElementModel | null;
    getElementById: (id: string) => ElementModel | null;
    selectNone: () => void;
    updateElementById: (id: string, element: Partial<ElementModel>) => void;
    setElementPosition: (id: string, x: number, y: number, z: number) => void;

    timesPerHour: number;
    dailyLightSensorData: DatumEntry[];
    setDailyLightSensorData: (data: DatumEntry[]) => void;
    yearlyLightSensorData: DatumEntry[];
    setYearlyLightSensorData: (data: DatumEntry[]) => void;

}

export const useStore = create<CommonStoreState>(devtools(persist((
    set,
    get,
    api,
) => {

    const immerSet: CommonStoreState['set'] = fn => set(produce(fn));

    return {

        set: immerSet,
        world: new DefaultWorldModel(),

        showGroundPanel: false,
        showHeliodonPanel: false,
        showWeatherPanel: false,
        showDailyLightSensorPanel: false,
        showYearlyLightSensorPanel: false,
        autoRotate: false,

        grid: false,
        axes: true,
        groundImage: false,
        groundColor: 'forestgreen',
        theme: 'Default',
        heliodon: false,

        address: 'Natick, MA',
        latitude: 42.2844063,
        longitude: -71.3488548,
        mapZoom: 16,
        mapType: 'roadmap',
        mapTilt: 0,
        mapWeatherStations: false,
        date: new Date(2021, 5, 22, 12).toString(),
        weatherData: {},

        timesPerHour: 20, // how many times per hour to collect data

        yearlyLightSensorData: [],
        setYearlyLightSensorData(data) {
            immerSet((state: CommonStoreState) => {
                state.yearlyLightSensorData = [...data];
            });
        },
        dailyLightSensorData: [],
        setDailyLightSensorData(data) {
            immerSet((state: CommonStoreState) => {
                state.dailyLightSensorData = [...data];
            });
        },

        enableOrbitController: true,
        clickObjectType: null,
        getSelectedElement() {
            const elements = get().world?.elements;
            if (elements) {
                for (const e of elements) {
                    if (e.selected) {
                        return e;
                    }
                }
            }
            return null;
        },
        getElementById(id: string) {
            const elements = get().world?.elements;
            if (elements) {
                for (const e of elements) {
                    if (e.id === id) {
                        return e;
                    }
                }
            }
            return null;
        },
        selectNone() {
            immerSet((state: CommonStoreState) => {
                if (state.world) {
                    for (const e of state.world.elements) {
                        e.selected = false;
                    }
                }
            });
        },
        updateElementById(id, newProps) {
            immerSet((state: CommonStoreState) => {
                if (state.world) {
                    for (let [i, e] of state.world.elements.entries()) {
                        if (e.id === id) {
                            state.world.elements[i] = {...e, ...newProps};
                            break;
                        }
                    }
                }
            });
        },
        setElementPosition(id, x, y, z) {
            immerSet((state: CommonStoreState) => {
                const w = state.world;
                if (w) {
                    for (let [i, e] of w.elements.entries()) {
                        if (e.id === id) {
                            w.elements[i].cx = x;
                            w.elements[i].cy = y;
                            w.elements[i].cz = z;
                            break;
                        }
                    }
                }
            });
        },

        loadWeatherData() {
            const data: WeatherModel[] = [];
            Papa.parse(weather, {
                download: true,
                complete: function (results) {
                    for (const row of results.data) {
                        if (Array.isArray(row) && row.length > 1) {
                            const lows: number[] = [];
                            const highs: number[] = [];
                            const sun: number[] = [];
                            for (let i = 5; i < 29; i++) {
                                if ((i - 5) % 2 === 0) {
                                    lows.push(parseFloat(row[i].trim()));
                                } else {
                                    highs.push(parseFloat(row[i].trim()));
                                }
                            }
                            for (let i = 29; i < 41; i++) {
                                sun.push(parseFloat(row[i].trim()));
                            }
                            const wm = {
                                city: row[0].trim(),
                                country: row[1].trim(),
                                longitude: parseFloat(row[2].trim()),
                                latitude: parseFloat(row[3].trim()),
                                elevation: parseFloat(row[4].trim()),
                                lowestTemperatures: lows,
                                highestTemperatures: highs,
                                sunshineHours: sun
                            } as WeatherModel;
                            data.push(wm);
                        }
                    }
                    immerSet((state: CommonStoreState) => {
                        for (const row of data) {
                            state.weatherData[row.city + ', ' + row.country] = row;
                        }
                    });
                }
            });
        },
        getWeather(location: string) {
            return get().weatherData[location];
        },
        getClosestCity(lat: number, lng: number) {
            let min: number = Number.MAX_VALUE;
            let city = null;
            let distance: number;
            const wd = get().weatherData;
            for (const name in wd) {
                if (wd.hasOwnProperty(name)) {
                    distance = Util.getDistance(lng, lat, wd[name].longitude, wd[name].latitude);
                    if (distance < min) {
                        min = distance;
                        city = name;
                    }
                }
            }
            return city;
        }
    };
}, {name: 'aladdin-storage'})));

