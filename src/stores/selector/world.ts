/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { CommonStoreState } from '../common';

export const latitude = (state: CommonStoreState) => state.world.latitude;

export const longitude = (state: CommonStoreState) => state.world.longitude;

export const orthographic = (state: CommonStoreState) => state.world.orthographic;

export const cameraPosition = (state: CommonStoreState) => state.world.cameraPosition;

export const cameraZoom = (state: CommonStoreState) => state.world.cameraZoom;
