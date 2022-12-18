/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */
import create from 'zustand';

export interface PrimitiveStoreState {
  duringCameraInteraction: boolean;

  // store the calculated hourly heat exchange result between inside and outside through an element of a building
  hourlyHeatExchangeArrayMap: Map<string, number[]>;
  setHourlyHeatExchangeArray: (id: string, data: number[]) => void;
  getHourlyHeatExchangeArray: (id: string) => number[] | undefined;
  clearHourlyHeatExchangeArrayMap: () => void;

  // store the calculated daily heating results of a building for sampled months
  monthlyHeatingArrayMap: Map<string, number[]>;
  setMonthlyHeatingArray: (id: string, data: number[]) => void;
  getMonthlyHeatingArray: (id: string) => number[] | undefined;

  // store the calculated daily cooling results of a building for sampled months
  monthlyCoolingArrayMap: Map<string, number[]>;
  setMonthlyCoolingArray: (id: string, data: number[]) => void;
  getMonthlyCoolingArray: (id: string) => number[] | undefined;

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
        state.hourlyHeatExchangeArrayMap = new Map(map);
      });
    },
    getHourlyHeatExchangeArray(id) {
      return get().hourlyHeatExchangeArrayMap.get(id);
    },
    clearHourlyHeatExchangeArrayMap() {
      set((state) => {
        state.hourlyHeatExchangeArrayMap = new Map();
      });
    },

    monthlyHeatingArrayMap: new Map<string, number[]>(),
    setMonthlyHeatingArray(id, data) {
      const map = get().monthlyHeatingArrayMap;
      map.set(id, data);
      set((state) => {
        state.monthlyHeatingArrayMap = new Map(map);
      });
    },
    getMonthlyHeatingArray(id) {
      return get().monthlyHeatingArrayMap.get(id);
    },

    monthlyCoolingArrayMap: new Map<string, number[]>(),
    setMonthlyCoolingArray(id, data) {
      const map = get().monthlyCoolingArrayMap;
      map.set(id, data);
      set((state) => {
        state.monthlyCoolingArrayMap = new Map(map);
      });
    },
    getMonthlyCoolingArray(id) {
      return get().monthlyCoolingArrayMap.get(id);
    },

    clearMonthlyEnergyArrayMap() {
      set((state) => {
        state.monthlyHeatingArrayMap = new Map();
        state.monthlyCoolingArrayMap = new Map();
      });
    },
  };
});
