/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
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
import * as Constants from '../constants';
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
import { useStore } from 'src/stores/common';
import { RoofUtil } from '../views/roof/RoofUtil';
import { BatteryStorageModel } from './BatteryStorageModel';
import { SolarWaterHeaterModel } from './SolarWaterHeaterModel';
import { RulerModel } from './RulerModel';
import { ProtractorModel } from './ProtractorModel';

export class ElementModelFactory {
  static makeHuman(name: HumanName, parentId: string, x: number, y: number, z?: number) {
    return {
      type: ObjectType.Human,
      name: name ?? Constants.DEFAULT_HUMAN_NAME,
      cx: x,
      cy: y,
      cz: z,
      lx: HumanData.fetchWidth(name ?? Constants.DEFAULT_HUMAN_NAME),
      lz: HumanData.fetchHeight(name ?? Constants.DEFAULT_HUMAN_NAME),
      normal: [0, 1, 0],
      rotation: [0, 0, 0],
      parentId: parentId,
      id: short.generate() as string,
    } as HumanModel;
  }

  static makeTree(type: TreeType, spread: number, height: number, parentId: string, x: number, y: number, z?: number) {
    return {
      type: ObjectType.Tree,
      name: type ?? Constants.DEFAULT_TREE_TYPE,
      cx: x,
      cy: y,
      cz: z,
      lx: spread ?? Constants.DEFAULT_TREE_SPREAD,
      lz: height ?? Constants.DEFAULT_TREE_HEIGHT,
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
    const sp = {
      type: ObjectType.SolarPanel,
      pvModelName: pvModel.name,
      trackerType: TrackerType.NO_TRACKER,
      relativeAzimuth: relativeAzimuth ?? Constants.DEFAULT_SOLAR_COLLECTOR_RELATIVE_AZIMUTH,
      tiltAngle: tiltAngle ?? Constants.DEFAULT_SOLAR_COLLECTOR_TILT_ANGLE,
      orientation: orientation ?? Orientation.landscape,
      drawSunBeam: false,
      poleHeight: poleHeight ?? Constants.DEFAULT_SOLAR_PANEL_POLE_HEIGHT,
      poleRadius: Constants.DEFAULT_SOLAR_PANEL_POLE_RADIUS,
      poleSpacing: poleSpacing ?? Constants.DEFAULT_SOLAR_PANEL_POLE_SPACING,
      cx: x,
      cy: y,
      cz: z,
      lx: lx ?? (orientation === Orientation.landscape ? pvModel.length : pvModel.width),
      ly: ly ?? (orientation === Orientation.landscape ? pvModel.width : pvModel.length),
      lz: pvModel.thickness,
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: rotation ? rotation : [0, 0, 0],
      color: Constants.DEFAULT_SOLAR_PANEL_COLOR,
      frameColor: frameColor ?? Constants.DEFAULT_SOLAR_PANEL_FRAME_COLOR,
      parentType: parentType ?? parent.type,
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
      version: 1,
    } as SolarPanelModel;
    if (useStore.getState().actionState.solarPanelBatteryStorageId) {
      sp.batteryStorageId = useStore.getState().actionState.solarPanelBatteryStorageId;
    }
    return sp;
  }

  static makeSolarWaterHeater(
    parent: ElementModel,
    x: number,
    y: number,
    z: number,
    normal: Vector3,
    rotation: number[],
  ) {
    const actionState = useStore.getState().actionState;
    return {
      type: ObjectType.SolarWaterHeater,
      cx: x,
      cy: y,
      cz: z,
      lx: 2.092,
      ly: 1.558 + actionState.solarWaterHeaterTankRadius,
      lz: actionState.solarWaterHeaterHeight,
      waterTankRadius: actionState.solarWaterHeaterTankRadius,
      relativeAzimuth: actionState.solarWaterHeaterRelativeAzimuth,
      showLabel: false,
      normal: normal ? normal.toArray() : [0, 0, 1],
      rotation: rotation ? rotation : [0, 0, 0],
      color: actionState.solarWaterHeaterColor,
      parentType: parent.type,
      parentId: parent.id,
      foundationId: parent.parentId,
      id: short.generate() as string,
    } as SolarWaterHeaterModel;
  }

  static makeBatteryStorage(parent: ElementModel, x: number, y: number, z: number) {
    return {
      type: ObjectType.BatteryStorage,
      id: short.generate() as string,
      parentId: parent.id,
      foundationId: parent.id,
      cx: x,
      cy: y,
      cz: z,
      lx: 1.5,
      ly: 2,
      lz: 1.5,
      chargingEfficiency: Constants.DEFAULT_BATTERY_STORAGE_EFFICIENCY,
      dischargingEfficiency: Constants.DEFAULT_BATTERY_STORAGE_EFFICIENCY,
      normal: [0, 0, 0],
      rotation: [0, 0, 0],
      color: Constants.DEFAULT_BATTERY_STORAGE_COLOR,
    } as BatteryStorageModel;
  }

  static makeFlower(name: FlowerType, parentId: string, x: number, y: number, z?: number) {
    return {
      type: ObjectType.Flower,
      name: name ?? Constants.DEFAULT_FLOWER_TYPE,
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
      faceColors: faceColors ?? new Array(6).fill(Constants.DEFAULT_CUBOID_COLOR),
      textureTypes: faceTextures ?? new Array(6).fill(CuboidTexture.NoTexture),
      stackable: useStore.getState().actionState.cuboidStackable,
      transparency: useStore.getState().actionState.cuboidTransparency,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: Constants.GROUND_ID,
      id: short.generate() as string,
    } as CuboidModel;
  }

  static makeFoundation(x: number, y: number, height: number, color: string, texture: FoundationTexture) {
    const actionState = useStore.getState().actionState;
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
      parentId: Constants.GROUND_ID,
      color: color ?? Constants.DEFAULT_FOUNDATION_COLOR,
      textureType: texture ?? FoundationTexture.NoTexture,
      rValue: actionState.groundFloorRValue ?? Constants.DEFAULT_GROUND_FLOOR_R_VALUE,
      solarUpdraftTower: {},
      solarAbsorberPipe: {},
      solarPowerTower: {},
      hvacSystem: { ...Constants.DEFAULT_HVAC_SYSTEM },
      id: short.generate() as string,
    } as FoundationModel;
  }

