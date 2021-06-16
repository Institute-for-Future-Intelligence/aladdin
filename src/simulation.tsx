/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect} from "react";
import {calculateDiffuseAndReflectedRadiation, calculatePeakRadiation, getSunDirection} from "./analysis/sunTools";
import {Object3D, Raycaster, Vector3} from "three";
import {useThree} from "@react-three/fiber";
import {useStore} from "./stores/common";
import {DatumEntry, ObjectType} from "./types";
import {SensorModel} from "./models/sensorModel";
import {Util} from "./util";
import {AirMass} from "./analysis/analysisConstants";
import {computeDailyData} from "./analysis/sensorAnalysis";

const TIMES_PER_HOUR = 20; // how many times an hour
const INTERVAL = 60 / TIMES_PER_HOUR;

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

    const getWorld = useStore(state => state.getWorld);
    const getWeather = useStore(state => state.getWeather);
    const now = new Date(useStore(state => state.date));
    const latitude = useStore(state => state.latitude);
    const longitude = useStore(state => state.longitude);
    const setDailyLightSensorData = useStore(state => state.setDailyLightSensorData);
    const setYearlyLightSensorData = useStore(state => state.setYearlyLightSensorData);
    const {scene} = useThree();
    const ray = new Raycaster();
    const weather = getWeather(city ?? 'Boston MA, USA');
    const ground = getWorld('default').ground;
    const elements = getWorld('default').elements;
    const elevation = city ? getWeather(city).elevation : 0;

    useEffect(() => {
        if (elements && elements.length > 0) {
            collectDailyLightSensorData();
        }
    }, [dailyLightSensorDataFlag]);

    useEffect(() => {
        if (elements && elements.length > 0) {
            collectYearlyLightSensorData();
        }
    }, [yearlyLightSensorDataFlag]);

    const inShadow = (time: Date, position: Vector3, sunDirection: Vector3) => {
        // convert the position and direction from physics model to the coordinate system of three.js
        ray.set(
            new Vector3(position.x, position.z, -position.y),
            new Vector3(sunDirection.x, sunDirection.z, -sunDirection.y)
        );
        const content = scene.children.filter(c => c.name === 'Content');
        if (content.length > 0) {
            const components = content[0].children;
            const objects: Object3D[] = [];
            for (const c of components) {
                objects.push(...c.children.filter(x => x.castShadow));
            }
            const intersects = ray.intersectObjects(objects);
            //console.log(time, intersects)
            return intersects.length > 0;
        }
        return false;
    };

    const collectDailyLightSensorData = () => {
        for (const e of elements) {
            if (e.type === ObjectType.Sensor) {
                const normal = new Vector3(0, 0, 1);
                const position = new Vector3(e.cx, e.cy, e.cz);
                const result = new Array(24).fill(0);
                let count = 0;
                for (let i = 0; i < 24; i++) {
                    for (let j = 0; j < TIMES_PER_HOUR; j++) {
                        const cur = new Date(now.getFullYear(), now.getMonth(), now.getDate(), i, j * INTERVAL);
                        const sunDirection = getSunDirection(cur, latitude);
                        if (sunDirection.z > 0) {
                            // when the sun is out
                            count++;
                            const peakRadiation = calculatePeakRadiation(sunDirection, Util.dayOfYear(cur), elevation, AirMass.SPHERE_MODEL);
                            const dot = normal.dot(sunDirection);
                            if (dot > 0) {
                                if (!inShadow(cur, position, sunDirection)) {
                                    // direct radiation
                                    result[i] += dot * peakRadiation;
                                }
                            }
                            // indirect radiation
                            result[i] += calculateDiffuseAndReflectedRadiation(ground, now.getMonth(), normal, peakRadiation);
                        }
                    }
                }
                const daylight = count * INTERVAL / 60;
                const clearness = weather.sunshineHours[now.getMonth()] / (30 * daylight);
                // apply clearness andconvert the unit of timeStep from minute to hour so that we get kWh
                const data = [];
                for (let i = 0; i < 24; i++) {
                    data.push({Hour: i, Radiation: result[i] * clearness / TIMES_PER_HOUR} as DatumEntry);
                }
                setDailyLightSensorData(data);
            }
        }
    };

    const collectYearlyLightSensorData = () => {
        for (const e of elements) {
            if (e.type === ObjectType.Sensor) {
                const data = [];
                for (let i = 0; i < 12; i++) {
                    const midMonth = new Date(now.getFullYear(), i, 15, 12);
                    const result = computeDailyData(
                        e as SensorModel,
                        weather,
                        ground,
                        latitude,
                        longitude,
                        elevation,
                        midMonth
                    );
                    data.push(result);
                }
                setYearlyLightSensorData(data);
            }
        }
    };

    return <></>;

};

export default Simulation;
