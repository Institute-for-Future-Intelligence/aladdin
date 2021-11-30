/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { CommonStoreState } from '../common';

export const set = (state: CommonStoreState) => state.set;

export const user = (state: CommonStoreState) => state.user;

export const notes = (state: CommonStoreState) => state.notes;

export const elements = (state: CommonStoreState) => state.elements;

export const pvModules = (state: CommonStoreState) => state.pvModules;

export const loadPvModules = (state: CommonStoreState) => state.loadPvModules;

export const getPvModule = (state: CommonStoreState) => state.getPvModule;

export const enableOrbitController = (state: CommonStoreState) => state.enableOrbitController;

export const language = (state: CommonStoreState) => state.language;

export const locale = (state: CommonStoreState) => state.locale;

export const cloudFile = (state: CommonStoreState) => state.cloudFile;

export const updateCloudFileFlag = (state: CommonStoreState) => state.updateCloudFileFlag;

export const localFileName = (state: CommonStoreState) => state.localFileName;

export const openLocalFileFlag = (state: CommonStoreState) => state.openLocalFileFlag;

export const saveLocalFileFlag = (state: CommonStoreState) => state.saveLocalFileFlag;

export const saveLocalFileDialogVisible = (state: CommonStoreState) => state.saveLocalFileDialogVisible;

export const undoManager = (state: CommonStoreState) => state.undoManager;

export const addUndoable = (state: CommonStoreState) => state.addUndoable;

export const exportContent = (state: CommonStoreState) => state.exportContent;

export const clearContent = (state: CommonStoreState) => state.clearContent;

export const grid = (state: CommonStoreState) => state.grid;

export const aabb = (state: CommonStoreState) => state.aabb;

export const animateSun = (state: CommonStoreState) => state.animateSun;

export const updateSceneRadiusFlag = (state: CommonStoreState) => state.updateSceneRadiusFlag;

export const sceneRadius = (state: CommonStoreState) => state.sceneRadius;

export const setSceneRadius = (state: CommonStoreState) => state.setSceneRadius;

export const cameraDirection = (state: CommonStoreState) => state.cameraDirection;

export const getCameraDirection = (state: CommonStoreState) => state.getCameraDirection;

export const getElementById = (state: CommonStoreState) => state.getElementById;

export const getSelectedElement = (state: CommonStoreState) => state.getSelectedElement;

export const selectedSideIndex = (state: CommonStoreState) => state.selectedSideIndex;

export const getAllWallsIdOnFoundation = (state: CommonStoreState) => state.getAllWallsIdOnFoundation;

export const setElementPosition = (state: CommonStoreState) => state.setElementPosition;

export const setElementSize = (state: CommonStoreState) => state.setElementSize;

export const setElementNormal = (state: CommonStoreState) => state.setElementNormal;

export const updateElementLockById = (state: CommonStoreState) => state.updateElementLockById;

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

export const updateElementColorForAll = (state: CommonStoreState) => state.updateElementColorForAll;

export const updateElementRotationById = (state: CommonStoreState) => state.updateElementRotationById;

export const updateElementRotationForAll = (state: CommonStoreState) => state.updateElementRotationForAll;

export const foundationActionScope = (state: CommonStoreState) => state.foundationActionScope;

export const setFoundationActionScope = (state: CommonStoreState) => state.setFoundationActionScope;

export const updateFoundationTextureById = (state: CommonStoreState) => state.updateFoundationTextureById;

export const updateFoundationTextureForAll = (state: CommonStoreState) => state.updateFoundationTextureForAll;

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

export const updateSolarPanelRelativeAzimuthById = (state: CommonStoreState) =>
  state.updateSolarPanelRelativeAzimuthById;

export const updateSolarPanelRelativeAzimuthOnSurface = (state: CommonStoreState) =>
  state.updateSolarPanelRelativeAzimuthOnSurface;

export const updateSolarPanelRelativeAzimuthAboveFoundation = (state: CommonStoreState) =>
  state.updateSolarPanelRelativeAzimuthAboveFoundation;

export const updateSolarPanelRelativeAzimuthForAll = (state: CommonStoreState) =>
  state.updateSolarPanelRelativeAzimuthForAll;

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

export const updateSolarPanelPoleHeightById = (state: CommonStoreState) => state.updateSolarPanelPoleHeightById;

export const updateSolarPanelPoleHeightOnSurface = (state: CommonStoreState) =>
  state.updateSolarPanelPoleHeightOnSurface;

export const updateSolarPanelPoleHeightAboveFoundation = (state: CommonStoreState) =>
  state.updateSolarPanelPoleHeightAboveFoundation;

export const updateSolarPanelPoleHeightForAll = (state: CommonStoreState) => state.updateSolarPanelPoleHeightForAll;

