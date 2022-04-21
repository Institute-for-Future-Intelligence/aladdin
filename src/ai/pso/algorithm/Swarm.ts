/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Particle } from './Particle';

export class Swarm {
  particles: Particle[];

  // the normalized position that results in the best ever fitness of this swarm
  bestPositionOfSwarm: number[];
  bestFitness: number = Number.NaN;

  constructor(size: number, dimension: number, vmax?: number) {
    this.particles = new Array<Particle>();
    for (let i = 0; i < size; i++) {
      this.particles.push(new Particle(dimension, vmax));
    }
    this.bestPositionOfSwarm = new Array<number>(dimension);
  }

  // sort the fitness in the descending order (sort b before a if b's fitness is higher than a's)
  sort(): void {
    this.particles.sort((a, b) => b.compare(a));
    if (Number.isNaN(this.bestFitness) || this.bestFitness < this.particles[0].fitness) {
      for (let i = 0; i < this.bestPositionOfSwarm.length; i++) {
        this.bestPositionOfSwarm[i] = this.particles[0].position[i];
      }
      this.bestFitness = this.particles[0].fitness;
    }
  }

  // check convergence bitwise (the so-called nominal convergence)
  isNominallyConverged(convergenceThreshold: number, top: number): boolean {
    if (top <= 0) throw new Error('top must be greater than 0');
    const n = this.particles[0].position.length;
    for (let i = 0; i < n; i++) {
      let average = 0;
      for (let j = 0; j < top; j++) {
        average += this.particles[j].position[i];
      }
      average /= top;
      for (let j = 0; j < top; j++) {
        if (Math.abs(this.particles[j].position[i] / average - 1.0) > convergenceThreshold) {
          return false;
        }
      }
    }
    return true;
  }
}
