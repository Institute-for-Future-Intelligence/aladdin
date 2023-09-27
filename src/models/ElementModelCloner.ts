/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import short from 'short-uuid';
import { HumanModel } from './HumanModel';
import { CuboidTexture, ObjectType } from '../types';
import { TreeModel } from './TreeModel';
import { SensorModel } from './SensorModel';
import { FoundationModel } from './FoundationModel';
import { CuboidModel } from './CuboidModel';
import { ElementModel } from './ElementModel';
import { SolarPanelModel } from './SolarPanelModel';
import { WallModel } from './WallModel';
import { WindowModel } from './WindowModel';
import { GableRoofModel, GambrelRoofModel, HipRoofModel, MansardRoofModel, RoofModel, RoofType } from './RoofModel';
import { PolygonModel } from './PolygonModel';
import { Util } from '../Util';
import { Vector3 } from 'three';
import {
  DEFAULT_CEILING_R_VALUE,
  DEFAULT_GROUND_FLOOR_R_VALUE,
  GROUND_ID,
  UNIT_VECTOR_NEG_X,
  UNIT_VECTOR_NEG_Y,
  UNIT_VECTOR_POS_X,
  UNIT_VECTOR_POS_Y,
  ZERO_TOLERANCE,
} from '../constants';
import { ParabolicTroughModel } from './ParabolicTroughModel';
import { ParabolicDishModel } from './ParabolicDishModel';
import { FresnelReflectorModel } from './FresnelReflectorModel';
import { HeliostatModel } from './HeliostatModel';
import { DoorModel } from './DoorModel';
import { WindTurbineModel } from './WindTurbineModel';
import { FlowerModel } from './FlowerModel';
import { LightModel } from './LightModel';

export class ElementModelCloner {
  static clone(
    parent: ElementModel | null,
    e: ElementModel,
    x: number,
    y: number,
    z?: number,
    noMove?: boolean,
    normal?: Vector3,
    oldParent?: ElementModel | null,
  ) {
    let clone = null;
    switch (e.type) {
      case ObjectType.Polygon:
        if (parent) {
          // must have a parent
          clone = ElementModelCloner.clonePolygon(parent, e as PolygonModel, x, y, z, noMove, normal);
        }
        break;
      case ObjectType.Sensor:
        if (parent) {
          // must have a parent
          clone = ElementModelCloner.cloneSensor(parent, e as SensorModel, x, y, z);
        }
        break;
      case ObjectType.Light:
        if (parent) {
          // must have a parent
          clone = ElementModelCloner.cloneLight(parent, e as LightModel, x, y, z);
        }
        break;
      case ObjectType.SolarPanel:
        if (parent) {
          // must have a parent
          clone = ElementModelCloner.cloneSolarPanel(parent, e as SolarPanelModel, x, y, z);
        }
        break;
      case ObjectType.ParabolicTrough:
        if (parent) {
          // must have a parent
          clone = ElementModelCloner.cloneParabolicTrough(parent, e as ParabolicTroughModel, x, y, z);
        }
        break;
      case ObjectType.ParabolicDish:
        if (parent) {
          // must have a parent
          clone = ElementModelCloner.cloneParabolicDish(parent, e as ParabolicDishModel, x, y, z);
        }
        break;
      case ObjectType.FresnelReflector:
        if (parent) {
          // must have a parent
          clone = ElementModelCloner.cloneFresnelReflector(parent, e as FresnelReflectorModel, x, y, z);
        }
        break;
      case ObjectType.Heliostat:
        if (parent) {
          // must have a parent
          clone = ElementModelCloner.cloneHeliostat(parent, e as HeliostatModel, x, y, z);
        }
        break;
      case ObjectType.WindTurbine:
        if (parent) {
          // must have a parent
          clone = ElementModelCloner.cloneWindTurbine(parent, e as WindTurbineModel, x, y, z);
        }
        break;
      case ObjectType.Wall:
        if (parent) {
          clone = ElementModelCloner.cloneWall(parent, e as WallModel, x, y, z);
        }
        break;
      case ObjectType.Window:
        if (parent) {
          // must have a parent
          clone = ElementModelCloner.cloneWindow(parent, e as WindowModel, x, y, z, oldParent);
        }
        break;
      case ObjectType.Door:
        if (parent) {
          // must have a parent
          clone = ElementModelCloner.cloneDoor(parent, e as DoorModel, x, y, z);
        }
        break;
      case ObjectType.Roof:
        if (parent) {
          // must have a parent
          clone = ElementModelCloner.cloneRoof(parent, e as RoofModel, x, y, z);
        }
        break;
      case ObjectType.Human:
        clone = ElementModelCloner.cloneHuman(e as HumanModel, x, y, z, parent);
        break;
      case ObjectType.Tree:
        clone = ElementModelCloner.cloneTree(e as TreeModel, x, y, z, parent);
        break;
      case ObjectType.Flower:
        clone = ElementModelCloner.cloneFlower(e as FlowerModel, x, y, z, parent);
        break;
      case ObjectType.Foundation:
        clone = ElementModelCloner.cloneFoundation(e as FoundationModel, x, y);
        break;
      case ObjectType.Cuboid:
        const parentId = parent ? parent.id : GROUND_ID;
        clone = ElementModelCloner.cloneCuboid(parentId, e as CuboidModel, x, y);
        break;
    }
    return clone;
  }

