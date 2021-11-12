/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { CommonStoreState } from '../common';

export const shadowEnabled = (state: CommonStoreState) => state.viewState.shadowEnabled;

export const axes = (state: CommonStoreState) => state.viewState.axes;

export const theme = (state: CommonStoreState) => state.viewState.theme;

export const autoRotate = (state: CommonStoreState) => state.viewState.autoRotate;

export const groundImage = (state: CommonStoreState) => state.viewState.groundImage;

export const groundColor = (state: CommonStoreState) => state.viewState.groundColor;

export const orthographic = (state: CommonStoreState) => state.viewState.orthographic;

export const enableRotate = (state: CommonStoreState) => state.viewState.enableRotate;

export const cameraPosition = (state: CommonStoreState) => state.viewState.cameraPosition;

export const panCenter = (state: CommonStoreState) => state.viewState.panCenter;

export const cameraZoom = (state: CommonStoreState) => state.viewState.cameraZoom;

export const heliodon = (state: CommonStoreState) => state.viewState.heliodon;

export const mapZoom = (state: CommonStoreState) => state.viewState.mapZoom;

export const mapPanelX = (state: CommonStoreState) => state.viewState.mapPanelX;

export const mapPanelY = (state: CommonStoreState) => state.viewState.mapPanelY;

export const mapWeatherStations = (state: CommonStoreState) => state.viewState.mapWeatherStations;

export const showInfoPanel = (state: CommonStoreState) => state.viewState.showInfoPanel;

export const showInstructionPanel = (state: CommonStoreState) => state.viewState.showInstructionPanel;

export const showMapPanel = (state: CommonStoreState) => state.viewState.showMapPanel;

export const showWeatherPanel = (state: CommonStoreState) => state.viewState.showWeatherPanel;

export const showStickyNotePanel = (state: CommonStoreState) => state.viewState.showStickyNotePanel;
