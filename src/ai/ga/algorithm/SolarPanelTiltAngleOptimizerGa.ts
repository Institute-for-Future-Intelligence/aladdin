/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 *
 * The chromosome of an individual is encoded as follows:
 *
 * solarPanel[0].tiltAngle, solarPanel[1].tiltAngle, ..., solarPanel[n].tiltAngle
 *
 */

import { OptimizerGa } from './OptimizerGa';
import { FoundationModel } from '../../../models/FoundationModel';
import { Individual } from './Individual';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { SearchMethod, GeneticAlgorithmSelectionMethod, ObjectiveFunctionType } from '../../../types';
import { HALF_PI } from '../../../constants';
import { Util } from '../../../Util';
import { Random } from '../../../Random';

export class SolarPanelTiltAngleOptimizerGa extends OptimizerGa {
  solarPanels: SolarPanelModel[];

  constructor(
    solarPanels: SolarPanelModel[],
    foundation: FoundationModel,
    objectiveFunctionType: ObjectiveFunctionType,
    populationSize: number,
    maximumGenerations: number,
    selectionMethod: GeneticAlgorithmSelectionMethod,
    convergenceThreshold: number,
    searchMethod: SearchMethod,
    localSearchRadius: number,
  ) {
    super(
      foundation,
      objectiveFunctionType,
      populationSize,
      maximumGenerations,
      solarPanels.length,
      selectionMethod,
      convergenceThreshold,
      searchMethod,
      localSearchRadius,
    );
    this.solarPanels = solarPanels;
    // set the firstborn to be the current design
    const firstBorn: Individual = this.population.individuals[0];
    for (const [i, panel] of solarPanels.entries()) {
      const normalizedValue = 0.5 * (1.0 + panel.tiltAngle / HALF_PI);
      firstBorn.setGene(i, normalizedValue);
      if (this.searchMethod === SearchMethod.LOCAL_SEARCH_RANDOM_OPTIMIZATION) {
        for (let k = 1; k < this.population.individuals.length; k++) {
          const individual: Individual = this.population.individuals[k];
          let v = Random.gaussian() * this.localSearchRadius + normalizedValue;
          while (v < 0 || v > 1) {
            v = Random.gaussian() * this.localSearchRadius + normalizedValue;
          }
          individual.setGene(i, v);
        }
      }
      this.geneNames[i] = 'Tilt Angle (' + panel.id + ')';
    }
  }

  applyFittest(): void {
    const best: Individual | undefined = this.population.getFittest();
    if (best) {
      for (let i = 0; i < best.chromosome.length; i++) {
        const gene = best.getGene(i);
        this.solarPanels[i].tiltAngle = (2 * gene - 1) * HALF_PI;
      }
      console.log('Fittest: ' + SolarPanelTiltAngleOptimizerGa.individualToString(best));
    }
  }

  static individualToString(individual: Individual): string {
    let s = 'F(';
    for (let i = 0; i < individual.chromosome.length; i++) {
      const gene = individual.getGene(i);
      s += Util.toDegrees((2 * gene - 1) * HALF_PI).toFixed(3) + '°, ';
    }
    return s.substring(0, s.length - 2) + ') = ' + individual.fitness.toFixed(5) + ' kWh';
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

  evolveIndividual(indexOfIndividual: number, fitness: number): boolean {
    const populationSize = this.population.individuals.length;
    if (!this.converged) {
      const individual: Individual = this.population.individuals[indexOfIndividual];
      individual.fitness = fitness;
      // the first individual of the first generation is used as a baseline
      // (imagine it as the fittest of the zeroth generation)
      if (this.computeCounter === 0 && indexOfIndividual === 0) {
        this.fittestOfGenerations[0] = individual.getCopy();
      }
      const generation = Math.floor(this.computeCounter / populationSize);
      console.log(
        'Generation ' +
          (generation + 1) +
          ', individual ' +
          indexOfIndividual +
          ' : ' +
          SolarPanelTiltAngleOptimizerGa.individualToString(individual),
      );
      const savedIndividual = this.populationOfGenerations[generation]?.individuals[indexOfIndividual];
      if (savedIndividual) {
        for (let k = 0; k < individual.chromosome.length; k++) {
          savedIndividual.chromosome[k] = individual.chromosome[k];
        }
        savedIndividual.fitness = individual.fitness;
      }
      const isAtTheEndOfGeneration = this.computeCounter % populationSize === populationSize - 1;
      if (isAtTheEndOfGeneration) {
        this.population.saveGenes();
        this.population.evolve(this.selectionRate, this.crossoverRate);
        const best = this.population.getFittest();
        if (best) {
          this.fittestOfGenerations[generation + 1] = best.getCopy();
        }
        if (this.detectViolations()) {
          this.population.restoreGenes();
        } else {
          this.converged = this.population.isNominallyConverged(this.convergenceThreshold);
          if (!this.converged && this.searchMethod === SearchMethod.GLOBAL_SEARCH_UNIFORM_SELECTION) {
            this.population.mutate(this.mutationRate);
          }
        }
      }
      this.computeCounter++;
    }
    return this.converged;
  }

  // if anyone in the current population doesn't meet the constraints, the entire population dies
  // and the algorithm reverts to the previous generation -- not efficient
  detectViolations(): boolean {
    return false; // TODO
  }
}
