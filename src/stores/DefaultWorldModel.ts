/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from '../models/ElementModel';
import { Discretization, FoundationTexture, HumanName, ObjectType } from '../types';
import { FoundationModel } from '../models/FoundationModel';
import { CuboidModel } from '../models/CuboidModel';
import { SensorModel } from '../models/SensorModel';
import { WorldModel } from '../models/WorldModel';
import { GroundModel } from '../models/GroundModel';
import { HumanModel } from '../models/HumanModel';
import { TreeModel } from '../models/TreeModel';
import short from 'short-uuid';
import { GROUND_ID } from '../constants';

// default scene

export class DefaultWorldModel implements WorldModel {
  name: string;
  date: string;
  ground: GroundModel;
  latitude: number;
  longitude: number;
  address: string;
  timesPerHour: number;
  solarPanelGridCellSize: number;
  discretization: Discretization;

  constructor() {
    this.latitude = 42.2844063;
    this.longitude = -71.3488548;
    this.address = 'Natick, MA';
    this.date = new Date(2021, 5, 22, 12).toString();

    this.name = 'default';
    this.ground = {
      albedo: 0.3,
      thermalDiffusivity: 0.05,
      snowReflectionFactors: new Array(12).fill(0),
    } as GroundModel;

    this.timesPerHour = 4; // how many times per hour to collect data
    this.solarPanelGridCellSize = 0.5;
    this.discretization = Discretization.APPROXIMATE;
  }

  getElements() {
    const elements: ElementModel[] = [];
    const foundation = {
      type: ObjectType.Foundation,
      cx: 0,
      cy: 0,
      cz: 0.05,
      lx: 4,
      ly: 3,
      lz: 0.1,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: GROUND_ID,
      textureType: FoundationTexture.NoTexture,
      id: short.generate() as string,
    } as FoundationModel;
    const sensor = {
      type: ObjectType.Sensor,
      cx: 0,
      cy: 0,
      cz: 0.105,
      lx: 0.1,
      ly: 0.1,
      lz: 0.01,
      parentId: foundation.id,
      foundationId: foundation.id,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      id: short.generate() as string,
      showLabel: true,
      light: true,
      heatFlux: false,
    } as SensorModel;
    elements.push(foundation);
    elements.push(sensor);

    const cuboid = {
      type: ObjectType.Cuboid,
      cx: 0,
      cy: 5,
      cz: 2,
      lx: 2,
      ly: 2,
      lz: 4,
      color: 'gray',
      normal: [0, 0, 1],
      rotation: [0, 0, Math.PI / 6],
      parentId: GROUND_ID,
      id: short.generate() as string,
    } as CuboidModel;
    elements.push(cuboid);

    const man = {
      type: ObjectType.Human,
      name: HumanName.Jack,
      cx: 2,
      cy: 2,
      cz: 0,
      normal: [1, 0, 0],
      rotation: [0, 0, 0],
      parentId: GROUND_ID,
      id: short.generate() as string,
    } as HumanModel;
    const woman = {
      type: ObjectType.Human,
      name: HumanName.Jill,
      cx: -2,
      cy: 2,
      cz: 0,
      normal: [1, 0, 0],
      rotation: [0, 0, 0],
      parentId: GROUND_ID,
      id: short.generate() as string,
    } as HumanModel;
    elements.push(man);
    elements.push(woman);

    const tree1 = {
      type: ObjectType.Tree,
      name: 'Dogwood',
      evergreen: false,
      cx: 5,
      cy: 5,
      cz: 0,
      lx: 3,
      lz: 4,
      normal: [1, 0, 0],
      rotation: [0, 0, 0],
      parentId: GROUND_ID,
      id: short.generate() as string,
    } as TreeModel;
    const tree2 = {
      type: ObjectType.Tree,
      name: 'Pine',
      evergreen: true,
      cx: -5,
      cy: 5,
      cz: 0,
      lx: 2,
      lz: 6,
      normal: [1, 0, 0],
      rotation: [0, 0, 0],
      parentId: GROUND_ID,
      id: short.generate() as string,
    } as TreeModel;
    elements.push(tree1);
    elements.push(tree2);

    return elements;
  }
}
