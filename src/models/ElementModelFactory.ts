/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {HumanModel} from "./HumanModel";
import {HumanName, ObjectType, TreeType} from "../types";
import {TreeModel} from "./TreeModel";
import {SensorModel} from "./SensorModel";
import {CuboidModel} from "./CuboidModel";
import short from "short-uuid";

export class ElementModelFactory {

    static makeHuman(x: number, y: number, z?: number) {
        return {
            type: ObjectType.Human,
            name: HumanName.Jack,
            cx: x,
            cy: y,
            cz: z,
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
            id: short.generate() as string
        } as TreeModel;
    }

    static makeSensor(x: number, y: number, z?: number) {
        return {
            type: ObjectType.Sensor,
            cx: x,
            cy: y,
            cz: z,
            lx: 0.05,
            ly: 0.05,
            lz: 0.01,
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
            id: short.generate() as string
        } as CuboidModel;
    }

}