  private static cloneHuman(human: HumanModel, x: number, y: number, z?: number, parent?: ElementModel | null) {
    return {
      type: ObjectType.Human,
      name: human.name,
      flip: human.flip,
      cx: x,
      cy: y,
      cz: z,
      lx: human.lx,
      ly: human.ly,
      lz: human.lz,
      normal: [...human.normal],
      rotation: [...human.rotation],
      parentId: parent?.id ?? human.parentId,
      id: short.generate() as string,
    } as HumanModel;
  }

  private static cloneTree(tree: TreeModel, x: number, y: number, z?: number, parent?: ElementModel | null) {
    return {
      type: ObjectType.Tree,
      name: tree.name,
      flip: tree.flip,
      cx: x,
      cy: y,
      cz: z,
      lx: tree.lx,
      ly: tree.ly,
      lz: tree.lz,
      normal: [...tree.normal],
      rotation: [...tree.rotation],
      parentId: parent?.id ?? tree.parentId,
      id: short.generate() as string,
    } as TreeModel;
  }

  private static cloneFlower(flower: FlowerModel, x: number, y: number, z?: number, parent?: ElementModel | null) {
    return {
      type: ObjectType.Flower,
      name: flower.name,
      flip: flower.flip,
      cx: x,
      cy: y,
      cz: z,
      lx: flower.lx,
      ly: flower.ly,
      lz: flower.lz,
      normal: [...flower.normal],
      rotation: [...flower.rotation],
      parentId: parent?.id ?? flower.parentId,
      id: short.generate() as string,
    } as FlowerModel;
  }

  private static clonePolygon(
    parent: ElementModel,
    polygon: PolygonModel,
    x: number,
    y: number,
    z?: number,
    noMove?: boolean,
    normal?: Vector3,
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
    const vertices = polygon.vertices.map((v) => ({ ...v })); // deep copy;
    const pm = {
      type: ObjectType.Polygon,
      cx: x,
      cy: y,
      cz: z,
      lx: polygon.lx,
      ly: polygon.ly,
      lz: polygon.lz,
      filled: polygon.filled,
      noOutline: polygon.noOutline,
      color: polygon.color,
      lineColor: polygon.lineColor,
      lineWidth: polygon.lineWidth,
      opacity: polygon.opacity,
      textureType: polygon.textureType,
      text: polygon.text,
      fontSize: polygon.fontSize,
      fontColor: polygon.fontColor,
      normal: [...polygon.normal],
      rotation: polygon.parentId ? [...parent.rotation] : [0, 0, 0],
      vertices: vertices,
      parentId: parent.id,
      parentType: parent.type,
      foundationId: foundationId,
      id: short.generate() as string,
    } as PolygonModel;
    if (!noMove) {
      let x1 = x;
      let y1 = y;
      if (parent.type === ObjectType.Cuboid && normal) {
        if (Util.isSame(normal, UNIT_VECTOR_NEG_X)) {
          x1 = z ?? 0;
        } else if (Util.isSame(normal, UNIT_VECTOR_POS_X)) {
          x1 = -(z ?? 0);
        } else if (Util.isSame(normal, UNIT_VECTOR_NEG_Y)) {
          y1 = z ?? 0;
        } else if (Util.isSame(normal, UNIT_VECTOR_POS_Y)) {
          y1 = -(z ?? 0);
        }
        const dot = normal.dot(new Vector3().fromArray(polygon.normal));
        if (Math.abs(dot) < ZERO_TOLERANCE) {
          for (const v of pm.vertices) {
            [v.x, v.y] = [v.y, v.x];
          }
        }
      } else if (parent.type === ObjectType.Wall) {
        x1 = -x;
        y1 = -(z ?? 0);
      }
      Util.translatePolygonCenterTo(pm, x1, y1);
    }
    return pm;
  }

