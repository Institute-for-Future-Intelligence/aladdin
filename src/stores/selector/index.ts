/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { CommonStoreState } from '../common';

export const set = (state: CommonStoreState) => state.set;

export const user = (state: CommonStoreState) => state.user;

export const getHeatmap = (state: CommonStoreState) => state.getHeatmap;

export const setHeatmap = (state: CommonStoreState) => state.setHeatmap;

export const clearHeatmaps = (state: CommonStoreState) => state.clearHeatmaps;

export const changed = (state: CommonStoreState) => state.changed;

export const setChanged = (state: CommonStoreState) => state.setChanged;

export const skipChange = (state: CommonStoreState) => state.skipChange;

export const setSkipChange = (state: CommonStoreState) => state.setSkipChange;

export const applyCount = (state: CommonStoreState) => state.applyCount;

export const setApplyCount = (state: CommonStoreState) => state.setApplyCount;

export const revertApply = (state: CommonStoreState) => state.revertApply;

export const elements = (state: CommonStoreState) => state.elements;

export const notes = (state: CommonStoreState) => state.notes;

export const pvModules = (state: CommonStoreState) => state.pvModules;

export const loadPvModules = (state: CommonStoreState) => state.loadPvModules;

export const getPvModule = (state: CommonStoreState) => state.getPvModule;

export const language = (state: CommonStoreState) => state.language;

export const locale = (state: CommonStoreState) => state.locale;

export const showCloudFileTitleDialog = (state: CommonStoreState) => state.showCloudFileTitleDialog;

export const showCloudFileTitleDialogFlag = (state: CommonStoreState) => state.showCloudFileTitleDialogFlag;

export const cloudFile = (state: CommonStoreState) => state.cloudFile;

export const saveCloudFileFlag = (state: CommonStoreState) => state.saveCloudFileFlag;

export const listCloudFilesFlag = (state: CommonStoreState) => state.listCloudFilesFlag;

export const localContentToImportAfterCloudFileUpdate = (state: CommonStoreState) =>
  state.localContentToImportAfterCloudFileUpdate;

export const localFileName = (state: CommonStoreState) => state.localFileName;

export const createNewFileFlag = (state: CommonStoreState) => state.createNewFileFlag;

export const openLocalFileFlag = (state: CommonStoreState) => state.openLocalFileFlag;

export const saveLocalFileFlag = (state: CommonStoreState) => state.saveLocalFileFlag;

export const saveLocalFileDialogVisible = (state: CommonStoreState) => state.saveLocalFileDialogVisible;

export const fileChanged = (state: CommonStoreState) => state.fileChanged;

export const undoManager = (state: CommonStoreState) => state.undoManager;

export const addUndoable = (state: CommonStoreState) => state.addUndoable;

export const importContent = (state: CommonStoreState) => state.importContent;

export const exportContent = (state: CommonStoreState) => state.exportContent;

export const clearContent = (state: CommonStoreState) => state.clearContent;

export const createEmptyFile = (state: CommonStoreState) => state.createEmptyFile;

export const aabb = (state: CommonStoreState) => state.aabb;

export const animateSun = (state: CommonStoreState) => state.animateSun;

export const runSimulation = (state: CommonStoreState) => state.runSimulation;

export const pauseSimulation = (state: CommonStoreState) => state.pauseSimulation;

export const updateSceneRadiusFlag = (state: CommonStoreState) => state.updateSceneRadiusFlag;

export const updateSceneRadius = (state: CommonStoreState) => state.updateSceneRadius;

export const sceneRadius = (state: CommonStoreState) => state.sceneRadius;

export const setSceneRadius = (state: CommonStoreState) => state.setSceneRadius;

export const cameraDirection = (state: CommonStoreState) => state.cameraDirection;

export const getCameraDirection = (state: CommonStoreState) => state.getCameraDirection;

export const getElementById = (state: CommonStoreState) => state.getElementById;

export const getParent = (state: CommonStoreState) => state.getParent;

export const getChildren = (state: CommonStoreState) => state.getChildren;

export const selectedElement = (state: CommonStoreState) => state.selectedElement;

export const getSelectedElement = (state: CommonStoreState) => state.getSelectedElement;

export const findNearestSibling = (state: CommonStoreState) => state.findNearestSibling;

export const overlapWithSibling = (state: CommonStoreState) => state.overlapWithSibling;

export const selectedSideIndex = (state: CommonStoreState) => state.selectedSideIndex;

export const setElementPosition = (state: CommonStoreState) => state.setElementPosition;

