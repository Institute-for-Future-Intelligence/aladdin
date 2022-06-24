/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { WallModel } from 'src/models/WallModel';
import { Undoable } from './Undoable';

export interface UndoableResizeBuildingXY extends Undoable {
  foundationId: string;
  oldFoundationPosition: number[];
  newFoundationPosition: number[];
  oldFoundationDimension: number[];
  newFoundationDimension: number[];
  oldChilds: Map<string, WallModel>;
  newChilds: Map<string, WallModel>;
}

export interface UndoableResizeBuildingZ extends Undoable {
  foundationId: string;
  oldChilds: Map<string, number>;
  newChilds: Map<string, number>;
}
