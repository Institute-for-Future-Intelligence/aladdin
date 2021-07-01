/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import short from "short-uuid";
import {HumanModel} from "./HumanModel";
import {HumanName, ObjectType, TreeType} from "../types";
import {TreeModel} from "./TreeModel";
import {SensorModel} from "./SensorModel";
import {CuboidModel} from "./CuboidModel";
import {FoundationModel} from "./FoundationModel";
import {ElementModel} from "./ElementModel";

export class ElementModelFactory {

    static makeHuman(x: number, y: number, z?: number) {
        return {
            type: ObjectType.Human,
            name: HumanName.Jack,
            cx: x,
            cy: y,
            cz: z,
            normal: [0, 0, 1],
            rotation: [0, 0, 0],
            id: short.generate() as string
        } as HumanModel;
    }

    static makeTree(x: number, y: number, z?: number) {
        return {
            type: ObjectType.Tree,
            name: TreeType.Dogwood,
            cx: x,
            cy: y,
            cz: z,
            lx: 3,
            lz: 4,
            normal: [0, 0, 1],
            rotation: [0, 0, 0],
            id: short.generate() as string
        } as TreeModel;
    }

    static makeSensor(parent: ElementModel | undefined, x: number, y: number, z?: number) {
        return {
            type: ObjectType.Sensor,
            cx: x,
            cy: y,
            cz: z,
            lx: 0.1,
            ly: 0.1,
            lz: 0.01,
            showLabel: true,
            normal: [0, 1, 0],
            rotation: [0, 0, 0],
            parent: parent,
            id: short.generate() as string
        } as SensorModel;
    }

    static makeCuboid(x: number, y: number) {
        return {
            type: ObjectType.Cuboid,
            cx: x,
            cy: y,
            cz: 2,
            lx: 2,
            ly: 2,
            lz: 4,
            normal: [0, 1, 0],
            rotation: [0, 0, 0],
            id: short.generate() as string
        } as CuboidModel;
    }

    static makeFoundation(x: number, y: number) {
        return {
            type: ObjectType.Foundation,
            cx: x,
            cy: y,
            cz: 0.05,
            lx: 4,
            ly: 4,
            lz: 0.1,
            normal: [0, 1, 0],
            rotation: [0, 0, 0],
            id: short.generate() as string
        } as FoundationModel;
    }

}
