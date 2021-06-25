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
import {Util} from "../Util";
import {DatumEntry, MoveHandleType, ObjectType, ResizeHandleType} from "../types";
import {DefaultWorldModel} from "./DefaultWorldModel";
import {Vector2, Vector3} from "three";
import {ElementModelCloner} from "../models/ElementModelCloner";
import {HumanModel} from "../models/humanModel";
import {TreeModel} from "../models/treeModel";
import {SensorModel} from "../models/sensorModel";
import {FoundationModel} from "../models/foundationModel";
import {CuboidModel} from "../models/cuboidModel";

enableMapSet();

export interface CommonStoreState {
    set: (fn: (state: CommonStoreState) => void) => void;
    world: WorldModel;
    elements: ElementModel[];

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
    shadowEnabled: boolean;
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
    clickObjectType: ObjectType | null;
    moveHandleType: MoveHandleType | null;
    resizeHandleType: ResizeHandleType | null;
    resizeAnchor: Vector2;
    getSelectedElement: () => ElementModel | null;
    getElementById: (id: string) => ElementModel | null;
    selectNone: () => void;
    updateElementById: (id: string, element: Partial<ElementModel>) => void;
    setElementPosition: (id: string, x: number, y: number, z?: number) => void;
    setElementRotation: (id: string, x: number, y: number, z: number) => void;
    setElementSize: (id: string, lx: number, ly: number, lz?: number) => void;

    pastePoint: Vector3;
    elementToPaste: ElementModel | null;
    copyElementById: (id: string) => void;
    cutElementById: (id: string) => void;
    pasteElement: () => void;

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
    const defaultWorldModel = new DefaultWorldModel();
    const defaultElements = defaultWorldModel.getElements();

    return {

        set: immerSet,
        world: defaultWorldModel,
        elements: defaultElements,

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
        shadowEnabled: true,

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
        moveHandleType: null,
        resizeHandleType: null,
        resizeAnchor: new Vector2(),

        getSelectedElement() {
            const elements = get().elements;
            for (const e of elements) {
                if (e.selected) {
                    return e;
                }
            }
            return null;
        },
        getElementById(id: string) {
            const elements = get().elements;
            for (const e of elements) {
                if (e.id === id) {
                    return e;
                }
            }
            return null;
        },
        selectNone() {
            immerSet((state: CommonStoreState) => {
                for (const e of state.elements) {
                    e.selected = false;
                }
            });
        },
        updateElementById(id, newProps) {
            immerSet((state: CommonStoreState) => {
                for (let [i, e] of state.elements.entries()) {
                    if (e.id === id) {
                        state.elements[i] = {...e, ...newProps};
                        break;
                    }
                }
            });
        },
        setElementPosition(id, x, y, z?) {
            immerSet((state: CommonStoreState) => {
                for (let [i, e] of state.elements.entries()) {
                    if (e.id === id) {
                        state.elements[i].cx = x;
                        state.elements[i].cy = y;
                        if (z) {
                            state.elements[i].cz = z;
                        }
                        break;
                    }
                }
            });
        },
        setElementRotation(id, x, y, z) {
            immerSet((state: CommonStoreState) => {
                for (let [i, e] of state.elements.entries()) {
                    if (e.id === id) {
                        state.elements[i].rotation[0] = x;
                        state.elements[i].rotation[1] = y;
                        state.elements[i].rotation[2] = z;
                        break;
                    }
                }
            });
        },
        setElementSize(id, lx, ly, lz?) {
            immerSet((state: CommonStoreState) => {
                for (let [i, e] of state.elements.entries()) {
                    if (e.id === id) {
                        state.elements[i].lx = lx;
                        state.elements[i].ly = ly;
                        if (lz) {
                            state.elements[i].lz = lz;
                        }
                        break;
                    }
                }
            });
        },

        elementToPaste: null,
        pastePoint: new Vector3(),
        copyElementById(id) {
            immerSet((state: CommonStoreState) => {
                for (const e of state.elements) {
                    if (e.id === id) {
                        state.elementToPaste = e;
                        break;
                    }
                }
            });
        },
        cutElementById(id) {
            immerSet((state: CommonStoreState) => {
                for (const e of state.elements) {
                    if (e.id === id) {
                        Util.deleteElement(state.elements, e);
                        state.elementToPaste = e;
                        break;
                    }
                }
            });
        },
        pasteElement() {
            immerSet((state: CommonStoreState) => {
                if (state.elementToPaste) {
                    switch (state.elementToPaste.type) {
                        case ObjectType.Human:
                            state.elements.push(ElementModelCloner.cloneHuman(
                                state.elementToPaste as HumanModel, state.pastePoint.x, -state.pastePoint.z, state.pastePoint.y));
                            break;
                        case ObjectType.Tree:
                            state.elements.push(ElementModelCloner.cloneTree(
                                state.elementToPaste as TreeModel, state.pastePoint.x, -state.pastePoint.z, state.pastePoint.y));
                            break;
                        case ObjectType.Sensor:
                            state.elements.push(ElementModelCloner.cloneSensor(
                                state.elementToPaste as SensorModel, state.pastePoint.x, -state.pastePoint.z, state.pastePoint.y));
                            break;
                        case ObjectType.Foundation:
                            state.elements.push(ElementModelCloner.cloneFoundation(
                                state.elementToPaste as FoundationModel, state.pastePoint.x, -state.pastePoint.z));
                            break;
                        case ObjectType.Cuboid:
                            state.elements.push(ElementModelCloner.cloneCuboid(
                                state.elementToPaste as CuboidModel, state.pastePoint.x, -state.pastePoint.z));
                            break;
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

