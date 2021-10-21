/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { CommonStoreState } from '../common';

// world
export const latitude = (state: CommonStoreState) => state.world.latitude;

export const longitude = (state: CommonStoreState) => state.world.longitude;
