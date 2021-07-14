/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect, useMemo, useRef} from "react";
import {calculateDiffuseAndReflectedRadiation, calculatePeakRadiation, getSunDirection} from "./sunTools";
import {Object3D, Raycaster, Vector3} from "three";
import {useThree} from "@react-three/fiber";
import {useStore} from "../stores/common";
import {DatumEntry, ObjectType} from "../types";
import {Util} from "../Util";
import {AirMass} from "./analysisConstants";
import {MONTHS} from "../constants";
import {SensorModel} from "../models/SensorModel";

export interface SensorSimulationProps {
    city: string | null;
    dailyLightSensorDataFlag: boolean;
    yearlyLightSensorDataFlag: boolean;
}

const SensorSimulation = ({
                              city,
                              dailyLightSensorDataFlag,
                              yearlyLightSensorDataFlag,
                          }: SensorSimulationProps) => {

    const world = useStore(state => state.world);
    const elements = useStore(state => state.elements);
    const getElementById = useStore(state => state.getElementById);
    const getWeather = useStore(state => state.getWeather);
    const setSensorLabels = useStore(state => state.setSensorLabels);
    const setDailyLightSensorData = useStore(state => state.setDailyLightSensorData);
    const setYearlyLightSensorData = useStore(state => state.setYearlyLightSensorData);
    const {scene} = useThree();
    const weather = getWeather(city ?? 'Boston MA, USA');
    const elevation = city ? getWeather(city).elevation : 0;
    const interval = 60 / world.timesPerHour;
    const ray = useMemo(() => new Raycaster(), []);
    const now = new Date(world.date);
    const loadedDaily = useRef(false);
    const loadedYearly = useRef(false);

    useEffect(() => {
        if (loadedDaily.current) { // avoid calling on first render
            if (elements && elements.length > 0) {
                collectAllDailyLightSensorData();
            }
        } else {
            loadedDaily.current = true;
        }
    }, [dailyLightSensorDataFlag]);

    useEffect(() => {
        if (loadedYearly.current) { // avoid calling on first render
            if (elements && elements.length > 0) {
                collectAllYearlyLightSensorData();
            }
        } else {
            loadedYearly.current = true;
        }
    }, [yearlyLightSensorDataFlag]);

    const inShadow = (time: Date, position: Vector3, sunDirection: Vector3) => {
        // convert the position and direction from physics model to the coordinate system of three.js
        ray.set(Util.modelToView(position), Util.modelToView(sunDirection));
        const content = scene.children.filter(c => c.name === 'Content');
        if (content.length > 0) {
            const components = content[0].children;
            const objects: Object3D[] = [];
            for (const c of components) {
                objects.push(...c.children.filter(x => x.userData['simulation']));
            }
            const intersects = ray.intersectObjects(objects);
            return intersects.length > 0;
        }
        return false;
    };

    const collectAllDailyLightSensorData = () => {
        const map = new Map<string, number[]>();
        let index = 0;
        const labels = [];
        for (const e of elements) {
            if (e.type === ObjectType.Sensor) {
                index++;
                map.set('Radiation' + index, collectDailyLightSensorData(e as SensorModel));
                labels.push(e.label ? e.label : 'Radiation' + index);
            }
        }
        const data = [];
        for (let i = 0; i < 24; i++) {
            const datum: DatumEntry = {};
            datum['Hour'] = i;
            for (let k = 1; k <= index; k++) {
                const key = 'Radiation' + k;
                datum[labels[k - 1]] = map.get(key)?.[i];
            }
            data.push(datum);
        }
        setDailyLightSensorData(data);
        setSensorLabels(labels);
    }

    const collectDailyLightSensorData = (sensor: SensorModel) => {
        // why are the properties of parents cached here?
        const parent = getElementById(sensor.parent.id);
        if (!parent) throw new Error('parent of sensor does not exist');
        const position = Util.absoluteCoordinates(sensor.cx, sensor.cy, sensor.cz, parent);
        const normal = new Vector3().fromArray(sensor.normal);
        // TODO: right now we assume a parent rotation is always around the z-axis
        normal.applyAxisAngle(Util.UNIT_VECTOR_POS_Z, parent.rotation[2]);
        const result = new Array(24).fill(0);
        const year = now.getFullYear();
        const month = now.getMonth();
        const date = now.getDate();
        const dayOfYear = Util.dayOfYear(now);
        let count = 0;
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < world.timesPerHour; j++) {
                const cur = new Date(year, month, date, i, j * interval);
                const sunDirection = getSunDirection(cur, world.latitude);
                if (sunDirection.z > 0) {
                    // when the sun is out
                    count++;
                    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
                    const dot = normal.dot(sunDirection);
                    if (dot > 0) {
                        if (!inShadow(cur, position, sunDirection)) {
                            // direct radiation
                            result[i] += dot * peakRadiation;
                        }
                    }
                    // indirect radiation
                    result[i] += calculateDiffuseAndReflectedRadiation(world.ground, month, normal, peakRadiation);
                }
            }
        }
        // apply clearness and convert the unit of time step from minute to hour so that we get kWh
        const daylight = count * interval / 60;
        const clearness = weather.sunshineHours[month] / (30 * daylight);
        return result.map(x => x * clearness / world.timesPerHour);
    };

    const collectAllYearlyLightSensorData = () => {
        const resultArr = [];
        const labels = [];
        let index = 0;
        for (const e of elements) {
            if (e.type === ObjectType.Sensor) {
                resultArr.push(collectYearlyLightSensorData(e as SensorModel));
                index++;
                labels.push(e.label ? e.label : 'Radiation' + index);
            }
        }
        const results = [];
        for (let month = 0; month < 12; month++) {
            const r: DatumEntry = {};
            r['Month'] = MONTHS[month];
            for (const [i, a] of resultArr.entries()) {
                r['Daylight'] = a[month].Daylight;
                r['Clearness'] = a[month].Clearness;
                r[labels[i]] = a[month].Radiation;
            }
            results.push(r);
        }
        setYearlyLightSensorData(results);
        setSensorLabels(labels);
    }

    const collectYearlyLightSensorData = (sensor: SensorModel) => {
        const data = [];
        // why are the properties of parents cached here?
        const parent = getElementById(sensor.parent.id);
        if (!parent) throw new Error('parent of sensor does not exist');
        const position = Util.absoluteCoordinates(sensor.cx, sensor.cy, sensor.cz, parent);
        const normal = new Vector3().fromArray(sensor.normal);
        // TODO: right now we assume a parent rotation is always around the z-axis
        normal.applyAxisAngle(Util.UNIT_VECTOR_POS_Z, parent.rotation[2]);
        const year = now.getFullYear();
        const date = 15;
        for (let month = 0; month < 12; month++) {
            const midMonth = new Date(year, month, date);
            const dayOfYear = Util.dayOfYear(midMonth);
            let total = 0;
            let count = 0;
            for (let hour = 0; hour < 24; hour++) {
                for (let step = 0; step < world.timesPerHour; step++) {
                    const cur = new Date(year, month, date, hour, step * interval);
                    const sunDirection = getSunDirection(cur, world.latitude);
                    if (sunDirection.z > 0) {
                        // when the sun is out
                        count++;
                        const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
                        const dot = normal.dot(sunDirection);
                        if (dot > 0) {
                            if (!inShadow(cur, position, sunDirection)) {
                                // direct radiation
                                total += dot * peakRadiation;
                            }
                        }
                        // indirect radiation
                        total += calculateDiffuseAndReflectedRadiation(world.ground, month, normal, peakRadiation);
                    }
                }
            }
            const daylight = count * interval / 60;
            const clearness = weather.sunshineHours[midMonth.getMonth()] / (30 * daylight);
            total *= clearness; // apply clearness
            total /= world.timesPerHour; // convert the unit of timeStep from minute to hour so that we get kWh
            data.push({
                Month: MONTHS[month],
                Daylight: daylight,
                Clearness: clearness * 100,
                Radiation: total
            } as DatumEntry);
        }
        return data;
    };

    return <></>;

};

export default SensorSimulation;
