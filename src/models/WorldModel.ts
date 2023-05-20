/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { GroundModel } from './GroundModel';
import { Discretization, DiurnalTemperatureModel } from '../types';

export interface WorldModel {
  name: string;
  date: string;
  latitude: number;
  longitude: number;
  address: string;
  countryCode: string;
  ground: GroundModel;
  diurnalTemperatureModel: DiurnalTemperatureModel;

  // for northern hemisphere, date > leafDate1 && date < leafDate2 is the leaf season
  // for southern hemisphere, date < leafDate1 || date > leafDate2 is the leaf season
  leafDayOfYear1?: number;
  leafDayOfYear2?: number;

  // the minutes of the day when the air temperature reaches the highest
  highestTemperatureTimeInMinutes: number;

  // Linear attenuation coefficient (µ) is a constant that describes the fraction of attenuated
  // incident photons in a light beam per unit thickness of a material. It includes all possible
  // interactions including coherent scatter, Compton scatter, and photoelectric effect for the
  // entire spectrum of sunlight (IR, VL, and UV). Its unit is m^-1. This is used in CSP
  // simulations to account for the loss in reflecting sunlight to a receiver.
  airAttenuationCoefficient: number;

  // 2.5-20 W/(m^2*K) of air: https://en.wikipedia.org/wiki/Heat_transfer_coefficient
  // The heat transfer coefficient in thermodynamics is the proportionality constant between the heat flux and the
  // thermodynamic driving force for the flow of heat (i.e., the temperature difference, ΔT).
  // The default value is 5 W/(m^2*K).
  airConvectiveCoefficient: number;

  timesPerHour: number;
  daysPerYear: number;
  dustLoss: number;
  solarRadiationHeatmapGridCellSize: number;
  pvGridCellSize: number;
  discretization: Discretization;
  solarPanelVisibilityGridCellSize: number;

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
}
