/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import short from 'short-uuid';
import { HumanModel } from './HumanModel';
import { CuboidTexture, ObjectType, SolarReceiver } from '../types';
import { TreeModel } from './TreeModel';
import { SensorModel } from './SensorModel';
import { FoundationModel } from './FoundationModel';
import { CuboidModel } from './CuboidModel';
import { ElementModel } from './ElementModel';
import { SolarPanelModel } from './SolarPanelModel';
import { WallModel } from './WallModel';
import { WindowModel } from './WindowModel';
import { RoofModel } from './RoofModel';
import { PolygonModel } from './PolygonModel';
import { Util } from '../Util';
import { Vector3 } from 'three';
import {
  UNIT_VECTOR_NEG_X,
  UNIT_VECTOR_NEG_Y,
  UNIT_VECTOR_POS_X,
  UNIT_VECTOR_POS_Y,
  ZERO_TOLERANCE,
} from '../constants';
import { ParabolicTroughModel } from './ParabolicTroughModel';
import { ParabolicDishModel } from './ParabolicDishModel';
import { FresnelReflectorModel } from './FresnelReflectorModel';

export class ElementModelCloner {
  static clone(
    parent: ElementModel | null,
    e: ElementModel,
    x: number,
    y: number,
    z?: number,
    noMove?: boolean,
    normal?: Vector3,
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
      case ObjectType.Wall:
        if (parent) {
          clone = ElementModelCloner.cloneWall(parent, e as WallModel, x, y, z);
        }
        break;
      case ObjectType.Window:
        if (parent) {
          // must have a parent
          clone = ElementModelCloner.cloneWindow(parent, e as WindowModel, x, y, z);
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
      case ObjectType.Foundation:
        clone = ElementModelCloner.cloneFoundation(e as FoundationModel, x, y);
        break;
      case ObjectType.Cuboid:
        clone = ElementModelCloner.cloneCuboid(e as CuboidModel, x, y);
        break;
    }
    return clone;
  }

  private static cloneHuman(human: HumanModel, x: number, y: number, z?: number, parent?: ElementModel | null) {
    return {
      type: ObjectType.Human,
      name: human.name,
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
      color: polygon.color,
      lineColor: polygon.lineColor,
      lineWidth: polygon.lineWidth,
      opacity: polygon.opacity,
      textureType: polygon.textureType,
      normal: [...polygon.normal],
      rotation: polygon.parentId ? [...parent.rotation] : [0, 0, 0],
      vertices: vertices,
      parentId: parent.id,
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
            const a = v.x;
            v.x = v.y;
            v.y = a;
          }
        }
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

  private static cloneSolarPanel(parent: ElementModel, solarPanel: SolarPanelModel, x: number, y: number, z?: number) {
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
      rotation: solarPanel.parentId ? [...parent.rotation] : [0, 0, 0],
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
      foundationId: foundationId,
      id: short.generate() as string,
    } as FresnelReflectorModel;
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
      solarReceiver: foundation.solarReceiver,
      solarReceiverTubeRadius: foundation.solarReceiverTubeRadius,
      solarReceiverTubeRelativeLength: foundation.solarReceiverTubeRelativeLength,
      solarReceiverTubeMountHeight: foundation.solarReceiverTubeMountHeight,
      solarReceiverTubePoleNumber: foundation.solarReceiverTubePoleNumber,
      solarReceiverAbsorptance: foundation.solarReceiverAbsorptance,
      solarReceiverOpticalEfficiency: foundation.solarReceiverOpticalEfficiency,
      solarReceiverThermalEfficiency: foundation.solarReceiverThermalEfficiency,
      id: short.generate() as string,
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
      parentId: cuboid.parentId,
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
      leftJoints: [], // todo: should link to cloned walls
      rightJoints: [], // todo
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
    } as WallModel;
  }

  private static cloneWindow(parent: ElementModel, window: WindowModel, x: number, y: number, z?: number) {
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
      cy: y,
      cz: z,
      lx: window.lx,
      ly: window.ly,
      lz: window.lz,
      color: window.color,
      normal: [...window.normal],
      rotation: [...window.rotation],
      id: short.generate() as string,
      parentId: parent.id,
      foundationId: foundationId,
    } as WindowModel;
  }

  private static cloneRoof(parent: ElementModel, roof: RoofModel, x: number, y: number, z?: number) {
    return {
      type: ObjectType.Roof,
      cx: x,
      cy: y,
      cz: z,
      lx: roof.lx,
      ly: roof.ly,
      lz: roof.lz,
      points: [...roof.points],
      color: roof.color,
      normal: [...roof.normal],
      rotation: [...roof.rotation],
      id: short.generate() as string,
      parentId: parent.id,
      foundationId: parent.id,
    } as RoofModel;
  }
}
