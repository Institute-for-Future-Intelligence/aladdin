/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {Vector3} from "three";

export class Util {

    static get UNIT_VECTOR_POS_X() {
        return new Vector3(1, 0, 0);
    }

    static get UNIT_VECTOR_NEG_X() {
        return new Vector3(-1, 0, 0);
    }

    static get UNIT_VECTOR_POS_Y() {
        return new Vector3(0, 1, 0);
    }

    static get UNIT_VECTOR_NEG_Y() {
        return new Vector3(0, -1, 0);
    }

    static get UNIT_VECTOR_POS_Z() {
        return new Vector3(0, 0, 1);
    }

    static get UNIT_VECTOR_NEG_Z() {
        return new Vector3(0, 0, -1);
    }

    static isZero(x: number) {
        return Math.abs(x) < Util.ZERO_TOLERANCE;
    }

    static get ZERO_TOLERANCE() {
        return 0.0001;
    }

    static get HALF_PI() {
        return Math.PI / 2;
    }

    static get TWO_PI() {
        return Math.PI * 2;
    }

    static copyVector(to: Vector3, from: Vector3) {
        to.x = from.x;
        to.y = from.y;
        to.z = from.z;
    }

    static setVector(v: Vector3, x: number, y: number, z: number) {
        v.x = x;
        v.y = y;
        v.z = z;
    }

    // convert the coordinates from the model system to the view system
    static modelToView(v: Vector3) {
        return new Vector3(v.x, v.z, -v.y);
    }

    // convert the coordinates from the view system to the model system
    static viewToModel(v: Vector3) {
        return new Vector3(v.x, -v.z, v.y);
    }

    static toRadians(degrees: number) {
        return degrees * (Math.PI / 180);
    }

    static toDegrees(radians: number) {
        return radians * (180 / Math.PI);
    }

    static sphericalToCartesianZ(sphereCoords: Vector3) {
        let a = sphereCoords.x * Math.cos(sphereCoords.z);
        let x = a * Math.cos(sphereCoords.y);
        let y = a * Math.sin(sphereCoords.y);
        let z = sphereCoords.x * Math.sin(sphereCoords.z);
        sphereCoords.set(x, y, z);
        return sphereCoords;
    }

    // the spherical law of cosines: https://en.wikipedia.org/wiki/Spherical_law_of_cosines
    static getDistance(lng1: number, lat1: number, lng2: number, lat2: number) {
        lng1 = Util.toRadians(lng1);
        lat1 = Util.toRadians(lat1);
        lng2 = Util.toRadians(lng2);
        lat2 = Util.toRadians(lat2);
        return Math.acos(Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(Math.abs(lng1 - lng2)));
    }

    static daysIntoYear(date: string) {
        return Util.dayOfYear(new Date(date));
    }

    static dayOfYear(date: Date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date.getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

}
