/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { ElementModel } from '../models/ElementModel';
import { Discretization, DiurnalTemperatureModel, FoundationTexture, HumanName, ObjectType } from '../types';
import { FoundationModel } from '../models/FoundationModel';
import { SensorModel } from '../models/SensorModel';
import { WorldModel } from '../models/WorldModel';
import { GroundModel } from '../models/GroundModel';
import { HumanModel } from '../models/HumanModel';
import short from 'short-uuid';
import {
  DEFAULT_ADDRESS,
  DEFAULT_LATITUDE,
  DEFAULT_LEAF_OFF_DAY,
  DEFAULT_LEAF_OUT_DAY,
  DEFAULT_LONGITUDE,
  GROUND_ID,
} from '../constants';
import { HumanData } from '../HumanData';
import { immerable } from 'immer';

// default scene

export class DefaultWorldModel implements WorldModel {
  // Needed for immer drafting to work properly: https://immerjs.github.io/immer/docs/complex-objects
  [immerable] = true;

  name: string;
  date: string;
  ground: GroundModel;
  latitude: number;
  longitude: number;
  address: string;
  countryCode: string;
  leafDayOfYear1?: number;
  leafDayOfYear2?: number;
  airAttenuationCoefficient: number;
  airConvectiveCoefficient: number;
  timesPerHour: number;
  daysPerYear: number;
  monthlyIrradianceLosses: number[];
  pvGridCellSize: number;
  discretization: Discretization;
  diurnalTemperatureModel: DiurnalTemperatureModel;
  highestTemperatureTimeInMinutes: number;
  applyElectricityConsumptions: boolean;
  monthlyElectricityConsumptions: number[];

  solarPanelVisibilityGridCellSize: number;
  solarRadiationHeatmapGridCellSize: number;

  cspTimesPerHour: number;
  cspDaysPerYear: number;
  cspGridCellSize: number;

  sutTimesPerHour: number;
  sutDaysPerYear: number;
  sutGridCellSize: number;

  noAnimationForHeatmapSimulation: boolean;
  noAnimationForThermalSimulation: boolean;
  noAnimationForSensorDataCollection: boolean;
  noAnimationForSolarPanelSimulation: boolean;
  noAnimationForSolarUpdraftTowerSimulation: boolean;

  constructor() {
    this.latitude = DEFAULT_LATITUDE;
    this.longitude = DEFAULT_LONGITUDE;
    this.address = DEFAULT_ADDRESS;
    this.countryCode = 'US';
    this.date = new Date(new Date().getFullYear(), 5, 22, 12).toLocaleString('en-US');

    this.name = 'default';
    this.ground = {
      albedo: 0.3,
      thermalDiffusivity: 0.05,
      snowReflectionFactors: new Array(12).fill(0),
    } as GroundModel;

    // The default values are for Natick, MA
    this.leafDayOfYear1 = DEFAULT_LEAF_OUT_DAY;
    this.leafDayOfYear2 = DEFAULT_LEAF_OFF_DAY;

    this.airAttenuationCoefficient = 0.01;
    this.airConvectiveCoefficient = 5;

    this.timesPerHour = 1; // how many times per hour to collect data
    this.daysPerYear = 12; // how many days per year for sampling
    this.monthlyIrradianceLosses = new Array(12).fill(0.05);
    this.pvGridCellSize = 0.5;
    this.discretization = Discretization.APPROXIMATE;
    this.diurnalTemperatureModel = DiurnalTemperatureModel.Sinusoidal;
    this.highestTemperatureTimeInMinutes = 900; // assume it is 3pm (at 15*60 minutes)
    this.applyElectricityConsumptions = false;
    this.monthlyElectricityConsumptions = new Array(12).fill(600);

    this.solarPanelVisibilityGridCellSize = 0.2;
    this.solarRadiationHeatmapGridCellSize = 0.5;

    this.cspTimesPerHour = 1;
    this.cspDaysPerYear = 4;
    this.cspGridCellSize = 0.5;

    this.sutTimesPerHour = 1;
    this.sutDaysPerYear = 4;
    this.sutGridCellSize = 1;

    this.noAnimationForHeatmapSimulation = false;
    this.noAnimationForThermalSimulation = false;
    this.noAnimationForSensorDataCollection = false;
    this.noAnimationForSolarPanelSimulation = false;
    this.noAnimationForSolarUpdraftTowerSimulation = false;
  }

  static resetWorldModel(worldModel: WorldModel) {
    worldModel.latitude = DEFAULT_LATITUDE;
    worldModel.longitude = DEFAULT_LONGITUDE;
    worldModel.address = DEFAULT_ADDRESS;
    worldModel.countryCode = 'US';
    worldModel.date = new Date(new Date().getFullYear(), 5, 22, 12).toLocaleString('en-US');

    worldModel.name = 'default';
    worldModel.ground.albedo = 0.3;
    worldModel.ground.thermalDiffusivity = 0.05;
    worldModel.ground.snowReflectionFactors.fill(0);

    worldModel.airAttenuationCoefficient = 0.01;
    worldModel.airConvectiveCoefficient = 5;

    worldModel.timesPerHour = 1; // how many times per hour to collect data
    worldModel.daysPerYear = 12; // how many days per year for sampling
    worldModel.monthlyIrradianceLosses = new Array(12).fill(0.05);
    worldModel.pvGridCellSize = 0.5;
    worldModel.discretization = Discretization.APPROXIMATE;
    worldModel.diurnalTemperatureModel = DiurnalTemperatureModel.Sinusoidal;
    worldModel.highestTemperatureTimeInMinutes = 900;

    worldModel.solarPanelVisibilityGridCellSize = 0.2;
    worldModel.solarRadiationHeatmapGridCellSize = 0.5;

    worldModel.cspTimesPerHour = 1;
    worldModel.cspDaysPerYear = 4;
    worldModel.cspGridCellSize = 0.5;

    worldModel.sutTimesPerHour = 1;
    worldModel.sutDaysPerYear = 4;
    worldModel.sutGridCellSize = 1;

    worldModel.noAnimationForHeatmapSimulation = false;
    worldModel.noAnimationForThermalSimulation = false;
    worldModel.noAnimationForSensorDataCollection = false;
    worldModel.noAnimationForSolarPanelSimulation = false;
    worldModel.noAnimationForSolarUpdraftTowerSimulation = false;
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
    } as SensorModel;
    elements.push(sensor);

    const woman = {
      type: ObjectType.Human,
      name: HumanName.Judd,
      cx: 1,
      cy: -1,
      cz: 0,
      lx: HumanData.fetchWidth(HumanName.Jiya),
      lz: HumanData.fetchHeight(HumanName.Jiya),
      normal: [1, 0, 0],
      rotation: [0, 0, 0],
      parentId: GROUND_ID,
      id: short.generate() as string,
    } as HumanModel;
    elements.push(woman);

    return elements;
  }
}
