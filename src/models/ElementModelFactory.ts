/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { CuboidTexture, HumanName, ObjectType, Orientation, TrackerType, TreeType, WallTexture } from '../types';
import short from 'short-uuid';
import { Vector3 } from 'three';
import { ElementModel } from './ElementModel';
import { HumanModel } from './HumanModel';
import { TreeModel } from './TreeModel';
import { SensorModel } from './SensorModel';
import { CuboidModel } from './CuboidModel';
import { FoundationModel } from './FoundationModel';
import { SolarPanelModel } from './SolarPanelModel';
import { PvModel } from './PvModel';
import { WallModel } from './WallModel';
import { RoofModel, RoofPoint } from './RoofModel';
import { GROUND_ID } from '../constants';
import { WindowModel } from './WindowModel';

export class ElementModelFactory {
  static makeHuman(x: number, y: number, z?: number) {
    return {
      type: ObjectType.Human,
      name: HumanName.Jack,
      cx: x,
      cy: y,
      cz: z,
      normal: [0, 1, 0],
      rotation: [0, 0, 0],
      parentId: GROUND_ID,
      id: short.generate() as string,
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
      normal: [0, 1, 0],
      rotation: [0, 0, 0],
      parentId: GROUND_ID,
      id: short.generate() as string,
    } as TreeModel;
  }

  static makeCuboid(x: number, y: number) {
    return {
      type: ObjectType.Cuboid,
      cx: x,
      cy: y,
      cz: 2,
      lx: 0.1,
      ly: 0.1,
      lz: 4,
      color: 'gray',
      faceColors: ['gray', 'gray', 'gray', 'gray', 'gray', 'gray'],
      textureTypes: [
        CuboidTexture.NoTexture,
        CuboidTexture.NoTexture,
        CuboidTexture.NoTexture,
        CuboidTexture.NoTexture,
        CuboidTexture.NoTexture,
        CuboidTexture.NoTexture,
      ],
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: GROUND_ID,
      selected: true,
      id: short.generate() as string,
    } as CuboidModel;
  }

  static makeFoundation(x: number, y: number) {
    return {
      type: ObjectType.Foundation,
      cx: x,
      cy: y,
      cz: 0.05,
      lx: 0,
      ly: 0,
      lz: 0.1,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: GROUND_ID,
      selected: true,
      id: short.generate() as string,
    } as FoundationModel;
  }

  static makeSensor(parent: ElementModel, x: number, y: number, z?: number, normal?: Vector3, rotation?: number[]) {
    let foundationId;
    switch (parent.type) {
      case ObjectType.Foundation:
      case ObjectType.Cuboid:
        foundationId = parent.id;
        break;
      case ObjectType.Wall:
      case ObjectType.Roof:
        foundationId = parent.parentId;
        break;
    }
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
      parentId: parent.id,
      foundationId: foundationId,
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
    rotation?: number[],
  ) {
    let foundationId;
    switch (parent.type) {
      case ObjectType.Foundation:
      case ObjectType.Cuboid:
        foundationId = parent.id;
        break;
      case ObjectType.Wall:
      case ObjectType.Roof:
        foundationId = parent.parentId;
        break;
    }
    return {
      type: ObjectType.SolarPanel,
      pvModelName: pvModel.name,
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
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
    } as SolarPanelModel;
  }

  static makeWall(parent: ElementModel, x: number, y: number, z?: number, normal?: Vector3, rotation?: number[]) {
    return {
      type: ObjectType.Wall,
      cx: x,
      cy: y,
      cz: z,
      lx: 0,
      ly: 0.25,
      lz: 5,
      thickness: 0.3,
      relativeAngle: 0,
      leftPoint: [],
      rightPoint: [],
      leftJoints: [],
      rightJoints: [],
      leftOffset: 0,
      rightOffset: 0,
      textureType: WallTexture.Default,
      selected: true,
      windows: [],
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: parent.id,
      foundationId: parent.id,
      id: short.generate() as string,
    } as WallModel;
  }

  static makeWindow(parent: ElementModel, x: number, y: number, z?: number, normal?: Vector3, rotation?: number[]) {
    let foundationId;
    switch (parent.type) {
      case ObjectType.Cuboid:
        foundationId = parent.id;
        break;
      case ObjectType.Wall:
      case ObjectType.Roof:
        foundationId = parent.parentId;
        break;
    }
    return {
      type: ObjectType.Window,
      cx: x,
      cy: 0,
      cz: z,
      lx: 0,
      ly: 0,
      lz: 0,
      selected: true,
      showLabel: false,
      color: '#477395',
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: rotation ? rotation : [0, 0, 0],
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
    } as WindowModel;
  }

  static makeRoof(cz: number, parent: ElementModel, points: RoofPoint[], normal?: Vector3, rotation?: number[]) {
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
      parentId: parent.id,
      foundationId: parent.id,
      id: short.generate() as string,
    } as RoofModel;
  }
}
