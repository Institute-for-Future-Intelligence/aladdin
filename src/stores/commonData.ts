/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */
import create from 'zustand';

export interface DataStoreState {
  // store the calculated heat map on the surface of an element
  heatmaps: Map<string, number[][]>;
  setHeatmap: (id: string, data: number[][]) => void;
  getHeatmap: (id: string) => number[][] | undefined;
  clearHeatmaps: () => void;

  // store the calculated hourly heat exchange result between inside and outside through an element of a building
  hourlyHeatExchangeArrayMap: Map<string, number[]>;
  setHourlyHeatExchangeArray: (id: string, data: number[]) => void;

  // store the calculated results for hourly solar heat gains of a building through windows
  hourlySolarHeatGainArrayMap: Map<string, number[]>;
  setHourlySolarHeatGainArray: (id: string, data: number[]) => void;

  // store the calculated results for hourly solar panel outputs of a building through windows
  hourlySolarPanelOutputArrayMap: Map<string, number[]>;
  setHourlySolarPanelOutputArray: (id: string, data: number[]) => void;

  clearDataStore: () => void;
}

export const useDataStore = create<DataStoreState>((set, get) => {
  return {
    heatmaps: new Map<string, number[][]>(),
    setHeatmap(id, data) {
      const map = get().heatmaps;
      map.set(id, data);
      set((state) => {
        // must create a new map in order to trigger re-rendering
        state.heatmaps = new Map(map);
      });
    },
    getHeatmap(id) {
      return get().heatmaps.get(id);
    },

    hourlyHeatExchangeArrayMap: new Map<string, number[]>(),
    setHourlyHeatExchangeArray(id, data) {
      const map = get().hourlyHeatExchangeArrayMap;
      map.set(id, data);
      set((state) => {
        // must create a new map in order to trigger re-rendering
        state.hourlyHeatExchangeArrayMap = new Map(map);
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

    hourlySolarPanelOutputArrayMap: new Map<string, number[]>(),
    setHourlySolarPanelOutputArray(id, data) {
      const map = get().hourlySolarPanelOutputArrayMap;
      map.set(id, data);
      set((state) => {
        // must create a new map in order to trigger re-rendering
        state.hourlySolarPanelOutputArrayMap = new Map(map);
      });
    },

    clearHeatmaps() {
      set((state) => {
        state.heatmaps = new Map<string, number[][]>();
      });
    },

    clearDataStore() {
      set((state) => {
        state.heatmaps = new Map<string, number[][]>();
        state.hourlyHeatExchangeArrayMap = new Map<string, number[]>();
        state.hourlySolarHeatGainArrayMap = new Map<string, number[]>();
        state.hourlySolarPanelOutputArrayMap = new Map<string, number[]>();
      });
    },
  };
});
