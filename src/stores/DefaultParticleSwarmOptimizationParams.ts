/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { SearchMethod, ObjectiveFunctionType, DesignProblem } from '../types';
import { ParticleSwarmOptimizationParams } from './ParticleSwarmOptimizationParams';

export class DefaultParticleSwarmOptimizationParams implements ParticleSwarmOptimizationParams {
  problem: DesignProblem;
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

  constructor(problem: DesignProblem) {
    this.problem = problem;
    this.objectiveFunctionType = ObjectiveFunctionType.DAILY_TOTAL_OUTPUT;
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
