/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { CommonStoreState } from '../common';

export const shadowEnabled = (state: CommonStoreState) => state.viewState.shadowEnabled;

export const groundImage = (state: CommonStoreState) => state.viewState.groundImage;

export const orthographic = (state: CommonStoreState) => state.viewState.orthographic;

export const enableRotate = (state: CommonStoreState) => state.viewState.enableRotate;

export const cameraPosition = (state: CommonStoreState) => state.viewState.cameraPosition;

export const cameraZoom = (state: CommonStoreState) => state.viewState.cameraZoom;
