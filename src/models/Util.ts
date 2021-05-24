/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

export class Util {

    static get ZERO_TOLERANCE() {
        return 0.0001;
    }

    static get HALF_PI() {
        return Math.PI / 2;
    }

    static get TWO_PI() {
        return Math.PI * 2;
    }

    static toRadians(degrees: number) {
        return degrees * (Math.PI / 180);
    }

    static toDegrees(radians: number) {
        return radians * (180 / Math.PI);
    }

    static sphericalToCartesianZ(sphereCoords: THREE.Vector3) {
        let a = sphereCoords.x * Math.cos(sphereCoords.z);
        let x = a * Math.cos(sphereCoords.y);
        let y = a * Math.sin(sphereCoords.y);
        let z = sphereCoords.x * Math.sin(sphereCoords.z);
        sphereCoords.set(x, y, z);
        return sphereCoords;
    }

}