export const setElementSize = (state: CommonStoreState) => state.setElementSize;

export const setElementNormal = (state: CommonStoreState) => state.setElementNormal;

export const updateElementLockById = (state: CommonStoreState) => state.updateElementLockById;

export const updateElementReferenceById = (state: CommonStoreState) => state.updateElementReferenceById;

export const updateElementLabelById = (state: CommonStoreState) => state.updateElementLabelById;

export const updateElementShowLabelById = (state: CommonStoreState) => state.updateElementShowLabelById;

export const updateElementCxById = (state: CommonStoreState) => state.updateElementCxById;

export const updateElementCyById = (state: CommonStoreState) => state.updateElementCyById;

export const updateElementCzById = (state: CommonStoreState) => state.updateElementCzById;

export const updateElementCzForAll = (state: CommonStoreState) => state.updateElementCzForAll;

export const updateElementLxById = (state: CommonStoreState) => state.updateElementLxById;

export const updateElementLxOnSurface = (state: CommonStoreState) => state.updateElementLxOnSurface;

export const updateElementLxAboveFoundation = (state: CommonStoreState) => state.updateElementLxAboveFoundation;

export const updateElementLxForAll = (state: CommonStoreState) => state.updateElementLxForAll;

export const updateElementLyById = (state: CommonStoreState) => state.updateElementLyById;

export const updateElementLyOnSurface = (state: CommonStoreState) => state.updateElementLyOnSurface;

export const updateElementLyAboveFoundation = (state: CommonStoreState) => state.updateElementLyAboveFoundation;

export const updateElementLyForAll = (state: CommonStoreState) => state.updateElementLyForAll;

export const updateElementLzById = (state: CommonStoreState) => state.updateElementLzById;

export const updateElementLzOnSurface = (state: CommonStoreState) => state.updateElementLzOnSurface;

export const updateElementLzAboveFoundation = (state: CommonStoreState) => state.updateElementLzAboveFoundation;

export const updateElementLzForAll = (state: CommonStoreState) => state.updateElementLzForAll;

export const updateElementColorById = (state: CommonStoreState) => state.updateElementColorById;

export const updateElementColorOnSurface = (state: CommonStoreState) => state.updateElementColorOnSurface;

export const updateElementColorAboveFoundation = (state: CommonStoreState) => state.updateElementColorAboveFoundation;

export const updateElementColorForAll = (state: CommonStoreState) => state.updateElementColorForAll;

export const updateElementLineColorById = (state: CommonStoreState) => state.updateElementLineColorById;

export const updateElementLineColorOnSurface = (state: CommonStoreState) => state.updateElementLineColorOnSurface;

export const updateElementLineColorAboveFoundation = (state: CommonStoreState) =>
  state.updateElementLineColorAboveFoundation;

export const updateElementLineColorForAll = (state: CommonStoreState) => state.updateElementLineColorForAll;

export const updateElementLineWidthById = (state: CommonStoreState) => state.updateElementLineWidthById;

export const updateElementLineWidthOnSurface = (state: CommonStoreState) => state.updateElementLineWidthOnSurface;

export const updateElementLineWidthAboveFoundation = (state: CommonStoreState) =>
  state.updateElementLineWidthAboveFoundation;

export const updateElementLineWidthForAll = (state: CommonStoreState) => state.updateElementLineWidthForAll;

export const updateElementRotationById = (state: CommonStoreState) => state.updateElementRotationById;

export const updateElementRotationForAll = (state: CommonStoreState) => state.updateElementRotationForAll;

export const foundationActionScope = (state: CommonStoreState) => state.foundationActionScope;

export const setFoundationActionScope = (state: CommonStoreState) => state.setFoundationActionScope;

export const updateFoundationSolarReceiverById = (state: CommonStoreState) => state.updateFoundationSolarReceiverById;

export const updateFoundationSolarReceiverTubeRadiusById = (state: CommonStoreState) =>
  state.updateFoundationSolarReceiverTubeRadiusById;

export const updateFoundationSolarReceiverTubeRelativeLengthById = (state: CommonStoreState) =>
  state.updateFoundationSolarReceiverTubeRelativeLengthById;

export const updateFoundationSolarReceiverTubeMountHeightById = (state: CommonStoreState) =>
  state.updateFoundationSolarReceiverTubeMountHeightById;

export const updateFoundationSolarReceiverTubeMountHeightForAll = (state: CommonStoreState) =>
  state.updateFoundationSolarReceiverTubeMountHeightForAll;

