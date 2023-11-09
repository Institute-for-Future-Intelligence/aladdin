/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import { create } from 'zustand';
import { DatumEntry } from '../types';
import { Vantage } from '../analysis/Vantage';
import { Util } from '../Util';
import { useStore } from './common';
import { usePrimitiveStore } from './commonPrimitive';
import { Vector3 } from 'three';

export interface DataStoreState {
  dailyLightSensorData: DatumEntry[];
  setDailyLightSensorData: (data: DatumEntry[]) => void;
  yearlyLightSensorData: DatumEntry[];
  setYearlyLightSensorData: (data: DatumEntry[]) => void;
  sensorLabels: string[];
  setSensorLabels: (labels: string[]) => void;

  dailyPvYield: DatumEntry[];
  setDailyPvYield: (data: DatumEntry[]) => void;
  sumDailyPvYield: () => number;
  getDailyPvProfit: () => number;
  yearlyPvYield: DatumEntry[];
  setYearlyPvYield: (data: DatumEntry[]) => void;
  sumYearlyPvYield: () => number;
  getYearlyPvProfit: () => number;
  solarPanelLabels: string[];
  setSolarPanelLabels: (labels: string[]) => void;
  solarPanelVisibilityResults: Map<Vantage, Map<string, number>>;
  setSolarPanelVisibilityResult: (vantage: Vantage, result: Map<string, number>) => void;
  clearSolarPanelVisibilityResults: () => void;

  dailyParabolicDishYield: DatumEntry[];
  setDailyParabolicDishYield: (data: DatumEntry[]) => void;
  sumDailyParabolicDishYield: () => number;
  yearlyParabolicDishYield: DatumEntry[];
  setYearlyParabolicDishYield: (data: DatumEntry[]) => void;
  sumYearlyParabolicDishYield: () => number;
  parabolicDishLabels: string[];
  setParabolicDishLabels: (labels: string[]) => void;

  dailyParabolicTroughYield: DatumEntry[];
  setDailyParabolicTroughYield: (data: DatumEntry[]) => void;
  sumDailyParabolicTroughYield: () => number;
  yearlyParabolicTroughYield: DatumEntry[];
  setYearlyParabolicTroughYield: (data: DatumEntry[]) => void;
  sumYearlyParabolicTroughYield: () => number;
  parabolicTroughLabels: string[];
  setParabolicTroughLabels: (labels: string[]) => void;

  dailyFresnelReflectorYield: DatumEntry[];
  setDailyFresnelReflectorYield: (data: DatumEntry[]) => void;
  sumDailyFresnelReflectorYield: () => number;
  yearlyFresnelReflectorYield: DatumEntry[];
  setYearlyFresnelReflectorYield: (data: DatumEntry[]) => void;
  sumYearlyFresnelReflectorYield: () => number;
  fresnelReflectorLabels: string[];
  setFresnelReflectorLabels: (labels: string[]) => void;

  dailyHeliostatYield: DatumEntry[];
  setDailyHeliostatYield: (data: DatumEntry[]) => void;
  sumDailyHeliostatYield: () => number;
  yearlyHeliostatYield: DatumEntry[];
  setYearlyHeliostatYield: (data: DatumEntry[]) => void;
  sumYearlyHeliostatYield: () => number;
  heliostatLabels: string[];
  setHeliostatLabels: (labels: string[]) => void;

  dailyUpdraftTowerResults: DatumEntry[];
  dailyUpdraftTowerYield: DatumEntry[];
  setDailyUpdraftTowerResults: (data: DatumEntry[]) => void;
  setDailyUpdraftTowerYield: (data: DatumEntry[]) => void;
  sumDailyUpdraftTowerYield: () => number;
  yearlyUpdraftTowerYield: DatumEntry[];
  setYearlyUpdraftTowerYield: (data: DatumEntry[]) => void;
  sumYearlyUpdraftTowerYield: () => number;
  updraftTowerLabels: string[];
  setUpdraftTowerLabels: (labels: string[]) => void;

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

  // for logger: store the calculated total heater, AC, and solar panel results of building energy analysis
  totalBuildingHeater: number;
  setTotalBuildingHeater: (heater: number) => void;
  totalBuildingAc: number;
  setTotalBuildingAc: (ac: number) => void;
  totalBuildingSolarPanel: number;
  setTotalBuildingSolarPanel: (solarPanel: number) => void;

