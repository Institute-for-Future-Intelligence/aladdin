/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import {
  CuboidTexture,
  DoorTexture,
  FlowerType,
  FoundationTexture,
  HumanName,
  ObjectType,
  Orientation,
  ParabolicDishStructureType,
  RoofTexture,
  TrackerType,
  TreeType,
  WallTexture,
} from '../types';
import short from 'short-uuid';
import { Vector3 } from 'three';
import { ElementModel } from './ElementModel';
import { HumanModel } from './HumanModel';
import { TreeModel } from './TreeModel';
import { FlowerModel } from './FlowerModel';
import { SensorModel } from './SensorModel';
import { CuboidModel } from './CuboidModel';
import { FoundationModel } from './FoundationModel';
import { SolarPanelModel } from './SolarPanelModel';
import { PvModel } from './PvModel';
import { WallModel, WallStructure } from './WallModel';
import {
  GableRoofModel,
  GambrelRoofModel,
  HipRoofModel,
  MansardRoofModel,
  PyramidRoofModel,
  RoofStructure,
  RoofType,
} from './RoofModel';
import { GROUND_ID } from '../constants';
import { WindowModel } from './WindowModel';
import { Point2 } from './Point2';
import { PolygonModel } from './PolygonModel';
import { Util } from '../Util';
import { HumanData } from '../HumanData';
import { ParabolicTroughModel } from './ParabolicTroughModel';
import { ParabolicDishModel } from './ParabolicDishModel';
import { FresnelReflectorModel } from './FresnelReflectorModel';
import { HeliostatModel } from './HeliostatModel';
import { DoorModel } from './DoorModel';
import { WindTurbineModel } from './WindTurbineModel';
import { defaultShutter } from 'src/views/window/window';
import { FlowerData } from '../FlowerData';

export class ElementModelFactory {
  static makeHuman(name: HumanName, parentId: string, x: number, y: number, z?: number) {
    return {
      type: ObjectType.Human,
      name: name ?? HumanName.Jack,
      cx: x,
      cy: y,
      cz: z,
      lx: HumanData.fetchWidth(name ?? HumanName.Jack),
      lz: HumanData.fetchHeight(name ?? HumanName.Jack),
      normal: [0, 1, 0],
      rotation: [0, 0, 0],
      parentId: parentId,
      id: short.generate() as string,
    } as HumanModel;
  }

  static makeTree(name: TreeType, spread: number, height: number, parentId: string, x: number, y: number, z?: number) {
    return {
      type: ObjectType.Tree,
      name: name ?? TreeType.Dogwood,
      cx: x,
      cy: y,
      cz: z,
      lx: spread ?? 3,
      lz: height ?? 4,
      normal: [0, 1, 0],
      rotation: [0, 0, 0],
      parentId: parentId,
      id: short.generate() as string,
    } as TreeModel;
  }

  static makeFlower(name: FlowerType, parentId: string, x: number, y: number, z?: number) {
    return {
      type: ObjectType.Flower,
      name: name ?? FlowerType.YellowFlower,
      cx: x,
      cy: y,
      cz: z,
      lx: FlowerData.fetchSpread(name ?? FlowerType.YellowFlower),
      lz: FlowerData.fetchHeight(name ?? FlowerType.YellowFlower),
      normal: [0, 1, 0],
      rotation: [0, 0, 0],
      parentId: parentId,
      id: short.generate() as string,
    } as FlowerModel;
  }