export const updateFoundationSolarReceiverAbsorptanceById = (state: CommonStoreState) =>
  state.updateFoundationSolarReceiverAbsorptanceById;

export const updateFoundationSolarReceiverAbsorptanceForAll = (state: CommonStoreState) =>
  state.updateFoundationSolarReceiverAbsorptanceForAll;

export const updateFoundationSolarReceiverOpticalEfficiencyById = (state: CommonStoreState) =>
  state.updateFoundationSolarReceiverOpticalEfficiencyById;

export const updateFoundationSolarReceiverOpticalEfficiencyForAll = (state: CommonStoreState) =>
  state.updateFoundationSolarReceiverOpticalEfficiencyForAll;

export const updateFoundationSolarReceiverThermalEfficiencyById = (state: CommonStoreState) =>
  state.updateFoundationSolarReceiverThermalEfficiencyById;

export const updateFoundationSolarReceiverThermalEfficiencyForAll = (state: CommonStoreState) =>
  state.updateFoundationSolarReceiverThermalEfficiencyForAll;

export const updateFoundationTextureById = (state: CommonStoreState) => state.updateFoundationTextureById;

export const updateFoundationTextureForAll = (state: CommonStoreState) => state.updateFoundationTextureForAll;

export const polygonActionScope = (state: CommonStoreState) => state.polygonActionScope;

export const setPolygonActionScope = (state: CommonStoreState) => state.setPolygonActionScope;

export const deletePolygonVertexByIndex = (state: CommonStoreState) => state.deletePolygonVertexByIndex;

export const insertPolygonVertexBeforeIndex = (state: CommonStoreState) => state.insertPolygonVertexBeforeIndex;

export const insertPolygonVertexAfterIndex = (state: CommonStoreState) => state.insertPolygonVertexAfterIndex;

export const updatePolygonSelectedIndexById = (state: CommonStoreState) => state.updatePolygonSelectedIndexById;

export const updatePolygonFilledById = (state: CommonStoreState) => state.updatePolygonFilledById;

export const updatePolygonLineStyleById = (state: CommonStoreState) => state.updatePolygonLineStyleById;

export const updatePolygonLineStyleOnSurface = (state: CommonStoreState) => state.updatePolygonLineStyleOnSurface;

export const updatePolygonLineStyleAboveFoundation = (state: CommonStoreState) =>
  state.updatePolygonLineStyleAboveFoundation;

export const updatePolygonLineStyleForAll = (state: CommonStoreState) => state.updatePolygonLineStyleForAll;

export const updatePolygonVertexPositionById = (state: CommonStoreState) => state.updatePolygonVertexPositionById;

export const updatePolygonVerticesById = (state: CommonStoreState) => state.updatePolygonVerticesById;

export const updatePolygonTextureById = (state: CommonStoreState) => state.updatePolygonTextureById;

export const updatePolygonTextureOnSurface = (state: CommonStoreState) => state.updatePolygonTextureOnSurface;

export const updatePolygonTextureAboveFoundation = (state: CommonStoreState) =>
  state.updatePolygonTextureAboveFoundation;

export const updatePolygonTextureForAll = (state: CommonStoreState) => state.updatePolygonTextureForAll;

export const cuboidActionScope = (state: CommonStoreState) => state.cuboidActionScope;

export const setCuboidActionScope = (state: CommonStoreState) => state.setCuboidActionScope;

export const updateCuboidColorBySide = (state: CommonStoreState) => state.updateCuboidColorBySide;

export const updateCuboidColorById = (state: CommonStoreState) => state.updateCuboidColorById;

export const updateCuboidColorForAll = (state: CommonStoreState) => state.updateCuboidColorForAll;

export const updateCuboidTextureBySide = (state: CommonStoreState) => state.updateCuboidTextureBySide;

export const updateCuboidFacadeTextureById = (state: CommonStoreState) => state.updateCuboidFacadeTextureById;

export const updateCuboidFacadeTextureForAll = (state: CommonStoreState) => state.updateCuboidFacadeTextureForAll;

export const solarPanelActionScope = (state: CommonStoreState) => state.solarPanelActionScope;

export const setSolarPanelActionScope = (state: CommonStoreState) => state.setSolarPanelActionScope;

export const updateSolarCollectorDailyYieldById = (state: CommonStoreState) => state.updateSolarCollectorDailyYieldById;

export const updateSolarCollectorYearlyYieldById = (state: CommonStoreState) =>
  state.updateSolarCollectorYearlyYieldById;

export const updateSolarPanelModelById = (state: CommonStoreState) => state.updateSolarPanelModelById;

