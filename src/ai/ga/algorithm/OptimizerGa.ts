/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { SearchMethod, GeneticAlgorithmSelectionMethod } from '../../../types';
import { FoundationModel } from '../../../models/FoundationModel';
import { Population } from './Population';
import { Individual } from './Individual';
import { Constraint } from './Constraint';

export abstract class OptimizerGa {
  population: Population;
  convergenceThreshold: number;
  minima: number[];
  maxima: number[];
  foundation: FoundationModel;
  fitnessSharingRadius: number = 0.1;
  searchMethod: SearchMethod = SearchMethod.GLOBAL_SEARCH_UNIFORM_SELECTION;
  localSearchRadius: number = 0.1;

  constraints: Constraint[] = [];
  stopped: boolean = true;
  mutationRate: number = 0.1;
  crossoverRate: number = 0.5;
  selectionRate: number = 0.5;
  maximumGenerations: number = 5;

  fittestOfGenerations: (Individual | null)[] = [];
  populationOfGenerations: (Population | null)[] = [];
  outsideGenerationCounter: number = 0;
  computeCounter: number = 0;
  converged: boolean = false;
  geneNames: string[];

  protected constructor(
    foundation: FoundationModel,
    populationSize: number,
    maximumGenerations: number,
    chromosomeLength: number,
    selectionMethod: GeneticAlgorithmSelectionMethod,
    convergenceThreshold: number,
    searchMethod: SearchMethod,
    localSearchRadius: number,
    discretizationSteps?: number,
  ) {
    this.population = new Population(populationSize, chromosomeLength, selectionMethod, discretizationSteps);
    this.convergenceThreshold = convergenceThreshold;
    this.maximumGenerations = maximumGenerations;
    this.searchMethod = searchMethod;
    this.localSearchRadius = localSearchRadius;
    this.geneNames = new Array<string>(chromosomeLength);
    this.foundation = foundation;
    const cx = foundation.cx;
    const cy = foundation.cy;
    const lx = foundation.lx;
    const ly = foundation.ly;
    this.minima = new Array<number>(chromosomeLength);
    this.maxima = new Array<number>(chromosomeLength);
    for (let i = 0; i < chromosomeLength; i += 2) {
      this.setMinMax(i, cx - lx * 0.5, cx + lx * 0.5);
      this.setMinMax(i + 1, cy - ly * 0.5, cy + ly * 0.5);
    }
    this.fittestOfGenerations = new Array<Individual | null>(this.maximumGenerations + 1);
    this.fittestOfGenerations.fill(null);
    this.populationOfGenerations = new Array<Population | null>(this.maximumGenerations);
    for (let i = 0; i < this.maximumGenerations; i++) {
      this.populationOfGenerations[i] = new Population(
        populationSize,
        chromosomeLength,
        selectionMethod,
        convergenceThreshold,
      );
    }
  }

  setMinMax(i: number, min: number, max: number): void {
    this.minima[i] = min;
    this.maxima[i] = max;
  }

  abstract applyFittest(): void;

  stop(): void {
    this.stopped = true;
  }

  shouldTerminate(): boolean {
    return this.outsideGenerationCounter >= this.maximumGenerations;
  }
}
