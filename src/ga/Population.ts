/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 * This class implements simple genetic algorithm (SGA) and micro genetic algorithm (MGA).
 */

import { Individual } from './Individual';
import { GeneticSelectionMethod } from '../types';

export class Population {
  individuals: Individual[];
  savedGeneration: Individual[];
  violations: boolean[];
  beta: number;
  survivors: Individual[];
  mutants: Individual[];
  selectionMethod: GeneticSelectionMethod = GeneticSelectionMethod.ROULETTE_WHEEL;
  convergenceThreshold: number;
  discretizationSteps: number;

  constructor(populationSize: number, chromosomeLength: number, discretizationSteps: number) {
    this.beta = 0.5;
    this.convergenceThreshold = 0.01;
    this.individuals = new Array(populationSize);
    this.savedGeneration = new Array(populationSize);
    this.violations = new Array(populationSize);
    this.survivors = [];
    this.mutants = [];
    this.discretizationSteps = discretizationSteps;
    for (let i = 0; i < this.individuals.length; i++) {
      this.individuals[i] = new Individual(chromosomeLength, true, discretizationSteps);
      this.savedGeneration[i] = new Individual(chromosomeLength, true, discretizationSteps);
      this.violations[i] = false;
    }
  }

  sort(): void {
    this.individuals.sort((a, b) => a.compare(b));
  }

  getNicheCount(selected: Individual, sigma: number): number {
    let nicheCount = 0;
    for (const i of this.individuals) {
      const r = selected.distance(i);
      let share = 0;
      if (r < sigma) {
        share = 1.0 - r / sigma;
      }
      nicheCount += share;
    }
    return nicheCount;
  }
}
