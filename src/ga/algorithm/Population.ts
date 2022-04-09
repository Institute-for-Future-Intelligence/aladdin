/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 * This class implements simple genetic algorithm (SGA).
 */

import { Individual } from './Individual';
import { GeneticAlgorithmSelectionMethod } from '../../types';
import { Parents } from './Parents';
import { Util } from '../../Util';

export class Population {
  individuals: Individual[];
  savedGeneration: Individual[];
  violations: boolean[];
  beta: number;
  survivors: Individual[];
  mutants: Individual[];
  selectionMethod: GeneticAlgorithmSelectionMethod = GeneticAlgorithmSelectionMethod.ROULETTE_WHEEL;
  convergenceThreshold: number;
  discretizationSteps: number | undefined;

  constructor(
    populationSize: number,
    chromosomeLength: number,
    selectionMethod: GeneticAlgorithmSelectionMethod,
    convergenceThreshold: number,
    discretizationSteps?: number,
  ) {
    this.beta = 0.5;
    this.selectionMethod = selectionMethod;
    this.convergenceThreshold = convergenceThreshold;
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

  // sort the fitness in the descending order (sort b before a if b's fitness is higher than a's)
  sort(): void {
    this.individuals.sort((a, b) => b.compare(a));
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

  saveGenes(): void {
    for (let i = 0; i < this.individuals.length; i++) {
      this.savedGeneration[i].copyGenes(this.individuals[i]);
      this.violations[i] = false;
    }
  }

  restoreGenes(): void {
    for (let i = 0; i < this.individuals.length; i++) {
      if (this.violations[i]) {
        this.individuals[i].copyGenes(this.savedGeneration[i]);
      }
    }
  }

  getFittest(): Individual | undefined {
    let max = -Number.MAX_VALUE;
    let best: Individual | undefined;
    for (const i of this.individuals) {
      if (isNaN(i.fitness)) {
        // fitness not computed yet, skip
        continue;
      }
      if (i.fitness > max) {
        max = i.fitness;
        best = i;
      }
    }
    return best;
  }

  /* Implement simple genetic algorithm (SGA) */

  evolve(selectionRate: number, crossoverRate: number): void {
    this.selectSurvivors(selectionRate);
    this.crossover(crossoverRate);
  }

  // select the survivors based on elitism specified by the rate of selection
  selectSurvivors(selectionRate: number): void {
    this.survivors = [];
    this.sort();
    const imax = Math.floor(selectionRate * this.individuals.length);
    for (let i = 0; i < imax; i++) {
      this.survivors.push(this.individuals[i]);
    }
  }

  // uniform crossover
  crossover(crossoverRate: number): void {
    const numberOfSurvivers = this.survivors.length;
    if (numberOfSurvivers <= 1) {
      return;
    }

    const lowestFitness = this.individuals[numberOfSurvivers].fitness;
    let sumOfFitness = 0;
    for (let i = 0; i < numberOfSurvivers; i++) {
      sumOfFitness += this.individuals[i].fitness - lowestFitness;
    }

    const newBorn = this.individuals.length - numberOfSurvivers;
    const oldFolks = new Array<Parents>();
    while (oldFolks.length * 2 < newBorn) {
      // multiplying 2 above because each couple produces two children as shown in the mating algorithm below
      let p: Parents | null = null;
      switch (this.selectionMethod) {
        case GeneticAlgorithmSelectionMethod.TOURNAMENT:
          p = this.selectParentsByTournament();
          break;
        default:
          p = this.selectParentsByRouletteWheel(lowestFitness, sumOfFitness);
      }
      if (p && !oldFolks.includes(p)) {
        oldFolks.push(p);
      }
    }

    // mating of dad and mom produces two children
    let childIndex = numberOfSurvivers;
    for (const p of oldFolks) {
      const n = p.dad.chromosome.length;
      const child1 = new Individual(n, true, this.discretizationSteps);
      const child2 = new Individual(n, true, this.discretizationSteps);
      this.beta = Math.random();
      for (let i = 0; i < n; i++) {
        const di = p.dad.getGene(i);
        const mi = p.mom.getGene(i);
        if (Math.random() < crossoverRate) {
          child1.setGene(i, this.beta * di + (1 - this.beta) * mi);
          child2.setGene(i, this.beta * mi + (1 - this.beta) * di);
        } else {
          child1.setGene(i, this.beta * mi + (1 - this.beta) * di);
          child2.setGene(i, this.beta * di + (1 - this.beta) * mi);
        }
      }
      if (childIndex < this.individuals.length) {
        this.individuals[childIndex] = child1;
      }
      if (childIndex + 1 < this.individuals.length) {
        this.individuals[childIndex + 1] = child2;
      }
      childIndex += 2;
    }
  }

  // select a parent by the roulette wheel rule (fitness proportionate selection)
  selectParentsByRouletteWheel(lowestFitness: number, sumOfFitness: number): Parents | null {
    // spin the wheel to find dad
    let dad = null;
    let roulettWheelPosition = Math.random() * sumOfFitness;
    let spinWheel = 0;
    for (const s of this.survivors) {
      spinWheel += s.fitness - lowestFitness;
      if (spinWheel >= roulettWheelPosition) {
        dad = s;
        break;
      }
    }
    // spin the wheel to find mom
    let mom = null;
    do {
      roulettWheelPosition = Math.random() * sumOfFitness;
      spinWheel = 0;
      for (const s of this.survivors) {
        spinWheel += s.fitness - lowestFitness;
        if (spinWheel >= roulettWheelPosition) {
          if (s !== dad) {
            mom = s;
          }
          break;
        }
      }
    } while (mom === null);
    if (dad && mom) return new Parents(dad, mom);
    return null;
  }

  // select a parent by tournament
  selectParentsByTournament(): Parents | null {
    const numberOfSurvivers = this.survivors.length;
    if (numberOfSurvivers <= 1) {
      throw new Error('Must have at least two survivors to be used as parents');
    }
    const n1 = numberOfSurvivers - 1;

    // find dad first
    let i = Math.floor(Math.random() * n1);
    let j;
    do {
      j = Math.floor(Math.random() * n1);
    } while (j === i);
    const d = this.survivors[i].fitness > this.survivors[j].fitness ? i : j;

    // now find mom
    i = Math.floor(Math.random() * n1);
    do {
      j = Math.floor(Math.random() * n1);
    } while (j === i);
    let m = this.survivors[i].fitness > this.survivors[j].fitness ? i : j;

    // if mom is the same with dad, try again until otherwise
    while (m === d) {
      i = Math.floor(Math.random() * n1);
      do {
        j = Math.floor(Math.random() * n1);
      } while (j === i);
      m = this.survivors[i].fitness > this.survivors[j].fitness ? i : j;
    }

    return new Parents(this.survivors[d], this.survivors[m]);
  }

  mutate(mutationRate: number): void {
    if (Util.isZero(mutationRate)) {
      return;
    }
    // randomly select a number of individual to mutate based on the mutation rate
    let m = Math.floor(mutationRate * (this.individuals.length - 1));
    if (m === 0) {
      // ensure at least one mutant?
      m = 1;
    }
    this.mutants = [];
    while (this.mutants.length < m) {
      // elitism: don't mutate the top one
      const k = Math.floor(1 + Math.random() * (this.individuals.length - 2));
      if (!this.mutants.includes(this.individuals[k])) {
        this.mutants.push(this.individuals[k]);
      }
    }
    // randomly select a gene of a picked individual to mutate (only one gene to mutate at a time)
    for (const i of this.mutants) {
      const n = Math.floor(Math.random() * (i.chromosome.length - 1));
      i.setGene(n, Math.random());
    }
  }

  // check convergence bitwise (the so-called nominal convergence)
  isNominallyConverged(): boolean {
    if (this.survivors.length < 2) {
      return true;
    }
    const n = this.individuals[0].chromosome.length;
    const m = Math.max(2, Math.floor(this.survivors.length / 2));
    for (let i = 0; i < n; i++) {
      let average = 0;
      for (let j = 0; j < m; j++) {
        average += this.survivors[j].getGene(i);
      }
      average /= m;
      for (let j = 0; j < m; j++) {
        if (Math.abs(this.survivors[j].getGene(i) / average - 1.0) > this.convergenceThreshold) {
          return false;
        }
      }
    }
    return true;
  }
}
