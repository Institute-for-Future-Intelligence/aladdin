/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {ElementModel} from "../models/elementModel";
import {ObjectType} from "../types";
import {FoundationModel} from "../models/foundationModel";
import {CuboidModel} from "../models/cuboidModel";
import {SensorModel} from "../models/sensorModel";
import {Vector3} from "three";
import {WorldModel} from "../models/worldModel";
import {GroundModel} from "../models/groundModel";

export class DefaultWorldModel implements WorldModel {

    name: string;
    cameraPosition: Vector3;
    panCenter: Vector3;
    ground: GroundModel;

    constructor() {

        this.name = 'default';
        this.ground = {
            albedo: 0.3,
            thermalDiffusivity: 0.05,
            snowReflectionFactors: new Array(12).fill(0)
        };
        this.panCenter = new Vector3(0, 0, 0);
        this.cameraPosition = new Vector3(0, 0, 5);

    }

    getElements() {
        const elements: ElementModel[] = [];
        const e1 = {
            type: ObjectType.Foundation,
            cx: 0,
            cy: 0,
            lx: 2,
            ly: 3,
            lz: 0.1,
            normal: [0, 0, 1],
            rotation: [0, 0, 0],
            id: 'f1'
        } as FoundationModel;
        const e2 = {
            type: ObjectType.Cuboid,
            cx: 0,
            cy: 3,
            cz: 2,
            lx: 2,
            ly: 2,
            lz: 4,
            normal: [0, 0, 1],
            rotation: [0, Math.PI / 6, 0],
            id: 'c1'
        } as CuboidModel;
        const e3 = {
            type: ObjectType.Sensor,
            cx: 2,
            cy: 5,
            cz: 0,
            lx: 0.05,
            ly: 0.05,
            lz: 0.01,
            normal: [0, 0, 1],
            id: 's1',
            showLabel: false,
            light: true,
            heatFlux: false
        } as SensorModel;
        const e4 = {
            type: ObjectType.Sensor,
            cx: 0,
            cy: 5,
            cz: 0,
            lx: 0.05,
            ly: 0.05,
            lz: 0.01,
            normal: [0, 0, 1],
            id: 's2',
            showLabel: false,
            light: true,
            heatFlux: false
        } as SensorModel;
        const e5 = {
            type: ObjectType.Foundation,
            cx: 4,
            cy: 0,
            lx: 2,
            ly: 3,
            lz: 0.1,
            normal: [0, 0, 1],
            rotation: [0, Math.PI / 2, 0],
            id: 'f2'
        } as FoundationModel;
        elements.push(e1);
        elements.push(e2);
        elements.push(e3);
        elements.push(e4);
        elements.push(e5);
        return elements;
    }

}
