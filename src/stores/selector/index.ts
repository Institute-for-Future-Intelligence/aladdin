/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { CommonStoreState } from '../common';
import { PrimitiveStoreState } from '../commonPrimitive';
import { DataStoreState } from '../commonData';

export const set = (state: CommonStoreState) => state.set;

export const user = (state: CommonStoreState) => state.user;

export const userCount = (state: PrimitiveStoreState) => state.userCount;

export const version = (state: CommonStoreState) => state.version;

export const showSolarPanelCustomizationPanel = (state: PrimitiveStoreState) => state.showSolarPanelCustomizationPanel;

export const showEconomicsPanel = (state: PrimitiveStoreState) => state.showEconomicsPanel;

export const showNavigationPanel = (state: PrimitiveStoreState) => state.showNavigationPanel;

export const showShadowSettings = (state: PrimitiveStoreState) => state.showShadowSettings;

export const minimumNavigationMoveSpeed = (state: CommonStoreState) => state.minimumNavigationMoveSpeed;

export const minimumNavigationTurnSpeed = (state: CommonStoreState) => state.minimumNavigationTurnSpeed;

export const navigationMoveSpeed = (state: PrimitiveStoreState) => state.navigationMoveSpeed;

export const navigationTurnSpeed = (state: PrimitiveStoreState) => state.navigationTurnSpeed;

export const setNavigationView = (state: CommonStoreState) => state.setNavigationView;

export const set2DView = (state: CommonStoreState) => state.set2DView;

export const getHeatmap = (state: DataStoreState) => state.getHeatmap;

export const setHeatmap = (state: DataStoreState) => state.setHeatmap;

export const clearHeatmaps = (state: DataStoreState) => state.clearHeatmaps;

export const clearDataStore = (state: DataStoreState) => state.clearDataStore;

export const flagOfDailySimulation = (state: PrimitiveStoreState) => state.flagOfDailySimulation;

export const hourlyHeatExchangeArrayMap = (state: DataStoreState) => state.hourlyHeatExchangeArrayMap;

export const setHourlyHeatExchangeArray = (state: DataStoreState) => state.setHourlyHeatExchangeArray;

export const hourlySolarHeatGainArrayMap = (state: DataStoreState) => state.hourlySolarHeatGainArrayMap;

export const setHourlySolarHeatGainArray = (state: DataStoreState) => state.setHourlySolarHeatGainArray;

export const hourlySolarPanelOutputArrayMap = (state: DataStoreState) => state.hourlySolarPanelOutputArrayMap;

export const setHourlySolarPanelOutputArray = (state: DataStoreState) => state.setHourlySolarPanelOutputArray;

export const getRoofSegmentVertices = (state: DataStoreState) => state.getRoofSegmentVertices;

export const getRoofSegmentVerticesWithoutOverhang = (state: DataStoreState) =>
  state.getRoofSegmentVerticesWithoutOverhang;

export const latestVersion = (state: PrimitiveStoreState) => state.latestVersion;

export const changed = (state: PrimitiveStoreState) => state.changed;

export const setChanged = (state: PrimitiveStoreState) => state.setChanged;

export const setSkipChange = (state: PrimitiveStoreState) => state.setSkipChange;

export const applyCount = (state: CommonStoreState) => state.applyCount;

export const setApplyCount = (state: CommonStoreState) => state.setApplyCount;

export const revertApply = (state: CommonStoreState) => state.revertApply;

export const elements = (state: CommonStoreState) => state.elements;

export const notes = (state: CommonStoreState) => state.notes;

export const supportedPvModules = (state: CommonStoreState) => state.supportedPvModules;

export const customPvModules = (state: CommonStoreState) => state.customPvModules;

export const loadSupportedPvModules = (state: CommonStoreState) => state.loadSupportedPvModules;

export const addCustomPvModule = (state: CommonStoreState) => state.addCustomPvModule;

export const getPvModule = (state: CommonStoreState) => state.getPvModule;

export const floatingWindowOpacity = (state: CommonStoreState) => state.floatingWindowOpacity;

export const selectedFloatingWindow = (state: CommonStoreState) => state.selectedFloatingWindow;

export const language = (state: CommonStoreState) => state.language;

export const locale = (state: CommonStoreState) => state.locale;

export const loggable = (state: CommonStoreState) => state.loggable;

export const actionInfo = (state: CommonStoreState) => state.actionInfo;

export const logAction = (state: CommonStoreState) => state.logAction;

export const currentUndoable = (state: CommonStoreState) => state.currentUndoable;

export const openModelsMap = (state: PrimitiveStoreState) => state.openModelsMap;

export const modelsMapLatitude = (state: CommonStoreState) => state.modelsMapLatitude;

export const modelsMapLongitude = (state: CommonStoreState) => state.modelsMapLongitude;

export const modelsMapZoom = (state: CommonStoreState) => state.modelsMapZoom;

export const modelsMapTilt = (state: CommonStoreState) => state.modelsMapTilt;

export const modelsMapType = (state: CommonStoreState) => state.modelsMapType;

