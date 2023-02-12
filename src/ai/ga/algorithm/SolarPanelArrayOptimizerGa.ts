/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 *
 * The chromosome of an individual solar panel array has three genes:
 * tilt angle (a), inter-row spacing (d), panel row number on rack (r)
 *
 */

import { OptimizerGa } from './OptimizerGa';
import { FoundationModel } from '../../../models/FoundationModel';
import { Individual } from './Individual';
import {
  GeneticAlgorithmSelectionMethod,
  ObjectiveFunctionType,
  Orientation,
  RowAxis,
  SearchMethod,
} from '../../../types';
import { HALF_PI } from '../../../constants';
import { Util } from '../../../Util';
import { PolygonModel } from '../../../models/PolygonModel';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { PvModel } from '../../../models/PvModel';
import { Rectangle } from '../../../models/Rectangle';
import { SolarPanelLayoutRelative } from '../../../pd/SolarPanelLayoutRelative';

export class SolarPanelArrayOptimizerGa extends OptimizerGa {
  polygon: PolygonModel;
  pvModel: PvModel;
  orientation: Orientation = Orientation.landscape;
  rowAxis: RowAxis = RowAxis.zonal;
  poleHeight: number = 2;
  poleSpacing: number = 5;
  bounds?: Rectangle;
  solarPanelCount: number = 0;
  solarRackCount: number = 0;

  // allowable ranges for genes (tilt angle from -90° to 90°)
  minimumInterRowSpacing: number = 2; // in meters
  maximumInterRowSpacing: number = 10; // in meters
  minimumRowsPerRack: number = 1;
  maximumRowsPerRack: number = 6;
  minimumTiltAngle: number = -HALF_PI;
  maximumTiltAngle: number = HALF_PI;
  margin: number = 0;

  constructor(
    pvModel: PvModel,
    rowAxis: RowAxis,
    orientation: Orientation,
    poleHeight: number,
    poleSpacing: number,
    initialSolarPanels: SolarPanelModel[],
    polygon: PolygonModel,
    foundation: FoundationModel,
    objectiveFunctionType: ObjectiveFunctionType,
    populationSize: number,
    maximumGenerations: number,
    selectionMethod: GeneticAlgorithmSelectionMethod,
    convergenceThreshold: number,
    searchMethod: SearchMethod,
    localSearchRadius: number,
    minimumInterRowSpacing: number,
    maximumInterRowSpacing: number,
    minimumRowsPerRack: number,
    maximumRowsPerRack: number,
    minimumTiltAngle: number,
    maximumTiltAngle: number,
    margin: number,
  ) {
    super(
      foundation,
      objectiveFunctionType,
      populationSize,
      maximumGenerations,
      3,
      selectionMethod,
      convergenceThreshold,
      searchMethod,
      localSearchRadius,
    );
    this.polygon = polygon;
    this.pvModel = pvModel;
    this.rowAxis = rowAxis;
    this.orientation = orientation;
    this.poleHeight = poleHeight;
    this.poleSpacing = poleSpacing;
    this.minimumInterRowSpacing = minimumInterRowSpacing;
    this.maximumInterRowSpacing = maximumInterRowSpacing;
    this.minimumRowsPerRack = minimumRowsPerRack;
    this.maximumRowsPerRack = maximumRowsPerRack;
    this.minimumTiltAngle = minimumTiltAngle;
    this.maximumTiltAngle = maximumTiltAngle;
    this.margin = margin;
    this.setInterRowSpacingBounds();
    this.geneNames[0] = 'Tilt Angle';
    this.geneNames[1] = 'Inter-Row Spacing';
    this.geneNames[2] = 'Rack Width';
    // set the firstborn to be the current design, if any
    if (initialSolarPanels && initialSolarPanels.length > 0) {
      const sp1 = initialSolarPanels[0];

      if (initialSolarPanels.length > 1) {
        const firstBorn: Individual = this.population.individuals[0];
        // calculate the genes of the initial solar panels
        let gene1 = (sp1.tiltAngle - this.minimumTiltAngle) / (this.maximumTiltAngle - this.minimumTiltAngle);
        firstBorn.setGene(0, gene1);

        const sp2 = initialSolarPanels[1];
        const interRowSpacing =
          this.rowAxis === RowAxis.meridional
            ? Math.abs(sp1.cx - sp2.cx) * this.foundation.lx
            : Math.abs(sp1.cy - sp2.cy) * this.foundation.ly;
        let gene2 =
          (interRowSpacing - this.minimumInterRowSpacing) / (this.maximumInterRowSpacing - this.minimumInterRowSpacing);
        if (gene2 < 0) gene2 = 0;
        else if (gene2 > 1) gene2 = 1;
        firstBorn.setGene(1, gene2);

        const rowsPerRack = Math.max(
          1,
          Math.round(sp1.ly / (sp1.orientation === Orientation.portrait ? pvModel.length : pvModel.width)),
        );
        let gene3 = (rowsPerRack - this.minimumRowsPerRack) / (this.maximumRowsPerRack - this.minimumRowsPerRack);
        if (gene3 < 0) gene3 = 0;
        else if (gene3 > 1) gene3 = 1;
        firstBorn.setGene(2, gene3);
      }
    }
  }

