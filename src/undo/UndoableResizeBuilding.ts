/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';

export interface UndoableResizeBuildingXY extends Undoable {
  oldFoundationDataMap: Map<string, number[]>;
  newFoundationDataMap: Map<string, number[]>;
  oldWallPointsMap: Map<string, number[]>;
  newWallPointsMap: Map<string, number[]>;
}

export interface UndoableResizeBuildingZ extends Undoable {
  oldElementHeightMap: Map<string, number>;
  newElementHeightMap: Map<string, number>;
}
