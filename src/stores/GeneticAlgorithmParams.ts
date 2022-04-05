/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { GeneticAlgorithmSearchMethod, GeneticAlgorithmSelectionMethod, ObjectiveFunctionType } from '../types';

export interface GeneticAlgorithmParams {
  solution: string;
  objectiveFunctionType: ObjectiveFunctionType;
  selectionMethod: GeneticAlgorithmSelectionMethod;
  searchMethod: GeneticAlgorithmSearchMethod;
  populationSize: number;
  maximumGenerations: number;
  mutationRate: number;
  convergenceThreshold: number;
  localSearchRadius: number;
}
