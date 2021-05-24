/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import * as THREE from 'three';
import {Util} from "./Util";

export class Heliodon {

    private date: Date;
    private latitude: number;
    private declinationAngle: number;
    private hourAngle: number;
    private root: THREE.Object3D;
    private sun: THREE.Mesh;

    static get TILT_ANGLE() {
        return 23.45 / 180.0 * Math.PI;
    }

    static get DECLINATION_DIVISIONS() {
        return 12;
    }

    static get HOUR_DIVISIONS() {
        return 96;
    }

    constructor() {
        this.date = new Date();
        this.latitude = 42 / 180.0 * Math.PI;
        this.declinationAngle = 0;
        this.hourAngle = 0;
        this.root = new THREE.Object3D();
        this.sun = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 20, 20),
            new THREE.MeshBasicMaterial({color: 0xffffff00})
        );
    }

    draw() {
        while (this.root.children.length > 0) {
            this.root.remove(this.root.children[0]);
        }
        this.drawBase();
        this.drawSunRegion();
        this.drawSunPath();
        this.drawSun();
//		this.drawLensflare();
    }

    drawBase() {
        const r = 5.0;
        const BASE_DIVISIONS = 72;
        const step = Math.PI * 2 / BASE_DIVISIONS;
        let counter = 0;

        const basePoints = [];
        const tickPoints = [];
        for (let angle = 0; angle < Util.TWO_PI + step / 2.0; angle += step) {
            let trimedAngle;
            if (angle > Util.TWO_PI) {
                trimedAngle = Util.TWO_PI;
            } else {
                trimedAngle = angle;
            }

            let width = 0.3;
            basePoints.push(Util.sphericalToCartesianZ(new THREE.Vector3(r, trimedAngle, 0)));
            basePoints.push(Util.sphericalToCartesianZ(new THREE.Vector3(r + width, trimedAngle, 0)));

            let p;
            if (Util.TWO_PI - trimedAngle > Util.ZERO_TOLERANCE) {
                width = counter % 3 === 0 ? 0.5 : 0.3;
                p = new THREE.Vector3(r, trimedAngle, 0);
                p.z = 0.002;
                tickPoints.push(Util.sphericalToCartesianZ(p));
                p = new THREE.Vector3(r + width, trimedAngle, 0);
                p.z = 0.002;
                tickPoints.push(Util.sphericalToCartesianZ(p));
            }
            counter++;
        }
        const baseGeometry = new THREE.BufferGeometry().setFromPoints(basePoints);
        const baseTicksGeometry = new THREE.BufferGeometry().setFromPoints(tickPoints);

        const normal = new THREE.Vector3(0, 0, 1);
        for (let i = 0; i < counter - 1; i++) {
            const c = (Math.floor(i / 3)) % 2 === 0 ? 0.5 : 1.0;
            const color = new THREE.Color(c, c, c);
            // baseGeometry.faces.push(new THREE.Face3(i * 2, i * 2 + 1, i * 2 + 2, normal, color));
            // baseGeometry.faces.push(new THREE.Face3(i * 2 + 1, i * 2 + 3, i * 2 + 2, normal, color));
        }

        let base = new THREE.Mesh(baseGeometry, new THREE.MeshBasicMaterial({
            polygonOffset: true,
            polygonOffsetFactor: -0.7,
            polygonOffsetUnits: -2
        }));
        let baseTicks = new THREE.LineSegments(baseTicksGeometry, new THREE.MeshBasicMaterial({color: 0x000000}));

        this.root.add(base);
        this.root.add(baseTicks);
    }

    drawSunRegion() {
        const declinationStep = 2.0 * Heliodon.TILT_ANGLE / Heliodon.DECLINATION_DIVISIONS;
        const hourStep = Util.TWO_PI / Heliodon.HOUR_DIVISIONS;
        //const geometry = new THREE.Geometry();
        let verticesCount = 0;
        for (let declinationAngle = -Heliodon.TILT_ANGLE; declinationAngle < Heliodon.TILT_ANGLE - declinationStep / 2.0; declinationAngle += declinationStep) {
            for (let hourAngle = -Math.PI; hourAngle < Math.PI - hourStep / 2.0; hourAngle += hourStep) {
                let hourAngle2 = hourAngle + hourStep;
                let declinationAngle2 = declinationAngle + declinationStep;
                if (hourAngle2 > Math.PI) {
                    hourAngle2 = Math.PI;
                }
                if (declinationAngle2 > Heliodon.TILT_ANGLE) {
                    declinationAngle2 = Heliodon.TILT_ANGLE;
                }
                const v1 = this.computeSunLocation(hourAngle, declinationAngle, this.latitude);
                const v2 = this.computeSunLocation(hourAngle2, declinationAngle, this.latitude);
                const v3 = this.computeSunLocation(hourAngle2, declinationAngle2, this.latitude);
                const v4 = this.computeSunLocation(hourAngle, declinationAngle2, this.latitude);
                if (v1.z >= 0 || v2.z >= 0 || v3.z >= 0 || v4.z >= 0) {
                    //geometry.vertices.push(v1, v2, v3, v4);
                    // geometry.faces.push(new THREE.Face3(verticesCount, verticesCount + 1, verticesCount + 2));
                    // geometry.faces.push(new THREE.Face3(verticesCount, verticesCount + 2, verticesCount + 3));
                    verticesCount += 4;
                }
            }
        }
        let material = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            color: new THREE.Color(1, 1, 0),
            transparent: true,
            opacity: 0.5,
            clippingPlanes: [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)]
        });
        //let sunRegion = new THREE.Mesh(geometry, material);
        //this.root.add(sunRegion);
    }

    drawSunPath() {
        const step = Util.TWO_PI / Heliodon.HOUR_DIVISIONS;
        const points = [];
        for (let hourAngle = -Math.PI; hourAngle < Math.PI + step / 2.0; hourAngle += step) {
            const v = this.computeSunLocation(hourAngle, this.declinationAngle, this.latitude);
            if (v.z > -0.3) {
                points.push(v);
            }
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        if (points.length > 0) {
            let sunPath = new THREE.Line(geometry, new THREE.MeshBasicMaterial({
                color: new THREE.Color(1, 1, 0),
                clippingPlanes: [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)]
            }));
            this.root.add(sunPath);
        }
    }

    drawSun() {
        const sunLocation = this.computeSunLocation(this.hourAngle, this.declinationAngle, this.latitude);
        this.setSunLocation(sunLocation);
        this.root.add(this.sun);
    }

    drawLensflare() {
        let textureLoader = new THREE.TextureLoader();
        let textureFlare0 = textureLoader.load("textures/lensflare/lensflare0.png");
        let flareColor = new THREE.Color(0xffffff);
        flareColor.setHSL(0.55, 0.9, 0.5 + 0.5);
        // this.lensFlare = new THREE.LensFlare(textureFlare0, 100, 0.0, THREE.AdditiveBlending, flareColor);
        // this.lensFlare.position.set(this.sun.position.x, this.sun.position.y, this.sun.position.z + 0.6);
        // this.root.add(this.lensFlare);
    }

    getSun() {
        return this.sun;
    }

    computeSunLocation(hourAngle: number, declinationAngle: number, observerLatitude: number) {
        let altitudeAngle = Math.asin(Math.sin(declinationAngle) * Math.sin(observerLatitude) + Math.cos(declinationAngle) * Math.cos(hourAngle) * Math.cos(observerLatitude));
        let x_azm = Math.sin(hourAngle) * Math.cos(declinationAngle);
        let y_azm = (-(Math.cos(hourAngle)) * Math.cos(declinationAngle) * Math.sin(observerLatitude)) + (Math.cos(observerLatitude) * Math.sin(declinationAngle));
        let azimuthAngle = Math.atan2(y_azm, x_azm);

        let r = 5;
        let coords = new THREE.Vector3(r, azimuthAngle, altitudeAngle);
        Util.sphericalToCartesianZ(coords);
        coords.setX(-coords.x); // reverse the x so that sun moves from east to west
        return coords;
    }

    setSunLocation(sunLocation: THREE.Vector3) {
        this.sun.position.set(sunLocation.x, sunLocation.y, sunLocation.z);
    }

    getLatitude() {
        return this.latitude;
    }

    setLatitude(latitude: number) {
        this.latitude = this.toPlusMinusPIRange(latitude, -Util.HALF_PI, Util.HALF_PI);
    }

    setDeclinationAngle(declinationAngle: number) {
        this.declinationAngle = this.toPlusMinusPIRange(declinationAngle, -Heliodon.TILT_ANGLE, Heliodon.TILT_ANGLE);
    }

    setHourAngle(hourAngle: number) {
        this.hourAngle = this.toPlusMinusPIRange(hourAngle, -Math.PI, Math.PI);
    }

    setDate(date: Date) {
        this.date.setFullYear(date.getFullYear());
        this.date.setMonth(date.getMonth());
        this.date.setDate(date.getDate());
        this.setDeclinationAngle(this.computeDeclinationAngle(this.date));
    }

    setTime(time: Date) {
        this.date.setHours(time.getHours());
        this.date.setMinutes(time.getMinutes());
        //this.setHourAngle(this.computeHourAngle(this.date), true, false, false);
    }

    computeDeclinationAngle(date: Date) {
        // let days = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        let days = 0;
        let declinationAngle = Heliodon.TILT_ANGLE * Math.sin(Util.TWO_PI * (284 + days) / 365.25);
        return declinationAngle;
    }

    computeHourAngle(date: Date) {
        let minutes = date.getHours() * 60 + date.getMinutes() - 12 * 60;
        let hourAngle = minutes / (12.0 * 60.0) * Math.PI;
        return hourAngle;
    }

    toPlusMinusPIRange(radian: number, min: number, max: number) {
        let result = radian - Math.floor(radian / Util.TWO_PI) * Util.TWO_PI;
        if (Math.abs(result) > Math.PI) {
            result = -Math.sign(result) * (Util.TWO_PI - Math.abs(result));
        }
        if (result < min) {
            result = min;
        } else if (result > max) {
            result = max;
        }
        return result;
    }

}
