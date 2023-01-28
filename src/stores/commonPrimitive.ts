/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */
import create from 'zustand';

// avoid using undefined value in the store for now.
export interface PrimitiveStoreState {
  setPrimitiveStore: <K extends keyof PrimitiveStoreState, V extends PrimitiveStoreState[K]>(key: K, val: V) => void;

  simulationInProgress: boolean;
  simulationPaused: boolean;

  runDailyThermalSimulation: boolean;
  pauseDailyThermalSimulation: boolean;
  runYearlyThermalSimulation: boolean;
  pauseYearlyThermalSimulation: boolean;

  runDynamicSimulation: boolean;
  runStaticSimulation: boolean;
  pauseSimulation: boolean;

  runDailySimulationForParabolicDishes: boolean;
  runYearlySimulationForParabolicDishes: boolean;
  pauseDailySimulationForParabolicDishes: boolean;
  pauseYearlySimulationForParabolicDishes: boolean;
  dailyParabolicDishIndividualOutputs: boolean;
  yearlyParabolicDishIndividualOutputs: boolean;

  runDailySimulationForParabolicTroughs: boolean;
  runYearlySimulationForParabolicTroughs: boolean;
  pauseDailySimulationForParabolicTroughs: boolean;
  pauseYearlySimulationForParabolicTroughs: boolean;
  dailyParabolicTroughIndividualOutputs: boolean;
  yearlyParabolicTroughIndividualOutputs: boolean;

  runDailySimulationForFresnelReflectors: boolean;
  runYearlySimulationForFresnelReflectors: boolean;
  pauseDailySimulationForFresnelReflectors: boolean;
  pauseYearlySimulationForFresnelReflectors: boolean;
  dailyFresnelReflectorIndividualOutputs: boolean;
  yearlyFresnelReflectorIndividualOutputs: boolean;

  runDailySimulationForHeliostats: boolean;
  runYearlySimulationForHeliostats: boolean;
  pauseDailySimulationForHeliostats: boolean;
  pauseYearlySimulationForHeliostats: boolean;
  dailyHeliostatIndividualOutputs: boolean;
  yearlyHeliostatIndividualOutputs: boolean;

  runSolarPanelVisibilityAnalysis: boolean;
  runDailySimulationForSolarPanels: boolean;
  pauseDailySimulationForSolarPanels: boolean;
  runYearlySimulationForSolarPanels: boolean;
  pauseYearlySimulationForSolarPanels: boolean;
  runDailySimulationForSolarPanelsLastStep: boolean;
  runYearlySimulationForSolarPanelsLastStep: boolean;
  dailyPvIndividualOutputs: boolean;
  yearlyPvIndividualOutputs: boolean;

  runDailyLightSensor: boolean;
  pauseDailyLightSensor: boolean;
  runYearlyLightSensor: boolean;
  pauseYearlyLightSensor: boolean;

  runDailySimulationForUpdraftTower: boolean;
  runYearlySimulationForUpdraftTower: boolean;
  pauseDailySimulationForUpdraftTower: boolean;
  pauseYearlySimulationForUpdraftTower: boolean;
  dailyUpdraftTowerIndividualOutputs: boolean;
  yearlyUpdraftTowerIndividualOutputs: boolean;

  flagOfDailySimulation: boolean; // used as a flag to notify that daily results are ready

  showSolarRadiationHeatmap: boolean;
  showHeatFluxes: boolean;

  duringCameraInteraction: boolean;
}

export const usePrimitiveStore = create<PrimitiveStoreState>((set, get) => {
  return {
    setPrimitiveStore(key, val) {
      set((state) => {
        if (state[key] !== undefined) {
          state[key] = val;
        } else {
          console.error(`key ${key} is not defined in PrimitiveStoreState`);
        }
      });
    },

    simulationInProgress: false,
    simulationPaused: false,

    runDailyThermalSimulation: false,
    pauseDailyThermalSimulation: false,
    runYearlyThermalSimulation: false,
    pauseYearlyThermalSimulation: false,

    runDynamicSimulation: false,
    runStaticSimulation: false,
    pauseSimulation: false,

    runDailySimulationForParabolicDishes: false,
    runYearlySimulationForParabolicDishes: false,
    pauseDailySimulationForParabolicDishes: false,
    pauseYearlySimulationForParabolicDishes: false,
    dailyParabolicDishIndividualOutputs: false,
    yearlyParabolicDishIndividualOutputs: false,

    runDailySimulationForParabolicTroughs: false,
    runYearlySimulationForParabolicTroughs: false,
    pauseDailySimulationForParabolicTroughs: false,
    pauseYearlySimulationForParabolicTroughs: false,
    dailyParabolicTroughIndividualOutputs: false,
    yearlyParabolicTroughIndividualOutputs: false,

    runDailySimulationForFresnelReflectors: false,
    runYearlySimulationForFresnelReflectors: false,
    pauseDailySimulationForFresnelReflectors: false,
    pauseYearlySimulationForFresnelReflectors: false,
    dailyFresnelReflectorIndividualOutputs: false,
    yearlyFresnelReflectorIndividualOutputs: false,

    runDailySimulationForHeliostats: false,
    runYearlySimulationForHeliostats: false,
    pauseDailySimulationForHeliostats: false,
    pauseYearlySimulationForHeliostats: false,
    dailyHeliostatIndividualOutputs: false,
    yearlyHeliostatIndividualOutputs: false,

    runSolarPanelVisibilityAnalysis: false,
    runDailySimulationForSolarPanels: false,
    pauseDailySimulationForSolarPanels: false,
    runYearlySimulationForSolarPanels: false,
    pauseYearlySimulationForSolarPanels: false,
    runDailySimulationForSolarPanelsLastStep: false,
    runYearlySimulationForSolarPanelsLastStep: false,
    dailyPvIndividualOutputs: false,
    yearlyPvIndividualOutputs: false,

    runDailyLightSensor: false,
    pauseDailyLightSensor: false,
    runYearlyLightSensor: false,
    pauseYearlyLightSensor: false,

    runDailySimulationForUpdraftTower: false,
    runYearlySimulationForUpdraftTower: false,
    pauseDailySimulationForUpdraftTower: false,
    pauseYearlySimulationForUpdraftTower: false,
    dailyUpdraftTowerIndividualOutputs: false,
    yearlyUpdraftTowerIndividualOutputs: false,

    flagOfDailySimulation: false,

    showSolarRadiationHeatmap: false,
    showHeatFluxes: false,

    duringCameraInteraction: false,
  };
});
