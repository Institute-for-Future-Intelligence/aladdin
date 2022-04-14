/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { GeneticAlgorithmParams } from './GeneticAlgorithmParams';
import { GeneticAlgorithmSearchMethod, GeneticAlgorithmSelectionMethod, ObjectiveFunctionType } from '../types';

export class DefaultGeneticAlgorithmParams implements GeneticAlgorithmParams {
  solution: string;
  objectiveFunctionType: ObjectiveFunctionType;
  selectionMethod: GeneticAlgorithmSelectionMethod;
  searchMethod: GeneticAlgorithmSearchMethod;
  populationSize: number;
  maximumGenerations: number;
  selectionRate: number;
  crossoverRate: number;
  mutationRate: number;
  convergenceThreshold: number;
  localSearchRadius: number;

  constructor(solution: string) {
    this.solution = solution;
    this.objectiveFunctionType = ObjectiveFunctionType.DAILY_OUTPUT;
    this.selectionMethod = GeneticAlgorithmSelectionMethod.ROULETTE_WHEEL;
    this.searchMethod = GeneticAlgorithmSearchMethod.GLOBAL_SEARCH_UNIFORM_SELECTION;
    this.populationSize = 20;
    this.maximumGenerations = 5;
    this.selectionRate = 0.5;
    this.crossoverRate = 0.5;
    this.mutationRate = 0.1;
    this.convergenceThreshold = 0.01;
    this.localSearchRadius = 0.1;
  }
}