export const modelsMapWeatherStations = (state: PrimitiveStoreState) => state.modelsMapWeatherStations;

export const showCloudFileTitleDialog = (state: CommonStoreState) => state.showCloudFileTitleDialog;

export const showCloudFileTitleDialogFlag = (state: CommonStoreState) => state.showCloudFileTitleDialogFlag;

export const cloudFile = (state: CommonStoreState) => state.cloudFile;

export const latestModelSite = (state: CommonStoreState) => state.latestModelSite;

export const modelSites = (state: CommonStoreState) => state.modelSites;

export const allModelSites = (state: CommonStoreState) => state.allModelSites;

export const peopleModels = (state: CommonStoreState) => state.peopleModels;

export const allPeopleModels = (state: CommonStoreState) => state.allPeopleModels;

export const saveAccountSettingsFlag = (state: PrimitiveStoreState) => state.saveAccountSettingsFlag;

export const saveCloudFileFlag = (state: PrimitiveStoreState) => state.saveCloudFileFlag;

export const createProjectFlag = (state: PrimitiveStoreState) => state.createProjectFlag;

export const saveProjectAsFlag = (state: PrimitiveStoreState) => state.saveProjectAsFlag;

export const curateDesignToProjectFlag = (state: PrimitiveStoreState) => state.curateDesignToProjectFlag;

export const showProjectsFlag = (state: PrimitiveStoreState) => state.showProjectsFlag;

export const updateProjectsFlag = (state: PrimitiveStoreState) => state.updateProjectsFlag;

export const confirmOpeningDesign = (state: PrimitiveStoreState) => state.confirmOpeningDesign;

export const modelsMapFlag = (state: PrimitiveStoreState) => state.modelsMapFlag;

export const showModelsAllTime = (state: CommonStoreState) => state.showModelsAllTime;

export const showModelsFromDate = (state: CommonStoreState) => state.showModelsFromDate;

export const showModelsToDate = (state: CommonStoreState) => state.showModelsToDate;

export const leaderboardFlag = (state: PrimitiveStoreState) => state.leaderboardFlag;

export const showLeaderboard = (state: PrimitiveStoreState) => state.showLeaderboard;

export const publishOnModelsMapFlag = (state: PrimitiveStoreState) => state.publishOnModelsMapFlag;

export const listCloudFilesFlag = (state: PrimitiveStoreState) => state.listCloudFilesFlag;

export const refreshCloudFilesFlag = (state: PrimitiveStoreState) => state.refreshCloudFilesFlag;

export const localContentToImportAfterCloudFileUpdate = (state: CommonStoreState) =>
  state.localContentToImportAfterCloudFileUpdate;

export const localFileName = (state: PrimitiveStoreState) => state.localFileName;

export const createNewFileFlag = (state: PrimitiveStoreState) => state.createNewFileFlag;

export const openLocalFileFlag = (state: PrimitiveStoreState) => state.openLocalFileFlag;

export const saveLocalFileDialogVisible = (state: PrimitiveStoreState) => state.saveLocalFileDialogVisible;

export const fileChanged = (state: CommonStoreState) => state.fileChanged;

export const undoManager = (state: CommonStoreState) => state.undoManager;

export const addUndoable = (state: CommonStoreState) => state.addUndoable;

export const importContent = (state: CommonStoreState) => state.importContent;

export const exportContent = (state: CommonStoreState) => state.exportContent;

export const clearContent = (state: CommonStoreState) => state.clearContent;

export const createEmptyFile = (state: CommonStoreState) => state.createEmptyFile;

export const aabb = (state: CommonStoreState) => state.aabb;

export const animateSun = (state: PrimitiveStoreState) => state.animateSun;

export const animate24Hours = (state: CommonStoreState) => state.animate24Hours;

export const runDailyThermalSimulation = (state: PrimitiveStoreState) => state.runDailyThermalSimulation;

export const pauseDailyThermalSimulation = (state: PrimitiveStoreState) => state.pauseDailyThermalSimulation;

export const runYearlyThermalSimulation = (state: PrimitiveStoreState) => state.runYearlyThermalSimulation;

export const pauseYearlyThermalSimulation = (state: PrimitiveStoreState) => state.pauseYearlyThermalSimulation;

export const clearDailySimulationResultsFlag = (state: PrimitiveStoreState) => state.clearDailySimulationResultsFlag;

export const clearYearlySimulationResultsFlag = (state: PrimitiveStoreState) => state.clearYearlySimulationResultsFlag;

export const runDynamicSimulation = (state: PrimitiveStoreState) => state.runDynamicSimulation;

export const runStaticSimulation = (state: PrimitiveStoreState) => state.runStaticSimulation;

export const pauseSimulation = (state: PrimitiveStoreState) => state.pauseSimulation;

export const runEvolution = (state: PrimitiveStoreState) => state.runEvolution;

export const pauseEvolution = (state: PrimitiveStoreState) => state.pauseEvolution;

export const objectiveEvaluationIndex = (state: PrimitiveStoreState) => state.objectiveEvaluationIndex;

export const evolutionMethod = (state: CommonStoreState) => state.evolutionMethod;

