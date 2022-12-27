/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */
import create from 'zustand';

export interface PrimitiveStoreState {
  duringCameraInteraction: boolean;

  // store the calculated hourly heat exchange result between inside and outside through an element of a building
  hourlyHeatExchangeArrayMap: Map<string, number[]>;
  setHourlyHeatExchangeArray: (id: string, data: number[]) => void;
  clearHourlyHeatExchangeArrayMap: () => void;

  // store the calculated results for hourly solar heat gains of a building through windows
  hourlySolarHeatGainArrayMap: Map<string, number[]>;
  setHourlySolarHeatGainArray: (id: string, data: number[]) => void;
  clearHourlySolarHeatGainArrayMap: () => void;

  // store the calculated hourly heat exchange results of a building for sampled days throughout a year
  // 2D array: first is the month of the year, second is the hour of the day
  monthlyHeatExchangeArrayMap: Map<string, number[][]>;
  setMonthlyHeatExchangeArray: (id: string, data: number[][]) => void;
  monthlySolarHeatGainArrayMap: Map<string, number[][]>;
  setMonthlySolarHeatGainArray: (id: string, data: number[][]) => void;
  clearMonthlyEnergyArrayMap: () => void;
}

export const usePrimitiveStore = create<PrimitiveStoreState>((set, get) => {
  return {
    duringCameraInteraction: false,

    hourlyHeatExchangeArrayMap: new Map<string, number[]>(),
    setHourlyHeatExchangeArray(id, data) {
      const map = get().hourlyHeatExchangeArrayMap;
      map.set(id, data);
      set((state) => {
        // must create a new map in order to trigger re-rendering
        state.hourlyHeatExchangeArrayMap = new Map(map);
      });
    },
    clearHourlyHeatExchangeArrayMap() {
      set((state) => {
        // must create a new empty map in order to trigger re-rendering
        state.hourlyHeatExchangeArrayMap = new Map();
      });
    },

    hourlySolarHeatGainArrayMap: new Map<string, number[]>(),
    setHourlySolarHeatGainArray(id, data) {
      const map = get().hourlySolarHeatGainArrayMap;
      map.set(id, data);
      set((state) => {
        // must create a new map in order to trigger re-rendering
        state.hourlySolarHeatGainArrayMap = new Map(map);
      });
    },
    clearHourlySolarHeatGainArrayMap() {
      set((state) => {
        // must create a new empty map in order to trigger re-rendering
        state.hourlySolarHeatGainArrayMap = new Map();
      });
    },

    monthlyHeatExchangeArrayMap: new Map<string, number[][]>(),
    setMonthlyHeatExchangeArray(id, data) {
      const map = get().monthlyHeatExchangeArrayMap;
      map.set(id, data);
      set((state) => {
        // must create a new map in order to trigger re-rendering
        state.monthlyHeatExchangeArrayMap = new Map(map);
      });
    },

    monthlySolarHeatGainArrayMap: new Map<string, number[][]>(),
    setMonthlySolarHeatGainArray(id, data) {
      const map = get().monthlySolarHeatGainArrayMap;
      map.set(id, data);
      set((state) => {
        // must create a new map in order to trigger re-rendering
        state.monthlySolarHeatGainArrayMap = new Map(map);
      });
    },

    clearMonthlyEnergyArrayMap() {
      set((state) => {
        // must create a new empty map in order to trigger re-rendering
        state.monthlyHeatExchangeArrayMap = new Map();
        state.monthlySolarHeatGainArrayMap = new Map();
      });
    },
  };
});