  static makeCuboid(x: number, y: number, height: number, faceColors: string[], faceTextures: CuboidTexture[]) {
    return {
      type: ObjectType.Cuboid,
      cx: x,
      cy: y,
      cz: height ? height / 2 : 2,
      lx: 0.1,
      ly: 0.1,
      lz: height ?? 4,
      color: 'gray',
      faceColors: faceColors ?? ['gray', 'gray', 'gray', 'gray', 'gray', 'gray'],
      textureTypes: faceTextures ?? [
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

  static makeFoundation(x: number, y: number, height: number, color: string, texture: FoundationTexture) {
    return {
      type: ObjectType.Foundation,
      cx: x,
      cy: y,
      cz: height ? height / 2 : 0.05,
      lx: 0,
      ly: 0,
      lz: height ?? 0.1,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: GROUND_ID,
      selected: true,
      color: color ?? 'gray',
      textureType: texture ?? FoundationTexture.NoTexture,
      solarUpdraftTower: {},
      solarAbsorberPipe: {},
      solarPowerTower: {},
      id: short.generate() as string,
    } as FoundationModel;
  }

  static makeSolarPanel(
    parent: ElementModel,
    pvModel: PvModel,
    x: number,
    y: number,
    z?: number,
    orientation?: Orientation,
    poleHeight?: number,
    poleSpacing?: number,
    tiltAngle?: number,
    relativeAzimuth?: number,
    normal?: Vector3,
    rotation?: number[],
    lx?: number,
    ly?: number,
    parentType?: ObjectType,
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
      relativeAzimuth: relativeAzimuth ?? 0,
      tiltAngle: tiltAngle ?? 0,
      orientation: orientation ?? Orientation.landscape,
      drawSunBeam: false,
      poleHeight: poleHeight ?? 1,
      poleRadius: 0.05,
      poleSpacing: poleSpacing ?? 3,
      cx: x,
      cy: y,
      cz: z,
      lx: lx ?? orientation === Orientation.landscape ? pvModel.length : pvModel.width,
      ly: ly ?? orientation === Orientation.landscape ? pvModel.width : pvModel.length,
      lz: pvModel.thickness,
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: rotation ? rotation : [0, 0, 0],
      color: '#fff',
      parentType: parentType,
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
    } as SolarPanelModel;
  }

  static makeParabolicTrough(
    parent: ElementModel,
    x: number,
    y: number,
    z?: number,
    normal?: Vector3,
    rotation?: number[],
    lx?: number,
    ly?: number,
  ) {
    let foundationId;
    switch (parent.type) {
      case ObjectType.Foundation:
        foundationId = parent.id;
        break;
    }
    return {
      type: ObjectType.ParabolicTrough,
      reflectance: 0.9,
      absorptance: 0.95,
      opticalEfficiency: 0.7,
      thermalEfficiency: 0.3,
      moduleLength: 3,
      latusRectum: 2,
      relativeAzimuth: 0,
      tiltAngle: 0,
      absorberTubeRadius: 0.05,
      drawSunBeam: false,
      poleHeight: 0.2, // extra pole height in addition to half of the width
      poleRadius: 0.05,
      cx: x,
      cy: y,
      cz: z,
      lx: lx ?? 2,
      ly: ly ?? 9, // north-south alignment by default
      lz: 0.1,
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: rotation ? rotation : [0, 0, 0],
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
    } as ParabolicTroughModel;
  }

  static makeParabolicDish(
    parent: ElementModel,
    x: number,
    y: number,
    z?: number,
    normal?: Vector3,
    rotation?: number[],
    lx?: number,
    ly?: number,
  ) {
    let foundationId;
    switch (parent.type) {
      case ObjectType.Foundation:
        foundationId = parent.id;
        break;
    }
    return {
      type: ObjectType.ParabolicDish,
      reflectance: 0.9,
      absorptance: 0.95,
      opticalEfficiency: 0.7,
      thermalEfficiency: 0.3,
      moduleLength: 3,
      latusRectum: 8,
      relativeAzimuth: 0,
      tiltAngle: 0,
      structureType: ParabolicDishStructureType.CentralPole,
      receiverRadius: 0.25,
      receiverPoleRadius: 0.1,
      drawSunBeam: false,
      poleHeight: 0.2, // extra pole height in addition to the radius (half of lx or ly)
      poleRadius: 0.2,
      cx: x,
      cy: y,
      cz: z,
      lx: lx ?? 4, // diameter of the rim
      ly: ly ?? 4, // diameter of the rim (identical to lx)
      lz: 0.1,
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: rotation ? rotation : [0, 0, 0],
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
    } as ParabolicDishModel;
  }

  static makeFresnelReflector(
    parent: ElementModel,
    x: number,
    y: number,
    z?: number,
    normal?: Vector3,
    rotation?: number[],
    lx?: number,
    ly?: number,
  ) {
    let foundationId;
    switch (parent.type) {
      case ObjectType.Foundation:
        foundationId = parent.id;
        break;
    }
    return {
      type: ObjectType.FresnelReflector,
      reflectance: 0.9,
      moduleLength: 3,
      relativeAzimuth: 0,
      tiltAngle: 0,
      drawSunBeam: false,
      poleHeight: 0.2, // extra pole height in addition to half of the width
      poleRadius: 0.05,
      cx: x,
      cy: y,
      cz: z,
      lx: lx ?? 2,
      ly: ly ?? 9, // north-south alignment by default
      lz: 0.1,
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: rotation ? rotation : [0, 0, 0],
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
    } as FresnelReflectorModel;
  }

  static makeHeliostat(
    parent: ElementModel,
    x: number,
    y: number,
    z?: number,
    normal?: Vector3,
    rotation?: number[],
    lx?: number,
    ly?: number,
  ) {
    let foundationId;
    switch (parent.type) {
      case ObjectType.Foundation:
        foundationId = parent.id;
        break;
    }
    return {
      type: ObjectType.Heliostat,
      reflectance: 0.9,
      relativeAzimuth: 0,
      tiltAngle: 0,
      drawSunBeam: false,
      poleHeight: 0.2, // extra pole height in addition to half of the width or height, whichever is larger
      poleRadius: 0.1,
      cx: x,
      cy: y,
      cz: z,
      lx: lx ?? 2,
      ly: ly ?? 4,
      lz: 0.1,
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: rotation ? rotation : [0, 0, 0],
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
    } as HeliostatModel;
  }

  static makeWindTurbine(parentId: string, x: number, y: number, z?: number) {
    return {
      type: ObjectType.WindTurbine,
      bladeRadius: 10,
      towerRadius: 0.5,
      towerHeight: 20,
      cx: x,
      cy: y,
      cz: z,
      lx: 3,
      lz: 15,
      normal: [0, 1, 0],
      rotation: [0, 0, 0],
      parentId: parentId,
      id: short.generate() as string,
    } as WindTurbineModel;
  }

  static makePolygon(parent: ElementModel, x: number, y: number, z: number, normal?: Vector3, rotation?: number[]) {
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
    const hx = 0.2;
    const hy = 0.2;
    const hz = 0.2;
    let rx = x;
    let ry = y;
    // if the parent is a cuboid, determine the 2D coordinates within each face
    if (parent.type === ObjectType.Cuboid && normal) {
      if (Util.isUnitVectorX(normal)) {
        // west and east face
        rx = z;
      } else if (Util.isUnitVectorY(normal)) {
        // south and north face
        ry = z;
      }
    }
    return {
      type: ObjectType.Polygon,
      cx: rx,
      cy: ry,
      cz: 0,
      lx: 2 * hx,
      ly: 2 * hy,
      lz: 2 * hz,
      color: 'white',
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: rotation ? rotation : [0, 0, 0],
      vertices: [
        { x: Math.max(-0.5, rx - hx), y: Math.max(-0.5, ry - hy) } as Point2,
        { x: Math.max(-0.5, rx - hx), y: Math.min(0.5, ry + hy) } as Point2,
        { x: Math.min(0.5, rx + hx), y: Math.min(0.5, ry + hy) } as Point2,
        { x: Math.min(0.5, rx + hx), y: Math.max(-0.5, ry - hy) } as Point2,
      ],
      parentId: parent.id,
      foundationId: foundationId,
      selected: true,
      filled: true,
      selectedIndex: -1,
      id: short.generate() as string,
    } as PolygonModel;
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

  static makeWall(
    parent: ElementModel,
    height: number,
    thickness: number,
    color: string,
    texture: WallTexture,
    structure: WallStructure,
    studSpacing: number,
    studWidth: number,
    studColor: string,
    opacity: number,
    x: number,
    y: number,
    z?: number,
    normal?: Vector3,
    rotation?: number[],
  ) {
    return {
      type: ObjectType.Wall,
      cx: x,
      cy: y,
      cz: z,
      lx: 0,
      ly: thickness ?? 0.3,
      lz: height ?? 5,
      relativeAngle: 0,
      leftPoint: [],
      rightPoint: [],
      leftJoints: [],
      rightJoints: [],
      textureType: texture ?? WallTexture.Default,
      color: color ?? 'white',
      wallStructure: structure ?? WallStructure.Default,
      studSpacing: studSpacing ?? 2,
      studWidth: studWidth ?? 0.1,
      studColor: studColor ?? 'white',
      opacity: opacity ?? 0.5,
      selected: true,
      lineWidth: 0.2,
      lineColor: 'black',
      windows: [],
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: parent.id,
      foundationId: parent.id,
      id: short.generate() as string,
    } as WallModel;
  }

  static makeWindow(parent: ElementModel, cx: number, cy: number, cz?: number, normal?: Vector3, rotation?: number[]) {
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
      cx: cx,
      cy: 0.1,
      cz: cz,
      lx: 0,
      ly: parent.ly,
      lz: 0,
      shutter: defaultShutter,
      mullion: true,
      mullionWidth: 0.06,
      mullionSpacing: 1,
      selected: true,
      lineWidth: 0.2,
      lineColor: 'black',
      showLabel: false,
      color: '#73D8FF',
      tint: '#73D8FF',
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: rotation ? rotation : [0, 0, 0],
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
    } as WindowModel;
  }

  static makeDoor(parent: ElementModel, normal?: Vector3) {
    let foundationId;
    switch (parent.type) {
      case ObjectType.Cuboid:
        foundationId = parent.id;
        break;
      case ObjectType.Wall:
        foundationId = parent.parentId;
        break;
    }
    return {
      type: ObjectType.Door,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      textureType: DoorTexture.Default,
      color: 'white',
      selected: true,
      lineWidth: 0.2,
      lineColor: 'black',
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 1, 0],
      rotation: [0, 0, 0],
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
    } as DoorModel;
  }

  static makePyramidRoof(wallsId: string[], parent: ElementModel, lz: number) {
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: lz * 1.5,
      overhang: 0.3,
      thickness: 0.2,
      roofType: RoofType.Pyramid,
      roofStructure: RoofStructure.Default,
      wallsId: [...wallsId],
      textureType: RoofTexture.Default,
      color: '#454769',
      selected: false,
      lineWidth: 0.2,
      lineColor: 'black',
      showLabel: false,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: parent.id,
      foundationId: parent.id,
      id: short.generate() as string,
    } as PyramidRoofModel;
  }