export const updateSolarPanelModelOnSurface = (state: CommonStoreState) => state.updateSolarPanelModelOnSurface;

export const updateSolarPanelModelAboveFoundation = (state: CommonStoreState) =>
  state.updateSolarPanelModelAboveFoundation;

export const updateSolarPanelModelForAll = (state: CommonStoreState) => state.updateSolarPanelModelForAll;

export const updateSolarPanelLxById = (state: CommonStoreState) => state.updateSolarPanelLxById;

export const updateSolarPanelLxOnSurface = (state: CommonStoreState) => state.updateSolarPanelLxOnSurface;

export const updateSolarPanelLxAboveFoundation = (state: CommonStoreState) => state.updateSolarPanelLxAboveFoundation;

export const updateSolarPanelLxForAll = (state: CommonStoreState) => state.updateSolarPanelLxForAll;

export const updateSolarPanelLyById = (state: CommonStoreState) => state.updateSolarPanelLyById;

export const updateSolarPanelLyOnSurface = (state: CommonStoreState) => state.updateSolarPanelLyOnSurface;

export const updateSolarPanelLyAboveFoundation = (state: CommonStoreState) => state.updateSolarPanelLyAboveFoundation;

export const updateSolarPanelLyForAll = (state: CommonStoreState) => state.updateSolarPanelLyForAll;

export const updateSolarPanelTiltAngleById = (state: CommonStoreState) => state.updateSolarPanelTiltAngleById;

export const updateSolarPanelTiltAngleOnSurface = (state: CommonStoreState) => state.updateSolarPanelTiltAngleOnSurface;

export const updateSolarPanelTiltAngleAboveFoundation = (state: CommonStoreState) =>
  state.updateSolarPanelTiltAngleAboveFoundation;

export const updateSolarPanelTiltAngleForAll = (state: CommonStoreState) => state.updateSolarPanelTiltAngleForAll;

export const updateSolarCollectorRelativeAzimuthById = (state: CommonStoreState) =>
  state.updateSolarCollectorRelativeAzimuthById;

export const updateSolarCollectorRelativeAzimuthOnSurface = (state: CommonStoreState) =>
  state.updateSolarCollectorRelativeAzimuthOnSurface;

export const updateSolarCollectorRelativeAzimuthAboveFoundation = (state: CommonStoreState) =>
  state.updateSolarCollectorRelativeAzimuthAboveFoundation;

export const updateSolarCollectorRelativeAzimuthForAll = (state: CommonStoreState) =>
  state.updateSolarCollectorRelativeAzimuthForAll;

export const updateSolarPanelOrientationById = (state: CommonStoreState) => state.updateSolarPanelOrientationById;

export const updateSolarPanelOrientationOnSurface = (state: CommonStoreState) =>
  state.updateSolarPanelOrientationOnSurface;

export const updateSolarPanelOrientationAboveFoundation = (state: CommonStoreState) =>
  state.updateSolarPanelOrientationAboveFoundation;

export const updateSolarPanelOrientationForAll = (state: CommonStoreState) => state.updateSolarPanelOrientationForAll;

export const updateSolarPanelTrackerTypeById = (state: CommonStoreState) => state.updateSolarPanelTrackerTypeById;

export const updateSolarPanelTrackerTypeOnSurface = (state: CommonStoreState) =>
  state.updateSolarPanelTrackerTypeOnSurface;

export const updateSolarPanelTrackerTypeAboveFoundation = (state: CommonStoreState) =>
  state.updateSolarPanelTrackerTypeAboveFoundation;

export const updateSolarPanelTrackerTypeForAll = (state: CommonStoreState) => state.updateSolarPanelTrackerTypeForAll;

export const updateSolarCollectorPoleHeightById = (state: CommonStoreState) => state.updateSolarCollectorPoleHeightById;

export const updateSolarCollectorPoleHeightOnSurface = (state: CommonStoreState) =>
  state.updateSolarCollectorPoleHeightOnSurface;

export const updateSolarCollectorPoleHeightAboveFoundation = (state: CommonStoreState) =>
  state.updateSolarCollectorPoleHeightAboveFoundation;

export const updateSolarCollectorPoleHeightForAll = (state: CommonStoreState) =>
  state.updateSolarCollectorPoleHeightForAll;

export const updateSolarPanelPoleSpacingById = (state: CommonStoreState) => state.updateSolarPanelPoleSpacingById;

export const updateSolarPanelPoleSpacingOnSurface = (state: CommonStoreState) =>
  state.updateSolarPanelPoleSpacingOnSurface;

