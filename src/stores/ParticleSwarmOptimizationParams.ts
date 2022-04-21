/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { SearchMethod, ObjectiveFunctionType } from '../types';

export interface ParticleSwarmOptimizationParams {
  solution: string;
  objectiveFunctionType: ObjectiveFunctionType;
  searchMethod: SearchMethod;
  swarmSize: number;
  maximumSteps: number;
  vmax: number;
  inertia: number;
  cognitiveCoefficient: number;
  socialCoefficient: number;
  convergenceThreshold: number;
  localSearchRadius: number;
}