export const updateSceneRadiusFlag = (state: CommonStoreState) => state.updateSceneRadiusFlag;

export const updateSceneRadius = (state: CommonStoreState) => state.updateSceneRadius;

export const sceneRadius = (state: CommonStoreState) => state.sceneRadius;

export const cameraDirection = (state: CommonStoreState) => state.cameraDirection;

export const getCameraDirection = (state: CommonStoreState) => state.getCameraDirection;

export const getElementById = (state: CommonStoreState) => state.getElementById;

export const getFoundation = (state: CommonStoreState) => state.getFoundation;

export const getParent = (state: CommonStoreState) => state.getParent;

export const getChildren = (state: CommonStoreState) => state.getChildren;

export const getChildrenOfType = (state: CommonStoreState) => state.getChildrenOfType;

export const selectedElement = (state: CommonStoreState) => state.selectedElement;

export const selectedElementIdSet = (state: CommonStoreState) => state.selectedElementIdSet;

export const getSelectedElement = (state: CommonStoreState) => state.getSelectedElement;

export const overlapWithSibling = (state: CommonStoreState) => state.overlapWithSibling;

export const selectedSideIndex = (state: CommonStoreState) => state.selectedSideIndex;

export const setElementPosition = (state: CommonStoreState) => state.setElementPosition;

export const setElementSize = (state: CommonStoreState) => state.setElementSize;

export const setElementNormal = (state: CommonStoreState) => state.setElementNormal;

export const updateAllElementLocks = (state: CommonStoreState) => state.updateAllElementLocks;

export const updateElementLockByFoundationId = (state: CommonStoreState) => state.updateElementLockByFoundationId;

export const updateElementLockByParentId = (state: CommonStoreState) => state.updateElementLockByParentId;

export const updateElementLockById = (state: CommonStoreState) => state.updateElementLockById;

export const updateElementReferenceById = (state: CommonStoreState) => state.updateElementReferenceById;

export const updateElementLabelById = (state: CommonStoreState) => state.updateElementLabelById;

export const updateElementShowLabelById = (state: CommonStoreState) => state.updateElementShowLabelById;

export const updateElementCxById = (state: CommonStoreState) => state.updateElementCxById;

export const updateElementCyById = (state: CommonStoreState) => state.updateElementCyById;

export const updateElementCzById = (state: CommonStoreState) => state.updateElementCzById;

export const updateElementCzForAll = (state: CommonStoreState) => state.updateElementCzForAll;

export const updateElementLxById = (state: CommonStoreState) => state.updateElementLxById;

export const updateElementLxAboveFoundation = (state: CommonStoreState) => state.updateElementLxAboveFoundation;

export const updateElementLxForAll = (state: CommonStoreState) => state.updateElementLxForAll;

export const updateElementLyById = (state: CommonStoreState) => state.updateElementLyById;

export const updateElementLyAboveFoundation = (state: CommonStoreState) => state.updateElementLyAboveFoundation;

export const updateElementLyForAll = (state: CommonStoreState) => state.updateElementLyForAll;

export const updateElementLzById = (state: CommonStoreState) => state.updateElementLzById;

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

export const polygonActionScope = (state: CommonStoreState) => state.polygonActionScope;

export const setPolygonActionScope = (state: CommonStoreState) => state.setPolygonActionScope;

export const updatePolygonVertexPositionById = (state: CommonStoreState) => state.updatePolygonVertexPositionById;

export const updatePolygonVerticesById = (state: CommonStoreState) => state.updatePolygonVerticesById;

export const cuboidActionScope = (state: CommonStoreState) => state.cuboidActionScope;

export const setCuboidActionScope = (state: CommonStoreState) => state.setCuboidActionScope;

export const solarPanelActionScope = (state: CommonStoreState) => state.solarPanelActionScope;

export const setSolarPanelActionScope = (state: CommonStoreState) => state.setSolarPanelActionScope;

export const solarWaterHeaterActionScope = (state: CommonStoreState) => state.solarWaterHeaterActionScope;

export const setSolarWaterHeaterActionScope = (state: CommonStoreState) => state.setSolarWaterHeaterActionScope;

export const updateSolarCollectorDailyYieldById = (state: CommonStoreState) => state.updateSolarCollectorDailyYieldById;

export const updateSolarCollectorYearlyYieldById = (state: CommonStoreState) =>
  state.updateSolarCollectorYearlyYieldById;

export const updateSolarPanelTiltAngleById = (state: CommonStoreState) => state.updateSolarPanelTiltAngleById;

export const updateSolarCollectorDrawSunBeamById = (state: CommonStoreState) =>
  state.updateSolarCollectorDrawSunBeamById;

export const updateSolarCollectorDrawSunBeamAboveFoundation = (state: CommonStoreState) =>
  state.updateSolarCollectorDrawSunBeamAboveFoundation;

export const updateSolarCollectorDrawSunBeamForAll = (state: CommonStoreState) =>
  state.updateSolarCollectorDrawSunBeamForAll;

