/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import create from 'zustand';
import { ModelType } from '../types';

// avoid using undefined value in the store for now.
export interface PrimitiveStoreState {
  setPrimitiveStore: <K extends keyof PrimitiveStoreState, V extends PrimitiveStoreState[K]>(key: K, val: V) => void;

  modelsMapFlag: boolean;
  publishOnModelsMapFlag: boolean;
  modelsMapWeatherStations: boolean;
  modelType: ModelType;
  modelLabel: string | undefined;

  userCount: number;
  showCloudFilePanel: boolean;
  showAccountSettingsPanel: boolean;

  animateSun: boolean;

  simulationInProgress: boolean;
  simulationPaused: boolean;
  evolutionInProgress: boolean;
  evolutionPaused: boolean;

  runEvolution: boolean;
  pauseEvolution: boolean;
  objectiveEvaluationIndex: number; // index for evaluating objective function in genetic algorithms

  runDailyThermalSimulation: boolean;
  pauseDailyThermalSimulation: boolean;
  runYearlyThermalSimulation: boolean;
  pauseYearlyThermalSimulation: boolean;
  clearDailySimulationResultsFlag: boolean;
  clearYearlySimulationResultsFlag: boolean;

  runDynamicSimulation: boolean;
  runStaticSimulation: boolean;
  pauseSimulation: boolean;

  runDailySimulationForParabolicDishes: boolean;
  runYearlySimulationForParabolicDishes: boolean;
  pauseDailySimulationForParabolicDishes: boolean;
  pauseYearlySimulationForParabolicDishes: boolean;

  runDailySimulationForParabolicTroughs: boolean;
  runYearlySimulationForParabolicTroughs: boolean;
  pauseDailySimulationForParabolicTroughs: boolean;
  pauseYearlySimulationForParabolicTroughs: boolean;

  runDailySimulationForFresnelReflectors: boolean;
  runYearlySimulationForFresnelReflectors: boolean;
  pauseDailySimulationForFresnelReflectors: boolean;
  pauseYearlySimulationForFresnelReflectors: boolean;

  runDailySimulationForHeliostats: boolean;
  runYearlySimulationForHeliostats: boolean;
  pauseDailySimulationForHeliostats: boolean;
  pauseYearlySimulationForHeliostats: boolean;

  runSolarPanelVisibilityAnalysis: boolean;
  runDailySimulationForSolarPanels: boolean;
  pauseDailySimulationForSolarPanels: boolean;
  runYearlySimulationForSolarPanels: boolean;
  pauseYearlySimulationForSolarPanels: boolean;
  runDailySimulationForSolarPanelsLastStep: boolean;
  runYearlySimulationForSolarPanelsLastStep: boolean;

  runDailyLightSensor: boolean;
  pauseDailyLightSensor: boolean;
  runYearlyLightSensor: boolean;
  pauseYearlyLightSensor: boolean;

  runDailySimulationForUpdraftTower: boolean;
  runYearlySimulationForUpdraftTower: boolean;
  pauseDailySimulationForUpdraftTower: boolean;
  pauseYearlySimulationForUpdraftTower: boolean;

  flagOfDailySimulation: boolean; // used as a flag to notify that daily results are ready

  showSolarRadiationHeatmap: boolean;
  showHeatFluxes: boolean;

  duringCameraInteraction: boolean;

  // element being deleted by esc when adding
  elementBeingCanceledId: string | null;

  showWallIntersectionPlaneId: string | null;
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

    modelsMapFlag: false,
    publishOnModelsMapFlag: false,
    modelsMapWeatherStations: false,
    modelType: ModelType.UNKNOWN,
    modelLabel: undefined,

    userCount: 0,
    showCloudFilePanel: false,
    showAccountSettingsPanel: false,

    animateSun: false,

    simulationInProgress: false,
    simulationPaused: false,
    evolutionInProgress: false,
    evolutionPaused: false,

    runEvolution: false,
    pauseEvolution: false,
    objectiveEvaluationIndex: 0,

    runDailyThermalSimulation: false,
    pauseDailyThermalSimulation: false,
    runYearlyThermalSimulation: false,
    pauseYearlyThermalSimulation: false,
    clearDailySimulationResultsFlag: false,
    clearYearlySimulationResultsFlag: false,

    runDynamicSimulation: false,
    runStaticSimulation: false,
    pauseSimulation: false,

    runDailySimulationForParabolicDishes: false,
    runYearlySimulationForParabolicDishes: false,
    pauseDailySimulationForParabolicDishes: false,
    pauseYearlySimulationForParabolicDishes: false,

    runDailySimulationForParabolicTroughs: false,
    runYearlySimulationForParabolicTroughs: false,
    pauseDailySimulationForParabolicTroughs: false,
    pauseYearlySimulationForParabolicTroughs: false,

    runDailySimulationForFresnelReflectors: false,
    runYearlySimulationForFresnelReflectors: false,
    pauseDailySimulationForFresnelReflectors: false,
    pauseYearlySimulationForFresnelReflectors: false,

    runDailySimulationForHeliostats: false,
    runYearlySimulationForHeliostats: false,
    pauseDailySimulationForHeliostats: false,
    pauseYearlySimulationForHeliostats: false,

    runSolarPanelVisibilityAnalysis: false,
    runDailySimulationForSolarPanels: false,
    pauseDailySimulationForSolarPanels: false,
    runYearlySimulationForSolarPanels: false,
    pauseYearlySimulationForSolarPanels: false,
    runDailySimulationForSolarPanelsLastStep: false,
    runYearlySimulationForSolarPanelsLastStep: false,

    runDailyLightSensor: false,
    pauseDailyLightSensor: false,
    runYearlyLightSensor: false,
    pauseYearlyLightSensor: false,

    runDailySimulationForUpdraftTower: false,
    runYearlySimulationForUpdraftTower: false,
    pauseDailySimulationForUpdraftTower: false,
    pauseYearlySimulationForUpdraftTower: false,

    flagOfDailySimulation: false,

    showSolarRadiationHeatmap: false,
    showHeatFluxes: false,

    duringCameraInteraction: false,

    elementBeingCanceledId: null,

    showWallIntersectionPlaneId: null,
  };
});
