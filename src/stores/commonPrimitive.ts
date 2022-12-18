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

  // store the calculated daily heat exchange result between inside and outside through an element of a building
  // for selected months
  monthlyHeatExchangeArrayMap: Map<string, number[]>;
  setMonthlyHeatExchangeArray: (id: string, data: number[]) => void;
  getMonthlyHeatExchangeArray: (id: string) => number[] | undefined;
  clearMonthlyHeatExchangeArrayMap: () => void;
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

    monthlyHeatExchangeArrayMap: new Map<string, number[]>(),
    setMonthlyHeatExchangeArray(id, data) {
      const map = get().monthlyHeatExchangeArrayMap;
      map.set(id, data);
      set((state) => {
        state.monthlyHeatExchangeArrayMap = new Map(map);
      });
    },
    getMonthlyHeatExchangeArray(id) {
      return get().monthlyHeatExchangeArrayMap.get(id);
    },
    clearMonthlyHeatExchangeArrayMap() {
      set((state) => {
        state.monthlyHeatExchangeArrayMap = new Map();
      });
    },
  };
});
