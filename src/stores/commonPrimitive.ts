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
  };
});
