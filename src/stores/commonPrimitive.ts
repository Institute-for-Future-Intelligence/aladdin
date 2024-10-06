/*
 * @Copyright 2022-2024. Institute for Future Intelligence, Inc.
 */

import { createWithEqualityFn } from 'zustand/traditional';
import { DesignProblem } from '../types';
import produce from 'immer';

// avoid using undefined value in the store for now.
export interface PrimitiveStoreState {
  latestVersion: string | undefined;
  changed: boolean;
  setChanged: (b: boolean) => void;
  skipChange: boolean;
  setSkipChange: (b: boolean) => void;

  localFileName: string;
  createNewFileFlag: boolean;
  setCreateNewFileFlag: (b: boolean) => void;
  openLocalFileFlag: boolean;
  setOpenLocalFileFlag: (b: boolean) => void;

  waiting: boolean;

  contextMenuFlag: boolean;
  updateContextMenu: () => void;

  showEconomicsPanel: boolean;
  showNavigationPanel: boolean;
  showShadowSettings: boolean;

  saveAccountSettingsFlag: boolean;

  saveCloudFileFlag: boolean;
  setSaveCloudFileFlag: (b: boolean) => void;
  listCloudFilesFlag: boolean;
  refreshCloudFilesFlag: boolean;
  saveLocalFileDialogVisible: boolean;

  modelsMapFlag: boolean;
  leaderboardFlag: boolean;
  showLeaderboard: boolean;
  publishOnModelsMapFlag: boolean;
  modelsMapWeatherStations: boolean;

  createProjectFlag: boolean;
  saveProjectAsFlag: boolean;
  curateDesignToProjectFlag: boolean;
  showProjectsFlag: boolean;
  updateProjectsFlag: boolean;
  showProjectListPanel: boolean;
  projectImagesUpdateFlag: boolean;

  // These stores the settings from createNewProjectDialog.tsx, because we don't want to overwrite
  // the local state in the common store yet. Don't be confused with commonStore's projectState.
  projectType: DesignProblem;
  projectTitle: string | null;
  projectDescription: string | null;

  userCount: number;
  showCloudFilePanel: boolean;
  openModelsMap: boolean;
  showModelsGallery: boolean;
  showAccountSettingsPanel: boolean;
  showLikesPanel: boolean;
  showPublishedModelsPanel: boolean;

  animateSun: boolean;

  simulationInProgress: boolean;
  simulationPaused: boolean;
  evolutionInProgress: boolean;
  evolutionPaused: boolean;

  runEvolution: boolean;
  pauseEvolution: boolean;
  objectiveEvaluationIndex: number; // index for evaluating objective function in genetic algorithms

  runDailyThermalSimulation: boolean;
  pauseDailyThermalSimulation: boolean;
  runYearlyThermalSimulation: boolean;
  pauseYearlyThermalSimulation: boolean;
  clearDailySimulationResultsFlag: boolean;
  clearYearlySimulationResultsFlag: boolean;

  runDynamicSimulation: boolean;
  runStaticSimulation: boolean;
  pauseSimulation: boolean;

  runDailySimulationForParabolicDishes: boolean;
  runYearlySimulationForParabolicDishes: boolean;
  pauseDailySimulationForParabolicDishes: boolean;
  pauseYearlySimulationForParabolicDishes: boolean;

  runDailySimulationForParabolicTroughs: boolean;
  runYearlySimulationForParabolicTroughs: boolean;
  pauseDailySimulationForParabolicTroughs: boolean;
  pauseYearlySimulationForParabolicTroughs: boolean;

  runDailySimulationForFresnelReflectors: boolean;
  runYearlySimulationForFresnelReflectors: boolean;
  pauseDailySimulationForFresnelReflectors: boolean;
  pauseYearlySimulationForFresnelReflectors: boolean;

  runDailySimulationForHeliostats: boolean;
  runYearlySimulationForHeliostats: boolean;
  pauseDailySimulationForHeliostats: boolean;
  pauseYearlySimulationForHeliostats: boolean;

  runSolarPanelVisibilityAnalysis: boolean;
  runDailySimulationForSolarPanels: boolean;
  pauseDailySimulationForSolarPanels: boolean;
  runYearlySimulationForSolarPanels: boolean;
  pauseYearlySimulationForSolarPanels: boolean;
  runDailySimulationForSolarPanelsLastStep: boolean;
  runYearlySimulationForSolarPanelsLastStep: boolean;

  runDailyLightSensor: boolean;
  pauseDailyLightSensor: boolean;
  runYearlyLightSensor: boolean;
  pauseYearlyLightSensor: boolean;

  runDailySimulationForUpdraftTower: boolean;
  runYearlySimulationForUpdraftTower: boolean;
  pauseDailySimulationForUpdraftTower: boolean;
  pauseYearlySimulationForUpdraftTower: boolean;

  flagOfDailySimulation: boolean; // used as a flag to notify that daily results are ready

  showSolarRadiationHeatmap: boolean;
  showHeatFluxes: boolean;

  duringCameraInteraction: boolean;

  navigationMoveSpeed: number;
  navigationTurnSpeed: number;

  // element being deleted by esc when adding
  elementBeingCanceledId: string | null;

  showWallIntersectionPlaneId: string | null;

  oldParentId: string | null;
  oldFoundationId: string | null | undefined;

  // used for listen to auto deletion
  selectedElementId: string | null;

  foundationMovedFlag: boolean;
  updateFoundationMovedFlag: () => void;

  isCameraUnderGround: boolean;

