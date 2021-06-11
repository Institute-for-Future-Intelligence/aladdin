/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import create from 'zustand';
import {devtools, persist} from 'zustand/middleware';
import produce, {enableMapSet} from 'immer';
import {WorldModel} from "../models/worldModel";
import {Vector3} from "three";
import {ElementModel} from "../models/elementModel";
import {WeatherModel} from "../models/weatherModel";
import weather from '../resources/weather.csv';
import Papa from "papaparse";
import {Util} from "../util";

enableMapSet();

export interface CommonStoreState {
    set: (fn: (state: CommonStoreState) => void) => void;
    worlds: { [key: string]: WorldModel };
    createNewWorld: () => void;
    getWorld: (name: string) => WorldModel;

    showGroundPanel: boolean;
    showHeliodonPanel: boolean;
    showWeatherPanel: boolean;

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
    date: string;

    weatherData: { [key: string]: WeatherModel };
    getWeather: (location: string) => WeatherModel;
    loadWeatherData: () => void;
    getClosestCity: (lat: number, lng: number) => string | null;

    clickObjectType: string | null;

}

export const useStore = create<CommonStoreState>(devtools(persist((
    set,
    get,
    api,
) => {

    const immerSet: CommonStoreState['set'] = fn => set(produce(fn));

    return {

        set: immerSet,

        showGroundPanel: false,
        showHeliodonPanel: false,
        showWeatherPanel: false,

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
        date: new Date(2021, 5, 22, 12).toString(),
        weatherData: {},

        clickObjectType: null,

        worlds: {},
        getWorld(name: string) {
            return get().worlds[name];
        },
        createNewWorld() {
            immerSet((state: CommonStoreState) => {
                const elements: ElementModel[] = [];
                const e1 = {type: 'Foundation', cx: 0, cy: 0, lx: 1, ly: 2, height: 0.1, id: 'f1'};
                const e2 = {type: 'Foundation', cx: 0, cy: 2, lx: 2, ly: 2, height: 0.2, id: 'f2'};
                elements.push(e1);
                elements.push(e2);
                const world = {
                    name: 'default',
                    elements: elements,
                    cameraPosition: new Vector3(0, 0, 5)
                };
                state.worlds[world.name] = world;
            })
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

