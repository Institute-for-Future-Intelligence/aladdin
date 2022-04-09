/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 *
 * The chromosome of an individual is encoded as follows:
 *
 * solarPanel[0].tiltAngle, solarPanel[1].tiltAngle, ..., solarPanel[n].tiltAngle
 *
 */

import { Optimizer } from './Optimizer';
import { FoundationModel } from '../../models/FoundationModel';
import { Individual } from './Individual';
import { SolarPanelModel } from '../../models/SolarPanelModel';
import { GeneticAlgorithmSearchMethod, ObjectiveFunctionType } from '../../types';
import { SolarOutputObjectiveFunction } from './SolarOutputObjectiveFunction';
import { HALF_PI } from '../../constants';
import { Util } from '../../Util';

export class SolarPanelTiltAngleOptimizer extends Optimizer {
  solarPanels: SolarPanelModel[];

  constructor(
    solarPanels: SolarPanelModel[],
    foundation: FoundationModel,
    populationSize: number,
    maximumGenerations: number,
    discretizationSteps: number,
  ) {
    super(foundation, populationSize, maximumGenerations, solarPanels.length, discretizationSteps);
    this.solarPanels = solarPanels;
    this.objectiveFunction = new SolarOutputObjectiveFunction(ObjectiveFunctionType.DAILY_OUTPUT);
    // initialize the population with the first-born being the current design
    const firstBorn: Individual = this.population.individuals[0];
    for (const [i, panel] of solarPanels.entries()) {
      const normalizedValue = 0.5 * (1.0 + panel.tiltAngle / HALF_PI);
      firstBorn.setGene(i, normalizedValue);
      if (this.searchMethod === GeneticAlgorithmSearchMethod.LOCAL_SEARCH_RANDOM_OPTIMIZATION) {
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
      this.geneMinima[i] = -HALF_PI;
      this.geneMaxima[i] = HALF_PI;
      this.initialGene[i] = panel.tiltAngle;
    }
  }

  applyFittest(): void {
    const best: Individual | undefined = this.population.getFittest();
    if (best) {
      for (let i = 0; i < best.chromosome.length; i++) {
        const gene = best.getGene(i);
        this.solarPanels[i].tiltAngle = (2 * gene - 1) * HALF_PI;
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
      s += Util.toDegrees((2 * gene - 1) * HALF_PI).toFixed(2) + ', ';
    }
    return s.substring(0, s.length - 2) + ') = ' + individual.fitness;
  }

  startEvolving(): void {
    this.outsideGenerationCounter = 0;
    this.computeCounter = 0;
    this.fittestOfGenerations.fill(null);
  }

  // translate gene to structure for the specified individual
  translateIndividual(indexOfIndividual: number): void {
    const individual: Individual = this.population.individuals[indexOfIndividual];
    for (let i = 0; i < individual.chromosome.length; i++) {
      const gene = individual.getGene(i);
      this.solarPanels[i].tiltAngle = (2 * gene - 1) * HALF_PI;
    }
  }

  evolveIndividual(indexOfIndividual: number, fitness: number): void {
    const populationSize = this.population.individuals.length;
    if (!this.converged) {
      const individual: Individual = this.population.individuals[indexOfIndividual];
      individual.fitness = fitness;
      const generation = Math.floor(this.computeCounter / populationSize);
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
          if (!this.converged && this.searchMethod === GeneticAlgorithmSearchMethod.GLOBAL_SEARCH_UNIFORM_SELECTION) {
            this.population.mutate(this.mutationRate);
          }
        }
      }
      this.computeCounter++;
    } else {
      this.applyFittest();
    }
  }

  // if anyone in the current population doesn't meet the constraints, the entire population dies
  // and the algorithm reverts to the previous generation -- not efficient
  detectViolations(): boolean {
    let detected = false;
    if (this.minima && this.maxima) {
      const chromosomeLength = this.population.individuals[0].chromosome.length;
      const populationSize = this.population.individuals.length;
      for (let i = 0; i < populationSize; i++) {
        const individual = this.population.individuals[i];
        const angle: number[] = new Array<number>(chromosomeLength);
        for (let j = 0; j < chromosomeLength; j++) {
          const gene = individual.getGene(j);
          angle[j] = this.minima[j] + gene * (this.maxima[j] - this.minima[j]);
        }
        if (this.constraints.length > 0) {
          for (let j = 0; j < angle.length; j++) {
            for (const c of this.constraints) {
            }
          }
        }
      }
    }
    return detected;
  }
}