  static makeRuler(point: Vector3) {
    return {
      ly: useStore.getState().actionState.rulerWidth ?? 1,
      lz: useStore.getState().actionState.rulerHeight ?? 0.1,
      type: ObjectType.Ruler,
      parentId: Constants.GROUND_ID,
      rotation: [0, 0, 0],
      color: useStore.getState().actionState.rulerColor ?? '#d3d3d3',
      leftEndPoint: { position: [point.x, point.y, point.z] },
      rightEndPoint: { position: [point.x, point.y, point.z] },
      id: short.generate() as string,
    } as RulerModel;
  }

  static makeProtractor(point: Vector3) {
    return {
      cx: point.x,
      cy: point.y,
      ly: useStore.getState().actionState.protractorLy ?? Constants.DEFAULT_PROTRACTOR_LY,
      lz: useStore.getState().actionState.protractorLz ?? Constants.DEFAULT_PROTRACTOR_LZ,
      radius: useStore.getState().actionState.protractorRadius ?? Constants.DEFAULT_PROTRACTOR_RADIUS,
      type: ObjectType.Protractor,
      parentId: Constants.GROUND_ID,
      rotation: [0, 0, 0],
      color: useStore.getState().actionState.protractorColor ?? Constants.DEFAULT_PROTRACTOR_COLOR,
      tickMarkColor:
        useStore.getState().actionState.protractorTickMarkColor ?? Constants.DEFAULT_PROTRACTOR_TICK_MARK_COLOR,
      startArmEndPoint: { position: [...point.clone().add(new Vector3(3, 0, 0))] },
      endArmEndPoint: { position: [...point.clone().add(new Vector3(0, 3, 0))] },
      id: short.generate() as string,
    } as ProtractorModel;
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
      reflectance: reflectance ?? Constants.DEFAULT_PARABOLIC_TROUGH_REFLECTANCE,
      absorptance: absorptance ?? Constants.DEFAULT_PARABOLIC_TROUGH_ABSORPTANCE,
      opticalEfficiency: opticalEfficiency ?? Constants.DEFAULT_PARABOLIC_TROUGH_OPTICAL_EFFICIENCY,
      thermalEfficiency: thermalEfficiency ?? Constants.DEFAULT_PARABOLIC_TROUGH_THERMAL_EFFICIENCY,
      moduleLength: moduleLength ?? Constants.DEFAULT_PARABOLIC_TROUGH_MODULE_LENGTH,
      latusRectum: latusRectum ?? Constants.DEFAULT_PARABOLIC_TROUGH_LATUS_RECTUM,
      relativeAzimuth: 0,
      tiltAngle: 0,
      absorberTubeRadius: Constants.DEFAULT_PARABOLIC_TROUGH_ABSORBER_TUBE_RADIUS,
      drawSunBeam: false,
      poleHeight: poleHeight ?? Constants.DEFAULT_PARABOLIC_TROUGH_POLE_HEIGHT, // extra pole height in addition to half of the width
      poleRadius: Constants.DEFAULT_PARABOLIC_TROUGH_POLE_RADIUS,
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
      reflectance: reflectance ?? Constants.DEFAULT_PARABOLIC_DISH_REFLECTANCE,
      absorptance: absorptance ?? Constants.DEFAULT_PARABOLIC_DISH_ABSORPTANCE,
      opticalEfficiency: opticalEfficiency ?? Constants.DEFAULT_PARABOLIC_DISH_OPTICAL_EFFICIENCY,
      thermalEfficiency: thermalEfficiency ?? Constants.DEFAULT_PARABOLIC_DISH_THERMAL_EFFICIENCY,
      moduleLength: 3,
      latusRectum: latusRectum ?? Constants.DEFAULT_PARABOLIC_DISH_LATUS_RECTUM,
      relativeAzimuth: 0,
      tiltAngle: 0,
      structureType: receiverStructure ?? ParabolicDishStructureType.CentralPole,
      receiverRadius: Constants.DEFAULT_PARABOLIC_DISH_RECEIVER_RADIUS,
      receiverPoleRadius: 0.1,
      drawSunBeam: false,
      poleHeight: poleHeight ?? Constants.DEFAULT_PARABOLIC_DISH_POLE_HEIGHT, // extra pole height in addition to the radius (half of lx or ly)
      poleRadius: Constants.DEFAULT_PARABOLIC_DISH_POLE_RADIUS,
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
      receiverId: receiverId ?? Constants.DEFAULT_FRESNEL_REFLECTOR_RECEIVER,
      reflectance: reflectance ?? Constants.DEFAULT_FRESNEL_REFLECTOR_REFLECTANCE,
      moduleLength: moduleLength ?? Constants.DEFAULT_FRESNEL_REFLECTOR_MODULE_LENGTH,
      relativeAzimuth: 0,
      tiltAngle: 0,
      drawSunBeam: false,
      poleHeight: poleHeight ?? Constants.DEFAULT_FRESNEL_REFLECTOR_POLE_HEIGHT, // extra pole height in addition to half of the width
      poleRadius: Constants.DEFAULT_FRESNEL_REFLECTOR_POLE_RADIUS,
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
      towerId: towerId ?? Constants.DEFAULT_HELIOSTAT_TOWER,
      reflectance: reflectance ?? Constants.DEFAULT_HELIOSTAT_REFLECTANCE,
      relativeAzimuth: 0,
      tiltAngle: 0,
      drawSunBeam: false,
      poleHeight: poleHeight ?? Constants.DEFAULT_HELIOSTAT_POLE_HEIGHT, // extra pole height in addition to half of the width or height, whichever is larger
      poleRadius: Constants.DEFAULT_HELIOSTAT_POLE_RADIUS,
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
      filled: true,
      selectedIndex: -1,
      id: short.generate() as string,
    } as PolygonModel;
  }

  static makeWall(parent: ElementModel, x: number, y: number, z?: number, normal?: Vector3) {
    const actionState = useStore.getState().actionState;
    const lz = actionState.wallHeight ?? Constants.DEFAULT_WALL_HEIGHT;
    return {
      type: ObjectType.Wall,
      cx: x,
      cy: y,
      cz: z,
      lx: 0,
      ly: actionState.wallThickness ?? 0.3,
      lz: lz,
      parapet: actionState.wallParapet,
      eavesLength: actionState.wallEavesLength ?? Constants.DEFAULT_WALL_EAVES_LENGTH,
      rValue: actionState.wallRValue ?? Constants.DEFAULT_WALL_R_VALUE,
      fill: WallFill.Full,
      leftUnfilledHeight: Constants.DEFAULT_WALL_UNFILLED_HEIGHT,
      rightUnfilledHeight: Constants.DEFAULT_WALL_UNFILLED_HEIGHT,
      leftTopPartialHeight: lz - Constants.DEFAULT_WALL_UNFILLED_HEIGHT,
      rightTopPartialHeight: lz - Constants.DEFAULT_WALL_UNFILLED_HEIGHT,
      relativeAngle: 0,
      leftPoint: [],
      rightPoint: [],
      leftJoints: [],
      rightJoints: [],
      textureType: actionState.wallTexture ?? WallTexture.Default,
      color: actionState.wallColor ?? Constants.DEFAULT_WALL_COLOR,
      volumetricHeatCapacity: actionState.wallVolumetricHeatCapacity ?? 0.5,
      wallStructure: actionState.wallStructure ?? WallStructure.Default,
      structureSpacing: actionState.wallStructureSpacing ?? Constants.DEFAULT_WALL_STRUCTURE_SPACING,
      structureWidth: actionState.wallStructureWidth ?? Constants.DEFAULT_WALL_STRUCTURE_WIDTH,
      structureColor: actionState.wallStructureColor ?? Constants.DEFAULT_WALL_STRUCTURE_COLOR,
      opacity: actionState.wallOpacity !== undefined ? actionState.wallOpacity : Constants.DEFAULT_WALL_OPACITY,
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
      lx: Constants.DEFAULT_SENSOR_LX,
      ly: Constants.DEFAULT_SENSOR_LY,
      lz: Constants.DEFAULT_SENSOR_LZ,
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
      decay: decay ?? Constants.DEFAULT_LIGHT_DECAY,
      distance: distance ?? Constants.DEFAULT_LIGHT_DISTANCE,
      intensity: intensity ?? Constants.DEFAULT_LIGHT_INTENSITY,
      color: color ?? Constants.DEFAULT_LIGHT_COLOR,
      cx: x,
      cy: y,
      cz: z,
      lx: Constants.DEFAULT_LIGHT_LX,
      ly: Constants.DEFAULT_LIGHT_LY,
      lz: Constants.DEFAULT_LIGHT_LZ,
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
      shutterColor: actionState.windowShutterColor ?? Constants.DEFAULT_WINDOW_SHUTTER_COLOR,
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
      lineWidth: 0.2,
      lineColor: '#000000',
      showLabel: false,
      color: actionState.windowColor ?? Constants.DEFAULT_WINDOW_COLOR, // frame color
      tint: actionState.windowTint ?? Constants.DEFAULT_WINDOW_TINT, // glass color
      opacity: actionState.windowOpacity !== undefined ? actionState.windowOpacity : Constants.DEFAULT_WINDOW_OPACITY,
      uValue: actionState.windowUValue ?? Constants.DEFAULT_WINDOW_U_VALUE,
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
      color: actionState.doorColor ?? Constants.DEFAULT_DOOR_COLOR,
      frameColor: actionState.doorFrameColor ?? Constants.DEFAULT_DOOR_FRAME_COLOR,
      uValue: actionState.doorUValue ?? Constants.DEFAULT_DOOR_U_VALUE,
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
      rValue: actionState.roofRValue ?? Constants.DEFAULT_ROOF_R_VALUE,
      color: actionState.roofColor ?? Constants.DEFAULT_ROOF_COLOR,
      sideColor: actionState.roofSideColor ?? Constants.DEFAULT_ROOF_SIDE_COLOR,
      textureType: actionState.roofTexture ?? RoofTexture.Default,
      roofType: RoofType.Pyramid,
      roofStructure: RoofStructure.Default,
      wallsId: [...wallsId],
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
      rValue: actionState.roofRValue ?? Constants.DEFAULT_ROOF_R_VALUE,
      color: actionState.roofColor ?? Constants.DEFAULT_ROOF_COLOR,
      sideColor: actionState.roofSideColor ?? Constants.DEFAULT_ROOF_SIDE_COLOR,
      textureType: actionState.roofTexture ?? RoofTexture.Default,
      roofType: RoofType.Gable,
      roofStructure: RoofStructure.Default,
      wallsId: [...wallsId],
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
      rValue: actionState.roofRValue ?? Constants.DEFAULT_ROOF_R_VALUE,
      color: actionState.roofColor ?? Constants.DEFAULT_ROOF_COLOR,
      sideColor: actionState.roofSideColor ?? Constants.DEFAULT_ROOF_SIDE_COLOR,
      textureType: actionState.roofTexture ?? RoofTexture.Default,
      roofType: RoofType.Hip,
      roofStructure: RoofStructure.Default,
      wallsId: [...wallsId],
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
      rValue: actionState.roofRValue ?? Constants.DEFAULT_ROOF_R_VALUE,
      color: actionState.roofColor ?? Constants.DEFAULT_ROOF_COLOR,
      sideColor: actionState.roofSideColor ?? Constants.DEFAULT_ROOF_SIDE_COLOR,
      textureType: actionState.roofTexture ?? RoofTexture.Default,
      roofType: RoofType.Gambrel,
      roofStructure: RoofStructure.Default,
      wallsId: [...wallsId],
      topRidgePoint: [0, 1],
      frontRidgePoint: [xPercent, 0.5],
      backRidgePoint: [xPercent, 0.5],
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
      rValue: actionState.roofRValue ?? Constants.DEFAULT_ROOF_R_VALUE,
      color: actionState.roofColor ?? Constants.DEFAULT_ROOF_COLOR,
      sideColor: actionState.roofSideColor ?? Constants.DEFAULT_ROOF_SIDE_COLOR,
      textureType: actionState.roofTexture ?? RoofTexture.Default,
      roofType: RoofType.Mansard,
      roofStructure: RoofStructure.Default,
      wallsId: [...wallsId],
      ridgeWidth: 1,
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
