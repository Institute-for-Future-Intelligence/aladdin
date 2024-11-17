/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import {
  BirdSafeDesign,
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
import { WallFill, WallModel, WallStructure } from './WallModel';
import {
  GableRoofModel,
  GambrelRoofModel,
  HipRoofModel,
  MansardRoofModel,
  PyramidRoofModel,
  RoofModel,
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
import { FlowerData } from '../FlowerData';
import { LightModel } from './LightModel';
import { HvacSystem } from './HvacSystem';
import { useStore } from 'src/stores/common';
import { RoofUtil } from '../views/roof/RoofUtil';
import { BatteryStorageModel } from './BatteryStorageModel';
import { WaterHeaterModel } from './WaterHeaterModel';

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

  static makeTree(type: TreeType, spread: number, height: number, parentId: string, x: number, y: number, z?: number) {
    return {
      type: ObjectType.Tree,
      name: type ?? TreeType.Dogwood,
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
    frameColor?: string,
    lx?: number,
    ly?: number,
    parentType?: ObjectType,
  ) {
    let foundationId;
    switch (parent.type) {
      case ObjectType.Foundation:
        foundationId = parent.id;
        parentType = ObjectType.Foundation;
        break;
      case ObjectType.Cuboid:
        foundationId = parent.id;
        parentType = ObjectType.Cuboid;
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
      lx: lx ?? (orientation === Orientation.landscape ? pvModel.length : pvModel.width),
      ly: ly ?? (orientation === Orientation.landscape ? pvModel.width : pvModel.length),
      lz: pvModel.thickness,
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: rotation ? rotation : [0, 0, 0],
      color: '#fff',
      frameColor: frameColor ?? 'white',
      parentType: parentType ?? parent.type,
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
      version: 1,
    } as SolarPanelModel;
  }

  static makeWaterHeater(parent: ElementModel, x: number, y: number, z: number, normal: Vector3, rotation: number[]) {
    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.WaterHeater,
      cx: x,
      cy: y,
      cz: z,
      lx: 2.092,
      ly: 1.558 + actionState.waterHeaterTankRadius,
      lz: actionState.waterHeaterHeight,
      waterTankRadius: actionState.waterHeaterTankRadius,
      relativeAzimuth: actionState.waterHeaterRelativeAzimuth,
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: rotation ? rotation : [0, 0, 0],
      color: actionState.waterHeaterColor,
      parentType: parent.type,
      parentId: parent.id,
      foundationId: parent.parentId,
      id: short.generate() as string,
    } as WaterHeaterModel;
  }

  static makeBatteryStorage(parent: ElementModel, x: number, y: number, z: number) {
    return {
      type: ObjectType.BatteryStorage,
      id: short.generate() as string,
      parentId: parent.id,
      foundationId: parent.parentId,
      cx: x,
      cy: y,
      cz: z,
      lx: 1,
      ly: 0.35,
      lz: 1.6,
      normal: [0, -1, 0],
      rotation: [0, 0, 0],
      color: '#C7BABE',
    } as BatteryStorageModel;
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
      color: '#808080',
      faceColors: faceColors ?? ['#808080', '#808080', '#808080', '#808080', '#808080', '#808080'],
      textureTypes: faceTextures ?? [
        CuboidTexture.NoTexture,
        CuboidTexture.NoTexture,
        CuboidTexture.NoTexture,
        CuboidTexture.NoTexture,
        CuboidTexture.NoTexture,
        CuboidTexture.NoTexture,
      ],
      stackable: useStore.getState().actionState.cuboidStackable,
      transparency: useStore.getState().actionState.cuboidTransparency,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: GROUND_ID,
      selected: false,
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
      selected: false,
      color: color ?? '#808080',
      textureType: texture ?? FoundationTexture.NoTexture,
      solarUpdraftTower: {},
      solarAbsorberPipe: {},
      solarPowerTower: {},
      hvacSystem: { thermostatSetpoint: 20 } as HvacSystem,
      id: short.generate() as string,
    } as FoundationModel;
  }

  static makeParabolicTrough(
    parent: ElementModel,
    reflectance: number,
    absorptance: number,
    opticalEfficiency: number,
    thermalEfficiency: number,
    latusRectum: number,
    poleHeight: number,
    moduleLength: number,
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
      reflectance: reflectance ?? 0.9,
      absorptance: absorptance ?? 0.95,
      opticalEfficiency: opticalEfficiency ?? 0.7,
      thermalEfficiency: thermalEfficiency ?? 0.3,
      moduleLength: moduleLength ?? 3,
      latusRectum: latusRectum ?? 2,
      relativeAzimuth: 0,
      tiltAngle: 0,
      absorberTubeRadius: 0.05,
      drawSunBeam: false,
      poleHeight: poleHeight ?? 0.2, // extra pole height in addition to half of the width
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
    reflectance: number,
    absorptance: number,
    opticalEfficiency: number,
    thermalEfficiency: number,
    latusRectum: number,
    poleHeight: number,
    receiverStructure: ParabolicDishStructureType,
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
      reflectance: reflectance ?? 0.9,
      absorptance: absorptance ?? 0.95,
      opticalEfficiency: opticalEfficiency ?? 0.7,
      thermalEfficiency: thermalEfficiency ?? 0.3,
      moduleLength: 3,
      latusRectum: latusRectum ?? 8,
      relativeAzimuth: 0,
      tiltAngle: 0,
      structureType: receiverStructure ?? ParabolicDishStructureType.CentralPole,
      receiverRadius: 0.25,
      receiverPoleRadius: 0.1,
      drawSunBeam: false,
      poleHeight: poleHeight ?? 0.2, // extra pole height in addition to the radius (half of lx or ly)
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
    receiverId: string,
    reflectance: number,
    poleHeight: number,
    moduleLength: number,
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
      receiverId: receiverId ?? 'None',
      reflectance: reflectance ?? 0.9,
      moduleLength: moduleLength ?? 3,
      relativeAzimuth: 0,
      tiltAngle: 0,
      drawSunBeam: false,
      poleHeight: poleHeight ?? 0.2, // extra pole height in addition to half of the width
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

  static makeWindTurbine(
    parent: ElementModel,
    birdSafe: BirdSafeDesign,
    bladeColor: string,
    stripeColor: string,
    numberOfBlades: number,
    initialRotorAngle: number,
    relativeYawAngle: number,
    pitchAngle: number,
    bladeRadius: number,
    bladeRootRadius: number,
    maximumChordLength: number,
    maximumChordRadius: number,
    towerRadius: number,
    towerHeight: number,
    hubRadius: number,
    hubLength: number,
    x: number,
    y: number,
    z?: number,
  ) {
    let foundationId;
    switch (parent.type) {
      case ObjectType.Foundation:
        foundationId = parent.id;
        break;
    }
    return {
      type: ObjectType.WindTurbine,
      birdSafe,
      bladeColor,
      stripeColor,
      numberOfBlades,
      initialRotorAngle,
      relativeYawAngle,
      pitchAngle,
      bladeRadius,
      bladeTipWidth: 0.2,
      bladeRootRadius,
      maximumChordRadius,
      maximumChordLength,
      towerRadius,
      towerHeight,
      hubRadius,
      hubLength,
      cx: x, // relative
      cy: y, // relative
      cz: z, // absolute
      lx: towerRadius * 4,
      ly: towerRadius * 4,
      lz: towerHeight + bladeRadius,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
    } as WindTurbineModel;
  }

  static makeHeliostat(
    parent: ElementModel,
    towerId: string,
    reflectance: number,
    poleHeight: number,
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
      towerId: towerId ?? 'None',
      reflectance: reflectance ?? 0.9,
      relativeAzimuth: 0,
      tiltAngle: 0,
      drawSunBeam: false,
      poleHeight: poleHeight ?? 0.2, // extra pole height in addition to half of the width or height, whichever is larger
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

  static makePolygon(
    parent: ElementModel,
    x: number,
    y: number,
    z: number,
    normal?: Vector3,
    rotation?: number[],
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
    } else if (parent.type === ObjectType.Wall) {
      ry = z;
    }
    return {
      type: ObjectType.Polygon,
      cx: rx,
      cy: ry,
      cz: 0,
      lx: 2 * hx,
      ly: 2 * hy,
      lz: 2 * hz,
      color: '#ffffff',
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: rotation ? rotation : [0, 0, 0],
      vertices: [
        { x: Math.max(-0.5, rx - hx), y: Math.max(-0.5, ry - hy) } as Point2,
        { x: Math.max(-0.5, rx - hx), y: Math.min(0.5, ry + hy) } as Point2,
        { x: Math.min(0.5, rx + hx), y: Math.min(0.5, ry + hy) } as Point2,
        { x: Math.min(0.5, rx + hx), y: Math.max(-0.5, ry - hy) } as Point2,
      ],
      parentId: parent.id,
      parentType: parentType,
      foundationId: foundationId,
      selected: false,
      filled: true,
      selectedIndex: -1,
      id: short.generate() as string,
    } as PolygonModel;
  }

  static makeWall(parent: ElementModel, x: number, y: number, z?: number, normal?: Vector3) {
    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.Wall,
      cx: x,
      cy: y,
      cz: z,
      lx: 0,
      ly: actionState.wallThickness ?? 0.3,
      lz: actionState.wallHeight ?? 5,
      parapet: actionState.wallParapet,
      eavesLength: actionState.wallEavesLength ?? 0.3,
      rValue: actionState.wallRValue ?? 3,
      fill: WallFill.Full,
      leftUnfilledHeight: 0.5,
      rightUnfilledHeight: 0.5,
      leftTopPartialHeight: actionState.wallHeight - 0.5,
      rightTopPartialHeight: actionState.wallHeight - 0.5,
      relativeAngle: 0,
      leftPoint: [],
      rightPoint: [],
      leftJoints: [],
      rightJoints: [],
      textureType: actionState.wallTexture ?? WallTexture.Default,
      color: actionState.wallColor ?? '#ffffff',
      volumetricHeatCapacity: actionState.wallVolumetricHeatCapacity ?? 0.5,
      wallStructure: actionState.wallStructure ?? WallStructure.Default,
      studSpacing: actionState.wallStructureSpacing ?? 2,
      studWidth: actionState.wallStructureWidth ?? 0.1,
      studColor: actionState.wallStructureColor ?? '#ffffff',
      opacity: actionState.wallOpacity !== undefined ? actionState.wallOpacity : 0.5,
      selected: false,
      lineWidth: 0.2,
      lineColor: '#000000',
      windows: [],
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: parent.id,
      foundationId: parent.id,
      id: short.generate() as string,
    } as WallModel;
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
      parentType: parent.type,
      id: short.generate() as string,
    } as SensorModel;
  }

  static makeLight(
    parent: ElementModel,
    decay: number,
    distance: number,
    intensity: number,
    color: string,
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
      type: ObjectType.Light,
      decay: decay ?? 2,
      distance: distance ?? 5,
      intensity: intensity ?? 3,
      color: color ?? '#ffff99',
      cx: x,
      cy: y,
      cz: z,
      lx: 0.16,
      ly: 0.16,
      lz: 0.08,
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: rotation ? rotation : [0, 0, 0],
      parentId: parent.id,
      foundationId: foundationId,
      parentType: parent.type,
      id: short.generate() as string,
    } as LightModel;
  }

  static makeWindow(
    parent: ElementModel,
    cx: number,
    cy: number,
    cz: number,
    parentType: ObjectType,
    rotation?: number[],
    lx = 0,
    lz = 0,
  ) {
    let foundationId;
    let ly = 0;
    switch (parent.type) {
      case ObjectType.Cuboid:
        foundationId = parent.id;
        break;
      case ObjectType.Wall:
        foundationId = parent.parentId;
        ly = parent.ly;
        break;
      case ObjectType.Roof:
        foundationId = parent.parentId;
        ly = (parent as RoofModel).thickness;
        break;
    }
    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.Window,
      cx: cx,
      cy: cy,
      cz: cz,
      lx: lx,
      ly: ly,
      lz: lz,
      leftShutter: actionState.windowShutterLeft,
      rightShutter: actionState.windowShutterRight,
      shutterColor: actionState.windowShutterColor,
      shutterWidth: actionState.windowShutterWidth,
      horizontalMullion: actionState.windowHorizontalMullion,
      verticalMullion: actionState.windowVerticalMullion,
      mullionWidth: actionState.windowMullionWidth,
      horizontalMullionSpacing: actionState.windowHorizontalMullionSpacing,
      verticalMullionSpacing: actionState.windowVerticalMullionSpacing,
      mullionColor: actionState.windowMullionColor,
      frame: actionState.windowFrame,
      frameWidth: actionState.windowFrameWidth,
      sillWidth: RoofUtil.isTypeRoof(parentType) ? 0 : actionState.windowSillWidth,
      windowType: actionState.windowType,
      empty: actionState.windowEmpty,
      interior: actionState.windowInterior,
      archHeight: actionState.windowArchHeight,
      selected: false,
      lineWidth: 0.2,
      lineColor: '#000000',
      showLabel: false,
      color: actionState.windowColor ?? '#ffffff', // frame color
      tint: actionState.windowTint ?? '#73D8FF', // glass color
      opacity: actionState.windowOpacity !== undefined ? actionState.windowOpacity : 0.5,
      uValue: actionState.windowUValue ?? 0.5,
      normal: [0, -1, 0],
      rotation: rotation ? [...rotation] : [0, 0, 0],
      parentId: parent.id,
      parentType: parentType,
      foundationId: foundationId,
      id: short.generate() as string,
    } as WindowModel;
  }

  static makeDoor(parent: ElementModel) {
    let foundationId;
    switch (parent.type) {
      case ObjectType.Cuboid:
        foundationId = parent.id;
        break;
      case ObjectType.Wall:
        foundationId = parent.parentId;
        break;
    }
    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.Door,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      doorType: actionState.doorType,
      filled: actionState.doorFilled,
      interior: actionState.doorInterior,
      archHeight: actionState.doorArchHeight,
      textureType: actionState.doorTexture ?? DoorTexture.Default,
      color: actionState.doorColor ?? '#ffffff',
      uValue: actionState.doorUValue ?? 0.5,
      selected: false,
      lineWidth: 0.2,
      lineColor: '#000000',
      showLabel: false,
      normal: [0, 1, 0],
      rotation: [0, 0, 0],
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
    } as DoorModel;
  }

  static makePyramidRoof(wallsId: string[], parent: ElementModel) {
    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      ceiling: actionState.roofCeiling ?? false,
      rise: actionState.roofRise < 0 ? 2 : actionState.roofRise,
      thickness: actionState.roofThickness ?? 0.2,
      rValue: actionState.roofRValue ?? 3,
      color: actionState.roofColor ?? '#454769',
      sideColor: actionState.roofSideColor ?? '#ffffff',
      textureType: actionState.roofTexture ?? RoofTexture.Default,
      roofType: RoofType.Pyramid,
      roofStructure: RoofStructure.Default,
      wallsId: [...wallsId],
      selected: false,
      lineWidth: 0.2,
      lineColor: '#000000',
      showLabel: false,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: parent.id,
      foundationId: parent.id,
      id: short.generate() as string,
    } as PyramidRoofModel;
  }

  static makeGableRoof(wallsId: string[], parent: ElementModel) {
    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      ceiling: actionState.roofCeiling ?? false,
      rise: actionState.roofRise < 0 ? 2 : actionState.roofRise,
      thickness: actionState.roofThickness ?? 0.2,
      rValue: actionState.roofRValue ?? 3,
      color: actionState.roofColor ?? '#454769',
      sideColor: actionState.roofSideColor ?? '#ffffff',
      textureType: actionState.roofTexture ?? RoofTexture.Default,
      roofType: RoofType.Gable,
      roofStructure: RoofStructure.Default,
      wallsId: [...wallsId],
      selected: false,
      lineWidth: 0.2,
      lineColor: '#000000',
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

  static makeHipRoof(wallsId: string[], parent: ElementModel, ridgeLength: number) {
    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      ceiling: actionState.roofCeiling ?? false,
      rise: actionState.roofRise < 0 ? 2 : actionState.roofRise,
      thickness: actionState.roofThickness ?? 0.2,
      rValue: actionState.roofRValue ?? 3,
      color: actionState.roofColor ?? '#454769',
      sideColor: actionState.roofSideColor ?? '#ffffff',
      textureType: actionState.roofTexture ?? RoofTexture.Default,
      roofType: RoofType.Hip,
      roofStructure: RoofStructure.Default,
      wallsId: [...wallsId],
      selected: false,
      lineWidth: 0.2,
      lineColor: '#000000',
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

  static makeGambrelRoof(wallsId: string[], parent: ElementModel) {
    const xPercent = 0.35;
    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      ceiling: actionState.roofCeiling ?? false,
      rise: actionState.roofRise < 0 ? 2 : actionState.roofRise,
      thickness: actionState.roofThickness ?? 0.2,
      rValue: actionState.roofRValue ?? 3,
      color: actionState.roofColor ?? '#454769',
      sideColor: actionState.roofSideColor ?? '#ffffff',
      textureType: actionState.roofTexture ?? RoofTexture.Default,
      roofType: RoofType.Gambrel,
      roofStructure: RoofStructure.Default,
      wallsId: [...wallsId],
      topRidgePoint: [0, 1],
      frontRidgePoint: [xPercent, 0.5],
      backRidgePoint: [xPercent, 0.5],
      selected: false,
      lineWidth: 0.2,
      lineColor: '#000000',
      showLabel: false,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: parent.id,
      foundationId: parent.id,
      id: short.generate() as string,
    } as GambrelRoofModel;
  }

  static makeMansardRoof(wallsId: string[], parent: ElementModel) {
    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.Roof,
      cx: 0,
      cy: 0,
      cz: 0,
      lx: 0,
      ly: 0,
      lz: 0,
      ceiling: actionState.roofCeiling ?? false,
      rise: actionState.roofRise < 0 ? 2 : actionState.roofRise,
      thickness: actionState.roofThickness ?? 0.2,
      rValue: actionState.roofRValue ?? 3,
      color: actionState.roofColor ?? '#454769',
      sideColor: actionState.roofSideColor ?? '#ffffff',
      textureType: actionState.roofTexture ?? RoofTexture.Default,
      roofType: RoofType.Mansard,
      roofStructure: RoofStructure.Default,
      wallsId: [...wallsId],
      ridgeWidth: 1,
      selected: false,
      lineWidth: 0.2,
      lineColor: '#000000',
      showLabel: false,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: parent.id,
      foundationId: parent.id,
      id: short.generate() as string,
    } as MansardRoofModel;
  }
}
