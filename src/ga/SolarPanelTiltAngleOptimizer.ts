/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 *
 * The chromosome of an individual is encoded as follows:
 *
 * solarPanel[0].tiltAngle, solarPanel[1].tiltAngle, ..., solarPanel[n].tiltAngle
 *
 */

import { Optimizer } from './Optimizer';
import { FoundationModel } from '../models/FoundationModel';
import { Individual } from './Individual';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { GeneticAlgorithmMethod, ObjectiveFunctionType } from '../types';
import { SolarOutputObjectiveFunction } from './SolarOutputObjectiveFunction';
import { RectangularBound } from './RectangularBound';

export class SolarPanelTiltAngleOptimizer extends Optimizer {
  solarPanels: SolarPanelModel[];

  constructor(
    solarPanels: SolarPanelModel[],
    foundation: FoundationModel,
    populationSize: number,
    chromosomeLength: number,
    discretizationSteps: number,
  ) {
    super(foundation, populationSize, chromosomeLength, discretizationSteps);
    this.solarPanels = solarPanels;
    this.objectiveFunction = new SolarOutputObjectiveFunction(ObjectiveFunctionType.DAILY);
    // initialize the population with the first-born being the current design
    const firstBorn: Individual = this.population.individuals[0];
    for (const [i, panel] of solarPanels.entries()) {
      const normalizedValue = 0.5 * (1.0 + panel.tiltAngle / 90.0);
      firstBorn.setGene(i, normalizedValue);
      if (this.searchMethod === GeneticAlgorithmMethod.LOCAL_SEARCH_RANDOM_OPTIMIZATION) {
        for (let k = 1; k < this.population.individuals.length; k++) {
          const individual: Individual = this.population.individuals[k];
          let v = Math.random() * this.localSearchRadius + normalizedValue;
          while (v < 0 || v > 1) {
            v = Math.random() * this.localSearchRadius + normalizedValue;
          }
          individual.setGene(i, v);
        }
      }
      this.geneNames[i] = 'Tilt Angle (' + panel.id + ')';
      this.geneMinima[i] = -90;
      this.geneMaxima[i] = 90;
      this.initialGene[i] = panel.tiltAngle;
    }
  }

  computeIndividualFitness(individual: Individual): void {
    for (let i = 0; i < individual.chromosome.length; i++) {
      const gene = individual.getGene(i);
      this.solarPanels[i].tiltAngle = (2 * gene - 1) * 90;
    }
    if (this.objectiveFunction) {
      individual.fitness = this.objectiveFunction.compute();
    }
  }

  applyFittest(): void {
    const best: Individual | undefined = this.population.getFittest();
    if (best) {
      for (let i = 0; i < best.chromosome.length; i++) {
        const gene = best.getGene(i);
        this.solarPanels[i].tiltAngle = (2 * gene - 1) * 90;
        this.finalGene[i] = this.solarPanels[i].tiltAngle;
      }
      this.finalFitness = best.fitness;
      console.log('Fittest: ' + SolarPanelTiltAngleOptimizer.individualToString(best));
      // displayFittest();
    }
  }

  private static individualToString(individual: Individual): string {
    let s = '(';
    for (let i = 0; i < individual.chromosome.length; i++) {
      const gene = individual.getGene(i);
      s += (2 * gene - 1) * 90 + ', ';
    }
    return s.substring(0, s.length - 2) + ') = ' + individual.fitness;
  }

  evolve(local: boolean, daily: boolean, profit: boolean, searchRadius: number): void {
    //onStart();
    this.outsideGenerationCounter = 0;
    this.computeCounter = 0;
    //this.fittestOfGenerations.fill(null);

    // the number of individuals to evaluate is maximumGeneration * population.size(), subject to the convergence criterion
    if (this.maximumGenerations > 1) {
      while (!this.shouldTerminate()) {
        for (let i = 0; i < this.population.individuals.length; i++) {
          this.computeIndividual(i);
        }
        this.outsideGenerationCounter++;
      }
    }

    if (this.maximumGenerations > 1) {
      this.applyFittest(); // show the fittest
    }
  }

  computeIndividual(indexOfIndividual: number): void {
    const populationSize = this.population.individuals.length;
    if (!this.converged) {
      const individual: Individual = this.population.individuals[indexOfIndividual];
      this.computeIndividualFitness(individual);
      const generation = this.computeCounter / populationSize;
      console.log(
        'Generation ' +
          generation +
          ', individual ' +
          indexOfIndividual +
          ' : ' +
          SolarPanelTiltAngleOptimizer.individualToString(individual),
      );
      const isAtTheEndOfGeneration = this.computeCounter % populationSize === populationSize - 1;
      if (isAtTheEndOfGeneration) {
        this.population.saveGenes();
        this.population.runSga(this.selectionRate, this.crossoverRate);
        const best = this.population.getFittest();
        if (best) {
          this.fittestOfGenerations[generation + 1] = best;
        }
        if (this.detectViolations()) {
          this.population.restoreGenes();
        } else {
          this.converged = this.population.isSgaConverged();
          if (!this.converged && this.searchMethod === GeneticAlgorithmMethod.GLOBAL_SEARCH_UNIFORM_SELECTION) {
            this.population.mutate(this.mutationRate);
          }
        }
      }
    } else {
      this.applyFittest();
    }
  }

  // if anyone in the current population doesn't meed the constraints, the entire population dies
  // and the algorithm reverts to the previous generation -- not efficient
  detectViolations(): boolean {
    let detected = false;
    if (this.minima && this.maxima) {
      const chromosomeLength = this.population.individuals[0].chromosome.length;
      const populationSize = this.population.individuals.length;
      for (let i = 0; i < populationSize; i++) {
        const individual = this.population.individuals[i];
        const x: number[] = new Array<number>(chromosomeLength / 2);
        const y: number[] = new Array<number>(chromosomeLength / 2);
        for (let j = 0; j < chromosomeLength; j++) {
          const gene = individual.getGene(j);
          const j2 = j / 2;
          if (j % 2 === 0) {
            x[j2] = this.minima[j] + gene * (this.maxima[j] - this.minima[j]);
          } else {
            y[j2] = this.minima[j] + gene * (this.maxima[j] - this.minima[j]);
          }
        }
        for (let j2 = 0; j2 < x.length; j2++) {
          for (const c of this.constraints) {
            if (c instanceof RectangularBound) {
              const rb = c as RectangularBound;
              if (rb.contains(x[j2], y[j2])) {
                this.population.violations[i] = true;
                detected = true;
              }
            }
          }
        }
      }
    }
    return detected;
  }
}
