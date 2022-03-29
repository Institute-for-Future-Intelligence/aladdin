/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { GeneticAlgorithmMethod } from '../types';
import { FoundationModel } from '../models/FoundationModel';
import { Population } from './Population';
import { Individual } from './Individual';

export abstract class Optimizer {
  population: Population;
  minima: number[];
  maxima: number[];
  foundation: FoundationModel;
  // objectiveFunction;
  fitnessSharingRadius: number = 0.1;
  searchMethod: GeneticAlgorithmMethod = GeneticAlgorithmMethod.GLOBAL_SEARCH_UNIFORM_SELECTION;
  localSearchRadius: number = 0.1;

  //constraints;
  stop: boolean = true;
  mutationRate: number = 0.1;
  crossoverRate: number = 0.5;
  selectionRate: number = 0.5;
  maximumGenerations: number = 5;

  fittestOfGenerations: Individual[] = [];
  outsideGenerationCounter: number = 0;
  computeCounter: number = 0;
  converged: boolean = false;
  geneNames: string[];
  geneMinima: number[];
  geneMaxima: number[];
  isGeneInteger: boolean[];
  initialGene: number[];
  finalGene: number[];
  initialFitness: number = 0;
  finalFitness: number = 0;

  constructor(
    foundation: FoundationModel,
    populationSize: number,
    chromosomeLength: number,
    discretizationSteps: number,
  ) {
    this.population = new Population(populationSize, chromosomeLength, discretizationSteps);
    //constraints;
    this.geneNames = new Array<string>(chromosomeLength);
    this.geneMinima = new Array<number>(chromosomeLength);
    this.geneMaxima = new Array<number>(chromosomeLength);
    this.isGeneInteger = new Array<boolean>(chromosomeLength);
    this.initialGene = new Array<number>(chromosomeLength);
    this.finalGene = new Array<number>(chromosomeLength);
    this.isGeneInteger.fill(false);
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
  }

  setMinMax(i: number, min: number, max: number): void {
    this.minima[i] = min;
    this.maxima[i] = max;
  }
}
