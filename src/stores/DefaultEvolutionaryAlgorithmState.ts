/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { EvolutionaryAlgorithmState } from './EvolutionaryAlgorithmState';
import { GeneticAlgorithmParams } from './GeneticAlgorithmParams';
import { DefaultGeneticAlgorithmParams } from './DefaultGeneticAlgorithmParams';
import { ParticleSwarmOptimizationParams } from './ParticleSwarmOptimizationParams';
import { DefaultParticleSwarmOptimizationParams } from './DefaultParticleSwarmOptimizationParams';
import { DesignProblem } from '../types';
import { immerable } from 'immer';

export class DefaultEvolutionaryAlgorithmState implements EvolutionaryAlgorithmState {
  [immerable] = true;
  geneticAlgorithmParams: GeneticAlgorithmParams;
  particleSwarmOptimizationParams: ParticleSwarmOptimizationParams;

  constructor() {
    this.geneticAlgorithmParams = new DefaultGeneticAlgorithmParams(DesignProblem.SOLAR_PANEL_TILT_ANGLE);
    this.particleSwarmOptimizationParams = new DefaultParticleSwarmOptimizationParams(
      DesignProblem.SOLAR_PANEL_TILT_ANGLE,
    );
  }
}
