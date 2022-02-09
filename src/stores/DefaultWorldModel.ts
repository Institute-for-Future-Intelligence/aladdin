/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from '../models/ElementModel';
import { Discretization, FoundationTexture, HumanName, ObjectType } from '../types';
import { FoundationModel } from '../models/FoundationModel';
import { SensorModel } from '../models/SensorModel';
import { WorldModel } from '../models/WorldModel';
import { GroundModel } from '../models/GroundModel';
import { HumanModel } from '../models/HumanModel';
import short from 'short-uuid';
import { GROUND_ID } from '../constants';
import { HumanData } from '../HumanData';

// default scene

export class DefaultWorldModel implements WorldModel {
  name: string;
  date: string;
  ground: GroundModel;
  latitude: number;
  longitude: number;
  address: string;
  airAttenuationCoefficient: number;
  timesPerHour: number;
  solarPanelGridCellSize: number;
  discretization: Discretization;
  solarPanelVisibilityGridCellSize: number;
  solarRadiationHeatmapGridCellSize: number;

  cspTimesPerHour: number;
  cspGridCellSize: number;

  constructor() {
    this.latitude = 42.2844063;
    this.longitude = -71.3488548;
    this.address = 'Natick, MA';
    this.date = new Date(new Date().getFullYear(), 5, 22, 12).toString();

    this.name = 'default';
    this.ground = {
      albedo: 0.3,
      thermalDiffusivity: 0.05,
      snowReflectionFactors: new Array(12).fill(0),
    } as GroundModel;

    this.airAttenuationCoefficient = 0.01;

    this.timesPerHour = 4; // how many times per hour to collect data
    this.solarPanelGridCellSize = 0.5;
    this.discretization = Discretization.APPROXIMATE;
    this.solarPanelVisibilityGridCellSize = 0.2;
    this.solarRadiationHeatmapGridCellSize = 0.5;

    this.cspTimesPerHour = 4;
    this.cspGridCellSize = 0.5;
  }

  getElements() {
    const elements: ElementModel[] = [];

    const foundation = {
      type: ObjectType.Foundation,
      cx: 0,
      cy: 0,
      cz: 0.05,
      lx: 10,
      ly: 10,
      lz: 0.1,
      normal: [0, 0, 1],
      rotation: [0, 0, 0],
      parentId: GROUND_ID,
      textureType: FoundationTexture.NoTexture,
      id: short.generate() as string,
    } as FoundationModel;
    elements.push(foundation);

    const sensor = {
      type: ObjectType.Sensor,
      cx: -0.1,
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
    elements.push(sensor);

    const woman = {
      type: ObjectType.Human,
      name: HumanName.Jill,
      cx: 1,
      cy: -1,
      cz: 0,
      lx: HumanData.fetchWidth(HumanName.Jill),
      lz: HumanData.fetchHeight(HumanName.Jill),
      normal: [1, 0, 0],
      rotation: [0, 0, 0],
      parentId: GROUND_ID,
      id: short.generate() as string,
    } as HumanModel;
    elements.push(woman);

    return elements;
  }
}
