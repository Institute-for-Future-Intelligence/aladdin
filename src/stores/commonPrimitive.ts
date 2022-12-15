/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */
import create from 'zustand';

export interface PrimitiveStoreState {
  duringCameraInteraction: boolean;

  // store the calculated hourly heat exchange result between inside and outside through an element of a building
  hourlyHeatExchangeArrayMap: Map<string, number[]>;
  setHeatExchangeAtHour: (id: string, hour: number, data: number) => void;
  getHourlyHeatExchangeArray: (id: string) => number[] | undefined;
  resetHourlyHeatExchangeArray: (id: string) => void;
  clearHourlyHeatExchangeArrayMap: () => void;
}

export const usePrimitiveStore = create<PrimitiveStoreState>((set, get) => {
  return {
    duringCameraInteraction: false,

    hourlyHeatExchangeArrayMap: new Map<string, number[]>(),
    setHeatExchangeAtHour(id, hour, data) {
      let a = get().hourlyHeatExchangeArrayMap.get(id);
      if (!a) {
        a = new Array(24).fill(0);
        get().hourlyHeatExchangeArrayMap.set(id, a);
      }
      a[hour] = data;
    },
    getHourlyHeatExchangeArray(id) {
      return get().hourlyHeatExchangeArrayMap.get(id);
    },
    resetHourlyHeatExchangeArray(id) {
      get().hourlyHeatExchangeArrayMap.get(id)?.fill(0);
    },
    clearHourlyHeatExchangeArrayMap() {
      get().hourlyHeatExchangeArrayMap.clear();
    },
  };
});
