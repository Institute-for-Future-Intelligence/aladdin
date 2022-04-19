/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Individual } from './Individual';

export class Parents {
  dad: Individual;
  mom: Individual;

  constructor(dad: Individual, mom: Individual) {
    this.dad = dad;
    this.mom = mom;
  }

  equals(p: Parents): boolean {
    return (p.dad === this.dad && p.mom === this.mom) || (p.dad === this.mom && p.mom === this.dad);
  }
}
