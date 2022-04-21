/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Particle } from './Particle';

export class Swarm {
  particles: Particle[];
  inertia: number = 0.8;
  cognitiveCoefficient: number = 0.1;
  socialCoefficient: number = 0.1;

  // the normalized position that results in the best ever fitness of this swarm
  bestPositionOfSwarm: number[];
  bestFitness: number = Number.NaN;

  constructor(size: number, dimension: number) {
    this.particles = new Array<Particle>();
    for (let i = 0; i < size; i++) {
      this.particles.push(new Particle(dimension));
    }
    this.bestPositionOfSwarm = new Array<number>(dimension);
  }

  move() {
    for (const p of this.particles) {
      const n = p.position.length;
      for (let i = 0; i < n; i++) {
        p.velocity[i] =
          this.inertia * p.velocity[i] +
          this.cognitiveCoefficient * Math.random() * (p.bestPositionOfParticle[i] - p.position[i]) +
          this.socialCoefficient * Math.random() * (this.bestPositionOfSwarm[i] - p.position[i]);
        p.position[i] += p.velocity[i];
      }
    }
  }

  // sort the fitness in the descending order (sort b before a if b's fitness is higher than a's)
  sort(): void {
    this.particles.sort((a, b) => b.compare(a));
    for (let i = 0; i < this.bestPositionOfSwarm.length; i++) {
      this.bestPositionOfSwarm[i] = this.particles[0].position[i];
    }
    this.bestFitness = this.particles[0].fitness;
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