export const updateSolarPanelPoleSpacingAboveFoundation = (state: CommonStoreState) =>
  state.updateSolarPanelPoleSpacingAboveFoundation;

export const updateSolarPanelPoleSpacingForAll = (state: CommonStoreState) => state.updateSolarPanelPoleSpacingForAll;

export const updateSolarCollectorDrawSunBeamById = (state: CommonStoreState) =>
  state.updateSolarCollectorDrawSunBeamById;

export const updateCspReflectanceById = (state: CommonStoreState) => state.updateCspReflectanceById;

export const updateCspReflectanceAboveFoundation = (state: CommonStoreState) =>
  state.updateCspReflectanceAboveFoundation;

export const updateCspReflectanceForAll = (state: CommonStoreState) => state.updateCspReflectanceForAll;

export const updateParabolicCollectorAbsorptanceById = (state: CommonStoreState) =>
  state.updateParabolicCollectorAbsorptanceById;

export const updateParabolicCollectorAbsorptanceAboveFoundation = (state: CommonStoreState) =>
  state.updateParabolicCollectorAbsorptanceAboveFoundation;

export const updateParabolicCollectorAbsorptanceForAll = (state: CommonStoreState) =>
  state.updateParabolicCollectorAbsorptanceForAll;

export const updateParabolicCollectorOpticalEfficiencyById = (state: CommonStoreState) =>
  state.updateParabolicCollectorOpticalEfficiencyById;

export const updateParabolicCollectorOpticalEfficiencyAboveFoundation = (state: CommonStoreState) =>
  state.updateParabolicCollectorOpticalEfficiencyAboveFoundation;

export const updateParabolicCollectorOpticalEfficiencyForAll = (state: CommonStoreState) =>
  state.updateParabolicCollectorOpticalEfficiencyForAll;

export const updateParabolicCollectorThermalEfficiencyById = (state: CommonStoreState) =>
  state.updateParabolicCollectorThermalEfficiencyById;

export const updateParabolicCollectorThermalEfficiencyAboveFoundation = (state: CommonStoreState) =>
  state.updateParabolicCollectorThermalEfficiencyAboveFoundation;

export const updateParabolicCollectorThermalEfficiencyForAll = (state: CommonStoreState) =>
  state.updateParabolicCollectorThermalEfficiencyForAll;

export const parabolicTroughActionScope = (state: CommonStoreState) => state.parabolicTroughActionScope;

export const setParabolicTroughActionScope = (state: CommonStoreState) => state.setParabolicTroughActionScope;

export const fresnelReflectorActionScope = (state: CommonStoreState) => state.fresnelReflectorActionScope;

export const setFresnelReflectorActionScope = (state: CommonStoreState) => state.setFresnelReflectorActionScope;

export const parabolicDishActionScope = (state: CommonStoreState) => state.parabolicDishActionScope;

export const setParabolicDishActionScope = (state: CommonStoreState) => state.setParabolicDishActionScope;

export const updateParabolicDishStructureTypeById = (state: CommonStoreState) =>
  state.updateParabolicDishStructureTypeById;

export const updateParabolicDishStructureTypeAboveFoundation = (state: CommonStoreState) =>
  state.updateParabolicDishStructureTypeAboveFoundation;

export const updateParabolicDishStructureTypeForAll = (state: CommonStoreState) =>
  state.updateParabolicDishStructureTypeForAll;

export const updateParabolaLatusRectumById = (state: CommonStoreState) => state.updateParabolaLatusRectumById;

export const updateParabolaLatusRectumAboveFoundation = (state: CommonStoreState) =>
  state.updateParabolaLatusRectumAboveFoundation;

export const updateParabolaLatusRectumForAll = (state: CommonStoreState) => state.updateParabolaLatusRectumForAll;

export const updateModuleLengthById = (state: CommonStoreState) => state.updateModuleLengthById;

export const updateModuleLengthAboveFoundation = (state: CommonStoreState) => state.updateModuleLengthAboveFoundation;

export const updateModuleLengthForAll = (state: CommonStoreState) => state.updateModuleLengthForAll;

export const updateTreeTypeById = (state: CommonStoreState) => state.updateTreeTypeById;

export const updateTreeShowModelById = (state: CommonStoreState) => state.updateTreeShowModelById;

export const updateHumanNameById = (state: CommonStoreState) => state.updateHumanNameById;

export const updateHumanObserverById = (state: CommonStoreState) => state.updateHumanObserverById;

