/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { GeneticAlgorithmState } from './GeneticAlgorithmState';
import { GeneticAlgorithmParams } from './GeneticAlgorithmParams';
import { DefaultGeneticAlgorithmParams } from './DefaultGeneticAlgorithmParams';

export class DefaultGeneticAlgorithmState implements GeneticAlgorithmState {
  solarPanelTiltAngleGeneticAlgorithmParams: GeneticAlgorithmParams;

  constructor() {
    this.solarPanelTiltAngleGeneticAlgorithmParams = new DefaultGeneticAlgorithmParams('Solar Panel Tilt Angle');
  }
}