  static makeGableRoof(wallsId: string[], parent: ElementModel, lz: number) {
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: lz * 1.5,
      overhang: 0.3,
      thickness: 0.2,
      roofType: RoofType.Gable,
      roofStructure: RoofStructure.Default,
      wallsId: [...wallsId],
      textureType: RoofTexture.Default,
      color: '#454769',
      selected: false,
      lineWidth: 0.2,
      lineColor: 'black',
      showLabel: false,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: parent.id,
      foundationId: parent.id,
      id: short.generate() as string,
      ridgeLeftPoint: [0, 1],
      ridgeRightPoint: [0, 1],
    } as GableRoofModel;
  }

  static makeHipRoof(wallsId: string[], parent: ElementModel, lz: number, ridgeLength: number) {
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: lz * 1.5,
      overhang: 0.3,
      thickness: 0.2,
      roofType: RoofType.Hip,
      roofStructure: RoofStructure.Default,
      wallsId: [...wallsId],
      textureType: RoofTexture.Default,
      color: '#454769',
      selected: false,
      lineWidth: 0.2,
      lineColor: 'black',
      showLabel: false,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: parent.id,
      foundationId: parent.id,
      id: short.generate() as string,
      leftRidgeLength: (ridgeLength ?? 2) / 2,
      rightRidgeLength: (ridgeLength ?? 2) / 2,
    } as HipRoofModel;
  }

  static makeGambrelRoof(wallsId: string[], parent: ElementModel, lz: number) {
    const xpercent = 0.35;
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: lz * 2,
      overhang: 0.3,
      thickness: 0.2,
      roofType: RoofType.Gambrel,
      roofStructure: RoofStructure.Default,
      wallsId: [...wallsId],
      topRidgeLeftPoint: [0, 1],
      topRidgeRightPoint: [0, 1],
      frontRidgeLeftPoint: [xpercent, 0.5],
      frontRidgeRightPoint: [-xpercent, 0.5],
      backRidgeLeftPoint: [xpercent, 0.5],
      backRidgeRightPoint: [-xpercent, 0.5],
      textureType: RoofTexture.Default,
      color: '#454769',
      selected: false,
      lineWidth: 0.2,
      lineColor: 'black',
      showLabel: false,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: parent.id,
      foundationId: parent.id,
      id: short.generate() as string,
    } as GambrelRoofModel;
  }

  static makeMansardRoof(wallsId: string[], parent: ElementModel, lz: number) {
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: lz * 1.5,
      overhang: 0.3,
      thickness: 0.2,
      roofType: RoofType.Mansard,
      roofStructure: RoofStructure.Default,
      wallsId: [...wallsId],
      ridgeWidth: 1,
      textureType: RoofTexture.Default,
      color: '#454769',
      selected: false,
      lineWidth: 0.2,
      lineColor: 'black',
      showLabel: false,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: parent.id,
      foundationId: parent.id,
      id: short.generate() as string,
    } as MansardRoofModel;
  }
}
