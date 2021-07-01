/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import create from 'zustand';
import {devtools, persist} from 'zustand/middleware';
import produce, {enableMapSet} from 'immer';
import {WorldModel} from "../models/WorldModel";
import {ElementModel} from "../models/ElementModel";
import {WeatherModel} from "../models/WeatherModel";
import weather from '../resources/weather.csv';
import Papa from "papaparse";
import {Util} from "../Util";
import {DatumEntry, MoveHandleType, ObjectType, ResizeHandleType, User} from "../types";
import {DefaultWorldModel} from "./DefaultWorldModel";
import {Box3, Vector2, Vector3} from "three";
import {ElementModelCloner} from "../models/ElementModelCloner";
import {HumanModel} from "../models/HumanModel";
import {TreeModel} from "../models/TreeModel";
import {SensorModel} from "../models/SensorModel";
import {FoundationModel} from "../models/FoundationModel";
import {CuboidModel} from "../models/CuboidModel";
import {DefaultViewState} from "./DefaultViewState";
import {ViewState} from "../views/ViewState";
import short from "short-uuid";
import {ElementModelFactory} from "../models/ElementModelFactory";
import {GroundModel} from "../models/GroundModel";

enableMapSet();

export interface CommonStoreState {
    set: (fn: (state: CommonStoreState) => void) => void;

    // only the following four properties are persisted (see the whitelist at the end)
    world: WorldModel;
    elements: ElementModel[];
    viewState: ViewState;
    user: User;

    exportContent: () => {};
    clearContent: () => void;

    weatherData: { [key: string]: WeatherModel };
    getWeather: (location: string) => WeatherModel;
    loadWeatherData: () => void;
    getClosestCity: (lat: number, lng: number) => string | null;

    grid: boolean; // this should only show up when editing
    aabb: Box3; // axis-aligned bounding box of elements
    enableOrbitController: boolean;
    clickObjectType: ObjectType | null;
    moveHandleType: MoveHandleType | null;
    resizeHandleType: ResizeHandleType | null;
    resizeAnchor: Vector2;
    showCloudFilePanel: boolean;
    showAccountSettingsPanel: boolean;
    getSelectedElement: () => ElementModel | null;
    getElementById: (id: string) => ElementModel | null;
    selectNone: () => void;
    updateElementById: (id: string, element: Partial<ElementModel>) => void;
    setElementPosition: (id: string, x: number, y: number, z?: number) => void;
    setElementRotation: (id: string, x: number, y: number, z: number) => void;
    setElementSize: (id: string, lx: number, ly: number, lz?: number) => void;

    objectTypeToAdd: ObjectType;
    addElement: (parent: ElementModel | GroundModel, position: Vector3) => void;

    pastePoint: Vector3;
    elementToPaste: ElementModel | null;
    copyElementById: (id: string) => void;
    cutElementById: (id: string) => void;
    pasteElement: () => void;
    deleteElementById: (id: string) => void;
    countElementsByType: (type: ObjectType) => number;
    removeElementsByType: (type: ObjectType) => void;

    dailyLightSensorData: DatumEntry[];
    setDailyLightSensorData: (data: DatumEntry[]) => void;
    yearlyLightSensorData: DatumEntry[];
    setYearlyLightSensorData: (data: DatumEntry[]) => void;

}

export const useStore = create<CommonStoreState>(devtools(persist((
    set,
    get,
) => {

    const immerSet: CommonStoreState['set'] = fn => set(produce(fn));
    const defaultWorldModel = new DefaultWorldModel();
    const defaultElements = defaultWorldModel.getElements();
    const defaultViewState = new DefaultViewState();

    return {

        set: immerSet,
        world: defaultWorldModel,
        elements: defaultElements,
        viewState: defaultViewState,
        user: {} as User,
        exportContent() {
            const state = get();
            return {
                docid: short.generate(),
                timestamp: new Date().getTime(),
                owner: state.user.displayName,
                email: state.user.email,
                world: state.world,
                elements: state.elements,
                view: state.viewState
            };
        },
        clearContent() {
            immerSet((state: CommonStoreState) => {
                state.elements = [];
            });
        },

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

        grid: false,
        aabb: new Box3(),
        enableOrbitController: true,
        clickObjectType: null,
        moveHandleType: null,
        resizeHandleType: null,
        resizeAnchor: new Vector2(),
        showCloudFilePanel: false,
        showAccountSettingsPanel: false,

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

        objectTypeToAdd: ObjectType.None,
        addElement(parent: ElementModel | GroundModel, position) {
            immerSet((state: CommonStoreState) => {
                switch (state.objectTypeToAdd) {
                    case ObjectType.Human:
                        state.elements.push(ElementModelFactory.makeHuman
                        (state.world.ground, position.x, -position.z, position.y));
                        break;
                    case ObjectType.Tree:
                        state.elements.push(ElementModelFactory.makeTree
                        (state.world.ground, position.x, -position.z, position.y));
                        break;
                    case ObjectType.Sensor:
                        state.elements.push(ElementModelFactory.makeSensor
                        (parent as ElementModel, position.x, -position.z, position.y));
                        break;
                    case ObjectType.Foundation:
                        state.elements.push(ElementModelFactory.makeFoundation
                        (state.world.ground, position.x, -position.z));
                        break;
                    case ObjectType.Cuboid:
                        state.elements.push(ElementModelFactory.makeCuboid
                        (state.world.ground, position.x, -position.z));
                        break;
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
        deleteElementById(id) {
            immerSet((state: CommonStoreState) => {
                for (const e of state.elements) {
                    if (e.id === id) {
                        Util.deleteElement(state.elements, e);
                        break;
                    }
                }
            });
        },
        removeElementsByType(type: ObjectType) {
            immerSet((state: CommonStoreState) => {
                state.elements = state.elements.filter((x) => x.type !== type);
            });
        },
        countElementsByType(type: ObjectType) {
            let count = 0;
            immerSet((state: CommonStoreState) => {
                for (const e of state.elements) {
                    if (e.type === type) {
                        count++;
                    }
                }
            });
            return count;
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
}, {
    name: 'aladdin-storage',
    whitelist: [
        'world',
        'elements',
        'viewState',
        'user'
    ]
})));

