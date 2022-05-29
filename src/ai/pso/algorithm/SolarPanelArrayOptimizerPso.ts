/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 *
 * The chromosome of an individual solar panel array has three genes:
 * tilt angle (a), inter-row spacing (d), panel row number on rack (r)
 *
 */

import { OptimizerPso } from './OptimizerPso';
import { FoundationModel } from '../../../models/FoundationModel';
import { ObjectiveFunctionType, Orientation, RowAxis, SearchMethod } from '../../../types';
import { HALF_PI, UNIT_VECTOR_POS_Z } from '../../../constants';
import { Util } from '../../../Util';
import { PolygonModel } from '../../../models/PolygonModel';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { PvModel } from '../../../models/PvModel';
import { Point2 } from '../../../models/Point2';
import { ElementModelFactory } from '../../../models/ElementModelFactory';
import { Rectangle } from '../../../models/Rectangle';
import { Particle } from './Particle';

export class SolarPanelArrayOptimizerPso extends OptimizerPso {
  polygon: PolygonModel;
  pvModel: PvModel;
  orientation: Orientation = Orientation.landscape;
  rowAxis: RowAxis = RowAxis.zonal;
  relativeMargin: number = 0.01;
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
    swarmSize: number,
    vmax: number,
    maximumSteps: number,
    convergenceThreshold: number,
    searchMethod: SearchMethod,
    localSearchRadius: number,
    minimumInterRowSpacing: number,
    maximumInterRowSpacing: number,
    minimumRowsPerRack: number,
    maximumRowsPerRack: number,
    minimumTiltAngle: number,
    maximumTiltAngle: number,
  ) {
    super(
      foundation,
      objectiveFunctionType,
      swarmSize,
      vmax,
      maximumSteps,
      3,
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
    this.setInterRowSpacingBounds();
    // set the first particle to be the current design, if any
    if (initialSolarPanels && initialSolarPanels.length > 0) {
      const sp1 = initialSolarPanels[0];

      if (initialSolarPanels.length > 1) {
        const firstParticle: Particle = this.swarm.particles[0];
        // calculate the particle positions of the initial solar panels
        firstParticle.position[0] =
          (sp1.tiltAngle - this.minimumTiltAngle) / (this.maximumTiltAngle - this.minimumTiltAngle);

        const sp2 = initialSolarPanels[1];
        const interRowSpacing =
          this.rowAxis === RowAxis.meridional
            ? Math.abs(sp1.cx - sp2.cx) * this.foundation.lx
            : Math.abs(sp1.cy - sp2.cy) * this.foundation.ly;
        let normalizedInterRowSpacing =
          (interRowSpacing - this.minimumInterRowSpacing) / (this.maximumInterRowSpacing - this.minimumInterRowSpacing);
        if (normalizedInterRowSpacing < 0) normalizedInterRowSpacing = 0;
        else if (normalizedInterRowSpacing > 1) normalizedInterRowSpacing = 1;
        firstParticle.position[1] = normalizedInterRowSpacing;

        const rowsPerRack = Math.max(
          1,
          Math.round(sp1.ly / (sp1.orientation === Orientation.portrait ? pvModel.length : pvModel.width)),
        );
        let normalizedRowsPerRack =
          (rowsPerRack - this.minimumRowsPerRack) / (this.maximumRowsPerRack - this.minimumRowsPerRack);
        if (normalizedRowsPerRack < 0) normalizedRowsPerRack = 0;
        else if (normalizedRowsPerRack > 1) normalizedRowsPerRack = 1;
        firstParticle.position[2] = normalizedRowsPerRack;
      }
    }
  }

  private setInterRowSpacingBounds() {
    this.bounds = Util.calculatePolygonBounds(this.polygon.vertices);
  }

  applyFittest(): void {
    if (this.swarm.bestPositionOfSwarm) {
      console.log(
        'Best: ' +
          this.particleToString(this.swarm.bestPositionOfSwarm, this.swarm.bestFitness) +
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

  particleToString(position: number[], fitness: number): string {
    let s =
      'F(' +
      Util.toDegrees(position[0] * (this.maximumTiltAngle - this.minimumTiltAngle) + this.minimumTiltAngle).toFixed(3) +
      '°, ';
    s +=
      (position[1] * (this.maximumInterRowSpacing - this.minimumInterRowSpacing) + this.minimumInterRowSpacing).toFixed(
        3,
      ) + 'm, ';
    s += Math.floor(position[2] * (this.maximumRowsPerRack - this.minimumRowsPerRack) + this.minimumRowsPerRack) + ')';
    return s + ' = ' + fitness.toFixed(5) + ' ' + this.getObjectiveUnit();
  }

  startEvolving(): void {
    this.outsideStepCounter = 0;
    this.computeCounter = 0;
    this.bestPositionOfSteps.fill(null);
    this.bestFitnessOfSteps.fill(0);
    this.setInterRowSpacingBounds();
  }

  translateParticleByIndex(indexOfParticle: number): SolarPanelModel[] {
    return this.translatePosition(this.swarm.particles[indexOfParticle].position);
  }

  translateBest(): SolarPanelModel[] {
    if (this.swarm.bestPositionOfSwarm) {
      return this.translatePosition(this.swarm.bestPositionOfSwarm);
    }
    return [];
  }

  // translate position to structure for the specified position
  private translatePosition(position: number[]): SolarPanelModel[] {
    const tiltAngle = position[0] * (this.maximumTiltAngle - this.minimumTiltAngle) + this.minimumTiltAngle;
    const interRowSpacing =
      position[1] * (this.maximumInterRowSpacing - this.minimumInterRowSpacing) + this.minimumInterRowSpacing;
    const rowsPerRack = Math.floor(
      position[2] * (this.maximumRowsPerRack - this.minimumRowsPerRack) + this.minimumRowsPerRack,
    );
    const solarPanels = this.layout(tiltAngle, interRowSpacing, rowsPerRack);
    this.solarRackCount = solarPanels.length;
    return solarPanels;
  }

  layout(tiltAngle: number, interRowSpacing: number, rowsPerRack: number): SolarPanelModel[] {
    if (!this.bounds) return [];
    const solarPanels: SolarPanelModel[] = [];
    this.solarPanelCount = 0;
    let n: number;
    let start: number;
    let delta: number;
    const ly = (this.orientation === Orientation.portrait ? this.pvModel.length : this.pvModel.width) * rowsPerRack;
    let h = 0.5 * Math.abs(Math.sin(tiltAngle)) * ly;
    if (this.rowAxis === RowAxis.meridional) {
      // north-south axis, so the array is laid in x direction
      n = Math.floor(((this.bounds.maxX() - this.bounds.minX()) * this.foundation.lx - ly) / interRowSpacing);
      start = this.bounds.minX() + ly / (2 * this.foundation.lx);
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
            Util.changeOrientation(solarPanel, this.pvModel, this.orientation);
            solarPanels.push(JSON.parse(JSON.stringify(solarPanel)));
            this.solarPanelCount += Util.countSolarPanelsOnRack(solarPanel, this.pvModel);
          }
        }
      }
    } else {
      // east-west axis, so the array is laid in y direction
      n = Math.floor(((this.bounds.maxY() - this.bounds.minY()) * this.foundation.ly - ly) / interRowSpacing);
      start = this.bounds.minY() + ly / (2 * this.foundation.ly) + this.relativeMargin;
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
            Util.changeOrientation(solarPanel, this.pvModel, this.orientation);
            solarPanels.push(JSON.parse(JSON.stringify(solarPanel)));
            this.solarPanelCount += Util.countSolarPanelsOnRack(solarPanel, this.pvModel);
          }
        }
      }
    }
    return solarPanels;
  }

  updateParticle(indexOfParticle: number, fitness: number): boolean {
    const swarmSize = this.swarm.particles.length;
    if (!this.converged) {
      const particle: Particle = this.swarm.particles[indexOfParticle];
      particle.fitness = fitness;
      // the first particle of the first generation is used as a baseline
      // (imagine it as the fittest of the zeroth swarm)
      if (this.computeCounter === 0 && indexOfParticle === 0) {
        this.bestPositionOfSteps[0] = [...particle.position];
        this.bestFitnessOfSteps[0] = fitness;
      }
      const step = Math.floor(this.computeCounter / swarmSize);
      console.log(
        'Step ' +
          (step + 1) +
          ', particle ' +
          indexOfParticle +
          ' : ' +
          this.particleToString(particle.position, fitness) +
          ', rack count: ' +
          this.solarRackCount +
          ', panel count: ' +
          this.solarPanelCount,
      );
      const savedParticle = this.swarmOfSteps[step]?.particles[indexOfParticle];
      if (savedParticle) {
        for (let k = 0; k < particle.position.length; k++) {
          savedParticle.position[k] = particle.position[k];
        }
        savedParticle.fitness = particle.fitness;
      }
      const isAtTheEndOfStep = this.computeCounter % swarmSize === swarmSize - 1;
      if (isAtTheEndOfStep) {
        this.swarm.sort();
        const best = this.swarm.bestPositionOfSwarm;
        if (best) {
          this.bestPositionOfSteps[step + 1] = [...best];
          this.bestFitnessOfSteps[step + 1] = this.swarm.bestFitness;
        }
        this.converged = this.swarm.isNominallyConverged(
          this.convergenceThreshold,
          Math.max(2, this.swarm.particles.length / 4),
        );
        this.moveSwarm();
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
