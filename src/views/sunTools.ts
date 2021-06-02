/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {Util} from "../util";
import {Vector3} from "three";

export const TILT_ANGLE = 23.45 / 180.0 * Math.PI;

export const computeDeclinationAngle = (date: Date) => {
    const days = Math.floor((date.getTime()
        - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return TILT_ANGLE * Math.sin(Util.TWO_PI * (284 + days) / 365.25);
};

export const computeHourAngle = (date: Date) => {
    const minutes = date.getHours() * 60 + date.getMinutes() - 12 * 60;
    return minutes / (12.0 * 60.0) * Math.PI;
}

export const computeSunLocation = (radius: number,
                                   hourAngle: number,
                                   declinationAngle: number,
                                   observerLatitude: number) => {
    const altitudeAngle = Math.asin(
        Math.sin(declinationAngle) * Math.sin(observerLatitude) +
        Math.cos(declinationAngle) * Math.cos(hourAngle) * Math.cos(observerLatitude)
    );
    const xAzm = Math.sin(hourAngle) * Math.cos(declinationAngle);
    const yAzm = Math.cos(observerLatitude) * Math.sin(declinationAngle)
        - Math.cos(hourAngle) * Math.cos(declinationAngle) * Math.sin(observerLatitude);
    const azimuthAngle = Math.atan2(yAzm, xAzm);
    const coords = new Vector3(radius, azimuthAngle, altitudeAngle);
    Util.sphericalToCartesianZ(coords);
    // reverse the x so that sun moves from east to west
    coords.setX(-coords.x);
    return coords;
};