export const updateSolarCollectorRelativeAzimuthById = (state: CommonStoreState) =>
  state.updateSolarCollectorRelativeAzimuthById;

export const updateSolarCollectorRelativeAzimuthOnSurface = (state: CommonStoreState) =>
  state.updateSolarCollectorRelativeAzimuthOnSurface;

export const updateSolarCollectorRelativeAzimuthAboveFoundation = (state: CommonStoreState) =>
  state.updateSolarCollectorRelativeAzimuthAboveFoundation;

export const updateSolarCollectorRelativeAzimuthForAll = (state: CommonStoreState) =>
  state.updateSolarCollectorRelativeAzimuthForAll;

export const updateSolarCollectorXById = (state: CommonStoreState) => state.updateSolarCollectorXById;

export const updateSolarCollectorXAboveFoundation = (state: CommonStoreState) =>
  state.updateSolarCollectorXAboveFoundation;

export const updateSolarCollectorXForAll = (state: CommonStoreState) => state.updateSolarCollectorXForAll;

export const updateSolarCollectorYById = (state: CommonStoreState) => state.updateSolarCollectorYById;

export const updateSolarCollectorYAboveFoundation = (state: CommonStoreState) =>
  state.updateSolarCollectorYAboveFoundation;

export const updateSolarCollectorYForAll = (state: CommonStoreState) => state.updateSolarCollectorYForAll;

export const updateSolarCollectorPoleHeightById = (state: CommonStoreState) => state.updateSolarCollectorPoleHeightById;

export const updateSolarCollectorPoleHeightOnSurface = (state: CommonStoreState) =>
  state.updateSolarCollectorPoleHeightOnSurface;

export const updateSolarCollectorPoleHeightAboveFoundation = (state: CommonStoreState) =>
  state.updateSolarCollectorPoleHeightAboveFoundation;

export const updateSolarCollectorPoleHeightForAll = (state: CommonStoreState) =>
  state.updateSolarCollectorPoleHeightForAll;

export const updateSolarCollectorPoleRadiusById = (state: CommonStoreState) => state.updateSolarCollectorPoleRadiusById;

export const updateSolarCollectorPoleRadiusAboveFoundation = (state: CommonStoreState) =>
  state.updateSolarCollectorPoleRadiusAboveFoundation;

export const updateSolarCollectorPoleRadiusForAll = (state: CommonStoreState) =>
  state.updateSolarCollectorPoleRadiusForAll;

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

export const heliostatActionScope = (state: CommonStoreState) => state.heliostatActionScope;

export const setHeliostatActionScope = (state: CommonStoreState) => state.setHeliostatActionScope;

export const updateSolarReceiverById = (state: CommonStoreState) => state.updateSolarReceiverById;

export const updateSolarReceiverAboveFoundation = (state: CommonStoreState) => state.updateSolarReceiverAboveFoundation;

export const updateSolarReceiverForAll = (state: CommonStoreState) => state.updateSolarReceiverForAll;

export const parabolicDishActionScope = (state: CommonStoreState) => state.parabolicDishActionScope;

export const setParabolicDishActionScope = (state: CommonStoreState) => state.setParabolicDishActionScope;

export const updateParabolaLatusRectumById = (state: CommonStoreState) => state.updateParabolaLatusRectumById;

export const updateParabolaLatusRectumAboveFoundation = (state: CommonStoreState) =>
  state.updateParabolaLatusRectumAboveFoundation;

export const updateParabolaLatusRectumForAll = (state: CommonStoreState) => state.updateParabolaLatusRectumForAll;

export const updateModuleLengthById = (state: CommonStoreState) => state.updateModuleLengthById;

export const updateModuleLengthAboveFoundation = (state: CommonStoreState) => state.updateModuleLengthAboveFoundation;

export const updateModuleLengthForAll = (state: CommonStoreState) => state.updateModuleLengthForAll;

export const windTurbineActionScope = (state: CommonStoreState) => state.windTurbineActionScope;

export const setWindTurbineActionScope = (state: CommonStoreState) => state.setWindTurbineActionScope;

export const updateInsideLightById = (state: CommonStoreState) => state.updateInsideLightById;

export const updateInsideLightsByParentId = (state: CommonStoreState) => state.updateInsideLightsByParentId;

export const copyElementById = (state: CommonStoreState) => state.copyElementById;

export const removeElementById = (state: CommonStoreState) => state.removeElementById;

export const removeElementsByType = (state: CommonStoreState) => state.removeElementsByType;

export const clearDeletedElements = (state: CommonStoreState) => state.clearDeletedElements;

export const countElementsByReferenceId = (state: CommonStoreState) => state.countElementsByReferenceId;

export const removeElementsByReferenceId = (state: CommonStoreState) => state.removeElementsByReferenceId;

export const removeAllChildElementsByType = (state: CommonStoreState) => state.removeAllChildElementsByType;

export const removeAllElementsOnFoundationByType = (state: CommonStoreState) =>
  state.removeAllElementsOnFoundationByType;

export const pasteElementsToPoint = (state: CommonStoreState) => state.pasteElementsToPoint;

export const pasteElementsByKey = (state: CommonStoreState) => state.pasteElementsByKey;

