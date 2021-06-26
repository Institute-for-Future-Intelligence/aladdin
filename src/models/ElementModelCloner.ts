/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {HumanModel} from "./HumanModel";
import {ObjectType} from "../types";
import {MathUtils} from "three";
import {TreeModel} from "./TreeModel";
import {SensorModel} from "./SensorModel";
import {FoundationModel} from "./FoundationModel";
import {CuboidModel} from "./CuboidModel";

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

    static cloneFoundation(foundation: FoundationModel, x: number, y: number) {
        return {
            type: ObjectType.Foundation,
            cx: x,
            cy: y,
            lx: foundation.lx,
            ly: foundation.ly,
            lz: foundation.lz,
            normal: [...foundation.normal],
            rotation: [...foundation.rotation],
            id: MathUtils.generateUUID()
        } as FoundationModel;
    }

    static cloneCuboid(cuboid: CuboidModel, x: number, y: number) {
        return {
            type: ObjectType.Cuboid,
            cx: x,
            cy: y,
            cz: cuboid.cz,
            lx: cuboid.lx,
            ly: cuboid.ly,
            lz: cuboid.lz,
            normal: [...cuboid.normal],
            rotation: [...cuboid.rotation],
            id: MathUtils.generateUUID()
        } as CuboidModel;
    }

}
