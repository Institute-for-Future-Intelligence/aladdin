/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { SearchMethod, GeneticAlgorithmSelectionMethod, ObjectiveFunctionType } from '../types';

export interface GeneticAlgorithmParams {
  solution: string;
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
