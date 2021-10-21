/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { CommonStoreState } from '../common';

export const getElementById = (state: CommonStoreState) => state.getElementById;

export const getSelectedElement = (state: CommonStoreState) => state.getSelectedElement;

export const getInitialWallsID = (state: CommonStoreState) => state.getInitialWallsID;

export const set = (state: CommonStoreState) => state.set;

export const setElementPosition = (state: CommonStoreState) => state.setElementPosition;

export const setElementSize = (state: CommonStoreState) => state.setElementSize;

export const updateElementById = (state: CommonStoreState) => state.updateElementById;

export const deleteElementById = (state: CommonStoreState) => state.deleteElementById;

export const selectMe = (state: CommonStoreState) => state.selectMe;

export const addElement = (state: CommonStoreState) => state.addElement;

export const objectTypeToAdd = (state: CommonStoreState) => state.objectTypeToAdd;

export const deletedWallID = (state: CommonStoreState) => state.deletedWallID;

export const loadWeatherData = (state: CommonStoreState) => state.loadWeatherData;
export const getClosestCity = (state: CommonStoreState) => state.getClosestCity;
export const countElementsByType = (state: CommonStoreState) => state.countElementsByType;

export * as viewstate from './viewState';

export * as world from './world';