export const updateSolarPanelPoleSpacingById = (state: CommonStoreState) => state.updateSolarPanelPoleSpacingById;

export const updateSolarPanelPoleSpacingOnSurface = (state: CommonStoreState) =>
  state.updateSolarPanelPoleSpacingOnSurface;

export const updateSolarPanelPoleSpacingAboveFoundation = (state: CommonStoreState) =>
  state.updateSolarPanelPoleSpacingAboveFoundation;

export const updateSolarPanelPoleSpacingForAll = (state: CommonStoreState) => state.updateSolarPanelPoleSpacingForAll;

export const updateSolarPanelDrawSunBeamById = (state: CommonStoreState) => state.updateSolarPanelDrawSunBeamById;

export const updateTreeTypeById = (state: CommonStoreState) => state.updateTreeTypeById;

export const updateTreeShowModelById = (state: CommonStoreState) => state.updateTreeShowModelById;

export const updateHumanNameById = (state: CommonStoreState) => state.updateHumanNameById;

export const copyElementById = (state: CommonStoreState) => state.copyElementById;

export const removeElementById = (state: CommonStoreState) => state.removeElementById;

export const removeElementsByType = (state: CommonStoreState) => state.removeElementsByType;

export const removeAllChildElementsByType = (state: CommonStoreState) => state.removeAllChildElementsByType;

export const pasteElementsToPoint = (state: CommonStoreState) => state.pasteElementsToPoint;

export const pasteElementsByKey = (state: CommonStoreState) => state.pasteElementsByKey;

export const elementsToPaste = (state: CommonStoreState) => state.elementsToPaste;

export const selectMe = (state: CommonStoreState) => state.selectMe;

export const selectNone = (state: CommonStoreState) => state.selectNone;

export const addElement = (state: CommonStoreState) => state.addElement;

export const objectTypeToAdd = (state: CommonStoreState) => state.objectTypeToAdd;

export const countElementsByType = (state: CommonStoreState) => state.countElementsByType;

export const countAllChildElementsByType = (state: CommonStoreState) => state.countAllChildElementsByType;

export const countAllChildSolarPanels = (state: CommonStoreState) => state.countAllChildSolarPanels;

export const selectedElementAngle = (state: CommonStoreState) => state.selectedElementAngle;

export const selectedElementHeight = (state: CommonStoreState) => state.selectedElementHeight;

export const orthographicChanged = (state: CommonStoreState) => state.orthographicChanged;

export const simulationInProgress = (state: CommonStoreState) => state.simulationInProgress;

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

export const sensorLabels = (state: CommonStoreState) => state.sensorLabels;

export const setSensorLabels = (state: CommonStoreState) => state.setSensorLabels;

export const dailyLightSensorData = (state: CommonStoreState) => state.dailyLightSensorData;

export const dailyLightSensorFlag = (state: CommonStoreState) => state.dailyLightSensorFlag;

export const setDailyLightSensorData = (state: CommonStoreState) => state.setDailyLightSensorData;

export const yearlyLightSensorData = (state: CommonStoreState) => state.yearlyLightSensorData;

export const yearlyLightSensorFlag = (state: CommonStoreState) => state.yearlyLightSensorFlag;

export const setYearlyLightSensorData = (state: CommonStoreState) => state.setYearlyLightSensorData;

// handles
export const moveHandleType = (state: CommonStoreState) => state.moveHandleType;

export const resizeHandleType = (state: CommonStoreState) => state.resizeHandleType;

export const getResizeHandlePosition = (state: CommonStoreState) => state.getResizeHandlePosition;

export const rotateHandleType = (state: CommonStoreState) => state.rotateHandleType;

export const resizeAnchor = (state: CommonStoreState) => state.resizeAnchor;

// wall and window
export const buildingWallID = (state: CommonStoreState) => state.buildingWallID;

export const deletedWallID = (state: CommonStoreState) => state.deletedWallID;

export const buildingWindowID = (state: CommonStoreState) => state.buildingWindowID;

export const deletedWindowID = (state: CommonStoreState) => state.deletedWindowID;

export const updateWallPointOnFoundation = (state: CommonStoreState) => state.updateWallPointOnFoundation;

export const wallActionScope = (state: CommonStoreState) => state.wallActionScope;

export const setWallActionScope = (state: CommonStoreState) => state.setWallActionScope;

export const updateWallRelativeAngleById = (state: CommonStoreState) => state.updateWallRelativeAngleById;

export const updateWallLeftOffsetById = (state: CommonStoreState) => state.updateWallLeftOffsetById;

export const updateWallRightOffsetById = (state: CommonStoreState) => state.updateWallRightOffsetById;

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

export * as viewState from './viewState';

export * as world from './world';
