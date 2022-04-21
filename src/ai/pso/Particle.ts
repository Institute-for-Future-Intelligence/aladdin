/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Random } from '../../Random';

export class Particle {
  position: number[]; // normalized to [0, 1)
  velocity: number[];

  // store the fitness value evaluated by the objective function (NaN means not evaluated yet)
  fitness: number = Number.NaN;

  // the position that results in the best ever fitness of this particle
  bestPositionOfParticle: number[];

  // construct a particle with a random position
  constructor(dimension: number) {
    this.position = new Array<number>();
    this.velocity = new Array<number>();
    this.bestPositionOfParticle = new Array<number>();
    for (let i = 0; i < dimension; i++) {
      const r = Math.random();
      this.position.push(r);
      this.bestPositionOfParticle.push(r);
      this.velocity.push(Random.gaussian() * 0.1);
    }
  }

  getCopy(): Particle {
    const c = new Particle(this.position.length);
    for (let i = 0; i < c.position.length; i++) {
      c.position[i] = this.position[i];
      c.velocity[i] = this.velocity[i];
      c.bestPositionOfParticle[i] = this.bestPositionOfParticle[i];
    }
    c.fitness = this.fitness;
    return c;
  }

  compare(p: Particle): number {
    if (isNaN(this.fitness) || isNaN(p.fitness)) throw new Error('Fitness cannot be NaN');
    if (this.fitness > p.fitness) return 1;
    if (this.fitness < p.fitness) return -1;
    return 0;
  }
}
