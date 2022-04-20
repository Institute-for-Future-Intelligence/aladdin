/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Particle } from './Particle';

export class Swarm {
  particles: Particle[];

  // the position that results in the best ever fitness of this swarm
  bestPositionOfSwarm: number[];
  bestFitness: number = Number.NaN;

  constructor(size: number, dimension: number) {
    this.particles = new Array<Particle>();
    for (let i = 0; i < size; i++) {
      this.particles.push(new Particle(dimension));
    }
    this.bestPositionOfSwarm = new Array<number>(dimension);
  }

  evolve() {}

  // check convergence bitwise (the so-called nominal convergence)
  isNominallyConverged(convergenceThreshold: number): boolean {
    const n = this.particles[0].position.length;
    const m = Math.max(2, this.particles.length / 2);
    for (let i = 0; i < n; i++) {
      let average = 0;
      for (let j = 0; j < m; j++) {
        average += this.particles[j].position[i];
      }
      average /= m;
      for (let j = 0; j < m; j++) {
        if (Math.abs(this.particles[j].position[i] / average - 1.0) > convergenceThreshold) {
          return false;
        }
      }
    }
    return true;
  }
}
