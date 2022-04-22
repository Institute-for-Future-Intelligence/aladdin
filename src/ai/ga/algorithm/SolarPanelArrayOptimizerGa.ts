/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 *
 * The chromosome of an individual solar panel array has three genes:
 * tilt angle (a), inter-row spacing (d), panel row number on rack (r)
 *
 */

import { OptimizerGa } from './OptimizerGa';
import { FoundationModel } from '../../../models/FoundationModel';
import { Individual } from './Individual';
import { GeneticAlgorithmSelectionMethod, Orientation, RowAxis, SearchMethod } from '../../../types';
import { HALF_PI, UNIT_VECTOR_POS_Z } from '../../../constants';
import { Util } from '../../../Util';
import { PolygonModel } from '../../../models/PolygonModel';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { PvModel } from '../../../models/PvModel';
import { Point2 } from '../../../models/Point2';
import { ElementModelFactory } from '../../../models/ElementModelFactory';

export class SolarPanelArrayOptimizerGa extends OptimizerGa {
  polygon: PolygonModel;
  pvModel: PvModel;
  orientation: Orientation = Orientation.landscape;
  rowAxis: RowAxis = RowAxis.zonal;
  relativeMargin: number = 0.01;
  poleHeight: number = 2;
  poleSpacing: number = 5;

  // allowable ranges for genes (tilt angle from -90° to 90°)
  minimumInterRowSpacing: number = 0.01; // relative to the dimension of the foundation
  maximumInterRowSpacing: number = 0.1;
  minimumRowsPerPack: number = 1;
  maximumRowsPerRack: number = 6;

