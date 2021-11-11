/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { ElementModel } from '../models/ElementModel';

export interface UndoableMove extends Undoable {
  oldX: number;
  oldY: number;
  oldZ: number;
  newX: number;
  newY: number;
  newZ: number;
  movedElement: ElementModel;
}
