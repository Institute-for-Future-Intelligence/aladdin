/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { ElementModel } from '../models/ElementModel';

export interface UndoableAdd extends Undoable {
  addedElement: ElementModel;
}

export interface UndoableAddWall extends UndoableAdd {
  leftWallOffset: number;
  rightWallOffset: number;
}