  roofSegmentVerticesMap: Map<string, Vector3[][]>; // key: roofId, val: [segmentIndex][vertex]
  setRoofSegmentVertices: (id: string, vertices: Vector3[][]) => void;
  getRoofSegmentVertices: (id: string) => Vector3[][] | undefined;
  deleteRoofSegmentVertices: (id: string) => void;

  roofSegmentVerticesWithoutOverhangMap: Map<string, Vector3[][]>; // key: roofId, val: [segmentIndex][vertex]
  setRoofSegmentVerticesWithoutOverhang: (id: string, vertices: Vector3[][]) => void;
  getRoofSegmentVerticesWithoutOverhang: (id: string) => Vector3[][] | undefined;
  deleteRoofSegmentVerticesWithoutOverhang: (id: string) => void;

  clearDataStore: () => void;
  clearRoofVerticesMap: () => void;
}

export const useDataStore = create<DataStoreState>()((set, get) => {
  return {
    roofSegmentVerticesMap: new Map<string, Vector3[][]>(),
    setRoofSegmentVertices(id, vertices) {
      // this set doesn't mutate map, so it won't cause re-render. But its value is updated when we are using it.
      set((state) => {
        state.roofSegmentVerticesMap.set(id, [...vertices]);
        return state;
      });
    },
    getRoofSegmentVertices(id) {
      return get().roofSegmentVerticesMap.get(id);
    },
    deleteRoofSegmentVertices(id) {
      set((state) => {
        state.roofSegmentVerticesMap.delete(id);
        return state;
      });
    },

    roofSegmentVerticesWithoutOverhangMap: new Map<string, Vector3[][]>(),
    setRoofSegmentVerticesWithoutOverhang(id, vertices) {
      // this set mutate map, so it won't cause re-render. But its value is updated when we are using it.
      set((state) => {
        state.roofSegmentVerticesWithoutOverhangMap.set(id, vertices);
        return state;
      });
    },
    getRoofSegmentVerticesWithoutOverhang(id) {
      return get().roofSegmentVerticesWithoutOverhangMap.get(id);
    },
    deleteRoofSegmentVerticesWithoutOverhang(id) {
      set((state) => {
        state.roofSegmentVerticesWithoutOverhangMap.delete(id);
        return state;
      });
    },

    dailyLightSensorData: [],
    setDailyLightSensorData(data) {
      set((state) => {
        state.dailyLightSensorData = [...data];
        return state;
      });
    },
    yearlyLightSensorData: [],
    setYearlyLightSensorData(data) {
      set((state) => {
        state.yearlyLightSensorData = [...data];
        return state;
      });
    },
    sensorLabels: [],
    setSensorLabels(labels) {
      set((state) => {
        state.sensorLabels = [...labels];
        return state;
      });
    },

    dailyPvYield: [],
    setDailyPvYield(data) {
      set((state) => {
        state.dailyPvYield = [...data];
        return state;
      });
      // increment the index of objective evaluation to notify the genetic algorithm that
      // this simulation has completed and the result has been reported to the common store
      usePrimitiveStore.getState().set((state) => {
        if (state.runEvolution) {
          state.objectiveEvaluationIndex++;
        }
        return state;
      });
    },
    sumDailyPvYield() {
      let sum = 0;
      for (const datum of this.dailyPvYield) {
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
    getDailyPvProfit() {
      const dailyYield = this.sumDailyPvYield();
      const solarPanelNumber = Util.countAllSolarPanels();
      return (
        dailyYield * useStore.getState().economicsParams.electricitySellingPrice -
        solarPanelNumber * useStore.getState().economicsParams.operationalCostPerUnit
      );
    },
    yearlyPvYield: [],
    setYearlyPvYield(data) {
      set((state) => {
        state.yearlyPvYield = [...data];
        return state;
      });
      // increment the index of objective evaluation to notify the genetic algorithm that
      // this simulation has completed and the result has been reported to the common store
      usePrimitiveStore.getState().set((state) => {
        if (state.runEvolution) {
          state.objectiveEvaluationIndex++;
        }
        return state;
      });
    },
    sumYearlyPvYield() {
      let sum = 0;
      for (const datum of this.yearlyPvYield) {
        for (const prop in datum) {
          if (datum.hasOwnProperty(prop)) {
            if (prop !== 'Month') {
              sum += datum[prop] as number;
            }
          }
        }
      }
      const yearScaleFactor = 12 / (useStore.getState().world?.daysPerYear ?? 6);
      return sum * yearScaleFactor;
    },
    getYearlyPvProfit() {
      const solarPanelNumber = Util.countAllSolarPanels();
      const yearlyYield = this.sumYearlyPvYield();
      return (
        yearlyYield * useStore.getState().economicsParams.electricitySellingPrice -
        solarPanelNumber * useStore.getState().economicsParams.operationalCostPerUnit * 365
      );
    },
    solarPanelLabels: [],
    setSolarPanelLabels(labels) {
      set((state) => {
        state.solarPanelLabels = [...labels];
        return state;
      });
    },
    solarPanelVisibilityResults: new Map<Vantage, Map<string, number>>(),
    setSolarPanelVisibilityResult(vantage, result) {
      set((state) => {
        state.solarPanelVisibilityResults.set(vantage, result);
        return state;
      });
    },
    clearSolarPanelVisibilityResults() {
      set((state) => {
        // must create a new map in order for the dependency on it to change for re-rendering
        state.solarPanelVisibilityResults = new Map<Vantage, Map<string, number>>();
        return state;
      });
    },

    dailyParabolicDishYield: [],
    setDailyParabolicDishYield(data) {
      set((state) => {
        state.dailyParabolicDishYield = [...data];
        return state;
      });
    },
    sumDailyParabolicDishYield() {
      let sum = 0;
      for (const datum of this.dailyParabolicDishYield) {
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
    yearlyParabolicDishYield: [],
    setYearlyParabolicDishYield(data) {
      set((state) => {
        state.yearlyParabolicDishYield = [...data];
        return state;
      });
    },
    sumYearlyParabolicDishYield() {
      let sum = 0;
      for (const datum of this.yearlyParabolicDishYield) {
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
    parabolicDishLabels: [],
    setParabolicDishLabels(labels) {
      set((state) => {
        state.parabolicDishLabels = [...labels];
        return state;
      });
    },

    dailyParabolicTroughYield: [],
    setDailyParabolicTroughYield(data) {
      set((state) => {
        state.dailyParabolicTroughYield = [...data];
        return state;
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
      set((state) => {
        state.yearlyParabolicTroughYield = [...data];
        return state;
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
      set((state) => {
        state.parabolicTroughLabels = [...labels];
        return state;
      });
    },

    dailyFresnelReflectorYield: [],
    setDailyFresnelReflectorYield(data) {
      set((state) => {
        state.dailyFresnelReflectorYield = [...data];
        return state;
      });
    },
    sumDailyFresnelReflectorYield() {
      let sum = 0;
      for (const datum of this.dailyFresnelReflectorYield) {
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
    yearlyFresnelReflectorYield: [],
    setYearlyFresnelReflectorYield(data) {
      set((state) => {
        state.yearlyFresnelReflectorYield = [...data];
        return state;
      });
    },
    sumYearlyFresnelReflectorYield() {
      let sum = 0;
      for (const datum of this.yearlyFresnelReflectorYield) {
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
    fresnelReflectorLabels: [],
    setFresnelReflectorLabels(labels) {
      set((state) => {
        state.fresnelReflectorLabels = [...labels];
        return state;
      });
    },

    dailyHeliostatYield: [],
    setDailyHeliostatYield(data) {
      set((state) => {
        state.dailyHeliostatYield = [...data];
        return state;
      });
    },
    sumDailyHeliostatYield() {
      let sum = 0;
      for (const datum of this.dailyHeliostatYield) {
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
    yearlyHeliostatYield: [],
    setYearlyHeliostatYield(data) {
      set((state) => {
        state.yearlyHeliostatYield = [...data];
        return state;
      });
    },
    sumYearlyHeliostatYield() {
      let sum = 0;
      for (const datum of this.yearlyHeliostatYield) {
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
    heliostatLabels: [],
    setHeliostatLabels(labels) {
      set((state) => {
        state.heliostatLabels = [...labels];
        return state;
      });
    },

    dailyUpdraftTowerResults: [],
    dailyUpdraftTowerYield: [],
    setDailyUpdraftTowerResults(data) {
      set((state) => {
        state.dailyUpdraftTowerResults = [...data];
        return state;
      });
    },
    setDailyUpdraftTowerYield(data) {
      set((state) => {
        state.dailyUpdraftTowerYield = [...data];
        return state;
      });
    },
    sumDailyUpdraftTowerYield() {
      let sum = 0;
      for (const datum of this.dailyUpdraftTowerYield) {
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
    yearlyUpdraftTowerYield: [],
    setYearlyUpdraftTowerYield(data) {
      set((state) => {
        state.yearlyUpdraftTowerYield = [...data];
        return state;
      });
    },
    sumYearlyUpdraftTowerYield() {
      let sum = 0;
      for (const datum of this.yearlyUpdraftTowerYield) {
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
    updraftTowerLabels: [],
    setUpdraftTowerLabels(labels) {
      set((state) => {
        state.updraftTowerLabels = [...labels];
        return state;
      });
    },

    heatmaps: new Map<string, number[][]>(),
    setHeatmap(id, data) {
      set((state) => {
        state.heatmaps.set(id, data);
        return state;
      });
    },
    getHeatmap(id) {
      return get().heatmaps.get(id);
    },

    hourlyHeatExchangeArrayMap: new Map<string, number[]>(),
    setHourlyHeatExchangeArray(id, data) {
      set((state) => {
        state.hourlyHeatExchangeArrayMap.set(id, data);
        return state;
      });
    },

    hourlySolarHeatGainArrayMap: new Map<string, number[]>(),
    setHourlySolarHeatGainArray(id, data) {
      set((state) => {
        state.hourlySolarHeatGainArrayMap.set(id, data);
        return state;
      });
    },

    hourlySolarPanelOutputArrayMap: new Map<string, number[]>(),
    setHourlySolarPanelOutputArray(id, data) {
      set((state) => {
        state.hourlySolarPanelOutputArrayMap.set(id, data);
        return state;
      });
    },

    totalBuildingHeater: 0,
    setTotalBuildingHeater: (heater: number) => {
      set((state) => {
        state.totalBuildingHeater = heater;
        return state;
      });
    },

    totalBuildingAc: 0,
    setTotalBuildingAc: (ac: number) => {
      set((state) => {
        state.totalBuildingAc = ac;
        return state;
      });
    },

    totalBuildingSolarPanel: 0,
    setTotalBuildingSolarPanel: (solarPanel: number) => {
      set((state) => {
        state.totalBuildingSolarPanel = solarPanel;
        return state;
      });
    },

    clearHeatmaps() {
      set((state) => {
        state.heatmaps.clear();
        return state;
      });
    },

    clearDataStore() {
      set({
        // create a new empty map in the following
        // do not just clear it as it may not trigger re-rendering

        heatmaps: new Map<string, number[][]>(),
        hourlyHeatExchangeArrayMap: new Map<string, number[]>(),
        hourlySolarHeatGainArrayMap: new Map<string, number[]>(),
        hourlySolarPanelOutputArrayMap: new Map<string, number[]>(),
        solarPanelVisibilityResults: new Map<Vantage, Map<string, number>>(),

        // create a new empty array in the following
        // do not just set the length to zero as it will not trigger re-rendering

        dailyLightSensorData: [],
        yearlyLightSensorData: [],
        sensorLabels: [],

        dailyPvYield: [],
        yearlyPvYield: [],
        solarPanelLabels: [],

        dailyParabolicDishYield: [],
        yearlyParabolicDishYield: [],
        parabolicDishLabels: [],

        dailyParabolicTroughYield: [],
        yearlyParabolicTroughYield: [],
        parabolicTroughLabels: [],

        dailyFresnelReflectorYield: [],
        yearlyFresnelReflectorYield: [],
        fresnelReflectorLabels: [],

        dailyHeliostatYield: [],
        yearlyHeliostatYield: [],
        heliostatLabels: [],

        dailyUpdraftTowerYield: [],
        dailyUpdraftTowerResults: [],
        yearlyUpdraftTowerYield: [],
        updraftTowerLabels: [],
      });
    },
    clearRoofVerticesMap() {
      set((state) => {
        state.roofSegmentVerticesMap.clear();
        state.roofSegmentVerticesWithoutOverhangMap.clear();
        return state;
      });
    },
  };
});