export const elementsToPaste = (state: CommonStoreState) => state.elementsToPaste;

export const selectMe = (state: CommonStoreState) => state.selectMe;

export const selectNone = (state: CommonStoreState) => state.selectNone;

export const addElement = (state: CommonStoreState) => state.addElement;

export const objectTypeToAdd = (state: CommonStoreState) => state.objectTypeToAdd;

export const actionModeLock = (state: CommonStoreState) => state.actionModeLock;

export const countElementsByType = (state: CommonStoreState) => state.countElementsByType;

export const countSolarStructuresByType = (state: CommonStoreState) => state.countSolarStructuresByType;

export const countObservers = (state: CommonStoreState) => state.countObservers;

export const countAllElements = (state: CommonStoreState) => state.countAllElements;

export const countAllElementsByType = (state: CommonStoreState) => state.countAllElementsByType;

export const countAllOffspringsByTypeAtOnce = (state: CommonStoreState) => state.countAllOffspringsByTypeAtOnce;

export const countSolarPanelsOnRack = (state: CommonStoreState) => state.countSolarPanelsOnRack;

export const selectedElementAngle = (state: CommonStoreState) => state.selectedElementAngle;

export const selectedElementHeight = (state: CommonStoreState) => state.selectedElementHeight;

export const waiting = (state: PrimitiveStoreState) => state.waiting;

export const simulationInProgress = (state: PrimitiveStoreState) => state.simulationInProgress;

export const simulationPaused = (state: PrimitiveStoreState) => state.simulationPaused;

export const evolutionInProgress = (state: PrimitiveStoreState) => state.evolutionInProgress;

export const evolutionPaused = (state: PrimitiveStoreState) => state.evolutionPaused;

export const contextMenuObjectType = (state: CommonStoreState) => state.contextMenuObjectType;

export const localFileDialogRequested = (state: CommonStoreState) => state.localFileDialogRequested;

export const enableFineGrid = (state: CommonStoreState) => state.enableFineGrid;

export const setEnableFineGrid = (state: CommonStoreState) => state.setEnableFineGrid;

export const showCloudFilePanel = (state: PrimitiveStoreState) => state.showCloudFilePanel;

export const projectTitle = (state: CommonStoreState) => state.projectState.title;

export const projectOwner = (state: CommonStoreState) => state.projectState.owner;

export const projectDescription = (state: CommonStoreState) => state.projectState.description;

export const projectDesigns = (state: CommonStoreState) => state.projectState.designs;

export const projectType = (state: CommonStoreState) => state.projectState.type;

export const projectSelectedProperty = (state: CommonStoreState) => state.projectState.selectedProperty;

export const projectDataColoring = (state: CommonStoreState) => state.projectState.dataColoring;

export const projectThumbnailWidth = (state: CommonStoreState) => state.projectState.thumbnailWidth;

export const xAxisNameScatterPlot = (state: CommonStoreState) => state.projectState.xAxisNameScatterPlot;

export const yAxisNameScatterPlot = (state: CommonStoreState) => state.projectState.yAxisNameScatterPlot;

export const dotSizeScatterPlot = (state: CommonStoreState) => state.projectState.dotSizeScatterPlot;

export const sortDescending = (state: CommonStoreState) => state.projectState.sortDescending;

export const projectFilters = (state: CommonStoreState) => state.projectState.filters;

export const projectRanges = (state: CommonStoreState) => state.projectState.ranges;

export const hiddenParameters = (state: CommonStoreState) => state.projectState.hiddenParameters;

export const projectView = (state: CommonStoreState) => state.projectView;

export const cloudFileBelongToProject = (state: CommonStoreState) => state.cloudFileBelongToProject;

export const showProjectListPanel = (state: PrimitiveStoreState) => state.showProjectListPanel;

export const showModelsGallery = (state: PrimitiveStoreState) => state.showModelsGallery;

export const showAccountSettingsPanel = (state: PrimitiveStoreState) => state.showAccountSettingsPanel;

export const showLikesPanel = (state: PrimitiveStoreState) => state.showLikesPanel;

export const showPublishedModelsPanel = (state: PrimitiveStoreState) => state.showPublishedModelsPanel;

// science
export const weatherModel = (state: CommonStoreState) => state.weatherModel;

export const setWeatherModel = (state: CommonStoreState) => state.setWeatherModel;

export const weatherData = (state: CommonStoreState) => state.weatherData;

export const loadWeatherData = (state: CommonStoreState) => state.loadWeatherData;

export const loadHorizontalSolarRadiationData = (state: CommonStoreState) => state.loadHorizontalSolarRadiationData;

export const getHorizontalSolarRadiation = (state: CommonStoreState) => state.getHorizontalSolarRadiation;

export const loadVerticalSolarRadiationData = (state: CommonStoreState) => state.loadVerticalSolarRadiationData;

export const getVerticalSolarRadiation = (state: CommonStoreState) => state.getVerticalSolarRadiation;

export const getClosestCity = (state: CommonStoreState) => state.getClosestCity;

