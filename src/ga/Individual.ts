/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

export class Individual {
  chromosome: number[];

  // store the fitness value evaluated by the objective function (NaN means not evaluated yet)
  fitness: number = Number.NaN;

  constructor(length: number, randomize: boolean, discretizationSteps: number) {
    this.chromosome = new Array(length);
    if (randomize) {
      if (discretizationSteps > 0) {
        for (let i = 0; i < length; i++) {
          const n = Math.floor(Math.random() * discretizationSteps);
          this.chromosome[i] = n / discretizationSteps;
        }
      } else {
        for (let i = 0; i < length; i++) {
          this.chromosome[i] = Math.random();
        }
      }
    }
  }

  copy(original: Individual): Individual {
    const c = new Individual(original.chromosome.length, false, 0);
    for (let i = 0; i < c.chromosome.length; i++) {
      c.chromosome[i] = original.chromosome[i];
    }
    this.fitness = original.fitness;
    return c;
  }

  compare(i: Individual): number {
    if (isNaN(this.fitness) || isNaN(i.fitness)) throw new Error('Fitness cannot be NaN');
    if (this.fitness > i.fitness) return 1;
    if (this.fitness < i.fitness) return -1;
    return 0;
  }

  setGene(i: number, g: number) {
    if (i < 0 || i >= this.chromosome.length) throw new Error('Gene index out of bound: ' + i);
    this.chromosome[i] = g;
  }

  getGene(i: number) {
    if (i < 0 || i >= this.chromosome.length) throw new Error('Gene index out of bound: ' + i);
    return this.chromosome[i];
  }

  copyGenes(original: Individual) {
    const n = Math.min(this.chromosome.length, original.chromosome.length);
    for (let i = 0; i < n; i++) {
      this.chromosome[i] = original.chromosome[i];
    }
  }
  /*
   * return the Euclidean distance between the chromosomes
   * phenotypic only as we don't use genotypic (bit) coding
   */
  distance(individual: Individual) {
    if (this.chromosome.length === 1) {
      return Math.abs(this.chromosome[0] - individual.chromosome[0]);
    }
    let sum = 0;
    for (let i = 0; i < this.chromosome.length; i++) {
      const d = this.chromosome[i] - individual.chromosome[i];
      sum += d * d;
    }
    return Math.sqrt(sum);
  }

  toString(): string {
    let s: string = '';
    for (const x of this.chromosome) {
      s += x + ', ';
    }
    return '(' + s.substring(0, s.length - 2) + ') : ' + this.fitness;
  }
}