export const copyElementById = (state: CommonStoreState) => state.copyElementById;

export const removeElementById = (state: CommonStoreState) => state.removeElementById;

export const removeElementsByType = (state: CommonStoreState) => state.removeElementsByType;

export const clearDeletedElements = (state: CommonStoreState) => state.clearDeletedElements;

export const countElementsByReferenceId = (state: CommonStoreState) => state.countElementsByReferenceId;

export const removeElementsByReferenceId = (state: CommonStoreState) => state.removeElementsByReferenceId;

export const removeAllChildElementsByType = (state: CommonStoreState) => state.removeAllChildElementsByType;

export const pasteElementsToPoint = (state: CommonStoreState) => state.pasteElementsToPoint;

export const pasteElementsByKey = (state: CommonStoreState) => state.pasteElementsByKey;

export const elementsToPaste = (state: CommonStoreState) => state.elementsToPaste;

export const copyCutElements = (state: CommonStoreState) => state.copyCutElements;

export const selectMe = (state: CommonStoreState) => state.selectMe;

export const selectNone = (state: CommonStoreState) => state.selectNone;

export const addElement = (state: CommonStoreState) => state.addElement;

export const objectTypeToAdd = (state: CommonStoreState) => state.objectTypeToAdd;

export const countElementsByType = (state: CommonStoreState) => state.countElementsByType;

export const countObservers = (state: CommonStoreState) => state.countObservers;

export const countAllChildElementsByType = (state: CommonStoreState) => state.countAllChildElementsByType;

export const countAllOffspringsByTypeAtOnce = (state: CommonStoreState) => state.countAllOffspringsByTypeAtOnce;

export const countAllChildSolarPanels = (state: CommonStoreState) => state.countAllChildSolarPanels;

export const countAllChildSolarPanelDailyYields = (state: CommonStoreState) => state.countAllChildSolarPanelDailyYields;

export const countSolarPanelsOnRack = (state: CommonStoreState) => state.countSolarPanelsOnRack;

export const countAllSolarPanels = (state: CommonStoreState) => state.countAllSolarPanels;

export const clearAllSolarPanelYields = (state: CommonStoreState) => state.clearAllSolarPanelYields;

export const countAllSolarPanelDailyYields = (state: CommonStoreState) => state.countAllSolarPanelDailyYields;

export const selectedElementAngle = (state: CommonStoreState) => state.selectedElementAngle;

export const selectedElementHeight = (state: CommonStoreState) => state.selectedElementHeight;

export const simulationInProgress = (state: CommonStoreState) => state.simulationInProgress;

export const simulationPaused = (state: CommonStoreState) => state.simulationPaused;

export const updateDesignInfo = (state: CommonStoreState) => state.updateDesignInfo;

export const updateDesignInfoFlag = (state: CommonStoreState) => state.updateDesignInfoFlag;

export const contextMenuObjectType = (state: CommonStoreState) => state.contextMenuObjectType;

export const localFileDialogRequested = (state: CommonStoreState) => state.localFileDialogRequested;

export const enableFineGrid = (state: CommonStoreState) => state.enableFineGrid;

export const setEnableFineGrid = (state: CommonStoreState) => state.setEnableFineGrid;

export const showCloudFilePanel = (state: CommonStoreState) => state.showCloudFilePanel;

export const showAccountSettingsPanel = (state: CommonStoreState) => state.showAccountSettingsPanel;

// science
export const weatherData = (state: CommonStoreState) => state.weatherData;

export const loadWeatherData = (state: CommonStoreState) => state.loadWeatherData;

export const getClosestCity = (state: CommonStoreState) => state.getClosestCity;

export const getWeather = (state: CommonStoreState) => state.getWeather;

export const sunlightDirection = (state: CommonStoreState) => state.sunlightDirection;

export const setSunlightDirection = (state: CommonStoreState) => state.setSunlightDirection;

export const showSolarRadiationHeatmap = (state: CommonStoreState) => state.showSolarRadiationHeatmap;

export const dailySolarRadiationSimulationFlag = (state: CommonStoreState) => state.dailySolarRadiationSimulationFlag;

export const solarPanelVisibilityFlag = (state: CommonStoreState) => state.solarPanelVisibilityFlag;

export const solarPanelVisibilityResults = (state: CommonStoreState) => state.solarPanelVisibilityResults;

export const dailyPvYield = (state: CommonStoreState) => state.dailyPvYield;

export const dailyPvFlag = (state: CommonStoreState) => state.dailyPvFlag;

