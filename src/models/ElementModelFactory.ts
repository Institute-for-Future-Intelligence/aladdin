/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { HumanName, ObjectType, Orientation, TrackerType, TreeType } from '../types';
import short from 'short-uuid';
import { Vector3 } from 'three';
import { GroundModel } from './GroundModel';
import { ElementModel } from './ElementModel';
import { HumanModel } from './HumanModel';
import { TreeModel } from './TreeModel';
import { SensorModel } from './SensorModel';
import { CuboidModel } from './CuboidModel';
import { FoundationModel } from './FoundationModel';
import { SolarPanelModel } from './SolarPanelModel';
import { PvModel } from './PvModel';
import { WallModel } from './WallModel';
import { RoofModel } from './RoofModel';

export class ElementModelFactory {
  static makeHuman(parent: GroundModel, x: number, y: number, z?: number) {
    return {
      type: ObjectType.Human,
      name: HumanName.Jack,
      cx: x,
      cy: y,
      cz: z,
      normal: [0, 1, 0],
      rotation: [0, 0, 0],
      parent: parent,
      id: short.generate() as string,
    } as HumanModel;
  }

  static makeTree(parent: GroundModel, x: number, y: number, z?: number) {
    return {
      type: ObjectType.Tree,
      name: TreeType.Dogwood,
      cx: x,
      cy: y,
      cz: z,
      lx: 3,
      lz: 4,
      normal: [0, 1, 0],
      rotation: [0, 0, 0],
      parent: parent,
      id: short.generate() as string,
    } as TreeModel;
  }

  static makeSensor(parent: ElementModel, x: number, y: number, z?: number, normal?: Vector3, rotation?: []) {
    return {
      type: ObjectType.Sensor,
      cx: x,
      cy: y,
      cz: z,
      lx: 0.1,
      ly: 0.1,
      lz: 0.01,
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: rotation ? rotation : [0, 0, 0],
      parent: parent,
      id: short.generate() as string,
    } as SensorModel;
  }

  static makeSolarPanel(
    parent: ElementModel,
    pvModel: PvModel,
    x: number,
    y: number,
    z?: number,
    normal?: Vector3,
    rotation?: [],
  ) {
    return {
      type: ObjectType.SolarPanel,
      pvModel: pvModel,
      trackerType: TrackerType.NO_TRACKER,
      relativeAzimuth: 0,
      tiltAngle: 0,
      orientation: Orientation.portrait,
      drawSunBeam: false,
      poleHeight: 1,
      poleRadius: 0.05,
      poleSpacing: 3,
      cx: x,
      cy: y,
      cz: z,
      lx: pvModel.width,
      ly: pvModel.length,
      lz: pvModel.thickness,
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: rotation ? rotation : [0, 0, 0],
      parent: parent,
      id: short.generate() as string,
    } as SolarPanelModel;
  }

  static makeCuboid(parent: GroundModel, x: number, y: number) {
    return {
      type: ObjectType.Cuboid,
      cx: x,
      cy: y,
      cz: 2,
      lx: 2,
      ly: 2,
      lz: 4,
      color: 'gray',
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parent: parent,
      id: short.generate() as string,
    } as CuboidModel;
  }

  static makeFoundation(parent: GroundModel, x: number, y: number) {
    return {
      type: ObjectType.Foundation,
      cx: x,
      cy: y,
      cz: 0.05,
      lx: 4,
      ly: 4,
      lz: 0.1,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parent: parent,
      id: short.generate() as string,
    } as FoundationModel;
  }

  static makeWall(parent: ElementModel, x: number, y: number, z?: number, normal?: Vector3, rotation?: []) {
    return {
      type: ObjectType.Wall,
      cx: x,
      cy: y,
      cz: z,
      lx: 0,
      ly: 0.5,
      lz: 8,
      relativeAngle: 0,
      leftPoint: [],
      rightPoint: [],
      leftJoints: [],
      rightJoints: [],
      windows: [],
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: [0, 0, 0],
      parent: parent,
      id: short.generate() as string,
    } as WallModel;
  }

  static makeWindow(parent: ElementModel, x: number, y: number, z?: number, normal?: Vector3, rotation?: []) {
    return {
      type: ObjectType.Window,
      cx: x,
      cy: y,
      cz: z,
      lx: 1.5,
      ly: parent.ly,
      lz: 1.5,
      selected: false,
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: rotation ? rotation : [0, 0, 0],
      parent: parent,
      id: short.generate() as string,
    } as SensorModel;
  }

  static makeRoof(cz: number, parent: ElementModel, points: number[][], normal?: Vector3, rotation?: []) {
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: cz,
      lx: 0,
      ly: 0,
      lz: 0.25,
      points: points,
      selected: false,
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: rotation ? rotation : [0, 0, 0],
      parent: parent,
      id: short.generate() as string,
    } as RoofModel;
  }
}
