/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect, useMemo, useRef} from "react";
import {calculateDiffuseAndReflectedRadiation, calculatePeakRadiation, getSunDirection} from "./sunTools";
import {Euler, Object3D, Raycaster, Vector3} from "three";
import {useThree} from "@react-three/fiber";
import {useStore} from "../stores/common";
import {DatumEntry, ObjectType, Orientation} from "../types";
import {Util} from "../Util";
import {AirMass} from "./analysisConstants";
import {MONTHS} from "../constants";
import {SolarPanelModel} from "../models/SolarPanelModel";

const getPanelEfficiency = (temperature: number, panel: SolarPanelModel) => {
    let e = panel.pvModel.efficiency;
    if (panel.pvModel.cellType === 'Monocrystalline') {
        e *= 0.95; // assuming that the packing density factor of semi-round cells is 0.95
    }
    return e * (1 + panel.pvModel.pmaxTC * (temperature - 25));
}

export interface SolarPanelSimulationProps {
    city: string | null;
    dailyIndividualOutputs: boolean;
    dailyPvYieldFlag: boolean;
    yearlyIndividualOutputs: boolean;
    yearlyPvYieldFlag: boolean;
}

const SolarPanelSimulation = ({
                                  city,
                                  dailyIndividualOutputs = false,
                                  dailyPvYieldFlag,
                                  yearlyIndividualOutputs = false,
                                  yearlyPvYieldFlag,
                              }: SolarPanelSimulationProps) => {

    const world = useStore(state => state.world);
    const elements = useStore(state => state.elements);
    const getElementById = useStore(state => state.getElementById);
    const getWeather = useStore(state => state.getWeather);
    const setPvDailyYield = useStore(state => state.setDailyPvYield);
    const setPvYearlyYield = useStore(state => state.setYearlyPvYield);
    const setSolarPanelLabels = useStore(state => state.setSolarPanelLabels);
    const {scene} = useThree();
    const weather = getWeather(city ?? 'Boston MA, USA');
    const elevation = city ? getWeather(city).elevation : 0;
    const interval = 60 / world.timesPerHour;
    const ray = useMemo(() => new Raycaster(), []);
    const now = new Date(world.date);
    const loadedDaily = useRef(false);
    const loadedYearly = useRef(false);
    const inverterEfficiency = 0.95;
    const dustLoss = 0.05;
    const cellSize = world.solarPanelGridCellSize;

    useEffect(() => {
        if (loadedDaily.current) { // avoid calling on first render
            if (elements && elements.length > 0) {
                getDailyYieldForAllSolarPanels();
            }
        } else {
            loadedDaily.current = true;
        }
    }, [dailyPvYieldFlag]);

    useEffect(() => {
        if (loadedYearly.current) { // avoid calling on first render
            if (elements && elements.length > 0) {
                getYearlyYieldForAllSolarPanels();
            }
        } else {
            loadedYearly.current = true;
        }
    }, [yearlyPvYieldFlag]);

    const inShadow = (panelId: string, time: Date, position: Vector3, sunDirection: Vector3) => {
        // convert the position and direction from physics model to the coordinate system of three.js
        ray.set(Util.modelToView(position), Util.modelToView(sunDirection));
        const content = scene.children.filter(c => c.name === 'Content');
        if (content.length > 0) {
            const components = content[0].children;
            const objects: Object3D[] = [];
            for (const c of components) {
                objects.push(...c.children.filter(x => (x.userData['simulation'] && x.uuid !== panelId)));
            }
            const intersects = ray.intersectObjects(objects);
            return intersects.length > 0;
        }
        return false;
    };

    const getDailyYieldForAllSolarPanels = () => {
        if (dailyIndividualOutputs) {
            const total = new Array(24).fill(0);
            const map = new Map<string, number[]>();
            let index = 0;
            const labels = [];
            for (const e of elements) {
                if (e.type === ObjectType.SolarPanel) {
                    const output = getDailyYield(e as SolarPanelModel);
                    index++;
                    map.set('Panel' + index, output);
                    labels.push(e.label ? e.label : 'Panel' + index);
                    for (let i = 0; i < 24; i++) {
                        total[i] += output[i];
                    }
                }
            }
            const data = [];
            for (let i = 0; i < 24; i++) {
                const datum: DatumEntry = {};
                datum['Hour'] = i;
                for (let k = 1; k <= index; k++) {
                    const key = 'Panel' + k;
                    datum[labels[k - 1]] = map.get(key)?.[i];
                }
                datum['Total'] = total[i];
                data.push(datum);
            }
            setPvDailyYield(data);
            setSolarPanelLabels(labels);
        } else {
            const total = new Array(24).fill(0);
            for (const e of elements) {
                if (e.type === ObjectType.SolarPanel) {
                    const output = getDailyYield(e as SolarPanelModel);
                    //console.log(output.reduce((sum, x) => sum + x));
                    for (let i = 0; i < 24; i++) {
                        total[i] += output[i];
                    }
                }
            }
            const data = [];
            for (let i = 0; i < 24; i++) {
                data.push({Hour: i, Total: total[i]} as DatumEntry);
            }
            setPvDailyYield(data);
        }
    }

    const getDailyYield = (panel: SolarPanelModel) => {
        // why are the properties of parents cached here?
        const parent = getElementById(panel.parent.id);
        if (!parent) throw new Error('parent of solar panel does not exist');
        const center = Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent);
        const normal = new Vector3().fromArray(panel.normal);
        if (Math.abs(panel.tiltAngle) > 0.001) {
            // TODO: right now we assume a parent rotation is always around the z-axis
            normal.applyEuler(new Euler(panel.tiltAngle, panel.relativeAzimuth + parent.rotation[2], 0, 'XYZ'));
        }
        const result = new Array(24).fill(0);
        const year = now.getFullYear();
        const month = now.getMonth();
        const date = now.getDate();
        const dayOfYear = Util.dayOfYear(now);
        let count = 0;
        let lx, ly, lz, nx, ny;
        if (panel.orientation === Orientation.portrait) {
            lx = panel.lx;
            ly = panel.ly * Math.cos(panel.tiltAngle);
            lz = panel.ly * Math.abs(Math.sin(panel.tiltAngle));
            nx = Math.max(1, Math.round(panel.lx / cellSize));
            ny = Math.max(1, Math.round(panel.ly / cellSize));
        } else {
            lx = panel.ly;
            ly = panel.lx * Math.cos(panel.tiltAngle);
            lz = panel.lx * Math.abs(Math.sin(panel.tiltAngle));
            nx = Math.max(1, Math.round(panel.ly / cellSize));
            ny = Math.max(1, Math.round(panel.lx / cellSize));
        }
        const dx = lx / nx;
        const dy = ly / ny;
        const dz = lz / ny;
        const x0 = center.x - lx / 2;
        const y0 = center.y - ly / 2;
        const z0 = panel.poleHeight + center.z - lz / 2;
        const v = new Vector3();
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < world.timesPerHour; j++) {
                const currentTime = new Date(year, month, date, i, j * interval);
                const sunDirection = getSunDirection(currentTime, world.latitude);
                if (sunDirection.z > 0) {
                    // when the sun is out
                    count++;
                    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
                    const dot = normal.dot(sunDirection);
                    let s = 0;
                    if (dot > 0) {
                        for (let ix = 0; ix < nx; ix++) {
                            for (let iy = 0; iy < ny; iy++) {
                                v.set(x0 + ix * dx, y0 + iy * dy, z0 + iy * dz);
                                if (!inShadow(panel.id, currentTime, v, sunDirection)) {
                                    // direct radiation
                                    s += dot * peakRadiation;
                                }
                            }
                        }
                    }
                    // indirect radiation
                    const t = calculateDiffuseAndReflectedRadiation(world.ground, month, normal, peakRadiation);
                    result[i] += s / (nx * ny) + t;
                }
            }
        }
        // apply clearness and convert the unit of time step from minute to hour so that we get kWh
        const daylight = count * interval / 60;
        const clearness = weather.sunshineHours[month] / (30 * daylight);
        const factor = panel.lx * panel.ly * getPanelEfficiency(25, panel) * inverterEfficiency * (1 - dustLoss);
        return result.map(x => x * factor * clearness / world.timesPerHour);
    };

    const getYearlyYieldForAllSolarPanels = () => {
        if (yearlyIndividualOutputs) {
            const resultArr = [];
            const labels = [];
            let index = 0;
            for (const e of elements) {
                if (e.type === ObjectType.SolarPanel) {
                    resultArr.push(getYearlyPvYield(e as SolarPanelModel));
                    index++;
                    labels.push(e.label ? e.label : 'Panel' + index);
                }
            }
            const results = [];
            for (let month = 0; month < 12; month++) {
                const r: DatumEntry = {};
                r['Month'] = MONTHS[month];
                let total = 0;
                for (const [i, a] of resultArr.entries()) {
                    r[labels[i]] = a[month].Yield;
                    total += a[month].Yield as number;
                }
                r['Total'] = total;
                results.push(r);
            }
            setPvYearlyYield(results);
            setSolarPanelLabels(labels);
        } else {
            const resultArr = [];
            for (const e of elements) {
                if (e.type === ObjectType.SolarPanel) {
                    resultArr.push(getYearlyPvYield(e as SolarPanelModel));
                }
            }
            const results = [];
            for (let month = 0; month < 12; month++) {
                const r: DatumEntry = {};
                r['Month'] = MONTHS[month];
                let total = 0;
                for (const result of resultArr) {
                    total += result[month].Yield as number;
                }
                r['Total'] = total;
                results.push(r);
            }
            setPvYearlyYield(results);
        }
    }

    const getYearlyPvYield = (panel: SolarPanelModel) => {
        const data = [];
        // why are the properties of parents cached here?
        const parent = getElementById(panel.parent.id);
        if (!parent) throw new Error('parent of solar panel does not exist');
        const center = Util.absoluteCoordinates(panel.cx, panel.cy, panel.cz, parent);
        const normal = new Vector3().fromArray(panel.normal);
        if (Math.abs(panel.tiltAngle) > 0.001) {
            // TODO: right now we assume a parent rotation is always around the z-axis
            normal.applyEuler(new Euler(panel.tiltAngle, panel.relativeAzimuth + parent.rotation[2], 0, 'XYZ'));
        }
        const year = now.getFullYear();
        const date = 15;
        let lx, ly, lz, nx, ny;
        if (panel.orientation === Orientation.portrait) {
            lx = panel.lx;
            ly = panel.ly * Math.cos(panel.tiltAngle);
            lz = panel.ly * Math.abs(Math.sin(panel.tiltAngle));
            nx = Math.max(1, Math.round(panel.lx / cellSize));
            ny = Math.max(1, Math.round(panel.ly / cellSize));
        } else {
            lx = panel.ly;
            ly = panel.lx * Math.cos(panel.tiltAngle);
            lz = panel.lx * Math.abs(Math.sin(panel.tiltAngle));
            nx = Math.max(1, Math.round(panel.ly / cellSize));
            ny = Math.max(1, Math.round(panel.lx / cellSize));
        }
        const dx = lx / nx;
        const dy = ly / ny;
        const dz = lz / ny;
        const x0 = center.x - lx / 2;
        const y0 = center.y - ly / 2;
        const z0 = panel.poleHeight + center.z - lz / 2;
        const v = new Vector3();
        for (let month = 0; month < 12; month++) {
            const midMonth = new Date(year, month, date);
            const dayOfYear = Util.dayOfYear(midMonth);
            let dailyYield = 0;
            let count = 0;
            for (let hour = 0; hour < 24; hour++) {
                for (let step = 0; step < world.timesPerHour; step++) {
                    const currentTime = new Date(year, month, date, hour, step * interval);
                    const sunDirection = getSunDirection(currentTime, world.latitude);
                    if (sunDirection.z > 0) {
                        // when the sun is out
                        count++;
                        const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
                        const dot = normal.dot(sunDirection);
                        let s = 0;
                        if (dot > 0) {
                            for (let ix = 0; ix < nx; ix++) {
                                for (let iy = 0; iy < ny; iy++) {
                                    v.set(x0 + ix * dx, y0 + iy * dy, z0 + iy * dz);
                                    if (!inShadow(panel.id, currentTime, v, sunDirection)) {
                                        // direct radiation
                                        s += dot * peakRadiation;
                                    }
                                }
                            }
                        }
                        // indirect radiation
                        const t = calculateDiffuseAndReflectedRadiation(world.ground, month, normal, peakRadiation);
                        dailyYield += s / (nx * ny) + t;
                    }
                }
            }
            const daylight = count * interval / 60;
            const clearness = weather.sunshineHours[midMonth.getMonth()] / (30 * daylight);
            const factor = panel.lx * panel.ly * getPanelEfficiency(25, panel) * inverterEfficiency * (1 - dustLoss);
            dailyYield *= clearness * factor;
            dailyYield /= world.timesPerHour; // convert the unit of timeStep from minute to hour so that we get kWh
            data.push({Month: MONTHS[month], Yield: dailyYield} as DatumEntry);
        }
        return data;
    };

    return <></>;

};

export default SolarPanelSimulation;
