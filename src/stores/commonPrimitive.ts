/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */
import create from 'zustand';

// avoid using undefined value in the store for now.
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
    setPrimitiveStore(key, val) {
      set((state) => {
        if (state[key] !== undefined) {
          state[key] = val;
        } else {
          console.error(`key ${key} is not defined in PrimitiveStoreState`);
        }
      });
    },

    duringCameraInteraction: false,

    flagOfDailySimulation: false,

    showSolarRadiationHeatmap: false,

    duringCameraInteraction: false,
  };
});
