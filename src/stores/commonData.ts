/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */
import create from 'zustand';
import { produce } from 'immer';
import { DatumEntry } from '../types';

export interface DataStoreState {
  set: (fn: (state: DataStoreState) => void) => void;

  dailyParabolicTroughYield: DatumEntry[];
  setDailyParabolicTroughYield: (data: DatumEntry[]) => void;
  sumDailyParabolicTroughYield: () => number;
  yearlyParabolicTroughYield: DatumEntry[];
  setYearlyParabolicTroughYield: (data: DatumEntry[]) => void;
  sumYearlyParabolicTroughYield: () => number;
  parabolicTroughLabels: string[];
  setParabolicTroughLabels: (labels: string[]) => void;

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
  const immerSet: DataStoreState['set'] = (fn) => set(produce(fn));
  return {
    set: (fn) => {
      try {
        immerSet(fn);
      } catch (e) {
        console.log(e);
      }
    },

    dailyParabolicTroughYield: [],
    setDailyParabolicTroughYield(data) {
      immerSet((state) => {
        state.dailyParabolicTroughYield = [...data];
      });
    },
    sumDailyParabolicTroughYield() {
      let sum = 0;
      for (const datum of this.dailyParabolicTroughYield) {
        for (const prop in datum) {
          if (datum.hasOwnProperty(prop)) {
            if (prop !== 'Hour') {
              sum += datum[prop] as number;
            }
          }
        }
      }
      return sum;
    },
    yearlyParabolicTroughYield: [],
    setYearlyParabolicTroughYield(data) {
      immerSet((state) => {
        state.yearlyParabolicTroughYield = [...data];
      });
    },
    sumYearlyParabolicTroughYield() {
      let sum = 0;
      for (const datum of this.yearlyParabolicTroughYield) {
        for (const prop in datum) {
          if (datum.hasOwnProperty(prop)) {
            if (prop !== 'Month') {
              sum += datum[prop] as number;
            }
          }
        }
      }
      return sum;
    },
    parabolicTroughLabels: [],
    setParabolicTroughLabels(labels) {
      immerSet((state) => {
        state.parabolicTroughLabels = [...labels];
      });
    },

    heatmaps: new Map<string, number[][]>(),
    setHeatmap(id, data) {
      immerSet((state) => {
        state.heatmaps.set(id, data);
      });
    },
    getHeatmap(id) {
      return get().heatmaps.get(id);
    },

    hourlyHeatExchangeArrayMap: new Map<string, number[]>(),
    setHourlyHeatExchangeArray(id, data) {
      immerSet((state) => {
        state.hourlyHeatExchangeArrayMap.set(id, data);
      });
    },

    hourlySolarHeatGainArrayMap: new Map<string, number[]>(),
    setHourlySolarHeatGainArray(id, data) {
      immerSet((state) => {
        state.hourlySolarHeatGainArrayMap.set(id, data);
      });
    },

    hourlySolarPanelOutputArrayMap: new Map<string, number[]>(),
    setHourlySolarPanelOutputArray(id, data) {
      immerSet((state) => {
        state.hourlySolarPanelOutputArrayMap.set(id, data);
      });
    },

    clearHeatmaps() {
      immerSet((state) => {
        state.heatmaps.clear();
      });
    },

    clearDataStore() {
      immerSet((state) => {
        state.heatmaps.clear();
        state.hourlyHeatExchangeArrayMap.clear();
        state.hourlySolarHeatGainArrayMap.clear();
        state.hourlySolarPanelOutputArrayMap.clear();

        state.dailyParabolicTroughYield.length = 0;
        state.yearlyParabolicTroughYield.length = 0;
      });
    },
  };
});
