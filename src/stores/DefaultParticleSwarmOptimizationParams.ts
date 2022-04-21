/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { SearchMethod, ObjectiveFunctionType } from '../types';
import { ParticleSwarmOptimizationParams } from './ParticleSwarmOptimizationParams';

export class DefaultParticleSwarmOptimizationParams implements ParticleSwarmOptimizationParams {
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

  constructor(solution: string) {
    this.solution = solution;
    this.objectiveFunctionType = ObjectiveFunctionType.DAILY_OUTPUT;
    this.searchMethod = SearchMethod.GLOBAL_SEARCH_UNIFORM_SELECTION;
    this.swarmSize = 20;
    this.maximumSteps = 5;
    this.vmax = 0.01;
    this.inertia = 0.8;
    this.cognitiveCoefficient = 0.1;
    this.socialCoefficient = 0.1;
    this.convergenceThreshold = 0.01;
    this.localSearchRadius = 0.1;
  }
}
