/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
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

export class ElementModelCloner {
  static clone(parent: ElementModel | null, e: ElementModel, x: number, y: number, z?: number) {
    let clone = null;
    switch (e.type) {
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
      case ObjectType.Wall:
        clone = ElementModelCloner.cloneWall(e as WallModel, x, y, z);
        break;
      case ObjectType.Window:
        if (parent) {
          // must have a parent
          clone = ElementModelCloner.cloneWindow(parent, e as WindowModel, x, y, z);
        }
        break;
      case ObjectType.Human:
        clone = ElementModelCloner.cloneHuman(e as HumanModel, x, y, z);
        break;
      case ObjectType.Tree:
        clone = ElementModelCloner.cloneTree(e as TreeModel, x, y, z);
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

  private static cloneHuman(human: HumanModel, x: number, y: number, z?: number) {
    return {
      type: ObjectType.Human,
      name: human.name,
      cx: x,
      cy: y,
      cz: z,
      normal: [...human.normal],
      rotation: [...human.rotation],
      parentId: human.parentId,
      id: short.generate() as string,
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
      parentId: tree.parentId,
      id: short.generate() as string,
    } as TreeModel;
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

  private static cloneWall(wall: WallModel, x: number, y: number, z?: number) {
    return {
      type: ObjectType.Wall,
      cx: x,
      cy: y,
      cz: z,
      lx: wall.lx,
      ly: wall.ly,
      lz: wall.lz,
      leftOffset: wall.leftOffset,
      rightOffset: wall.rightOffset,
      leftJoints: [...wall.leftJoints],
      rightJoints: [...wall.rightJoints],
      leftPoint: [...wall.leftPoint],
      rightPoint: [...wall.rightPoint],
      relativeAngle: wall.relativeAngle,
      textureType: wall.textureType,
      color: wall.color,
      normal: [...wall.normal],
      rotation: [...wall.rotation],
      id: short.generate() as string,
      parentId: wall.parentId,
      foundationId: wall.parentId,
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
      parentId: window.parentId,
      foundationId: foundationId,
    } as WindowModel;
  }
}