export const dailyPvIndividualOutputs = (state: CommonStoreState) => state.dailyPvIndividualOutputs;

export const setDailyPvYield = (state: CommonStoreState) => state.setDailyPvYield;

export const yearlyPvYield = (state: CommonStoreState) => state.yearlyPvYield;

export const yearlyPvFlag = (state: CommonStoreState) => state.yearlyPvFlag;

export const yearlyPvIndividualOutputs = (state: CommonStoreState) => state.yearlyPvIndividualOutputs;

export const setYearlyPvYield = (state: CommonStoreState) => state.setYearlyPvYield;

export const solarPanelLabels = (state: CommonStoreState) => state.solarPanelLabels;

export const setSolarPanelLabels = (state: CommonStoreState) => state.setSolarPanelLabels;

export const dailyParabolicTroughYield = (state: CommonStoreState) => state.dailyParabolicTroughYield;

export const dailyParabolicTroughFlag = (state: CommonStoreState) => state.dailyParabolicTroughFlag;

export const dailyParabolicTroughIndividualOutputs = (state: CommonStoreState) =>
  state.dailyParabolicTroughIndividualOutputs;

export const setDailyParabolicTroughYield = (state: CommonStoreState) => state.setDailyParabolicTroughYield;

export const yearlyParabolicTroughYield = (state: CommonStoreState) => state.yearlyParabolicTroughYield;

export const yearlyParabolicTroughFlag = (state: CommonStoreState) => state.yearlyParabolicTroughFlag;

export const yearlyParabolicTroughIndividualOutputs = (state: CommonStoreState) =>
  state.yearlyParabolicTroughIndividualOutputs;

export const setYearlyParabolicTroughYield = (state: CommonStoreState) => state.setYearlyParabolicTroughYield;

export const parabolicTroughLabels = (state: CommonStoreState) => state.parabolicTroughLabels;

export const setParabolicTroughLabels = (state: CommonStoreState) => state.setParabolicTroughLabels;

export const runDailySimulationForFresnelReflectors = (state: CommonStoreState) =>
  state.runDailySimulationForFresnelReflectors;

export const runYearlySimulationForFresnelReflectors = (state: CommonStoreState) =>
  state.runYearlySimulationForFresnelReflectors;

export const pauseDailySimulationForFresnelReflectors = (state: CommonStoreState) =>
  state.pauseDailySimulationForFresnelReflectors;

export const pauseYearlySimulationForFresnelReflectors = (state: CommonStoreState) =>
  state.pauseYearlySimulationForFresnelReflectors;

export const dailyFresnelReflectorYield = (state: CommonStoreState) => state.dailyFresnelReflectorYield;

export const dailyFresnelReflectorFlag = (state: CommonStoreState) => state.dailyFresnelReflectorFlag;

export const dailyFresnelReflectorIndividualOutputs = (state: CommonStoreState) =>
  state.dailyFresnelReflectorIndividualOutputs;

export const setDailyFresnelReflectorYield = (state: CommonStoreState) => state.setDailyFresnelReflectorYield;

export const yearlyFresnelReflectorYield = (state: CommonStoreState) => state.yearlyFresnelReflectorYield;

export const yearlyFresnelReflectorFlag = (state: CommonStoreState) => state.yearlyFresnelReflectorFlag;

export const yearlyFresnelReflectorIndividualOutputs = (state: CommonStoreState) =>
  state.yearlyFresnelReflectorIndividualOutputs;

export const setYearlyFresnelReflectorYield = (state: CommonStoreState) => state.setYearlyFresnelReflectorYield;

export const fresnelReflectorLabels = (state: CommonStoreState) => state.fresnelReflectorLabels;

export const setFresnelReflectorLabels = (state: CommonStoreState) => state.setFresnelReflectorLabels;

export const dailyParabolicDishYield = (state: CommonStoreState) => state.dailyParabolicDishYield;

export const dailyParabolicDishFlag = (state: CommonStoreState) => state.dailyParabolicDishFlag;

export const dailyParabolicDishIndividualOutputs = (state: CommonStoreState) =>
  state.dailyParabolicDishIndividualOutputs;

export const setDailyParabolicDishYield = (state: CommonStoreState) => state.setDailyParabolicDishYield;

export const yearlyParabolicDishYield = (state: CommonStoreState) => state.yearlyParabolicDishYield;

export const yearlyParabolicDishFlag = (state: CommonStoreState) => state.yearlyParabolicDishFlag;

export const yearlyParabolicDishIndividualOutputs = (state: CommonStoreState) =>
  state.yearlyParabolicDishIndividualOutputs;