  constructor(
    pvModel: PvModel,
    initialSolarPanels: SolarPanelModel[],
    polygon: PolygonModel,
    foundation: FoundationModel,
    populationSize: number,
    maximumGenerations: number,
    selectionMethod: GeneticAlgorithmSelectionMethod,
    convergenceThreshold: number,
    searchMethod: SearchMethod,
    localSearchRadius: number,
  ) {
    super(
      foundation,
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
    this.geneNames[0] = 'Tilt Angle';
    this.geneMinima[0] = -HALF_PI;
    this.geneMaxima[0] = HALF_PI;
    this.geneNames[1] = 'Inter-Row Spacing';
    this.geneMinima[1] = this.minimumInterRowSpacing;
    this.geneMaxima[1] = this.maximumInterRowSpacing;
    this.geneNames[2] = 'Rack Rows';
    this.geneMinima[2] = this.minimumRowsPerPack;
    this.geneMaxima[2] = this.maximumRowsPerRack;
    // set the firstborn to be the current design, if any
    if (initialSolarPanels && initialSolarPanels.length > 1) {
      const firstBorn: Individual = this.population.individuals[0];
      // calculate the genes of the initial solar panels
      const sp1 = initialSolarPanels[0];
      const sp2 = initialSolarPanels[1];
      this.poleHeight = sp1.poleHeight;
      this.poleSpacing = sp1.poleSpacing;

      this.initialGene[0] = sp1.tiltAngle;
      const normalizedTiltAngle = 0.5 * (1.0 + this.initialGene[0] / HALF_PI);
      firstBorn.setGene(0, normalizedTiltAngle);

      this.initialGene[1] = Math.hypot(sp1.cx - sp2.cx, sp1.cy - sp2.cy);
      let normalizedInterRowSpacing =
        (this.initialGene[1] - this.minimumInterRowSpacing) /
        (this.maximumInterRowSpacing - this.minimumInterRowSpacing);
      if (normalizedInterRowSpacing < 0) normalizedInterRowSpacing = 0;
      else if (normalizedInterRowSpacing > 1) normalizedInterRowSpacing = 1;
      firstBorn.setGene(1, normalizedInterRowSpacing);

      this.initialGene[2] = Math.max(
        1,
        Math.round(sp1.ly / (sp1.orientation === Orientation.portrait ? pvModel.length : pvModel.width)),
      );
      let normalizedRowsPerRack =
        (this.initialGene[2] - this.minimumRowsPerPack) / (this.maximumRowsPerRack - this.minimumRowsPerPack);
      if (normalizedRowsPerRack < 0) normalizedRowsPerRack = 0;
      else if (normalizedRowsPerRack > 1) normalizedRowsPerRack = 1;
      firstBorn.setGene(2, normalizedRowsPerRack);
    }
  }

  applyFittest(): void {
    const best: Individual | undefined = this.population.getFittest();
    if (best) {
      this.finalGene[0] = (2 * best.getGene(0) - 1) * HALF_PI;
      this.finalFitness = best.fitness;
      console.log('Fittest: ' + this.individualToString(best));
    }
  }

  private individualToString(individual: Individual): string {
    let s = '(' + Util.toDegrees((2 * individual.getGene(0) - 1) * HALF_PI).toFixed(3) + ', ';
    s +=
      (
        individual.getGene(1) * (this.maximumInterRowSpacing - this.minimumInterRowSpacing) +
        this.minimumInterRowSpacing
      ).toFixed(3) + ', ';
    s += individual.getGene(2) * (this.maximumRowsPerRack - this.minimumRowsPerPack) + this.minimumRowsPerPack + ')';
    return s + ' = ' + individual.fitness.toFixed(5);
  }

  startEvolving(): void {
    this.outsideGenerationCounter = 0;
    this.computeCounter = 0;
    this.fittestOfGenerations.fill(null);
  }

  // translate gene to structure for the specified individual
  translateIndividual(indexOfIndividual: number): SolarPanelModel[] {
    const individual: Individual = this.population.individuals[indexOfIndividual];
    const tiltAngle = (2 * individual.getGene(0) - 1) * HALF_PI;
    const interRowSpacing =
      individual.getGene(1) * (this.maximumInterRowSpacing - this.minimumInterRowSpacing) + this.minimumInterRowSpacing;
    const rowsPerRack =
      individual.getGene(2) * (this.maximumRowsPerRack - this.minimumRowsPerPack) + this.minimumRowsPerPack;
    return this.layout(tiltAngle, interRowSpacing, rowsPerRack);
  }

  layout(tiltAngle: number, interRowSpacing: number, rowsPerRack: number): SolarPanelModel[] {
    const bounds = Util.calculatePolygonBounds(this.polygon.vertices);
    const newElements: SolarPanelModel[] = [];
    let n: number;
    let start: number;
    let delta: number;
    const ly = (this.orientation === Orientation.portrait ? this.pvModel.length : this.pvModel.width) * rowsPerRack;
    let h = 0.5 * Math.abs(Math.sin(tiltAngle)) * ly;
    if (this.rowAxis === RowAxis.meridional) {
      // north-south axis, so the array is laid in x direction
      n = Math.floor(((bounds.maxX - bounds.minX) * this.foundation.lx - ly) / interRowSpacing);
      start = bounds.minX + ly / (2 * this.foundation.lx);
      delta = interRowSpacing / this.foundation.lx;
      h /= this.foundation.lx;
      let a: Point2 = { x: 0, y: -0.5 } as Point2;
      let b: Point2 = { x: 0, y: 0.5 } as Point2;
      const rotation = 'rotation' in this.foundation ? this.foundation.rotation : undefined;
      for (let i = 0; i <= n; i++) {
        const cx = start + i * delta;
        a.x = b.x = cx - h;
        const p1 = Util.polygonIntersections(a, b, this.polygon.vertices);
        a.x = b.x = cx + h;
        const p2 = Util.polygonIntersections(a, b, this.polygon.vertices);
        if (p1.length > 1 && p2.length > 1) {
          const b = Math.abs(p1[0].y - p1[1].y) < Math.abs(p2[0].y - p2[1].y);
          let y1 = b ? p1[0].y : p2[0].y;
          let y2 = b ? p1[1].y : p2[1].y;
          const lx = Math.abs(y1 - y2) - 2 * this.relativeMargin;
          if (lx > 0) {
            const solarPanel = ElementModelFactory.makeSolarPanel(
              this.foundation,
              this.pvModel,
              cx,
              (y1 + y2) / 2,
              this.foundation.lz,
              Orientation.portrait,
              UNIT_VECTOR_POS_Z,
              rotation,
              lx * this.foundation.ly,
              ly,
            );
            solarPanel.tiltAngle = tiltAngle;
            solarPanel.relativeAzimuth = HALF_PI;
            solarPanel.poleHeight = this.poleHeight;
            solarPanel.poleSpacing = this.poleSpacing;
            solarPanel.referenceId = this.polygon.id;
            this.changeOrientation(solarPanel, this.orientation);
            newElements.push(JSON.parse(JSON.stringify(solarPanel)));
          }
        }
      }
    } else {
      // east-west axis, so the array is laid in y direction
      n = Math.floor(((bounds.maxY - bounds.minY) * this.foundation.ly - ly) / interRowSpacing);
      start = bounds.minY + ly / (2 * this.foundation.ly) + this.relativeMargin;
      delta = interRowSpacing / this.foundation.ly;
      h /= this.foundation.ly;
      let a: Point2 = { x: -0.5, y: 0 } as Point2;
      let b: Point2 = { x: 0.5, y: 0 } as Point2;
      const rotation = 'rotation' in this.foundation ? this.foundation.rotation : undefined;
      for (let i = 0; i <= n; i++) {
        const cy = start + i * delta;
        a.y = b.y = cy - h;
        const p1 = Util.polygonIntersections(a, b, this.polygon.vertices);
        a.y = b.y = cy + h;
        const p2 = Util.polygonIntersections(a, b, this.polygon.vertices);
        if (p1.length > 1 && p2.length > 1) {
          const b = Math.abs(p1[0].x - p1[1].x) < Math.abs(p2[0].x - p2[1].x);
          let x1 = b ? p1[0].x : p2[0].x;
          let x2 = b ? p1[1].x : p2[1].x;
          const lx = Math.abs(x1 - x2) - 2 * this.relativeMargin;
          if (lx > 0) {
            const solarPanel = ElementModelFactory.makeSolarPanel(
              this.foundation,
              this.pvModel,
              (x1 + x2) / 2,
              cy,
              this.foundation.lz,
              Orientation.portrait,
              UNIT_VECTOR_POS_Z,
              rotation,
              lx * this.foundation.lx,
              ly,
            );
            solarPanel.tiltAngle = tiltAngle;
            solarPanel.relativeAzimuth = 0;
            solarPanel.poleHeight = this.poleHeight;
            solarPanel.poleSpacing = this.poleSpacing;
            solarPanel.referenceId = this.polygon.id;
            this.changeOrientation(solarPanel, this.orientation);
            newElements.push(JSON.parse(JSON.stringify(solarPanel)));
          }
        }
      }
    }
    return newElements;
  }

  changeOrientation(solarPanel: SolarPanelModel, value: Orientation): void {
    if (solarPanel) {
      solarPanel.orientation = value;
      // add a small number because the round-off error may cause the floor to drop one
      solarPanel.lx += 0.00001;
      solarPanel.ly += 0.00001;
      if (value === Orientation.portrait) {
        // calculate the current x-y layout
        const nx = Math.max(1, Math.floor(solarPanel.lx / this.pvModel.width));
        const ny = Math.max(1, Math.floor(solarPanel.ly / this.pvModel.length));
        solarPanel.lx = nx * this.pvModel.width;
        solarPanel.ly = ny * this.pvModel.length;
      } else {
        // calculate the current x-y layout
        const nx = Math.max(1, Math.floor(solarPanel.lx / this.pvModel.length));
        const ny = Math.max(1, Math.floor(solarPanel.ly / this.pvModel.width));
        solarPanel.lx = nx * this.pvModel.length;
        solarPanel.ly = ny * this.pvModel.width;
      }
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
        this.initialFitness = fitness;
      }
      const generation = Math.floor(this.computeCounter / populationSize);
      console.log(
        'Generation ' +
          (generation + 1) +
          ', individual ' +
          indexOfIndividual +
          ' : ' +
          this.individualToString(individual),
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