  set: (fn: (state: PrimitiveStoreState) => void) => void;
  setPrimitiveStore: <K extends keyof PrimitiveStoreState, V extends PrimitiveStoreState[K]>(key: K, val: V) => void;
}

export const usePrimitiveStore = createWithEqualityFn<PrimitiveStoreState>()((set, get) => {
  const immerSet: PrimitiveStoreState['set'] = (fn) => set(produce(fn));

  return {
    set: (fn) => {
      try {
        immerSet(fn);
      } catch (e) {
        console.log(e);
      }
    },

    setPrimitiveStore(key, val) {
      immerSet((state) => {
        if (state[key] !== undefined) {
          state[key] = val;
        } else {
          console.error(`key ${key} is not defined in PrimitiveStoreState`);
        }
      });
    },

    latestVersion: undefined,

    changed: false,
    setChanged(b) {
      immerSet((state: PrimitiveStoreState) => {
        state.changed = b;
      });
    },
    skipChange: true,
    setSkipChange(b) {
      immerSet((state: PrimitiveStoreState) => {
        state.skipChange = b;
      });
    },

    localFileName: 'aladdin.ala',
    createNewFileFlag: false,
    setCreateNewFileFlag(b) {
      immerSet((state) => {
        state.createNewFileFlag = b;
      });
    },
    openLocalFileFlag: false,
    setOpenLocalFileFlag(b) {
      immerSet((state) => {
        state.openLocalFileFlag = b;
      });
    },

    waiting: false,

    contextMenuFlag: false,
    updateContextMenu() {
      immerSet((state) => {
        state.contextMenuFlag = !state.contextMenuFlag;
      });
    },

    showEconomicsPanel: false,
    showNavigationPanel: false,
    showShadowSettings: false,

    saveAccountSettingsFlag: false,

    saveCloudFileFlag: false,
    setSaveCloudFileFlag(b) {
      immerSet((state) => {
        state.saveCloudFileFlag = b;
      });
    },
    listCloudFilesFlag: false,
    refreshCloudFilesFlag: false,
    saveLocalFileDialogVisible: false,

    modelsMapFlag: false,
    leaderboardFlag: false,
    showLeaderboard: false,
    publishOnModelsMapFlag: false,
    modelsMapWeatherStations: false,

    createProjectFlag: false,
    saveProjectAsFlag: false,
    curateDesignToProjectFlag: false,
    showProjectsFlag: false,
    updateProjectsFlag: false,
    showProjectListPanel: false,
    projectImagesUpdateFlag: false,
    projectType: DesignProblem.SOLAR_PANEL_ARRAY,
    projectTitle: null,
    projectDescription: null,

    userCount: 0,
    showCloudFilePanel: false,
    openModelsMap: false,
    showModelsGallery: false,
    showAccountSettingsPanel: false,
    showLikesPanel: false,
    showPublishedModelsPanel: false,

    animateSun: false,

    simulationInProgress: false,
    simulationPaused: false,
    evolutionInProgress: false,
    evolutionPaused: false,

    runEvolution: false,
    pauseEvolution: false,
    objectiveEvaluationIndex: 0,

    runDailyThermalSimulation: false,
    pauseDailyThermalSimulation: false,
    runYearlyThermalSimulation: false,
    pauseYearlyThermalSimulation: false,
    clearDailySimulationResultsFlag: false,
    clearYearlySimulationResultsFlag: false,

    runDynamicSimulation: false,
    runStaticSimulation: false,
    pauseSimulation: false,

    runDailySimulationForParabolicDishes: false,
    runYearlySimulationForParabolicDishes: false,
    pauseDailySimulationForParabolicDishes: false,
    pauseYearlySimulationForParabolicDishes: false,

    runDailySimulationForParabolicTroughs: false,
    runYearlySimulationForParabolicTroughs: false,
    pauseDailySimulationForParabolicTroughs: false,
    pauseYearlySimulationForParabolicTroughs: false,

    runDailySimulationForFresnelReflectors: false,
    runYearlySimulationForFresnelReflectors: false,
    pauseDailySimulationForFresnelReflectors: false,
    pauseYearlySimulationForFresnelReflectors: false,

    runDailySimulationForHeliostats: false,
    runYearlySimulationForHeliostats: false,
    pauseDailySimulationForHeliostats: false,
    pauseYearlySimulationForHeliostats: false,

    runSolarPanelVisibilityAnalysis: false,
    runDailySimulationForSolarPanels: false,
    pauseDailySimulationForSolarPanels: false,
    runYearlySimulationForSolarPanels: false,
    pauseYearlySimulationForSolarPanels: false,
    runDailySimulationForSolarPanelsLastStep: false,
    runYearlySimulationForSolarPanelsLastStep: false,

    runDailyLightSensor: false,
    pauseDailyLightSensor: false,
    runYearlyLightSensor: false,
    pauseYearlyLightSensor: false,

    runDailySimulationForUpdraftTower: false,
    runYearlySimulationForUpdraftTower: false,
    pauseDailySimulationForUpdraftTower: false,
    pauseYearlySimulationForUpdraftTower: false,

    flagOfDailySimulation: false,

    showSolarRadiationHeatmap: false,
    showHeatFluxes: false,

    duringCameraInteraction: false,

    navigationMoveSpeed: 3,
    navigationTurnSpeed: 3,

    elementBeingCanceledId: null,

    showWallIntersectionPlaneId: null,

    oldParentId: null,
    oldFoundationId: null,

    selectedElementId: null,

    foundationMovedFlag: false,
    updateFoundationMovedFlag() {
      immerSet((state) => {
        state.foundationMovedFlag = !state.foundationMovedFlag;
      });
    },

    isCameraUnderGround: false,
  };
});
