/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {HumanModel} from "./humanModel";
import {ObjectType} from "../types";
import {MathUtils} from "three";
import {TreeModel} from "./treeModel";
import {SensorModel} from "./sensorModel";

export class ElementModelCloner {

    static cloneHuman(human: HumanModel, x: number, y: number, z?: number) {
        return {
            type: ObjectType.Human,
            name: human.name,
            cx: x,
            cy: y,
            cz: z,
            normal: [...human.normal],
            rotation: [...human.rotation],
            id: MathUtils.generateUUID()
        } as HumanModel;
    }

    static cloneTree(tree: TreeModel, x: number, y: number, z?: number) {
        return {
            type: ObjectType.Tree,
            name: tree.name,
            cx: x,
            cy: y,
            cz: z,
            lx: tree.lx,
            lz: tree.lz,
            normal: [...tree.normal],
            rotation: [...tree.rotation],
            id: MathUtils.generateUUID()
        } as TreeModel;
    }

    static cloneSensor(sensor: SensorModel, x: number, y: number, z?: number) {
        return {
            type: ObjectType.Sensor,
            name: sensor.name,
            cx: x,
            cy: y,
            cz: z,
            lx: sensor.lx,
            ly: sensor.ly,
            lz: sensor.lz,
            normal: [...sensor.normal],
            id: MathUtils.generateUUID()
        } as HumanModel;
    }

}
