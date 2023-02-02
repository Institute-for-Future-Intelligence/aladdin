/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import { immerable } from 'immer';
import { GraphState } from './GraphState';

export class DefaultGraphState implements GraphState {
  // Needed for immer drafting to work properly: https://immerjs.github.io/immer/docs/complex-objects
  [immerable] = true;

  dailyPvIndividualOutputs: boolean;
  yearlyPvIndividualOutputs: boolean;

  dailyParabolicDishIndividualOutputs: boolean;
  yearlyParabolicDishIndividualOutputs: boolean;

  dailyParabolicTroughIndividualOutputs: boolean;
  yearlyParabolicTroughIndividualOutputs: boolean;

  dailyFresnelReflectorIndividualOutputs: boolean;
  yearlyFresnelReflectorIndividualOutputs: boolean;

  dailyHeliostatIndividualOutputs: boolean;
  yearlyHeliostatIndividualOutputs: boolean;

  dailyUpdraftTowerIndividualOutputs: boolean;
  yearlyUpdraftTowerIndividualOutputs: boolean;

  constructor() {
    this.dailyPvIndividualOutputs = false;
    this.yearlyPvIndividualOutputs = false;

    this.dailyParabolicDishIndividualOutputs = false;
    this.yearlyParabolicDishIndividualOutputs = false;

    this.dailyParabolicTroughIndividualOutputs = false;
    this.yearlyParabolicTroughIndividualOutputs = false;

    this.dailyFresnelReflectorIndividualOutputs = false;
    this.yearlyFresnelReflectorIndividualOutputs = false;

    this.dailyHeliostatIndividualOutputs = false;
    this.yearlyHeliostatIndividualOutputs = false;

    this.dailyUpdraftTowerIndividualOutputs = false;
    this.yearlyUpdraftTowerIndividualOutputs = false;
  }
}
