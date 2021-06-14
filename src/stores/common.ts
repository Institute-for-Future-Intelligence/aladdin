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
import {DatumEntry, ObjectType} from "../types";
import {FoundationModel} from "../models/foundationModel";
import {CuboidModel} from "../models/cuboidModel";
import {SensorModel} from "../models/sensorModel";

enableMapSet();

export interface CommonStoreState {
    set: (fn: (state: CommonStoreState) => void) => void;
    worlds: { [key: string]: WorldModel };
    createNewWorld: () => void;
    getWorld: (name: string) => WorldModel;

    showGroundPanel: boolean;
    showHeliodonPanel: boolean;
    showWeatherPanel: boolean;
    showDailyLightSensorPanel: boolean;
    showYearlyLightSensorPanel: boolean;

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

    clickObjectType: string | null;
    getSelectedElement: () => ElementModel | null;
    selectNone: () => void;
    updateElementById: (id: string, element: Partial<ElementModel>) => void;

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

        showGroundPanel: false,
        showHeliodonPanel: false,
        showWeatherPanel: false,
        showDailyLightSensorPanel: false,
        showYearlyLightSensorPanel: false,

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

        worlds: {},
        getWorld(name: string) {
            return get().worlds[name];
        },
        createNewWorld() {
            immerSet((state: CommonStoreState) => {
                const elements: ElementModel[] = [];
                const e1 = {
                    type: ObjectType.Foundation,
                    cx: 0,
                    cy: 0,
                    lx: 2,
                    ly: 2,
                    height: 0.1,
                    id: 'f1'
                } as FoundationModel;
                const e2 = {
                    type: ObjectType.Cuboid,
                    cx: 0,
                    cy: 3,
                    lx: 2,
                    ly: 2,
                    height: 4,
                    id: 'c1'
                } as CuboidModel;
                const e3 = {
                    type: ObjectType.Sensor,
                    cx: 2,
                    cy: 2,
                    lx: 0.05,
                    ly: 0.05,
                    height: 0.01,
                    id: 's1',
                    showLabel: false,
                    light: true,
                    heatFlux: false
                } as SensorModel;
                elements.push(e1);
                elements.push(e2);
                elements.push(e3);
                const ground = {
                    albedo: 0.3,
                    thermalDiffusivity: 0.05,
                    snowReflectionFactors: new Array(12).fill(0)
                };
                const world = {
                    name: 'default',
                    elements: elements,
                    ground: ground,
                    cameraPosition: new Vector3(0, 0, 5)
                };
                state.worlds[world.name] = world;
            })
        },

        clickObjectType: null,
        getSelectedElement() {
            const elements = get().worlds['default'].elements;
            for (const e of elements) {
                if (e.selected) {
                    return e;
                }
            }
            return null;
        },
        selectNone() {
            immerSet((state: CommonStoreState) => {
                const w = state.worlds['default'];
                if (w) {
                    for (const e of w.elements) {
                        e.selected = false;
                    }
                }
            });
        },
        updateElementById(id, newProps) {
            immerSet((state: CommonStoreState) => {
                const w = state.worlds['default'];
                if (w) {
                    for (let [i, e] of w.elements.entries()) {
                        if (e.id === id) {
                            w.elements[i] = {...e, ...newProps};
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

