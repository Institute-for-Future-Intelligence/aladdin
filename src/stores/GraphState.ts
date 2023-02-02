/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

export interface GraphState {
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
}
