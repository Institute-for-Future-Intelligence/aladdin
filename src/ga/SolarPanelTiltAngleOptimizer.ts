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
import { GeneticAlgorithmMethod } from '../types';

export class SolarPanelTiltAngleOptimizer extends Optimizer {
  constructor(
    solarPanels: SolarPanelModel[],
    foundation: FoundationModel,
    populationSize: number,
    chromosomeLength: number,
    discretizationSteps: number,
  ) {
    super(foundation, populationSize, chromosomeLength, discretizationSteps);
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
}
