/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { ElementModel } from '../models/ElementModel';

export interface UndoableAdd extends Undoable {
  addedElement: ElementModel;
}

export interface UndoableAddWall extends UndoableAdd {
  flippedWallSide: FlippedWallSide;
}

export enum FlippedWallSide {
  left = 'Left',
  right = 'Right',
  loop = 'Loop',
  null = 'Null',
}