export const sunlightDirection = (state: CommonStoreState) => state.sunlightDirection;

export const setSunlightDirection = (state: CommonStoreState) => state.setSunlightDirection;

export const showSolarRadiationHeatmap = (state: PrimitiveStoreState) => state.showSolarRadiationHeatmap;

export const selectButtonClicked = (state: PrimitiveStoreState) => state.selectButtonClicked;

export const showHeatFluxes = (state: PrimitiveStoreState) => state.showHeatFluxes;

// solar panels (PV)

export const runSolarPanelVisibilityAnalysis = (state: PrimitiveStoreState) => state.runSolarPanelVisibilityAnalysis;

export const solarPanelVisibilityResults = (state: DataStoreState) => state.solarPanelVisibilityResults;

export const runDailySimulationForSolarPanels = (state: PrimitiveStoreState) => state.runDailySimulationForSolarPanels;

export const runDailySimulationForSolarPanelsLastStep = (state: PrimitiveStoreState) =>
  state.runDailySimulationForSolarPanelsLastStep;

export const runYearlySimulationForSolarPanels = (state: PrimitiveStoreState) =>
  state.runYearlySimulationForSolarPanels;

export const runYearlySimulationForSolarPanelsLastStep = (state: PrimitiveStoreState) =>
  state.runYearlySimulationForSolarPanelsLastStep;

export const pauseDailySimulationForSolarPanels = (state: PrimitiveStoreState) =>
  state.pauseDailySimulationForSolarPanels;

export const pauseYearlySimulationForSolarPanels = (state: PrimitiveStoreState) =>
  state.pauseYearlySimulationForSolarPanels;

export const dailyPvYield = (state: DataStoreState) => state.dailyPvYield;

export const dailyPvIndividualOutputs = (state: CommonStoreState) => state.graphState?.dailyPvIndividualOutputs;

export const setDailyPvYield = (state: DataStoreState) => state.setDailyPvYield;

export const yearlyPvYield = (state: DataStoreState) => state.yearlyPvYield;

export const yearlyPvIndividualOutputs = (state: CommonStoreState) => state.graphState?.yearlyPvIndividualOutputs;

export const setYearlyPvYield = (state: DataStoreState) => state.setYearlyPvYield;

export const solarPanelLabels = (state: DataStoreState) => state.solarPanelLabels;

export const setSolarPanelLabels = (state: DataStoreState) => state.setSolarPanelLabels;

export const setTotalBuildingHeater = (state: DataStoreState) => state.setTotalBuildingHeater;

export const setTotalBuildingAc = (state: DataStoreState) => state.setTotalBuildingAc;

export const setTotalBuildingSolarPanel = (state: DataStoreState) => state.setTotalBuildingSolarPanel;

export const updateElementOnRoofFlag = (state: CommonStoreState) => state.updateElementOnRoofFlag;

// parabolic troughs (CSP)

export const runDailySimulationForParabolicTroughs = (state: PrimitiveStoreState) =>
  state.runDailySimulationForParabolicTroughs;

export const runYearlySimulationForParabolicTroughs = (state: PrimitiveStoreState) =>
  state.runYearlySimulationForParabolicTroughs;

export const pauseDailySimulationForParabolicTroughs = (state: PrimitiveStoreState) =>
  state.pauseDailySimulationForParabolicTroughs;

export const pauseYearlySimulationForParabolicTroughs = (state: PrimitiveStoreState) =>
  state.pauseYearlySimulationForParabolicTroughs;

export const dailyParabolicTroughYield = (state: DataStoreState) => state.dailyParabolicTroughYield;

export const dailyParabolicTroughIndividualOutputs = (state: CommonStoreState) =>
  state.graphState?.dailyParabolicTroughIndividualOutputs;

export const setDailyParabolicTroughYield = (state: DataStoreState) => state.setDailyParabolicTroughYield;

export const yearlyParabolicTroughYield = (state: DataStoreState) => state.yearlyParabolicTroughYield;

export const yearlyParabolicTroughIndividualOutputs = (state: CommonStoreState) =>
  state.graphState?.yearlyParabolicTroughIndividualOutputs;

export const setYearlyParabolicTroughYield = (state: DataStoreState) => state.setYearlyParabolicTroughYield;

export const parabolicTroughLabels = (state: DataStoreState) => state.parabolicTroughLabels;

export const setParabolicTroughLabels = (state: DataStoreState) => state.setParabolicTroughLabels;

// Fresnel reflectors (CSP)

export const runDailySimulationForFresnelReflectors = (state: PrimitiveStoreState) =>
  state.runDailySimulationForFresnelReflectors;

export const runYearlySimulationForFresnelReflectors = (state: PrimitiveStoreState) =>
  state.runYearlySimulationForFresnelReflectors;

export const pauseDailySimulationForFresnelReflectors = (state: PrimitiveStoreState) =>
  state.pauseDailySimulationForFresnelReflectors;

export const pauseYearlySimulationForFresnelReflectors = (state: PrimitiveStoreState) =>
  state.pauseYearlySimulationForFresnelReflectors;

