/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {ElementModel} from "../models/ElementModel";
import {HumanName, ObjectType} from "../types";
import {FoundationModel} from "../models/FoundationModel";
import {CuboidModel} from "../models/CuboidModel";
import {SensorModel} from "../models/SensorModel";
import {Vector3} from "three";
import {WorldModel} from "../models/WorldModel";
import {GroundModel} from "../models/GroundModel";
import {HumanModel} from "../models/HumanModel";
import {TreeModel} from "../models/TreeModel";
import short from 'short-uuid';

export class DefaultWorldModel implements WorldModel {

    name: string;
    date: string;
    cameraPosition: Vector3;
    panCenter: Vector3;
    ground: GroundModel;
    latitude: number;
    longitude: number;
    address: string;
    timesPerHour: number;

    constructor() {

        this.latitude = 42.2844063;
        this.longitude = -71.3488548;
        this.address = 'Natick, MA';
        this.date = new Date(2021, 5, 22, 12).toString();

        this.name = 'default';
        this.ground = {
            albedo: 0.3,
            thermalDiffusivity: 0.05,
            snowReflectionFactors: new Array(12).fill(0)
        };
        this.panCenter = new Vector3(0, 0, 0);
        this.cameraPosition = new Vector3(0, 0, 5);

        this.timesPerHour = 20; // how many times per hour to collect data

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
            id: short.generate() as string
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
            id: short.generate() as string
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
            id: short.generate() as string,
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
            id: short.generate() as string,
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
            rotation: [0, Math.PI / 3, 0],
            id: short.generate() as string
        } as FoundationModel;
        elements.push(e1);
        elements.push(e2);
        elements.push(e3);
        elements.push(e4);
        elements.push(e5);

        const h1 = {
            type: ObjectType.Human,
            name: HumanName.Jack,
            cx: 4,
            cy: 4,
            normal: [1, 0, 0],
            rotation: [0, 0, 0],
            id: short.generate() as string
        } as HumanModel;
        const h2 = {
            type: ObjectType.Human,
            name: HumanName.Jill,
            cx: 5,
            cy: 5,
            normal: [1, 0, 0],
            rotation: [0, 0, 0],
            id: short.generate() as string
        } as HumanModel;
        elements.push(h1);
        elements.push(h2);

        const tree1 = {
            type: ObjectType.Tree,
            name: 'Dogwood',
            evergreen: false,
            cx: -5,
            cy: -6,
            lx: 3,
            lz: 4,
            normal: [1, 0, 0],
            rotation: [0, 0, 0],
            id: short.generate() as string
        } as TreeModel;
        const tree2 = {
            type: ObjectType.Tree,
            name: 'Pine',
            evergreen: true,
            cx: -5,
            cy: 5,
            lx: 2,
            lz: 6,
            normal: [1, 0, 0],
            rotation: [0, 0, 0],
            id: short.generate() as string
        } as TreeModel;
        elements.push(tree1);
        elements.push(tree2);

        return elements;
    }

}