  private setInterRowSpacingBounds() {
    this.bounds = Util.calculatePolygonBounds(this.polygon.vertices);
  }

  applyFittest(): void {
    const best: Individual | undefined = this.population.getFittest();
    if (best) {
      console.log(
        'Fittest: ' +
          this.individualToString(best) +
          ', rack count: ' +
          this.solarRackCount +
          ', panel count: ' +
          this.solarPanelCount,
      );
    }
  }

  private getObjectiveUnit(): string | null {
    switch (this.objectiveFunctionType) {
      case ObjectiveFunctionType.DAILY_TOTAL_OUTPUT:
      case ObjectiveFunctionType.DAILY_AVERAGE_OUTPUT:
      case ObjectiveFunctionType.YEARLY_TOTAL_OUTPUT:
      case ObjectiveFunctionType.YEARLY_AVERAGE_OUTPUT:
        return 'kWh';
      case ObjectiveFunctionType.YEARLY_PROFIT:
      case ObjectiveFunctionType.DAILY_PROFIT:
        return 'dollars';
    }
    return null;
  }

  individualToString(individual: Individual): string {
    let s =
      'F(' +
      Util.toDegrees(
        individual.getGene(0) * (this.maximumTiltAngle - this.minimumTiltAngle) + this.minimumTiltAngle,
      ).toFixed(3) +
      '°, ';
    s +=
      (
        individual.getGene(1) * (this.maximumInterRowSpacing - this.minimumInterRowSpacing) +
        this.minimumInterRowSpacing
      ).toFixed(3) + 'm, ';
    s +=
      Math.floor(
        individual.getGene(2) * (this.maximumRowsPerRack - this.minimumRowsPerRack) + this.minimumRowsPerRack,
      ) + ')';
    return s + ' = ' + individual.fitness.toFixed(5) + ' ' + this.getObjectiveUnit();
  }

  startEvolving(): void {
    this.outsideGenerationCounter = 0;
    this.computeCounter = 0;
    this.fittestOfGenerations.fill(null);
    this.setInterRowSpacingBounds();
  }

  translateIndividualByIndex(indexOfIndividual: number): SolarPanelModel[] {
    return this.translateIndividual(this.population.individuals[indexOfIndividual]);
  }

  translateBest(): SolarPanelModel[] {
    const best: Individual | undefined = this.population.getFittest();
    if (best) {
      return this.translateIndividual(best);
    }
    return [];
  }

  // translate gene to structure for the specified individual
  private translateIndividual(individual: Individual): SolarPanelModel[] {
    if (!this.bounds) return [];
    const tiltAngle = individual.getGene(0) * (this.maximumTiltAngle - this.minimumTiltAngle) + this.minimumTiltAngle;
    const interRowSpacing =
      individual.getGene(1) * (this.maximumInterRowSpacing - this.minimumInterRowSpacing) + this.minimumInterRowSpacing;
    const rowsPerRack = Math.floor(
      individual.getGene(2) * (this.maximumRowsPerRack - this.minimumRowsPerRack) + this.minimumRowsPerRack,
    );
    const solarPanels = SolarPanelLayoutRelative.create(
      this.polygon,
      this.foundation,
      this.pvModel,
      this.orientation,
      tiltAngle,
      rowsPerRack,
      interRowSpacing,
      this.rowAxis,
      this.poleHeight,
      this.poleSpacing,
      this.margin,
    );
    this.solarPanelCount = 0;
    this.solarRackCount = solarPanels.length;
    if (solarPanels.length > 0) {
      for (const sp of solarPanels) {
        this.solarPanelCount += Util.countSolarPanelsOnRack(sp, this.pvModel);
      }
    }
    return solarPanels;
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
          this.individualToString(individual) +
          ', rack count: ' +
          this.solarRackCount +
          ', panel count: ' +
          this.solarPanelCount,
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
