/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

export class Particle {
  position: number[];
  velocity: number[];

  // store the fitness value evaluated by the objective function (NaN means not evaluated yet)
  fitness: number = Number.NaN;

  // the position that results in the best ever fitness of this particle
  bestPositionOfParticle: number[];

  // construct a particle with a random position
  constructor(dimension: number) {
    this.position = new Array<number>();
    for (let i = 0; i < dimension; i++) {
      this.position.push(Math.random());
    }
    this.velocity = new Array<number>(dimension);
    this.bestPositionOfParticle = new Array<number>(dimension);
  }

  getCopy(): Particle {
    const c = new Particle(this.position.length);
    for (let i = 0; i < c.position.length; i++) {
      c.position[i] = this.position[i];
    }
    c.fitness = this.fitness;
    return c;
  }
}