export const setYearlyParabolicDishYield = (state: CommonStoreState) => state.setYearlyParabolicDishYield;

export const parabolicDishLabels = (state: CommonStoreState) => state.parabolicDishLabels;

export const setParabolicDishLabels = (state: CommonStoreState) => state.setParabolicDishLabels;

export const dailyLightSensorData = (state: CommonStoreState) => state.dailyLightSensorData;

export const dailyLightSensorFlag = (state: CommonStoreState) => state.dailyLightSensorFlag;

export const setDailyLightSensorData = (state: CommonStoreState) => state.setDailyLightSensorData;

export const yearlyLightSensorData = (state: CommonStoreState) => state.yearlyLightSensorData;

export const yearlyLightSensorFlag = (state: CommonStoreState) => state.yearlyLightSensorFlag;

export const setYearlyLightSensorData = (state: CommonStoreState) => state.setYearlyLightSensorData;

export const sensorLabels = (state: CommonStoreState) => state.sensorLabels;

export const setSensorLabels = (state: CommonStoreState) => state.setSensorLabels;

// handles
export const hoveredHandle = (state: CommonStoreState) => state.hoveredHandle;

export const moveHandleType = (state: CommonStoreState) => state.moveHandleType;

export const resizeHandleType = (state: CommonStoreState) => state.resizeHandleType;

export const getResizeHandlePosition = (state: CommonStoreState) => state.getResizeHandlePosition;

export const rotateHandleType = (state: CommonStoreState) => state.rotateHandleType;

export const resizeAnchor = (state: CommonStoreState) => state.resizeAnchor;

// elements
export const isAddingElement = (state: CommonStoreState) => state.isAddingElement;

export const addedFoundationId = (state: CommonStoreState) => state.addedFoundationId;

export const deletedFoundationId = (state: CommonStoreState) => state.deletedFoundationId;

export const addedCuboidId = (state: CommonStoreState) => state.addedCuboidId;

export const deletedCuboidId = (state: CommonStoreState) => state.deletedCuboidId;

export const addedWallId = (state: CommonStoreState) => state.addedWallId;

export const deletedWallId = (state: CommonStoreState) => state.deletedWallId;

export const addedWindowId = (state: CommonStoreState) => state.addedWindowId;

export const deletedWindowAndParentId = (state: CommonStoreState) => state.deletedWindowAndParentId;

export const updateWallMapOnFoundation = (state: CommonStoreState) => state.updateWallMapOnFoundation;

export const wallActionScope = (state: CommonStoreState) => state.wallActionScope;

export const setWallActionScope = (state: CommonStoreState) => state.setWallActionScope;

export const updateWallRelativeAngleById = (state: CommonStoreState) => state.updateWallRelativeAngleById;

export const updateWallLeftJointsById = (state: CommonStoreState) => state.updateWallLeftJointsById;

export const updateWallRightJointsById = (state: CommonStoreState) => state.updateWallRightJointsById;

export const updateWallLeftPointById = (state: CommonStoreState) => state.updateWallLeftPointById;

export const updateWallRightPointById = (state: CommonStoreState) => state.updateWallRightPointById;

export const updateWallTextureById = (state: CommonStoreState) => state.updateWallTextureById;

export const updateWallTextureAboveFoundation = (state: CommonStoreState) => state.updateWallTextureAboveFoundation;

export const updateWallTextureForAll = (state: CommonStoreState) => state.updateWallTextureForAll;

export const updateWallColorById = (state: CommonStoreState) => state.updateWallColorById;

export const updateWallColorAboveFoundation = (state: CommonStoreState) => state.updateWallColorAboveFoundation;

export const updateWallColorForAll = (state: CommonStoreState) => state.updateWallColorForAll;

export const updateWallHeightById = (state: CommonStoreState) => state.updateWallHeightById;

export const updateWallHeightAboveFoundation = (state: CommonStoreState) => state.updateWallHeightAboveFoundation;

export const updateWallHeightForAll = (state: CommonStoreState) => state.updateWallHeightForAll;

export const updateWallThicknessById = (state: CommonStoreState) => state.updateWallThicknessById;

export const updateWallThicknessAboveFoundation = (state: CommonStoreState) => state.updateWallThicknessAboveFoundation;

export const updateWallThicknessForAll = (state: CommonStoreState) => state.updateWallThicknessForAll;

export * as solarPanelArrayLayoutParams from './solarPanelArrayLayoutParams';

export * as viewState from './viewState';

export * as world from './world';