  private static cloneSensor(parent: ElementModel, sensor: SensorModel, x: number, y: number, z?: number) {
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
      lx: sensor.lx,
      ly: sensor.ly,
      lz: sensor.lz,
      showLabel: sensor.showLabel,
      normal: [...sensor.normal],
      rotation: sensor.parentId ? [...parent.rotation] : [0, 0, 0],
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
    } as SensorModel;
  }

  private static cloneLight(parent: ElementModel, light: LightModel, x: number, y: number, z?: number) {
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
      cx: x,
      cy: y,
      cz: z,
      lx: light.lx,
      ly: light.ly,
      lz: light.lz,
      intensity: light.intensity,
      distance: light.distance,
      decay: light.decay,
      color: light.color,
      showLabel: light.showLabel,
      normal: [...light.normal],
      rotation: light.parentId ? [...parent.rotation] : [0, 0, 0],
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
    } as LightModel;
  }

  private static cloneSolarPanel(parent: ElementModel, solarPanel: SolarPanelModel, x: number, y: number, z?: number) {
    let foundationId;
    let parentType;
    switch (parent.type) {
      case ObjectType.Foundation:
      case ObjectType.Cuboid:
        foundationId = parent.id;
        parentType = parent.type;
        break;
      case ObjectType.Wall:
        foundationId = parent.parentId;
        parentType = ObjectType.Wall;
        break;
      case ObjectType.Roof:
        parentType = ObjectType.Roof;
        foundationId = parent.parentId;
        break;
    }
    let rotation;
    if (solarPanel.parentType === ObjectType.Roof) {
      rotation = [...solarPanel.rotation];
    } else {
      rotation = solarPanel.parentId ? [...parent.rotation] : [0, 0, 0];
    }
    return {
      type: ObjectType.SolarPanel,
      pvModelName: solarPanel.pvModelName,
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
      rotation: rotation,
      parentType: parentType,
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
    } as SolarPanelModel;
  }

  private static cloneParabolicTrough(
    parent: ElementModel,
    trough: ParabolicTroughModel,
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
      type: ObjectType.ParabolicTrough,
      cx: x,
      cy: y,
      cz: z,
      lx: trough.lx,
      ly: trough.ly,
      lz: trough.lz,
      reflectance: trough.reflectance,
      absorptance: trough.absorptance,
      opticalEfficiency: trough.opticalEfficiency,
      thermalEfficiency: trough.thermalEfficiency,
      absorberTubeRadius: trough.absorberTubeRadius,
      moduleLength: trough.moduleLength,
      latusRectum: trough.latusRectum,
      tiltAngle: trough.tiltAngle,
      relativeAzimuth: trough.relativeAzimuth,
      poleRadius: trough.poleRadius,
      poleHeight: trough.poleHeight,
      showLabel: trough.showLabel,
      normal: [...trough.normal],
      rotation: trough.parentId ? [...parent.rotation] : [0, 0, 0],
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
    } as ParabolicTroughModel;
  }

  private static cloneParabolicDish(parent: ElementModel, dish: ParabolicDishModel, x: number, y: number, z?: number) {
    let foundationId;
    switch (parent.type) {
      case ObjectType.Foundation:
        foundationId = parent.id;
        break;
    }
    return {
      type: ObjectType.ParabolicDish,
      cx: x,
      cy: y,
      cz: z,
      lx: dish.lx,
      ly: dish.ly,
      lz: dish.lz,
      reflectance: dish.reflectance,
      absorptance: dish.absorptance,
      opticalEfficiency: dish.opticalEfficiency,
      thermalEfficiency: dish.thermalEfficiency,
      receiverRadius: dish.receiverRadius,
      structureType: dish.structureType,
      latusRectum: dish.latusRectum,
      tiltAngle: dish.tiltAngle,
      relativeAzimuth: dish.relativeAzimuth,
      poleRadius: dish.poleRadius,
      poleHeight: dish.poleHeight,
      showLabel: dish.showLabel,
      normal: [...dish.normal],
      rotation: dish.parentId ? [...parent.rotation] : [0, 0, 0],
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
    } as ParabolicDishModel;
  }

  private static cloneFresnelReflector(
    parent: ElementModel,
    reflector: FresnelReflectorModel,
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
      type: ObjectType.FresnelReflector,
      cx: x,
      cy: y,
      cz: z,
      lx: reflector.lx,
      ly: reflector.ly,
      lz: reflector.lz,
      reflectance: reflector.reflectance,
      moduleLength: reflector.moduleLength,
      tiltAngle: reflector.tiltAngle,
      relativeAzimuth: reflector.relativeAzimuth,
      poleRadius: reflector.poleRadius,
      poleHeight: reflector.poleHeight,
      showLabel: reflector.showLabel,
      normal: [...reflector.normal],
      rotation: reflector.parentId ? [...parent.rotation] : [0, 0, 0],
      parentId: parent.id,
      receiverId: reflector.receiverId,
      foundationId: foundationId,
      id: short.generate() as string,
    } as FresnelReflectorModel;
  }

  private static cloneHeliostat(parent: ElementModel, heliostat: HeliostatModel, x: number, y: number, z?: number) {
    let foundationId;
    switch (parent.type) {
      case ObjectType.Foundation:
        foundationId = parent.id;
        break;
    }
    return {
      type: ObjectType.Heliostat,
      cx: x,
      cy: y,
      cz: z,
      lx: heliostat.lx,
      ly: heliostat.ly,
      lz: heliostat.lz,
      reflectance: heliostat.reflectance,
      tiltAngle: heliostat.tiltAngle,
      relativeAzimuth: heliostat.relativeAzimuth,
      poleRadius: heliostat.poleRadius,
      poleHeight: heliostat.poleHeight,
      showLabel: heliostat.showLabel,
      normal: [...heliostat.normal],
      rotation: heliostat.parentId ? [...parent.rotation] : [0, 0, 0],
      parentId: parent.id,
      towerId: heliostat.towerId,
      foundationId: foundationId,
      id: short.generate() as string,
    } as HeliostatModel;
  }

  private static cloneWindTurbine(
    parent: ElementModel,
    windTurbine: WindTurbineModel,
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
      cx: x,
      cy: y,
      cz: z,
      lx: windTurbine.lx,
      ly: windTurbine.ly,
      lz: windTurbine.lz,
      bladeRadius: windTurbine.bladeRadius,
      towerRadius: windTurbine.towerRadius,
      towerHeight: windTurbine.towerHeight,
      showLabel: windTurbine.showLabel,
      normal: [...windTurbine.normal],
      rotation: windTurbine.parentId ? [...parent.rotation] : [0, 0, 0],
      parentId: parent.id,
      foundationId: foundationId,
      id: short.generate() as string,
    } as WindTurbineModel;
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
      parentId: foundation.parentId,
      color: foundation.color,
      textureType: foundation.textureType,
      solarStructure: foundation.solarStructure,
      solarUpdraftTower: { ...foundation.solarUpdraftTower },
      solarAbsorberPipe: { ...foundation.solarAbsorberPipe },
      solarPowerTower: { ...foundation.solarPowerTower },
      hvacSystem: { ...foundation.hvacSystem },
      labelHeight: foundation.labelHeight,
      labelSize: foundation.labelSize,
      showLabel: foundation.showLabel,
      rValue: foundation.rValue ?? DEFAULT_GROUND_FLOOR_R_VALUE,
      id: short.generate() as string,
    } as FoundationModel;
  }

  private static cloneCuboid(parentId: string, cuboid: CuboidModel, x: number, y: number) {
    return {
      type: ObjectType.Cuboid,
      cx: x,
      cy: y,
      cz: cuboid.cz,
      lx: cuboid.lx,
      ly: cuboid.ly,
      lz: cuboid.lz,
      color: cuboid.color,
      faceColors: cuboid.faceColors ? [...cuboid.faceColors] : ['gray', 'gray', 'gray', 'gray', 'gray', 'gray'],
      textureTypes: cuboid.textureTypes
        ? [...cuboid.textureTypes]
        : [
            CuboidTexture.NoTexture,
            CuboidTexture.NoTexture,
            CuboidTexture.NoTexture,
            CuboidTexture.NoTexture,
            CuboidTexture.NoTexture,
            CuboidTexture.NoTexture,
          ],
      normal: [...cuboid.normal],
      rotation: [...cuboid.rotation],
      stackable: cuboid.stackable,
      enableGroupMaster: cuboid.enableGroupMaster,
      parentId: parentId,
      id: short.generate() as string,
    } as CuboidModel;
  }

  private static cloneWall(parent: ElementModel, wall: WallModel, x: number, y: number, z?: number) {
    return {
      type: ObjectType.Wall,
      cx: x,
      cy: y,
      cz: z,
      lx: wall.lx,
      ly: wall.ly,
      lz: wall.lz,
      parapet: { ...wall.parapet },
      eavesLength: wall.eavesLength ?? 0,
      rValue: wall.rValue,
      volumetricHeatCapacity: wall.volumetricHeatCapacity,
      fill: wall.fill,
      leftUnfilledHeight: wall.leftUnfilledHeight,
      rightUnfilledHeight: wall.rightUnfilledHeight,
      leftTopPartialHeight: wall.leftTopPartialHeight,
      rightTopPartialHeight: wall.rightTopPartialHeight,
      leftJoints: [],
      rightJoints: [],
      leftPoint: [...wall.leftPoint],
      rightPoint: [...wall.rightPoint],
      relativeAngle: wall.relativeAngle,
      textureType: wall.textureType,
      color: wall.color,
      normal: [...wall.normal],
      rotation: [...wall.rotation],
      id: short.generate() as string,
      parentId: parent.id,
      foundationId: parent.id,
      wallStructure: wall.wallStructure,
      structureSpacing: wall.structureSpacing,
      structureColor: wall.structureColor,
      structureWidth: wall.structureWidth,
      opacity: wall.opacity,
      roofId: wall.roofId,
      leftRoofHeight: wall.leftRoofHeight,
      rightRoofHeight: wall.rightRoofHeight,
      centerRoofHeight: wall.centerRoofHeight,
      centerLeftRoofHeight: wall.centerLeftRoofHeight,
      centerRightRoofHeight: wall.centerRightRoofHeight,
    } as WallModel;
  }

  private static cloneWindow(
    parent: ElementModel,
    window: WindowModel,
    x: number,
    y: number,
    z?: number,
    oldParent?: ElementModel | null,
  ) {
    let foundationId;
    let [lx, ly, lz] = [window.lx, parent.ly, window.lz];
    let cy = 0.1;
    let rotation = [...window.rotation];
    switch (parent.type) {
      case ObjectType.Cuboid:
        foundationId = parent.id;
        break;
      case ObjectType.Wall:
        foundationId = parent.parentId;
        rotation = [0, -1, 0];
        break;
      case ObjectType.Roof:
        foundationId = parent.parentId;
        cy = y;
        ly = (parent as RoofModel).thickness;
        break;
    }

    // copy to wall
    if (parent.type === ObjectType.Wall) {
      lx = window.lx / parent.lx;
      lz = window.lz / parent.lz;
    }
    return {
      type: ObjectType.Window,
      cx: x,
      cy: cy,
      cz: z,
      lx: lx,
      ly: ly,
      lz: lz,
      uValue: window.uValue,
      horizontalMullion: window.horizontalMullion,
      verticalMullion: window.verticalMullion,
      mullionWidth: window.mullionWidth,
      horizontalMullionSpacing: window.horizontalMullionSpacing,
      verticalMullionSpacing: window.verticalMullionSpacing,
      mullionColor: window.mullionColor,
      frame: window.frame,
      frameWidth: window.frameWidth,
      sillWidth: window.sillWidth,
      windowType: window.windowType,
      archHeight: window.archHeight,
      color: window.color,
      normal: [0, 0, 0],
      rotation: rotation,
      id: short.generate() as string,
      parentId: parent.id,
      foundationId: foundationId,
      tint: window.tint,
      opacity: window.opacity,
      leftShutter: window.leftShutter,
      rightShutter: window.rightShutter,
      shutterColor: window.shutterColor,
      shutterWidth: window.shutterWidth,
      empty: window.empty,
      interior: window.interior,
      parentType: parent.type,
      polygonTop: window.polygonTop,
    } as WindowModel;
  }

  private static cloneDoor(parent: ElementModel, door: DoorModel, x: number, y: number, z?: number) {
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
      type: ObjectType.Door,
      cx: x,
      cy: door.cy,
      cz: door.cz,
      lx: door.lx,
      ly: door.ly,
      lz: door.lz,
      color: door.color,
      frameColor: door.frameColor,
      opacity: door.opacity,
      uValue: door.uValue,
      volumetricHeatCapacity: door.volumetricHeatCapacity,
      textureType: door.textureType,
      filled: door.filled,
      interior: door.interior,
      doorType: door.doorType,
      archHeight: door.archHeight,
      normal: [...door.normal],
      rotation: [...door.rotation],
      id: short.generate() as string,
      parentId: parent.id,
      foundationId: foundationId,
    } as DoorModel;
  }

  private static cloneRoof(parent: ElementModel, roof: RoofModel, x: number, y: number, z?: number) {
    const newRoof = {
      id: short.generate() as string,
      type: ObjectType.Roof,
      cx: x,
      cy: y,
      cz: z,
      lx: roof.lx,
      ly: roof.ly,
      lz: roof.lz,
      ceiling: roof.ceiling,
      rise: roof.rise,
      color: roof.color,
      rValue: roof.rValue,
      ceilingRValue: roof.ceilingRValue ?? DEFAULT_CEILING_R_VALUE,
      volumetricHeatCapacity: roof.volumetricHeatCapacity,
      sideColor: roof.sideColor,
      normal: [...roof.normal],
      rotation: [...roof.rotation],
      parentId: parent.id,
      foundationId: parent.id,
      roofType: roof.roofType,
      roofStructure: roof.roofStructure,
      rafterColor: roof.rafterColor,
      rafterSpacing: roof.rafterSpacing,
      rafterWidth: roof.rafterWidth,
      textureType: roof.textureType,
      thickness: roof.thickness,
      wallsId: [...roof.wallsId], // handled in common store
      opacity: roof.opacity,
      glassTint: roof.glassTint,
    } as RoofModel;
    switch (roof.roofType) {
      case RoofType.Gable:
        (newRoof as GableRoofModel).ridgeLeftPoint = [...(roof as GableRoofModel).ridgeLeftPoint];
        (newRoof as GableRoofModel).ridgeRightPoint = [...(roof as GableRoofModel).ridgeRightPoint];
        break;
      case RoofType.Gambrel:
        const newGambrelRoof = newRoof as GambrelRoofModel;
        const oldGambrelRoof = roof as GambrelRoofModel;
        newGambrelRoof.topRidgePoint = [...oldGambrelRoof.topRidgePoint];
        newGambrelRoof.frontRidgePoint = [...oldGambrelRoof.frontRidgePoint];
        newGambrelRoof.backRidgePoint = [...oldGambrelRoof.backRidgePoint];
        break;
      case RoofType.Hip:
        (newRoof as HipRoofModel).rightRidgeLength = (roof as HipRoofModel).rightRidgeLength;
        (newRoof as HipRoofModel).leftRidgeLength = (roof as HipRoofModel).leftRidgeLength;
        break;
      case RoofType.Mansard:
        (newRoof as MansardRoofModel).ridgeWidth = (roof as MansardRoofModel).ridgeWidth;
        break;
    }
    return newRoof as ElementModel;
  }
}