export const dailyFresnelReflectorYield = (state: DataStoreState) => state.dailyFresnelReflectorYield;

export const dailyFresnelReflectorIndividualOutputs = (state: CommonStoreState) =>
  state.graphState?.dailyFresnelReflectorIndividualOutputs;

export const setDailyFresnelReflectorYield = (state: DataStoreState) => state.setDailyFresnelReflectorYield;

export const yearlyFresnelReflectorYield = (state: DataStoreState) => state.yearlyFresnelReflectorYield;

export const yearlyFresnelReflectorIndividualOutputs = (state: CommonStoreState) =>
  state.graphState?.yearlyFresnelReflectorIndividualOutputs;

export const setYearlyFresnelReflectorYield = (state: DataStoreState) => state.setYearlyFresnelReflectorYield;

export const fresnelReflectorLabels = (state: DataStoreState) => state.fresnelReflectorLabels;

export const setFresnelReflectorLabels = (state: DataStoreState) => state.setFresnelReflectorLabels;

// heliostats (CSP)

export const runDailySimulationForHeliostats = (state: PrimitiveStoreState) => state.runDailySimulationForHeliostats;

export const runYearlySimulationForHeliostats = (state: PrimitiveStoreState) => state.runYearlySimulationForHeliostats;

export const pauseDailySimulationForHeliostats = (state: PrimitiveStoreState) =>
  state.pauseDailySimulationForHeliostats;

export const pauseYearlySimulationForHeliostats = (state: PrimitiveStoreState) =>
  state.pauseYearlySimulationForHeliostats;

export const dailyHeliostatYield = (state: DataStoreState) => state.dailyHeliostatYield;

export const dailyHeliostatIndividualOutputs = (state: CommonStoreState) =>
  state.graphState?.dailyHeliostatIndividualOutputs;

export const setDailyHeliostatYield = (state: DataStoreState) => state.setDailyHeliostatYield;

export const yearlyHeliostatYield = (state: DataStoreState) => state.yearlyHeliostatYield;

export const yearlyHeliostatIndividualOutputs = (state: CommonStoreState) =>
  state.graphState?.yearlyHeliostatIndividualOutputs;

export const setYearlyHeliostatYield = (state: DataStoreState) => state.setYearlyHeliostatYield;

export const heliostatLabels = (state: DataStoreState) => state.heliostatLabels;

export const setHeliostatLabels = (state: DataStoreState) => state.setHeliostatLabels;

// solar updraft towers

export const runDailySimulationForUpdraftTower = (state: PrimitiveStoreState) =>
  state.runDailySimulationForUpdraftTower;

export const runYearlySimulationForUpdraftTower = (state: PrimitiveStoreState) =>
  state.runYearlySimulationForUpdraftTower;

export const pauseDailySimulationForUpdraftTower = (state: PrimitiveStoreState) =>
  state.pauseDailySimulationForUpdraftTower;

export const pauseYearlySimulationForUpdraftTower = (state: PrimitiveStoreState) =>
  state.pauseYearlySimulationForUpdraftTower;

export const dailyUpdraftTowerResults = (state: DataStoreState) => state.dailyUpdraftTowerResults;

export const dailyUpdraftTowerYield = (state: DataStoreState) => state.dailyUpdraftTowerYield;

export const dailyUpdraftTowerIndividualOutputs = (state: CommonStoreState) =>
  state.graphState?.dailyUpdraftTowerIndividualOutputs;

export const setDailyUpdraftTowerResults = (state: DataStoreState) => state.setDailyUpdraftTowerResults;

export const setDailyUpdraftTowerYield = (state: DataStoreState) => state.setDailyUpdraftTowerYield;

export const yearlyUpdraftTowerYield = (state: DataStoreState) => state.yearlyUpdraftTowerYield;

export const yearlyUpdraftTowerIndividualOutputs = (state: CommonStoreState) =>
  state.graphState?.yearlyUpdraftTowerIndividualOutputs;

export const setYearlyUpdraftTowerYield = (state: DataStoreState) => state.setYearlyUpdraftTowerYield;

export const updraftTowerLabels = (state: DataStoreState) => state.updraftTowerLabels;

export const setUpdraftTowerLabels = (state: DataStoreState) => state.setUpdraftTowerLabels;

// parabolic dishes (CSP)

export const runDailySimulationForParabolicDishes = (state: PrimitiveStoreState) =>
  state.runDailySimulationForParabolicDishes;

export const runYearlySimulationForParabolicDishes = (state: PrimitiveStoreState) =>
  state.runYearlySimulationForParabolicDishes;

export const pauseDailySimulationForParabolicDishes = (state: PrimitiveStoreState) =>
  state.pauseDailySimulationForParabolicDishes;

export const pauseYearlySimulationForParabolicDishes = (state: PrimitiveStoreState) =>
  state.pauseYearlySimulationForParabolicDishes;

export const dailyParabolicDishYield = (state: DataStoreState) => state.dailyParabolicDishYield;

export const dailyParabolicDishIndividualOutputs = (state: CommonStoreState) =>
  state.graphState?.dailyParabolicDishIndividualOutputs;

