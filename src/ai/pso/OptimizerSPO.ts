/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { FoundationModel } from '../../models/FoundationModel';
import { Swarm } from './Swarm';
import { SearchMethod } from '../../types';

export abstract class OptimizerSPO {
  swarm: Swarm;
  foundation: FoundationModel;
  stopped: boolean = true;
  maximumSteps: number = 5;
  bestPositionOfSteps: (number[] | null)[] = [];
  swarmOfSteps: (Swarm | null)[] = [];
  outsideStepCounter: number = 0;
  computeCounter: number = 0;
  convergenceThreshold: number = 0.1;
  converged: boolean = false;
  searchMethod: SearchMethod = SearchMethod.GLOBAL_SEARCH_UNIFORM_SELECTION;
  localSearchRadius: number = 0.1;

  constructor(
    foundation: FoundationModel,
    swarmSize: number,
    maximumSteps: number,
    particleDimension: number,
    convergenceThreshold: number,
    searchMethod: SearchMethod,
    localSearchRadius: number,
  ) {
    this.swarm = new Swarm(swarmSize, particleDimension);
    this.convergenceThreshold = convergenceThreshold;
    this.searchMethod = searchMethod;
    this.localSearchRadius = localSearchRadius;
    this.maximumSteps = maximumSteps;
    this.foundation = foundation;
    this.bestPositionOfSteps = new Array<number[] | null>(this.maximumSteps + 1);
    this.bestPositionOfSteps.fill(null);
    this.swarmOfSteps = new Array<Swarm | null>(this.maximumSteps);
    for (let i = 0; i < this.maximumSteps; i++) {
      this.swarmOfSteps[i] = new Swarm(swarmSize, particleDimension);
    }
  }

  abstract applyBest(): void;

  stop(): void {
    this.stopped = true;
  }

  shouldTerminate(): boolean {
    return this.outsideStepCounter >= this.maximumSteps;
  }
}
