/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { GroundModel } from './GroundModel';
import { Discretization } from '../types';

export interface WorldModel {
  name: string;
  date: string;
  latitude: number;
  longitude: number;
  address: string;
  ground: GroundModel;

  // Linear attenuation coefficient (µ) is a constant that describes the fraction of attenuated
  // incident photons in a light beam per unit thickness of a material. It includes all possible
  // interactions including coherent scatter, Compton scatter, and photoelectric effect for the
  // entire spectrum of sunlight (IR, VL, and UV). Its unit is m^-1. This is used in CSP
  // simulations to account for the loss in reflecting sunlight to a receiver.
  airAttenuationCoefficient: number;

  timesPerHour: number;
  solarRadiationHeatmapGridCellSize: number;
  solarPanelGridCellSize: number;
  discretization: Discretization;
  solarPanelVisibilityGridCellSize: number;

  cspTimesPerHour: number;
  cspGridCellSize: number;
}
