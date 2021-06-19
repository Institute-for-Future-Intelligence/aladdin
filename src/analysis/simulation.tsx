/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect, useMemo} from "react";
import {calculateDiffuseAndReflectedRadiation, calculatePeakRadiation, getSunDirection} from "./sunTools";
import {Object3D, Raycaster, Vector3} from "three";
import {useThree} from "@react-three/fiber";
import {useStore} from "../stores/common";
import {DatumEntry, ObjectType} from "../types";
import {Util} from "../util";
import {AirMass} from "./analysisConstants";
import {MONTHS} from "../constants";
import {SensorModel} from "../models/sensorModel";

export interface SimulationProps {

    city: string | null;
    dailyLightSensorDataFlag: boolean;
    yearlyLightSensorDataFlag: boolean;

}

const Simulation = ({
                        city,
                        dailyLightSensorDataFlag,
                        yearlyLightSensorDataFlag,
                    }: SimulationProps) => {

    const world = useStore(state => state.world);
    const elements = useStore(state => state.elements);
    const getWeather = useStore(state => state.getWeather);
    const now = new Date(useStore(state => state.date));
    const latitude = useStore(state => state.latitude);
    const timesPerHour = useStore(state => state.timesPerHour);
    const setDailyLightSensorData = useStore(state => state.setDailyLightSensorData);
    const setYearlyLightSensorData = useStore(state => state.setYearlyLightSensorData);
    const {scene} = useThree();
    const weather = getWeather(city ?? 'Boston MA, USA');
    const elevation = city ? getWeather(city).elevation : 0;
    const interval = 60 / timesPerHour;
    const ray = useMemo(() => new Raycaster(), []);

    useEffect(() => {
        if (elements && elements.length > 0) {
            collectAllDailyLightSensorData();
        }
    }, [dailyLightSensorDataFlag]);

    useEffect(() => {
        if (elements && elements.length > 0) {
            collectAllYearlyLightSensorData();
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
                objects.push(...c.children.filter(x => x.castShadow));
            }
            const intersects = ray.intersectObjects(objects);
            return intersects.length > 0;
        }
        return false;
    };

    const collectAllDailyLightSensorData = () => {
        const map = new Map<string, number[]>();
        let index = 0;
        for (const e of elements) {
            if (e.type === ObjectType.Sensor) {
                map.set('Radiation' + (index + 1), collectDailyLightSensorData(e as SensorModel));
                index++;
            }
        }
        const data = [];
        for (let i = 0; i < 24; i++) {
            const datum: DatumEntry = {};
            datum['Hour'] = i;
            for (let k = 1; k <= index; k++) {
                const key = 'Radiation' + k;
                datum[key] = map.get(key)?.[i];
            }
            data.push(datum);
        }
        setDailyLightSensorData(data);
    }

    const collectDailyLightSensorData = (sensor: SensorModel) => {
        const position = new Vector3(sensor.cx, sensor.cy, sensor.cz);
        const normal = new Vector3(sensor.normal[0], sensor.normal[1], sensor.normal[2]);
        const result = new Array(24).fill(0);
        const year = now.getFullYear();
        const month = now.getMonth();
        const date = now.getDate();
        const dayOfYear = Util.dayOfYear(now);
        let count = 0;
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < timesPerHour; j++) {
                const cur = new Date(year, month, date, i, j * interval);
                const sunDirection = getSunDirection(cur, latitude);
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
        return result.map(x => x * clearness / timesPerHour);
    };

    const collectAllYearlyLightSensorData = () => {
        const resultArr = [];
        for (const e of elements) {
            if (e.type === ObjectType.Sensor) {
                resultArr.push(collectYearlyLightSensorData(e as SensorModel));
            }
        }
        const results = [];
        for (let month = 0; month < 12; month++) {
            const r: DatumEntry = {};
            r['Month'] = MONTHS[month];
            for (const [i, a] of resultArr.entries()) {
                r['Daylight'] = a[month].Daylight;
                r['Clearness'] = a[month].Clearness;
                r['Radiation' + (i + 1)] = a[month].Radiation;
            }
            results.push(r);
        }
        setYearlyLightSensorData(results);
    }

    const collectYearlyLightSensorData = (sensor: SensorModel) => {
        const data = [];
        const position = new Vector3(sensor.cx, sensor.cy, sensor.cz);
        const normal = new Vector3(sensor.normal[0], sensor.normal[1], sensor.normal[2]);
        const year = now.getFullYear();
        const date = 15;
        for (let month = 0; month < 12; month++) {
            const midMonth = new Date(year, month, date);
            const dayOfYear = Util.dayOfYear(midMonth);
            let total = 0;
            let count = 0;
            for (let hour = 0; hour < 24; hour++) {
                for (let step = 0; step < timesPerHour; step++) {
                    const cur = new Date(year, month, date, hour, step * interval);
                    const sunDirection = getSunDirection(cur, latitude);
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
            total /= timesPerHour; // convert the unit of timeStep from minute to hour so that we get kWh
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

export default Simulation;
