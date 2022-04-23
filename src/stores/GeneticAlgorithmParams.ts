/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { SearchMethod, GeneticAlgorithmSelectionMethod, ObjectiveFunctionType, DesignProblem } from '../types';

export interface GeneticAlgorithmParams {
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
}