export const setDailyParabolicDishYield = (state: DataStoreState) => state.setDailyParabolicDishYield;

export const yearlyParabolicDishYield = (state: DataStoreState) => state.yearlyParabolicDishYield;

export const yearlyParabolicDishIndividualOutputs = (state: CommonStoreState) =>
  state.graphState?.yearlyParabolicDishIndividualOutputs;

export const setYearlyParabolicDishYield = (state: DataStoreState) => state.setYearlyParabolicDishYield;

export const parabolicDishLabels = (state: DataStoreState) => state.parabolicDishLabels;

export const setParabolicDishLabels = (state: DataStoreState) => state.setParabolicDishLabels;

// sensors

export const runDailyLightSensor = (state: PrimitiveStoreState) => state.runDailyLightSensor;

export const pauseDailyLightSensor = (state: PrimitiveStoreState) => state.pauseDailyLightSensor;

export const runYearlyLightSensor = (state: PrimitiveStoreState) => state.runYearlyLightSensor;

export const pauseYearlyLightSensor = (state: PrimitiveStoreState) => state.pauseYearlyLightSensor;

export const dailyLightSensorData = (state: DataStoreState) => state.dailyLightSensorData;

export const setDailyLightSensorData = (state: DataStoreState) => state.setDailyLightSensorData;

export const yearlyLightSensorData = (state: DataStoreState) => state.yearlyLightSensorData;

export const setYearlyLightSensorData = (state: DataStoreState) => state.setYearlyLightSensorData;

export const sensorLabels = (state: DataStoreState) => state.sensorLabels;

export const setSensorLabels = (state: DataStoreState) => state.setSensorLabels;

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

export const deletedRoofId = (state: CommonStoreState) => state.deletedRoofId;

export const deletedRoofIdSet = (state: CommonStoreState) => state.deletedRoofIdSet;

export const autoDeletedRoofIdSet = (state: CommonStoreState) => state.autoDeletedRoofIdSet;

export const autoDeletedRoofs = (state: CommonStoreState) => state.autoDeletedRoofs;

export const autoDeletedChild = (state: CommonStoreState) => state.autoDeletedChild;

export const groupActionMode = (state: CommonStoreState) => state.groupActionMode;

export const groupActionUpdateFlag = (state: CommonStoreState) => state.groupActionUpdateFlag;

export const addedWindowId = (state: CommonStoreState) => state.addedWindowId;

export const addedDoorId = (state: CommonStoreState) => state.addedDoorId;

export const updateWallMapOnFoundationFlag = (state: CommonStoreState) => state.updateWallMapOnFoundationFlag;

export const wallActionScope = (state: CommonStoreState) => state.wallActionScope;

export const roofActionScope = (state: CommonStoreState) => state.roofActionScope;

export const windowActionScope = (state: CommonStoreState) => state.windowActionScope;

export const doorActionScope = (state: CommonStoreState) => state.doorActionScope;

export const setWallActionScope = (state: CommonStoreState) => state.setWallActionScope;

export const setRoofActionScope = (state: CommonStoreState) => state.setRoofActionScope;

export const setDoorActionScope = (state: CommonStoreState) => state.setDoorActionScope;

export const setWindowActionScope = (state: CommonStoreState) => state.setWindowActionScope;

export const updateWallLeftJointsById = (state: CommonStoreState) => state.updateWallLeftJointsById;

export const updateWallRightJointsById = (state: CommonStoreState) => state.updateWallRightJointsById;

export const updateWallLeftPointById = (state: CommonStoreState) => state.updateWallLeftPointById;

export const updateRoofRiseById = (state: CommonStoreState) => state.updateRoofRiseById;

export const updateRoofStructureById = (state: CommonStoreState) => state.updateRoofStructureById;

export * as solarPanelArrayLayoutParams from './solarPanelArrayLayoutParams';

export const economicsParams = (state: CommonStoreState) => state.economicsParams;

// genetic algorithms and particle swarm optimization

export const fittestIndividualResults = (state: CommonStoreState) => state.fittestIndividualResults;

export const setFittestIndividualResults = (state: CommonStoreState) => state.setFittestIndividualResults;

export const variableLabels = (state: CommonStoreState) => state.variableLabels;

export const setVariableLabels = (state: CommonStoreState) => state.setVariableLabels;

export const evolutionaryAlgorithmState = (state: CommonStoreState) => state.evolutionaryAlgorithmState;

export const solarPanelArrayLayoutConstraints = (state: CommonStoreState) => state.solarPanelArrayLayoutConstraints;

export const geneticAlgorithmWizardSelectedTab = (state: CommonStoreState) => state.geneticAlgorithmWizardSelectedTab;

export const particleSwarmOptimizationWizardSelectedTab = (state: CommonStoreState) =>
  state.particleSwarmOptimizationWizardSelectedTab;

export const countHeatmapCells = (state: CommonStoreState) => state.countHeatmapCells;

export const setPrimitiveStore = (state: PrimitiveStoreState) => state.setPrimitiveStore;

export * as viewState from './viewState';

export * as world from './world';
