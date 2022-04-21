/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { EvolutionaryAlgorithmState } from './EvolutionaryAlgorithmState';
import { GeneticAlgorithmParams } from './GeneticAlgorithmParams';
import { DefaultGeneticAlgorithmParams } from './DefaultGeneticAlgorithmParams';
import { ParticleSwarmOptimizationParams } from './ParticleSwarmOptimizationParams';
import { DefaultParticleSwarmOptimizationParams } from './DefaultParticleSwarmOptimizationParams';

export class DefaultEvolutionaryAlgorithmState implements EvolutionaryAlgorithmState {
  solarPanelTiltAngleGeneticAlgorithmParams: GeneticAlgorithmParams;
  solarPanelTiltAngleParticleSwarmOptimizationParams: ParticleSwarmOptimizationParams;

  constructor() {
    this.solarPanelTiltAngleGeneticAlgorithmParams = new DefaultGeneticAlgorithmParams('Solar Panel Tilt Angle');
    this.solarPanelTiltAngleParticleSwarmOptimizationParams = new DefaultParticleSwarmOptimizationParams(
      'Solar Panel Tilt Angle',
    );
  }
}
