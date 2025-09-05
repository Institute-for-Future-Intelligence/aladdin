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
import * as Constants from '../constants';
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
    this.latitude = Constants.DEFAULT_LATITUDE;
    this.longitude = Constants.DEFAULT_LONGITUDE;
    this.address = Constants.DEFAULT_ADDRESS;
    this.countryCode = Constants.DEFAULT_COUNTRY_CODE;
    this.date = new Date(new Date().getFullYear(), 5, 22, 12).toLocaleString('en-US');

    this.name = Constants.DEFAULT_NAME;
    this.ground = { ...Constants.DEFAULT_GROUND } as GroundModel;

    // The default values are for Natick, MA
    this.leafDayOfYear1 = Constants.DEFAULT_LEAF_OUT_DAY;
    this.leafDayOfYear2 = Constants.DEFAULT_LEAF_OFF_DAY;

    this.airAttenuationCoefficient = Constants.DEFAULT_AIR_ATTENUATION_COEFFICIENT;
    this.airConvectiveCoefficient = Constants.DEFAULT_AIR_CONVECTIVE_COEFFICIENT;

    this.timesPerHour = Constants.DEFAULT_TIMES_PER_HOUR; // how many times per hour to collect data
    this.daysPerYear = Constants.DEFAULT_DAYS_PER_YEAR; // how many days per year for sampling
    this.monthlyIrradianceLosses = [...Constants.DEFAULT_MONTHLY_IRRADIANCE_LOSSES];
    this.pvGridCellSize = Constants.DEFAULT_PV_GRID_CELL_SIZE;
    this.discretization = Constants.DEFAULT_DISCRETIZATION;
    this.diurnalTemperatureModel = Constants.DEFAULT_DIURNAL_TEMPERATURE_MODEL;
    this.highestTemperatureTimeInMinutes = Constants.DEFAULT_HIGHEST_TEMPERATURE_TIME_IN_MINUTES; // assume it is 3pm (at 15*60 minutes)
    this.applyElectricityConsumptions = Constants.DEFAULT_APPLY_ELECTRICITY_CONSUMPTIONS;
    this.monthlyElectricityConsumptions = [...Constants.DEFAULT_MONTHLY_ELECTRICITY_CONSUMPTIONS];

    this.solarPanelVisibilityGridCellSize = Constants.DEFAULT_SOLAR_PANEL_VISIBILITY_GRID_CELL_SIZE;
    this.solarRadiationHeatmapGridCellSize = Constants.DEFAULT_SOLAR_RADIATION_HEATMAP_GRID_CELL_SIZE;

    this.cspTimesPerHour = Constants.DEFAULT_CSP_TIMES_PER_HOUR;
    this.cspDaysPerYear = Constants.DEFAULT_CSP_DAYS_PER_YEAR;
    this.cspGridCellSize = Constants.DEFAULT_CSP_GRID_CELL_SIZE;

    this.sutTimesPerHour = Constants.DEFAULT_SUT_TIMES_PER_HOUR;
    this.sutDaysPerYear = Constants.DEFAULT_SUT_DAYS_PER_YEAR;
    this.sutGridCellSize = Constants.DEFAULT_SUT_GRID_CELL_SIZE;

    this.noAnimationForHeatmapSimulation = Constants.DEFAULT_NO_ANIMATION_FOR_HEATMAP_SIMULATION;
    this.noAnimationForThermalSimulation = Constants.DEFAULT_NO_ANIMATION_FOR_THERMAL_SIMULATION;
    this.noAnimationForSensorDataCollection = Constants.DEFAULT_NO_ANIMATION_FOR_SENSOR_DATA_COLLECTION;
    this.noAnimationForSolarPanelSimulation = Constants.DEFAULT_NO_ANIMATION_FOR_SOLAR_PANEL_SIMULATION;
    this.noAnimationForSolarUpdraftTowerSimulation = Constants.DEFAULT_NO_ANIMATION_FOR_SOLAR_UPDRAFT_TOWER_SIMULATION;
  }

  static resetWorldModel(worldModel: WorldModel) {
    worldModel.latitude = Constants.DEFAULT_LATITUDE;
    worldModel.longitude = Constants.DEFAULT_LONGITUDE;
    worldModel.address = Constants.DEFAULT_ADDRESS;
    worldModel.countryCode = Constants.DEFAULT_COUNTRY_CODE;
    worldModel.date = new Date(new Date().getFullYear(), 5, 22, 12).toLocaleString('en-US');

    worldModel.name = Constants.DEFAULT_NAME;
    worldModel.ground.albedo = Constants.DEFAULT_GROUND.albedo;
    worldModel.ground.thermalDiffusivity = Constants.DEFAULT_GROUND.thermalDiffusivity;
    worldModel.ground.snowReflectionFactors.fill(0);

    worldModel.airAttenuationCoefficient = Constants.DEFAULT_AIR_ATTENUATION_COEFFICIENT;
    worldModel.airConvectiveCoefficient = Constants.DEFAULT_AIR_CONVECTIVE_COEFFICIENT;

    worldModel.timesPerHour = Constants.DEFAULT_TIMES_PER_HOUR; // how many times per hour to collect data
    worldModel.daysPerYear = Constants.DEFAULT_DAYS_PER_YEAR; // how many days per year for sampling
    worldModel.monthlyIrradianceLosses = Constants.DEFAULT_MONTHLY_IRRADIANCE_LOSSES;
    worldModel.pvGridCellSize = Constants.DEFAULT_PV_GRID_CELL_SIZE;
    worldModel.discretization = Constants.DEFAULT_DISCRETIZATION;
    worldModel.diurnalTemperatureModel = Constants.DEFAULT_DIURNAL_TEMPERATURE_MODEL;
    worldModel.highestTemperatureTimeInMinutes = Constants.DEFAULT_HIGHEST_TEMPERATURE_TIME_IN_MINUTES;

    worldModel.solarPanelVisibilityGridCellSize = Constants.DEFAULT_SOLAR_PANEL_VISIBILITY_GRID_CELL_SIZE;
    worldModel.solarRadiationHeatmapGridCellSize = Constants.DEFAULT_SOLAR_RADIATION_HEATMAP_GRID_CELL_SIZE;

    worldModel.cspTimesPerHour = Constants.DEFAULT_CSP_TIMES_PER_HOUR;
    worldModel.cspDaysPerYear = Constants.DEFAULT_CSP_DAYS_PER_YEAR;
    worldModel.cspGridCellSize = Constants.DEFAULT_CSP_GRID_CELL_SIZE;

    worldModel.sutTimesPerHour = Constants.DEFAULT_SUT_TIMES_PER_HOUR;
    worldModel.sutDaysPerYear = Constants.DEFAULT_SUT_DAYS_PER_YEAR;
    worldModel.sutGridCellSize = Constants.DEFAULT_SUT_GRID_CELL_SIZE;

    worldModel.noAnimationForHeatmapSimulation = Constants.DEFAULT_NO_ANIMATION_FOR_HEATMAP_SIMULATION;
    worldModel.noAnimationForThermalSimulation = Constants.DEFAULT_NO_ANIMATION_FOR_THERMAL_SIMULATION;
    worldModel.noAnimationForSensorDataCollection = Constants.DEFAULT_NO_ANIMATION_FOR_SENSOR_DATA_COLLECTION;
    worldModel.noAnimationForSolarPanelSimulation = Constants.DEFAULT_NO_ANIMATION_FOR_SOLAR_PANEL_SIMULATION;
    worldModel.noAnimationForSolarUpdraftTowerSimulation =
      Constants.DEFAULT_NO_ANIMATION_FOR_SOLAR_UPDRAFT_TOWER_SIMULATION;
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
      parentId: Constants.GROUND_ID,
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
      parentId: Constants.GROUND_ID,
      id: short.generate() as string,
    } as HumanModel;
    elements.push(woman);

    return elements;
  }
}
