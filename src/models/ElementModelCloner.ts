/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import short from "short-uuid";
import {HumanModel} from "./HumanModel";
import {ObjectType} from "../types";
import {TreeModel} from "./TreeModel";
import {SensorModel} from "./SensorModel";
import {FoundationModel} from "./FoundationModel";
import {CuboidModel} from "./CuboidModel";
import {ElementModel} from "./ElementModel";
import {SolarPanelModel} from "./SolarPanelModel";

export class ElementModelCloner {

    static clone(e: ElementModel, x: number, y: number, z?: number) {
        switch (e.type) {
            case ObjectType.Human:
                return ElementModelCloner.cloneHuman(e as HumanModel, x, y, z);
            case ObjectType.Tree:
                return ElementModelCloner.cloneTree(e as TreeModel, x, y, z);
            case ObjectType.Sensor:
                return ElementModelCloner.cloneSensor(e as SensorModel, x, y, z);
            case ObjectType.SolarPanel:
                return ElementModelCloner.cloneSolarPanel(e as SolarPanelModel, x, y, z);
            case ObjectType.Foundation:
                return ElementModelCloner.cloneFoundation(e as FoundationModel, x, y);
            case ObjectType.Cuboid:
                return ElementModelCloner.cloneCuboid(e as CuboidModel, x, y);
        }
        return null;
    }

    private static cloneHuman(human: HumanModel, x: number, y: number, z?: number) {
        return {
            type: ObjectType.Human,
            name: human.name,
            cx: x,
            cy: y,
            cz: z,
            normal: [...human.normal],
            rotation: [...human.rotation],
            parent: human.parent,
            id: short.generate() as string
        } as HumanModel;
    }

    private static cloneTree(tree: TreeModel, x: number, y: number, z?: number) {
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
            parent: tree.parent,
            id: short.generate() as string
        } as TreeModel;
    }

    private static cloneSensor(sensor: SensorModel, x: number, y: number, z?: number) {
        return {
            type: ObjectType.Sensor,
            cx: x,
            cy: y,
            cz: z,
            lx: sensor.lx,
            ly: sensor.ly,
            lz: sensor.lz,
            showLabel: sensor.showLabel,
            normal: [...sensor.normal],
            rotation: sensor.parent ? [...sensor.parent.rotation] : [0, 0, 0],
            parent: sensor.parent,
            id: short.generate() as string
        } as SensorModel;
    }

    private static cloneSolarPanel(solarPanel: SolarPanelModel, x: number, y: number, z?: number) {
        return {
            type: ObjectType.SolarPanel,
            pvModel: {...solarPanel.pvModel},
            cx: x,
            cy: y,
            cz: z,
            lx: solarPanel.lx,
            ly: solarPanel.ly,
            lz: solarPanel.lz,
            trackerType: solarPanel.trackerType,
            tiltAngle: solarPanel.tiltAngle,
            relativeAzimuth: solarPanel.relativeAzimuth,
            orientation: solarPanel.orientation,
            poleRadius: solarPanel.poleRadius,
            poleHeight: solarPanel.poleHeight,
            poleSpacing: solarPanel.poleSpacing,
            showLabel: solarPanel.showLabel,
            normal: [...solarPanel.normal],
            rotation: solarPanel.parent ? [...solarPanel.parent.rotation] : [0, 0, 0],
            parent: solarPanel.parent,
            id: short.generate() as string
        } as SolarPanelModel;
    }

    private static cloneFoundation(foundation: FoundationModel, x: number, y: number) {
        return {
            type: ObjectType.Foundation,
            cx: x,
            cy: y,
            cz: foundation.cz,
            lx: foundation.lx,
            ly: foundation.ly,
            lz: foundation.lz,
            normal: [...foundation.normal],
            rotation: [...foundation.rotation],
            parent: foundation.parent,
            id: short.generate() as string
        } as FoundationModel;
    }

    private static cloneCuboid(cuboid: CuboidModel, x: number, y: number) {
        return {
            type: ObjectType.Cuboid,
            cx: x,
            cy: y,
            cz: cuboid.cz,
            lx: cuboid.lx,
            ly: cuboid.ly,
            lz: cuboid.lz,
            color: cuboid.color,
            normal: [...cuboid.normal],
            rotation: [...cuboid.rotation],
            parent: cuboid.parent,
            id: short.generate() as string
        } as CuboidModel;
    }

}
