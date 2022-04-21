/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { FoundationModel } from '../../../models/FoundationModel';
import { Swarm } from './Swarm';
import { SearchMethod } from '../../../types';

export abstract class OptimizerPso {
  swarm: Swarm;
  foundation: FoundationModel;
  stopped: boolean = true;
  inertia: number = 0.8;
  cognitiveCoefficient: number = 0.1;
  socialCoefficient: number = 0.1;
  maximumSteps: number = 5;
  bestPositionOfSteps: (number[] | null)[] = [];
  bestFitnessOfSteps: number[] = [];
  swarmOfSteps: (Swarm | null)[] = [];
  outsideStepCounter: number = 0;
  computeCounter: number = 0;
  convergenceThreshold: number = 0.1;
  converged: boolean = false;
  searchMethod: SearchMethod = SearchMethod.GLOBAL_SEARCH_UNIFORM_SELECTION;
  localSearchRadius: number = 0.1;

  protected constructor(
    foundation: FoundationModel,
    swarmSize: number,
    vmax: number,
    maximumSteps: number,
    particleDimension: number,
    convergenceThreshold: number,
    searchMethod: SearchMethod,
    localSearchRadius: number,
  ) {
    this.swarm = new Swarm(swarmSize, particleDimension, vmax);
    this.convergenceThreshold = convergenceThreshold;
    this.searchMethod = searchMethod;
    this.localSearchRadius = localSearchRadius;
    this.maximumSteps = maximumSteps;
    this.foundation = foundation;
    this.bestPositionOfSteps = new Array<number[] | null>(this.maximumSteps + 1);
    this.bestPositionOfSteps.fill(null);
    this.bestFitnessOfSteps = new Array<number>(this.maximumSteps + 1);
    this.bestFitnessOfSteps.fill(0);
    this.swarmOfSteps = new Array<Swarm | null>(this.maximumSteps);
    for (let i = 0; i < this.maximumSteps; i++) {
      this.swarmOfSteps[i] = new Swarm(swarmSize, particleDimension);
    }
  }

  moveSwarm() {
    for (const p of this.swarm.particles) {
      const n = p.position.length;
      for (let i = 0; i < n; i++) {
        p.velocity[i] =
          this.inertia * p.velocity[i] +
          this.cognitiveCoefficient * Math.random() * (p.bestPositionOfParticle[i] - p.position[i]) +
          this.socialCoefficient * Math.random() * (this.swarm.bestPositionOfSwarm[i] - p.position[i]);
        p.position[i] += p.velocity[i];
      }
    }
  }

  abstract applyFittest(): void;

  stop(): void {
    this.stopped = true;
  }

  shouldTerminate(): boolean {
    return this.outsideStepCounter >= this.maximumSteps;
  }
}
