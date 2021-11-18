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

export const heliodonRadius = (state: CommonStoreState) => state.heliodonRadius;

export const setHeliodonRadius = (state: CommonStoreState) => state.setHeliodonRadius;

export const cameraDirection = (state: CommonStoreState) => state.cameraDirection;

export const getCameraDirection = (state: CommonStoreState) => state.getCameraDirection;

export const getElementById = (state: CommonStoreState) => state.getElementById;

export const getSelectedElement = (state: CommonStoreState) => state.getSelectedElement;

export const getInitialWallsID = (state: CommonStoreState) => state.getInitialWallsID;

export const setElementPosition = (state: CommonStoreState) => state.setElementPosition;

export const setElementRotation = (state: CommonStoreState) => state.setElementRotation;

export const setElementSize = (state: CommonStoreState) => state.setElementSize;

export const setElementNormal = (state: CommonStoreState) => state.setElementNormal;

// TODO: this needs to be replaced with direct update soon because we need to
//  remove [key: string]: any; in ElementModel
export const updateElementById = (state: CommonStoreState) => state.updateElementById;

export const updateElementLabelById = (state: CommonStoreState) => state.updateElementLabelById;

export const updateElementShowLabelById = (state: CommonStoreState) => state.updateElementShowLabelById;

export const updateElementLxById = (state: CommonStoreState) => state.updateElementLxById;

export const updateElementLyById = (state: CommonStoreState) => state.updateElementLyById;

export const solarPanelActionScope = (state: CommonStoreState) => state.solarPanelActionScope;

export const setSolarPanelActionScope = (state: CommonStoreState) => state.setSolarPanelActionScope;

export const updateSolarPanelModelById = (state: CommonStoreState) => state.updateSolarPanelModelById;

export const updateSolarPanelModelOnSurface = (state: CommonStoreState) => state.updateSolarPanelModelOnSurface;

export const updateSolarPanelModelAboveFoundation = (state: CommonStoreState) =>
  state.updateSolarPanelModelAboveFoundation;

export const updateSolarPanelModelForAll = (state: CommonStoreState) => state.updateSolarPanelModelForAll;

export const updateSolarPanelOrientationById = (state: CommonStoreState) => state.updateSolarPanelOrientationById;

export const updateSolarPanelPoleHeightById = (state: CommonStoreState) => state.updateSolarPanelPoleHeightById;

export const updateSolarPanelPoleSpacingById = (state: CommonStoreState) => state.updateSolarPanelPoleSpacingById;

export const updateSolarPanelRelativeAzimuthById = (state: CommonStoreState) =>
  state.updateSolarPanelRelativeAzimuthById;

export const updateSolarPanelTiltAngleById = (state: CommonStoreState) => state.updateSolarPanelTiltAngleById;

export const updateSolarPanelTrackerTypeById = (state: CommonStoreState) => state.updateSolarPanelTrackerTypeById;

export const updateSolarPanelDrawSunBeamById = (state: CommonStoreState) => state.updateSolarPanelDrawSunBeamById;

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

export const deletedWallID = (state: CommonStoreState) => state.deletedWallID;

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

export const buildingWallID = (state: CommonStoreState) => state.buildingWallID;

export * as viewState from './viewState';

export * as world from './world';
