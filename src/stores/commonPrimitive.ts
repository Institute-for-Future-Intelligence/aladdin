/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */
import create from 'zustand';

export interface PrimitiveStoreState {
  runDailyThermalSimulation: boolean;
  pauseDailyThermalSimulation: boolean;
  runYearlyThermalSimulation: boolean;
  pauseYearlyThermalSimulation: boolean;

  runDynamicSimulation: boolean;
  runStaticSimulation: boolean;
  pauseSimulation: boolean;

  flagOfDailySimulation: boolean; // used as a flag to notify that daily results are ready

  showSolarRadiationHeatmap: boolean;

  duringCameraInteraction: boolean;
}

export const usePrimitiveStore = create<PrimitiveStoreState>((set, get) => {
  return {
    runDailyThermalSimulation: false,
    pauseDailyThermalSimulation: false,
    runYearlyThermalSimulation: false,
    pauseYearlyThermalSimulation: false,

    runDynamicSimulation: false,
    runStaticSimulation: false,
    pauseSimulation: false,

    flagOfDailySimulation: false,

    showSolarRadiationHeatmap: false,

    duringCameraInteraction: false,
  };
});
