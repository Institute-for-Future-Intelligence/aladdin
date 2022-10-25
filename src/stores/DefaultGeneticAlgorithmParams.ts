/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { GeneticAlgorithmParams } from './GeneticAlgorithmParams';
import { SearchMethod, GeneticAlgorithmSelectionMethod, ObjectiveFunctionType, DesignProblem } from '../types';
import { immerable } from 'immer';

export class DefaultGeneticAlgorithmParams implements GeneticAlgorithmParams {
  // Needed for immer drafting to work properly: https://immerjs.github.io/immer/docs/complex-objects
  [immerable] = true;

  problem: DesignProblem;
  objectiveFunctionType: ObjectiveFunctionType;
  selectionMethod: GeneticAlgorithmSelectionMethod;
  searchMethod: SearchMethod;
  populationSize: number;
  maximumGenerations: number;
  selectionRate: number;
  crossoverRate: number;
  mutationRate: number;
  convergenceThreshold: number;
  localSearchRadius: number;

  constructor(problem: DesignProblem) {
    this.problem = problem;
    this.objectiveFunctionType = ObjectiveFunctionType.DAILY_TOTAL_OUTPUT;
    this.selectionMethod = GeneticAlgorithmSelectionMethod.ROULETTE_WHEEL;
    this.searchMethod = SearchMethod.GLOBAL_SEARCH_UNIFORM_SELECTION;
    this.populationSize = 20;
    this.maximumGenerations = 5;
    this.selectionRate = 0.5;
    this.crossoverRate = 0.5;
    this.mutationRate = 0.1;
    this.convergenceThreshold = 0.01;
    this.localSearchRadius = 0.1;
  }
}
