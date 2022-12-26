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

  // store the calculated results for hourly solar heat gains of a building through windows
  hourlySolarHeatGainArrayMap: Map<string, number[]>;
  setHourlySolarHeatGainArray: (id: string, data: number[]) => void;
  getHourlySolarHeatGainArray: (id: string) => number[] | undefined;
  clearHourlySolarHeatGainArrayMap: () => void;

  // store the calculated daily heating/cooling results of a building for sampled months
  monthlyHeatingArrayMap: Map<string, number[]>;
  setMonthlyHeatingArray: (id: string, data: number[]) => void;
  getMonthlyHeatingArray: (id: string) => number[] | undefined;
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
        state.hourlyHeatExchangeArrayMap.clear();
      });
    },

    hourlySolarHeatGainArrayMap: new Map<string, number[]>(),
    setHourlySolarHeatGainArray(id, data) {
      const map = get().hourlySolarHeatGainArrayMap;
      map.set(id, data);
      set((state) => {
        state.hourlySolarHeatGainArrayMap = new Map(map);
      });
    },
    getHourlySolarHeatGainArray(id) {
      return get().hourlySolarHeatGainArrayMap.get(id);
    },
    clearHourlySolarHeatGainArrayMap() {
      set((state) => {
        state.hourlySolarHeatGainArrayMap.clear();
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
        state.monthlyHeatingArrayMap.clear();
        state.monthlyCoolingArrayMap.clear();
      });
    },
  };
});
