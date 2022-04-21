/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Random } from '../../../Random';

export class Particle {
  position: number[]; // normalized to [0, 1)
  velocity: number[];

  // store the fitness value evaluated by the objective function (NaN means not evaluated yet)
  fitness: number = Number.NaN;

  // the position that results in the best ever fitness of this particle
  bestPositionOfParticle: number[];

  // construct a particle with a random position within [0, 1) and
  // a random velocity within vmax as the variance of the normal distribution and zero as the average
  constructor(dimension: number, vmax?: number) {
    this.position = new Array<number>();
    this.velocity = new Array<number>();
    this.bestPositionOfParticle = new Array<number>();
    for (let i = 0; i < dimension; i++) {
      const r = Math.random();
      this.position.push(r);
      this.bestPositionOfParticle.push(r);
      if (vmax) this.velocity.push(Random.gaussian() * vmax);
    }
  }

  updateBestPosition() {
    for (let i = 0; i < this.bestPositionOfParticle.length; i++) {
      this.bestPositionOfParticle[i] = this.position[i];
    }
  }

  compare(p: Particle): number {
    if (isNaN(this.fitness) || isNaN(p.fitness)) throw new Error('Fitness cannot be NaN');
    if (this.fitness > p.fitness) return 1;
    if (this.fitness < p.fitness) return -1;
    return 0;
  }
}
